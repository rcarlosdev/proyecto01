"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketStore } from "@/stores/useMarketStore";

export function FilterSelect() {
  const {
    markets,
    selectedMarket,
    setSelectedMarket,
  } = useMarketStore();

  // Maneja el cambio de selección
  const handleChange = (value: string) => {
    if (value === "all") {
      setSelectedMarket(null);
    } else {
      const found = markets.find((m) => m === value) || null;
      setSelectedMarket(found);
    }
  };

  return (
    <div className="w-full">
      {/* <label className="block mb-2 text-sm font-medium">
        Seleccionar mercado
      </label> */}

      <Select
        value={selectedMarket || "all"}
        onValueChange={handleChange}
      >
        <SelectTrigger
          className="w-full bg-background border border-gray-50/80 text-yellow-300"
        >
          <SelectValue placeholder="Seleccionar mercado" />
        </SelectTrigger>

        <SelectContent className="text-yellow-300 border border-gray-50/80 bg-background">
          {/* <SelectItem value="all">Todos</SelectItem> */}
          {markets.map((market) => (
            <SelectItem key={market} value={market}>
              {market}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
