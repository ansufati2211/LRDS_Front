import api from './client';

export interface Insumo {
  id: number;
  nombre: string;
  unidadMedida: string;
  stockActual?: number;
  stockMinimo: number;
  costoUnitario?: number;
  stockReservado?: number;
  estadoRegistro: boolean;
}

export interface InsumoRequestDTO {
  nombre: string;
  unidadMedida: string;
  stockMinimo: number;
}

export interface EntradaAlmacenRequestDTO {
  insumoId: number;
  cantidad: number;
  costoUnitario: number;
  observacion?: string;
  proveedor?: string;
  sedeId?: number;
}

export interface MermaRequestDTO {
  insumoId: number;
  cantidad: number;
  motivo?: string;
  sedeId?: number;
}

export interface AjusteInventarioRequestDTO {
  insumoId: number;
  cantidad: number;
  esPositivo: boolean;
  motivo?: string;
  sedeId?: number;
}

export interface RecetaDetalleRequest {
  insumoId: number;
  cantidadUsada: number;
}

export const getInsumos = (sedeId?: number) =>
  api.get<any[]>('/inventario/insumos', { params: { sedeId } }).then((r) => r.data);

export const crearInsumo = (data: InsumoRequestDTO) =>
   api.post<Insumo>('/inventario/insumos', data).then(r => r.data);

export const actualizarInsumo = (id: number, data: InsumoRequestDTO) =>
   api.put<Insumo>(`/inventario/insumos/${id}`, data).then(r => r.data);

export const eliminarInsumo = (id: number) =>
   api.delete(`/inventario/insumos/${id}`).then(r => r.data);

export const activarInsumo = (id: number) =>
   api.put(`/inventario/insumos/${id}/activar`).then(r => r.data);

// FIX APLICADO: Ruta correcta para obtener receta
export const getRecetaProducto = (productoId: number) =>
   api.get(`/inventario/recetas/${productoId}`).then(r => r.data);

// FIX APLICADO: Ruta correcta para guardar receta masiva
export const guardarReceta = (productoId: number, detalles: RecetaDetalleRequest[]) =>
   api.post(`/inventario/productos/${productoId}/receta`, detalles).then(r => r.data);

export const registrarEntrada = (data: EntradaAlmacenRequestDTO) =>
   api.post('/inventario/kardex/entrada', data).then(r => r.data);

export const registrarMerma = (data: MermaRequestDTO) =>
   api.post('/inventario/kardex/merma', data).then(r => r.data);

export const registrarAjuste = (data: AjusteInventarioRequestDTO) =>
   api.post('/inventario/kardex/ajuste', data).then(r => r.data);

export const getKardex = (insumoId: number) =>
   api.get(`/inventario/insumos/${insumoId}/kardex`).then(r => r.data);