"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

const markets = [
  { symbol: "AAVEUSD", priceBuy: 254.230, priceSell: 252.630, change: -160 },
  { symbol: "AAVEUSDT", priceBuy: 253.46, priceSell: 253.10, change: 3629 },
  { symbol: "ADABTC", priceBuy: 0.00000, priceSell: 0.00000, change: 0.01 },
  { symbol: "ADAUSD", priceBuy: 0.69989, priceSell: 0.69946, change: -43 },
];

export function MarketSidebar() {
  return (
    <div className="w-72 bg-[#111827] border-r border-[#1f2937] flex flex-col">
      <div className="p-3 border-b border-[#1f2937] text-gray-200 font-semibold">
        Mercado (996)
      </div>
      <ScrollArea className="flex-1">
        <ul>
          {markets.map((m) => (
            <li key={m.symbol} className="flex items-center justify-between px-3 py-2 border-b border-[#1f2937]">
              <div className="flex flex-col text-gray-300">
                <span className="text-sm font-semibold">{m.symbol}</span>
              </div>
              <div className="flex flex-col items-end text-xs">
                <span className={`px-2 py-1 rounded text-white ${m.change > 0 ? "bg-green-600" : "bg-red-600"}`}>
                  {m.priceBuy}
                </span>
                <span className={`px-2 py-1 rounded text-white ${m.change > 0 ? "bg-green-600" : "bg-red-600"}`}>
                  {m.priceSell}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
