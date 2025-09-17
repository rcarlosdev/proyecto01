"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ["General", "Roles", "Permisos"];

export default function UsuariosTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();

  return (
    <Tabs value={activeTab}>
      <TabsList className="flex gap-2">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className={`px-3 py-1 rounded-md border 
              ${activeTab === tab 
                ? "text-yellow-400 border-yellow-400" 
                : "text-foreground border-transparent hover:border-muted-foreground"}`}
            onClick={() => router.push(`/usuarios?tab=${tab}`)}
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
