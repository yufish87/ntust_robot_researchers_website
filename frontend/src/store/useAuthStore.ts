import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

interface User {
  studentId: string;
  name: string;
  role: string;
  department: string;
  grade?: string;
}

interface AuthState {
  user: User | null;
  login: (payload: { studentId: string; password: string }) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  updateUser: (partial: Partial<User>) => void;
}

// Persist storage wrapper to fix hydration issues in Next.js
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: async (payload) => {
        // payload: { studentId, password }
        const res = await api.post("/auth/login", payload);

        if (res.data.success) {
          // token 已由 server-side BFF proxy 設定為 HttpOnly cookie
          // client 只收到 user info
          set({
            user: res.data.data.user,
          });
        } else {
          throw new Error(res.data.message || "Login failed");
        }
      },

      register: async (payload) => {
        // payload: { studentId, password, name, dept, grade, verifyCode }
        const res = await api.post("/auth/register", payload);

        if (res.data.success) {
          return;
        } else {
          throw new Error(res.data.message || "Registration failed");
        }
      },

      logout: async () => {
        try {
          // 呼叫 server-side API 清除 HttpOnly cookie
          await api.post("/auth/logout");
        } catch {
          // 即使呼叫失敗也清除 client state
        }
        set({ user: null });
      },

      isAuthenticated: () => {
        return !!get().user;
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

