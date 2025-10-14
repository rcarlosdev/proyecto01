// src/app/api/markets/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { MOCK_BASE } from '@/lib/mockData';

type Quote = {
  symbol?: string;
  name?: string;
  price?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
  market?: string;
  url?: string;
};

/* ---------------------- Config ---------------------- */
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_TTL_SEC = 300; // 5 minutos
const CACHE_TTL_MS = CACHE_TTL_SEC * 1000; // ms para cálculos

/* ---------------------- Símbolos por mercado ---------------------- */
const SYMBOLS_MAP: Record<string, string[]> = {
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'IVV', 'SPLG', 'VOO'],
  acciones: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'FB', 'NFLX'],
  commodities: ['GLD', 'USO', 'SLV', 'PALL', 'DBO', 'GDX'],
  crypto: ['BTC', 'ETH', 'LTC', 'XRP', 'DOGE', 'USDT'],
  fx: ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'NZDUSD'],
};

/* ---------------------- Upstash Redis init + memory fallback ---------------------- */
let redis: Redis | null = null;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  } catch (e) {
    console.warn('Upstash init failed, falling back to memory cache', e);
    redis = null;
  }
}

const memoryCache = new Map<string, { ts: number; data: Quote[] }>();
const inflightRequests = new Map<string, Promise<Quote[]>>();

/* ---------------------- Cache wrapper helpers ---------------------- */
type CacheWrapper = { ts: number; data: Quote[] };

async function getCacheWithMeta(key: string): Promise<CacheWrapper | null> {
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.data)) return null;
      return parsed as CacheWrapper;
    } catch (err) {
      console.warn('Redis get error (meta):', err);
    }
  }
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return { ts: cached.ts, data: cached.data };
}

async function setCacheWithMeta(key: string, data: Quote[], ttlSec = CACHE_TTL_SEC): Promise<void> {
  const wrapper: CacheWrapper = { ts: Date.now(), data };
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(wrapper), { ex: ttlSec });
      return;
    } catch (err) {
      console.warn('Redis set error (meta):', err);
    }
  }
  memoryCache.set(key, { ts: wrapper.ts, data: wrapper.data });
}

/* ---------------------- Helper para fetch seguro ---------------------- */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ---------------------- Mock dinámico ---------------------- */
function varyValue(price: number, pctRange = 0.5) {
  const factor = 1 + (Math.random() * 2 - 1) * (pctRange / 100);
  return Number((price * factor).toFixed(6));
}

function getDynamicMock(market: string, symbols?: string[]): Quote[] {
  // market puede venir en cualquier casing; normalizamos a lowercase para buscar en MOCK_BASE
  const keyLower = market.toLowerCase();
  const base = (MOCK_BASE as Record<string, Quote[]>)[market] ?? (MOCK_BASE as Record<string, Quote[]>)[keyLower] ?? [];

  if (symbols && symbols.length > 0) {
    // mapBase debe usar la misma clave normalizada
    const mapBase = (MOCK_BASE as Record<string, Quote[]>)[market] ?? (MOCK_BASE as Record<string, Quote[]>)[keyLower] ?? [];
    return symbols.map(sym => {
      const found = mapBase.find(mb => mb.symbol?.toUpperCase() === sym.toUpperCase());
      if (found) {
        const newPrice = varyValue(found.price ?? 100, 0.8);
        const change = Number(((newPrice - (found.previousClose ?? newPrice)) ?? 0).toFixed(6));
        const changePercent = found.previousClose ? Number(((change / (found.previousClose ?? 1)) * 100).toFixed(6)) : 0;
        return { ...found, price: newPrice, change, changePercent, latestTradingDay: new Date().toISOString() };
      }
      const price = varyValue(100, 1.5);
      return { symbol: sym, price, high: price * 1.01, low: price * 0.99, previousClose: price * 0.998, change: price * 0.002, changePercent: 0.2, latestTradingDay: new Date().toISOString() };
    });
  }

  // Si base está vacío devolvemos un mock generado a partir de una lista vacía (seguir devolviendo array)
  return (base as Quote[]).map(b => {
    const newPrice = varyValue(b.price ?? 100, 0.8);
    const change = Number(((newPrice - (b.previousClose ?? newPrice)) ?? 0).toFixed(6));
    const changePercent = (b.previousClose ?? newPrice) ? Number(((change / (b.previousClose ?? newPrice)) * 100).toFixed(6)) : 0;
    return { ...b, price: newPrice, change, changePercent, latestTradingDay: new Date().toISOString() };
  });
}

/* ---------------------- API Investing.com interna ---------------------- */
// const MARKETS: Record<string, { buttons: string[], getUrl: (sub: string) => string }> = {
//   Indices: { buttons: ["Majors","Indices Futures","Americas","Europe","Asia/Pacific","Middle East","Africa"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/assets/sml/placeholder` },
//   Stocks: { buttons: ["Trending Stocks","Most Active","Top Gainers","Top Losers"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/homepage/placeholder` },
//   Commodities: { buttons: ["Real Time Futures","Metals","Grains","Softs","Energy","Meats"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/assets/list/placeholder` },
//   Currencies: { buttons: ["Majors","Local"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/homepage/major-currencies?limit=10` },
//   ETFs: { buttons: ["Major ETFs","Most Active","Top Gainers","Equities","Bonds","Commodities","Currencies"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/assets/fundsByDomain/majorEtfs?limit=10` },
//   Bonds: { buttons: ["Majors"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/assets/pairsByScreen/6?limit=10` },
//   Funds: { buttons: ["Majors","Equities","Commodities","Bonds"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/assets/fundsByDomain/major?limit=10` },
//   Cryptocurrency: { buttons: ["Majors","Top Gainers","Top Losers","Stocks","ETFs"], getUrl: (sub:string) => `https://api.investing.com/api/financialdata/homepage/major-cryptocurrencies?limit=10` },
// };
const MARKETS = {
  Indices: {
    buttons: [
      "Majors",
      "Indices Futures",
      "Americas",
      "Europe",
      "Asia/Pacific",
      "Middle East",
      "Africa",
    ],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/assets/sml/74?fields-list=name%2Clast%2Chigh%2Clow%2CchangeOneDay%2CchangeOneDayPercent%2Ctime%2CisOpen%2Cflag%2Curl%2ClastPairDecimal%2CchangeDecimalPrecision%2CchangePercentageDecimalPrecision%2Csymbol&country-id=5&limit=10",
  },
  Stocks: {
    buttons: [
      "Trending Stocks",
      "Most Active",
      "Top Gainers",
      "Top Losers",
      "52 Week High",
      "52 Week Low",
      "Dow Jones",
      "S&P 500",
      "Nasdaq",
    ],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/homepage/trending-stocks?country=5&filter-domain=www&limit=10",
  },
  Commodities: {
    buttons: ["Real Time Futures", "Metals", "Grains", "Softs", "Energy", "Meats"],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/assets/list/8830%2C8836%2C8849%2C8831%2C8833%2C8862%2C8988%2C8916%2C8917%2C954867?fields-list=name%2Cmonth%2Clast%2Chigh%2Clow%2CchangeOneDay%2CchangeOneDayPercent%2Ctime%2CisOpen%2Cflag%2Curl%2ClastPairDecimal%2CchangeDecimalPrecision%2CchangePercentageDecimalPrecision%2Csymbol&country-id=5&limit=10",
  },
  Currencies: {
    buttons: ["Majors", "Local"],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/homepage/major-currencies?limit=10",
  },
  ETFs: {
    buttons: [
      "Major ETFs",
      "Most Active",
      "Top Gainers",
      "Equities",
      "Bonds",
      "Commodities",
      "Currencies",
    ],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/assets/fundsByDomain/majorEtfs?fields-list=name%2Clast%2Chigh%2Clow%2CchangeOneDay%2CchangeOneDayPercent%2CvolumeOneDay%2Ctime%2CisOpen%2Cflag%2Curl%2ClastPairDecimal%2CchangeDecimalPrecision%2CchangePercentageDecimalPrecision%2Csymbol&country-id=5&limit=10",
  },
  Bonds: {
    buttons: ["Majors"],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/assets/pairsByScreen/6?fields-list=name%2Cyield%2Cprev%2Chigh%2Clow%2CchangeOneDay%2CchangeOneDayPercent%2Ctime%2CisOpen%2Cflag%2Curl%2ClastPairDecimal%2CchangeDecimalPrecision%2CchangePercentageDecimalPrecision%2Csymbol%2Clast&country-id=5&limit=10",
  },
  Funds: {
    buttons: ["Majors", "Equities", "Commodities", "Bonds"],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/assets/fundsByDomain/major?fields-list=name%2Csymbol%2Clast%2CchangeOneDay%2CchangeOneDayPercent%2Ctime%2CisOpen%2Cflag%2Curl%2ClastPairDecimal%2CchangeDecimalPrecision%2CchangePercentageDecimalPrecision%2Csymbol&country-id=5&limit=10",
  },
  Cryptocurrency: {
    buttons: ["Majors", "Top Gainers", "Top Losers", "Stocks", "ETFs"],
    getUrl: () =>
      "https://api.investing.com/api/financialdata/homepage/major-cryptocurrencies?limit=10",
  },
};

/* ---------------------- Fetch Investing.com (corregido) ---------------------- */
async function fetchInvestingMarket(marketKey: string, sub: string): Promise<Quote[]> {
  // marketKey -> debe ser exactamente una key de MARKETS (ej. "Indices", "Stocks", ...)
  try {
    const marketDef = MARKETS[marketKey];
    if (!marketDef) {
      // mercado no soportado: retornar mock por seguridad
      return getDynamicMock(marketKey.toLowerCase());
    }

    const url = marketDef.getUrl(sub);
    // Si la URL contiene 'placeholder' devolvemos mock (evita llamadas inválidas)
    if (!url || url.includes('placeholder')) {
      return getDynamicMock(marketKey.toLowerCase());
    }

    // Intentar fetch real
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json, text/plain, */*",
      },
      // no-store para evitar cache del fetch externo; tu cache interno lo maneja arriba
      cache: "no-store",
      // timeout no disponible por defecto en fetch de node, capturamos por try/catch
    });

    if (!res.ok) {
      console.warn(`Investing fetch returned ${res.status} for ${url}`);
      return getDynamicMock(marketKey.toLowerCase());
    }

    const payload = await safeJson(res);
    // Algunos endpoints usan { data: [...] }, otros devuelven directamente [...]; cubrir ambos
    const maybeArray = payload?.data ?? payload ?? [];
    if (Array.isArray(maybeArray) && maybeArray.length > 0) {
      return maybeArray as Quote[];
    }

    // Si el payload no trae array, fallback a mock
    return getDynamicMock(marketKey.toLowerCase());
  } catch (err) {
    console.error("Error fetching Investing data (fetchInvestingMarket):", err);
    return getDynamicMock(marketKey.toLowerCase());
  }
}

/* ---------------------- Handler final ---------------------- */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawMarket = url.searchParams.get('market') || 'indices';
  const sub = url.searchParams.get('sub') || '';

  // Normalizar y resolver la key de MARKETS (p. ej. "indices" -> "Indices")
  const marketKey =
    Object.keys(MARKETS).find(k => k.toLowerCase() === rawMarket.toLowerCase())
    || rawMarket; // si no está en MARKETS, dejamos lo que venga (se manejará más abajo)

  // Para cache y para mocks usamos una clave consistente en minúsculas
  const cacheKey = `market-${marketKey.toString().toLowerCase()}-${sub}`;

  // 1) Try cache
  const wrapper = await getCacheWithMeta(cacheKey);
  if (wrapper) {
    return NextResponse.json(wrapper.data, { status: 200 });
  }

  // 2) Fetch según tipo
  let data: Quote[] = [];
  let usedMock = false;

  try {
    // Si marketKey existe en MARKETS, usamos fetchInvestingMarket con la key correcta
    if (MARKETS[marketKey]) {
      data = await fetchInvestingMarket(marketKey, sub);
      usedMock = true;
    } else {
      // alternativa: intentar mapear rawMarket a un set de símbolos (si tienes ese fallback)
      // si fetchSymbolsForMarketWithFallback no existe o falla, fallback a mock
      if (typeof fetchSymbolsForMarketWithFallback === 'function') {
        const res = await fetchSymbolsForMarketWithFallback(rawMarket.toLowerCase());
        data = res.data;
        usedMock = res.usedMock ?? false;
      } else {
        data = getDynamicMock(rawMarket.toLowerCase());
        usedMock = true;
      }
    }

    await setCacheWithMeta(cacheKey, data, CACHE_TTL_SEC);
  } catch (err) {
    console.error('Fetch error, fallback to dynamic mock', err);
    data = getDynamicMock(rawMarket.toLowerCase());
    await setCacheWithMeta(cacheKey, data, CACHE_TTL_SEC);
    usedMock = true;
  }

  return NextResponse.json(data, { status: 200 });
}

