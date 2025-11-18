// src/app/pagos-demo/page.tsx
import { CreatePaymentButton } from "@/components/payments/CreatePaymentButton";

export default function PagosDemoPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Demo de pago con Stripe</h1>
      <CreatePaymentButton />
    </div>
  );
}
