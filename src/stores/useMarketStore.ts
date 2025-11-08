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
  selectedSymbol: string | null;
  filters: MarketFilters;
  isLoading: boolean;
  dataSymbolOperation: MarketQuote;

  // Actions
  setDataMarket: (markets: MarketQuote[]) => void;
  setSelectedMarket: (market: Market | null) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setFilters: (filters: Partial<MarketFilters>) => void;
  setIsLoading: (value: boolean) => void;
  setSearchTerm: (term: string) => void;
  setDataSymbolOperation: (data: MarketQuote) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [...MARKETS],
  dataMarket: [],
  selectedMarket: null,
  selectedSymbol: null,
  filters: { search: "", sortBy: null },
  isLoading: false,
  dataSymbolOperation: {} as MarketQuote,

  // Actions
  setDataMarket: (dataMarket) => set({ dataMarket }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setIsLoading: (value) => set({ isLoading: value }),
  setSearchTerm: (term) => set((state) => ({ filters: { ...state.filters, search: term } })),
  setDataSymbolOperation: (data) => set({ dataSymbolOperation: data }),
}));
