// src/components/AuthSync.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserStore } from "@/stores/useUserStore";
import { useKeepUserFresh } from "@/hooks/useKeepUserFresh";

export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const setSession = useUserStore((s) => s.setSession);
  const clearUser = useUserStore((s) => s.clearUser);
  const _setUserIfChanged = useUserStore((s) => s._setUserIfChanged);

  useEffect(() => {
    let ac = new AbortController();
    async function syncUser() {
      if (session?.user) {
        try {
          const res = await fetch("/api/user/me", {
            headers: { "Content-Type": "application/json" },
            signal: ac.signal,
            cache: "no-store",
          });
          if (!res.ok) {
            console.error("Error al obtener usuario:", res.statusText);
            clearUser();
            return;
          }
          const dbUser = await res.json();
          _setUserIfChanged(dbUser); // evita renders si no cambió
          setSession(session.session);
        } catch (error) {
          if ((error as any)?.name !== "AbortError") {
            console.error("Error al sincronizar usuario:", error);
            clearUser();
          }
        }
      } else if (!isPending) {
        clearUser();
      }
    }
    syncUser();
    return () => {
      ac.abort();
    };
  }, [session, isPending, _setUserIfChanged, setSession, clearUser]);

  // ⬇️ empieza el refresco continuo (polling + focus)
  useKeepUserFresh();

  return <>{children}</>;
}
