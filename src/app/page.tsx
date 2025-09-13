"use client"

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Home() {

  const { data: session } = authClient.useSession();

  const onClick = () => {
    authClient.signIn.social(
      {
        provider: "google"
      },
      {
        onSuccess: () => {
          //redirect to the dashboard or sign in page
          // window.alert("Bienvenido!!")
        },
        onError: () => {
          // display the error message}
          window.alert("Ocurrio un error, por favor intente más tarde.")
        },
      }
    )
  }

  if (session) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <div className="text-center">
          <h1>BIENVENIDO!! {session.user.name}</h1>
          <Button className="mt-8" variant="destructive" onClick={() => authClient.signOut()}>Cerrar Sesión</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center">
        <h1>INICIAR SESIÓN!!</h1>
        <Button className="mt-8 bg-amber-600" variant="default" onClick={onClick}>Iniciar Con GOOGLE</Button>
      </div>
    </div>
  );
}
