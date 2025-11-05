"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Shield, Lock } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         COMPONENTES BÁSICOS (ESTILO)                       */
/* -------------------------------------------------------------------------- */
const Card = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ children }: { children?: React.ReactNode }) => <div className="p-4 md:p-6 pb-2">{children}</div>;
const CardTitle = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-semibold text-[var(--color-primary)] flex items-center gap-2 ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <div className={`p-4 md:p-6 pt-2 ${className}`}>{children}</div>
);
const Button = ({
  children,
  onClick,
  variant = "default",
  disabled,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
}) => {
  const base =
    "px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    default:
      "bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-light)]",
    outline:
      "border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
    destructive: "bg-[var(--color-danger)] hover:bg-red-600 text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
};
const Input = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <input
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]"
  />
);
const Checkbox = ({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) => (
  <input
    type="checkbox"
    checked={checked}
    disabled={disabled}
    onChange={(e) => onChange(e.target.checked)}
    className={`w-4 h-4 accent-[var(--color-primary)] cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  />
);
const Badge = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-[var(--color-border)] ${className}`}
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/*                             TIPO E INTERFAZ                                */
/* -------------------------------------------------------------------------- */
interface PermisosTabProps {
  usuarioId?: string;
}
type Permiso = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
};

/* -------------------------------------------------------------------------- */
/*                            COMPONENTE PRINCIPAL                            */
/* -------------------------------------------------------------------------- */
export function PermisosTab({ usuarioId }: PermisosTabProps) {
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [permisosUsuario, setPermisosUsuario] = useState<string[]>([]);
  const [rol, setRol] = useState<"Usuario" | "Colaborador" | "Administrador">("Usuario");

  /* ----------------------------- LISTA PERMISOS ---------------------------- */
  const permisos: Permiso[] = [
    // Trading
    { id: "operar", nombre: "Operar", categoria: "trading", descripcion: "Realizar operaciones de compra y venta" },
    { id: "limite_alto", nombre: "Límite Alto", categoria: "trading", descripcion: "Operar con montos elevados" },
    { id: "mercado_cripto", nombre: "Mercado Cripto", categoria: "trading", descripcion: "Acceso al mercado cripto" },
    // Análisis
    { id: "graficos_avanzados", nombre: "Gráficos Avanzados", categoria: "analisis", descripcion: "Herramientas de análisis técnico" },
    { id: "reportes", nombre: "Reportes", categoria: "analisis", descripcion: "Acceso a reportes detallados" },
    // Soporte
    { id: "soporte_usuario", nombre: "Soporte a Usuarios", categoria: "soporte", descripcion: "Atender solicitudes de usuarios" },
    { id: "ver_tickets", nombre: "Ver Tickets", categoria: "soporte", descripcion: "Ver y gestionar tickets de soporte" },
    // Administración
    { id: "gestion_usuarios", nombre: "Gestión de Usuarios", categoria: "admin", descripcion: "Administrar usuarios del sistema" },
    { id: "gestion_saldos", nombre: "Gestión de Saldos", categoria: "admin", descripcion: "Puede realizar transacciones sobre las cuentas de los usuarios" },
    { id: "asignar_permisos", nombre: "Asignar/Modificar Permisos", categoria: "admin", descripcion: "Puede otorgar o revocar permisos a otros usuarios" },
    { id: "config_sistema", nombre: "Configuración del Sistema", categoria: "admin", descripcion: "Modificar configuración global" },
    { id: "ver_logs", nombre: "Ver Logs", categoria: "admin", descripcion: "Acceso a auditorías del sistema" },
  ];

  /* --------------------------- ROLES Y PERMISOS BASE ----------------------- */
  const permisosPorRol: Record<string, string[]> = {
    Usuario: permisos.filter(p => p.categoria !== "admin" && p.categoria !== "soporte").map(p => p.id),
    Colaborador: [
      ...permisos.filter(p => ["trading", "analisis", "soporte"].includes(p.categoria)).map(p => p.id),
    ],
    Administrador: permisos.map(p => p.id),
  };

  /* ----------------------------- EFECTO INICIAL ---------------------------- */
  useEffect(() => {
    if (usuarioId) setRol("Usuario"); // Simulado
    setPermisosUsuario(permisosPorRol["Usuario"]);
    setLoading(false);
  }, [usuarioId]);

  /* ----------------------------- CAMBIO DE ROL ----------------------------- */
  const handleRolChange = (nuevoRol: typeof rol) => {
    setRol(nuevoRol);
    setPermisosUsuario(permisosPorRol[nuevoRol]);
  };

  /* -------------------------- LÓGICA DE BLOQUEO ---------------------------- */
  const esPermisoFijo = (permiso: Permiso): boolean =>
    ["operar", "graficos_avanzados", "reportes"].includes(permiso.id);

  const esEditablePorAdminSolo = (permiso: Permiso): boolean =>
    ["gestion_usuarios", "gestion_saldos"].includes(permiso.id);

  const isPermisoBloqueado = (permiso: Permiso): boolean => {
    if (esPermisoFijo(permiso)) return true; // siempre fijo
    if (rol === "Administrador") return false;
    if (rol === "Usuario") return permiso.categoria === "admin" || permiso.categoria === "soporte";
    if (rol === "Colaborador" && permiso.categoria === "admin") {
      return !esEditablePorAdminSolo(permiso); // solo esos dos son editables
    }
    return false;
  };

  const isCheckedFijo = (permiso: Permiso): boolean => {
    if (esPermisoFijo(permiso)) return true;
    if (rol === "Administrador") return true;
    if (rol === "Usuario") return permisosUsuario.includes(permiso.id);
    if (rol === "Colaborador") {
      if (esEditablePorAdminSolo(permiso)) return permisosUsuario.includes(permiso.id);
      return permisosUsuario.includes(permiso.id);
    }
    return false;
  };

  /* ------------------------------ TOGGLE PERMISOS -------------------------- */
  const togglePermiso = (id: string) => {
    const permiso = permisos.find((p) => p.id === id);
    if (!permiso || isPermisoBloqueado(permiso) || esPermisoFijo(permiso)) return;
    setPermisosUsuario((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ------------------------------- FILTRO UI ------------------------------- */
  const permisosFiltrados = permisos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const categoriasOrdenadas = ["trading", "analisis", "soporte", "admin"];
  const permisosPorCategoria = categoriasOrdenadas.reduce((acc, cat) => {
    acc[cat] = permisosFiltrados.filter((p) => p.categoria === cat);
    return acc;
  }, {} as Record<string, Permiso[]>);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
        <Loader2 className="animate-spin h-8 w-8 mb-4 text-[var(--color-primary)]" />
        <p>Cargando permisos...</p>
      </div>
    );

  /* -------------------------------------------------------------------------- */
  /*                                  UI FINAL                                 */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Rol */}
      <Card className="border-l-4 border-l-yellow-400">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Shield className="h-5 w-5" /> Rol Asignado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--color-text-muted)] text-sm">
            Este usuario pertenece al rol: <b>{rol}</b>
          </p>
          <div className="flex flex-wrap gap-3">
            {["Usuario", "Colaborador", "Administrador"].map((r) => (
              <Button
                key={r}
                variant={r === rol ? "default" : "outline"}
                onClick={() => handleRolChange(r as any)}
              >
                {r}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permisos */}
      <Card className="border-l-4 border-l-blue-400">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <Lock className="h-5 w-5" /> Permisos Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input placeholder="Buscar permisos..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

          <div className="space-y-5">
            {Object.entries(permisosPorCategoria).map(([categoria, lista]) => (
              <div key={categoria} className="border rounded-xl bg-[var(--color-surface-alt)]">
                <div className="p-3 border-b bg-[var(--color-surface)] font-semibold text-[var(--color-primary)] capitalize">
                  {categoria}
                </div>
                <div className="p-4 space-y-3">
                  {lista.map((permiso) => {
                    const bloqueado = isPermisoBloqueado(permiso);
                    const checked = isCheckedFijo(permiso) || permisosUsuario.includes(permiso.id);
                    return (
                      <div
                        key={permiso.id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          bloqueado ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={checked}
                            onChange={() => togglePermiso(permiso.id)}
                            disabled={bloqueado}
                          />
                          <div>
                            <div className="font-medium">{permiso.nombre}</div>
                            <div className="text-sm text-[var(--color-text-muted)]">{permiso.descripcion}</div>
                          </div>
                        </div>
                        <Badge className="capitalize">{permiso.categoria}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleRolChange(rol)}>
          Restablecer
        </Button>
        <Button onClick={() => toast.success("Permisos guardados correctamente")}>
          Guardar Permisos
        </Button>
      </div>
    </div>
  );
}
