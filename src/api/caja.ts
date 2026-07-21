import api from './client';

export interface SesionCaja {
  id: number;
  montoInicial: number;
  montoFinalDeclarado: number | null;
  montoFinalCalculado: number | null;
  diferencia: number | null;
  fechaApertura: string;
  fechaCierre: string | null;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface PagoItem {
  metodoPago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';
  monto: number;
  numeroYape?: string;
  ultimosDigitos?: string;
  titular?: string;
}

export const abrirCaja = (montoInicial: number) =>
  api.post<SesionCaja>('/caja/abrir', { montoInicial }).then((r) => r.data);

export const cerrarCaja = (id: number, montoFinalDeclarado: number) =>
  api.put<SesionCaja>(`/caja/cerrar/${id}`, { montoFinalDeclarado }).then((r) => r.data);

export const getCajaActiva = async (): Promise<SesionCaja | null> => {
  try {
    const response = await api.get<SesionCaja>('/caja/activa');
    return response.data;
  } catch (error: any) {
    // 🔥 Capturamos el 404 pacíficamente para que la app entienda que simplemente "no hay caja"
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const procesarPago = (pedidoId: number, sesionCajaId: number, pagos: PagoItem[]) =>
  api.post<string>(`/pedidos/${pedidoId}/pagar`, { sesionCajaId, pagos }).then((r) => r.data);