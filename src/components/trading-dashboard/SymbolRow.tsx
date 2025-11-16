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

  /**
   * ==========================================================
   *  🔴 ANTES:
   *  const live = useMarketStore((s) => s.getLivePrice(symbol)) ?? price ?? 0;
   *
   *  PROBLEMA:
   *  Esto usaba SIEMPRE el precio del SSE si alguna vez existió,
   *  ignorando las reconsultas /api/markets en TradingDashboard.
   *
   *  AHORA:
   *  Usamos directamente el snapshot `price` del backend
   *  para que las reconsultas REST actualicen la UI correctamente.
   *
   *  Mantengo tu línea original comentada debajo para auditoría.
   * ==========================================================
   */

  // const live = useMarketStore((s) => s.getLivePrice(symbol)) ?? price ?? 0; // ⬅ ORIGINAL
  const live = price ?? 0; // ⬅ NUEVO: se usa el precio del backend


  // Spread visual basado en mercado
  const market = useMemo(() => marketOfSymbol(symbol), [symbol]);

  /**
   * ==========================================================
   *  🔴 ANTES (SPREADS SIMPLIFICADOS Y ALGO ALTOS):
   *
   *  const spreadPctByMarket: Record<string, number> = useMemo(
   *    () => ({
   *      fx: 0.0003,
   *      crypto: 0.003,
   *      acciones: 0.001,
   *      indices: 0.001,    // ⬅ SPY usaba este (0.1%)
   *      commodities: 0.001,
   *    }),
   *    []
   *  );
   *  const spread = spreadPctByMarket[market] ?? 0.002;
   *
   *  Comentario:
   *  - Estos spreads son válidos para simulación, pero son algo altos
   *    comparados con brokers reales (0.1%–0.3% vs 0.01%–0.05% típico).
   *
   *  AHORA:
   *  - Ajustamos a valores más cercanos a spreads típicos de brokers retail,
   *    expresados igualmente en porcentaje del precio (basis points).
   * ==========================================================
   */

  // const spreadPctByMarket: Record<string, number> = useMemo(
  //   () => ({
  //     fx: 0.0003,
  //     crypto: 0.003,
  //     acciones: 0.001,
  //     indices: 0.001,
  //     commodities: 0.001,
  //   }),
  //   []
  // );
  // const spread = spreadPctByMarket[market] ?? 0.002; // fallback 0.2% ⬅ ORIGINAL

  /**
   * ==========================================================
   *  ✅ NUEVO: SPREADS APROXIMADOS A BROKERS REALES (EN % DEL PRECIO)
   *
   *  NOTA:
   *  - Siguen siendo valores "modelo", pero mucho más cercanos a:
   *      • FX mayor: 0.01% (1 pip en 1.0000) → 0.0001
   *      • Crypto majors: 0.05%–0.10% → ~0.0008
   *      • Acciones USA grandes: 0.01%–0.03% → ~0.0002
   *      • Índices CFD/ETF (SPX/NDX): 0.02%–0.05% → ~0.0003
   *      • Commodities (XAUUSD/WTI): 0.03%–0.06% → ~0.0004
   *
   *  - El fallback 0.0005 (~0.05%) es razonable para cualquier símbolo
   *    no mapeado explícitamente.
   * ==========================================================
   */
  const spreadPctByMarket: Record<string, number> = useMemo(
    () => ({
      // FX mayor: ~0.01% (1 pip en 1.0000)
      fx: 0.0001,

      // Crypto majors (BTC, ETH): ~0.05%–0.10%
      crypto: 0.0008,

      // Acciones USA grandes (AAPL, MSFT, etc.): ~0.01%–0.03%
      acciones: 0.0002,

      // Índices tipo SPX/NDX vía CFD/ETF (SPY, QQQ, etc.): ~0.02%–0.05%
      indices: 0.0003,

      // Commodities (oro, petróleo): ~0.03%–0.06%
      commodities: 0.0004,
    }),
    []
  );

  // Fallback para mercados no mapeados: 0.0005 (~0.05% del precio)
  const spread = spreadPctByMarket[market] ?? 0.0005; // ⬅ NUEVO: más realista que 0.002 (0.2%)


  // Targets (BUY/SELL) derivados del precio (live)
  const targetSell = useMemo(() => Number((live * (1 + spread)).toFixed(2)), [live, spread]);
  const targetBuy = useMemo(() => Number((live * (1 - spread)).toFixed(2)), [live, spread]);

  /**
   * ==========================================================
   *  🔴 ANTES:
   *  El "change central" era calculado como targetSell - targetBuy,
   *  que siempre es un ~0.2% del precio, NO el "change" del backend.
   *
   *  Esto hacía que no coincidiera con el JSON real.
   *
   *  AHORA:
   *  El valor central utiliza `change` del backend.
   *
   *  Conservo tu cálculo original comentado.
   * ==========================================================
   */

  // const targetChange = useMemo(() => Number((targetSell - targetBuy).toFixed(2)), [targetSell, targetBuy]); // ⬅ ORIGINAL
  const targetChange = change ?? 0; // ⬅ NUEVO: refleja el change real del backend

  // Estados locales para animación
  const [sellPrice, setSellPrice] = useState(targetSell);
  const [buyPrice, setBuyPrice] = useState(targetBuy);
  const [changeValue, setChangeValue] = useState(Math.abs(targetChange)); // cambio absoluto

  const [sellColor, setSellColor] = useState("#b8b5b5");
  const [buyColor, setBuyColor] = useState("#b8b5b5");
  const [changeColor, setChangeColor] = useState("#16a34a");
  const [isNegative, setIsNegative] = useState(targetChange < 0);

  const prevSellRef = useRef(sellPrice);
  const prevBuyRef = useRef(buyPrice);
  const prevChangeRef = useRef(targetChange);

  const short = (v?: number) => (v !== undefined ? v.toFixed(2) : "-");

  /**
   * ==========================================================
   *  🔵 Mantengo todo tu sistema de colores/parpadeos,
   *     únicamente adaptándolo para usar el cambio REAL del backend.
   * ==========================================================
   */
  useEffect(() => {
    const newSell = targetSell;
    const newBuy = targetBuy;

    const prevSell = prevSellRef.current;
    const prevBuy = prevBuyRef.current;

    // variaciones SELL
    if (newSell > prevSell) setSellColor("#16a34a");
    else if (newSell < prevSell) setSellColor("#db3535");
    else setSellColor("#b8b5b5");

    // variaciones BUY
    if (newBuy > prevBuy) setBuyColor("#16a34a");
    else if (newBuy < prevBuy) setBuyColor("#db3535");
    else setBuyColor("#b8b5b5");

    setSellPrice(newSell);
    setBuyPrice(newBuy);

    prevSellRef.current = newSell;
    prevBuyRef.current = newBuy;
  }, [targetSell, targetBuy]);


  /**
   * ======================================================
   *  🔵 Ahora el cambio central usa `change` real del backend.
   *     Conservo tu mecanismo de colores/parpadeo.
   * ======================================================
   */
  useEffect(() => {
    const newChange = targetChange;
    const prevChange = prevChangeRef.current;

    // Color según suba o baje
    if (newChange > prevChange) {
      setChangeColor("#16a34a");
    } else if (newChange < prevChange) {
      setChangeColor("#db3535");
    }

    setIsNegative(newChange < 0);
    setChangeValue(Math.abs(newChange));

    prevChangeRef.current = newChange;
  }, [targetChange]);

  return (
    <div className="mx-1 my-2 mt-3 transition-all duration-200">
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
        <div className="flex items-center gap-2 leading-tight p-1">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {symbol}
          </span>
        </div>

        {/* SELL Button */}
        <div
          className="rounded-md transition-colors duration-300"
          style={{ backgroundColor: sellColor === "#b8b5b5" ? "transparent" : sellColor + "20" }}
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

        {/* CHANGE central — ahora basado en `change` del backend */}
        <div
          className="min-w-[35px] text-center text-[13px] font-semibold transition-colors duration-300"
          style={{ color: changeColor }}
        >
          {isNegative ? "▼" : "▲"} {changeValue.toFixed(2)}
        </div>

        {/* BUY Button */}
        <div
          className="rounded-md transition-colors duration-300"
          style={{ backgroundColor: buyColor === "#b8b5b5" ? "transparent" : buyColor + "20" }}
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
