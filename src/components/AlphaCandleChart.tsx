"use client";

import { useEffect, useState } from "react";
// import dayjs from "dayjs";
import {
  Chart,
  CandlestickSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components";
import type { CandlestickData } from "lightweight-charts";

interface ApiCandle {
  time: number; // timestamp UNIX (de tu API)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export default function AlphaCandleChart({
  symbol = "AAPL",
  interval = "60min",
}: {
  symbol?: string;
  interval?: string;
}) {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/alpha-candles?symbol=${symbol}&interval=${interval}`);
        const json: ApiCandle[] = await res.json();

        if (!active) return;

        // 🔁 Convertir timestamps UNIX → "YYYY-MM-DD"
        // const parsed: CandlestickData[] = json.map((c) => ({
        //   time: dayjs.unix(c.time).format("YYYY-MM-DD"),
        //   open: c.open,
        //   high: c.high,
        //   low: c.low,
        //   close: c.close,
        // }));

        setData(json as CandlestickData[]);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 60_000); // cada minuto

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [symbol, interval]);

  if (loading) return <p className="text-gray-400">Cargando datos...</p>;
  if (!data.length) return <p>No hay datos disponibles</p>;

  return (
    <div className="w-full flex justify-center bg-neutral-900 rounded-xl p-3">
      <Chart
        options={{
          width: 800,
          height: 400,
          layout: {
            background: { color: "#0b1220" },
            textColor: "#e2e8f0",
          },
          grid: {
            vertLines: { color: "#1e293b" },
            horzLines: { color: "#1e293b" },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: "#334155",
          },
        }}
      >
        <CandlestickSeries data={data} />
        <TimeScale>
          <TimeScaleFitContentTrigger deps={[data]} />
        </TimeScale>
      </Chart>
    </div>
  );
}
