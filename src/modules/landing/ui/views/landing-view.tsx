// src/modules/landing/ui/views/landing-view.tsx
"use client";

export default function LandingView() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1
          className="text-4xl md:text-6xl font-extrabold"
          style={{ color: "var(--amarillo-principal)" }}
        >
          Bienvenido a BitLance
        </h1>
        <p className="mt-4 max-w-2xl text-lg opacity-80">
          La mejor plataforma para gestionar tus finanzas e inversiones.
        </p>
      </main>

      {/* Footer */}
      <footer className="py-4 text-xs text-center opacity-75">
        © {new Date().getFullYear()} BitLance. Todos los derechos reservados.
      </footer>
    </div>
  );
}
