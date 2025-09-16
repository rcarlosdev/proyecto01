// src/components/ui/Header.tsx
"use client";

import Link from "next/link";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { Menu } from "lucide-react";
import Image from "next/image";

type HeaderProps = {
  onToggleAside?: () => void;
};

export default function Header({ onToggleAside }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
      {/* Logo + Nombre */}
      <div className="flex items-center gap-2">
        {/* Botón hamburguesa en móvil */}
        <button
          className="md:hidden p-2 rounded hover:bg-[var(--amarillo-claro)]"
          onClick={onToggleAside}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="Logo"
              layout="fill"
              objectFit="contain"
              className="rounded-full"
            />
          </div>
          <span
            className="font-semibold text-lg select-none"
            style={{ color: "var(--amarillo-principal)" }}
          >
            BitLance
          </span>
        </Link>
      </div>

      {/* Menús a la derecha */}
      <div className="flex items-center gap-3">
        {/* Aquí puedes añadir más items como notificaciones, perfil, etc. */}
        <ThemeSwitcher />
      </div>
    </header>
  );
}
