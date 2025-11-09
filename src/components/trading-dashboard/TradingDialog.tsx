// src/components/trading-dashboard/TradingDialog.tsx
import { useEffect, useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MARKETS } from "@/lib/markets"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/stores/useUserStore"
import { Separator } from "@/components/ui/separator"
import { useMarketStore } from "@/stores/useMarketStore"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import SYMBOLS_MAP from "@/lib/symbolsMap"
import { toast } from "sonner"

interface TradingDialogProps {
  text: string;
  symbol: string | null;
  tipoOperacion: "buy" | "sell";
  colorText: string;
  sellPrice: number;
  buyPrice: number;
}

// Configuración de márgenes por categoría
const MARGIN_CONFIG = {
  crypto: 0.05,
  forex: 0.03,
  indices: 0.05,
  acciones: 0.10,
  commodities: 0.08
};

const getCategoryBySymbol = (symbol: string | null) => {
  if (!symbol) return "crypto";
  for (const [category, symbols] of Object.entries(SYMBOLS_MAP)) {
    if (symbols.includes(symbol)) return category;
  }
  return "crypto";
};

export function TradingDialog({ text, symbol, tipoOperacion, colorText, sellPrice, buyPrice }: TradingDialogProps) {
  const [selectedUnitOption, setSelectedUnitOption] = useState(1)
  const [orderType, setOrderType] = useState("market")
  const [marketInfo, setMarketInfo] = useState<any | null>(null);
  const [operationType, setOperationType] = useState(tipoOperacion || "buy")
  const [isOpen, setIsOpen] = useState(false)
  const [imageExists, setImageExists] = useState(true);

  const { dataMarket } = useMarketStore();
  const { user, updateUserBalance } = useUserStore();

  const category = useMemo(() => getCategoryBySymbol(symbol), [symbol]);
  const marginRate = MARGIN_CONFIG[category as keyof typeof MARGIN_CONFIG] || 0.05;

  const currentPrice = useMemo(() => {
    if (operationType === "buy" && buyPrice !== undefined) return buyPrice;
    if (operationType === "sell" && sellPrice !== undefined) return sellPrice;
    const priceFromText = parseFloat(text.replace(/[^\d.-]/g, ''));
    return isNaN(priceFromText) ? 0 : priceFromText;
  }, [text, operationType, buyPrice, sellPrice]);

  // --- CALCULO MEJORADO DE CANTIDAD MAXIMA ---
  const maxUnits = useMemo(() => {
    if (!user?.balance || currentPrice <= 0 || marginRate <= 0) return 0;

    // Calculamos el máximo basado en el margen requerido
    const maxFromMargin = Math.floor(user.balance / (currentPrice * marginRate));

    // También verificamos que no exceda el valor total del balance
    const maxFromTotalValue = Math.floor(user.balance / currentPrice);

    // Tomamos el más conservador de los dos cálculos
    return Math.min(maxFromMargin, maxFromTotalValue);
  }, [user?.balance, currentPrice, marginRate]);

  // Ajustar automáticamente la unidad seleccionada si excede el máximo
  useEffect(() => {
    if (selectedUnitOption > maxUnits) {
      setSelectedUnitOption(maxUnits > 0 ? maxUnits : 1);
    }
  }, [maxUnits, selectedUnitOption]);

  // Generar opciones de unidades dinámicamente hasta el máximo
  const unitOptions = useMemo(() => {
    if (maxUnits <= 0) return [1];

    const options = [];

    // Si hay pocas unidades, mostramos todas
    if (maxUnits <= 15) {
      for (let i = 1; i <= maxUnits; i++) {
        options.push(i);
      }
    } else {
      // Para muchas unidades, mostramos opciones representativas
      const step = Math.max(1, Math.floor(maxUnits / 10));

      for (let i = 1; i <= maxUnits; i += step) {
        options.push(i);
        if (options.length >= 10) break;
      }

      // Asegurarnos de que la última opción sea el máximo
      if (options.length > 0 && options[options.length - 1] < maxUnits) {
        options[options.length - 1] = maxUnits;
      }
    }

    return options;
  }, [maxUnits]);

  const calculations = useMemo(() => {
    const cantidad = selectedUnitOption;
    const valor = cantidad * currentPrice;
    const margenEstimado = valor * marginRate;
    return { cantidad, valor, margenEstimado };
  }, [selectedUnitOption, currentPrice, marginRate]);

  const hasSufficientBalance = useMemo(() => {
    if (!user?.balance) return false;

    // Verificar que tenemos suficiente para el margen requerido
    // y que el valor total no excede el balance (para seguridad)
    return user.balance >= calculations.margenEstimado &&
      calculations.valor <= user.balance;
  }, [user?.balance, calculations.valor, calculations.margenEstimado]);

  useEffect(() => {
    if (symbol) {
      const market = (MARKETS as any).find((market: any) => market.symbol === symbol);
      setMarketInfo(market || null);
    }
  }, [symbol]);

  useEffect(() => {
    setOperationType(tipoOperacion);
  }, [tipoOperacion]);

  const dialogTitle = operationType === "buy" ? "Comprar" : "Vender";

  async function handleConfirmTrade() {
    if (!user?.id) {
      console.error("No authenticated user - cannot open trade");
      return;
    }

    try {
      const res = await fetch("/api/trade/open", { // ✅ ruta corregida
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, // ✅ debe coincidir con userId del backend
          symbol: symbol,
          side: operationType, // 'buy' o 'sell'
          entryPrice: currentPrice, // ✅ corregido (antes era price)
          quantity: calculations.cantidad, // ✅ ok
          leverage: 1, // puedes hacer dinámico este valor si lo agregas en el UI
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al abrir operación");

      // console.log("✅ Trade abierto:", data.trade);

      // 🔹 Opcional: puedes actualizar balance o UI localmente aquí
      // refreshBalance()
      // addTradeToList(data.trade)

      // toast.success('Operación abierta exitosamente');
      alert('Operación abierta exitosamente');
      updateUserBalance(Number(data.trade.balanceAfter));
      // setIsOpen(false);


    } catch (err) {
      console.error("❌ Error al abrir operación:", err);
      // toast.error('Error al abrir la operación: ' + String(err));
      alert('Error al abrir la operación: ' + String(err));
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" style={colorText ? { color: colorText } : undefined} className="min-w-[60px]">
          {text}
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
              <Badge variant="outline" className={`${operationType === "buy" ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(currentPrice, "en-US", "USD")}
              </Badge>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-normal mr-1">Margen estimado:</span>
              <Badge variant="outline">{formatCurrency(calculations.margenEstimado, "en-US", "USD")}</Badge>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-normal mr-1">Saldo disponible:</span>
              {user && user.balance && (
                <Badge variant="outline" className={`${user.balance <= 0 ? "text-red-500" : "text-green-500"}`}>
                  {formatCurrency(user.balance, "en-US", "USD")}
                </Badge>
              )}
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
              className={`${operationType === "buy" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition-colors duration-200 cursor-pointer`}
              onClick={() => setOperationType("buy")}
            >
              Comprar
            </Button>
            <Button
              variant={operationType === "sell" ? "default" : "outline"}
              className={`${operationType === "sell" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition-colors duration-200 cursor-pointer`}
              onClick={() => setOperationType("sell")}
            >
              Vender
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Detalles de la operación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contenedor con altura máxima y scroll */}
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
                    {unitOptions.map((unit) => {
                      const valor = unit * currentPrice;
                      const margen = valor * marginRate;
                      return (
                        <tr
                          key={unit}
                          className={`hover:bg-gray-800/40 cursor-pointer transition-colors ${selectedUnitOption === unit ? "bg-gray-800/60" : ""
                            }`}
                          onClick={() => setSelectedUnitOption(unit)}
                        >
                          <td className="py-2 px-3 font-medium">{unit.toLocaleString()}</td>
                          <td className="py-2 px-3">{formatCurrency(valor, "en-US", "USD")}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatCurrency(margen, "en-US", "USD")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Cantidad máxima disponible: <span className="font-semibold text-white">{maxUnits.toLocaleString()}</span> unidades
              </div>

              <div className={`text-xs text-center ${hasSufficientBalance ? "text-green-500" : "text-red-500"}`}>
                {hasSufficientBalance
                  ? "✓ Saldo suficiente para abrir esta operación"
                  : "✗ Saldo insuficiente para esta operación"}
              </div>
            </CardContent>
          </Card>

          <DialogFooter></DialogFooter>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              onClick={handleConfirmTrade}
              disabled={!hasSufficientBalance || calculations.cantidad <= 0}
            >
              Abrir Operación | {symbol}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
