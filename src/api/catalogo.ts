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
  esPreparado?: boolean;               
  tiempoPreparacionMinutos?: number;   
}

// ==========================================
// ENDPOINTS: CATEGORÍA
// ==========================================
export const getCategorias = () => 
   api.get<Categoria[]>('/inventario/categorias').then((r) => r.data);

export const crearCategoria = (data: CategoriaRequestDTO) => 
   api.post<Categoria>('/inventario/categorias', data).then((r) => r.data);

export const actualizarCategoria = (id: number, data: CategoriaRequestDTO) => 
   api.put<Categoria>(`/inventario/categorias/${id}`, data).then((r) => r.data);

export const eliminarCategoria = (id: number) => 
   api.delete(`/inventario/categorias/${id}`).then((r) => r.data);

// 🔥 FIX: Enviamos un objeto JSON vacío {} para evitar el error 500 del Backend
export const activarCategoria = (id: number) => 
   api.put(`/inventario/categorias/${id}/activar`, {}).then((r) => r.data);

// ==========================================
// ENDPOINTS: PRODUCTOS
// ==========================================
export const getProductosAdmin = () =>
    api.get<Producto[]>('/inventario/productos').then((r) => r.data);

export const crearProducto = (data: ProductoRequestDTO) => {
    const payload = {
        ...data,
        categoria: { id: data.categoriaId }
    };
    delete (payload as any).tipoProducto; 
    
    return api.post<Producto>('/inventario/productos', payload).then((r) => r.data);
};

export const actualizarProducto = (id: number, data: ProductoRequestDTO) => {
    const payload = { ...data };
    delete (payload as any).tipoProducto;  
    return api.put<Producto>(`/inventario/productos/${id}`, payload).then((r) => r.data);
};

export const eliminarProducto = (id: number) =>
    api.delete(`/inventario/productos/${id}`).then((r) => r.data);

// 🔥 FIX: Enviamos un objeto JSON vacío {} para evitar el error 500 del Backend
export const activarProducto = (id: number) => 
   api.put(`/inventario/productos/${id}/activar`, {}).then((r) => r.data);