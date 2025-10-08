"use client";

import { useEffect, useMemo, useState } from "react";
import { HEADERS, KEYS } from "@/components/landing/MarketSection";

type RowShape = Record<string, any>;

type DataTableMarketProps = {
  rows: RowShape[];
  market: string;
  subMarket?: string;
  lastUpdated?: number;
  loading?: boolean;
  error?: string | null;
};

export default function DataTableMarket({
  rows,
  market,
  subMarket,
  lastUpdated,
  loading,
  error,
}: DataTableMarketProps) {
  const [search, setSearch] = useState("");

  const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 60_000);
        return () => clearInterval(id);
    }, []);

    const filtered = useMemo(() => {
    if (!search) return rows;
    const term = search.toLowerCase();

    return rows.filter((row) =>
        Object.values(row).some((value) =>
        value !== undefined &&
        value !== null &&
        value.toString().toLowerCase().includes(term)
        )
    );
    }, [rows, search]);

  const headers = HEADERS[market] || [];
  const keys = KEYS[market] || [];

  function fmt(n?: number, digits = 2) {
    if (n === undefined || n === null || Number.isNaN(n)) return "-";
    return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function fmtDate(time?: string) {
    if (!time) return "-";
    const ts = Number(time) * 1000; 
    const date = new Date(ts);
    if (isNaN(date.getTime())) return time;
    return date.toLocaleTimeString();
  }

  function fmtVolume(n?: number | string): string {
    const num = Number(n);
    if (isNaN(num) || num <= 0) return "-";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  }

  return (
    <div className="p-4 min-h-[200px]">
      {/* Buscador + última actualización */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-200"
            aria-label="Buscar"
            type="search"
          />
          <div className="ml-auto text-xs text-yellow-300">
            {lastUpdated
              ? `Última actualización: ${new Date(lastUpdated).toLocaleTimeString()}`
              : "Sin datos aún"}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-black rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full table-auto text-gray-200">
          <thead className="bg-gray-900/60 text-yellow-200">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-sm whitespace-nowrap ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-800">
                  {headers.map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-gray-400">
                  No hay resultados
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                console.log(row) || <></>,
                <tr
                  key={i}
                  className="border-t border-gray-800 hover:bg-gray-900/60 transition-colors"
                >
                  {keys.map((key, j) => {
                    let value: any = row[key] ?? "-";
                    let className = "px-4 py-3 text-sm";

                    if (j === 0) className += " font-semibold text-yellow-300 text-left";
                    else className += " text-right";

                    // Cambios Chg / ChgPct
                    if (key.toLowerCase() === "chg" || key.toLowerCase() === "chgpct") {
                      const positive = Number(row[key] ?? 0) >= 0;
                      const arrow = positive ? "▲" : "▼";
                      const colorClass = positive ? "text-green-400 font-medium" : "text-red-400 font-medium";
                      className = `px-4 py-3 text-sm text-right ${colorClass}`;
                      if (key.toLowerCase() === "chgpct") {
                        value = (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-xs opacity-80">{arrow}</span>
                            {fmt(row[key])}%
                          </span>
                        );
                      } else {
                        value = fmt(row[key]);
                      }
                    }

                    // Volumen
                    if (key.toLowerCase() === "volume") value = fmtVolume(row[key]);

                    // Tiempo
                    if (key.toLowerCase() === "time") value = fmtDate(row[key]);

                    // Otros valores numéricos
                    if (typeof value === "number" && key.toLowerCase() !== "chg" && key.toLowerCase() !== "chgpct")
                      value = fmt(value);

                    return (
                      <td key={key} className={className}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Mostrando: <span className="text-yellow-300 font-medium">{market}</span>
          {subMarket ? ` / ${subMarket}` : ""} · {filtered.length} elementos
        </div>
        <div className="text-xs text-gray-500">Datos aproximados mientras cache activo</div>
      </div>
    </div>
  );
}
