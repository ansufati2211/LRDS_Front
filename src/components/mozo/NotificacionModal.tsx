import { Bell, X, CheckCircle, Clock } from 'lucide-react';
import { formatearHoraPeru } from '@/lib/datetimePeru';

export interface NotificacionListo {
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  timestamp: Date;
  entregado: boolean;
}

interface Props {
  notificaciones: NotificacionListo[];
  onEntregar: (id: number) => Promise<void>;
  onClose: () => void;
}

export default function NotificacionModal({ notificaciones, onEntregar, onClose }: Props) {
  const pendientes = notificaciones.filter((n) => !n.entregado);

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-6 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[20px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl border border-white/20">
              <Bell size={24} className="text-white" />
            </div>
            <h2 className="text-white font-black text-xl tracking-tight">
              {pendientes.length > 0 ? `${pendientes.length} pedido${pendientes.length > 1 ? 's' : ''} listo${pendientes.length > 1 ? 's' : ''}` : 'Historial de Entregas'}
            </h2>
          </div>
          <button onClick={onClose} className="relative z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-6 space-y-3 custom-scrollbar">
          {notificaciones.length === 0 && (
            <p className="text-sm text-gray-400 font-bold text-center py-8">Sin notificaciones recientes</p>
          )}
          {notificaciones.map((n) => (
            <div key={n.pedidoId} className={`bg-white border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all ${n.entregado ? 'opacity-50 border-gray-200' : 'border-emerald-200 hover:border-emerald-300 hover:shadow-md'}`}>
              <div>
                <p className="text-lg font-black text-gray-900 tracking-tight">Orden #{n.numeroOrden}</p>
                <p className="text-sm text-gray-500 font-bold mt-0.5">{n.mesa || n.tipoConsumo}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <Clock size={12}/> {formatearHoraPeru(n.timestamp)}
                  {n.entregado && <span className="ml-2 text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Entregado</span>}
                </p>
              </div>
              {!n.entregado && (
                <button onClick={() => onEntregar(n.pedidoId)} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                  Entregar <CheckCircle size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}