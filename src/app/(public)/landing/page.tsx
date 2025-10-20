// src/app/(public)/landing/page.tsx
"use client";

import { useEffect, useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import AnywhereSection from "@/components/landing/AnywhereSection";
import LeverageSection from "@/components/landing/LeverageSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import MarketSection from "@/components/landing/MarketSection";
import { MARKETS } from "@/config/markets";

export default function LandingPage() {
  // 🔹 Estado del mercado principal
  const [mainMarket, setMainMarket] = useState<keyof typeof MARKETS>("Indices");
  const [marketConfig, setMarketConfig] = useState(MARKETS["Indices"]);

  // 🔹 Aseguramos sincronía del estado tras hidratación
  useEffect(() => {
    setMarketConfig(MARKETS[mainMarket]);
  }, [mainMarket]);

  // 🔹 Mapeo estable de datos
  const renderRow = (item: any) => ({
    name: item?.Name ?? item?.Symbol ?? "—",
    last: item?.Last ?? "-",
    high: item?.High ?? "-",
    low: item?.Low ?? "-",
    chg: item?.Chg ?? "-",
    chgPct: item?.ChgPct ?? "-",
    time: item?.Time ?? "-",
    url: item?.Url ?? "",
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <HeroSection />
      <AnywhereSection />
      <LeverageSection />

      {/* 🔹 Sección de mercados */}
      <section
        id="markets"
        className="py-20 bg-card text-card-foreground border-t border-border"
      >
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Explora los Mercados
          </h2>
          {/* <p className="text-center text-muted-foreground max-w-2xl mx-auto">*/}
           <p className="text-base lg:text-lg font-light opacity-90 max-w-2xl mx-auto">
            Visualiza en tiempo real los principales índices, criptomonedas,
            divisas y materias primas.
          </p>

          {/* 🔹 MarketSection aislado en cliente */}
          {marketConfig && (
            <MarketSection
              title={mainMarket}
              buttons={marketConfig.buttons}
              getUrl={marketConfig.getUrlMarkets}
              renderRow={renderRow}
              onMarketChange={setMainMarket}
            />
          )}
        </div>
      </section>

      <TestimonialsSection />

      <footer className="mt-auto py-6 border-t border-border bg-card text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} BitLance — Todos los derechos reservados.
      </footer>
    </div>
  );
}
