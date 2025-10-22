// src/app/(app)/(dashboard)/admin/usuarios/[id]/page.tsx
import UsuarioDetailView from "@/modules/usuarios/ui/views/usuario-detail-view";

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  const activeTab =
    typeof searchParams?.tab === "string" ? searchParams.tab : "General";

  return <UsuarioDetailView usuarioId={params.id} activeTab={activeTab} />;
}
