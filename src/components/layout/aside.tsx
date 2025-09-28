// src/components/ui/aside.tsx
"use client";

import { useState } from "react";
import { FaHome, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { BsPlus } from "react-icons/bs";
import AsideButton from "@/components/ui/AsideButton";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const Aside = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const route = useRouter();
  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] transition-all duration-300 shadow-lg bg-[var(--card)] text-[var(--text-color)] ${
        isExpanded ? "w-52" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col items-start p-2">
        <AsideButton href="/" icon={<FaHome size={20} />} text="Inicio" expanded={isExpanded} />
        <AsideButton href="/usuarios" icon={<FaUser size={20} />} text="Usuarios" expanded={isExpanded} />
        <AsideButton href="/configuracion" icon={<FaCog size={20} />} text="Configuración" expanded={isExpanded} />

        <Divider />

        <AsideButton href="/nuevo" icon={<BsPlus size={24} />} text="Nuevo" expanded={isExpanded} />
        <AsideButton 
          icon={<FaSignOutAlt size={20} />} 
          text="Cerrar sesión" 
          expanded={isExpanded}
          onClick={async () => {
            await authClient.signOut();
            route.push("/landing");
          }}
        />
      </nav>
    </aside>
  );
}; 

const Divider = () => (
  <hr className="w-full border-t border-[var(--border)] my-2" />
);

export default Aside;
