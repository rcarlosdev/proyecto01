// src/app/layout-client.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Aside from "@/components/layout/aside";
import Header from "@/components/layout/header";
import Main from "@/components/layout/main";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

  if (isAuthRoute) {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* HEADER FIJO */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        <Header onToggleAside={() => setMobileAsideOpen((s) => !s)} />
      </div>

      {/* CONTENEDOR INTERNO */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* ASIDE STICKY */}
        <Aside
          isMobileOpen={mobileAsideOpen}
          onCloseMobile={() => setMobileAsideOpen(false)}
          className="sticky top-16 self-start h-[calc(100vh-4rem)]"
        />

        {/* MAIN GLOBAL */}
        <Main>{children}</Main>
      </div>
    </div>
  );
}
