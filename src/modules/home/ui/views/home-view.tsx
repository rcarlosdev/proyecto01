"use client"

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export const HomeView = () => {

  const { data: session } = authClient.useSession();
  const route = useRouter();

  if (!session) {
    return (
      <>
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
          <div>Deberías iniciar sesión</div>
          <Button onClick={() => route.push("/sing-in")}>Ir a Iniciar Sesión</Button>
        </div>
      </>
    );
  }
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center">
        <h1>BIENVENIDO!! {session.user.name}</h1>
        <Button className="mt-8" variant="destructive" onClick={() => authClient.signOut()}>Cerrar Sesión</Button>
      </div>
    </div>
  )
}
