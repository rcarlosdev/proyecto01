"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import SYMBOLS_MAP from "@/lib/symbolsMap";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { Separator } from "@/components/ui/separator";
import { useMarketStore } from "@/stores/useMarketStore";

export interface TradingDialogProps {
  text: string;                       // fallback legible (p.ej. "123.45")
  symbol: string | null;
  tipoOperacion: "buy" | "sell";
  colorText: string;
  /** Fallbacks si no hay precio en vivo aún */
  sellPrice?: number;
  buyPrice?: number;
}

/* ===================== Helpers ===================== */
function marketOfSymbol(sym: string | null): keyof typeof SYMBOLS_MAP | "acciones" {
  if (!sym) return "acciones";
  const S = sym.toUpperCase();
  for (const [m, arr] of Object.entries(SYMBOLS_MAP)) {
    if (arr.map((x) => x.toUpperCase()).includes(S)) return m as keyof typeof SYMBOLS_MAP;
  }
  return "acciones";
}

const MARGIN_CONFIG = {
  crypto: 0.05,
  fx: 0.03,              // usa 'fx' (coincide con tu symbolsMap)
  indices: 0.05,
  acciones: 0.10,
  commodities: 0.08,
} as const;

const SPREAD_BY_MARKET: Record<string, number> = {
  fx: 0.0003,
  crypto: 0.003,
  acciones: 0.001,
  indices: 0.001,
  commodities: 0.001,
};

/* ===================== Componente ===================== */
export function TradingDialog({
  text,
  symbol,
  tipoOperacion,
  colorText,
  sellPrice: sellPriceProp,
  buyPrice: buyPriceProp,
}: TradingDialogProps) {
  const [selectedUnitOption, setSelectedUnitOption] = useState<number>(1);
  const [operationType, setOperationType] = useState<"buy" | "sell">(tipoOperacion || "buy");
  const [isOpen, setIsOpen] = useState(false);
  const [imageExists, setImageExists] = useState(true);

  const { user, updateUserBalance } = useUserStore();

  // ✅ Selector que re-renderiza cuando cambia el precio del símbolo en el store
  const liveFromStore = useMarketStore((s) => {
    if (!symbol) return undefined;
    const S = symbol.toUpperCase();
    // 1) intentar livePrices
    const live = s.livePrices[S];
    if (typeof live === "number") return live;
    // 2) fallback a snapshot dataMarket
    const row = s.dataMarket.find((q) =>
      [q.symbol, (q as any).ticker, (q as any).code]
        .map((x) => String(x || "").toUpperCase())
        .includes(S)
    );
    return typeof row?.price === "number" ? row.price : undefined;
  });

  const market = useMemo(() => marketOfSymbol(symbol), [symbol]);
  const marginRate = MARGIN_CONFIG[market as keyof typeof MARGIN_CONFIG] ?? 0.05;
  const spread = SPREAD_BY_MARKET[market] ?? 0.002;

  // Precio medio: primero store, si no hay -> parse de 'text', por último props heredadas.
  const liveMid = useMemo(() => {
    if (typeof liveFromStore === "number" && Number.isFinite(liveFromStore)) return liveFromStore;

    const fromText = parseFloat(String(text ?? "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(fromText)) return fromText;

    // último último recurso: si venían props de SymbolRow
    const propMid =
      typeof buyPriceProp === "number" && typeof sellPriceProp === "number"
        ? (buyPriceProp + sellPriceProp) / 2
        : (buyPriceProp ?? sellPriceProp ?? 0);

    return Number.isFinite(propMid) ? (propMid as number) : 0;
  }, [liveFromStore, text, buyPriceProp, sellPriceProp]);

  // Derivar bid/ask desde liveMid (consistente con SymbolRow)
  const derivedSell = useMemo(
    () => Number((liveMid * (1 + spread)).toFixed(2)),
    [liveMid, spread]
  );
  const derivedBuy = useMemo(
    () => Number((liveMid * (1 - spread)).toFixed(2)),
    [liveMid, spread]
  );

  // Precio actual según operación (con fallback a props)
  const currentPrice = useMemo(() => {
    if (operationType === "buy") {
      if (Number.isFinite(derivedBuy)) return derivedBuy;
      if (Number.isFinite(buyPriceProp || NaN)) return buyPriceProp as number;
    } else {
      if (Number.isFinite(derivedSell)) return derivedSell;
      if (Number.isFinite(sellPriceProp || NaN)) return sellPriceProp as number;
    }
    const priceFromText = parseFloat(String(text).replace(/[^\d.-]/g, ""));
    return Number.isFinite(priceFromText) ? priceFromText : 0;
  }, [operationType, derivedBuy, derivedSell, buyPriceProp, sellPriceProp, text]);

  // Máximo de unidades (conservador)
  const maxUnits = useMemo(() => {
    const balance = Number(user?.balance ?? 0);
    if (balance <= 0 || currentPrice <= 0 || marginRate <= 0) return 0;

    const maxFromMargin = Math.floor(balance / (currentPrice * marginRate));
    const maxFromTotalValue = Math.floor(balance / currentPrice);
    const max = Math.min(maxFromMargin, maxFromTotalValue);

    return Number.isFinite(max) && max > 0 ? max : 0;
  }, [user?.balance, currentPrice, marginRate]);

  // Mantener selección dentro del rango
  useEffect(() => {
    if (maxUnits <= 0) setSelectedUnitOption(0);
    else if (selectedUnitOption < 1 || selectedUnitOption > maxUnits) setSelectedUnitOption(1);
  }, [maxUnits, selectedUnitOption]);

  // Opciones de unidades (limito por performance)
  const unitOptions = useMemo(() => {
    if (maxUnits <= 0) return [];
    return Array.from({ length: Math.min(maxUnits, 500) }, (_, i) => i + 1);
  }, [maxUnits]);

  // Cálculos principales
  const calculations = useMemo(() => {
    const cantidad = Number(selectedUnitOption ?? 0);
    const valor = cantidad * currentPrice;
    const margenEstimado = valor * marginRate;
    return {
      cantidad: Number.isFinite(cantidad) ? cantidad : 0,
      valor: Number.isFinite(valor) ? valor : 0,
      margenEstimado: Number.isFinite(margenEstimado) ? margenEstimado : 0,
    };
  }, [selectedUnitOption, currentPrice, marginRate]);

  const hasSufficientBalance = useMemo(() => {
    const balance = Number(user?.balance ?? 0);
    const { valor, margenEstimado } = calculations;
    if (!Number.isFinite(balance) || !Number.isFinite(valor) || !Number.isFinite(margenEstimado)) return false;
    return balance >= margenEstimado && valor <= balance;
  }, [user?.balance, calculations]);

  // Sincroniza tipo de operación con prop
  useEffect(() => {
    setOperationType(tipoOperacion);
  }, [tipoOperacion]);

  const dialogTitle = operationType === "buy" ? "Comprar" : "Vender";
  const short = (v?: number) => (typeof v === "number" ? v.toFixed(2) : "-");

  /* ===================== Confirmar operación ===================== */
  async function handleConfirmTrade() {
    if (!user?.id) {
      console.error("No authenticated user - cannot open trade");
      return;
    }
    try {
      const res = await fetch("/api/trade/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          symbol,
          side: operationType,
          entryPrice: currentPrice,
          quantity: calculations.cantidad,
          leverage: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al abrir operación");

      alert("Operación abierta exitosamente");
      if (typeof data?.trade?.balanceAfter === "number") {
        updateUserBalance(Number(data.trade.balanceAfter));
      }
      // setIsOpen(false);
    } catch (err) {
      console.error("❌ Error al abrir operación:", err);
      alert("Error al abrir la operación: " + String(err));
    }
  }

  // Label dinámico del botón (usa el bid/ask derivado; text queda como fallback visual)
  const triggerLabel = useMemo(() => {
    const dynamic = operationType === "buy" ? derivedBuy : derivedSell;
    if (Number.isFinite(dynamic)) return short(dynamic);
    const parsed = parseFloat(String(text ?? "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return short(parsed);
    return text;
  }, [operationType, derivedBuy, derivedSell, text]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          style={colorText ? { color: colorText } : undefined}
          className="min-w-[60px]"
          onClick={() => setIsOpen(true)}
          title={symbol || undefined}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-[#202126] border border-gray-50/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pt-2">
            {imageExists ? (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={`/symbols/${symbol}.png`}
                  alt={symbol || "Símbolo"}
                  width={32}
                  height={32}
                  className="object-contain"
                  loading="lazy"
                  onError={() => setImageExists(false)}
                />
              </div>
            ) : (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground border border-gray-500">
                {symbol?.charAt(0)}
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{dialogTitle}</span>
                <Separator orientation="vertical" className="h-4 bg-gray-500" />
                <Badge variant="secondary" className="px-2 py-1">{symbol}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{symbol} vs USD</div>
            </div>
          </DialogTitle>

          <div className="text-lg font-bold flex justify-between gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-normal mr-1">Precio actual:</span>
              <Badge variant="outline" className={operationType === "buy" ? "text-green-500" : "text-red-500"}>
                {formatCurrency(currentPrice, "en-US", "USD")}
              </Badge>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-normal mr-1">Margen estimado:</span>
              <Badge variant="outline">
                {formatCurrency(calculations.margenEstimado, "en-US", "USD")}
              </Badge>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-normal mr-1">Saldo disponible:</span>
              {(() => {
                const balance = Number(user?.balance ?? 0);
                if (!Number.isFinite(balance)) {
                  return <Badge variant="outline" className="text-red-500">—</Badge>;
                }
                return (
                  <Badge variant="outline" className={balance <= 0 ? "text-red-500" : "text-green-500"}>
                    {formatCurrency(balance, "en-US", "USD")}
                  </Badge>
                );
              })()}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription>
          Rellena los detalles para abrir una nueva operación de {dialogTitle.toLowerCase()} en {symbol}.
        </DialogDescription>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={operationType === "buy" ? "default" : "outline"}
              className={`${operationType === "buy"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } transition-colors duration-200 cursor-pointer`}
              onClick={() => setOperationType("buy")}
            >
              Comprar
            </Button>
            <Button
              variant={operationType === "sell" ? "default" : "outline"}
              className={`${operationType === "sell"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } transition-colors duration-200 cursor-pointer`}
              onClick={() => setOperationType("sell")}
              disabled   // habilita cuando soportes ventas
            >
              Vender
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Detalles de la operación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[200px] overflow-y-auto border border-gray-700 rounded-md">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#181a20] z-10">
                    <tr className="text-gray-400 text-left border-b border-gray-700">
                      <th className="py-2 px-3 font-semibold">Unidades</th>
                      <th className="py-2 px-3 font-semibold">Valor total</th>
                      <th className="py-2 px-3 font-semibold">Margen estimado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitOptions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-center text-muted-foreground">
                          No hay unidades disponibles con el saldo y el margen actuales.
                        </td>
                      </tr>
                    ) : (
                      unitOptions.map((unit) => {
                        const valor = unit * currentPrice;
                        const margen = valor * marginRate;
                        return (
                          <tr
                            key={unit}
                            className={`hover:bg-gray-800/40 cursor-pointer transition-colors ${selectedUnitOption === unit ? "bg-gray-800/60" : ""}`}
                            onClick={() => setSelectedUnitOption(unit)}
                          >
                            <td className="py-2 px-3 font-medium">{unit.toLocaleString()}</td>
                            <td className="py-2 px-3">{formatCurrency(valor, "en-US", "USD")}</td>
                            <td className="py-2 px-3 text-muted-foreground">{formatCurrency(margen, "en-US", "USD")}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Cantidad máxima disponible:{" "}
                <span className="font-semibold text-white">{maxUnits.toLocaleString()}</span> unidades
              </div>

              <div className={`text-xs text-center ${hasSufficientBalance ? "text-green-500" : "text-red-500"}`}>
                {hasSufficientBalance
                  ? "✓ Saldo suficiente para abrir esta operación"
                  : maxUnits <= 0
                    ? "✗ Sin unidades disponibles con el saldo y margen actual"
                    : "✗ Saldo insuficiente para esta operación"}
              </div>
            </CardContent>
          </Card>

          <DialogFooter />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              onClick={handleConfirmTrade}
              disabled={!hasSufficientBalance || calculations.cantidad <= 0 || maxUnits <= 0}
            >
              Abrir Operación | {symbol}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
