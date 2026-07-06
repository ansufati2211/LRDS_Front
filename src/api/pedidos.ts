import api from './client';
import type { PedidoActivo, Producto, Categoria } from '@/types';

export interface CrearPedidoRequest {
  tipoConsumo: string;
  mesa: string;
  notasGenerales: string;
  items: { productoId: number; cantidad: number; notasPreparacion: string }[];
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
