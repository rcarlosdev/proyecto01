"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserStore } from "@/stores/useUserStore";

export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const setSession = useUserStore((state) => state.setSession);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    async function syncUser() {
      if (session?.user) {
        try {
          // ✅ Recuperar datos actualizados desde la base de datos
          const res = await fetch("/api/user/me", {
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            console.error("Error al obtener usuario:", res.statusText);
            clearUser();
            return;
          }

          const dbUser = await res.json();

          // ✅ Guardamos el usuario y la sesión en el store
          setUser(dbUser);
          setSession(session.session);
        } catch (error) {
          console.error("Error al sincronizar usuario:", error);
          clearUser();
        }
      } else if (!isPending) {
        clearUser();
      }
    }

    syncUser();
  }, [session, isPending, setUser, setSession, clearUser]);

  return <>{children}</>;
}
