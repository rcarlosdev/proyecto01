'use client';

import {
  useCallback,
  useEffect
} from 'react';
import { MARKETS } from '@/lib/markets';
import { MarketQuote } from '@/types/interfaces';
import { Separator } from '@/components/ui/separator';
import SearchBar from './trading-dashboard/SearchBar';
import SymbolList from './trading-dashboard/SymbolList';
import { useMarketStore } from '@/stores/useMarketStore';
import AccountInfo from './trading-dashboard/AccountInfo';
import MarketHeader from './trading-dashboard/MarketHeader';
import { FilterSelect } from './trading-dashboard/FilterSelect';
import { TradingDialog } from './trading-dashboard/TradingDialog';
import AlphaCandleChart from './trading-dashboard/AlphaCandleChart';

type Market = typeof MARKETS[number];

// Componente principal
const TradingDashboard = () => {
  const { selectedSymbol, setSelectedSymbol, selectedMarket, setDataMarket } = useMarketStore();


  const loadData = useCallback(
    async (market: Market) => {
      const res = await fetch(`/api/markets?market=${encodeURIComponent(market)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data: MarketQuote[] = await res.json();
      setDataMarket(data);
      setSelectedSymbol(data[0]?.symbol || null);
    },
    [setDataMarket, setSelectedSymbol]
  );

  useEffect(() => {
    const marketToLoad = selectedMarket || "indices";

    loadData(marketToLoad);

    const id = setInterval(() => loadData(marketToLoad), 20_000);
    return () => clearInterval(id);
  }, [selectedMarket, loadData]);

  return (
    <section className='flex-1 flex-col h-full'>
      <div className="flex h-[70%] w-full">
        {/* Panel lateral izquierdo */}
        <div className="flex flex-col border-r border-gray-200 transition-all duration-300 w-fit">

          <div className="bg-accent-foreground border-gray-200 pb-4 px-2">
            <div className="space-y-3">
              <div className="flex gap-2">
                <SearchBar />
                <TradingDialog text="Abrir Operación" symbol={selectedSymbol} tipoOperacion="buy" />
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
          {!!selectedSymbol ? <AlphaCandleChart symbol={selectedSymbol} interval="1min" /> : <div className="p-4">Selecciona un símbolo para ver el gráfico</div>}
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