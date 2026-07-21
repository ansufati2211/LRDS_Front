import api from './client';

export interface Empresa {
  id: number;
  nombreComercial: string;
  ruc: string;
  direccion: string;
}
// FIX: Inyectamos /v1 porque EmpresaController lo usa
export const getMiEmpresa = () => api.get<Empresa>('/v1/empresas/mi-empresa').then(r => r.data).catch(() => null);