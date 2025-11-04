"use client";

import { useEffect, useRef, useState, ChangeEvent, useCallback } from "react";
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  type CandlestickData,
  type LineData,
  type AreaData
} from "lightweight-charts";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

type ChartType = "candlestick" | "line" | "area";

export default function AlphaCandleChart({
  symbol = "EURUSD",
  interval = "5min",
}: {
  symbol?: string | null;
  interval?: string;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Función para inicializar el chart
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    try {
      // Limpiar cualquier contenido previo
      if (chartContainerRef.current.children.length > 0) {
        chartContainerRef.current.innerHTML = '';
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#0b1d37' },
          textColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        },
        grid: {
          vertLines: { color: '#1b2a4a' },
          horzLines: { color: '#1b2a4a' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          borderColor: '#485c7b',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1, // Modo normal de crosshair
          vertLine: {
            color: '#dfc035',
            width: 1,
            style: 2, // Línea punteada
            labelBackgroundColor: '#dfc035',
          },
          horzLine: {
            color: '#dfc035',
            width: 1,
            style: 2, // Línea punteada
            labelBackgroundColor: '#dfc035',
          },
        },
        localization: {
          locale: 'es-ES', // Para formato español
          dateFormat: 'dd/MM/yyyy',
        },
      });

      if (chartContainerRef.current) {
        chartContainerRef.current.setAttribute('data-title', `${symbol} - ${interval}`);
        chartContainerRef.current.setAttribute('data-subtitle', `Última actualización: ${new Date().toLocaleTimeString()}`);
      }

      chartRef.current = chart;
      setIsChartReady(true);
      
    } catch (error) {
      console.error('Error al inicializar chart:', error);
      setIsChartReady(false);
    }
  }, [symbol, interval]);

  // Función para limpiar recursos
  const cleanupChart = useCallback(() => {
    setIsChartReady(false);
    setCurrentPrice("");
    setCurrentTime("");
    
    if (seriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch (error) {
        console.warn('Error al remover serie:', error);
      }
      seriesRef.current = null;
    }
    
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn('Error al remover chart:', error);
      }
      chartRef.current = null;
    }
  }, []);

  // Efecto para inicialización del chart
  useEffect(() => {
    initializeChart();

    return () => {
      cleanupChart();
    };
  }, [initializeChart, cleanupChart]);

  // Manejo del resize
  useEffect(() => {
    if (!chartContainerRef.current || !chartRef.current) return;

    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      
      const width = chartContainerRef.current.clientWidth;
      chartRef.current.applyOptions({ 
        width: Math.max(width, 100)
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Resize inicial
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isChartReady]);

  // Carga de datos
  const loadData = useCallback(async (): Promise<CandleData[]> => {
    try {
      const res = await fetch(`/api/alpha-candles?symbol=${symbol}&interval=${interval}`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const candles: CandleData[] = await res.json();

      if (!candles || !Array.isArray(candles)) {
        throw new Error("Formato de datos inválido");
      }

      return candles.filter(candle => 
        candle?.time && 
        typeof candle.open === 'number' &&
        typeof candle.high === 'number' &&
        typeof candle.low === 'number' &&
        typeof candle.close === 'number'
      );
    } catch (error) {
      console.error("Error cargando datos:", error);
      return [];
    }
  }, [symbol, interval]);

  // Configurar tooltips y eventos del crosshair
  const setupCrosshairEvents = useCallback(() => {
    if (!chartRef.current || !seriesRef.current) return;

    // Suscribirse a eventos del crosshair
    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param || !param.seriesData || !seriesRef.current) {
        setCurrentPrice("");
        setCurrentTime("");
        return;
      }

      const data = param.seriesData.get(seriesRef.current);
      
      if (data) {
        let price: number;
        let time: string;

        if ('value' in data) {
          // Para series de línea y área
          price = data.value;
          time = param.time as string;
        } else if ('close' in data) {
          // Para series de candlestick
          price = data.close;
          time = data.time as string;
        } else {
          return;
        }

        // Formatear precio según el símbolo
        const formattedPrice = formatPrice(price, symbol);
        setCurrentPrice(formattedPrice);
        
        // Formatear fecha/hora
        const date = new Date(time);
        const formattedTime = date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        setCurrentTime(formattedTime);
      }
    });
  }, [symbol]);

  // Función para formatear el precio según el símbolo
  const formatPrice = (price: number, sym: string | null): string => {
    // Para Forex (6 caracteres como EURUSD)
    if (sym && sym.length === 6) {
      return price.toFixed(5);
    }
    // Para índices y otros instrumentos
    return price.toFixed(2);
  };

  // Función para crear series (versión 4.1.6)
  const createSeries = useCallback((candles: CandleData[]) => {
    if (!chartRef.current) return null;

    try {
      // Remover serie existente
      if (seriesRef.current) {
        chartRef.current.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }

      let newSeries: ISeriesApi<"Candlestick" | "Line" | "Area">;

      if (chartType === "line") {
        newSeries = chartRef.current.addLineSeries({
          color: '#4fa3ff',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: symbol && symbol.length === 6 ? 5 : 2,
            minMove: symbol && symbol.length === 6 ? 0.00001 : 0.01,
          },
        });
        const lineData: LineData[] = candles.map(c => ({ 
          time: c.time, 
          value: c.close 
        }));
        newSeries.setData(lineData);
      } 
      else if (chartType === "area") {
        newSeries = chartRef.current.addAreaSeries({
          lineColor: '#4fa3ff',
          topColor: 'rgba(79, 163, 255, 0.4)',
          bottomColor: 'rgba(79, 163, 255, 0.1)',
          priceFormat: {
            type: 'price',
            precision: symbol && symbol.length === 6 ? 5 : 2,
            minMove: symbol && symbol.length === 6 ? 0.00001 : 0.01,
          },
        });
        const areaData: AreaData[] = candles.map(c => ({ 
          time: c.time, 
          value: c.close 
        }));
        newSeries.setData(areaData);
      } 
      else {
        // Candlestick - API para versión 4.1.6
        newSeries = chartRef.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat: {
            type: 'price',
            precision: symbol && symbol.length === 6 ? 5 : 2,
            minMove: symbol && symbol.length === 6 ? 0.00001 : 0.01,
          },
        });

        const candlestickData: CandlestickData[] = candles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        newSeries.setData(candlestickData);
      }

      return newSeries;
    } catch (error) {
      console.error('Error al crear serie:', error);
      return null;
    }
  }, [chartType, symbol]);

  // Renderizado de series
  const renderSeries = useCallback(async () => {
    if (!chartRef.current || !isChartReady) {
      console.warn('Chart no está listo para renderizar');
      return;
    }

    try {
    const candles = await loadData();
    if (candles.length === 0) {
      console.warn('No hay datos para mostrar');
      return;
    }

    if (chartContainerRef.current) {
      chartContainerRef.current.setAttribute('data-subtitle', `Última actualización: ${new Date().toLocaleTimeString()}`);
    }

    const newSeries = createSeries(candles);
    if (newSeries) {
        seriesRef.current = newSeries;
        chartRef.current.timeScale().fitContent();
        
        // Configurar eventos del crosshair después de crear la serie
        setupCrosshairEvents();
        
      }
    } catch (error) {
      console.error('Error al renderizar serie:', error);
    }
  }, [chartType, loadData, isChartReady, createSeries, setupCrosshairEvents]);

  // Efecto para renderizar cuando cambia el tipo de chart o los datos
  useEffect(() => {
    if (isChartReady) {
      renderSeries();
    }
  }, [chartType, isChartReady, renderSeries]);

  // Efecto para actualización periódica
  useEffect(() => {
    if (!isChartReady) return;

    const intervalId = setInterval(() => {
      renderSeries();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isChartReady, renderSeries]);

  const handleChartTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as ChartType);
  };

  return (
    <div style={{ width: "100%", height: "550px", position: "relative" }}>
      <div style={{ 
        marginBottom: "8px", 
        textAlign: "right",
        padding: "0 8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ color: "#ffffff" }}>
          {currentTime && currentPrice && (
            <div>
              {/* mostrar la fecha en formato legible */}
              <strong>{symbol}</strong> - {currentTime}: {currentPrice}
            </div>
          )}
        </div>
        
        <div>
          <label 
            htmlFor="chartType" 
            style={{ 
              marginRight: "8px", 
              fontWeight: 500,
              color: "#ffffff"
            }}
          >
            Tipo de gráfico:
          </label>
          <select
            id="chartType"
            value={chartType}
            onChange={handleChartTypeChange}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: "#0b1d37",
              color: "#fff",
              border: "1px solid #2e5b8c",
              cursor: "pointer",
            }}
          >
            <option value="candlestick">Candlestick</option>
            <option value="line">Línea</option>
            <option value="area">Área</option>
          </select>
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        style={{ 
          width: "100%", 
          height: "500px",
          position: "relative",
        }} 
      />
      {!isChartReady && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#ffffff",
          backgroundColor: "rgba(11, 29, 55, 0.9)",
          padding: "10px 20px",
          borderRadius: "5px"
        }}>
          Inicializando chart...
        </div>
      )}
    </div>
  );
}