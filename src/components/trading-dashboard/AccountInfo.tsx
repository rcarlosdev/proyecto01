'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketStore } from "@/stores/useMarketStore";
// import { useUserStore } from "@/stores/useUserStore";

const AccountInfo = () => {
  // Si manejas datos globales desde Zustand u otra fuente
  const { isLoading } = useMarketStore();
  // const { user } = useUserStore();

  // Datos por defecto o desde el store
  // const accountData = user || [
  const accountData = [
    { label: "Patrimonio neto", value: "€770.27" },
    { label: "Margen libre", value: "€770.27" },
    { label: "Margen usado", value: "€0.00" },
    { label: "P/L abiertas", value: "€0.00" },
    { label: "Saldo", value: "€520.27" },
    { label: "Nivel de margen", value: "---" },
    { label: "Crédito", value: "€250.00" },
  ];

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Información de cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-5 w-16 mx-auto" />
              </div>
            ))
            : accountData.map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
