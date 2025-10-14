"use client";

import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export function CandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#0f172a" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: 1 },
      timeScale: { borderColor: "#1e293b" },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData([
      { time: "2025-10-08", open: 152.3, high: 153.2, low: 151.7, close: 152.8 },
      { time: "2025-10-09", open: 152.8, high: 153.5, low: 152.2, close: 153.0 },
      { time: "2025-10-10", open: 153.0, high: 153.3, low: 152.5, close: 152.7 },
    ]);

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
}
