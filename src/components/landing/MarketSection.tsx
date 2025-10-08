"use client";

import { useState } from "react";
import useCachedFetch from "@/hooks/useCachedFetch";
import DataTableMarket from "@/components/market/DataTableMarket";

// 🔹 Mapeo de headers visibles
export const HEADERS: Record<string, string[]> = {
  Indices: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Time"],
  Stocks: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Vol.", "Time"],
  Commodities: ["Name", "Month", "Last", "High", "Low", "Chg.", "Chg. %", "Time"],
  Currencies: ["Name", "Bid", "Ask", "High", "Low", "Chg.", "Chg. %", "Time"],
  ETFs: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Vol.", "Time"],
  Bonds: ["Name", "Yield", "Prev.", "High", "Low", "Chg.", "Chg. %", "Time"],
  Funds: ["Name", "Symbol", "Last", "Chg.", "Chg. %", "Time"],
  Cryptocurrency: ["Name", "Last", "Chg.", "Chg. %", "Vol.", "Time"],
};

// 🔹 Mapeo de keys exactas en data
export const KEYS: Record<string, string[]> = {
  Indices: ["name", "last", "high", "low", "chg", "chgPct", "time"],
  Stocks: ["name", "last", "high", "low", "chg", "chgPct", "volume", "time"],
  Commodities: ["name", "month", "last", "high", "low", "chg", "chgPct", "time"],
  Currencies: ["name", "bid", "ask", "high", "low", "chg", "chgPct", "time"],
  ETFs: ["name", "last", "high", "low", "chg", "chgPct", "volume", "time"],
  Bonds: ["name", "yield", "prev", "high", "low", "chg", "chgPct", "time"],
  Funds: ["name", "symbol", "last", "chg", "chgPct", "time"],
  Cryptocurrency: ["name", "last", "chg", "chgPct", "volume", "time"],
};

// 🔹 Función universal para mapear item API → fila
export const renderRow = (item: any) => ({
  name: item.Name ?? item.PairName ?? item.Symbol ?? "-",
  last: item.Last ?? item.Ask ?? item.Bid ?? "-",
  high: item.High ?? "-",
  low: item.Low ?? "-",
  chg: item.Chg ?? item.Change ?? 0,
  chgPct: item.ChgPct ?? 0,
  volume: Number(item.Volume ?? item.VolumeOneDay ?? 0), // ✅ ahora siempre existe
  month: item.Month ?? "-",
  yield: item.Yield ?? "-",
  prev: item.Prev ?? "-",
  time: item.Time ?? "",
  symbol: item.Symbol ?? "",
  url: item.Url ?? "",
});

type MarketSectionProps = {
  title: string;
  buttons: string[];
  getUrl: (sub: string) => string;
  renderRow: (raw: any) => Record<string, any>;
};

export default function MarketSection({ title, buttons, getUrl, renderRow }: MarketSectionProps) {
  const [active, setActive] = useState<string>(buttons[0]);
  const url = getUrl(active);

  const { data, loading, error } = useCachedFetch(url, { revalidateOnFocus: false });

  const rows = (data?.data ?? []).map((item: any) => renderRow(item));
  console.log("🚀 rows mapeadas:", rows);
  return (
    <section>
      {/* Botones internos */}
      <div className="flex flex-wrap gap-2 mb-4">
        {buttons.map((b) => (
          <button
            key={b}
            onClick={() => setActive(b)}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              b === active
                ? "bg-[var(--amarillo-principal)] text-black"
                : "bg-muted/20 hover:bg-muted/40"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Tabla dinámica */}
      <div>
        <DataTableMarket
          rows={rows}
          market={title}
          subMarket={active}
          loading={loading}
          error={error}
        />
      </div>
    </section>
  );
}
