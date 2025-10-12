"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserStore } from "@/stores/useUserStore";

export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const setSession = useUserStore((state) => state.setSession);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      setSession(session.session);
    } else if (!isPending) {
      clearUser();
    }
  }, [session, isPending, setUser, setSession, clearUser]);

  return <>{children}</>;
}
