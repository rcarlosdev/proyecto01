import UsuariosView from "@/modules/usuarios/ui/views/usuarios-view";

export default function Page({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab ?? "General";

  return <UsuariosView activeTab={activeTab} />;
}
