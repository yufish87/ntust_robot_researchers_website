import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
  studentId: string;
  name: string;
  role: string;
  department: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (payload: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Persist storage wrapper to fix hydration issues in Next.js
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (payload) => {
        // payload: { studentId, password }
        const res = await api.post('/auth/login', payload);
        
        if (res.data.success) {
          const token = res.data.data.token;
          
          // Set Cookie for Middleware
          Cookies.set('auth_token', token, { expires: 1 }); // 1 day

          set({
            token: token,
            user: res.data.data.user
          });
        } else {
          throw new Error(res.data.message || 'Login failed');
        }
      },

      logout: () => {
        // Remove Cookie
        Cookies.remove('auth_token');
        set({ token: null, user: null });
        
        // Force reload to clear any server-side cached states or middleware context if needed
        // window.location.href = '/login'; 
      },

      isAuthenticated: () => {
        return !!get().token;
      }
    }),
    {
      name: 'auth-storage', 
    }
  )
);

