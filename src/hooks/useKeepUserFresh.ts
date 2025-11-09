// src/hooks/useKeepUserFresh.ts
"use client";
import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/useUserStore";

// ⏱️ Actualiza cada 2 minutos (ajustable)
const POLLING_MS = 60_000; // 1 minuto = 60000 ms

export function useKeepUserFresh() {
  const user = useUserStore((s) => s.user);
  const _setUserIfChanged = useUserStore((s) => s._setUserIfChanged);
  const _markSynced = useUserStore((s) => s._markSynced);

  const fetchingRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function refetch() {
    if (fetchingRef.current) fetchingRef.current.abort();
    const ac = new AbortController();
    fetchingRef.current = ac;

    try {
      const res = await fetch("/api/user/me", {
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        cache: "no-store",
      });
      if (!res.ok) return;
      const fresh = await res.json();
      _setUserIfChanged(fresh);
    } catch {
      // silencio en caso de red caída o abort manual
    } finally {
      _markSynced();
      if (fetchingRef.current === ac) fetchingRef.current = null;
    }
  }

  useEffect(() => {
    if (!user?.id) return;

    // primer fetch al montar
    refetch();

    // ⏳ polling cada 2 minutos
    timerRef.current = setInterval(refetch, POLLING_MS);

    // 🔁 revalida al volver al foco o pestaña visible
    const onFocus = () => refetch();
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      if (fetchingRef.current) fetchingRef.current.abort();
    };
  }, [user?.id]);
}
