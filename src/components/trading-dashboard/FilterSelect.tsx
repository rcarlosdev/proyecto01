// src/components/trading-dashboard/FilterSelect.tsx
"use client";

import { useEffect, useRef } from "react";
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
    selectMarket,       // helper: fetch + stream
    setSelectedMarket,  // fallback por si lo necesitas en algún flujo
  } = useMarketStore();

  // Evita inicializar más de una vez
  const didInitRef = useRef(false);

  // Establece 'indices' como valor por defecto al montar (si no hay selección)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Preferimos 'indices' si existe en la lista, si no el primero
    const defaultMarket =
      markets.find((m) => m === "indices") || markets[0] || null;

    // Si ya hay seleccionado, no hacemos nada; si no, seleccionamos y arrancamos stream
    if (!selectedMarket && defaultMarket) {
      // Usamos selectMarket para asegurar snapshot + SSE
      selectMarket(defaultMarket);
    }
  }, [markets, selectedMarket, selectMarket]);

  // Maneja el cambio de selección
  const handleChange = async (value: string) => {
    const found = markets.find((m) => m === value);
    if (!found) {
      // Si por alguna razón no está, sólo actualiza el estado “crudo”
      setSelectedMarket(null);
      return;
    }
    // Usa el helper para cargar y abrir stream
    await selectMarket(found);
  };

  // Valor controlado: si aún no hay selección, intenta mostrar 'indices' o vacío
  const controlledValue =
    selectedMarket ??
    (markets.includes("indices") ? "indices" : undefined);

  return (
    <div className="w-full">
      <Select value={controlledValue} onValueChange={handleChange}>
        <SelectTrigger className="w-full border border-gray-50/80 text-yellow-300">
          <SelectValue placeholder="Seleccionar mercado" />
        </SelectTrigger>

        <SelectContent className="text-yellow-300 border border-gray-50/80 bg-[#181a20e7]">
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
