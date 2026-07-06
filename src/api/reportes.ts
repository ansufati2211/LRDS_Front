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
