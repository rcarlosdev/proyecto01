"use client";

import { useMarketStore } from "@/stores/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/stores/useUserStore";

export default function AccountInfo() {
  const { isLoading } = useMarketStore();
  const { user } = useUserStore();  

  const accountData = [
    { label: "Patrimonio neto", value: user?.balance || 0 },
    { label: "Margen libre", value: 0 || 0 },
    { label: "Margen usado", value: 0 || 0 },
    { label: "P/L abiertas", value: 0 || 0 },
    { label: "Saldo", value: 0 || 0 },
    { label: "Nivel de margen", value: 0 || 0 },
    { label: "Crédito", value: 0 || 0 },
  ];

  return (
    <div className="rounded-2xl border border-gray-50/80 p-4 md:p-6">
      <h2 className="text-base font-semibold mb-4">
        Información de cuenta
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-8 gap-y-4 gap-x-6">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          : accountData.map((item, index) => (
              <div key={index} className="col-span-1">
                <p className="text-xs text-muted mb-1 tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-medium">
                  $ {item.value}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
