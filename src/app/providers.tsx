"use client";

import { ReactNode, useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { useUserStore } from "@/stores/useUserStore";

export function Providers({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const { user, setUser } = useUserStore();

  // Sincroniza el tema al cargar el cliente
  useEffect(() => {
    const saved =
      (localStorage.getItem("theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(saved);

    const token = localStorage.getItem("token");
    if (token) {
      setUser(decodedUser);
    }
  }, [setTheme, setUser]);

  return <>{children}</>;
}
