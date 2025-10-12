// src/modules/home/ui/views/home-view.tsx
"use client";

import MarketTable from "@/components/MarketTable";

export const HomeView = () => {

  return (
    <div className="flex items-center justify-center h-full">
      <MarketTable />
    </div>
  );
};
