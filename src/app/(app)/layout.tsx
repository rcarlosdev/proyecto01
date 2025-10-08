// src/app/(app)/layout.tsx
"use client"; // 🔹 Esto permite usar hooks como useState

import { ReactNode, useState } from "react";
import Header from "@/components/layout/header";
import Aside from "@/components/layout/aside";
import Main from "@/components/layout/main";

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mobileAsideOpen, setMobileAsideOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 h-16">
        
        <Header onToggleAside={() => setMobileAsideOpen((s) => !s)} />
      </div>

      <div className="flex flex-1 pt-16 overflow-hidden">
        <Aside
          isMobileOpen={mobileAsideOpen}
          onCloseMobile={() => setMobileAsideOpen(false)}
          className="sticky top-16 self-start h-[calc(100vh-4rem)]"
        />
        <Main>{children}</Main>
      </div>
    </div>
  );
}
