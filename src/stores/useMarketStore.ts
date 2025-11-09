// import { MARKETS } from "@/lib/markets";
// import { MarketQuote } from "@/types/interfaces";
// import { create } from "zustand";

// export interface MarketFilters {
//   search: string;
//   sortBy: "price" | "change" | "volume" | null;
// }

// type Market = typeof MARKETS[number];

// interface MarketState {
//   markets: Market[];
//   dataMarket: MarketQuote[];
//   selectedMarket: Market | null;
//   selectedSymbol: string | null;
//   filters: MarketFilters;
//   isLoading: boolean;
//   dataSymbolOperation: MarketQuote;

//   // Actions
//   setDataMarket: (markets: MarketQuote[]) => void;
//   setSelectedMarket: (market: Market | null) => void;
//   setSelectedSymbol: (symbol: string | null) => void;
//   setFilters: (filters: Partial<MarketFilters>) => void;
//   setIsLoading: (value: boolean) => void;
//   setSearchTerm: (term: string) => void;
//   setDataSymbolOperation: (data: MarketQuote) => void;
// }

// export const useMarketStore = create<MarketState>((set) => ({
//   markets: [...MARKETS],
//   dataMarket: [],
//   selectedMarket: null,
//   selectedSymbol: null,
//   filters: { search: "", sortBy: null },
//   isLoading: false,
//   dataSymbolOperation: {} as MarketQuote,

//   // Actions
//   setDataMarket: (dataMarket) => set({ dataMarket }),
//   setSelectedMarket: (market) => set({ selectedMarket: market }),
//   setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
//   setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
//   setIsLoading: (value) => set({ isLoading: value }),
//   setSearchTerm: (term) => set((state) => ({ filters: { ...state.filters, search: term } })),
//   setDataSymbolOperation: (data) => set({ dataSymbolOperation: data }),
// }));


// src/stores/useMarketStore.ts
import { MARKETS } from "@/lib/markets";
import { MarketQuote } from "@/types/interfaces";
import { create } from "zustand";

export interface MarketFilters {
  search: string;
  sortBy: "price" | "change" | "volume" | null;
}

type Market = typeof MARKETS[number];

type Prices = Record<string, number>;

interface MarketState {
  // Estado
  markets: Market[];
  dataMarket: MarketQuote[];
  selectedMarket: Market | null;
  selectedSymbol: string | null;
  filters: MarketFilters;
  isLoading: boolean;
  dataSymbolOperation: MarketQuote | null;
  livePrices: Prices;              // últimos precios por símbolo (SSE)
  sseMarket: string | null;        // mercado actualmente streameado
  
  // control de cambios de mercado / fetch
  switchingMarket: boolean;
  fetchController: AbortController | null;
  requestVersion: number;

  // Acciones básicas
  setDataMarket: (markets: MarketQuote[]) => void;
  setSelectedMarket: (market: Market | null) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setFilters: (filters: Partial<MarketFilters>) => void;
  setIsLoading: (value: boolean) => void;
  setSearchTerm: (term: string) => void;
  setDataSymbolOperation: (data: MarketQuote) => void;

  // Acciones avanzadas
  fetchMarket: (marketKey: string) => Promise<void>;
  startMarketStream: (marketKey: string) => void;
  stopMarketStream: () => void;
  selectMarket: (marketKey: string) => Promise<void>; // helper: fetch + stream
  applyLivePrices: () => void;
  getLivePrice: (symbol: string) => number | undefined;
}

/** ===========================
 *  Módulo (singleton) SSE
 * =========================== */
let esRef: EventSource | null = null;
let reconnectTimer: any = null;
let currentMarketForSSE: string | null = null;

function openSSE(market: string, onPrices: (p: Prices) => void) {
  // Cerrar previa
  if (esRef) {
    try { esRef.close(); } catch { }
    esRef = null;
  }
  currentMarketForSSE = market;
  const url = `/api/alpha-stream?market=${encodeURIComponent(market)}`;
  const es = new EventSource(url);
  esRef = es;

  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data?.prices && typeof data.prices === "object") {
        onPrices(data.prices as Prices);
      }
    } catch {
      // ignorar
    }
  };

  es.onerror = () => {
    // Backoff simple; EventSource intenta reconectar solo, pero cerramos por si acaso.
    try { es.close(); } catch { }
    esRef = null;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      if (currentMarketForSSE) openSSE(currentMarketForSSE, onPrices);
    }, 1500);
  };
}

function closeSSE() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  currentMarketForSSE = null;
  if (esRef) {
    try { esRef.close(); } catch { }
    esRef = null;
  }
}

/** Aplica un dict de precios al array de MarketQuote */
function mergePrices(base: MarketQuote[], prices: Prices): MarketQuote[] {
  if (!base?.length || !prices) return base;
  const out = base.map((q) => {
    const qa: any = q;
    const sym = String(qa.symbol || qa.ticker || qa.code || "").toUpperCase();
    const p = prices[sym];
    if (typeof p === "number") {
      return {
        ...q,
        price: p,
        lastPrice: p,
      } as MarketQuote;
    }
    return q;
  });
  return out;
}

/** ===========================
 *  Store
 * =========================== */
export const useMarketStore = create<MarketState>((set, get) => ({
  // Estado
  markets: [...MARKETS],
  dataMarket: [],
  selectedMarket: null,
  selectedSymbol: null,
  filters: { search: "", sortBy: null },
  isLoading: false,
  dataSymbolOperation: null,
  livePrices: {},
  sseMarket: null,
  switchingMarket: false,
  fetchController: null,
  requestVersion: 0,

  // Acciones básicas
  setDataMarket: (dataMarket) => set({ dataMarket }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setIsLoading: (value) => set({ isLoading: value }),
  setSearchTerm: (term) =>
    set((state) => ({ filters: { ...state.filters, search: term } })),
  setDataSymbolOperation: (data) => set({ dataSymbolOperation: data }),

  /** Carga snapshot del mercado desde tu endpoint de backend */
  fetchMarket: async (marketKey: string) => {
    // aborta fetch anterior
    const prev = get().fetchController;
    prev?.abort();

    // nueva versión de request
    const version = get().requestVersion + 1;
    const controller = new AbortController();

    set({
      isLoading: true,
      fetchController: controller,
      requestVersion: version,
    });

    try {
      const res = await fetch(
        `/api/alpha-markets?market=${encodeURIComponent(marketKey)}`,
        { cache: "no-store", signal: controller.signal }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data: MarketQuote[] = await res.json();

      // si llegó tarde (versión vieja), ignora
      if (version !== get().requestVersion) return;

      const live = get().livePrices;
      const merged = mergePrices(data, live);

      set({
        dataMarket: merged,
        isLoading: false,
        // fija primer símbolo disponible
        selectedSymbol: merged[0]?.symbol ?? null,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return; // cambio de mercado, ok
      console.error("fetchMarket error:", e);
      set({ isLoading: false });
    } finally {
      // limpia sólo si sigue vigente esta versión
      if (version === get().requestVersion) {
        set({ fetchController: null });
      }
    }
  },


  /** Inicia/rehace el SSE para un mercado (uno solo vivo a la vez) */
  startMarketStream: (marketKey: string) => {
    const current = get().sseMarket;
    if (current === marketKey && esRef) return; // ya está corriendo para este market
    // cerrar previo
    closeSSE();
    set({ sseMarket: marketKey });

    openSSE(marketKey, (prices) => {
      // 1) guarda livePrices
      set({ livePrices: { ...get().livePrices, ...prices } });
      // 2) aplica al array
      const updated = mergePrices(get().dataMarket, prices);
      set({ dataMarket: updated });
    });

    // Pausar/resumir cuando la pestaña cambia visibilidad (opcional)
    if (typeof document !== "undefined") {
      const onVis = () => {
        if (document.visibilityState === "visible") {
          // reabrir si se cerró
          if (!esRef && get().sseMarket) {
            openSSE(get().sseMarket!, (prices) => {
              set({ livePrices: { ...get().livePrices, ...prices } });
              const updated = mergePrices(get().dataMarket, prices);
              set({ dataMarket: updated });
            });
          }
        } else {
          // cerrar para ahorrar
          closeSSE();
        }
      };
      // Asegúrate de no registrar múltiples veces: usa una marca en window
      const anyWin = window as any;
      if (!anyWin.__market_vis_listener__) {
        document.addEventListener("visibilitychange", onVis);
        anyWin.__market_vis_listener__ = true;
      }
    }
  },

  /** Detiene el stream actual */
  stopMarketStream: () => {
    closeSSE();
    set({ sseMarket: null });
  },

  /** Helper: selecciona mercado => carga snapshot + abre stream */
  selectMarket: async (marketKey: string) => {
    set({ selectedMarket: marketKey as Market });
    get().stopMarketStream();            // ← cierra SSE del mercado anterior
    await get().fetchMarket(marketKey);  // ← sólo snapshot; el SSE lo activa el chart tras el 1er load
  },

  /** Reaplica livePrices al dataMarket (por si actualizas desde fuera) */
  applyLivePrices: () => {
    const merged = mergePrices(get().dataMarket, get().livePrices);
    set({ dataMarket: merged });
  },

  /** Obtener precio en vivo por símbolo (en mayúsculas) */
  getLivePrice: (symbol: string) => {
    const S = symbol?.toUpperCase?.() || symbol;
    const live = get().livePrices[S];
    if (typeof live === "number") return live;
    const row = get().dataMarket.find((q) =>
      [q.symbol, (q as any).ticker, (q as any).code]
        .map((x) => String(x || "").toUpperCase())
        .includes(S)
    );
    return typeof row?.price === "number" ? row!.price : undefined;
  },
}));
