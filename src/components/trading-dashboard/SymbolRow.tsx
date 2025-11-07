"use client";

import { useEffect, useState } from "react";
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

  // Colores de variación
  const [sellColor, setSellColor] = useState("#2B3245");
  const [buyColor, setBuyColor] = useState("#2B3245");

  const short = (v?: number) => (v !== undefined ? v.toFixed(2) : "-");
  const isNegative = changeValue < 0;

  const [imageExists, setImageExists] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simula variaciones pequeñas
      const sellVariation = (Math.random() - 0.5) * 0.6;
      const buyVariation = (Math.random() - 0.5) * 0.6;

      const newSell = +(sellPrice + sellVariation).toFixed(2);
      const newBuy = +(buyPrice + buyVariation).toFixed(2);

      // Actualiza color según cambio
      setSellColor(
        sellVariation > 0
          ? "#16a34a" // verde
          : sellVariation < 0
            ? "#dc2626" // rojo
            : "#2B3245"
      );
      setBuyColor(
        buyVariation > 0
          ? "#16a34a"
          : buyVariation < 0
            ? "#dc2626"
            : "#2B3245"
      );

      // Actualiza valores y cambio general
      setSellPrice(newSell);
      setBuyPrice(newBuy);
      setChangeValue(newSell - newBuy);

      // Restaurar color base después de 300 ms
      // setTimeout(() => {
      //   setSellColor("#2B3245");
      //   setBuyColor("#2B3245");
      // }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [sellPrice, buyPrice]);

  return (
    <div
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 p-3 rounded-md hover:opacity-90 transition cursor-pointer"
    >
      {/* Symbol */}
      <div
        onClick={() => setSelectedSymbol(symbol)}
        className="flex items-center gap-2 leading-tight"
      >
        {imageExists ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={`/symbols/${symbol}.png`}
              alt={symbol}
              width={32}
              height={32}
              className="object-contain"
              loading="lazy"
              priority={false}
              onError={() => setImageExists(false)} // 🔹 Si no se encuentra, oculta la imagen
            />
          </div>
        ) : (
          // 🔸 Fallback: mostrar solo el texto si la imagen no existe
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {symbol.charAt(0)}
          </div>
        )}

        <span className="text-sm font-semibold">{symbol}</span>
        {/* <span className="text-[11px] text-gray-400">
          {symbol.split(".")[0]}
        </span> */}
      </div>

      {/* Botón de vender */}
      {/* <div
        className="min-w-[70px] text-center px-2 py-1 rounded-md text-[13px] font-medium transition-colors duration-300 text-white"
        style={{ backgroundColor: sellColor }}
      >
        {short(sellPrice)}
      </div> */}
      <TradingDialog text={short(sellPrice)} symbol={symbol} tipoOperacion="buy" colorText={sellColor} />

      {/* Cambio */}
      <div
        className={`min-w-[35px] text-center text-[13px] font-semibold ${isNegative ? "text-red-500" : "text-green-500"
          }`}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changeValue).toFixed(2)}
      </div>

      {/* Botón de comprar */}
      {/* <div
        className="min-w-[70px] text-center px-2 py-1 rounded-md text-[13px] font-medium transition-colors duration-300 text-white"
        style={{ backgroundColor: buyColor }}
      >
        {short(buyPrice)}
      </div> */}
      {/* <TradingDialog text="Abrir Operación" symbol={selectedSymbol} /> */}
      <TradingDialog text={short(buyPrice)} symbol={symbol} tipoOperacion="sell" colorText={buyColor} />
    </div>
  );
}
