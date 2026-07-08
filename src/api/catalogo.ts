import api from './client';
import type { Producto } from '@/types';

// ==========================================
// INTERFACES
// ==========================================
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estadoRegistro: boolean;
}
export interface CategoriaRequestDTO {
  nombre: string;
  descripcion?: string;
}
export interface ProductoRequestDTO {
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  categoriaId: number;
  tipoProducto?: 'BIEN' | 'SERVICIO';
  esPreparado?: boolean;               // <-- AÑADIR ESTO
  tiempoPreparacionMinutos?: number;   // <-- AÑADIR ESTO
}

// ==========================================
// ENDPOINTS: CATEGORÍA (Rutas Corregidas)
// ==========================================
export const getCategorias = () => 
   api.get<Categoria[]>('/inventario/categorias').then((r) => r.data);
export const crearCategoria = (data: CategoriaRequestDTO) => 
   api.post<Categoria>('/inventario/categorias', data).then((r) => r.data);
export const actualizarCategoria = (id: number, data: CategoriaRequestDTO) => 
   api.put<Categoria>(`/inventario/categorias/${id}`, data).then((r) => r.data);
export const eliminarCategoria = (id: number) => 
   api.delete(`/inventario/categorias/${id}`).then((r) => r.data);

// ==========================================
// ENDPOINTS: PRODUCTOS (Rutas Corregidas)
// ==========================================
export const getProductosAdmin = () => 
   api.get<Producto[]>('/inventario/productos').then((r) => r.data);
export const crearProducto = (data: ProductoRequestDTO) => 
   api.post<Producto>('/inventario/productos', data).then((r) => r.data);
export const actualizarProducto = (id: number, data: ProductoRequestDTO) => 
   api.put<Producto>(`/inventario/productos/${id}`, data).then((r) => r.data);
export const eliminarProducto = (id: number) => 
   api.delete(`/inventario/productos/${id}`).then((r) => r.data);
export const activarCategoria = (id: number) => 
   api.put(`/inventario/categorias/${id}/activar`).then((r) => r.data);
export const activarProducto = (id: number) => 
   api.put(`/inventario/productos/${id}/activar`).then((r) => r.data);