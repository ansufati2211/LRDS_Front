import api from './client';

export interface Empresa {
  id: number;
  nombreComercial: string;
  ruc: string;
  direccion: string;
}

export const getMiEmpresa = () => api.get<Empresa>('/empresas/mi-empresa').then(r => r.data).catch(() => null); 