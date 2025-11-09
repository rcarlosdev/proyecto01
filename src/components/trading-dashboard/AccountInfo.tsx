// src/components/trading-dashboard/AccountInfo.tsx
"use client";

import { useMarketStore } from "@/stores/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/stores/useUserStore";

type Props = { compact?: boolean };

export default function AccountInfo({ compact = false }: Props) {
  const { isLoading } = useMarketStore();
  const { user } = useUserStore();

  const accountData = [
    { label: "Patrimonio neto", value: user?.balance ?? 0, currency: true },
    { label: "Margen libre", value: 0, currency: true },
    { label: "Margen usado", value: 0, currency: true },
    { label: "P/L abiertas", value: 0, currency: true },
    { label: "Saldo", value: 0, currency: true },
    { label: "Nivel de margen", value: 0, percent: true },
    { label: "Crédito", value: 0, currency: true },
  ];

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="border rounded-xl p-4 md:p-6 bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface)] transition-colors">
      <h4 className="font-bold text-[var(--color-primary)] mb-4">
        Información de cuenta
      </h4>

      <div
        className={[
          "grid gap-4 text-sm",
          compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-8",
        ].join(" ")}
      >
        {isLoading
          ? Array.from({ length: accountData.length }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : accountData.map((item, index) => (
              <div key={index} className="col-span-1">
                <p className="text-xs text-[var(--color-text-muted)] mb-1 tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {item.percent
                    ? `${fmt(item.value)}%`
                    : item.currency
                    ? `$ ${fmt(item.value)}`
                    : fmt(item.value)}
                </p>

              </div>
            ))}
      </div>
    </div>
  );
}
