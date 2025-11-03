"use client";

import { useMarketStore } from "@/stores/useMarketStore";
// import { useMarketStore } from "@/stores/useMarketStore";
import { ArrowDown } from "lucide-react";

export default function MarketHeader() {
  const { dataMarket } = useMarketStore();

  return (
    <div className="flex justify-between items-center p-4 border-b rounded-t-md">
      {/* Izquierda: título y acciones */}
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-sm">
          Mercado ({dataMarket.length})
        </span>

        <div className="flex items-center space-x-1 text-muted-foreground">
          {/* <LayoutList className="h-4 w-4" /> */}
          <ArrowDown className="h-4 w-4" />
        </div>
      </div>

      {/* Derecha: botones de filtro */}
      <div className="flex items-center space-x-2">
        {/* <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Todos
        </Button> */}

        {/* <Button
          size="sm"
          variant={filter === "favorites" ? "default" : "outline"}
          onClick={() => setFilter("favorites")}
        >
          Favoritos
        </Button> */}

        {/* <Button
          size="sm"
          variant={filter === "positive" ? "default" : "outline"}
          onClick={() => setFilter("positive")}
        >
          En alza
        </Button> */}


        {/* <Button size="sm" variant="ghost">
          Comprar
          </Button> */}
        {/* <Button size="sm" variant="ghost">
          Vender
          </Button> */}

        <span className="">Comprar</span>
        <div className="w-px h-5 mx-1" />
        <span className="">Vender</span>


        {/* <Button variant="ghost" size="icon">
          <Filter className="h-4 w-4" />
        </Button> */}
      </div>
    </div>
  );
}
