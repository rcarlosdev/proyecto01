// src/components/layout/AppSidebar.tsx
"use client";

import {
  LineChart,
  User,
  UserCog,
  KeyRound,
  Clock3,
  UploadCloud,
  Wallet,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  ChevronDown,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Plataforma Trading", url: "/", icon: LineChart },
  { title: "Mis Cuentas", url: "/cuentas", icon: User },
  { title: "Detalles Personales", url: "/detalles", icon: UserCog },
  { title: "Cambiar Contraseña", url: "/cambiar-password", icon: KeyRound },
  { title: "Historial de Trading", url: "/historial", icon: Clock3 },
  { title: "Subir documentos", url: "/documentos", icon: UploadCloud },
  { title: "Retiros", url: "/retiros", icon: Wallet },
  { title: "Transacciones financieras", url: "/transacciones", icon: TrendingUp },
];

const adminItems = [
  { title: "Usuarios", url: "/admin/usuarios", icon: Users },
  { title: "Movimientos", url: "/admin/movimientos", icon: Activity },
  { title: "Dashboard", url: "/admin/dashboard", icon: BarChart3 },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { isMobile, setOpen } = useSidebar();

  // 🔹 Cierra el sidebar automáticamente al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile, setOpen]);

  // 🔹 Función auxiliar: cierra el sidebar al hacer clic en cualquier link
  const handleLinkClick = () => {
    if (isMobile) setTimeout(() => setOpen(false), 50); // pequeña demora para evitar conflicto con la navegación
  };

  return (
    <Sidebar>
      {/* LOGO */}
      <div className="flex items-center h-20 border-b">
        <Link href="/" className="flex items-center gap-2 px-4 py-3" onClick={handleLinkClick}>
          <div className="relative w-15 h-15">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              style={{ objectFit: "contain" }}
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

      <SidebarContent>
        {/* 🌐 Grupo principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link
                      href={item.url}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${
                        pathname === item.url
                          ? "bg-border text-yellow-400"
                          : "hover:bg-border hover:text-yellow-400"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ⚙️ Grupo Administrar (colapsable) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <details className="group" open={pathname.startsWith("/admin")}>
              <summary
                className={`flex justify-between items-center cursor-pointer px-4 py-2 text-sm font-semibold rounded-md transition
                  hover:bg-border
                  text-sidebar-foreground group-open:text-[var(--amarillo-principal)]`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 transition-colors" />
                  <span>Administrar</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 group-open:rotate-180 text-sidebar-foreground group-open:text-[var(--amarillo-principal)]`}
                />
              </summary>

              <div className="mt-2 pl-5">
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === item.url ||
                          pathname.startsWith(`${item.url}/`)
                        }
                        className="text-sm"
                      >
                        <Link href={item.url} onClick={handleLinkClick}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </details>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
