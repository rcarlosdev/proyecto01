// src/app/layout-client.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Aside from "@/components/ui/aside";
import Header from "@/components/ui/Header";

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
    <div className="flex">
      <Aside isMobileOpen={mobileAsideOpen} onCloseMobile={() => setMobileAsideOpen(false)} />
      <div className="flex-1 ml-16 md:ml-16">
        <Header onToggleAside={() => setMobileAsideOpen((s) => !s)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

