"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

import SYMBOLS_MAP from "@/lib/symbolsMap";
import { formatCurrency } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";
import { useMarketStore } from "@/stores/useMarketStore";

import { ModeToggle } from "./trading-dialog-components/ModeToggle";
import { SideToggle } from "./trading-dialog-components/SideToggle";
import { UnitsTable } from "./trading-dialog-components/UnitsTable";
import { OrderPanelMarket } from "./trading-dialog-components/OrderPanelMarket";
import { DialogHeaderTrade } from "./trading-dialog-components/DialogHeaderTrade";
import { OrderPanelPending } from "./trading-dialog-components/OrderPanelPending";
import { toast } from "sonner";

export interface TradingDialogProps {
  text: string;
  symbol: string | null;
  tipoOperacion: "buy" | "sell";
  colorText: string;
  sellPrice?: number;
  buyPrice?: number;
}

type Mode = "market" | "pending";
type TriggerRule = "gte" | "lte";

/* ===== Helpers originales ===== */
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
  fx: 0.03,
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

export function TradingDialog({
  text,
  symbol,
  tipoOperacion,
  colorText,
  sellPrice: sellPriceProp,
  buyPrice: buyPriceProp,
}: TradingDialogProps) {
  /* ===== Estado general ===== */
  const [isOpen, setIsOpen] = useState(false);
  const [imageExists, setImageExists] = useState(true);
  const [operationType, setOperationType] = useState<"buy" | "sell">(tipoOperacion || "buy");

  // nuevo: modo de orden
  const [mode, setMode] = useState<Mode>("market");

  // unidades (se conserva la UX original)
  const [selectedUnitOption, setSelectedUnitOption] = useState<number>(1);

  // pending-only
  const [triggerPrice, setTriggerPrice] = useState<string>("");
  const [triggerRule, setTriggerRule] = useState<TriggerRule>("gte");

  const { user, updateUserBalance } = useUserStore();

  // live price del store (igual que antes)
  const liveFromStore = useMarketStore((s) => {
    if (!symbol) return undefined;
    const S = symbol.toUpperCase();
    const live = s.livePrices[S];
    if (typeof live === "number") return live;
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

  // mid price con fallbacks (igual que antes)
  const liveMid = useMemo(() => {
    if (typeof liveFromStore === "number" && Number.isFinite(liveFromStore)) return liveFromStore;

    const fromText = parseFloat(String(text ?? "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(fromText)) return fromText;

    const propMid =
      typeof buyPriceProp === "number" && typeof sellPriceProp === "number"
        ? (buyPriceProp + sellPriceProp) / 2
        : (buyPriceProp ?? sellPriceProp ?? 0);

    return Number.isFinite(propMid) ? (propMid as number) : 0;
  }, [liveFromStore, text, buyPriceProp, sellPriceProp]);

  const derivedSell = useMemo(() => Number((liveMid * (1 + spread)).toFixed(4)), [liveMid, spread]);
  const derivedBuy = useMemo(() => Number((liveMid * (1 - spread)).toFixed(4)), [liveMid, spread]);

  // precio “actual” según lado
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

  // máximo de unidades (sin cambios)
  const maxUnits = useMemo(() => {
    const balance = Number(user?.balance ?? 0);
    if (balance <= 0 || currentPrice <= 0 || marginRate <= 0) return 0;
    const maxFromMargin = Math.floor(balance / (currentPrice * marginRate));
    const maxFromTotalValue = Math.floor(balance / currentPrice);
    const max = Math.min(maxFromMargin, maxFromTotalValue);
    return Number.isFinite(max) && max > 0 ? max : 0;
  }, [user?.balance, currentPrice, marginRate]);

  useEffect(() => {
    if (maxUnits <= 0) setSelectedUnitOption(0);
    else if (selectedUnitOption < 1 || selectedUnitOption > maxUnits) setSelectedUnitOption(1);
  }, [maxUnits, selectedUnitOption]);


  const unitOptions = useMemo(() => {
    if (maxUnits <= 0) return [];

    const options: number[] = [];
    for (let i = 1; i <= maxUnits;) {
      options.push(i);

      // Determina el salto según el rango en el que se encuentra 'i'
      let step;
      if (i < 10) {
        step = 1;
      } else if (i < 100) {
        step = 10;
      } else if (i < 1000) {
        step = 50; // Asegura que aparezcan 100, 150, 200, 250...
      } else if (i < 10000) {
        step = 500; // Asegura 1000, 1500, 2000...
      } else if (i < 100000) {
        step = 5000;
      } else {
        // Para números muy grandes, el salto es 5 * 10^(n-1)
        // donde n es el número de dígitos de i.
        const magnitude = Math.floor(Math.log10(i));
        step = 5 * Math.pow(10, magnitude - 1);
      }

      i += step;
    }

    // Asegurarse de que maxUnits sea la última opción si no está ya en la lista
    if (options[options.length - 1] !== maxUnits) {
      options.push(maxUnits);
    }

    return options;
  }, [maxUnits]);

  // cálculos principales (igual que antes)
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
    const { margenEstimado } = calculations;
    if (!Number.isFinite(balance) || !Number.isFinite(margenEstimado)) return false;
    return balance >= margenEstimado;
  }, [user?.balance, calculations]);

  // sincroniza tipo de operación con prop (como antes)
  useEffect(() => {
    setOperationType(tipoOperacion);
  }, [tipoOperacion]);

  // Título, label y helpers
  const dialogTitle = operationType === "buy" ? "Comprar" : "Vender";
  const short = (v?: number) => (typeof v === "number" ? v.toFixed(4) : "-");

  // label del botón que dispara el diálogo (igual)
  const triggerLabel = useMemo(() => {
    const dynamic = operationType === "buy" ? derivedBuy : derivedSell;
    if (Number.isFinite(dynamic)) return short(dynamic);
    const parsed = parseFloat(String(text ?? "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return short(parsed);
    return text;
  }, [operationType, derivedBuy, derivedSell, text]);

  /* ===== Handlers: mismo funcionamiento ===== */
  async function handleConfirmTrade() {
    if (!user?.id) return toast.error("No autenticado");
    if (!hasSufficientBalance) return toast.error("Saldo insuficiente para abrir la operación");
    if (calculations.cantidad <= 0) return toast.error("Selecciona una cantidad válida de unidades");

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
      toast.success("Operación abierta exitosamente");
      if (typeof data?.trade?.balanceAfter === "number") {
        updateUserBalance(Number(data.trade.balanceAfter));
      }
      setIsOpen(false);
    } catch (err) {
      console.error("❌ Error al abrir operación:", err);
      toast.error("Error al abrir la operación: " + String(err));
    }
  }

  // pending
  const triggerPriceNum = useMemo(
    () => Number(String(triggerPrice).replace(/[^\d.-]/g, "")),
    [triggerPrice]
  );
  const pendingValid =
    mode === "pending" &&
    symbol &&
    calculations.cantidad > 0 &&
    Number.isFinite(triggerPriceNum) &&
    triggerPriceNum > 0;

  async function handleCreatePending() {
    if (!user?.id) return toast.error("No autenticado");
    if (!pendingValid) return toast.error("Revisa el precio objetivo y la condición");
    try {
      const res = await fetch("/api/trade/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          symbol,
          side: operationType,
          quantity: calculations.cantidad,
          leverage: 1,
          triggerPrice: triggerPriceNum,
          triggerRule,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la operación pendiente");
      toast.success("Orden pendiente creada");
      setIsOpen(false);
    } catch (err) {
      console.error("❌ Error creando pendiente:", err);
      toast.error("Error creando pendiente: " + String(err));
    }
  }

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

      <DialogContent className="sm:max-w-[480px] bg-[#202126] border border-gray-50/80">
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

            {/* Header compactado y reutilizable */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{dialogTitle}</span>
                <Separator orientation="vertical" className="h-4 bg-gray-500" />
                <Badge variant="secondary" className="px-2 py-1">{symbol}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{symbol} vs USD</div>
            </div>
          </DialogTitle>

          {/* Resumen (igual estilo) */}
          <DialogHeaderTrade
            currentPrice={currentPrice}
            operationType={operationType}
            userBalance={Number(user?.balance ?? 0)}
            marginEstimate={calculations.margenEstimado}
            formatCurrency={formatCurrency}
          />
        </DialogHeader>

        <DialogDescription>
          Elige si deseas abrir al precio de mercado o crear una orden pendiente automatizada.
        </DialogDescription>

        {/* Modo y lado */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <SideToggle side={operationType} onChange={setOperationType} disableSell />
        </div>

        {/* Tabla de unidades (sin cambios visuales) */}
        <UnitsTable
          currentPrice={currentPrice}
          marginRate={marginRate}
          unitOptions={unitOptions}
          selectedUnit={selectedUnitOption}
          onSelectUnit={setSelectedUnitOption}
          formatCurrency={formatCurrency}
          maxUnits={maxUnits}
          hasSufficientBalance={hasSufficientBalance}
        />

        {/* Panel según modo */}
        {mode === "market" ? (
          <OrderPanelMarket
            symbol={symbol}
            disabled={!hasSufficientBalance || calculations.cantidad <= 0 || maxUnits <= 0}
            onConfirm={handleConfirmTrade}
          />
        ) : (
          <OrderPanelPending
            symbol={symbol}
            triggerPrice={triggerPrice}
            setTriggerPrice={setTriggerPrice}
            triggerRule={triggerRule}
            setTriggerRule={setTriggerRule}
            currentPrice={currentPrice}
            disabled={!pendingValid || calculations.cantidad <= 0}
            onCreatePending={handleCreatePending}
          />
        )}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
