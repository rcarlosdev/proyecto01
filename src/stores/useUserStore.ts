// // stores/useUserStore.ts
// import { create } from "zustand";
// import type { Session } from "better-auth"; // Asegúrate de tener los tipos exportados
// import type { User } from "@/types/interfaces";

// interface UserState {
//   user: User | null;
//   session: Session | null;
//   /** Guarda la información del usuario actual */
//   setUser: (user: User | null) => void;
//   /** Guarda la sesión completa (tokens, fechas, etc.) */
//   setSession: (session: Session | null) => void;
//   /** Limpia completamente el estado del usuario */
//   clearUser: () => void;
//   updateUserBalance: (newBalance: number) => void;
// }

// export const useUserStore = create<UserState>((set) => ({
//   user: null,
//   session: null,

//   setUser: (user) => set({ user }),
//   setSession: (session) => set({ session }),
//   clearUser: () => set({ user: null, session: null }),
//   updateUserBalance: (newBalance) =>
//     set((state) => ({
//       user: state.user ? { ...state.user, balance: Number(newBalance.toFixed(2)) } : null,
//     })),
// }));

// stores/useUserStore.ts
import { create } from "zustand";
import type { Session } from "better-auth";
import type { User } from "@/types/interfaces";

function shallowEqual<T extends object>(a: T, b: T) {
  if (a === b) return true;
  const ka = Object.keys(a) as (keyof T)[];
  const kb = Object.keys(b) as (keyof T)[];
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

interface UserState {
  user: User | null;
  session: Session | null;
  lastSyncedAt: number | null;
  // Sets
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearUser: () => void;
  // Updates
  mergeUser: (partial: Partial<User>) => void;
  updateUserBalance: (newBalance: number) => void;
  // Interno
  _setUserIfChanged: (next: User | null) => void;
  _markSynced: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  session: null,
  lastSyncedAt: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearUser: () => set({ user: null, session: null, lastSyncedAt: Date.now() }),

  mergeUser: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const merged = { ...state.user, ...partial };
      if (shallowEqual(state.user, merged)) return state;
      return { user: merged, lastSyncedAt: Date.now() };
    }),

  updateUserBalance: (newBalance) =>
    set((state) => {
      if (!state.user) return state;
      const fixed = Number(newBalance.toFixed(2));
      if (state.user.balance === fixed) return state;
      return { user: { ...state.user, balance: fixed }, lastSyncedAt: Date.now() };
    }),

  _setUserIfChanged: (next) =>
    set((state) => {
      if (state.user === null && next === null) return state;
      if (state.user && next) {
        // compara de forma ligera (id + campos más comunes). Ajusta según tu modelo.
        const sameId = state.user.id === next.id;
        const sameSnapshot = shallowEqual(
          {
            id: state.user.id,
            email: state.user.email,
            name: state.user.name,
            balance: state.user.balance,
            role: (state.user as any).role,
          },
          {
            id: next.id,
            email: next.email,
            name: next.name,
            balance: next.balance,
            role: (next as any).role,
          }
        );
        if (sameId && sameSnapshot) return state;
      }
      return { user: next, lastSyncedAt: Date.now() };
    }),

  _markSynced: () => set({ lastSyncedAt: Date.now() }),
}));
