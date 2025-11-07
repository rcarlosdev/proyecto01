"use client";

import { useEffect, useRef, useState } from "react";
import { MarketQuote } from "@/types/interfaces";
import { useMarketStore } from "@/stores/useMarketStore";
import Image from "next/image";
import { TradingDialog } from "./TradingDialog";

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

  // Valores simulados
  const [sellPrice, setSellPrice] = useState(price);
  const [buyPrice, setBuyPrice] = useState(previousClose ?? price);
  const [changeValue, setChangeValue] = useState(change ?? 0);

  // Colores y dirección
  const [sellColor, setSellColor] = useState("#2B3245");
  const [buyColor, setBuyColor] = useState("#2B3245");
  const [changeColor, setChangeColor] = useState("#16a34a");
  const [isNegative, setIsNegative] = useState(false);

  // Guardar valores previos
  const prevSellRef = useRef(sellPrice);
  const prevBuyRef = useRef(buyPrice);
  const prevChangeRef = useRef(changeValue);

  const [imageExists, setImageExists] = useState(true);
  const short = (v?: number) => (v !== undefined ? v.toFixed(2) : "-");

  useEffect(() => {
    const interval = setInterval(() => {
      const sellVariation = (Math.random() - 0.5) * 0.6;
      const buyVariation = (Math.random() - 0.5) * 0.6;

      const newSell = +(sellPrice + sellVariation).toFixed(2);
      const newBuy = +(buyPrice + buyVariation).toFixed(2);
      const newChange = +(newSell - newBuy).toFixed(2);

      // --- Cambio general ---
      const prevChange = prevChangeRef.current;
      const wentUp = newChange > prevChange;
      const wentDown = newChange < prevChange;

      if (wentUp) {
        setChangeColor("#16a34a");
        setIsNegative(false);
      } else if (wentDown) {
        setChangeColor("#db3535");
        setIsNegative(true);
      }

      // --- Detectar cambios en SELL ---
      const prevSell = prevSellRef.current;
      if (newSell > prevSell) {
        setSellColor("#16a34a"); // verde
      } else if (newSell < prevSell) {
        setSellColor("#db3535"); // rojo
      }

      // --- Detectar cambios en BUY ---
      const prevBuy = prevBuyRef.current;
      if (newBuy > prevBuy) {
        setBuyColor("#16a34a");
      } else if (newBuy < prevBuy) {
        setBuyColor("#db3535");
      }

      // Actualizar valores
      setSellPrice(newSell);
      setBuyPrice(newBuy);
      setChangeValue(newChange);

      // Guardar referencias previas
      prevSellRef.current = newSell;
      prevBuyRef.current = newBuy;
      prevChangeRef.current = newChange;
    }, 2000);

    return () => clearInterval(interval);
  }, [sellPrice, buyPrice]);


  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 p-3 rounded-md hover:opacity-90 transition cursor-pointer">
      {/* Symbol */}
      <div
        onClick={() => setSelectedSymbol(symbol)}
        className="flex items-center gap-2 leading-tight"
      >
        {/* {imageExists ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={`/symbols/${symbol}.png`}
              alt={symbol}
              width={32}
              height={32}
              className="object-contain"
              loading="lazy"
              onError={() => setImageExists(false)}
            />
          </div>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {symbol.charAt(0)}
          </div>
        )} */}
        <span className="text-sm font-semibold">{symbol}</span>
      </div>

      {/* Botón de vender */}
      <div
        className="rounded-md transition-colors duration-300"
        style={{
          backgroundColor:
            sellColor === "#2B3245" ? "transparent" : sellColor + "20",
        }}
      >
        <TradingDialog
          text={short(sellPrice)}
          symbol={symbol}
          tipoOperacion="buy"
          colorText={sellColor}
        />
      </div>

      {/* Cambio */}
      <div
        className={`min-w-[35px] text-center text-[13px] font-semibold transition-colors duration-300`}
        style={{ color: changeColor }}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changeValue).toFixed(2)}
      </div>

      {/* Botón de comprar */}
      <div
        className="rounded-md transition-colors duration-300"
        style={{
          backgroundColor:
            buyColor === "#2B3245" ? "transparent" : buyColor + "20",
        }}
      >
        <TradingDialog
          text={short(buyPrice)}
          symbol={symbol}
          tipoOperacion="sell"
          colorText={buyColor}
        />
      </div>
    </div>
  );
}
