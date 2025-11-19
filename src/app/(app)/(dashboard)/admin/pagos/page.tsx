// src/app/pagos-demo/page.tsx
// import { CreatePaymentButton } from "@/components/payments/CreatePaymentButton";

// export default function PagosDemoPage() {
//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-semibold mb-4">Demo de pago con Stripe</h1>
//       <CreatePaymentButton />
//     </div>
//   );
// }

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

type FormState = {
  amount: string;        // monto normal (ej: 150.50)
  currency: string;      // ej: "usd" o "cop"
  referenceId: string;   // tu referencia interna
  description: string;   // concepto del pago
  customerEmail: string; // correo del cliente (opcional)
};

export default function CrearPagoPage() {
  const [form, setForm] = useState<FormState>({
    amount: "",
    currency: "usd",
    referenceId: "",
    description: "",
    customerEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentLink(null);

    // Validar monto
    const parsedAmount = parseFloat(form.amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!form.referenceId.trim()) {
      setError("Ingresa una referencia para identificar el pago.");
      return;
    }

    try {
      setLoading(true);

      // Stripe espera el monto en centavos
      const amountInCents = Math.round(parsedAmount * 100);

      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInCents,
          currency: form.currency.toLowerCase(),
          referenceId: form.referenceId.trim(),
          description: form.description || `Pago referencia ${form.referenceId}`,
          customerEmail: form.customerEmail || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        console.error("Error creando checkout:", data);
        setError(data.error || "No se pudo crear el link de pago.");
        return;
      }

      // Guardamos el link para compartirlo
      setPaymentLink(data.url);
    } catch (err) {
      console.error(err);
      setError("Error inesperado al crear el link de pago.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      alert("Link copiado al portapapeles");
    } catch {
      alert("No se pudo copiar el link automáticamente.");
    }
  };

  return (

    <div>
      <Link href="/admin/pagos/lista" className="text-yellow-300 hover:underline mb-4 inline-block">
        <Button className="mb-6 bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer">
          Lista de pagos
        </Button>

      </Link>

      <div className="min-h-screen flex justify-center items-start text-neutral-100">
        <div className="w-full max-w-xl mt-10 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg">
          <h1 className="text-2xl font-semibold mb-2">Crear link de pago</h1>
          <p className="text-sm text-neutral-400 mb-6">
            Completa los datos para generar un enlace de Stripe que podrás compartir con tu cliente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Monto */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Monto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Ej: 150.00"
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="usd">USD</option>
                  {/* <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>  */}
                  {/* agrega las que uses */}
                </select>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Ingresa el monto normal (no en centavos).
              </p>
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Referencia interna
              </label>
              <input
                type="text"
                name="referenceId"
                value={form.referenceId}
                onChange={handleChange}
                placeholder="Ej: ORD-2025-0001"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Esta referencia se guardará en Stripe y en tu sistema para rastrear el pago.
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Descripción del pago
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Ej: Pago por servicio de consultoría de febrero"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[70px]"
              />
            </div>

            {/* Email del cliente */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Correo del cliente (opcional)
              </label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                placeholder="cliente@correo.com"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Creando link..." : "Generar link de pago"}
            </button>
          </form>

          {/* Resultado: link generado */}
          {paymentLink && (
            <div className="mt-6 p-4 rounded-xl bg-neutral-800 border border-neutral-700">
              <h2 className="text-sm font-semibold mb-2">Link generado</h2>
              <p className="text-xs text-neutral-400 mb-2">
                Comparte este enlace con tu cliente. Al abrirlo, verá el Checkout de Stripe para realizar el pago.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentLink}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-neutral-700 text-xs font-medium hover:bg-neutral-600"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
