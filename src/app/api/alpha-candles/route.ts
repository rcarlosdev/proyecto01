import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Tipos
type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

// Configuración general
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_TTL_SEC = 300; // 5 min
const CACHE_TTL_MS = CACHE_TTL_SEC * 1000;

// Redis + fallback en memoria
let redis: Redis | null = null;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
  } catch (err) {
    console.warn("⚠️ No se pudo inicializar Redis, usando cache en memoria", err);
  }
}

const memoryCache = new Map<string, { ts: number; data: Candle[] }>();

/* ---------------------- Utilidades de cache ---------------------- */
async function getCache(key: string): Promise<Candle[] | null> {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        // Si ya es objeto, úsalo directamente
        const parsed =
          typeof cached === "string" ? JSON.parse(cached) : cached;

        if (Date.now() - parsed.ts < CACHE_TTL_MS) return parsed.data;
      }
    } catch (err) {
      console.warn("Redis get error:", err);
    }
  }

  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.data;
  return null;
}

async function setCache(key: string, data: Candle[]): Promise<void> {
  const wrapper = { ts: Date.now(), data };

  if (redis) {
    try {
      await redis.set(key, wrapper, { ex: CACHE_TTL_SEC });
      return;
    } catch (err) {
      console.warn("Redis set error:", err);
    }
  }

  memoryCache.set(key, wrapper);
}

/* ---------------------- Fetch seguro + validación ---------------------- */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// function isRateLimitOrError(json: any): is json
// function isRateLimitOrError(json: any): boolean {
function isRateLimitOrError(json: unknown): boolean {
  if (!json || typeof json !== "object") return true;
  if ("Note" in (json as object)) return true;
  if ("Error Message" in (json as object)) return true;
  if (Object.keys(json).length === 0) return true;
  return false;
}

/* ---------------------- Mock dinámico ---------------------- */
function generateMockCandles(count = 100, base = 100): Candle[] {
  const candles: Candle[] = [];
  let price = base;
  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.random() - 0.5) * 2; // ±1%
    price = open + open * (change / 100);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);
    candles.push({
      time: new Date(Date.now() - (count - i) * 60000).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(1000 + Math.random() * 500),
    });
  }
  return candles;
}

/* ---------------------- Alpha Vantage fetch ---------------------- */
async function fetchCandles(symbol: string, interval = "60min"): Promise<Candle[]> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=compact&apikey=${API_KEY}`;
  const res = await fetch(url);
  const json = await safeJson(res);
  if (!res.ok || !json || isRateLimitOrError(json)) throw new Error("Rate limit or invalid data");

  const series = json[`Time Series (${interval})`];
  if (!series) throw new Error("No series found");

  const candles = Object.entries(series)
  .map(([time, v]) => {
    const data = v as Record<string, string>;
    const timestamp = Math.floor(new Date(time.replace(" ", "T") + "Z").getTime() / 1000);
    return {
      time: timestamp.toString(),
      open: parseFloat(data["1. open"]),
      high: parseFloat(data["2. high"]),
      low: parseFloat(data["3. low"]),
      close: parseFloat(data["4. close"]),
      volume: parseFloat(data["5. volume"]),
    };
  })
  .reverse();
  // return candles as Candle[];
  return candles as unknown as Candle[];
}

/* ---------------------- Simulación ligera (mantiene vivo el gráfico) ---------------------- */
function simulateCandles(candles: Candle[]): Candle[] {
  return candles.map((c) => {
    const delta = (Math.random() - 0.5) * 0.001; // ±0.1%
    const newClose = c.close * (1 + delta);
    return {
      ...c,
      close: Number(newClose.toFixed(4)),
      high: Math.max(c.high, newClose),
      low: Math.min(c.low, newClose),
    };
  });
}

/* ---------------------- Handler principal ---------------------- */
export async function GET(req: Request) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "ALPHA_VANTAGE_API_KEY no configurada" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "AAPL").toUpperCase();
  const interval = searchParams.get("interval") || "60min";
  const cacheKey = `candles-${symbol}-${interval}`;

  // 1️⃣ Intenta cache
  const cached = await getCache(cacheKey);
  if (cached) {
    const simulated = simulateCandles(cached);
    return NextResponse.json(simulated, { status: 200 });
  }

  // 2️⃣ Fetch real con fallback a mock
  try {
    const data = await fetchCandles(symbol, interval);
    await setCache(cacheKey, data);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.warn(`⚠️ Alpha Vantage falló para ${symbol}, usando mock`, err);
    const mock = generateMockCandles(100, 150);
    await setCache(cacheKey, mock);
    return NextResponse.json(mock, { status: 200 });
  }
}
