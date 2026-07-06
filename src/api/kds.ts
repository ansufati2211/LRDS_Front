import api from './client';

export interface KdsPedido {
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  mozo: string;
  estado: string;
  nombreProducto: string;
  cantidad: number;
  notasPreparacion: string;
  horaRecibido: string;
}

export const getKdsPendientes = () =>
  api.get<KdsPedido[]>('/kds/pendientes').then((r) => r.data);

export const marcarPreparando = (id: number) =>
  api.put(`/kds/${id}/preparando`).then((r) => r.data);

export const marcarListo = (id: number) =>
  api.put(`/kds/${id}/listo`).then((r) => r.data);
