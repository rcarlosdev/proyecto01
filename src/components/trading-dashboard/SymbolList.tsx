"use client";

import React from "react";
import SymbolRow from "./SymbolRow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketStore } from "@/stores/useMarketStore";

const SymbolList = () => {
  const { dataMarket, filters, isLoading } = useMarketStore();

  // Filtros básicos: búsqueda
  const filteredMarkets = dataMarket.filter((market) => {
    const search = filters.search.toLowerCase();
    return (
      market.symbol.toLowerCase().includes(search)
    );
  });

  return (
    <div className="h-[580px] rounded-lg border border-yellow-400/30 bg-background shadow-sm">
      {/* Estado de carga */}
      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex space-x-3">
              <Skeleton className="w-8 h-8 rounded-full bg-yellow-500/20" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-3 w-3/4 bg-yellow-500/20" />
                <Skeleton className="h-3 w-1/2 bg-yellow-500/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="h-full">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market, index) => (
              <SymbolRow key={index} {...market} />
            ))
          ) : (
            <div className="text-center py-10 text-yellow-300 text-sm">
              No se encontraron resultados.
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};

export default SymbolList;
