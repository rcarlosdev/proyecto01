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
      <label className="block mb-2 text-sm font-medium text-yellow-400">
        Seleccionar mercado
      </label>

      <Select
        value={selectedMarket || "all"}
        onValueChange={handleChange}
      >
        <SelectTrigger
          className="w-full"
        >
          <SelectValue placeholder="Seleccionar mercado" />
        </SelectTrigger>

        <SelectContent className="bg-background text-yellow-300 border border-yellow-500/20">
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
