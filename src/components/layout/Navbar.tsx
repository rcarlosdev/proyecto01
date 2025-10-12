"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { useUserStore } from "@/stores/useUserStore";

export function Navbar() {
  const user = useUserStore((state) => state.user);
  // función para redirigir
  const router = useRouter();

  const handleLogout = () => {
    authClient.signOut();
    router.push("/landing");
  }


  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-20 px-4 py-3 border-b ">
      {/* Botón para colapsar sidebar */}
      <div className="flex items-center gap-2">
        {/*  */}
        <SidebarTrigger />

        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Panel de Usuario
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-sm font-medium hover:bg-transparent"
            >
              {user?.name ?? "Usuario"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { router.push("/cuentas") }}>Mi Cuenta</DropdownMenuItem>
            <DropdownMenuItem >Centro de Ayuda</DropdownMenuItem>
            <DropdownMenuItem className="text-red-300" onClick={handleLogout}>Salir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
