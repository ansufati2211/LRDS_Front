import api from './client';
import type { PedidoActivo, Producto, Categoria } from '@/types';
import type { PagoItem } from './caja';

export interface CrearPedidoRequest {
  tipoConsumo: string;
  mesa: string;
  notasGenerales: string;
  items: { productoId: number; cantidad: number; notasPreparacion: string }[];
}

export interface DocumentoCobro {
  id: number;
  tipo: 'ITEMS' | 'MONTO';
  estado: 'PENDIENTE' | 'PAGADO';
  subtotal: number;
  total: number;
  monto: number | null;
  detalleIds: number[];
}

export const getCategorias = () =>
  api.get<Categoria[]>('/inventario/categorias').then((r) => r.data);

export const getProductos = () =>
  api.get<Producto[]>('/inventario/productos').then((r) => r.data);

export const getPedidosActivos = () =>
  api.get<PedidoActivo[]>('/pedidos/activos').then((r) => r.data);

export const crearPedido = (data: CrearPedidoRequest) =>
  api.post('/pedidos', data).then((r) => r.data);

export const confirmarPedido = (id: number) =>
  api.put(`/pedidos/${id}/confirmar`).then((r) => r.data);

export const entregarPedido = (id: number) =>
  api.put(`/pedidos/${id}/entregar`).then((r) => r.data);

export const cancelarPedido = (id: number) =>
  api.put(`/pedidos/${id}/cancelar`).then((r) => r.data);

// --- Módulo 4 ---

export const agregarItems = (
  pedidoId: number,
  items: { productoId: number; cantidad: number; notasPreparacion: string }[]
) => api.post(`/pedidos/${pedidoId}/items`, { items }).then((r) => r.data);

export const cancelarItem = (pedidoId: number, detalleId: number, motivo?: string) =>
  api.put(`/pedidos/${pedidoId}/items/${detalleId}/cancelar`, motivo ? { motivo } : undefined).then((r) => r.data);

export const crearDocumentoCobro = (
  pedidoId: number,
  data: { tipo: 'ITEMS'; detalleIds: number[] } | { tipo: 'MONTO'; monto: number }
) => api.post<DocumentoCobro>(`/pedidos/${pedidoId}/documentos-cobro`, data).then((r) => r.data);

export const listarDocumentosCobro = (pedidoId: number) =>
  api.get<DocumentoCobro[]>(`/pedidos/${pedidoId}/documentos-cobro`).then((r) => r.data);

export const pagarDocumentoCobro = (documentoId: number, sesionCajaId: number, pagos: PagoItem[]) =>
  api.post<DocumentoCobro>(`/pedidos/documentos-cobro/${documentoId}/pagar`, { sesionCajaId, pagos }).then((r) => r.data);
