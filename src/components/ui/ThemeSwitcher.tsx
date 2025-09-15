// src/components/ui/ThemeSwitcher.tsx
"use client";

import { useEffect, useState } from "react";

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

  // Aplicar tema en <html>
  const applyTheme = (newTheme: "dark" | "light") => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    root.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // Toggle al hacer clic
  const toggleTheme = () => {
    if (!theme) return;
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  if (!theme) return null; // evita parpadeo inicial

  return (
    <button
      onClick={toggleTheme}
      className="
        group relative flex items-center rounded-full border
        btn-emoji text-[var(--button-text)]
        h-10 w-10 hover:w-36
        px-2 transition-all duration-300 overflow-hidden
      "
      title="Cambiar tema"
    >
      {/* Emoji siempre visible */}
      <div className="flex items-center justify-center w-6 min-w-[24px] text-lg">
        {theme === "dark" ? "☀️" : "🌙"}
      </div>

      {/* Texto que aparece al hacer hover */}
      <span
        className="
          ml-2 text-sm whitespace-nowrap
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
      >
        {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
      </span>
    </button>
  );
}
