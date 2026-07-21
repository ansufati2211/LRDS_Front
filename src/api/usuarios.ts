import api from './client';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  estadoRegistro: boolean;
}

export interface UsuarioRequestDTO {
  nombre: string;
  correo: string;
  password?: string; 
  rol: string;
  sedeId?: number;
}

export const getUsuarios = (sedeId?: number) => 
   api.get<Usuario[]>('/usuarios', { params: { sedeId } }).then((r) => r.data);

export const crearUsuario = (data: UsuarioRequestDTO) => 
   api.post<Usuario>('/usuarios', data).then((r) => r.data);

export const actualizarUsuario = (id: number, data: UsuarioRequestDTO) => 
   api.put<Usuario>(`/usuarios/${id}`, data).then((r) => r.data);

export const eliminarUsuario = (id: number) => 
   api.delete(`/usuarios/${id}`).then((r) => r.data);

// 🔥 FIX: Añadimos el objeto vacío {} para evitar el Error 500 del backend
export const activarUsuario = (id: number) => 
   api.put(`/usuarios/${id}/activar`, {}).then(r => r.data);

export const resetearPassword = (id: number, nuevaPassword: string) => 
   api.put(`/usuarios/${id}/reset-password`, { nuevaPassword }).then(r => r.data);