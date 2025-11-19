"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentRow = {
  id: number;
  referenceId: string;
  stripeSessionId: string;
  stripeUrl: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function PaymentsListPage() {
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payments");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error cargando pagos");
        }
        setItems(data);
      } catch (err: any) {
        setError(err.message ?? "Error inesperado");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatAmount = (amount: number, currency: string) =>
    `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;

  const statusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      case "failed":
        return "bg-red-500/15 text-red-300 border-red-500/40";
      case "pending":
      default:
        return "bg-yellow-500/15 text-yellow-300 border-yellow-500/40";
    }
  };

  if (loading) {
    return <div className="p-6 text-neutral-100">Cargando pagos...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-300">
        Error al cargar pagos: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-neutral-100 p-6">
      <Link href="/admin/pagos" className="text-yellow-300 hover:underline mb-4 inline-block">
        <Button className="mb-6 bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer">
          Crear nuevo link de pago
        </Button>
      </Link>

      <h1 className="text-2xl font-semibold mb-4">Links de pago generados</h1>
      <p className="text-sm text-neutral-400 mb-6">
        Aquí puedes ver los links creados, su estado y copiar el enlace para reenviarlo al cliente.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/70 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left">Referencia</th>
              <th className="px-4 py-3 text-left">Monto</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Creado</th>
              <th className="px-4 py-3 text-left">Link</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.id}
                className="border-b border-neutral-800/70 hover:bg-neutral-800/40"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  {p.referenceId}
                </td>
                <td className="px-4 py-3">
                  {formatAmount(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.customerEmail || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium " +
                      statusColor(p.status)
                    }
                  >
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">
                  {new Date(p.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs">
                  <a
                    href={p.stripeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Abrir
                  </a>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-neutral-400"
                >
                  Aún no has generado ningún link de pago.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
