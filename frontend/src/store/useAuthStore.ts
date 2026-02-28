import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import Cookies from "js-cookie";

interface User {
  studentId: string;
  name: string;
  role: string;
  department: string;
  grade?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (payload: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  updateUser: (partial: Partial<User>) => void;
}

// Persist storage wrapper to fix hydration issues in Next.js
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (payload) => {
        // payload: { studentId, password }
        const res = await api.post("/auth/login", payload);

        if (res.data.success) {
          const token = res.data.data.token;

          // Set Cookie for Middleware
          Cookies.set("auth_token", token, { expires: 1 }); // 1 day

          set({
            token: token,
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

      logout: () => {
        // Remove Cookie
        Cookies.remove("auth_token");
        set({ token: null, user: null });

        // Force reload to clear any server-side cached states or middleware context if needed
        // window.location.href = '/login';
      },

      isAuthenticated: () => {
        return !!get().token;
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
      // Rehydration 時驗證 Cookie 是否仍存在
      // Cookie (1 天過期) 是認證的唯一真相來源；
      // 若 Cookie 已失效，localStorage 中的殘留 token 必須清除，避免誤判為登入狀態。
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState>;

        if (persisted?.token) {
          const cookieExists =
            typeof document !== "undefined" && !!Cookies.get("auth_token");

          if (!cookieExists) {
            // Cookie 已過期或被清除 → 不還原舊的認證狀態
            return { ...currentState, token: null, user: null };
          }
        }

        // Cookie 仍有效 (或本來就沒有 token) → 正常還原
        return { ...currentState, ...persisted };
      },
    },
  ),
);
