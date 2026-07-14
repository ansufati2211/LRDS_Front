import api from './client';

export interface KdsItem {
  detalleId: number;
  productoId: number;
  producto: string;
  cantidad: number;
  notasPreparacion?: string;
  tiempoPreparacionMinutos: number;
  estadoItem: string;
  numeroComanda: number;
  categoriaNombre?: string; 
}

export interface KdsPedido {
  pedidoId: number;
  numeroOrden: number;
  tipoConsumo: string;
  mesa: string;
  estadoPedido: string;
  notasGenerales?: string;
  horaIngreso: string;
  minutosTranscurridos: number;
  items: KdsItem[];
}

export interface PorcionDisponible {
  productoId: number;
  nombreProducto: string;
  porcionesDisponibles: number;
  nivelAdvertencia: 'NORMAL' | 'ALTO';
  estadoDisponibilidad: string;
}

export interface RecetaCocina {
  producto: string;
  instrucciones: string;
  ingredientes: {
    insumo: string;
    cantidad: number;
    unidad: string;
  }[];
}

export const getPedidosCocina = (sedeId?: number) =>
  api.get<KdsPedido[]>('/kds/pendientes', { params: { sedeId } }).then((r) => r.data);

export const marcarPreparando = (pedidoId: number) =>
  api.put(`/kds/${pedidoId}/preparando`).then((r) => r.data);

export const marcarListo = (pedidoId: number) =>
  api.put(`/kds/${pedidoId}/listo`).then((r) => r.data);

// NUEVO: Conectado a nuestro nuevo Endpoint de Deshacer
export const deshacerPedido = (pedidoId: number) =>
  api.put(`/kds/${pedidoId}/deshacer`).then((r) => r.data);

// NUEVO: Conectado a nuestro nuevo Endpoint de Recetas KDS
export const getRecetaProducto = (productoId: number) =>
  api.get<RecetaCocina>(`/kds/recetas/producto/${productoId}`).then((r) => r.data);

export const getPorciones = (sedeId?: number) =>
  api.get<PorcionDisponible[]>('/kds/porciones', { params: { sedeId } }).then((r) => r.data);

export const marcarAgotadoTemporal = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/agotado-temporal`).then((r) => r.data);

export const marcarAgotadoServicio = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/agotado-servicio`).then((r) => r.data);

export const revertirDisponible = (productoId: number) =>
  api.put(`/kds/productos/${productoId}/disponible`).then((r) => r.data);