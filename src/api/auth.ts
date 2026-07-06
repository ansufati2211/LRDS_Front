import api from './client';
import type { AuthResponse, LoginRequest } from '@/types/auth';

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);