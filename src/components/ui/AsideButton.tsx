// src/components/ui/AsideButton.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AsideButtonProps {
  href: string;
  icon: ReactNode;
  text: string;
  expanded: boolean;
}

export default function AsideButton({ href, icon, text, expanded }: AsideButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 w-full h-12 mt-2 mb-2 px-3 shadow-md cursor-pointer",
        "bg-[var(--card)] text-[var(--amarillo-principal)]",
        "hover:bg-[var(--amarillo-principal)] hover:text-[var(--negro)]",
        "rounded-2xl hover:rounded-xl transition-all duration-300 ease-linear group"
      )}
    >
      {/* Icono principal */}
      <div className="flex items-center justify-center">{icon}</div>

      {/* Texto visible si el aside está expandido */}
      {expanded && <span className="font-medium">{text}</span>}

      {/* Tooltip si el aside está colapsado */}
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
}
