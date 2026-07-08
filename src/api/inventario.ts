import api from './client';

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  stockReservado: number;
  estadoRegistro: boolean;
}

export interface InsumoRequestDTO {
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
}

export const getInsumos = () => 
  api.get<Insumo[]>('/inventario/insumos').then(r => r.data);

export const crearInsumo = (data: InsumoRequestDTO) => 
  api.post<Insumo>('/inventario/insumos', data).then(r => r.data);

export const actualizarInsumo = (id: number, data: InsumoRequestDTO) => 
  api.put<Insumo>(`/inventario/insumos/${id}`, data).then(r => r.data);

export const eliminarInsumo = (id: number) => 
  api.delete(`/inventario/insumos/${id}`).then(r => r.data);

export interface RecetaDetalleRequest {
  insumoId: number;
  cantidadUsada: number;
}
export const getRecetaProducto = (productoId: number) => 
  api.get(`/productos/${productoId}/receta`).then(r => r.data);

export const guardarReceta = (productoId: number, detalles: RecetaDetalleRequest[]) => 
  api.post(`/productos/${productoId}/receta`, { detalles }).then(r => r.data);

export interface EntradaAlmacenRequestDTO { insumoId: number; cantidad: number; costoUnitario: number; proveedor?: string; }
export interface MermaRequestDTO { insumoId: number; cantidad: number; motivo: string; }
export interface AjusteInventarioRequestDTO { insumoId: number; cantidad: number; tipoAjuste: 'POSITIVO' | 'NEGATIVO'; motivo: string; }

export const registrarEntrada = (data: EntradaAlmacenRequestDTO) => api.post('/inventario/entradas', data).then(r => r.data);
export const registrarMerma = (data: MermaRequestDTO) => api.post('/inventario/mermas', data).then(r => r.data);
export const registrarAjuste = (data: AjusteInventarioRequestDTO) => api.post('/inventario/ajustes', data).then(r => r.data);