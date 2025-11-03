"use client";

import Image from "next/image";
import { useState } from "react";
import { MarketQuote } from "@/types/interfaces";
import { useMarketStore } from "@/stores/useMarketStore";

export default function SymbolRow({
  symbol,
  price,
  change
}: MarketQuote) {
  const { setSelectedSymbol } = useMarketStore();

  // Estado para manejar si la imagen existe o no
  const [imageExists, setImageExists] = useState(true);

  return (
    <div
      className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => setSelectedSymbol(symbol)}
    >
      <div className="flex items-center space-x-3 flex-1">
        {imageExists ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={`/symbols/${symbol}.png`}
              alt={symbol}
              width={32}
              height={32}
              className="object-contain"
              loading="lazy"
              priority={false}
              onError={() => setImageExists(false)} // 🔹 Si no se encuentra, oculta la imagen
            />
          </div>
        ) : (
          // 🔸 Fallback: mostrar solo el texto si la imagen no existe
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {symbol}
          </div>
        )}

        <p className="font-medium text-sm">{symbol}</p>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        <p className="font-medium text-sm">{price}</p>
        <p
          className={`text-sm ${(change ?? 0) < 0 ? "text-red-500" : "text-green-500"}`}
        >
          {change ?? "-"}
        </p>
      </div>
    </div>
  );
}
