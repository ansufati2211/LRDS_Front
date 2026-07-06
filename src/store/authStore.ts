import { create } from 'zustand';
import type { AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: Omit<AuthResponse, 'token'> | null;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const stored = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: stored ? (JSON.parse(stored) as Omit<AuthResponse, 'token'>) : null,

  setAuth: (data) => {
    const { token, ...user } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!get().token,
}));
