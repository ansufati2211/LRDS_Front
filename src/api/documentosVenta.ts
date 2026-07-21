import api from './client';

export interface DocumentoVenta {
  id: number;
  tipo: 'NOTA_VENTA' | 'BOLETA' | 'FACTURA';
  serie: string;
  correlativo: number;
  numeroDocumento: string;
  tipoDocumentoReceptor: string | null;
  numeroDocumentoReceptor: string | null;
  razonSocialReceptor: string | null;
  subtotal: number;
  igv: number;
  total: number;
  estadoEmision: 'EMITIDO' | 'ANULADO' | 'ENVIADO_SUNAT' | 'ACEPTADO' | 'RECHAZADO';
  fechaEmision: string;
  motivoAnulacion: string | null;
  pedidoId: number | null;
  documentoCobroId: number | null;
}

export interface EmitirDocumentoVentaRequest {
  tipo: 'NOTA_VENTA' | 'BOLETA' | 'FACTURA';
  pedidoId?: number;
  documentoCobroId?: number;
  tipoDocumentoReceptor?: string;
  numeroDocumentoReceptor?: string;
  razonSocialReceptor?: string;
}

export const emitirDocumentoVenta = (data: EmitirDocumentoVentaRequest) =>
  api.post<DocumentoVenta>('/documentos-venta', data).then((r) => r.data);

export const anularDocumentoVenta = (id: number, motivo: string) =>
  api.put<DocumentoVenta>(`/documentos-venta/${id}/anular`, { motivo }).then((r) => r.data);

export const listarPorPedido = (pedidoId: number) =>
  api.get<DocumentoVenta[]>(`/documentos-venta/por-pedido/${pedidoId}`).then((r) => r.data);

export const listarPorDocumentoCobro = (documentoCobroId: number) =>
  api.get<DocumentoVenta[]>(`/documentos-venta/por-documento-cobro/${documentoCobroId}`).then((r) => r.data);