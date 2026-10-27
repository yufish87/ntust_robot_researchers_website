import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import type { MembershipRecord } from "@/lib/types/user";

interface User {
  studentId: string;
  name: string;
  role: string;
  department: string;
  grade?: string;
  email?: string;
  membershipHistory?: MembershipRecord[]; // 歷年身份組
  activeUntilYear?: string;              // 有效截止學年，如 "115"
  isLineBound?: boolean;                 // 是否已綁定 LINE 官方帳號
  hasCustomEmail?: boolean;              // 是否已自行設定個人常用信箱
  isEmailDefault?: boolean;              // 是否為系統預設之學校信箱
}

interface AuthState {
  user: User | null;
  authChecked: boolean;
  login: (payload: { studentId: string; password: string }) => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  syncSession: (force?: boolean) => Promise<void>;
  isAuthenticated: () => boolean;
  isExpired: () => boolean;
  updateUser: (partial: Partial<User>) => void;
}

let syncSessionPromise: Promise<void> | null = null;

// Persist storage wrapper to fix hydration issues in Next.js
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authChecked: false,

      login: async (payload) => {
        try {
          // payload: { studentId, password }
          const res = await api.post("/auth/login", payload);

          if (res.data.success) {
            // token 已由 server-side BFF proxy 設定為 HttpOnly cookie
            // client 只收到 user info，確保 studentId 轉為 string 防止 TypeError
            const rawUser = res.data.data?.user;
            const normalizedUser = rawUser
              ? {
                  ...rawUser,
                  studentId: String(rawUser.studentId),
                  isLineBound: Boolean(rawUser.isLineBound),
                  hasCustomEmail: Boolean(rawUser.hasCustomEmail),
                  isEmailDefault: Boolean(rawUser.isEmailDefault),
                }
              : null;

            set({
              user: normalizedUser,
              authChecked: true,
            });
          } else {
            throw new Error(res.data.message || "登入失敗");
          }
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "登入失敗，請稍後再試";
          throw new Error(message);
        }
      },

      register: async (payload) => {
        try {
          // payload: { studentId, password, name, dept, grade, verifyCode }
          const res = await api.post("/auth/register", payload);

          if (!res.data.success) {
            throw new Error(res.data.message || "註冊失敗");
          }
        } catch (error: any) {
          const message =
            error.response?.data?.message ||
            error.message ||
            "註冊失敗，請稍後再試";
          throw new Error(message);
        }
      },

      logout: async () => {
        try {
          // 呼叫 server-side API 清除 HttpOnly cookie
          await api.post("/auth/logout");
        } catch {
          // 即使呼叫失敗也清除 client state
        }
        set({ user: null, authChecked: true });
      },

      syncSession: async (force = false) => {
        if (!force && get().authChecked) return;

        if (syncSessionPromise) {
          await syncSessionPromise;
          return;
        }

        syncSessionPromise = (async () => {
          try {
            const res = await api.get("/auth/session", {
              headers: { "Cache-Control": "no-store" },
            });

            const hasSessionResult =
              !!res.data?.success &&
              typeof res.data?.data?.authenticated === "boolean";
            if (!hasSessionResult) {
              throw new Error("Session check unavailable");
            }

            const authenticated =
              !!res.data?.success && !!res.data?.data?.authenticated;
            const rawNextUser = authenticated
              ? (res.data?.data?.user as User | null)
              : null;
            const nextUser = rawNextUser
              ? {
                  ...rawNextUser,
                  studentId: String(rawNextUser.studentId),
                  isLineBound: Boolean(rawNextUser.isLineBound),
                  hasCustomEmail: Boolean(rawNextUser.hasCustomEmail),
                  isEmailDefault: Boolean(rawNextUser.isEmailDefault),
                }
              : null;

            set({
              user: nextUser,
              authChecked: true,
            });
          } catch {
            set((state) => ({ user: state.user, authChecked: true }));
          } finally {
            syncSessionPromise = null;
          }
        })();

        await syncSessionPromise;
      },

      isAuthenticated: () => {
        return get().authChecked && !!get().user;
      },

      isExpired: () => {
        return get().user?.role === "expired";
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          const next = { ...current, ...partial };
          if (next.studentId !== undefined) {
            next.studentId = String(next.studentId);
          }
          set({ user: next });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);
