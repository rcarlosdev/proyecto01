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
  const { setSelectedSymbol } = useMarketStore();

  // Precio en vivo desde el store (SSE centralizado) con fallback a prop.price
  const live = useMarketStore((s) => s.getLivePrice(symbol)) ?? price ?? 0;

  // Spread visual basado en mercado
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

  // Actualiza valores/colores cuando cambian los targets
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

    // variaciones SELL / BUY
    if (newSell > prevSell) setSellColor("#16a34a");
    else if (newSell < prevSell) setSellColor("#db3535");
    else setSellColor("#2B3245");

    if (newBuy > prevBuy) setBuyColor("#16a34a");
    else if (newBuy < prevBuy) setBuyColor("#db3535");
    else setBuyColor("#2B3245");

    setSellPrice(newSell);
    setBuyPrice(newBuy);
    setChangeValue(newChange);

    prevSellRef.current = newSell;
    prevBuyRef.current = newBuy;
    prevChangeRef.current = newChange;
  }, [targetSell, targetBuy, targetChange]);

  return (
    // Contenedor principal: sin bordes, solo margen/padding
    <div className="mx-1 my-2 mt-3 transition-all duration-200">
      {/* Contenedor interior: fondo y borde (invertidos respecto al anterior), hover suave */}
      <div
        onClick={() => setSelectedSymbol(symbol)}
        className="
          grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 p-2
          rounded-xl border border-[var(--color-border)]
          bg-[var(--color-surface-alt)]
          hover:bg-[var(--color-surface)]
          transition-colors cursor-pointer
        "
      >
        {/* Symbol */}
        <div className="flex items-center gap-2 leading-tight p-1">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {symbol}
          </span>
        </div>

        {/* Botón de vender (no tocar estilos internos ni fondo dinámico) */}
        <div
          className="rounded-md transition-colors duration-300"
          style={{ backgroundColor: sellColor === "#2B3245" ? "transparent" : sellColor + "20" }}
        >
          <TradingDialog
            text={short(sellPrice)}
            symbol={symbol}
            tipoOperacion="buy"
            colorText={sellColor}
            sellPrice={sellPrice}
            buyPrice={buyPrice}
          />
        </div>

        {/* Cambio (no tocar estilos ni color) */}
        <div
          className="min-w-[35px] text-center text-[13px] font-semibold transition-colors duration-300"
          style={{ color: changeColor }}
        >
          {isNegative ? "▼" : "▲"} {Math.abs(changeValue).toFixed(2)}
        </div>

        {/* Botón de comprar (no tocar estilos internos ni fondo dinámico) */}
        <div
          className="rounded-md transition-colors duration-300"
          style={{ backgroundColor: buyColor === "#2B3245" ? "transparent" : buyColor + "20" }}
        >
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
    </div>
  );
}
