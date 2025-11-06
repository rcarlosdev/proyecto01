"use client";

import { useEffect } from "react";
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

  // Efecto para establecer 'indices' como valor por defecto solo al montar el componente
  useEffect(() => {
    if (markets.length > 0 && selectedMarket === undefined) {
      const defaultMarket = markets.find(m => m === "indices") || markets[0];
      setSelectedMarket(defaultMarket);
    }
  }, [markets, selectedMarket, setSelectedMarket]);

  // Maneja el cambio de selección
  const handleChange = (value: string) => {
    const found = markets.find((m) => m === value) || null;
    setSelectedMarket(found);
  };

  return (
    <div className="w-full">
      <Select
        value={selectedMarket || "all"}
        onValueChange={handleChange}
      >
        <SelectTrigger
          className="w-full border border-gray-50/80 text-yellow-300"
        >
          <SelectValue placeholder="Seleccionar mercado" />
        </SelectTrigger>

        <SelectContent className="text-yellow-300 border border-gray-50/80 bg-[#181a20e7]">
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