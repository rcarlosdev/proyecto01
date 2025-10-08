// src/components/layout/header-public.tsx
"use client";

import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import HeaderButton from "@/components/ui/HeaderButton";
import { FaSignInAlt } from "react-icons/fa";

export default function HeaderPublic() {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/landing" className="text-xl font-bold text-yellow-500">
          BitLance
        </a>
        <nav className="flex items-center gap-4">
          {/* ThemeSwitcher como botón compacto con tooltip */}
          <ThemeSwitcher />

          {/* Login: solo ícono + tooltip */}
          <HeaderButton
            href="/sign-in"
            icon={<FaSignInAlt size={20} />}
            text="Iniciar Sesión"
            tooltipPosition="bottom"
          />
        </nav>
      </div>
    </header>
  );
}
