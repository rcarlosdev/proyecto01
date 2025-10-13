// src/modules/home/ui/views/home-view.tsx
// "use client";


// import MarketTable from "@/components/MarketTable";

// export const HomeView = () => {
  
//   return (
  //     <div className="flex items-center justify-center h-full">
  //       <MarketTable />
  //     </div>
  //   );
  // };
'use client';

import { CandleChart } from "./CandleChart";
import { MarketSidebar } from "./MarketSidebar";
import { TradingTable } from "./TradingTable";
import { TradingTabs } from "./TradingTabs";

export const HomeView = () => {
  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-100">
      <MarketSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TradingTabs />
        <div className="flex-1 p-4 overflow-y-auto">
          <CandleChart />
        </div>
        <TradingTable />
      </div>
    </div>
  );
}
