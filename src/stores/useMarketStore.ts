import { MARKETS } from "@/lib/markets";
import { MarketQuote } from "@/types/interfaces";
import { create } from "zustand";

export interface MarketFilters {
  search: string;
  sortBy: "price" | "change" | "volume" | null;
}

type Market = typeof MARKETS[number];

interface MarketState {
  markets: Market[];
  dataMarket: MarketQuote[];
  selectedMarket: Market | null;
  filters: MarketFilters;
  isLoading: boolean;

  // Actions
  setDataMarket: (markets: MarketQuote[]) => void;
  setSelectedMarket: (market: Market | null) => void;
  setFilters: (filters: Partial<MarketFilters>) => void;
  setIsLoading: (value: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [...MARKETS],
  dataMarket: [],
  selectedMarket: null,
  filters: { search: "", sortBy: null },
  isLoading: false,

  // Actions
  setDataMarket: (dataMarket) => set({ dataMarket }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setIsLoading: (value) => set({ isLoading: value }),
}));
