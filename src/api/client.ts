// 1. Corrección TS1484: Agregamos la palabra "type" a las importaciones de interfaces
import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  const sedeId = useAuthStore.getState().sedeSeleccionadaId;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sedeId) {
    config.headers['X-Sede-ID'] = sedeId.toString();
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // 2. Corrección SonarLint: Usamos Optional Chaining (?.)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;