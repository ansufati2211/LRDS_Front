import api from './client';
import type { AuthResponse, LoginRequest } from '@/types/auth';

export const login = (data: LoginRequest) =>
  // Usamos el api client global para asegurar que los headers y la URL base sean correctos
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);