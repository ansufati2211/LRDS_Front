import { X, ChefHat, CheckCircle, Truck, Clock, Plus, Loader2 } from 'lucide-react';
import type { PedidoActivo, EstadoPedido, EstadoItem } from '@/types';

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock size={14} /> },
  RECIBIDO: { label: 'En cocina', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <ChefHat size={14} /> },
  EN_PREPARACION: { label: 'Preparando', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <ChefHat size={14} /> },
  LISTO: { label: '¡Listo!', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={14} /> },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Truck size={14} /> },
  PAGADO: { label: 'Pagado', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <CheckCircle size={14} /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-200', icon: <X size={14} /> },
};

const puedeCancelarEntregado = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

interface Props {
  pedido: PedidoActivo;
  userRol?: string;
  onConfirmar: (id: number) => void;
  onEntregar: (id: number) => void;
  onCancelarItem: (pedidoId: number, detalleId: number, estadoItem: EstadoItem) => void;
  onAgregarItems: (pedido: PedidoActivo) => void;
}

export default function PedidoCard({ pedido, userRol, onConfirmar, onEntregar, onCancelarItem, onAgregarItems }: Props) {
  const estado = ESTADO_CONFIG[pedido.estadoActual] || ESTADO_CONFIG['BORRADOR'];
  const esListo = pedido.estadoActual === 'LISTO';
  const esBorrador = pedido.estadoActual === 'BORRADOR';

  return (
    <div className={`bg-white rounded-[2rem] border flex flex-col overflow-hidden transition-all duration-300 ${esListo ? 'border-emerald-300 shadow-[0_8px_30px_rgb(52,211,153,0.2)] ring-2 ring-emerald-50' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
      <div className={`px-6 py-5 border-b flex items-start justify-between ${esListo ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-50'}`}>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Orden #{pedido.id}</p>
          <h3 className="text-xl font-black text-gray-900 leading-none tracking-tight">
            {pedido.mesa || (pedido.tipoConsumo === 'PARA_LLEVAR' ? 'Para llevar' : 'Delivery')}
          </h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${estado.color}`}>
          {estado.icon} {estado.label}
        </span>
      </div>

      <div className="flex-1 p-6 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
        {pedido.items.map((item) => {
          const cancelado = item.estadoItem === 'CANCELADO';
          const puedeCancelar = !cancelado && (item.estadoItem !== 'ENTREGADO' || puedeCancelarEntregado(userRol));
          
          return (
            <div key={item.detalleId} className={`flex justify-between items-start text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0 ${cancelado ? 'opacity-40 grayscale' : ''}`}>
              <div className="flex gap-3">
                <div className="bg-gray-100 text-gray-600 font-black text-xs w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                  {item.cantidad}x
                </div>
                <div>
                  <span className={`font-bold text-gray-800 ${cancelado ? 'line-through' : ''}`}>{item.nombreProducto}</span>
                  {item.notasPreparacion && <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1 flex items-center gap-1">↳ {item.notasPreparacion}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-400 whitespace-nowrap text-xs">S/ {item.subtotal.toFixed(2)}</span>
                {puedeCancelar && (
                  <button onClick={() => onCancelarItem(pedido.id, item.detalleId, item.estadoItem)} className="text-gray-300 hover:text-red-500 bg-white hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Cancelar ítem">
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t border-gray-50 bg-gray-50/30">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Mesa</span>
          <span className="text-2xl font-black text-gray-900 tracking-tight">S/ {pedido.total.toFixed(2)}</span>
        </div>
        
        {esBorrador && (
          <button onClick={() => onConfirmar(pedido.id)} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-black py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2">
            <ChefHat size={18} /> Confirmar hacia Cocina
          </button>
        )}
        
        {esListo && (
          <button onClick={() => onEntregar(pedido.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-black py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 animate-pulse">
            <CheckCircle size={18} /> Entregar Pedido
          </button>
        )}
        
        {!esBorrador && !esListo && (
          <div className="w-full py-3.5 bg-white border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2 mb-3 shadow-sm">
            <Loader2 size={16} className="animate-spin" /> Esperando preparación...
          </div>
        )}

        {!esBorrador && (
          <button onClick={() => onAgregarItems(pedido)} className="w-full mt-3 bg-white border border-gray-200 hover:border-orange-300 text-gray-500 hover:text-orange-600 text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
            <Plus size={14} strokeWidth={3} /> Adicionar Ítems
          </button>
        )}
      </div>
    </div>
  );
}