// src/app/(public)/landing/page.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import LandingView from "@/modules/landing/ui/views/landing-view";

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/"); // 👈 evita el flash, manda directo al home
  }

  return <LandingView />;
}

