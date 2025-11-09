'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MARKETS } from '@/lib/markets';
import { Separator } from '@/components/ui/separator';
import SearchBar from './trading-dashboard/SearchBar';
import SymbolList from './trading-dashboard/SymbolList';
import { useMarketStore } from '@/stores/useMarketStore';
import AccountInfo from './trading-dashboard/AccountInfo';
import MarketHeader from './trading-dashboard/MarketHeader';
import { FilterSelect } from './trading-dashboard/FilterSelect';
import AlphaCandleChart from './trading-dashboard/AlphaCandleChart';

type Market = typeof MARKETS[number];

const TradingDashboard = () => {
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedMarket,
    selectMarket,
    stopMarketStream,
    dataMarket,
  } = useMarketStore();

  const didInit = useRef(false);

  useEffect(() => {
    // ⚡ Arranca solo una vez
    if (didInit.current) return;
    didInit.current = true;

    const defaultMarket: Market = (selectedMarket as Market) || 'indices';

    // Inicia carga + stream SSE
    selectMarket(defaultMarket);

    return () => {
      // Cierra stream al desmontar
      stopMarketStream();
    };
  }, [selectedMarket, selectMarket, stopMarketStream]);

  // Mantener símbolo seleccionado si sigue existiendo en el nuevo dataset
  useEffect(() => {
    if (!dataMarket.length) return;
    const exists = dataMarket.some((q) => q.symbol === selectedSymbol);
    if (!exists) {
      setSelectedSymbol(dataMarket[0].symbol);
    }
  }, [dataMarket, selectedSymbol, setSelectedSymbol]);

  // Memoriza el componente AlphaCandleChart para evitar re-renderizados
  const memoizedChart = useMemo(() => {
    if (!selectedSymbol) return null;

    return <AlphaCandleChart symbol={selectedSymbol} interval="1min" />;
  }, [selectedSymbol]);

  return (
    <section className="flex-1 flex-col h-full">
      <div className="flex h-[70%] w-full">
        {/* Panel lateral izquierdo */}
        <div className="flex flex-col border-r border-gray-200 transition-all duration-300 w-fit">
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
          <div className="flex-1 overflow-hidden">
            <SymbolList />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {memoizedChart || (
            <div className="p-4 text-sm text-muted-foreground">
              Selecciona un símbolo para ver el gráfico
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200">
        <div className="p-4">
          <AccountInfo />
        </div>
      </footer>
    </section>
  );
};

export default TradingDashboard;