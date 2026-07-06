import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  // ¡CAMBIO MAESTRO! Apuntamos directo a tu Java, saltándonos a Vite
  baseURL: 'http://localhost:8080/api', 
  headers: { 'Content-Type': 'application/json' },
});

// Agrega el JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige al login si el token expiró o es inválido
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;