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
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
}

export const getDashboard = (inicio: string, fin: string) =>
  api.get<DashboardVentas>(`/reportes/dashboard?inicio=${inicio}&fin=${fin}`).then((r) => r.data);

export const getAlertasStock = () =>
  api.get<InsumoAlerta[]>('/inventario/alertas').then((r) => r.data);

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

export const getMargenVentas = (inicio: string, fin: string) =>
  api.get<MargenVentasDTO>(`/reportes/margen?inicio=${inicio}&fin=${fin}`).then((r) => r.data);