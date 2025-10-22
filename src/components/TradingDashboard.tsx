'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AccountInfo from './trading-dashboard/AccountInfo';
import SearchBar from './trading-dashboard/SearchBar';
import MarketHeader from './trading-dashboard/MarketHeader';
import SymbolList from './trading-dashboard/SymbolList';
import { FilterSelect } from './trading-dashboard/FilterSelect';
import { useMarketStore } from '@/stores/useMarketStore';
import { MARKETS } from '@/lib/markets';
import { MarketQuote } from '@/types/interfaces';
import AlphaCandleChart from './AlphaCandleChart';

type Market = typeof MARKETS[number];

// Componente principal
const TradingDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { selectedMarket, setDataMarket } = useMarketStore();


  const loadData = useCallback(
    async (market: Market) => {
      const res = await fetch(`/api/markets?market=${encodeURIComponent(market)}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data: MarketQuote[] = await res.json();
      setDataMarket(data);
    },
    [setDataMarket] // 👈 dependencias reales
  );

  useEffect(() => {
    const marketToLoad = selectedMarket || "indices";

    loadData(marketToLoad);

    const id = setInterval(() => loadData(marketToLoad), 60_000);
    return () => clearInterval(id);
  }, [selectedMarket, loadData]);


  return (
    <section className='flex-1 flex-col'>
      <div className="flex h-[70%] w-full">
        {/* Panel lateral izquierdo */}
        <div className={`flex flex-col border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-100'}`}>

          {/* Header de búsqueda y filtros */}
          <div className="border-b bg-accent-foreground border-gray-200 pb-4 px-2">
            <div className="space-y-3">
              <SearchBar />
              <FilterSelect />
            </div>
          </div>

          {/* Header del mercado */}
          <MarketHeader />

          {/* Lista de símbolos */}
          <div className="flex-1 overflow-hidden">
            <SymbolList />
          </div>

          {/* Botón de colapsar/expandir */}
          {/* <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full p-2 rounded-lg transition-colors"
            >
              <svg
                className={`transform transition-transform ${isCollapsed ? 'rotate-180' : ''} mx-auto`}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div> */}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-auto">
            <AlphaCandleChart symbol="TSLA" interval="15min" />
          </main>

          {/* Panel inferior con información de cuenta */}
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