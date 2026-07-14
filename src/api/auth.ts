import axios from 'axios'; // Usamos axios nativo en lugar de nuestro cliente configurado
import type { AuthResponse, LoginRequest } from '@/types/auth';

export const login = (data: LoginRequest) =>
  // Al usar axios directamente, ignoramos el "/v1" de nuestra configuración 
  // y apuntamos a la ruta exacta que dejó tu compañero en su controlador.
  axios.post<AuthResponse>('http://localhost:8080/api/auth/login', data).then((r) => r.data);