import api from './client';

export interface AiPedidoResponse {
  tipoConsumo: string;
  mesa?: string;
  notasGenerales?: string;
  sedeId: number;
  items: {
    productoId: number;
    cantidad: number;
    notasPreparacion?: string;
  }[];
}

export const procesarComandaAudio = async (audioBlob: Blob, mesa?: string) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'comanda.webm');
  if (mesa) formData.append('mesa', mesa);

  const response = await api.post<AiPedidoResponse>('/ai/comanda', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const procesarComandaTexto = async (texto: string, mesa?: string) => {
  const response = await api.post<AiPedidoResponse>('/ai/comanda/texto', { texto, mesa });
  return response.data;
};