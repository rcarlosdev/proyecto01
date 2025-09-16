// src/components/ui/ThemeSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  // Inicialización del tema
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as "dark" | "light" | null;
      const initial =
        stored ??
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");

      setTheme(initial);
      applyTheme(initial);
    } catch (e) {
      console.error("Error al leer el tema:", e);
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light") => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    root.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    if (!theme) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!theme) return null;

  return (
    <button
      onClick={toggleTheme}
      className="
        group relative flex items-center gap-3
        h-12 px-3 w-full
        rounded-lg
        bg-[var(--card)] text-[var(--amarillo-principal)]
        hover:bg-[var(--amarillo-principal)] hover:text-black
        transition-all duration-300
        overflow-hidden
      "
      title="Cambiar tema"
    >
      {/* Icono */}
      <div className="flex items-center justify-center w-6">
        {theme === "dark" ? (
          <Sun size={20} strokeWidth={2} />
        ) : (
          <Moon size={20} strokeWidth={2} />
        )}
      </div>

      {/* Texto que aparece expandido */}
      <span
        className="
          text-sm font-medium
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap
        "
      >
        {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
      </span>
    </button>
  );
}
