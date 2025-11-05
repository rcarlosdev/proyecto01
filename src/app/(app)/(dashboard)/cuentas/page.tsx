// src/app/(platform)/cuentas/page.tsx
"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, CreditCard, ArrowLeft, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/* === COMPONENTES BASE === */
const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`p-4 md:p-6 pb-2 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <h3 className={`text-xl font-semibold text-[var(--color-primary)] flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);
const CardContent = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`p-4 md:p-6 pt-2 ${className}`}>{children}</div>
);
const Badge = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${className}`}>
    {children}
  </span>
);

/* === TIPOS === */
interface Cuenta {
  id: string;
  numero: string;
  tipo: "trading" | "inversion" | "ahorro";
  moneda: string;
  balance: number;
  balanceDisponible: number;
  estado: "activa" | "suspendida" | "cerrada";
  fechaCreacion: string;
}

export default function MisCuentasView() {
  const router = useRouter();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    try {
      // Simular fetch de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData: Cuenta[] = [
        {
          id: "1",
          numero: "BTC-784512369",
          tipo: "trading",
          moneda: "BTC",
          balance: 2.456,
          balanceDisponible: 2.123,
          estado: "activa",
          fechaCreacion: "2024-01-15"
        },
        {
          id: "2",
          numero: "USD-951753468",
          tipo: "trading",
          moneda: "USD",
          balance: 12500.75,
          balanceDisponible: 12000.50,
          estado: "activa",
          fechaCreacion: "2024-01-10"
        },
        {
          id: "3",
          numero: "ETH-357159486",
          tipo: "inversion",
          moneda: "ETH",
          balance: 15.75,
          balanceDisponible: 15.75,
          estado: "activa",
          fechaCreacion: "2024-02-01"
        }
      ];
      setCuentas(mockData);
    } catch {
      toast.error("Error al cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  const getTipoClasses = (tipo: string) => {
    switch (tipo) {
      case "trading": return "bg-blue-500/15 text-blue-400 border-blue-400/30";
      case "inversion": return "bg-green-500/15 text-green-400 border-green-400/30";
      case "ahorro": return "bg-purple-500/15 text-purple-400 border-purple-400/30";
      default: return "bg-gray-500/15 text-gray-400 border-gray-400/30";
    }
  };

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "activa": return "bg-emerald-500/15 text-emerald-400 border-emerald-400/30";
      case "suspendida": return "bg-amber-500/15 text-amber-400 border-amber-400/30";
      case "cerrada": return "bg-red-500/15 text-red-400 border-red-400/30";
      default: return "bg-gray-500/15 text-gray-400 border-gray-400/30";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-yellow-400">Mis Cuentas</h1>
              <p className="text-sm text-muted-foreground">Gestión de todas tus cuentas de trading</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto mt-4 rounded-2xl bg-muted p-6 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
            <Loader2 className="animate-spin h-8 w-8 mb-4 text-[var(--color-primary)]" />
            <p>Cargando cuentas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-yellow-400">Mis Cuentas</h1>
              <p className="text-sm text-muted-foreground">Gestión de todas tus cuentas de trading</p>
            </div>
          </div>
          <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto mt-4 rounded-2xl bg-muted p-6">
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Resumen General */}
          <Card className="border-l-4 border-l-yellow-400">
            <CardHeader>
              <CardTitle className="text-yellow-400">
                <CreditCard className="h-5 w-5" />
                Resumen de Cuentas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 text-center border rounded-lg bg-[var(--color-surface-alt)]">
                  <div className="text-2xl font-bold text-yellow-400">{cuentas.length}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Total Cuentas</div>
                </div>
                <div className="p-4 text-center border rounded-lg bg-[var(--color-surface-alt)]">
                  <div className="text-2xl font-bold text-green-400">
                    {cuentas.filter(c => c.estado === 'activa').length}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">Activas</div>
                </div>
                <div className="p-4 text-center border rounded-lg bg-[var(--color-surface-alt)]">
                  <div className="text-2xl font-bold text-blue-400">
                    {cuentas.filter(c => c.tipo === 'trading').length}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">Trading</div>
                </div>
                <div className="p-4 text-center border rounded-lg bg-[var(--color-surface-alt)]">
                  <div className="text-2xl font-bold text-purple-400">
                    ${cuentas.reduce((acc, c) => acc + c.balance, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">Balance Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Cuentas */}
          <Card className="border-l-4 border-l-yellow-400">
            <CardHeader>
              <CardTitle className="text-yellow-400">Todas las Cuentas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cuentas.map((cuenta) => (
                  <div key={cuenta.id} className="border rounded-xl p-4 bg-[var(--color-surface-alt)] hover:bg-[var(--color-surface)] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">{cuenta.numero}</h4>
                          <div className="flex gap-2">
                            <Badge className={getTipoClasses(cuenta.tipo)}>
                              {cuenta.tipo === 'trading' ? 'Trading' : cuenta.tipo === 'inversion' ? 'Inversión' : 'Ahorro'}
                            </Badge>
                            <Badge className={getEstadoClasses(cuenta.estado)}>
                              {cuenta.estado === 'activa' ? 'Activa' : cuenta.estado === 'suspendida' ? 'Suspendida' : 'Cerrada'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--color-text-muted)]">Moneda:</span>
                            <span className="font-medium ml-2">{cuenta.moneda}</span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)]">Balance:</span>
                            <span className="font-medium ml-2">
                              {cuenta.moneda === 'USD' ? '$' : ''}{cuenta.balance.toLocaleString()} {cuenta.moneda}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)]">Disponible:</span>
                            <span className="font-medium ml-2">
                              {cuenta.moneda === 'USD' ? '$' : ''}{cuenta.balanceDisponible.toLocaleString()} {cuenta.moneda}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--color-text-muted)]">Creada:</span>
                            <span className="font-medium ml-2">
                              {new Date(cuenta.fechaCreacion).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Estado
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}