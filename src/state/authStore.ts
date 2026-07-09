import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { supabase } from "@/lib/supabase";

export type AuthResult = { error: string | null };

type AuthStore = {
  session: Session | null;
  user: User | null;
  isHydrating: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
};

export const useAuthStore = create<AuthStore>((set) => {
  // Fires once immediately with the current session (or null) even before any
  // real auth event happens, which is what resolves isHydrating on startup.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({ session, user: session?.user ?? null, isHydrating: false });
  });

  return {
    session: null,
    user: null,
    isHydrating: true,

    async signInWithPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      return { error: error?.message ?? null };
    },

    async signUp(email, password) {
      const { error } = await supabase.auth.signUp({ email, password });

      return { error: error?.message ?? null };
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    async resetPasswordForEmail(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      return { error: error?.message ?? null };
    }
  };
});
