// src/app/api/alpha-stream/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

type Quote = {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
  market?: string;
};

type CacheWrapper = { ts: number; data: Quote[] };

const CACHE_KEY = (m: string) => `alpha:market:${m}`;

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL!;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const redis =
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN })
    : null;

/* ---------- simulación determinista (coherente en todo el front) ---------- */
function smallHash(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function xorshift32(seed: number) {
  let x = seed >>> 0;
  return function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
}

function simulatePrices(
  wrapper: CacheWrapper,
  opts?: { maxPctPerMinute?: number; bucketMs?: number }
): Quote[] {
  const maxPctPerMinute = opts?.maxPctPerMinute ?? 0.25;
  const bucketMs = opts?.bucketMs ?? 1000;
  const now = Date.now();
  const elapsedMs = Math.max(0, now - wrapper.ts);
  const elapsedMinutes = elapsedMs / 60000;
  const maxTotalPct = elapsedMinutes * maxPctPerMinute;
  const cappedMaxPct = Math.min(maxTotalPct, Math.max(1, 3 * maxPctPerMinute));
  const bucketIndex = Math.floor(now / bucketMs);

  return (wrapper.data || []).map((q) => {
    if (typeof q.price !== "number" || Number.isNaN(q.price)) return { ...q };
    const seed = (smallHash(q.symbol + "::sim") ^ bucketIndex) >>> 0;
    const rand = xorshift32(seed)();
    const signed = rand * 2 - 1;
    const deltaFraction = signed * (cappedMaxPct / 100);
    const newPrice = q.price * (1 + deltaFraction);
    const prev = typeof q.previousClose === "number" ? q.previousClose : q.price;
    const change = newPrice - prev;
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

    return {
      ...q,
      price: Number(newPrice.toFixed(6)),
      change: Number(change.toFixed(6)),
      changePercent: Number(changePercent.toFixed(6)),
    };
  });
}

async function getBaseWrapper(market: string): Promise<CacheWrapper | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get<CacheWrapper | string>(CACHE_KEY(market));
    if (!raw) return null;
    const parsed = typeof raw === "string" ? (JSON.parse(raw) as CacheWrapper) : raw;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.ts !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const market = (searchParams.get("market") || "indices").toLowerCase();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (line: string) => controller.enqueue(encoder.encode(line));
      const send = (obj: unknown) => write(`data: ${JSON.stringify(obj)}\n\n`);

      // (1) encabezado SSE opcional
      write(`retry: 5000\n`); // hint de reconexión para EventSource
      write(`event: ready\n`);
      write(`data: "ok"\n\n`);

      // (2) heartbeat cada 10s (mantiene la conexión viva en proxies estrictos)
      const heartbeat = setInterval(() => {
        write(`: ping ${Date.now()}\n\n`);
      }, 10000);

      let lastPrices: Record<string, number> = {};
      let lastForcedAt = 0;

      // (3) first snapshot inmediato (si existe en Redis)
      try {
        const wrapper = await getBaseWrapper(market);
        if (wrapper) {
          const simulated = simulatePrices(wrapper, { maxPctPerMinute: 0.25, bucketMs: 1000 });
          const prices: Record<string, number> = {};
          for (const q of simulated) {
            if (q?.symbol && typeof q.price === "number") {
              prices[q.symbol.toUpperCase()] = q.price;
            }
          }
          lastPrices = prices;
          lastForcedAt = Date.now();
          send({ prices });
        } else {
          // informa ausencia de base (útil para debug)
          send({ prices: {}, note: "no-base-wrapper" });
        }
      } catch (e) {
        // no rompas el stream por errores puntuales
        send({ prices: {}, error: "initial_read_failed" });
      }

      // (4) loop cada 1s
      const tick = setInterval(async () => {
        try {
          const wrapper = await getBaseWrapper(market);
          if (!wrapper) return;

          const simulated = simulatePrices(wrapper, { maxPctPerMinute: 0.25, bucketMs: 1000 });
          const prices: Record<string, number> = {};
          for (const q of simulated) {
            if (q?.symbol && typeof q.price === "number") {
              prices[q.symbol.toUpperCase()] = q.price;
            }
          }

          // ¿cambió algo?
          const changed =
            Object.keys(prices).length !== Object.keys(lastPrices).length ||
            Object.keys(prices).some((k) => prices[k] !== lastPrices[k]);

          const now = Date.now();
          const forceDue = now - lastForcedAt >= 10000; // fuerza envío cada 10s aunque no cambie

          if (changed || forceDue) {
            lastPrices = prices;
            lastForcedAt = now;
            send({ prices });
          }
        } catch {
          // sigue, el heartbeat mantiene la conexión
        }
      }, 1000);

      // (5) cleanup al cerrar cliente
      const onAbort = () => {
        clearInterval(tick);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      };
      if (req.signal.aborted) onAbort();
      req.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      // "Transfer-Encoding": "chunked", // innecesario en Node, pero no daña
    },
  });
}
