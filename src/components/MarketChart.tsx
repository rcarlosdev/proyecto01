"use client";

import { useEffect, useState } from "react";
import {
  Chart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  Pane,
} from "lightweight-charts-react-components";

type Quote = {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
};

export default function MarketChart({
  market = "acciones",
  symbol,
  type = "candlestick",
}: {
  market?: string;
  symbol?: string;
  type?: "candlestick" | "line";
}) {
  const [data, setData] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/markets?market=${market}`);
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (err) {
        console.error("Error fetching market data:", err);
        if (!mounted) return;
        setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [market]);

  if (loading) return <p className="text-gray-400">Cargando datos...</p>;
  if (!data || data.length === 0) return <p>No hay datos disponibles</p>;

  const filtered = symbol
    ? data.filter((q) => q.symbol.toUpperCase() === symbol.toUpperCase())
    : data;

  // convertimos a formato OHLC para candlestick
  const ohlc = filtered.map((q) => ({
    time: q.latestTradingDay ?? new Date().toISOString(),
    open: q.previousClose ?? q.price,
    high: q.high ?? q.price,
    low: q.low ?? q.price,
    close: q.price,
  }));

  // serie de valores simples para line chart
  const lineData = filtered.map((q) => ({ time: q.latestTradingDay ?? new Date().toISOString(), value: q.price }));

  return (
    <div className="w-full h-[420px] bg-neutral-900 rounded-xl p-3">
      <Chart
        options={{
          layout: { background: { color: "#0b1220" }, textColor: "#cbd5e1" },
          grid: { vertLines: { color: "#071021" }, horzLines: { color: "#071021" } },
          timeScale: { timeVisible: true },
        }}
      >
        {/* Si quieres velas + volumen en dos panes: */}
        {type === "candlestick" ? (
          <>
            <Pane stretchFactor={3}>
              <CandlestickSeries data={ohlc} />
            </Pane>

            {/* Volume pane (mocked with price differences as example) */}
            <Pane>
              <HistogramSeries
                // la librería acepta data con {time, value, color?}
                data={ohlc.map((c) => ({ time: c.time, value: Math.abs(Number((c.close - c.open).toFixed(2))) }))}
              />
            </Pane>
          </>
        ) : (
          <Pane>
            <LineSeries data={lineData} />
          </Pane>
        )}
      </Chart>
    </div>
  );
}
