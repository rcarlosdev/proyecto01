"use client";

// import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import ThemeSwitcher from "@/components/ui/ThemeSwitcher";
import { useUserStore } from "@/stores/useUserStore";
import { Label } from "@/components/ui/label";
import ActionButton from "@/components/ui/ActionButton";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
// función para alternar sidebar (debes implementarla según tu lógica)


export function Navbar() {
  const user = useUserStore((state) => state.user);
  // función para redirigir
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleLogout = () => {  
    authClient.signOut();
    router.push("/landing");
  }


  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-20 px-4 py-3 border-b bg-background">
      {/* Botón para colapsar sidebar */}
      <div className="flex items-center gap-2">
        {/*  */}
        {/* <SidebarTrigger /> */}
        <ActionButton
          href="#"
          label="Panel de Usuario"
          icon={<PanelLeftIcon className="size-4" />}
          expandDirection="right"
          expandedWidth="w-40"
          bgColor="bg-[var(--card)]"
          textColor="text-[var(--amarillo-principal)]"
          hoverBg="hover:bg-[var(--amarillo-principal)]"
          hoverText="hover:text-black"
          className={cn("relative")}
          onClick={(e) => {
            e.preventDefault();
            toggleSidebar();
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        {/* <ThemeSwitcher /> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Label className="cursor-pointer">
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
            </Label>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { router.push("/cuentas") }}>Mi Cuenta</DropdownMenuItem>
            <DropdownMenuItem >Centro de Ayuda</DropdownMenuItem>
            <DropdownMenuItem className="text-red-300" onClick={handleLogout}>Salir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      {/* <div className="fixed top-full mt-1.5 right-6 z-50 opacity-50 hover:opacity-100 transition">
        <ThemeSwitcher expandedWidth="w-36" expandDirection="left" />
      </div> */}
      </div>
    </header>
  );
}
