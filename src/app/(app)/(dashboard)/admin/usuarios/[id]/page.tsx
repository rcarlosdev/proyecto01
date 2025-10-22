import UsuarioDetailView from "@/modules/usuarios/ui/views/usuario-detail-view";

export default function Page({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const activeTab = searchParams.tab ?? "General";

  return <UsuarioDetailView usuarioId={params.id} activeTab={activeTab} />;
}