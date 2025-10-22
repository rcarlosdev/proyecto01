import UsuarioDetailView from "@/modules/usuarios/ui/views/usuario-detail-view";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const resolvedParams = await params; // 👈 se resuelve la promesa
  const activeTab =
    typeof searchParams?.tab === "string" ? searchParams.tab : "General";

  return (
    <UsuarioDetailView
      usuarioId={resolvedParams.id}
      activeTab={activeTab}
    />
  );
}
