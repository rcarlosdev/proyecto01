// src/modules/home/ui/views/home-view.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null;
  role?: string;
  status?: string;
  balance?: number;
};

export const HomeView = ({ user }: { user: User }) => {
  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in"; // Redirige al login
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      <Card
        className="w-full max-w-md shadow-xl rounded-2xl border"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--text-color)",
          borderColor: "var(--border)",
        }}
      >
        <CardHeader>
          <CardTitle
            className="text-2xl font-bold text-center"
            style={{ color: "var(--naranja-principal)" }}
          >
            Perfil de Usuario
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Imagen */}
          <div className="flex justify-center">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="w-20 h-20 rounded-full border border-[var(--border)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--naranja-principal)] flex items-center justify-center text-white font-bold">
                {user?.name?.[0] ?? "?"}
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="space-y-2 text-sm">
            <p><strong>Nombre:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p>
              <strong>Verificado:</strong>{" "}
              {user?.emailVerified ? "✅ Sí" : "❌ No"}
            </p>
            {user?.role && <p><strong>Rol:</strong> {user.role}</p>}
            {user?.status && <p><strong>Estado:</strong> {user.status}</p>}
            {user?.balance !== undefined && (
              <p><strong>Saldo:</strong> ${user.balance.toFixed(2)}</p>
            )}
            <p><strong>Creado:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>Última actualización:</strong> {new Date(user.updatedAt).toLocaleDateString()}</p>
          </div>

          {/* Botón logout */}
          <div className="pt-4">
            <Button
              onClick={handleLogout}
              className="w-full cursor-pointer"
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};
