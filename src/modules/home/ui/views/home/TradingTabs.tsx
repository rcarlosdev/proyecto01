"use client";

import { Button } from "@/components/ui/button";

export function TradingTabs() {
  return (
    <div className="flex items-center justify-between bg-[#0f172a] p-3 border-b border-[#1f2937]">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">1 hora</Button>
        <Button variant="secondary" size="sm">Velas</Button>
        <Button variant="secondary" size="sm">Indicadores</Button>
        <Button variant="secondary" size="sm">Herramientas</Button>
        <Button variant="secondary" size="sm">Pantalla múltiple</Button>
        <Button variant="secondary" size="sm">Limpieza</Button>
      </div>
    </div>
  );
}
