// // src/components/landing/DataTable.tsx
// "use client";

// import React from "react";

// type RowShape = {
//   name: string;
//   last: number | string;
//   high?: number | string;
//   low?: number | string;
//   chg?: number | string;
//   chgPct?: number | string;
//   time?: string;
//   url?: string;
// };

// const HEADERS: Record<string, string[]> = {
//   Indices: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Time"],
//   Stocks: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Vol.", "Time"],
//   Commodities: ["Name", "Month", "Last", "High", "Low", "Chg.", "Chg. %", "Time"],
//   Currencies: ["Name", "Bid", "Ask", "High", "Low", "Chg.", "Chg. %", "Time"],
//   ETFs: ["Name", "Last", "High", "Low", "Chg.", "Chg. %", "Vol.", "Time"],
//   Bonds: ["Name", "Yield", "Prev.", "High", "Low", "Chg.", "Chg. %", "Time"],
//   Funds: ["Name", "Symbol", "Last", "Chg.", "Chg. %", "Time"],
//   Cryptocurrency: ["Name", "Last", "Chg.", "Chg. %", "Vol.", "Time"],
// };

// export default function DataTable({ rows, market }: { rows: RowShape[]; market: string }) {
//   const headers = HEADERS[market] ?? HEADERS["Indices"];

//   return (
//     <div className="overflow-x-auto border rounded">
//       <table className="w-full text-sm">
//         <thead className="bg-muted/50">
//           <tr>
//             {headers.map((h) => (
//               <th key={h} className="px-3 py-2 text-right first:text-left">
//                 {h}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {rows.length === 0 && (
//             <tr>
//               <td colSpan={headers.length} className="p-4 text-center text-muted-foreground">
//                 No hay datos
//               </td>
//             </tr>
//           )}

//           {rows.map((r, i) => {
//             const chg = Number(r.chg) || 0;
//             const chgPct = Number(r.chgPct) || 0;
//             const chgPositive = chg > 0 || chgPct > 0;

//             return (
//               <tr key={i} className="border-t hover:bg-muted/10">
//                 <td className="px-3 py-2">
//                   <a href={r.url ?? "#"} className="hover:underline">
//                     {r.name}
//                   </a>
//                 </td>
//                 {headers.includes("Last") && (
//                   <td className="px-3 py-2 text-right">{formatNumber(r.last)}</td>
//                 )}
//                 {headers.includes("High") && (
//                   <td className="px-3 py-2 text-right">{formatNumber(r.high)}</td>
//                 )}
//                 {headers.includes("Low") && (
//                   <td className="px-3 py-2 text-right">{formatNumber(r.low)}</td>
//                 )}
//                 {headers.includes("Month") && (
//                   <td className="px-3 py-2 text-right">{r.month ?? "—"}</td>
//                 )}
//                 {headers.includes("Bid") && (
//                   <td className="px-3 py-2 text-right">{r.bid ?? "—"}</td>
//                 )}
//                 {headers.includes("Ask") && (
//                   <td className="px-3 py-2 text-right">{r.ask ?? "—"}</td>
//                 )}
//                 {headers.includes("Yield") && (
//                   <td className="px-3 py-2 text-right">{r.yield ?? "—"}</td>
//                 )}
//                 {headers.includes("Prev.") && (
//                   <td className="px-3 py-2 text-right">{r.prev ?? "—"}</td>
//                 )}
//                 {headers.includes("Symbol") && (
//                   <td className="px-3 py-2 text-right">{r.symbol ?? "—"}</td>
//                 )}
//                 <td className={`px-3 py-2 text-right ${chgPositive ? "text-green-500" : "text-red-500"}`}>
//                   {formatNumber(r.chg)}
//                 </td>
//                 <td className={`px-3 py-2 text-right ${chgPositive ? "text-green-500" : "text-red-500"}`}>
//                   {formatPercent(r.chgPct)}
//                 </td>
//                 {headers.includes("Vol.") && (
//                   <td className="px-3 py-2 text-right">{r.vol ?? "—"}</td>
//                 )}
//                 <td className="px-3 py-2 text-right">{formatTime(r.time)}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }


// /* Helpers simples de formato, puedes adaptarlos a tus utils */
// function formatNumber(v: any) {
//   if (v === null || v === undefined || v === "") return "—";
//   // si ya es string con comas, devuelvo
//   if (typeof v === "string" && v.includes(",")) return v;
//   if (typeof v === "number") return v.toLocaleString();
//   return v.toString();
// }

// function formatPercent(v: any) {
//   if (v === null || v === undefined || v === "") return "—";
//   return typeof v === "number" ? `${v > 0 ? "+" : ""}${v}%` : v.toString();
// }

// function formatTime(ts: any) {
//   if (!ts) return "—";
//   // si viene unix timestamp en segundos
//   const n = Number(ts);
//   if (!isNaN(n) && n > 1000000000) {
//     const d = new Date(n * 1000);
//     return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
//   }
//   return ts.toString();
// }
// src/components/DataTable.tsx
"use client";

import React from "react";

type RowShape = {
  [key: string]: any; // flexible para distintos markets
  name?: string;
  last?: number | string;
  high?: number | string;
  low?: number | string;
  chg?: number | string;
  chgPct?: number | string;
  time?: string;
  url?: string;
};

export default function DataTable({
  headers,
  rows,
  loading,
  error,
  searchable = false,
  search,
  onSearchChange,
  lastUpdated,
}: {
  headers: string[];
  rows: RowShape[];
  loading: boolean;
  error?: string | null;
  searchable?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
  lastUpdated?: number | null;
}) {
  return (
    <div className="p-4 min-h-[200px]">
      {/* Buscador y status */}
      <div className="mb-4 flex flex-col gap-3">
        {searchable && (
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar..."
              className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              type="search"
            />
            <div className="ml-auto text-xs text-yellow-300">
              {lastUpdated
                ? `Última actualización: ${new Date(
                    lastUpdated
                  ).toLocaleTimeString()}`
                : "Sin datos aún"}
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-black text-yellow-300 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-900/60 text-yellow-200">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-sm first:text-left"
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
                    <td
                      key={j}
                      className="px-4 py-4 text-right first:text-left"
                    >
                      <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-6 text-center text-red-500"
                >
                  Error: {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No hay resultados
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const chg = Number(r.chg) || 0;
                const chgPct = Number(r.chgPct) || 0;
                const chgPositive = chg > 0 || chgPct > 0;

                return (
                  <tr
                    key={i}
                    className="border-t border-gray-800 hover:bg-gray-900/60 transition-colors"
                  >
                    {headers.map((h, j) => {
                      let value: React.ReactNode = r[h.toLowerCase()] ?? "—";

                      if (h === "Chg." || h === "Chg. %") {
                        value =
                          h === "Chg."
                            ? formatNumber(r.chg)
                            : formatPercent(r.chgPct);
                      }

                      if (h === "Time") {
                        value = formatTime(r.time);
                      }

                      return (
                        <td
                          key={j}
                          className={`px-4 py-3 text-right first:text-left ${
                            h === "Chg." || h === "Chg. %"
                              ? chgPositive
                                ? "text-green-400"
                                : "text-red-400"
                              : ""
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Helpers */
function formatNumber(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number")
    return v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return v.toString();
}

function formatPercent(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return typeof v === "number"
    ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%`
    : v.toString();
}

function formatTime(ts: any) {
  if (!ts) return "—";
  const n = Number(ts);
  if (!isNaN(n) && n > 1000000000) {
    const d = new Date(n * 1000);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return ts.toString();
}
