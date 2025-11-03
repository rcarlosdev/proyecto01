// import { NextResponse } from "next/server";
// import { Redis } from "@upstash/redis";

// /* ---------------------- Tipos ---------------------- */
// type Candle = {
//   time: number; // UNIX timestamp (segundos)
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume?: number;
// };

// /* ---------------------- Configuración ---------------------- */
// const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
// const CACHE_TTL_SEC = 300; // 5 min
// const CACHE_TTL_MS = CACHE_TTL_SEC * 1000;

// // Redis o fallback en memoria
// let redis: Redis | null = null;
// const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
// const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// if (redisUrl && redisToken) {
//   try {
//     redis = new Redis({ url: redisUrl, token: redisToken });
//   } catch (err) {
//     console.warn("⚠️ No se pudo inicializar Redis, usando cache en memoria", err);
//   }
// }

// const memoryCache = new Map<string, { ts: number; data: Candle[] }>();

// /* ---------------------- Utilidades de cache ---------------------- */
// async function getCache(key: string): Promise<Candle[] | null> {
//   if (redis) {
//     try {
//       const cached = await redis.get(key);
//       if (cached) {
//         const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
//         if (Date.now() - parsed.ts < CACHE_TTL_MS) return parsed.data;
//       }
//     } catch (err) {
//       console.warn("Redis get error:", err);
//     }
//   }

//   const mem = memoryCache.get(key);
//   if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.data;
//   return null;
// }

// async function setCache(key: string, data: Candle[]): Promise<void> {
//   const wrapper = { ts: Date.now(), data };
//   if (redis) {
//     try {
//       await redis.set(key, wrapper, { ex: CACHE_TTL_SEC });
//       return;
//     } catch (err) {
//       console.warn("Redis set error:", err);
//     }
//   }
//   memoryCache.set(key, wrapper);
// }

// /* ---------------------- Fetch seguro + validación ---------------------- */
// async function safeJson(res: Response) {
//   try {
//     return await res.json();
//   } catch {
//     return null;
//   }
// }

// function isRateLimitOrError(json: unknown): boolean {
//   if (!json || typeof json !== "object") return true;
//   const obj = json as Record<string, unknown>;
//   if (obj["Note"] || obj["Error Message"]) return true;
//   if (Object.keys(obj).length === 0) return true;
//   return false;
// }

// /* ---------------------- Mock dinámico ---------------------- */
// function generateMockCandles(count = 100, base = 100): Candle[] {
//   const candles: Candle[] = [];
//   let price = base;
//   const now = Date.now();

//   for (let i = 0; i < count; i++) {
//     const open = price;
//     const change = (Math.random() - 0.5) * 2; // ±1%
//     price = open + open * (change / 100);
//     const close = price;
//     const high = Math.max(open, close) * (1 + Math.random() * 0.002);
//     const low = Math.min(open, close) * (1 - Math.random() * 0.002);
//     const time = Math.floor((now - (count - i) * 60000) / 1000);

//     candles.push({
//       time,
//       open,
//       high,
//       low,
//       close,
//       volume: Math.floor(1000 + Math.random() * 500),
//     });
//   }

//   return candles;
// }

// /* ---------------------- Alpha Vantage fetch ---------------------- */
// async function fetchCandles(symbol: string, interval = "5min"): Promise<Candle[]> {

//   // let additionalParams = "";
//   // if (before) {
//   //   additionalParams += `&before=${encodeURIComponent(before)}`;
//   // }

//   // https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&outputsize=full&apikey=UZN709EJLXNK9BQ5
//   const endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${API_KEY!}`;
//   const res = await fetch(endpoint, { cache: "no-store" });
//   const json = await safeJson(res);

//   if (!res.ok || !json || isRateLimitOrError(json))
//     throw new Error("Rate limit or invalid data");

//   const series =
//     json[`Time Series (${interval})`] ||
//     json["Time Series (Daily)"] ||
//     json["Time Series (60min)"];

//   if (!series) throw new Error("No series found");

//   const candles = Object.entries(series as Record<string, Record<string, string>>)
//     .map(([time, v]) => {
//       const timestamp = Math.floor(new Date(time.replace(" ", "T") + "Z").getTime() / 1000);
//       return {
//         time: timestamp,
//         open: parseFloat(v["1. open"]),
//         high: parseFloat(v["2. high"]),
//         low: parseFloat(v["3. low"]),
//         close: parseFloat(v["4. close"]),
//         volume: parseFloat(v["5. volume"]),
//       };
//     })
//     .reverse();

//   console.log(`✅ Fetched ${candles.length} candles for ${symbol} (${interval})`);
//   return candles;
// }

// /* ---------------------- Simulación ligera ---------------------- */
// function simulateCandles(candles: Candle[]): Candle[] {
//   return candles.map((c) => {
//     const delta = (Math.random() - 0.5) * 0.001;
//     const newClose = c.close * (1 + delta);
//     return {
//       ...c,
//       close: Number(newClose.toFixed(4)),
//       high: Math.max(c.high, newClose),
//       low: Math.min(c.low, newClose),
//     };
//   });
// }

// /* ---------------------- Handler principal ---------------------- */
// export async function GET(req: Request) {
//   if (!API_KEY) {
//     return NextResponse.json(
//       { error: "ALPHA_VANTAGE_API_KEY no configurada" },
//       { status: 500 }
//     );
//   }

//   const { searchParams } = new URL(req.url);
//   const symbol = (searchParams.get("symbol") || "AAPL").toUpperCase();
//   const interval = searchParams.get("interval") || "60min";
//   const before = searchParams.get("before") || null;

//   const cacheKey = `candles-${symbol}-${interval}`;

//   // 1️⃣ Intenta cache
//   const cached = await getCache(cacheKey);
//   if (cached) {
//     const simulated = simulateCandles(cached);
//     return NextResponse.json(simulated, { status: 200 });
//   }

//   // 2️⃣ Fetch real con fallback a mock
//   try {
//     const data = await fetchCandles(symbol, interval, before);
//     await setCache(cacheKey, data);
//     return NextResponse.json(data, { status: 200 });
//   } catch (err) {
//     console.warn(`⚠️ Alpha Vantage falló para ${symbol}, usando mock`, err);
//     const mock = generateMockCandles(100, 150);
//     await setCache(cacheKey, mock);
//     return NextResponse.json(mock, { status: 200 });
//   }
// }


import { NextResponse } from "next/server";

/* ---------------------- Tipos ---------------------- */
type Candle = {
  time: number; // UNIX timestamp (segundos)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/* ---------------------- Configuración ---------------------- */
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

/* ---------------------- Utilidades ---------------------- */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isRateLimitOrError(json: unknown): boolean {
  if (!json || typeof json !== "object") return true;
  const obj = json as Record<string, unknown>;
  if (obj["Note"] || obj["Error Message"]) return true;
  if (Object.keys(obj).length === 0) return true;
  return false;
}

/* ---------------------- Alpha Vantage fetch ---------------------- */
async function fetchCandles(symbol: string, interval = "1min"): Promise<Candle[]> {
  const endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${API_KEY!}`;
  const res = await fetch(endpoint, { cache: "no-store" });
  const json = await safeJson(res);

  if (!res.ok || !json || isRateLimitOrError(json))
    throw new Error("Rate limit or invalid data");

  const series =
    json[`Time Series (${interval})`] ||
    json["Time Series (Daily)"] ||
    json["Time Series (60min)"];

  if (!series) throw new Error("No series found");

  const candles = Object.entries(series as Record<string, Record<string, string>>)
    .map(([time, v]) => {
      const timestamp = Math.floor(new Date(time.replace(" ", "T") + "Z").getTime() / 1000);
      return {
        time: timestamp,
        open: parseFloat(v["1. open"]),
        high: parseFloat(v["2. high"]),
        low: parseFloat(v["3. low"]),
        close: parseFloat(v["4. close"]),
        volume: parseFloat(v["5. volume"]),
      };
    })
    .reverse();

  console.log(`✅ Fetched ${candles.length} candles for ${symbol} (${interval})`);
  return candles;
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

  try {
    const data = await fetchCandles(symbol, interval);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ Error al obtener datos desde Alpha Vantage:", err);
    return NextResponse.json({ error: "Error al obtener datos desde API" }, { status: 500 });
  }
}
