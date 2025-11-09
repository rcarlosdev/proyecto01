// "use client";

// import { useEffect, useRef, useState, useCallback } from "react";
// import {
//   createChart,
//   type IChartApi,
//   type ISeriesApi,
//   type CandlestickData,
//   type LineData,
//   type AreaData,
//   type Time,
//   UTCTimestamp,
// } from "lightweight-charts";

// import { Card, CardHeader, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { Label } from "@/components/ui/label";
// import { ZoomIn, ZoomOut, RotateCcw, RefreshCw, AlertCircle, Menu } from "lucide-react";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

// interface CandleData {
//   time: UTCTimestamp;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume?: number;
// }

// type ChartType = "candlestick" | "line" | "area";
// type LoadMoreDirection = "forward" | "backward" | null;

// const dataCache = new Map<string, {
//   data: CandleData[];
//   timestamp: number;
// }>();

// const CACHE_DURATION = 5 * 60 * 1000;
// const VALID_INTERVALS = [
//   { value: "1min", label: "1 Minuto" },
//   { value: "5min", label: "5 Minutos" },
//   { value: "15min", label: "15 Minutos" },
//   { value: "30min", label: "30 Minutos" },
//   { value: "60min", label: "1 Hora" }
// ];

// let isChartInitializing = false;

// export default function AlphaCandleChart({
//   symbol,
//   interval,
// }: {
//   symbol: string;
//   interval: string;
// }) {
//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const chartRef = useRef<IChartApi | null>(null);
//   const seriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);

//   const [chartType, setChartType] = useState<ChartType>("candlestick");
//   const [isChartReady, setIsChartReady] = useState(false);
//   const [currentPrice, setCurrentPrice] = useState<string>("");
//   const [currentTime, setCurrentTime] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState<LoadMoreDirection>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

//   const currentDataRef = useRef<CandleData[]>([]);
//   const currentIntervalRef = useRef<string>(interval ?? "5min");
//   const isInitialLoadRef = useRef<boolean>(true);
//   const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const mountedRef = useRef<boolean>(false);
//   const isLoadingMoreRef = useRef<LoadMoreDirection | null>(null);
//   const isLoadingRef = useRef(false);

//   /* ------------------ Cache Key Helper ------------------ */
//   const getCacheKey = useCallback(() =>
//     `${symbol}-${currentIntervalRef.current}`, [symbol]);

//   /* ------------------ Validar Intervalo ------------------ */
//   const validateInterval = useCallback((int?: string): string => {
//     const value = int ?? "5min";
//     const isValid = VALID_INTERVALS.some(item => item.value === value);
//     return isValid ? value : "5min";
//   }, []);

//   /* ------------------ Cargar datos históricos (backend espera seconds) ------------------ */
//   const lastLoadRef = useRef<{ time: number; direction: string | null }>({ time: 0, direction: null });

//   const loadHistoricalData = useCallback(
//     async (direction: "forward" | "backward", referenceTimeSeconds: number): Promise<CandleData[]> => {
//       const now = Date.now();

//       // evita bloqueos falsos si hace más de 1.5s que se intentó una carga
//       if (
//         isLoadingMoreRef.current &&
//         now - lastLoadRef.current.time < 1500 &&
//         lastLoadRef.current.direction === direction
//       ) {
//         // console.log("⏳ Saltando carga duplicada en ventana corta:", direction);
//         return [];
//       }

//       if (error?.includes("Límite")) {
//         // console.log("⏸️ Saltando carga histórica por límite");
//         return [];
//       }

//       try {
//         isLoadingMoreRef.current = direction;
//         lastLoadRef.current = { time: now, direction };
//         setIsLoadingMore(direction);

//         const params = new URLSearchParams();
//         params.set("symbol", symbol);
//         params.set("interval", currentIntervalRef.current);
//         params.set("historical", "true");
//         params.set("direction", direction);
//         params.set("referenceTime", String(Math.floor(referenceTimeSeconds)));

//         const url = `/api/alpha-candles?${params.toString()}`;
//         // console.log("➡️ Llamada historical ->", url);

//         const res = await fetch(url);
//         if (!res.ok) {
//           console.error("❌ historical fetch status:", res.status);
//           return [];
//         }

//         const newData: CandleData[] = await res.json();
//         // console.log(`✅ historical returned ${newData.length} candles (${direction})`);

//         const filtered = newData.filter(
//           (c) => c && typeof c.time === "number" && typeof c.close === "number"
//         );

//         if (filtered.length === 0) {
//           // // console.log(`ℹ️ No se recibieron velas (${direction})`);
//         }

//         return filtered;
//       } catch (err) {
//         console.error("💥 Error cargando historical:", err);
//         return [];
//       } finally {
//         // 🔚 liberar siempre, aunque haya error o datos vacíos
//         isLoadingMoreRef.current = null;
//         setIsLoadingMore(null);
//         lastLoadRef.current = { time: Date.now(), direction: null };
//       }
//     },
//     [symbol, error]
//   );


//   /* ------------------ Inicialización del Chart ------------------ */
//   const initializeChart = useCallback(() => {
//     if (!chartContainerRef.current || chartRef.current || isChartInitializing) {
//       return;
//     }

//     isChartInitializing = true;
//     // // console.log('🚀 Inicializando chart...');

//     try {
//       chartContainerRef.current.innerHTML = "";

//       const chart = createChart(chartContainerRef.current, {
//         layout: {
//           background: { color: "#0b1d37" },
//           textColor: "#ffffff",
//           fontFamily: "Arial, sans-serif",
//         },
//         grid: {
//           vertLines: { color: "#1b2a4a" },
//           horzLines: { color: "#1b2a4a" },
//         },
//         width: chartContainerRef.current.clientWidth,
//         height: 500,
//         timeScale: {
//           borderColor: "#485c7b",
//           timeVisible: true,
//           secondsVisible: false,
//           barSpacing: 8,
//           minBarSpacing: 2,
//         },
//         crosshair: {
//           mode: 1,
//           vertLine: {
//             color: "#dfc035",
//             width: 1,
//             style: 2,
//             labelBackgroundColor: "#dfc035",
//           },
//           horzLine: {
//             color: "#dfc035",
//             width: 1,
//             style: 2,
//             labelBackgroundColor: "#dfc035",
//           },
//         },
//         localization: {
//           locale: "es-ES",
//           dateFormat: "dd/MM/yyyy",
//         },
//       });

//       chartRef.current = chart;
//       setIsChartReady(true);
//       setError(null);
//       isChartInitializing = false;
//     } catch (err) {
//       console.error("Error al inicializar chart:", err);
//       setError("Error al inicializar el gráfico");
//       setIsChartReady(false);
//       isChartInitializing = false;
//     }
//   }, []);

//   /* ------------------ Limpieza ------------------ */
//   const cleanupChart = useCallback(() => {
//     // console.log('🧹 Limpiando chart...');

//     setIsChartReady(false);
//     setCurrentPrice("");
//     setCurrentTime("");
//     setError(null);

//     if (loadMoreTimeoutRef.current) {
//       clearTimeout(loadMoreTimeoutRef.current);
//       loadMoreTimeoutRef.current = null;
//     }

//     if (resizeTimeoutRef.current) {
//       clearTimeout(resizeTimeoutRef.current);
//       resizeTimeoutRef.current = null;
//     }

//     if (seriesRef.current && chartRef.current) {
//       try {
//         chartRef.current.removeSeries(seriesRef.current);
//       } catch (err) {
//         console.error('Error removiendo series:', err);
//       }
//       seriesRef.current = null;
//     }

//     if (chartRef.current) {
//       try {
//         chartRef.current.remove();
//       } catch (err) {
//         console.error('Error removiendo chart:', err);
//       }
//       chartRef.current = null;
//     }

//     isChartInitializing = false;
//   }, []);

//   /* ------------------ Effect Principal ------------------ */
//   useEffect(() => {
//     if (mountedRef.current) {
//       return;
//     }

//     mountedRef.current = true;
//     currentIntervalRef.current = validateInterval(interval);

//     // console.log('🎯 Montando componente por primera vez');
//     initializeChart();

//     return () => {
//       // console.log('🗑️ Desmontando componente');
//       mountedRef.current = false;
//       cleanupChart();
//     };
//   }, []);

//   /* ------------------ Resize ------------------ */
//   useEffect(() => {
//     if (!chartContainerRef.current || !chartRef.current) return;

//     const handleResize = () => {
//       if (!chartRef.current || !chartContainerRef.current) return;

//       requestAnimationFrame(() => {
//         chartRef.current!.applyOptions({
//           width: chartContainerRef.current!.clientWidth,
//         });
//       });
//     };

//     const debouncedResize = () => {
//       if (resizeTimeoutRef.current) {
//         clearTimeout(resizeTimeoutRef.current);
//       }

//       resizeTimeoutRef.current = setTimeout(handleResize, 150);
//     };

//     window.addEventListener("resize", debouncedResize);
//     handleResize();

//     return () => {
//       window.removeEventListener("resize", debouncedResize);
//       if (resizeTimeoutRef.current) {
//         clearTimeout(resizeTimeoutRef.current);
//       }
//     };
//   }, [isChartReady]);

//   /* ------------------ Cargar datos principales ------------------ */
//   const loadData = useCallback(async (forceRefresh = false): Promise<CandleData[]> => {
//     if (isLoadingRef.current && !forceRefresh) {
//       // console.log('⏳ Carga ya en progreso, omitiendo...');
//       return currentDataRef.current;
//     }

//     const cacheKey = getCacheKey();
//     const now = Date.now();

//     if (!forceRefresh && dataCache.has(cacheKey)) {
//       const cached = dataCache.get(cacheKey)!;
//       if (now - cached.timestamp < CACHE_DURATION) {
//         // console.log('💾 Sirviendo datos desde cache interno');
//         currentDataRef.current = cached.data;
//         return cached.data;
//       }
//     }

//     isLoadingRef.current = true;
//     setIsLoading(true);
//     setError(null);

//     try {
//       // console.log('🌐 Cargando datos desde API...');

//       // Construimos params de forma segura (no enviar timestamp vacío)
//       const params = new URLSearchParams();
//       params.set("symbol", symbol);
//       params.set("interval", currentIntervalRef.current);
//       if (forceRefresh) {
//         params.set("timestamp", String(Date.now()));
//       }

//       const url = `/api/alpha-candles?${params.toString()}`;
//       // console.log('➡️ Llamada a API (loadData):', url);

//       const res = await fetch(url);

//       if (!res.ok) {
//         const errorData = await res.json().catch(() => ({}));
//         if (res.status === 429) {
//           const retryAfter = errorData.retryAfter || 60;
//           throw new Error(`Límite de API alcanzado. Intenta nuevamente en ${retryAfter} segundos.`);
//         } else if (res.status === 404) {
//           throw new Error('Símbolo no encontrado o sin datos disponibles.');
//         } else {
//           throw new Error(errorData.error || `Error ${res.status} al cargar datos`);
//         }
//       }

//       const candles: CandleData[] = await res.json();

//       if (!candles || candles.length === 0) {
//         throw new Error('No se encontraron datos para este símbolo');
//       }

//       const filteredData = candles.filter(
//         (c) => c?.time && typeof c.open === "number" && typeof c.high === "number" &&
//           typeof c.low === "number" && typeof c.close === "number"
//       );

//       dataCache.set(cacheKey, {
//         data: filteredData,
//         timestamp: now,
//       });

//       currentDataRef.current = filteredData;
//       setLastUpdate(new Date());
//       setError(null);

//       // console.log('✅ Datos cargados exitosamente:', filteredData.length, 'velas');
//       return filteredData;
//     } catch (err) {
//       console.error("Error cargando datos:", err);
//       const errorMessage = err instanceof Error ? err.message : "Error desconocido";
//       setError(errorMessage);

//       if (dataCache.has(cacheKey)) {
//         const cached = dataCache.get(cacheKey)!;
//         console.warn("⚠️ Usando datos cacheados debido a error:", errorMessage);
//         currentDataRef.current = cached.data;

//         if (errorMessage.includes('Límite')) {
//           dataCache.set(cacheKey, {
//             data: cached.data,
//             timestamp: now,
//           });
//         }

//         return cached.data;
//       }

//       return [];
//     } finally {
//       isLoadingRef.current = false;
//       setIsLoading(false);
//     }
//   }, [symbol, getCacheKey]);

//   /* ------------------ Actualizar serie con nuevos datos ------------------ */
//   const updateSeriesWithData = useCallback((data: CandleData[]) => {
//     if (!seriesRef.current) return;

//     try {
//       if (chartType === "line") {
//         (seriesRef.current as ISeriesApi<"Line">).setData(
//           data.map(c => ({ time: c.time, value: c.close } as LineData))
//         );
//       } else if (chartType === "area") {
//         (seriesRef.current as ISeriesApi<"Area">).setData(
//           data.map(c => ({ time: c.time, value: c.close } as AreaData))
//         );
//       } else {
//         (seriesRef.current as ISeriesApi<"Candlestick">).setData(
//           data.map(c => ({
//             time: c.time,
//             open: c.open,
//             high: c.high,
//             low: c.low,
//             close: c.close,
//           } as CandlestickData))
//         );
//       }
//     } catch (err) {
//       console.error("Error actualizando serie:", err);
//     }
//   }, [chartType]);

//   /* ------------------ Combinar datos eliminando duplicados ------------------ */
//   const mergeDataWithoutDuplicates = useCallback((existingData: CandleData[], newData: CandleData[]): CandleData[] => {
//     const dataMap = new Map<UTCTimestamp, CandleData>();

//     existingData.forEach(candle => {
//       dataMap.set(candle.time, candle);
//     });

//     newData.forEach(candle => {
//       dataMap.set(candle.time, candle);
//     });

//     const mergedData = Array.from(dataMap.values());
//     return mergedData.sort((a, b) => a.time - b.time);
//   }, []);

//   /* ------------------ Función auxiliar para obtener intervalo en segundos ------------------ */
//   const getIntervalInSeconds = useCallback((interval: string): number => {
//     switch (interval) {
//       case '1min': return 60;
//       case '5min': return 5 * 60;
//       case '15min': return 15 * 60;
//       case '30min': return 30 * 60;
//       case '60min': return 60 * 60;
//       default: return 5 * 60;
//     }
//   }, []);

//   const checkLoadMoreData = useCallback(async () => {
//     if (!chartRef.current || !seriesRef.current || isLoadingMoreRef.current || isLoadingRef.current) return;

//     try {
//       const timeScale = chartRef.current.timeScale();
//       const visibleRange = timeScale.getVisibleRange();
//       if (!visibleRange) return;

//       const current = currentDataRef.current;
//       if (!current || current.length === 0) return;

//       const earliest = current[0].time as number;
//       const latest = current[current.length - 1].time as number;

//       const visibleStart = Number(visibleRange.from);
//       const visibleEnd = Number(visibleRange.to);

//       // console.log("🕒 visibleStart, visibleEnd, earliest, latest:", visibleStart, visibleEnd, earliest, latest);

//       const intervalSeconds = getIntervalInSeconds(currentIntervalRef.current);
//       const buffer = intervalSeconds * 8; // margen

//       // Si el usuario se acerca al inicio (visibleStart es menor o igual al earliest + buffer)
//       if (visibleStart <= earliest + buffer) {
//         // console.log("⬅️ Detected near left edge -> load backward, refSecs:", earliest);
//         setIsLoadingMore("backward");
//         isLoadingMoreRef.current = "backward";
//         const hist = await loadHistoricalData("backward", earliest);
//         if (hist.length) {
//           // Prepend & merge sin duplicados
//           const merged = mergeDataWithoutDuplicates(hist, current);
//           currentDataRef.current = merged;
//           updateSeriesWithData(merged);
//           const cacheKey = getCacheKey();
//           dataCache.set(cacheKey, { data: merged, timestamp: Date.now() });
//           // console.log("✅ Added backward candles:", hist.length);
//         } else {
//           // console.log("ℹ️ No backward candles returned");
//         }
//         setIsLoadingMore(null);
//         isLoadingMoreRef.current = null;
//       }

//       // Si el usuario se acerca al final, cargar forward
//       if (visibleEnd >= latest - buffer) {
//         // console.log("➡️ Detected near right edge -> load forward, refSecs:", latest);
//         setIsLoadingMore("forward");
//         isLoadingMoreRef.current = "forward";
//         const fwd = await loadHistoricalData("forward", latest);
//         if (fwd.length) {
//           const merged = mergeDataWithoutDuplicates(current, fwd);
//           currentDataRef.current = merged;
//           updateSeriesWithData(merged);
//           const cacheKey = getCacheKey();
//           dataCache.set(cacheKey, { data: merged, timestamp: Date.now() });
//           // console.log("✅ Added forward candles:", fwd.length);
//         } else {
//           // console.log("ℹ️ No forward candles returned");
//         }
//         setIsLoadingMore(null);
//         isLoadingMoreRef.current = null;
//       }
//     } catch (err) {
//       console.error("❌ Error checkLoadMoreData:", err);
//       setIsLoadingMore(null);
//       isLoadingMoreRef.current = null;
//     }
//   }, [getIntervalInSeconds, getCacheKey, mergeDataWithoutDuplicates, loadHistoricalData, updateSeriesWithData]);

//   /* ------------------ Crosshair ------------------ */
//   const setupCrosshairEvents = useCallback(() => {
//     if (!chartRef.current || !seriesRef.current) return;

//     try {
//       chartRef.current.subscribeCrosshairMove((param) => {
//         const data = param?.seriesData.get(seriesRef.current!);
//         if (!data) {
//           setCurrentPrice("");
//           setCurrentTime("");
//           return;
//         }

//         let price: number | undefined;
//         if ("value" in data && typeof data.value === "number") {
//           price = data.value;
//         } else if ("close" in data && typeof data.close === "number") {
//           price = data.close;
//         } else {
//           setCurrentPrice("");
//           setCurrentTime("");
//           return;
//         }

//         const time = "time" in data && data.time ? data.time : param.time;
//         if (!price || !time) return;

//         const formattedPrice = formatPrice(price, symbol);
//         const date = new Date((time as number) * 1000);
//         const formattedTime = date.toLocaleString("es-ES", {
//           day: "2-digit",
//           month: "2-digit",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//         });
//         setCurrentPrice(formattedPrice);
//         setCurrentTime(formattedTime);
//       });
//     } catch (err) {
//       console.error("Error configurando crosshair:", err);
//     }
//   }, [symbol]);

//   /* ------------------ Formato precio ------------------ */
//   const formatPrice = (price: number, sym: string | null): string =>
//     sym && sym.length === 6 ? price.toFixed(5) : price.toFixed(2);

//   /* ------------------ Suscribirse a eventos de scroll ------------------ */
//   const setupTimeScaleEvents = useCallback(() => {
//     if (!chartRef.current) return;

//     try {
//       const handleVisibleRangeChange = () => {
//         if (loadMoreTimeoutRef.current) {
//           clearTimeout(loadMoreTimeoutRef.current);
//         }

//         loadMoreTimeoutRef.current = setTimeout(() => {
//           checkLoadMoreData();
//         }, 300);
//       };

//       chartRef.current.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
//       chartRef.current.timeScale().subscribeSizeChange(handleVisibleRangeChange);
//     } catch (err) {
//       console.error("Error configurando eventos de timescale:", err);
//     }
//   }, [checkLoadMoreData]);

//   /* ------------------ Crear serie ------------------ */
//   const createSeries = useCallback(
//     (candles: CandleData[]) => {
//       if (!chartRef.current || candles.length === 0) return null;

//       try {
//         if (seriesRef.current) {
//           chartRef.current.removeSeries(seriesRef.current);
//           seriesRef.current = null;
//         }

//         let newSeries: ISeriesApi<"Candlestick" | "Line" | "Area">;

//         if (chartType === "line") {
//           newSeries = chartRef.current.addLineSeries({
//             color: "#4fa3ff",
//             lineWidth: 2,
//           });
//           newSeries.setData(candles.map((c) => ({ time: c.time, value: c.close } as LineData)));
//         } else if (chartType === "area") {
//           newSeries = chartRef.current.addAreaSeries({
//             lineColor: "#4fa3ff",
//             topColor: "rgba(79,163,255,0.4)",
//             bottomColor: "rgba(79,163,255,0.1)",
//           });
//           newSeries.setData(candles.map((c) => ({ time: c.time, value: c.close } as AreaData)));
//         } else {
//           newSeries = chartRef.current.addCandlestickSeries({
//             upColor: "#4caf50",
//             downColor: "#f44336",
//             borderVisible: false,
//             wickUpColor: "#4caf50",
//             wickDownColor: "#f44336",
//           });
//           newSeries.setData(
//             candles.map((c) => ({
//               time: c.time,
//               open: c.open,
//               high: c.high,
//               low: c.low,
//               close: c.close,
//             } as CandlestickData))
//           );
//         }

//         return newSeries;
//       } catch (err) {
//         console.error("Error creando serie:", err);
//         return null;
//       }
//     },
//     [chartType]
//   );

//   /* ------------------ Render Series ------------------ */
//   const renderSeries = useCallback(async (forceRefresh = false) => {
//     if (!chartRef.current || !isChartReady) {
//       // console.log('⏳ Chart no está listo, omitiendo render...');
//       return;
//     }

//     try {
//       const candles = await loadData(forceRefresh);
//       if (candles.length === 0) {
//         setError("No hay datos disponibles para mostrar");
//         return;
//       }

//       const newSeries = createSeries(candles);
//       if (newSeries) {
//         seriesRef.current = newSeries;

//         const timeScale = chartRef.current.timeScale();
//         const total = candles.length;

//         if (total > 0) {
//           const last = candles[total - 1].time;
//           const initialBars = Math.min(100, total);
//           const first = candles[Math.max(0, total - initialBars)].time;
//           timeScale.setVisibleRange({ from: first as Time, to: last as Time });
//         }

//         setupCrosshairEvents();

//         if (isInitialLoadRef.current) {
//           setupTimeScaleEvents();
//           isInitialLoadRef.current = false;
//         }
//       }
//     } catch (err) {
//       console.error("Error renderizando serie:", err);
//       setError("Error al renderizar el gráfico");
//     }
//   }, [isChartReady, createSeries, loadData, setupCrosshairEvents, setupTimeScaleEvents]);

//   /* ------------------ Effect para carga inicial ------------------ */
//   useEffect(() => {
//     if (isChartReady && isInitialLoadRef.current) {
//       // console.log('📊 Ejecutando carga inicial de datos...');
//       renderSeries(false);
//     }
//   }, [isChartReady, renderSeries]);

//   /* ------------------ Effect para cambio de tipo de chart ------------------ */
//   useEffect(() => {
//     if (isChartReady && currentDataRef.current.length > 0 && !isInitialLoadRef.current) {
//       // console.log('🔄 Cambiando tipo de gráfico...');
//       createSeries(currentDataRef.current);
//       setupCrosshairEvents();
//     }
//   }, [chartType, isChartReady, createSeries, setupCrosshairEvents]);

//   /* ------------------ Controles de Zoom ------------------ */
//   const handleZoom = (direction: "in" | "out" | "reset") => {
//     if (!chartRef.current) return;

//     try {
//       const timeScale = chartRef.current.timeScale();

//       if (direction === "reset") {
//         timeScale.fitContent();
//         return;
//       }

//       const range = timeScale.getVisibleRange();
//       if (!range) return;

//       const factor = direction === "in" ? 0.2 : -0.2;
//       const delta = (Number(range.to) - Number(range.from)) * factor;

//       const newFrom = (Number(range.from) + delta) as UTCTimestamp;
//       const newTo = (Number(range.to) - delta) as UTCTimestamp;

//       timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
//     } catch (err) {
//       console.error("Error en zoom:", err);
//     }
//   };

//   const handleRefresh = () => {
//     renderSeries(true);
//   };

//   /* ---------------------- Render UI ---------------------- */
//   const handleChartTypeChange = (value: string) =>
//     setChartType(value as ChartType);

//   useEffect(() => {
//     if (!mountedRef.current || !symbol || !isChartReady) return;

//     console.log(`🔁 Cambió el símbolo a: ${symbol} (${interval})`);

//     // 🔹 Limpiar cualquier serie o estado previo
//     cleanupChart();
//     initializeChart();

//     // 🔹 Resetear refs
//     currentDataRef.current = [];
//     currentIntervalRef.current = validateInterval(interval);
//     isInitialLoadRef.current = true;
//     setError(null);
//     setLastUpdate(null);
//     setCurrentPrice("");
//     setCurrentTime("");

//     // 🔹 Ejecutar render con nuevos datos
//     const timeout = setTimeout(() => {
//       renderSeries(true); // fuerza recarga desde API
//     }, 400);

//     return () => clearTimeout(timeout);
//   }, [symbol, interval, isChartReady, cleanupChart, initializeChart, validateInterval, renderSeries]);

//   return (
//     <Card className="bg-[#0b1d37] border border-[#1e3a5f] w-full h-[550px]">
//       <CardHeader className="flex flex-row justify-between items-center pb-2 px-4">
//         {/* Información del símbolo - Siempre visible */}
//         <div className="flex flex-col">
//           <div className="text-white text-base relative">
//             <strong>{symbol}</strong>
//             {currentTime && currentPrice && (
//               <div className="absolute top-8 left-0 lg:left-[-15px] ml-0 lg:ml-4 flex items-center z-10 no-wrap max-w-[200px] lg:max-w-2xl">
//                 <span className="text-sm truncate">{`${currentTime}: $${currentPrice}`}</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Menú hamburguesa para pantallas menores a lg (1024px) */}
//         <div className="xl:hidden">
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
//               >
//                 <Menu className="w-4 h-4" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="bg-[#0b1d37] text-white border-[#2e5b8c] w-64">
//               {/* Selector de Intervalo */}
//               <DropdownMenuLabel className="text-white">Intervalo</DropdownMenuLabel>
//               <DropdownMenuSeparator className="bg-[#2e5b8c]" />
//               {VALID_INTERVALS.map((item) => (
//                 <DropdownMenuItem
//                   key={item.value}
//                   className={`cursor-pointer hover:bg-[#153b6e] ${currentIntervalRef.current === item.value ? 'bg-[#153b6e]' : ''
//                     }`}
//                   onClick={() => {
//                     currentIntervalRef.current = item.value;
//                     isInitialLoadRef.current = true;
//                     renderSeries(true);
//                   }}
//                 >
//                   {item.label}
//                 </DropdownMenuItem>
//               ))}

//               <DropdownMenuSeparator className="bg-[#2e5b8c]" />

//               {/* Selector de Tipo de Gráfico */}
//               <DropdownMenuLabel className="text-white">Tipo de Gráfico</DropdownMenuLabel>
//               <DropdownMenuSeparator className="bg-[#2e5b8c]" />
//               <DropdownMenuItem
//                 className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'candlestick' ? 'bg-[#153b6e]' : ''
//                   }`}
//                 onClick={() => handleChartTypeChange('candlestick')}
//               >
//                 Candlestick
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'line' ? 'bg-[#153b6e]' : ''
//                   }`}
//                 onClick={() => handleChartTypeChange('line')}
//               >
//                 Línea
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'area' ? 'bg-[#153b6e]' : ''
//                   }`}
//                 onClick={() => handleChartTypeChange('area')}
//               >
//                 Área
//               </DropdownMenuItem>

//               <DropdownMenuSeparator className="bg-[#2e5b8c]" />

//               {/* Controles de Zoom y Acciones */}
//               <DropdownMenuLabel className="text-white">Controles</DropdownMenuLabel>
//               <DropdownMenuSeparator className="bg-[#2e5b8c]" />
//               <div className="flex flex-col gap-2 p-2">
//                 <div className="flex gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
//                     onClick={() => handleZoom("in")}
//                     disabled={isLoading}
//                   >
//                     <ZoomIn className="w-3 h-3 mr-1" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
//                     onClick={() => handleZoom("out")}
//                     disabled={isLoading}
//                   >
//                     <ZoomOut className="w-3 h-3 mr-1" />
//                   </Button>
//                 </div>
//                 <div className="flex gap-2">
//                   <Button
//                     variant="secondary"
//                     size="sm"
//                     className="flex-1 bg-[#153b6e] text-white hover:bg-[#1d4d8a] text-xs"
//                     onClick={() => handleZoom("reset")}
//                     disabled={isLoading}
//                   >
//                     <RotateCcw className="w-3 h-3 mr-1" />
//                     Reset
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
//                     onClick={handleRefresh}
//                     disabled={isLoading}
//                   >
//                     <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
//                     Actualizar
//                   </Button>
//                 </div>
//               </div>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>

//         {/* Controles para desktop - Ocultos en pantallas menores a lg (1024px) */}
//         <div className="hidden xl:flex items-center gap-3">
//           <div className="flex items-center gap-2">
//             <Label htmlFor="interval" className="text-white text-sm">
//               Intervalo:
//             </Label>
//             <Select
//               value={currentIntervalRef.current}
//               onValueChange={(value) => {
//                 currentIntervalRef.current = value;
//                 isInitialLoadRef.current = true;
//                 renderSeries(true);
//               }}
//             >
//               <SelectTrigger
//                 id="interval"
//                 className="w-[120px] bg-[#0b1d37] border-[#2e5b8c] text-white text-sm"
//               >
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent className="bg-[#0b1d37] text-white border-[#2e5b8c]">
//                 {VALID_INTERVALS.map((item) => (
//                   <SelectItem key={item.value} value={item.value}>
//                     {item.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex items-center gap-2">
//             <Label htmlFor="chartType" className="text-white text-sm">
//               Tipo:
//             </Label>
//             <Select value={chartType} onValueChange={handleChartTypeChange}>
//               <SelectTrigger
//                 id="chartType"
//                 className="w-[130px] bg-[#0b1d37] border-[#2e5b8c] text-white text-sm"
//               >
//                 <SelectValue placeholder="Seleccionar" />
//               </SelectTrigger>
//               <SelectContent className="bg-[#0b1d37] text-white border-[#2e5b8c]">
//                 <SelectItem value="candlestick">Candlestick</SelectItem>
//                 <SelectItem value="line">Línea</SelectItem>
//                 <SelectItem value="area">Área</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
//               onClick={() => handleZoom("in")}
//               disabled={isLoading}
//             >
//               <ZoomIn className="w-4 h-4 mr-1" /> +
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
//               onClick={() => handleZoom("out")}
//               disabled={isLoading}
//             >
//               <ZoomOut className="w-4 h-4 mr-1" /> −
//             </Button>
//             <Button
//               variant="secondary"
//               size="sm"
//               className="bg-[#153b6e] text-white hover:bg-[#1d4d8a]"
//               onClick={() => handleZoom("reset")}
//               disabled={isLoading}
//             >
//               <RotateCcw className="w-4 h-4 mr-1" />
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
//               onClick={handleRefresh}
//               disabled={isLoading}
//             >
//               <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
//             </Button>
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="relative w-full h-[500px]">
//         <div ref={chartContainerRef} className="absolute inset-0" />

//         {!isChartReady && (
//           <div className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
//             Inicializando gráfico...
//           </div>
//         )}

//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
//             <div className="flex items-center gap-2">
//               <RefreshCw className="w-4 h-4 animate-spin" />
//               Cargando datos...
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/30">
//             <div className="bg-red-900/80 border border-red-600 rounded-lg p-4 max-w-md">
//               <div className="flex items-center gap-2 text-red-200 mb-2">
//                 <AlertCircle className="w-5 h-5" />
//                 <span className="font-semibold">
//                   {error.includes('Límite') ? 'Límite de API' : 'Error'}
//                 </span>
//               </div>
//               <p className="text-red-100 text-sm">{error}</p>
//               <div className="flex gap-2 mt-3">
//                 <Button
//                   size="sm"
//                   className="bg-red-700 hover:bg-red-600 text-white"
//                   onClick={handleRefresh}
//                   disabled={isLoading}
//                 >
//                   {error.includes('Límite') ? 'Reintentar' : 'Reintentar'}
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   className="bg-transparent border-red-600 text-red-200 hover:bg-red-800"
//                   onClick={() => setError(null)}
//                 >
//                   Usar datos en cache
//                 </Button>
//               </div>
//               {error.includes('Límite') && (
//                 <p className="text-red-200 text-xs mt-2">
//                   💡 Usa una clave API diferente o espera 1 minuto
//                 </p>
//               )}
//             </div>
//           </div>
//         )}

//         {isLoadingMore && (
//           <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
//             <div className="bg-blue-900/80 border border-blue-600 rounded-lg px-3 py-2 flex items-center gap-2">
//               <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
//               <span className="text-blue-200 text-sm">
//                 {isLoadingMore === "backward" ? "Cargando datos históricos..." : "Cargando datos recientes..."}
//               </span>
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );

// }


"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type AreaData,
  type Time,
  UTCTimestamp,
} from "lightweight-charts";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, RotateCcw, RefreshCw, AlertCircle, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

interface CandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

type ChartType = "candlestick" | "line" | "area";
type LoadMoreDirection = "forward" | "backward" | null;

// Constantes
const CACHE_DURATION = 5 * 60 * 1000;
const VALID_INTERVALS = [
  { value: "1min", label: "1 Minuto" },
  { value: "5min", label: "5 Minutos" },
  { value: "15min", label: "15 Minutos" },
  { value: "30min", label: "30 Minutos" },
  { value: "60min", label: "1 Hora" }
];

// Cache global
const dataCache = new Map<string, {
  data: CandleData[];
  timestamp: number;
}>();

// Estado global para evitar inicializaciones múltiples
let isChartInitializing = false;

export default function AlphaCandleChart({
  symbol,
  interval,
}: {
  symbol: string;
  interval: string;
}) {
  // Refs consolidadas en un objeto para mejor organización
  const refs = useRef({
    chartContainer: null as HTMLDivElement | null,
    chart: null as IChartApi | null,
    series: null as ISeriesApi<"Candlestick" | "Line" | "Area"> | null,
    currentData: [] as CandleData[],
    currentInterval: interval ?? "5min",
    isInitialLoad: true,
    loadMoreTimeout: null as NodeJS.Timeout | null,
    resizeTimeout: null as NodeJS.Timeout | null,
    mounted: false,
    isLoadingMore: null as LoadMoreDirection,
    isLoading: false,
    lastLoad: { time: 0, direction: null as string | null }
  });

  // Estados
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentPrice, setCurrentPrice] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState<LoadMoreDirection>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isChangingSymbol, setIsChangingSymbol] = useState(false);

  // Funciones auxiliares memoizadas
  const getCacheKey = useCallback(() => `${symbol}-${refs.current.currentInterval}`, [symbol]);
  
  const validateInterval = useCallback((int?: string): string => {
    const value = int ?? "5min";
    const isValid = VALID_INTERVALS.some(item => item.value === value);
    return isValid ? value : "5min";
  }, []);

  const getIntervalInSeconds = useCallback((interval: string): number => {
    switch (interval) {
      case '1min': return 60;
      case '5min': return 5 * 60;
      case '15min': return 15 * 60;
      case '30min': return 30 * 60;
      case '60min': return 60 * 60;
      default: return 5 * 60;
    }
  }, []);

  const formatPrice = useCallback((price: number, sym: string | null): string =>
    sym && sym.length === 6 ? price.toFixed(5) : price.toFixed(2), []);

  // Funciones de manejo de datos
  const loadHistoricalData = useCallback(
    async (direction: "forward" | "backward", referenceTimeSeconds: number): Promise<CandleData[]> => {
      const now = Date.now();
      const { isLoadingMore, lastLoad } = refs.current;

      if (
        isLoadingMore &&
        now - lastLoad.time < 1500 &&
        lastLoad.direction === direction
      ) {
        return [];
      }

      if (error?.includes("Límite")) {
        return [];
      }

      try {
        refs.current.isLoadingMore = direction;
        refs.current.lastLoad = { time: now, direction };
        setIsLoadingMore(direction);

        const params = new URLSearchParams({
          symbol,
          interval: refs.current.currentInterval,
          historical: "true",
          direction,
          referenceTime: String(Math.floor(referenceTimeSeconds))
        });

        const res = await fetch(`/api/alpha-candles?${params.toString()}`);
        if (!res.ok) {
          console.error("❌ historical fetch status:", res.status);
          return [];
        }

        const newData: CandleData[] = await res.json();
        return newData.filter(
          (c) => c && typeof c.time === "number" && typeof c.close === "number"
        );
      } catch (err) {
        console.error("💥 Error cargando historical:", err);
        return [];
      } finally {
        refs.current.isLoadingMore = null;
        refs.current.lastLoad = { time: Date.now(), direction: null };
        setIsLoadingMore(null);
      }
    },
    [symbol, error]
  );

  const loadData = useCallback(async (forceRefresh = false): Promise<CandleData[]> => {
    if (refs.current.isLoading && !forceRefresh) {
      return refs.current.currentData;
    }

    const cacheKey = getCacheKey();
    const now = Date.now();

    if (!forceRefresh && dataCache.has(cacheKey)) {
      const cached = dataCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_DURATION) {
        refs.current.currentData = cached.data;
        return cached.data;
      }
    }

    refs.current.isLoading = true;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        symbol,
        interval: refs.current.currentInterval,
      });
      
      if (forceRefresh) {
        params.set("timestamp", String(Date.now()));
      }

      const res = await fetch(`/api/alpha-candles?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          throw new Error(`Límite de API alcanzado. Intenta nuevamente en ${retryAfter} segundos.`);
        } else if (res.status === 404) {
          throw new Error('Símbolo no encontrado o sin datos disponibles.');
        } else {
          throw new Error(errorData.error || `Error ${res.status} al cargar datos`);
        }
      }

      const candles: CandleData[] = await res.json();

      if (!candles || candles.length === 0) {
        throw new Error('No se encontraron datos para este símbolo');
      }

      const filteredData = candles.filter(
        (c) => c?.time && typeof c.open === "number" && typeof c.high === "number" &&
          typeof c.low === "number" && typeof c.close === "number"
      );

      dataCache.set(cacheKey, {
        data: filteredData,
        timestamp: now,
      });

      refs.current.currentData = filteredData;
      setLastUpdate(new Date());
      setError(null);

      return filteredData;
    } catch (err) {
      console.error("Error cargando datos:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);

      if (dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey)!;
        console.warn("⚠️ Usando datos cacheados debido a error:", errorMessage);
        refs.current.currentData = cached.data;

        if (errorMessage.includes('Límite')) {
          dataCache.set(cacheKey, {
            data: cached.data,
            timestamp: now,
          });
        }

        return cached.data;
      }

      return [];
    } finally {
      refs.current.isLoading = false;
      setIsLoading(false);
    }
  }, [symbol, getCacheKey]);

  // Funciones de manejo del gráfico
  const initializeChart = useCallback(() => {
    if (!refs.current.chartContainer || refs.current.chart || isChartInitializing) {
      return;
    }

    isChartInitializing = true;

    try {
      refs.current.chartContainer.innerHTML = "";

      const chart = createChart(refs.current.chartContainer, {
        layout: {
          background: { color: "#0b1d37" },
          textColor: "#ffffff",
          fontFamily: "Arial, sans-serif",
        },
        grid: {
          vertLines: { color: "#1b2a4a" },
          horzLines: { color: "#1b2a4a" },
        },
        width: refs.current.chartContainer.clientWidth,
        height: 500,
        timeScale: {
          borderColor: "#485c7b",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
          minBarSpacing: 2,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "#dfc035",
            width: 1,
            style: 2,
            labelBackgroundColor: "#dfc035",
          },
          horzLine: {
            color: "#dfc035",
            width: 1,
            style: 2,
            labelBackgroundColor: "#dfc035",
          },
        },
        localization: {
          locale: "es-ES",
          dateFormat: "dd/MM/yyyy",
        },
      });

      refs.current.chart = chart;
      setIsChartReady(true);
      setError(null);
    } catch (err) {
      console.error("Error al inicializar chart:", err);
      setError("Error al inicializar el gráfico");
      setIsChartReady(false);
    } finally {
      isChartInitializing = false;
    }
  }, []);

  const cleanupChart = useCallback(() => {
    setIsChartReady(false);
    setCurrentPrice("");
    setCurrentTime("");
    setError(null);

    const { loadMoreTimeout, resizeTimeout, series, chart } = refs.current;

    if (loadMoreTimeout) {
      clearTimeout(loadMoreTimeout);
      refs.current.loadMoreTimeout = null;
    }

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      refs.current.resizeTimeout = null;
    }

    if (series && chart) {
      try {
        chart.removeSeries(series);
      } catch (err) {
        console.error('Error removiendo series:', err);
      }
      refs.current.series = null;
    }

    if (chart) {
      try {
        chart.remove();
      } catch (err) {
        console.error('Error removiendo chart:', err);
      }
      refs.current.chart = null;
    }

    isChartInitializing = false;
  }, []);

  const createSeries = useCallback(
    (candles: CandleData[]) => {
      if (!refs.current.chart || candles.length === 0) return null;

      try {
        if (refs.current.series) {
          refs.current.chart.removeSeries(refs.current.series);
          refs.current.series = null;
        }

        let newSeries: ISeriesApi<"Candlestick" | "Line" | "Area">;

        if (chartType === "line") {
          newSeries = refs.current.chart.addLineSeries({
            color: "#4fa3ff",
            lineWidth: 2,
          });
          newSeries.setData(candles.map((c) => ({ time: c.time, value: c.close } as LineData)));
        } else if (chartType === "area") {
          newSeries = refs.current.chart.addAreaSeries({
            lineColor: "#4fa3ff",
            topColor: "rgba(79,163,255,0.4)",
            bottomColor: "rgba(79,163,255,0.1)",
          });
          newSeries.setData(candles.map((c) => ({ time: c.time, value: c.close } as AreaData)));
        } else {
          newSeries = refs.current.chart.addCandlestickSeries({
            upColor: "#4caf50",
            downColor: "#f44336",
            borderVisible: false,
            wickUpColor: "#4caf50",
            wickDownColor: "#f44336",
          });
          newSeries.setData(
            candles.map((c) => ({
              time: c.time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            } as CandlestickData))
          );
        }

        return newSeries;
      } catch (err) {
        console.error("Error creando serie:", err);
        return null;
      }
    },
    [chartType]
  );

  const updateSeriesWithData = useCallback((data: CandleData[]) => {
    if (!refs.current.series) return;

    try {
      if (chartType === "line") {
        (refs.current.series as ISeriesApi<"Line">).setData(
          data.map(c => ({ time: c.time, value: c.close } as LineData))
        );
      } else if (chartType === "area") {
        (refs.current.series as ISeriesApi<"Area">).setData(
          data.map(c => ({ time: c.time, value: c.close } as AreaData))
        );
      } else {
        (refs.current.series as ISeriesApi<"Candlestick">).setData(
          data.map(c => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          } as CandlestickData))
        );
      }
    } catch (err) {
      console.error("Error actualizando serie:", err);
    }
  }, [chartType]);

  const mergeDataWithoutDuplicates = useCallback((existingData: CandleData[], newData: CandleData[]): CandleData[] => {
    const dataMap = new Map<UTCTimestamp, CandleData>();

    existingData.forEach(candle => {
      dataMap.set(candle.time, candle);
    });

    newData.forEach(candle => {
      dataMap.set(candle.time, candle);
    });

    return Array.from(dataMap.values()).sort((a, b) => a.time - b.time);
  }, []);

  // Funciones de eventos
  const setupCrosshairEvents = useCallback(() => {
    if (!refs.current.chart || !refs.current.series) return;

    try {
      refs.current.chart.subscribeCrosshairMove((param) => {
        const data = param?.seriesData.get(refs.current.series!);
        if (!data) {
          setCurrentPrice("");
          setCurrentTime("");
          return;
        }

        let price: number | undefined;
        if ("value" in data && typeof data.value === "number") {
          price = data.value;
        } else if ("close" in data && typeof data.close === "number") {
          price = data.close;
        } else {
          setCurrentPrice("");
          setCurrentTime("");
          return;
        }

        const time = "time" in data && data.time ? data.time : param.time;
        if (!price || !time) return;

        const formattedPrice = formatPrice(price, symbol);
        const date = new Date((time as number) * 1000);
        const formattedTime = date.toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        setCurrentPrice(formattedPrice);
        setCurrentTime(formattedTime);
      });
    } catch (err) {
      console.error("Error configurando crosshair:", err);
    }
  }, [symbol, formatPrice]);

  const checkLoadMoreData = useCallback(async () => {
    const { chart, series, currentData, isLoadingMore, isLoading } = refs.current;
    
    if (!chart || !series || isLoadingMore || isLoading) return;

    try {
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) return;

      if (!currentData || currentData.length === 0) return;

      const earliest = currentData[0].time as number;
      const latest = currentData[currentData.length - 1].time as number;

      const visibleStart = Number(visibleRange.from);
      const visibleEnd = Number(visibleRange.to);

      const intervalSeconds = getIntervalInSeconds(refs.current.currentInterval);
      const buffer = intervalSeconds * 8;

      if (visibleStart <= earliest + buffer) {
        setIsLoadingMore("backward");
        refs.current.isLoadingMore = "backward";
        const hist = await loadHistoricalData("backward", earliest);
        if (hist.length) {
          const merged = mergeDataWithoutDuplicates(hist, currentData);
          refs.current.currentData = merged;
          updateSeriesWithData(merged);
          const cacheKey = getCacheKey();
          dataCache.set(cacheKey, { data: merged, timestamp: Date.now() });
        }
        setIsLoadingMore(null);
        refs.current.isLoadingMore = null;
      }

      if (visibleEnd >= latest - buffer) {
        setIsLoadingMore("forward");
        refs.current.isLoadingMore = "forward";
        const fwd = await loadHistoricalData("forward", latest);
        if (fwd.length) {
          const merged = mergeDataWithoutDuplicates(currentData, fwd);
          refs.current.currentData = merged;
          updateSeriesWithData(merged);
          const cacheKey = getCacheKey();
          dataCache.set(cacheKey, { data: merged, timestamp: Date.now() });
        }
        setIsLoadingMore(null);
        refs.current.isLoadingMore = null;
      }
    } catch (err) {
      console.error("❌ Error checkLoadMoreData:", err);
      setIsLoadingMore(null);
      refs.current.isLoadingMore = null;
    }
  }, [getIntervalInSeconds, getCacheKey, mergeDataWithoutDuplicates, loadHistoricalData, updateSeriesWithData]);

  const setupTimeScaleEvents = useCallback(() => {
    if (!refs.current.chart) return;

    try {
      const handleVisibleRangeChange = () => {
        if (refs.current.loadMoreTimeout) {
          clearTimeout(refs.current.loadMoreTimeout);
        }

        refs.current.loadMoreTimeout = setTimeout(() => {
          checkLoadMoreData();
        }, 300);
      };

      refs.current.chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      refs.current.chart.timeScale().subscribeSizeChange(handleVisibleRangeChange);
    } catch (err) {
      console.error("Error configurando eventos de timescale:", err);
    }
  }, [checkLoadMoreData]);

  // Funciones de renderizado
  const renderSeries = useCallback(async (forceRefresh = false) => {
    if (!refs.current.chart || !isChartReady) {
      return;
    }

    try {
      const candles = await loadData(forceRefresh);
      if (candles.length === 0) {
        setError("No hay datos disponibles para mostrar");
        return;
      }

      const newSeries = createSeries(candles);
      if (newSeries) {
        refs.current.series = newSeries;

        const timeScale = refs.current.chart.timeScale();
        const total = candles.length;

        if (total > 0) {
          const last = candles[total - 1].time;
          const initialBars = Math.min(100, total);
          const first = candles[Math.max(0, total - initialBars)].time;
          timeScale.setVisibleRange({ from: first as Time, to: last as Time });
        }

        setupCrosshairEvents();

        if (refs.current.isInitialLoad) {
          setupTimeScaleEvents();
          refs.current.isInitialLoad = false;
        }
      }
    } catch (err) {
      console.error("Error renderizando serie:", err);
      setError("Error al renderizar el gráfico");
    }
  }, [isChartReady, createSeries, loadData, setupCrosshairEvents, setupTimeScaleEvents]);

  // Funciones de control
  const handleZoom = useCallback((direction: "in" | "out" | "reset") => {
    if (!refs.current.chart) return;

    try {
      const timeScale = refs.current.chart.timeScale();

      if (direction === "reset") {
        timeScale.fitContent();
        return;
      }

      const range = timeScale.getVisibleRange();
      if (!range) return;

      const factor = direction === "in" ? 0.2 : -0.2;
      const delta = (Number(range.to) - Number(range.from)) * factor;

      const newFrom = (Number(range.from) + delta) as UTCTimestamp;
      const newTo = (Number(range.to) - delta) as UTCTimestamp;

      timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
    } catch (err) {
      console.error("Error en zoom:", err);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    renderSeries(true);
  }, [renderSeries]);

  const handleChartTypeChange = useCallback((value: string) => {
    setChartType(value as ChartType);
  }, []);

  const handleIntervalChange = useCallback((value: string) => {
    refs.current.currentInterval = value;
    refs.current.isInitialLoad = true;
    renderSeries(true);
  }, [renderSeries]);

  // Efectos principales
  useEffect(() => {
    if (refs.current.mounted) {
      return;
    }

    refs.current.mounted = true;
    refs.current.currentInterval = validateInterval(interval);

    initializeChart();

    return () => {
      refs.current.mounted = false;
      cleanupChart();
    };
  }, []);

  // Efecto de Resize - CORREGIDO
  useEffect(() => {
    // Este efecto se ejecuta solo una vez al montar y se limpia al desmontar.
    // La función handleResize siempre leerá el estado actual de las refs.
    const handleResize = () => {
      const { chart, chartContainer } = refs.current;
      if (!chart || !chartContainer) return;

      requestAnimationFrame(() => {
        // ¡Verificación CRUCIAL dentro del callback asíncrono!
        // El chart podría haber sido destruido entre la llamada y la ejecución del callback.
        if (refs.current.chart && refs.current.chartContainer) {
          refs.current.chart.applyOptions({
            width: refs.current.chartContainer.clientWidth,
          });
        }
      });
    };

    const debouncedResize = () => {
      if (refs.current.resizeTimeout) {
        clearTimeout(refs.current.resizeTimeout);
      }
      refs.current.resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    handleResize(); // Llamada inicial

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (refs.current.resizeTimeout) {
        clearTimeout(refs.current.resizeTimeout);
      }
    };
  }, []); // Array de dependencias vacío

  useEffect(() => {
    if (isChartReady && refs.current.isInitialLoad) {
      renderSeries(false);
    }
  }, [isChartReady, renderSeries]);

  useEffect(() => {
    if (isChartReady && refs.current.currentData.length > 0 && !refs.current.isInitialLoad) {
      createSeries(refs.current.currentData);
      setupCrosshairEvents();
    }
  }, [chartType, isChartReady, createSeries, setupCrosshairEvents]);

  useEffect(() => {
    if (!refs.current.mounted || !symbol) return;

    const handleSymbolChange = async () => {
      setIsChangingSymbol(true);
      cleanupChart();
      
      refs.current.currentData = [];
      refs.current.currentInterval = validateInterval(interval);
      refs.current.isInitialLoad = true;
      setError(null);
      setLastUpdate(null);
      setCurrentPrice("");
      setCurrentTime("");
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      initializeChart();
      
      const waitForChartReady = () => {
        return new Promise<void>((resolve) => {
          const checkReady = () => {
            if (isChartReady) {
              resolve();
            } else {
              setTimeout(checkReady, 50);
            }
          };
          checkReady();
        });
      };
      
      await waitForChartReady();
      
      renderSeries(true);
      setIsChangingSymbol(false);
    };

    handleSymbolChange();
  }, [symbol, interval]);

  // Memoizar componentes para mejorar rendimiento
  const chartControls = useMemo(() => (
    <div className="hidden xl:flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="interval" className="text-white text-sm">
          Intervalo:
        </Label>
        <Select
          value={refs.current.currentInterval}
          onValueChange={handleIntervalChange}
          disabled={isChangingSymbol}
        >
          <SelectTrigger
            id="interval"
            className="w-[120px] bg-[#0b1d37] border-[#2e5b8c] text-white text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0b1d37] text-white border-[#2e5b8c]">
            {VALID_INTERVALS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="chartType" className="text-white text-sm">
          Tipo:
        </Label>
        <Select value={chartType} onValueChange={handleChartTypeChange} disabled={isChangingSymbol}>
          <SelectTrigger
            id="chartType"
            className="w-[130px] bg-[#0b1d37] border-[#2e5b8c] text-white text-sm"
          >
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent className="bg-[#0b1d37] text-white border-[#2e5b8c]">
            <SelectItem value="candlestick">Candlestick</SelectItem>
            <SelectItem value="line">Línea</SelectItem>
            <SelectItem value="area">Área</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
          onClick={() => handleZoom("in")}
          disabled={isLoading || isChangingSymbol}
        >
          <ZoomIn className="w-4 h-4 mr-1" /> +
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
          onClick={() => handleZoom("out")}
          disabled={isLoading || isChangingSymbol}
        >
          <ZoomOut className="w-4 h-4 mr-1" /> −
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="bg-[#153b6e] text-white hover:bg-[#1d4d8a]"
          onClick={() => handleZoom("reset")}
          disabled={isLoading || isChangingSymbol}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
          onClick={handleRefresh}
          disabled={isLoading || isChangingSymbol}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  ), [chartType, handleIntervalChange, handleChartTypeChange, handleZoom, handleRefresh, isLoading, isChangingSymbol]);

  const mobileMenu = useMemo(() => (
    <div className="xl:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e]"
            disabled={isChangingSymbol}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#0b1d37] text-white border-[#2e5b8c] w-64">
          <DropdownMenuLabel className="text-white">Intervalo</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2e5b8c]" />
          {VALID_INTERVALS.map((item) => (
            <DropdownMenuItem
              key={item.value}
              className={`cursor-pointer hover:bg-[#153b6e] ${refs.current.currentInterval === item.value ? 'bg-[#153b6e]' : ''
                }`}
              onClick={() => handleIntervalChange(item.value)}
            >
              {item.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-[#2e5b8c]" />

          <DropdownMenuLabel className="text-white">Tipo de Gráfico</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2e5b8c]" />
          <DropdownMenuItem
            className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'candlestick' ? 'bg-[#153b6e]' : ''
              }`}
            onClick={() => handleChartTypeChange('candlestick')}
          >
            Candlestick
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'line' ? 'bg-[#153b6e]' : ''
              }`}
            onClick={() => handleChartTypeChange('line')}
          >
            Línea
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`cursor-pointer hover:bg-[#153b6e] ${chartType === 'area' ? 'bg-[#153b6e]' : ''
              }`}
            onClick={() => handleChartTypeChange('area')}
          >
            Área
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[#2e5b8c]" />

          <DropdownMenuLabel className="text-white">Controles</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2e5b8c]" />
          <div className="flex flex-col gap-2 p-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
                onClick={() => handleZoom("in")}
                disabled={isLoading || isChangingSymbol}
              >
                <ZoomIn className="w-3 h-3 mr-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
                onClick={() => handleZoom("out")}
                disabled={isLoading || isChangingSymbol}
              >
                <ZoomOut className="w-3 h-3 mr-1" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-[#153b6e] text-white hover:bg-[#1d4d8a] text-xs"
                onClick={() => handleZoom("reset")}
                disabled={isLoading || isChangingSymbol}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-[#10294a] text-white border-[#2e5b8c] hover:bg-[#153b6e] text-xs"
                onClick={handleRefresh}
                disabled={isLoading || isChangingSymbol}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [chartType, handleIntervalChange, handleChartTypeChange, handleZoom, handleRefresh, isLoading, isChangingSymbol]);

  return (
    <Card className="bg-[#0b1d37] border border-[#1e3a5f] w-full h-[550px]">
      <CardHeader className="flex flex-row justify-between items-center pb-2 px-4">
        <div className="flex flex-col">
          <div className="text-white text-base relative">
            <strong>{symbol}</strong>
            {currentTime && currentPrice && (
              <div className="absolute top-8 left-0 lg:left-[-15px] ml-0 lg:ml-4 flex items-center z-10 no-wrap max-w-[200px] lg:max-w-2xl">
                <span className="text-sm truncate">{`${currentTime}: $${currentPrice}`}</span>
              </div>
            )}
          </div>
        </div>

        {mobileMenu}
        {chartControls}
      </CardHeader>

      <CardContent className="relative w-full h-[500px]">
        <div ref={(el) => { refs.current.chartContainer = el; }} className="absolute inset-0" />

        {!isChartReady && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
            {isChangingSymbol ? "Cambiando símbolo..." : "Inicializando gráfico..."}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/30">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cargando datos...
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-red-900/80 border border-red-600 rounded-lg p-4 max-w-md">
              <div className="flex items-center gap-2 text-red-200 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {error.includes('Límite') ? 'Límite de API' : 'Error'}
                </span>
              </div>
              <p className="text-red-100 text-sm">{error}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-red-700 hover:bg-red-600 text-white"
                  onClick={handleRefresh}
                  disabled={isLoading || isChangingSymbol}
                >
                  {error.includes('Límite') ? 'Reintentar' : 'Reintentar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-red-600 text-red-200 hover:bg-red-800"
                  onClick={() => setError(null)}
                >
                  Usar datos en cache
                </Button>
              </div>
              {error.includes('Límite') && (
                <p className="text-red-200 text-xs mt-2">
                  💡 Usa una clave API diferente o espera 1 minuto
                </p>
              )}
            </div>
          </div>
        )}

        {isLoadingMore && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-900/80 border border-blue-600 rounded-lg px-3 py-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
              <span className="text-blue-200 text-sm">
                {isLoadingMore === "backward" ? "Cargando datos históricos..." : "Cargando datos recientes..."}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}