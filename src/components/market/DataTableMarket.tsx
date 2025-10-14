// src/components/market/DataTableMarket.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { HEADERS, KEYS } from "@/config/markets";

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

  const filtered = useMemo(() => {
    if (!search) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some(
        (v) => v !== undefined && v !== null && v.toString().toLowerCase().includes(term)
      )
    );
  }, [rows, search]);
  
  const headers = HEADERS[market] || [];
  const keys = Object.keys(KEYS).find(k => k.toLowerCase() === market.toLowerCase()) ? KEYS[Object.keys(KEYS).find(k => k.toLowerCase() === market.toLowerCase())!] : [];
  
  return (
    <div className="p-4 min-h-[200px]">
      {/* Buscador */}
      <div className="mb-4 flex flex-col gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-200"
          aria-label="Buscar"
          type="search"
        />
      </div>

      {/* Tabla */}
      <div className="bg-black rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full table-auto text-gray-200">
          <thead className="bg-gray-900/60 text-yellow-200">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-sm whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-6 text-center text-gray-400">
                  No hay resultados
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/60 transition-colors">
                  {keys.map((key, j) => {
                    let value: any = row[key] ?? "-";
                    let className = "px-4 py-3 text-sm";
                    if (j === 0) className += " font-semibold text-yellow-300 text-left";
                    else className += " text-right";

                    if (key.toLowerCase() === "chg" || key.toLowerCase() === "chgpct") {
                      const num = Number(row[key]?.toString().replace(/,/g, "") ?? 0);

                      if (num === 0) {
                        // Valor cero: solo negrilla sin color ni flecha
                        className = "px-4 py-3 text-sm font-semibold text-right";
                        value = key.toLowerCase() === "chgpct" ? `${num.toFixed(2)}%` : num.toFixed(2);
                      } else {
                        // Valor positivo o negativo: flecha y color
                        const positive = num > 0;
                        const arrow = positive ? "▲" : "▼";
                        const colorClass = positive ? "text-green-400 font-medium" : "text-red-400 font-medium";
                        className = `px-4 py-3 text-sm text-right ${colorClass}`;

                        value = (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-xs opacity-80">{arrow}</span>
                            {num.toFixed(2)}
                            {key.toLowerCase() === "chgpct" ? "%" : ""}
                          </span>
                        );
                      }
                    }




                    if (key.toLowerCase() === "volume") value = formatVolume(row[key]);
                    // if (key.toLowerCase() === "time") value = formatDate(row[key]);
                    if (key.toLowerCase() === "time") value = formatTime(row[key], 3740);

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
    </div>
  );
}

// 🔹 Helpers
function formatVolume(n?: number | string, decimals = 2): string {
  const num = Number(n);
  if (isNaN(num) || num <= 0) return "-";

  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(decimals) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(decimals) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(decimals) + "K";
  return num.toString();
}

function formatDate(time?: string) {
  if (!time) return "-";
  const ts = Number(time) * 1000;
  const date = new Date(ts);
  if (isNaN(date.getTime())) return time;
  return date.toLocaleTimeString();
}

function formatTime(time?: string | number, offsetSeconds = 0): string {
  if (!time) return "-";

  const ts = Number(time) * 1000;
  const date = new Date(ts + offsetSeconds * 1000);
  if (isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
 
