import api from './client';

export interface Sede {
  id: number;
  empresaId: number;
  nombre: string;
  codigoEstablecimiento?: string;
  direccion?: string;
  estadoRegistro: boolean;
}

export const getSedes = () => api.get<Sede[]>('/sedes').then(r => r.data);
export const crearSede = (data: Partial<Sede>) => api.post<Sede>('/sedes', data).then(r => r.data);
export const actualizarSede = (id: number, data: Partial<Sede>) => api.put<Sede>(`/sedes/${id}`, data).then(r => r.data);
export const eliminarSede = (id: number) => api.delete(`/sedes/${id}`).then(r => r.data);
export const activarSede = (id: number) => api.put(`/sedes/${id}/activar`).then(r => r.data);