// stores/useUserStore.ts
import { create } from "zustand";
import type { Session, User } from "better-auth"; // Asegúrate de tener los tipos exportados

interface UserState {
  user: User | null;
  session: Session | null;
  /** Guarda la información del usuario actual */
  setUser: (user: User | null) => void;
  /** Guarda la sesión completa (tokens, fechas, etc.) */
  setSession: (session: Session | null) => void;
  /** Limpia completamente el estado del usuario */
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  session: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearUser: () => set({ user: null, session: null }),
}));
