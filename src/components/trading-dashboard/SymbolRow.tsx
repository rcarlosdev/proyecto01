// src/components/trading-dashboard/SymbolRow.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MarketQuote } from "@/types/interfaces";
import { useMarketStore } from "@/stores/useMarketStore";
import { TradingDialog } from "./TradingDialog";
import SYMBOLS_MAP from "@/lib/symbolsMap";

/** Mapea símbolo -> market para definir el spread visual */
function marketOfSymbol(sym: string): keyof typeof SYMBOLS_MAP | "acciones" {
  const S = sym.toUpperCase();
  for (const [m, arr] of Object.entries(SYMBOLS_MAP)) {
    if (arr.map((x) => x.toUpperCase()).includes(S)) return m as keyof typeof SYMBOLS_MAP;
  }
  return "acciones";
}

export default function SymbolRow({
  symbol,
  price,
  high,
  low,
  previousClose,
  change,
  changePercent,
  latestTradingDay,
}: MarketQuote) {
  const { setSelectedSymbol, getLivePrice } = useMarketStore();

  // Precio en vivo desde el store (SSE centralizado) con fallback a prop.price
  const live = useMarketStore((s) => s.getLivePrice(symbol)) ?? price ?? 0;

  // Spread visual “como antes”, pero basado en live
  const market = useMemo(() => marketOfSymbol(symbol), [symbol]);
  const spreadPctByMarket: Record<string, number> = useMemo(
    () => ({
      fx: 0.0003,
      crypto: 0.003,
      acciones: 0.001,
      indices: 0.001,
      commodities: 0.001,
    }),
    []
  );
  const spread = spreadPctByMarket[market] ?? 0.002;

  // Targets derivados del precio en vivo
  const targetSell = useMemo(() => Number((live * (1 + spread)).toFixed(2)), [live, spread]);
  const targetBuy = useMemo(() => Number((live * (1 - spread)).toFixed(2)), [live, spread]);
  const targetChange = useMemo(() => Number((targetSell - targetBuy).toFixed(2)), [targetSell, targetBuy]);

  // Estado visual (parpadeos y valores mostrados)
  const [sellPrice, setSellPrice] = useState(targetSell);
  const [buyPrice, setBuyPrice] = useState(targetBuy);
  const [changeValue, setChangeValue] = useState(targetChange);

  const [sellColor, setSellColor] = useState("#2B3245");
  const [buyColor, setBuyColor] = useState("#2B3245");
  const [changeColor, setChangeColor] = useState("#16a34a");
  const [isNegative, setIsNegative] = useState(false);

  const prevSellRef = useRef(sellPrice);
  const prevBuyRef = useRef(buyPrice);
  const prevChangeRef = useRef(changeValue);

  const short = (v?: number) => (v !== undefined ? v.toFixed(2) : "-");

  // Actualiza valores y colores cuando cambian los targets (cada tick del SSE)
  useEffect(() => {
    const newSell = targetSell;
    const newBuy = targetBuy;
    const newChange = targetChange;

    const prevSell = prevSellRef.current;
    const prevBuy = prevBuyRef.current;
    const prevChange = prevChangeRef.current;

    // variación del "cambio"
    if (newChange > prevChange) {
      setChangeColor("#16a34a");
      setIsNegative(false);
    } else if (newChange < prevChange) {
      setChangeColor("#db3535");
      setIsNegative(true);
    }

    // variaciones SELL / BUY para parpadeo
    if (newSell > prevSell) setSellColor("#16a34a");
    else if (newSell < prevSell) setSellColor("#db3535");
    else setSellColor("#2B3245");

    if (newBuy > prevBuy) setBuyColor("#16a34a");
    else if (newBuy < prevBuy) setBuyColor("#db3535");
    else setBuyColor("#2B3245");

    // aplicar valores
    setSellPrice(newSell);
    setBuyPrice(newBuy);
    setChangeValue(newChange);

    // guardar referencias
    prevSellRef.current = newSell;
    prevBuyRef.current = newBuy;
    prevChangeRef.current = newChange;
  }, [targetSell, targetBuy, targetChange]);

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 p-3 rounded-md hover:opacity-90 transition">
      {/* Symbol */}
      <div onClick={() => setSelectedSymbol(symbol)} className="flex items-center gap-2 leading-tight cursor-pointer">
        <span className="text-sm font-semibold">{symbol}</span>
      </div>

      {/* Botón de vender (usa sellPrice) */}
      <div
        className="rounded-md transition-colors duration-300"
        style={{ backgroundColor: sellColor === "#2B3245" ? "transparent" : sellColor + "20" }}
      >
        {/* NO modificar estilos ni colores del botón interno */}
        <TradingDialog
          text={short(sellPrice)}
          symbol={symbol}
          tipoOperacion="buy"
          colorText={sellColor}
          sellPrice={sellPrice}
          buyPrice={buyPrice}
        />
      </div>

      {/* Cambio (NO tocar estilos ni color) */}
      <div
        className="min-w-[35px] text-center text-[13px] font-semibold transition-colors duration-300"
        style={{ color: changeColor }}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changeValue).toFixed(2)}
      </div>

      {/* Botón de comprar (mantiene su estilo interno y fondo dinámico externo) */}
      <div
        className="rounded-md transition-colors duration-300"
        style={{
          // conservar el fondo que tenían los valores numéricos
          backgroundColor:
            buyColor === "#2B3245" ? "transparent" : buyColor + "20",
        }}
      >
        {/* NO modificar estilos ni colores del botón interno */}
        <TradingDialog
          text={short(buyPrice)}
          symbol={symbol}
          tipoOperacion="sell"
          colorText={buyColor}
          sellPrice={sellPrice}
          buyPrice={buyPrice}
        />
      </div>
    </div>
  );
}
