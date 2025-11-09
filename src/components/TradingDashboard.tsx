// src/components/TradingDashboard.tsx

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useMarketStore } from "@/stores/useMarketStore";
import { MARKETS } from '@/lib/markets'; // Asegúrate de que esta ruta sea correcta

// 🔹 Importaciones dinámicas (evita cargar ambas versiones al mismo tiempo)
const TradingDashboardDesktop = dynamic(
  () => import("./trading-dashboard/TradingDashboardDesktop"),
  { ssr: false }
);

const TradingDashboardMobile = dynamic(
  () => import("./trading-dashboard/mobile/TradingDashboardMobile"),
  { ssr: false }
);

type Market = typeof MARKETS[number];

export default function TradingDashboard() {
  const [isMobile, setIsMobile] = useState(false);
  
  // 👈 INICIO: Lógica de carga de datos centralizada
  const { selectedSymbol, setSelectedSymbol, selectedMarket, setDataMarket } = useMarketStore();

  const loadData = useCallback(
    async (market: Market) => {
      // Esta función ahora solo se encarga de cargar el mercado que se le pasa.
      // La lógica para decidir qué mercado cargar está en el useEffect de abajo.
      if (!market) return;
      
      try {
        const res = await fetch(`/api/markets?market=${encodeURIComponent(market)}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        setDataMarket(data);
        // Solo establece un símbolo si no hay uno ya seleccionado para evitar sobrescribir la selección del usuario.
        if (!selectedSymbol) {
          setSelectedSymbol(data[0]?.symbol || null);
        }
      } catch (error) {
        console.error("Failed to load market data:", error);
        setDataMarket([]); // Limpia los datos en caso de error
      }
    },
    [setDataMarket, setSelectedSymbol, selectedSymbol]
  );

  // Mantener símbolo seleccionado si sigue existiendo en el nuevo dataset
  useEffect(() => {
    // 👉 CAMBIO CLAVE: Decide qué mercado cargar.
    // Si el mercado seleccionado es 'all' o null, cargamos 'indices' como valor por defecto para tener datos.
    // Si no, cargamos el mercado seleccionado por el usuario.
    const marketToFetch = (!selectedMarket || selectedMarket === 'all') ? "indices" : selectedMarket;

    loadData(marketToFetch);

    // El intervalo de actualización también debe usar el mercado resuelto.
    const id = setInterval(() => loadData(marketToFetch), 20_000);
    return () => clearInterval(id);
  }, [selectedMarket, loadData]); // Se ejecutará cada vez que selectedMarket cambie.
  // 👈 FIN: Lógica de carga de datos

  // Lógica para detectar si la vista es móvil
  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 850);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return (
    <div className="w-full h-full">
      {isMobile ? <TradingDashboardMobile /> : <TradingDashboardDesktop />}
    </div>
  );
}