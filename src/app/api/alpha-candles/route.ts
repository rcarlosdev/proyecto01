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
