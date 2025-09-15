

// src/app/page.tsx
import { HomeView } from "@/modules/home/ui/views/home-view";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const Home = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in"); // 👈 corregido: estaba "/sing-in"
  }

  return <HomeView user={session.user} />;
};

export default Home;
