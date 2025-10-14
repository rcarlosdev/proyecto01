// src/app/(app)/layout.tsx
"use client"; // 🔹 Esto permite usar hooks como useState

import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  // const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar lateral */}
        <AppSidebar />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 w-full">
          {/* Navbar arriba */}
          <Navbar />

          {/* Contenido dinámico */}
          <main className="flex-1 w-full p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
