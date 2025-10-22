// src/components/SymbolRow.tsx
"use client";

// import { Button } from "@/components/ui/button";
import { MarketQuote } from "@/types/interfaces";
// import { useMarketStore } from "@/stores/useMarketStore";
// import { Star } from "lucide-react";


export default function SymbolRow({
  symbol,
  price,
  change
}: MarketQuote) {
  // const { toggleFavorite } = useMarketStore();

  return (
    <div className="flex items-center justify-between p-4 border-b hover:bg-muted/30 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        {/* <Button
          variant="ghost"
          size="icon"
          // onClick={() => toggleFavorite(symbol)}
          className="text-yellow-500"
        >
        </Button> */}
        {/* <Star
          className={`h-5 w-5 ${isFavorite ? "fill-yellow-500" : "fill-none"}`}
        /> */}

        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
        </div>

        <div>
          <p className="font-medium text-sm">{symbol}</p>
          {/* <p className="text-xs text-muted-foreground">{name}</p> */}
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        <p className="font-medium text-sm">{price}</p>
        <p className="text-sm text-muted-foreground">{change}</p>
      </div>
    </div>
  );
}
