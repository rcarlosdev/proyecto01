// src/components/SymbolRow.tsx
"use client";

import Image from "next/image";
import { MarketQuote } from "@/types/interfaces";
import { useMarketStore } from "@/stores/useMarketStore";

export default function SymbolRow({
  symbol,
  price,
  change
}: MarketQuote) {

  const { setSelectedSymbol } = useMarketStore();

  return (
    <div
      className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors"
      onClick={() => setSelectedSymbol(symbol)}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={`/symbols/${symbol}.png`}
            alt={symbol}
            width={32}
            height={32}
            priority={false} // ✅ no fuerza recarga
            loading="lazy"  // ✅ solo carga cuando es visible
          />
        </div>
        <p className="font-medium text-sm">{symbol}</p>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        <p className="font-medium text-sm">{price}</p>
        <p className="text-sm text-muted-foreground">{change}</p>
      </div>
    </div>
  );
}
