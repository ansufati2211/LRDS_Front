import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token'> | null;
  sedeSeleccionadaId: number | null; 
  setAuth: (data: AuthResponse) => void;
  setSedeSeleccionadaId: (id: number | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean; // <-- RESTAURADO
}

export const useAuthStore = create<AuthState>()(
  persist(
    // Agregamos 'get' aquí de nuevo para poder leer el token
    (set, get) => ({ 
      token: null,
      user: null,
      sedeSeleccionadaId: null,
      setAuth: (data) => {
        const { token, ...user } = data;
        set({ token, user });
      },
      setSedeSeleccionadaId: (id) => set({ sedeSeleccionadaId: id }),
      logout: () => set({ token: null, user: null, sedeSeleccionadaId: null }),
      isAuthenticated: () => !!get().token, // <-- RESTAURADO
    }),
    {
      name: 'auth-storage',
    }
  )
);