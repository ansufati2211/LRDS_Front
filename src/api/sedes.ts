import api from './client';

export interface Sede {
  id: number;
  empresaId: number;
  nombre: string;
  codigoEstablecimiento?: string;
  direccion?: string;
  estadoRegistro: boolean;
}

// FIX: Inyectamos /v1 porque SedeController lo usa
export const getSedes = () => api.get<Sede[]>('/v1/sedes').then(r => r.data);
export const crearSede = (data: Partial<Sede>) => api.post<Sede>('/v1/sedes', data).then(r => r.data);
export const actualizarSede = (id: number, data: Partial<Sede>) => api.put<Sede>(`/v1/sedes/${id}`, data).then(r => r.data);
export const eliminarSede = (id: number) => api.delete(`/v1/sedes/${id}`).then(r => r.data);
export const activarSede = (id: number) => api.put(`/v1/sedes/${id}/activar`).then(r => r.data);