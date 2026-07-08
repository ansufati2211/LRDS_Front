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
  password?: string; // Obligatorio al crear, opcional al editar
  rol: string;
}

export const getUsuarios = () => 
  api.get<Usuario[]>('/usuarios').then((r) => r.data);

export const crearUsuario = (data: UsuarioRequestDTO) => 
  api.post<Usuario>('/usuarios', data).then((r) => r.data);

export const actualizarUsuario = (id: number, data: UsuarioRequestDTO) => 
  api.put<Usuario>(`/usuarios/${id}`, data).then((r) => r.data);

export const eliminarUsuario = (id: number) => 
  api.delete(`/usuarios/${id}`).then((r) => r.data);

export const resetearPassword = (id: number, passwordNueva: string) =>
  api.put(`/usuarios/${id}/resetear-password`, { passwordNueva }).then((r) => r.data);