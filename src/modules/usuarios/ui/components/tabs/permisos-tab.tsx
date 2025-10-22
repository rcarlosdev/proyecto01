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

export default function PermisosTab({ usuarioId }: PermisosTabProps) {
  const [permisos, setPermisos] = useState<Permiso[]>([
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
    { id: "ver_tickets", nombre: "Ver Tickets", categoria: "soporte", descripcion: "Acceso a tickets de soporte" }
  ]);

  const [permisosUsuario, setPermisosUsuario] = useState<string[]>([
    "operar", "graficos_avanzados", "datos_historicos"
  ]);

  const [busqueda, setBusqueda] = useState("");

  const togglePermiso = (permisoId: string) => {
    setPermisosUsuario(prev => 
      prev.includes(permisoId) 
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  const permisosFiltrados = permisos.filter(permiso =>
    permiso.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    permiso.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const permisosPorCategoria = permisosFiltrados.reduce((acc, permiso) => {
    if (!acc[permiso.categoria]) {
      acc[permiso.categoria] = [];
    }
    acc[permiso.categoria].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  const categorias = {
    trading: "Trading",
    analisis: "Análisis",
    admin: "Administración",
    soporte: "Soporte"
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Permisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Resumen de Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{permisosUsuario.length}</div>
              <div className="text-sm text-muted-foreground">Permisos Activos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {Object.keys(permisosPorCategoria).length}
              </div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {permisos.filter(p => !permisosUsuario.includes(p.id)).length}
              </div>
              <div className="text-sm text-muted-foreground">Permisos Disponibles</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {permisos.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Permisos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Gestión de Permisos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar permisos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {/* Permisos por Categoría */}
          <div className="space-y-6">
            {Object.entries(permisosPorCategoria).map(([categoria, permisosCategoria]) => (
              <div key={categoria} className="border rounded-lg">
                <div className="bg-muted p-3 border-b">
                  <h3 className="font-semibold">
                    {categorias[categoria as keyof typeof categorias] || categoria}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {permisosCategoria.map(permiso => (
                    <div key={permiso.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={permisosUsuario.includes(permiso.id)}
                          onCheckedChange={() => togglePermiso(permiso.id)}
                        />
                        <div>
                          <div className="font-medium">{permiso.nombre}</div>
                          <div className="text-sm text-muted-foreground">{permiso.descripcion}</div>
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

      {/* Acciones */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline">Restablecer</Button>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
          Guardar Permisos
        </Button>
      </div>
    </div>
  );
}