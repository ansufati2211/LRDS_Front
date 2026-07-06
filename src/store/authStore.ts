import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token'> | null;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (data) => {
        const { token, ...user } = data;
        set({ token, user }); // Persist lo guarda en localStorage automáticamente
      },

      logout: () => {
        set({ token: null, user: null }); // Persist lo borra automáticamente
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'veronica-auth', // Nombre de la llave en localStorage
    }
  )
);