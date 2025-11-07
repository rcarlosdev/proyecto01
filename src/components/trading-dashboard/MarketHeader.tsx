"use client";

import { useMarketStore } from "@/stores/useMarketStore";
// import { useMarketStore } from "@/stores/useMarketStore";
import { ArrowDown } from "lucide-react";

export default function MarketHeader() {
  const { dataMarket } = useMarketStore();

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 pt-4 rounded-md">
      {/* Izquierda: título y acciones */}
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-sm">
          Mercado ({dataMarket.length})
        </span>

        {/* <div className="flex items-center space-x-1 text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
        </div> */}
      </div>

      {/* Derecha: botones de filtro */}
      <div className="flex items-center space-x-2">
        <span className="">Comprar</span>
        <div className="w-px h-5 mx-1" />
        <span className="">Vender</span>
      </div>
    </div>
  );
}
