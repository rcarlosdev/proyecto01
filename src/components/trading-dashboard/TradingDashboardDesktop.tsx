"use client";

import { Separator } from "@/components/ui/separator";
import { useMarketStore } from "@/stores/useMarketStore";
import SearchBar from "@/components/trading-dashboard/SearchBar";
import SymbolList from "@/components/trading-dashboard/SymbolList";
import MarketHeader from "@/components/trading-dashboard/MarketHeader";
import OperationsInfo from "@/components/trading-dashboard/OperationsInfo";
import { FilterSelect } from "@/components/trading-dashboard/FilterSelect";
import AlphaCandleChart from "@/components/trading-dashboard/AlphaCandleChart";
import { ConfirmProvider } from "../common/ConfirmDialog";

const TradingDashboard = () => {
  const { selectedSymbol } = useMarketStore();

  return (
    /**
     * 🔹 Grid principal del MAIN (contenido):
     * - 2 filas: 3fr (60%) arriba, 2fr (40%) abajo
     * - min-h-[calc(100vh-80px)]: ajusta 80px al alto aproximado de tu header
     *   si ya tienes eso resuelto en el layout padre, puedes dejar solo "h-full min-h-0".
     */
    <section className="grid w-full min-h-[calc(100vh-80px)] grid-rows-[3fr_2fr] gap-4">
      {/* ===== FILA SUPERIOR (60% alto): símbolos + gráfico ===== */}
      <div className="grid min-h-0 gap-4 grid-cols-[minmax(320px,2fr)_minmax(0,8fr)]">
        {/* Columna izquierda (30% ancho): símbolos */}
        <div className="flex flex-col min-h-0 border-r border-gray-200 overflow-hidden">
          {/* Header del panel de mercado */}
          <div className="bg-accent-foreground border-gray-200 pb-4 px-2">
            <div className="space-y-3">
              <div className="flex gap-2">
                <SearchBar />
              </div>
              <FilterSelect />
            </div>
            <MarketHeader />
          </div>

          <Separator className="bg-gray-500/50" />

          {/* Lista de símbolos con scroll interno */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SymbolList />
          </div>
        </div>

        {/* Columna derecha (70% ancho): gráfico */}
        <div className="flex flex-col min-h-0">
          {selectedSymbol ? (
            // Contenedor del gráfico ocupa todo el alto de su celda
            <div className="flex-1 min-h-0">
              <AlphaCandleChart interval="15min" />
            </div>
          ) : (
            <div className="p-4">
              Selecciona un símbolo para ver el gráfico
            </div>
          )}
        </div>
      </div>

      {/* ===== FILA INFERIOR (40% alto): información de cuenta + operaciones ===== */}
      <footer className="min-h-0 overflow-y-auto border-t border-gray-200">
        <div className="p-4 h-full">
          <ConfirmProvider>
            <OperationsInfo />
          </ConfirmProvider>
        </div>
      </footer>
    </section>
  );
};

export default TradingDashboard;
