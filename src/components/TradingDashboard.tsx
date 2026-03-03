// src/components/TradingDashboard.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMarketStore } from "@/stores/useMarketStore";
import { MARKETS } from "@/lib/markets";

const TradingDashboardDesktop = dynamic(
  () => import("./trading-dashboard/TradingDashboardDesktop"),
  { ssr: false }
);

const TradingDashboardMobile = dynamic(
  () => import("./trading-dashboard/mobile/TradingDashboardMobile"),
  { ssr: false }
);

type Market = (typeof MARKETS)[number] | "indices" | "all";

export default function TradingDashboard() {
  const [isMobile, setIsMobile] = useState(false);

  // 📱 + 🔍 Detección combinada (ancho + zoom)
  useEffect(() => {
    const checkViewport = () => {
      const isZoomed = window.devicePixelRatio >= 1.5; // ~150% o más
      const isSmallWidth = window.innerWidth <= 850;   // móvil / tablet

      setIsMobile(isZoomed || isSmallWidth);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const {
    selectedMarket,
    fetchMarket,
    startMarketStream,
    stopMarketStream,
    cleanup,
  } = useMarketStore();

  /** 🧹 Cleanup al desmontar */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /** 🔁 Polling REST: delega completamente al store */
  useEffect(() => {
    const marketToFetch: Market =
      !selectedMarket || selectedMarket === "all"
        ? "indices"
        : selectedMarket;

    // Primera carga inmediata
    fetchMarket(marketToFetch);

    // Polling cada 20 segundos
    const intervalId = setInterval(() => {
      fetchMarket(marketToFetch);
    }, 20_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedMarket, fetchMarket]);

  /** 🔴 SSE: arranca el stream 2s después de cambiar de mercado */
  useEffect(() => {
    const marketToStream: Market =
      !selectedMarket || selectedMarket === "all"
        ? "indices"
        : selectedMarket;

    if (!marketToStream) return;

    const timeoutId = setTimeout(() => {
      startMarketStream(marketToStream);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      stopMarketStream();
    };
  }, [selectedMarket, startMarketStream, stopMarketStream]);

  return (
    <div className="w-full h-full">
      {isMobile ? <TradingDashboardMobile /> : <TradingDashboardDesktop />}
    </div>
  );
}
