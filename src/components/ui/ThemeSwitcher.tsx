"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  if (!mounted) {
    // 🔹 No renderiza nada hasta que se monte en cliente
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        group relative flex items-center rounded-full border
        bg-[var(--button-bg)] text-[var(--button-text)]
        h-10 w-10 hover:w-36
        px-2 transition-all duration-300 overflow-hidden
      "
      title="Cambiar tema"
    >
      <div className="flex items-center justify-center w-6 min-w-[24px]">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </div>
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
