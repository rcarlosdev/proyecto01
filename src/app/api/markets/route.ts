// app/api/market-data/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

type Quote = {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
  market?: string; // mercado solicitado
};

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_TTL_SEC = 60; // TTL en segundos para Redis (ajusta si quieres 30, 120, etc)
const CACHE_TTL_MS = CACHE_TTL_SEC * 1000;

// Mapa de símbolos por "mercado". Ajusta según tus necesidades.
const SYMBOLS_MAP: Record<string, string[]> = {
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'IVV', 'SPLG', 'VOO', 'SPX'], // ETFs representativos de índices
  acciones: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'FB', 'NFLX'], // ejemplo acciones
  commodities: ['GLD', 'USO', 'SLV', 'PALL', 'DBO', 'GDX'], // ETFs para oro/petróleo
  crypto: ['BTC', 'ETH', 'LTC', 'XRP', 'DOGE', 'USDT'], // cripto: usaremos DIGITAL_CURRENCY endpoints
  fx: ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'NZDUSD'] // forex pares: usaremos CURRENCY_EXCHANGE_RATE
};

// Fallback memory cache para desarrollo (o si Upstash no está configurado)
const memoryCache = new Map<string, { ts: number; data: Quote[] }>();

// Inicializa cliente Upstash si las variables de entorno están presentes
let redis: Redis | null = null;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
    // no await aquí; la instancia está lista para usarse
  } catch (e) {
    console.warn('Upstash init failed, falling back to memory cache', e);
    redis = null;
  }
}

/* ------------------------------ Helpers ------------------------------ */

async function getCache(key: string): Promise<Quote[] | null> {
  if (redis) {
    try {
      const val = await redis.get(key);
      if (!val) return null;
      // Upstash may return string or parsed value; ensure we return parsed array
      if (typeof val === 'string') {
        try { return JSON.parse(val) as Quote[]; } catch { return null; }
      }
      return val as Quote[];
    } catch (err) {
      console.warn('Redis get error, falling back to memory cache', err);
      // fallback to memory cache below
    }
  }

  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return cached.data;
}

async function setCache(key: string, data: Quote[], ttlSec = CACHE_TTL_SEC): Promise<void> {
  if (redis) {
    try {
      // Guardamos stringify para evitar problemas de serialización
      await redis.set(key, JSON.stringify(data), { ex: ttlSec });
      return;
    } catch (err) {
      console.warn('Redis set error, falling back to memory cache', err);
      // continue to memory cache fallback
    }
  }

  memoryCache.set(key, { ts: Date.now(), data });
}

/* ------------------------------ Fetchers ------------------------------ */

async function fetchGlobalQuote(symbol: string) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const q = json['Global Quote'];
  if (!q) return null;
  const price = parseFloat(q['05. price'] ?? '0');
  const prev = parseFloat(q['08. previous close'] ?? '0');
  const high = parseFloat(q['03. high'] ?? '0');
  const low = parseFloat(q['04. low'] ?? '0');
  const change = parseFloat(q['09. change'] ?? (price - prev).toString());
  const changePercent = parseFloat((q['10. change percent'] ?? '0%').replace('%', ''));
  return {
    symbol: q['01. symbol'] ?? symbol,
    price, high, low, previousClose: prev,
    change, changePercent,
    latestTradingDay: q['07. latest trading day'] ?? ''
  } as Quote;
}

async function fetchCryptoQuote(symbol: string, market = 'USD') {
  // Alpha Vantage expects the symbol as e.g. BTC and market like USD
  const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${encodeURIComponent(symbol)}&market=${market}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const series = json['Time Series (Digital Currency Daily)'];
  if (!series) return null;
  const latestKey = Object.keys(series)[0];
  const latest = series[latestKey];
  const price = parseFloat(latest['4a. close (USD)'] ?? '0');
  const high = parseFloat(latest['2a. high (USD)'] ?? '0');
  const low = parseFloat(latest['3a. low (USD)'] ?? '0');
  return {
    symbol,
    price,
    high,
    low,
    latestTradingDay: latestKey
  } as Quote;
}

async function fetchFxQuote(pair: string) {
  // pair espera 'EURUSD' -> separamos a EUR y USD
  const from = pair.slice(0, 3);
  const to = pair.slice(3);
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const data = json['Realtime Currency Exchange Rate'];
  if (!data) return null;
  const price = parseFloat(data['5. Exchange Rate'] ?? '0');
  const timestamp = data['6. Last Refreshed'] ?? '';
  return {
    symbol: pair,
    price,
    latestTradingDay: timestamp
  } as Quote;
}

/* ------------------------------ Handler ------------------------------ */

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'ALPHA_VANTAGE_API_KEY not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const market = (url.searchParams.get('market') || 'indices').toLowerCase(); // default
  const cacheKey = `market-${market}`;

  // 1) Try cache (Upstash or memory)
  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }
  } catch (err) {
    console.warn('Cache read error (ignored):', err);
    // continue to fetch fresh
  }

  // 2) Build list of symbols to fetch
  const symbols = market === 'all'
    ? Array.from(new Set(Object.values(SYMBOLS_MAP).flat())) // unique
    : (SYMBOLS_MAP[market] ?? SYMBOLS_MAP['indices']);

  try {
    // NOTE: Alpha Vantage free tier ≈ 5 req/min.
    // If you fetch >5 symbols at once you can exceed rate limits.
    // Consider batching, staggering requests, or using a background worker to refresh cache.
    const results = await Promise.all(symbols.map(async (sym) => {
      if (market === 'crypto') {
        return await fetchCryptoQuote(sym, 'USD');
      }
      if (market === 'fx') {
        return await fetchFxQuote(sym);
      }
      // global quote for indices/acciones/commodities
      return await fetchGlobalQuote(sym);
    }));

    const data = results.filter(Boolean) as Quote[];

    // 3) Store in cache (Upstash or memory)
    try {
      await setCache(cacheKey, data, CACHE_TTL_SEC);
    } catch (err) {
      console.warn('Cache set error (ignored):', err);
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': `public, s-maxage=${CACHE_TTL_SEC}` }
    });
  } catch (err: unknown) {
    console.error('market-data error', err);
    return NextResponse.json({ error: 'Fetch failed', details: String(err) }, { status: 500 });
  }
}
