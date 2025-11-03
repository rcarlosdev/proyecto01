'use client';

import { MARKETS } from '@/lib/markets';
import { MarketQuote } from '@/types/interfaces';
import React, { useCallback, useEffect } from 'react';
import SearchBar from './trading-dashboard/SearchBar';
import SymbolList from './trading-dashboard/SymbolList';
import { useMarketStore } from '@/stores/useMarketStore';
import AccountInfo from './trading-dashboard/AccountInfo';
import MarketHeader from './trading-dashboard/MarketHeader';
import { FilterSelect } from './trading-dashboard/FilterSelect';
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

    const id = setInterval(() => loadData(marketToLoad), 60_000);
    return () => clearInterval(id);
  }, [selectedMarket, loadData]);

  return (
    <section className='flex-1 flex-col h-full'>
      <div className="flex h-[70%] w-full">
        {/* Panel lateral izquierdo */}
        <div className={`flex flex-col border-r border-gray-200 transition-all duration-300 w-100`}>

          <div className="border-b bg-accent-foreground border-gray-200 pb-4 px-2">
            <div className="space-y-3">
              <SearchBar />
              <FilterSelect />
            </div>
          </div>

          <MarketHeader />

          <div className="flex-1 overflow-hidden">
            <SymbolList />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          <AlphaCandleChart symbol={selectedSymbol} interval="1min" />
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