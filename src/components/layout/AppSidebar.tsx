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
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  // SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// 🧭 Menú lateral
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
const AppSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar >
      {/* LOGO */}
      <div className="flex items-center h-20 border-b">
        <Link href="/" className="flex items-center gap-2 px-4 py-3">
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
        <SidebarGroup>
          {/* <SidebarGroupLabel className="text-gray-400 px-4 mt-4">
            Menú principal
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      // className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-[#1f2f4a] hover:text-yellow-400"
                      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${pathname === item.url
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
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;