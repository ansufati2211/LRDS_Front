import api from './client';

export interface Empresa {
  id: number;
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
}

export const getMiEmpresa = () => api.get<Empresa>('/empresas/mi-empresa').then(r => r.data).catch(() => null);
// export const actualizarEmpresa = (data: Partial<Empresa>) => api.put<Empresa>('/empresas/mi-empresa', data).then(r => r.data);