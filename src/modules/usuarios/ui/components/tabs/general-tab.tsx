"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; // opcional, si usas notificaciones

interface Usuario {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "banned";
  preferences: {
    phone?: string;
    kycVerified?: boolean;
    twoFactorEnabled?: boolean;
    experience?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GeneralTabProps {
  usuarioId?: string;
}

export default function GeneralTab({ usuarioId }: GeneralTabProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Obtener datos reales
  useEffect(() => {
    if (!usuarioId) return;
    const fetchUsuario = async () => {
      try {
        const res = await fetch(`/api/usuarios/${usuarioId}`);
        if (!res.ok) throw new Error("Error al cargar usuario");
        const data = await res.json();
        setUsuario(data);
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, [usuarioId]);

  // ✅ Guardar cambios
  const handleSave = async () => {
    if (!usuarioId || !usuario) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/usuarios/${usuarioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Cambios guardados correctamente");
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-sm text-muted-foreground">Cargando datos...</p>;
  }

  if (!usuario) {
    return <p className="text-center text-sm text-muted-foreground">Usuario no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={usuario.name}
                onChange={(e) => setUsuario({ ...usuario, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={usuario.email}
                onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={usuario.preferences?.phone ?? ""}
              onChange={(e) =>
                setUsuario({
                  ...usuario,
                  preferences: { ...usuario.preferences, phone: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Estado y Seguridad */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-400">Estado de Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Estado:</span>
              <Badge
                variant={
                  usuario.status === "active"
                    ? "default"
                    : usuario.status === "inactive"
                    ? "secondary"
                    : "destructive"
                }
              >
                {usuario.status === "active"
                  ? "Activo"
                  : usuario.status === "inactive"
                  ? "Inactivo"
                  : "Suspendido"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>KYC Verificado:</span>
              <Badge
                variant={
                  usuario.preferences?.kycVerified ? "default" : "destructive"
                }
              >
                {usuario.preferences?.kycVerified ? "Verificado" : "Pendiente"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Nivel de Experiencia:</span>
              <Badge variant="outline">
                {usuario.preferences?.experience ?? "No definido"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-400">Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="twoFactor">Autenticación de Dos Factores</Label>
              <Switch
                id="twoFactor"
                checked={usuario.preferences?.twoFactorEnabled ?? false}
                onCheckedChange={(checked) =>
                  setUsuario({
                    ...usuario,
                    preferences: {
                      ...usuario.preferences,
                      twoFactorEnabled: checked,
                    },
                  })
                }
              />
            </div>
            <Button variant="outline" className="w-full">
              Cambiar Contraseña
            </Button>
            <Button variant="outline" className="w-full">
              Reenviar Verificación Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fechas y Actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Registro</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(usuario.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label>Última Actualización</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(usuario.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-400 text-black hover:bg-yellow-500 transition-colors"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
