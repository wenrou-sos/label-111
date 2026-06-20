import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  hasPerm: (perm: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (username, password) => {
      const res = await api.login(username, password);
      if (res.ok && res.user && res.token) {
        set({ user: res.user, token: res.token });
        return { ok: true };
      }
      return { ok: false, message: res.message || "登录失败" };
    },
    logout: () => {
      set({ user: null, token: null });
    },
    hasPerm: (perm) => {
      const user = get().user;
      if (!user) return false;
      return user.perms[perm] === true;
    },
  }),
  {
    name: "auth-storage",
  }
));
