import api from './client';
import type { AuthResponse, LoginRequest } from '@/types';

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);
