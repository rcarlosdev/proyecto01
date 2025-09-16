// src/components/ui/aside.tsx
"use client";

import { useState } from "react";
import { FaHome, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { BsPlus } from "react-icons/bs";
import { cn } from "@/lib/utils";
import Link from "next/link";

const Aside = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen transition-all duration-300 shadow-lg",
        "bg-[var(--card)] text-[var(--text-color)]",
        isExpanded ? "w-52" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col items-start p-2">
        <AsideIcon href="/" icon={<FaHome size="20" />} text="Inicio" expanded={isExpanded} />
        <AsideIcon href="/usuarios" icon={<FaUser size="20" />} text="Usuarios" expanded={isExpanded} />
        <AsideIcon href="/configuracion" icon={<FaCog size="20" />} text="Configuración" expanded={isExpanded} />
        
        <Divider />

        <AsideIcon href="/nuevo" icon={<BsPlus size="24" />} text="Nuevo" expanded={isExpanded} />
        <AsideIcon href="/sign-out" icon={<FaSignOutAlt size="20" />} text="Cerrar sesión" expanded={isExpanded} />
      </nav>
    </aside>
  );
};

const AsideIcon = ({
  icon,
  text,
  href,
  expanded,
}: {
  icon: React.ReactNode;
  text: string;
  href: string;
  expanded: boolean;
}) => (
  <Link
    href={href}
    className={cn(
      "relative flex items-center gap-3 w-full",
      "h-12 mt-2 mb-2 px-3 shadow-md cursor-pointer",
      "bg-[var(--card)] text-[var(--amarillo-principal)]",
      "hover:bg-[var(--amarillo-principal)] hover:text-[var(--negro)]",
      "rounded-2xl hover:rounded-xl transition-all duration-300 ease-linear group"
    )}
  >
    <div>{icon}</div>
    {expanded && <span className="font-medium">{text}</span>}

    {/* Tooltip si está colapsado */}
    {!expanded && (
      <span
        className={cn(
          "absolute w-auto p-2 m-2 min-w-max left-14 rounded-md shadow-md",
          "text-xs font-bold transition-all duration-100 scale-0 origin-left",
          "bg-[var(--card)] text-[var(--text-color)] border border-[var(--border)]",
          "group-hover:scale-100"
        )}
      >
        {text}
      </span>
    )}
  </Link>
);

const Divider = () => (
  <hr className="w-full border-t border-[var(--border)] my-2" />
);

export default Aside;
