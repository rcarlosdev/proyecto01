
// src/modules/usuarios/ui/views/usuarios-list-view.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Settings } from "lucide-react";

type Usuario = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  estado: "activo" | "inactivo" | "suspendido";
  fechaRegistro: string;
  ultimoAcceso: string;
  kycVerificado: boolean;
};

export default function UsuariosListView() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) throw new Error("Error al obtener usuarios");
        const data = await res.json();
        setUsuarios(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    fetchUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideBusqueda = 
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === "todos" || usuario.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  const navegarAUsuario = (usuarioId: string) => {
    router.push(`/admin/usuarios/${usuarioId}?tab=General`);
  };

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case "activo": return "default";
      case "inactivo": return "secondary";
      case "suspendido": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra todos los usuarios del sistema de trading
          </p>
        </div>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border rounded-md bg-background"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-yellow-400">{usuarios.length}</div><div className="text-sm text-muted-foreground">Total Usuarios</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-400">{usuarios.filter(u => u.estado === "activo").length}</div><div className="text-sm text-muted-foreground">Activos</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-blue-400">{usuarios.filter(u => u.kycVerificado).length}</div><div className="text-sm text-muted-foreground">KYC Verificado</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-orange-400">{usuarios.filter(u => u.rol === "Trader").length}</div><div className="text-sm text-muted-foreground">Traders</div></CardContent></Card>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader><CardTitle>Lista de Usuarios</CardTitle></CardHeader>
        <CardContent>
          {cargando ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : usuariosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {usuariosFiltrados.map(usuario => (
                <div 
                  key={usuario.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navegarAUsuario(usuario.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="font-bold text-black">
                        {usuario.nombre[0]}{usuario.apellido[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{usuario.nombre} {usuario.apellido}</h3>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{usuario.rol}</Badge>
                    <Badge variant={getBadgeVariant(usuario.estado)}>{usuario.estado}</Badge>
                    {usuario.kycVerificado && <Badge variant="default" className="bg-green-500">KYC</Badge>}
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navegarAUsuario(usuario.id); }}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No se encontraron usuarios</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
