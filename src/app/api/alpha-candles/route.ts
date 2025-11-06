import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

/* ---------------------- Tipos ---------------------- */
type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/* ---------------------- Configuración ---------------------- */
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const CACHE_TTL = 60 * 5; // 5 minutos
const HIST_WINDOW = 60;   // velas por bloque histórico

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
  return !!(obj["Note"] || obj["Error Message"] || Object.keys(obj).length === 0);
}

function dateToUTCTimestampInput(value: string | number): number {
  // acepta numero (segundos) o string ISO o "YYYY-MM-DD hh:mm:ss"
  if (typeof value === "number") return Math.floor(value);
  if (/^\d+$/.test(value)) return Math.floor(Number(value)); // segundos en string
  const s = value.replace(" ", "T");
  const d = new Date(s);
  return Math.floor(d.getTime() / 1000);
}

function removeDuplicatesAndSort(candles: Candle[]): Candle[] {
  const map = new Map<number, Candle>();
  for (const c of candles) map.set(c.time, c);
  return Array.from(map.values()).sort((a, b) => a.time - b.time);
}

/* ---------------------- Cache helpers (tolerante) ---------------------- */
async function getCachedData(
  symbol: string,
  interval: string,
  historical: string | null,
  direction?: string | null,
  referenceTime?: string | null
): Promise<Candle[] | null> {
  try {
    const cacheKey = `alpha:${symbol}:${interval}:${historical}:${direction}:${referenceTime}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      // console.log("✅ Sirviendo datos desde caché Redis ->", cacheKey);
      if (typeof cached === "string") {
        try { return JSON.parse(cached) as Candle[]; } catch (e) {
          // si no es JSON válido, devolver como objeto si ya es array
        }
      }
      if (Array.isArray(cached)) return cached as Candle[];
      // si viene un objeto con .value o similar, intenta usarlo
      if ((cached as any).value && Array.isArray((cached as any).value)) return (cached as any).value as Candle[];
      console.warn("⚠️ Cached value con formato inesperado:", typeof cached);
    }
    return null;
  } catch (error) {
    console.error("Error accediendo a Redis:", error);
    return null;
  }
}

async function setCachedData(
  symbol: string,
  interval: string,
  historical: string | null,
  direction: string | null,
  referenceTime: string | null,
  data: Candle[]
): Promise<void> {
  try {
    const cacheKey = `alpha:${symbol}:${interval}:${historical}:${direction}:${referenceTime}`;
    // Guardamos string para evitar ambigüedad
    await redis.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL });
    // console.log("💾 Datos guardados en caché Redis ->", cacheKey);
  } catch (error) {
    console.error("Error guardando en Redis:", error);
  }
}

/* ---------------------- Alpha Vantage fetch ---------------------- */
async function fetchFromAlpha(symbol: string, interval: string, outputsize: "compact" | "full" = "compact"): Promise<Candle[]> {
  const endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`;
  const res = await fetch(endpoint, { cache: "no-store" });
  const json = await safeJson(res);
  if (!res.ok || !json || isRateLimitOrError(json)) throw new Error("Rate limit or invalid data");
  const seriesKey = `Time Series (${interval})`;
  const series = (json as any)[seriesKey];
  if (!series) throw new Error("No series found from Alpha");
  const candles: Candle[] = Object.entries(series).map(([time, v]: any) => {
    // time format from Alpha: "2025-11-05 15:30:00"
    const t = time.replace(" ", "T");
    return {
      time: Math.floor(new Date(t + "Z").getTime() / 1000),
      open: parseFloat(v["1. open"]),
      high: parseFloat(v["2. high"]),
      low: parseFloat(v["3. low"]),
      close: parseFloat(v["4. close"]),
      volume: parseFloat(v["5. volume"]),
    };
  });
  return removeDuplicatesAndSort(candles);
}

async function fetchHistoricalData(
  symbol: string,
  interval: string,
  direction: "forward" | "backward",
  referenceTime: string
): Promise<Candle[]> {
  try {
    // console.log(`📅 Cargando datos ${direction} para ${symbol} desde ${referenceTime}`);

    const endpoint = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&outputsize=full&apikey=${API_KEY!}`;

    const res = await fetch(endpoint, { cache: "no-store" });
    const json = await safeJson(res);

    if (!res.ok || !json || isRateLimitOrError(json)) {
      throw new Error("Rate limit or invalid data in historical fetch");
    }

    const seriesKey = `Time Series (${interval})`;
    const series = json[seriesKey];
    if (!series) throw new Error("No series found in historical data");

    const allCandles = Object.entries(series as Record<string, Record<string, string>>)
      .map(([time, v]) => {
        const date = new Date(time.replace(" ", "T") + "Z");
        return {
          time: dateToUTCTimestampInput(date.toISOString()),
          open: parseFloat(v["1. open"]),
          high: parseFloat(v["2. high"]),
          low: parseFloat(v["3. low"]),
          close: parseFloat(v["4. close"]),
          volume: parseFloat(v["5. volume"]),
        };
      });

    const uniqueCandles = removeDuplicatesAndSort(allCandles);

    // 🧠 Soportar timestamps en segundos (epoch)
    const referenceTimestamp =
      /^\d+$/.test(referenceTime)
        ? parseInt(referenceTime, 10)
        : dateToUTCTimestampInput(referenceTime);

    let filtered: Candle[] = [];

    if (direction === "backward") {
      filtered = uniqueCandles.filter(c => c.time < referenceTimestamp);
      if (filtered.length === 0) {
        console.warn("⚠️ No hay datos previos al timestamp, devolviendo primeras velas disponibles.");
        filtered = uniqueCandles.slice(0, 30);
      } else {
        filtered = filtered.slice(-30);
      }
    } else {
      filtered = uniqueCandles.filter(c => c.time > referenceTimestamp);
      if (filtered.length === 0) {
        console.warn("⚠️ No hay datos posteriores al timestamp, devolviendo últimas velas disponibles.");
        filtered = uniqueCandles.slice(-30);
      } else {
        filtered = filtered.slice(0, 30);
      }
    }

    return filtered;
  } catch (error) {
    console.error("Error en fetchHistoricalData:", error);
    return [];
  }
}


/* ---------------------- Handler principal ---------------------- */
export async function GET(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ALPHA_VANTAGE_API_KEY no configurada" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "AAPL").toUpperCase();
  const interval = searchParams.get("interval") || "5min";
  const direction = searchParams.get("direction") || null;
  const referenceTime = searchParams.get("referenceTime") || null;
  const historical = searchParams.get("historical") || null;

  // console.log("📡 /api/alpha-candles request:", { symbol, interval, direction, referenceTime, historical });

  try {
    // 1 - intentar cache con key completa
    const cached = await getCachedData(symbol, interval, historical, direction, referenceTime);
    if (cached) {
      // console.log("   -> returned from cache count=", cached.length);
      return NextResponse.json(cached, { status: 200 });
    }

    let data: Candle[] = [];

    if (historical === "true" && direction && referenceTime) {
      data = await fetchHistoricalData(symbol, interval, direction as any, referenceTime);
      // console.log("   -> fetched historical count=", data.length);
    } else {
      data = await fetchFromAlpha(symbol, interval, "compact");
      // console.log("   -> fetched base count=", data.length);
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No se encontraron datos" }, { status: 404 });
    }

    const final = removeDuplicatesAndSort(data);
    await setCachedData(symbol, interval, historical, direction, referenceTime, final);

    // console.log("   -> returning final count=", final.length);
    return NextResponse.json(final, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error al obtener datos desde Alpha Vantage:", err?.message ?? err);
    if (String(err?.message || "").toLowerCase().includes("rate limit")) {
      return NextResponse.json({ error: "Límite de API de Alpha Vantage alcanzado." }, { status: 429 });
    }
    return NextResponse.json({ error: "Error al obtener datos desde API" }, { status: 500 });
  }
}
