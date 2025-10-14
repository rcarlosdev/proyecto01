// src/components/landing/MarketSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useCachedFetch from "@/hooks/useCachedFetch";
import DataTableMarket from "@/components/market/DataTableMarket";
import { MARKETS } from "@/config/markets";

function formatNumber(num: any, decimals = 2) {
    if (num === undefined || num === null) return "-";
    
    // Si es string, quitar comas
    let n: number;
    if (typeof num === "string") {
      n = Number(num.replace(/,/g, ""));
    } else {
      n = Number(num);
    }
    if (isNaN(n)) return "-";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: n % 1 !== 0 ? decimals : 0,
      maximumFractionDigits: decimals,
    }).format(n);
  };

export default function MarketSection() {
  // const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Usa valores iniciales constantes para evitar diferencia SSR/cliente
  const [market, setMarket] = useState("Indices");
  const [subMarket, setSubMarket] = useState(MARKETS["Indices"].buttons[0]);

  // ✅ Sincroniza solo después del montaje (ya en cliente)
  useEffect(() => {
      const marketParam = searchParams.get("market");
    const subParam = searchParams.get("sub");

    if (marketParam && MARKETS[marketParam]) {
      setMarket(marketParam);
      // ✅ Evita error si el subParam no pertenece al nuevo market
      const validSub = MARKETS[marketParam].buttons.includes(subParam || "")
        ? subParam
        : MARKETS[marketParam].buttons[0];
      setSubMarket(validSub);
    }
  }, [searchParams]);

  const apiUrl = useMemo(() => {
    const base = `/api/markets?market=${market}&from=landing`;
    return subMarket ? `${base}&sub=${encodeURIComponent(subMarket)}` : base;
  }, [market, subMarket]);

  // Fetch data con hook cacheado
  const { data, loading, error, lastUpdated } = useCachedFetch(
    apiUrl,
    [market, subMarket]
  );

  // Formateo de filas
const rows = useMemo(() => {
  if (!data || !Array.isArray(data)) return [];

  return data.map((item: any) => {
    // Normalizamos keys a minúsculas
    const normalized: Record<string, any> = {};
    Object.entries(item).forEach(([k, v]) => {
      normalized[k.toLowerCase()] = v;
    });
    return {
      name: normalized.name || normalized.pairname || normalized.symbol || "-",
      last: normalized.last != null ? formatNumber(normalized.last) : "-",
      chg: normalized.chg != null ? formatNumber(normalized.chg) : "-",
      chgPct: normalized.chgpct != null ? formatNumber(normalized.chgpct) : "-",
      high: normalized.high != null ? formatNumber(normalized.high) : "-",
      low: normalized.low != null ? formatNumber(normalized.low) : "-",
      month : normalized.month || "-",
      bid: normalized.bid != null ? formatNumber(normalized.bid) : "-",
      ask: normalized.ask != null ? formatNumber(normalized.ask) : "-",
      yield: normalized.yield != null ? formatNumber(normalized.yield, 3) : "-",
      prev: normalized.prev != null ? formatNumber(normalized.prev) : "-",
      symbol: normalized.symbol || "-",
      volume: normalized.volume != null ? normalized.volume : "-",
      time: normalized.time != null ? normalized.time : "-",
    };
  });
}, [data]);




  // Handlers de botones sin recargar
const handleMarketClick = (newMarket: string) => {
  const firstSub = MARKETS[newMarket].buttons[0];
  setMarket(newMarket);
  setSubMarket(firstSub);

  // Actualiza solo la URL sin recargar nada
  const params = new URLSearchParams({ market: newMarket, from: "landing" });
  window.history.pushState({}, "", `?${params.toString()}`);
};

const handleSubClick = (sub: string) => {
  setSubMarket(sub);

  const params = new URLSearchParams({ market, sub, from: "landing" });
  window.history.pushState({}, "", `?${params.toString()}`);
};

  return (
    <section className="px-4 md:px-12 py-8">
      {/* Botones principales */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(MARKETS).map((m) => (
          <button
            key={m}
            onClick={() => handleMarketClick(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              market === m
                ? "bg-yellow-400 text-black"
                : "bg-gray-800 text-yellow-300 hover:bg-gray-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Botones secundarios */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MARKETS[market]?.buttons.map((sub) => (
          <button
            key={sub}
            onClick={() => handleSubClick(sub)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              subMarket === sub
                ? "bg-yellow-400 text-black"
                : "bg-gray-800 text-yellow-300 hover:bg-gray-700"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Tabla de datos */}
      <DataTableMarket
        rows={rows}
        market={market}
        subMarket={subMarket}
        lastUpdated={lastUpdated}
        loading={loading}
        error={error}
      />
    </section>
  );
}
