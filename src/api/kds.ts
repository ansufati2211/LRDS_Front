import api from './client';

export interface KdsPedido {
  detalleId: number;
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  estadoPedido: string;
  horaIngreso: string;
  minutosTranscurridos: number;
  cantidad: number;
  producto: string;
  notasPreparacion: string;
  estadoItem: string;
  numeroComanda: number;
}

export interface PorcionDisponible {
  productoId: number;
  producto: string;
  // null si el producto no tiene receta cargada
  porcionesDisponibles: number | null;
  estadoDisponibilidad: 'DISPONIBLE' | 'AGOTADO_TEMPORAL' | 'AGOTADO_SERVICIO';
}

export const getKdsPendientes = () =>
  api.get<KdsPedido[]>('/kds/pendientes').then((r) => r.data);

export const marcarPreparando = (id: number) =>
  api.put(`/kds/${id}/preparando`).then((r) => r.data);

export const marcarListo = (id: number) =>
  api.put(`/kds/${id}/listo`).then((r) => r.data);

export const getPorciones = () =>
  api.get<PorcionDisponible[]>('/kds/productos/porciones').then((r) => r.data);

export const marcarAgotadoTemporal = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/agotado-temporal`).then((r) => r.data);

export const marcarAgotadoServicio = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/agotado-servicio`).then((r) => r.data);

export const revertirDisponible = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/disponible`).then((r) => r.data);
