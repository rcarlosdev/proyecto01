// src/modules/home/ui/views/home-view.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import MarketTable from "@/components/MarketTable";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

// 🔹 Wrapper para renderizar solo en cliente
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}

export const HomeView = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const route = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (!res.ok) {
          route.push("/sign-in");
          return;
        }
        const data: User = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        route.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [route]);

  if (loading) {
    return <div className="text-center mt-10">Cargando...</div>;
  }

  if (!user) {
    return null; // Ya redirige arriba
  }

  return (
    <div className="flex items-center justify-center h-full">
      {/* <div
        className="rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--text-color)",
        }}
      >
        <h1
          className="text-2xl font-bold mb-4"
          style={{ color: "var(--amarillo-principal)" }}
        >
          Bienvenido {user.name?.toUpperCase()}
        </h1>

        {user.image && (
          <img
            src={user.image}
            alt={user.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-[var(--amarillo-principal)]"
          />
        )}

        <div className="space-y-1 text-sm text-left mt-4">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Verificado:</strong> {user.emailVerified ? "✅ Sí" : "❌ No"}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>Estado:</strong> {user.status}</p>

          <ClientOnly>
            <p><strong>Balance:</strong> ${user.balance.toLocaleString("es-CO")}</p>
            <p><strong>Creado:</strong> {new Date(user.createdAt).toLocaleDateString("es-CO")}</p>
            <p><strong>Última actualización:</strong> {new Date(user.updatedAt).toLocaleDateString("es-CO")}</p>
          </ClientOnly>
        </div>

        {user.role === "admin" && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline">Suspender</Button>
            <Button variant="outline">Banear</Button>
            <Button variant="outline">Cambiar Rol</Button>
          </div>
        )}

        <Button
          className="mt-6 w-full font-semibold"
          style={{
            backgroundColor: "var(--amarillo-principal)",
            color: "var(--negro)",
          }}
          onClick={async () => {
            await authClient.signOut();
            route.push("/sign-in");
          }}
        >
          Cerrar sesión
        </Button>
      </div> */}
      <MarketTable />
    </div>
  );
};
