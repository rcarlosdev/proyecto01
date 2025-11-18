// src/app/pagos/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatusResponse = {
  payment_status?: string;
  status?: string;
  referenceId?: string;
  amount?: number;
  currency?: string;
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [info, setInfo] = useState<StatusResponse | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const res = await fetch(`/api/payments/status?session_id=${sessionId}`);
      const data = await res.json();
      setInfo(data);
    })();
  }, [sessionId]);

  if (!sessionId) return <div>Falta session_id</div>;
  if (!info) return <div>Cargando estado del pago...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Pago procesado</h1>
      <p><strong>Referencia:</strong> {info.referenceId}</p>
      <p><strong>Estado pago (Stripe):</strong> {info.payment_status}</p>
      <p>
        <strong>Monto:</strong>{" "}
        {info.amount ? info.amount / 100 : "-"} {info.currency?.toUpperCase()}
      </p>
    </div>
  );
}
