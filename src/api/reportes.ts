import api from './client';

export interface DetalleDia {
  fecha: string;
  ingresos: number;
  pedidos: number;
}

export interface DashboardVentas {
  ingresosTotalesMensuales: number;
  pedidosTotalesMensuales: number;
  detalleDiario: DetalleDia[];
}

export interface InsumoAlerta {
  insumoId: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  sedeId: number;
}

// FIX: Ruta corregida de '/reportes/dashboard' a '/reportes/ventas/dashboard'
export const getDashboard = (inicio: string, fin: string, sedeId?: number) =>
  api.get<DashboardVentas>('/reportes/ventas/dashboard', { params: { inicio, fin, sedeId } }).then((r) => r.data);

export const getAlertasStock = (sedeId?: number) =>
  api.get<InsumoAlerta[]>('/inventario/insumos/stock-bajo', { params: { sedeId } }).then((r) => r.data);

export interface MargenProductoDTO {
  productoId: number;
  producto: string;
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  margenPct: number;
  esEstimado: boolean;
}

export interface MargenCategoriaDTO {
  categoriaId: number;
  categoria: string;
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  margenPct: number;
}

export interface MargenVentasDTO {
  ingresosTotales: number;
  costoVentas: number;
  utilidadBruta: number;
  margenBrutoPct: number;
  costoMerma: number;
  desglosePorProducto: MargenProductoDTO[];
  desglosePorCategoria: MargenCategoriaDTO[];
}

export const getMargenVentas = (inicio: string, fin: string, sedeId?: number) => 
  api.get<MargenVentasDTO>('/reportes/ventas/margen', { params: { inicio, fin, sedeId } }).then(r => r.data);