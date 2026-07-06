export type RolUsuario = 
  | 'ROLE_SUPER_ADMIN' 
  | 'ROLE_GERENTE' 
  | 'ROLE_CAJERO' 
  | 'ROLE_MOZO' 
  | 'ROLE_COCINA';

export interface AuthResponse {
  token: string;
  usuarioId: number;
  empresaId: number;
  correo: string;
  nombre: string;
  rol: RolUsuario;
  modulosHabilitados?: string[];
  estadoSuscripcion?: string;
}

export interface LoginRequest {
  correo: string;
  password: string;
}