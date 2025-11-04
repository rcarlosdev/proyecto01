"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PermisosTabProps {
  usuarioId?: string;
}

type Permiso = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
};

export function PermisosTab({ usuarioId }: PermisosTabProps) {
  const [permisos] = useState<Permiso[]>([
    // Trading
    { id: "operar", nombre: "Operar", categoria: "trading", descripcion: "Realizar operaciones" },
    { id: "limite_alto", nombre: "Límite Alto", categoria: "trading", descripcion: "Operar con límites elevados" },
    { id: "mercado_forex", nombre: "Mercado Forex", categoria: "trading", descripcion: "Acceso a mercado Forex" },
    { id: "mercado_cripto", nombre: "Mercado Cripto", categoria: "trading", descripcion: "Acceso a mercado Cripto" },

    // Análisis
    { id: "graficos_avanzados", nombre: "Gráficos Avanzados", categoria: "analisis", descripcion: "Herramientas de análisis técnico" },
    { id: "datos_historicos", nombre: "Datos Históricos", categoria: "analisis", descripcion: "Acceso a datos históricos completos" },
    { id: "reportes_detallados", nombre: "Reportes Detallados", categoria: "analisis", descripcion: "Generar reportes avanzados" },

    // Administración
    { id: "gestion_usuarios", nombre: "Gestión de Usuarios", categoria: "admin", descripcion: "Administrar usuarios del sistema" },
    { id: "config_sistema", nombre: "Configuración Sistema", categoria: "admin", descripcion: "Modificar configuración global" },
    { id: "ver_logs", nombre: "Ver Logs", categoria: "admin", descripcion: "Acceso a logs del sistema" },

    // Soporte
    { id: "soporte_usuario", nombre: "Soporte a Usuarios", categoria: "soporte", descripcion: "Brindar soporte técnico" },
    { id: "ver_tickets", nombre: "Ver Tickets", categoria: "soporte", descripcion: "Acceso a tickets de soporte" },
  ]);

  const [permisosUsuario, setPermisosUsuario] = useState<string[]>([
    "operar", "graficos_avanzados", "datos_historicos",
  ]);

  const [busqueda, setBusqueda] = useState("");

  const togglePermiso = (permisoId: string) => {
    setPermisosUsuario((prev) =>
      prev.includes(permisoId)
        ? prev.filter((id) => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  const permisosFiltrados = permisos.filter(
    (permiso) =>
      permiso.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      permiso.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const permisosPorCategoria = permisosFiltrados.reduce((acc, permiso) => {
    if (!acc[permiso.categoria]) acc[permiso.categoria] = [];
    acc[permiso.categoria].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  const categorias = {
    trading: "Trading",
    analisis: "Análisis",
    admin: "Administración",
    soporte: "Soporte",
  };

  return (
    <div className="space-y-6">
      {/* === RESUMEN === */}
      <Card className="border-l-4 border-yellow-400">
        <CardHeader>
          <CardTitle className="text-yellow-400">Resumen de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Permisos Activos",
                value: permisosUsuario.length,
                color: "text-yellow-400",
              },
              {
                label: "Categorías",
                value: Object.keys(permisosPorCategoria).length,
                color: "text-green-400",
              },
              {
                label: "Permisos Disponibles",
                value: permisos.filter((p) => !permisosUsuario.includes(p.id)).length,
                color: "text-blue-400",
              },
              {
                label: "Total Permisos",
                value: permisos.length,
                color: "text-orange-400",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-4 text-center border rounded-lg bg-[var(--color-surface-alt)]"
              >
                <div className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === GESTIÓN === */}
      <Card className="border-l-4 border-yellow-400">
        <CardHeader>
          <CardTitle className="text-yellow-400">Gestión de Permisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar permisos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <div className="space-y-6">
            {Object.entries(permisosPorCategoria).map(([categoria, permisosCategoria]) => (
              <div key={categoria} className="border rounded-lg overflow-hidden bg-[var(--color-surface-alt)]">
                <div className="p-3 border-b bg-[var(--color-surface)]">
                  <h3 className="font-semibold text-[var(--color-primary)]">
                    {categorias[categoria as keyof typeof categorias] || categoria}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {permisosCategoria.map((permiso) => (
                    <div
                      key={permiso.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={permisosUsuario.includes(permiso.id)}
                          onCheckedChange={() => togglePermiso(permiso.id)}
                        />
                        <div>
                          <div className="font-medium">{permiso.nombre}</div>
                          <div className="text-sm text-[var(--color-text-muted)]">
                            {permiso.descripcion}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {permiso.categoria}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === ACCIONES === */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Restablecer</Button>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
          Guardar Permisos
        </Button>
      </div>
    </div>
  );
}
