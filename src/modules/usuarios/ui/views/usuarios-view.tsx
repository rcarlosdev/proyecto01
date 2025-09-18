"use client";

import UsuariosTabs from "../components/usuarios-tabs";

export default function UsuariosView({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Título + Tabs arriba */}
      <div className="flex-shrink-0 space-y-2">
        <h1 className="text-xl font-bold text-yellow-400">Gestión de Usuarios</h1>
        <UsuariosTabs activeTab={activeTab} />
      </div>

      {/* Contenido del tab */}
      <div className="flex-1 overflow-y-auto mt-4 rounded-2xl bg-muted p-4">
        <p>Contenido del tab {activeTab}</p>
      </div>
    </div>
  );
}
