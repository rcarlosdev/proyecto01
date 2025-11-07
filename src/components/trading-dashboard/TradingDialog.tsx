import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarketStore } from "@/stores/useMarketStore"
import { MARKETS } from "@/lib/markets"

interface TradingDialogProps {
  text: string;
  symbol: string | null;
  tipoOperacion: "buy" | "sell";
  colorText?: string;
}

export function TradingDialog({ text, symbol, tipoOperacion, colorText }: TradingDialogProps) {
  const [units, setUnits] = useState(10000)
  const [orderType, setOrderType] = useState("market")
  const [operationType, setOperationType] = useState(tipoOperacion || "buy") // "buy" o "sell"


  useEffect(() => {
    setOperationType(tipoOperacion);
  }, [tipoOperacion]);


  // const { dataSelectedSymbol, setDataSelectedSymbol } = useState();

  // const marketStore = useMarketStore();
  // const { selectedSymbol, setSelectedSymbol } = useMarketStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={colorText != undefined ? `text-[${colorText}]` : ''}>{text}</Button>
        {/* <Button variant="outline" className="text-[#16a34a]">{text}</Button> */}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Compar
            <Badge variant="secondary" className="ml-2">
              {symbol || "Símbolo"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configura los detalles de tu operación antes de proceder.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Selector Compra/Venta */}
          <Tabs
            value={operationType}
            onValueChange={(value: string) => setOperationType(value as "buy" | "sell")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="buy"
                className={`${operationType === "buy"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100"
                  }`}
              >
                Comprar
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className={`${operationType === "sell"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100"
                  }`}
              >
                Vender
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
                    onClick={() => setUnits(units - 1000)}
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
                    onClick={() => setUnits(units + 1000)}
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
            <Button variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              className={`flex-1 ${operationType === "buy"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {operationType === "buy" ? "Comprar" : "Vender"} {symbol}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}