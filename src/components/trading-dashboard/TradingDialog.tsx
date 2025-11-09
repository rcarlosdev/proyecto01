// src/components/trading-dashboard/TradingDialog.tsx
import { useEffect, useState } from "react"
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

interface TradingDialogProps {
  text: string;
  symbol: string | null;
  tipoOperacion: "buy" | "sell";
  colorText?: string;
}

export function TradingDialog({ text, symbol, tipoOperacion, colorText }: TradingDialogProps) {
  const [units, setUnits] = useState(10000)
  const [orderType, setOrderType] = useState("market")
  const [marketInfo, setMarketInfo] = useState<any | null>(null); // Cambiar a null
  const [operationType, setOperationType] = useState(tipoOperacion || "buy")
  const [isOpen, setIsOpen] = useState(false)
  const [imageExists, setImageExists] = useState(true);

  const { dataMarket } = useMarketStore();
  const { user } = useUserStore();

  // SOLUCIÓN: Mover la lógica de marketInfo a un useEffect
  useEffect(() => {
    if (symbol) {
      const market = (MARKETS as any).find((market: any) => market.symbol === symbol);
      setMarketInfo(market || null);
    }
  }, [symbol]);

  useEffect(() => {
    setOperationType(tipoOperacion);
  }, [tipoOperacion]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          style={colorText ? { color: colorText } : undefined}
        >
          {text}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-[#181a20e7] border border-gray-50/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
            <Badge variant="secondary" className="ml-2">
              {symbol || "Símbolo"}
            </Badge>
            {/* SOLUCIÓN: Verificar que marketInfo existe antes de acceder a balance */}
            {marketInfo && marketInfo.balance && (
              <span className="text-sm font-medium text-muted-foreground">
                {marketInfo.balance}
              </span>
            )}
            {/* Opcional: Mostrar un mensaje si no hay balance */}
            {marketInfo && !marketInfo.balance && (
              <span className="text-sm font-medium text-muted-foreground">
                Sin balance disponible
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Configura los detalles de tu operación antes de proceder.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Selector Compra/Venta con Botones */}
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
            >
              Vender
            </Button>
          </div>

          {/* Sección Unidades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Unidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnits(prev => Math.max(1000, prev - 1000))}
                    disabled={units <= 1000}
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold min-w-[100px] text-center">
                    {units.toLocaleString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnits(prev => prev + 1000)}
                  >
                    +
                  </Button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Valor del pip:</div>
                  <div className="font-semibold">€1,000.00</div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Margen estimado:</span>
                <span className="font-semibold">€155,920.00</span>
              </div>
            </CardContent>
          </Card>

          {/* Sección Tipo de orden */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tipo de orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="advanced"
                  name="orderType"
                  value="advanced"
                  checked={orderType === "advanced"}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="advanced" className="text-sm">
                  Opciones avanzadas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="market"
                  name="orderType"
                  value="market"
                  checked={orderType === "market"}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="market" className="text-sm">
                  Orden de mercado
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Botón de acción */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              className={`flex-1 ${operationType === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                } cursor-pointer`}
              onClick={() => {
                console.log(`Operación: ${operationType} ${symbol} - Unidades: ${units}`);
                setIsOpen(false);
              }}
            >
              {operationType === "buy" ? "Comprar" : "Vender"} {symbol}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}