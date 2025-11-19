import { Button } from "@/components/ui/button";
import Link from "next/link";

// src/app/pagos/cancelled/page.tsx
export default function PaymentCancelledPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Pago cancelado</h1>
      <p>El pago fue cancelado o no se completó.</p>
      <Link href="/admin/pagos">
        <Button className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer" >Volver a Pagos</Button>
      </Link>
    </div >
  );
}
