"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FormState = {
  amount: string;
  currency: string;
  referenceId: string;
  description: string;
  customerEmail: string;
};

type UsuarioResumen = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  estado: string;
  fechaRegistro: string;
  ultimoAcceso: string;
  kycVerificado: boolean;
};

export default function CrearPagoPage() {
  const [form, setForm] = useState<FormState>({
    amount: "",
    currency: "usd",
    referenceId: "",
    description: "",
    customerEmail: "",
  });

  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [usersLoading, setUsersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  /* ============ Cargar usuarios ============ */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await fetch("/api/usuarios");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "No se pudieron cargar los usuarios.");
          return;
        }

        setUsuarios(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id);
          setForm((f) => ({ ...f, customerEmail: data[0].email }));
        }
      } catch (err) {
        setError("Error inesperado cargando los usuarios.");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  /* ============ Handlers ============ */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    const user = usuarios.find((u) => u.id === userId);
    setForm((prev) => ({ ...prev, customerEmail: user?.email || "" }));
  };

  /* ============ Crear link de pago Hotmart ============ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentLink(null);

    if (!selectedUserId) {
      setError("Selecciona un usuario.");
      return;
    }

    const parsedAmount = parseFloat(form.amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!form.referenceId.trim()) {
      setError("Debes ingresar una referencia del pago.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/payments/create-hotmart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          currency: form.currency.toUpperCase(),
          referenceId: form.referenceId.trim(),
          description: form.description,
          customerEmail: form.customerEmail,
          userId: selectedUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear el link de pago.");
        toast.error(data.error || "No se pudo crear el link de pago.");
        return;
      }

      setPaymentLink(data.url);
      toast.success("Link de pago Hotmart generado.");
    } catch (err) {
      setError("Error inesperado al generar el link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      toast.success("Link copiado.");
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/admin/pagos/lista" className="inline-block">
        <Button className="mb-4 bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer">
          Lista de pagos
        </Button>
      </Link>

      <div className="flex justify-center">
        <div className="w-full max-w-2xl p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg text-neutral-100">
          <h1 className="text-2xl font-semibold mb-2">Crear link de pago</h1>
          <p className="text-sm text-neutral-400 mb-6">
            Generará un link de pago usando la pasarela de Hotmart.
          </p>

          {/* Selección de usuario */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Usuario
            </label>

            {usersLoading ? (
              <p className="text-xs text-neutral-400">Cargando usuarios...</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={handleChangeClient}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:ring-2 focus:ring-yellow-400 text-sm"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} — {u.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Monto */}
            <div>
              <label className="block text-sm mb-1">Monto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="150.00"
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700"
                />
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700"
                >
                  <option value="usd">USD</option>
                </select>
              </div>
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-sm mb-1">Referencia interna</label>
              <input
                type="text"
                name="referenceId"
                value={form.referenceId}
                onChange={handleChange}
                placeholder="ORD-2025-0001"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm mb-1">
                Descripción del pago
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Ej: Recarga de saldo"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 min-h-[70px]"
              />
            </div>

            {/* Email del cliente */}
            <div>
              <label className="block text-sm mb-1">
                Correo del cliente
              </label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700"
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
              disabled={loading || usersLoading}
              className="w-full py-2.5 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 disabled:opacity-50"
            >
              {loading ? "Creando link..." : "Generar link de pago"}
            </button>
          </form>

          {/* Link generado */}
          {paymentLink && (
            <div className="mt-6 p-4 rounded-xl bg-neutral-800 border border-neutral-700">
              <h2 className="text-sm font-semibold mb-2">Link generado</h2>
              <p className="text-xs text-neutral-400 mb-2">
                Enlace de Hotmart generado:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentLink}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-neutral-700 text-xs hover:bg-neutral-600"
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
