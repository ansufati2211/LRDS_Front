export interface AuthResponse {
  token: string;
  correo: string;
  rol: string;
  empresaId: number;
  modulosHabilitados: string[];  // R0-3: frontend oculta/deshabilita UI según plan
  estadoSuscripcion: string;     // R0-3/E0-1: 'ACTIVA' | 'VENCIDA' | 'SIN_SUSCRIPCION'
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export type EstadoPedido =
  | 'BORRADOR'
  | 'RECIBIDO'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'PAGADO'
  | 'CANCELADO';

export type TipoConsumo = 'MESA' | 'PARA_LLEVAR' | 'DELIVERY';

export interface DetallePedido {
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notasPreparacion?: string;
}

export interface PedidoActivo {
  id: number;
  mozo: string;
  tipoConsumo: TipoConsumo;
  mesa: string;
  estadoActual: EstadoPedido;
  descuento: number;
  total: number;
  fechaCreacion: string;
  items: DetallePedido[];
}

export interface Producto {
  id: number;
  nombre: string;
  precioVenta: number;
  categoria?: { id: number; nombre: string };
  estadoRegistro: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface ItemPedidoLocal {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  notas: string;
}

export interface SseEvent {
  pedidoId: number;
  mesa: string;
  estado: EstadoPedido;
}
