import { useState, useRef } from 'react';
import { Mic, Send, X, Loader2, Bot, Keyboard } from 'lucide-react';
import { procesarComandaAudio, procesarComandaTexto } from '@/api/ai';
import type { Producto, ItemPedidoLocal, TipoConsumo } from '@/types';
import { sileo } from 'sileo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productos: Producto[];
  mesaActual: string;
  onAplicarComanda: (
    tipoConsumo: TipoConsumo,
    mesa: string,
    notasGenerales: string,
    nuevosItems: ItemPedidoLocal[]
  ) => void;
}

export default function ModalAsistenteAI({ isOpen, onClose, productos, mesaActual, onAplicarComanda }: Props) {
  const [modoTexto, setModoTexto] = useState(false);
  const [texto, setTexto] = useState('');
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const manejarRespuestaAI = (data: any) => {
    try {
      const itemsMapeados: ItemPedidoLocal[] = data.items.map((i: any) => {
        const prod = productos.find(p => p.id === i.productoId);
        if (!prod) throw new Error(`Producto no encontrado en catálogo local (ID: ${i.productoId})`);
        return {
          productoId: prod.id,
          nombre: prod.nombre,
          precio: prod.precioVenta,
          cantidad: i.cantidad,
          notas: i.notasPreparacion || ''
        };
      });

      onAplicarComanda(
        (data.tipoConsumo as TipoConsumo) || 'MESA',
        data.mesa || mesaActual || '',
        data.notasGenerales || '',
        itemsMapeados
      );
      
      sileo.success({ title: '¡Comanda entendida por VERONICA!' });
      onClose();
    } catch (error: any) {
      sileo.error({ title: 'Error interpretando datos', description: error.message });
    }
  };

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setGrabando(true);
    } catch (err) {
      sileo.error({ title: 'Acceso Denegado', description: 'Por favor permite el acceso al micrófono en tu navegador.' });
    }
  };

  const detenerGrabacion = async () => {
    if (mediaRecorder.current && grabando) {
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setProcesando(true);
        try {
          const response = await procesarComandaAudio(audioBlob, mesaActual);
          manejarRespuestaAI(response);
        } catch (err: any) {
          sileo.error({ title: 'Error de IA', description: err.response?.data?.message || 'No se pudo procesar el audio.' });
        } finally {
          setProcesando(false);
        }
      };
      
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      setGrabando(false);
    }
  };

  const enviarTexto = async () => {
    if (!texto.trim()) return;
    setProcesando(true);
    try {
      const response = await procesarComandaTexto(texto, mesaActual);
      manejarRespuestaAI(response);
    } catch (err: any) {
      sileo.error({ title: 'Error de IA', description: err.response?.data?.message || 'No se pudo procesar el texto.' });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl text-white">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-tight">Asistente VERONICA</h2>
              <p className="text-blue-100 text-xs font-bold mt-0.5">Potenciado por IA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2"><X size={20} /></button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[250px] bg-gray-50/50">
          {procesando ? (
            <div className="flex flex-col items-center gap-4 animate-pulse text-indigo-600">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-bold text-sm">Analizando comanda...</p>
            </div>
          ) : modoTexto ? (
            <div className="w-full space-y-3 w-full animate-in fade-in">
              <textarea
                autoFocus
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder="Ej. Anota 2 capuchinos clásicos y un mixto sin cebolla para la mesa 4..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-gray-800 resize-none h-32"
              />
              <div className="flex gap-2">
                <button onClick={() => setModoTexto(false)} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">
                  <Mic size={18} />
                </button>
                <button onClick={enviarTexto} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md">
                  <Send size={18} /> Procesar Texto
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in-95">
              <button
                onMouseDown={iniciarGrabacion}
                onMouseUp={detenerGrabacion}
                onTouchStart={iniciarGrabacion}
                onTouchEnd={detenerGrabacion}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-xl ${grabando ? 'bg-red-500 text-white scale-110 shadow-red-500/40 animate-pulse' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:scale-105'}`}
              >
                <Mic size={48} />
              </button>
              <p className="mt-6 font-black text-gray-800 text-center">
                {grabando ? 'Escuchando... suelta para procesar' : 'Mantén presionado para hablar'}
              </p>
              <button onClick={() => setModoTexto(true)} className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-4 py-2 bg-indigo-50 rounded-full">
                <Keyboard size={14} /> Prefiero escribir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}