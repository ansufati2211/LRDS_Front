import { useEffect, useState, useCallback } from 'react';
import { 
  Search, Calendar, Receipt, UtensilsCrossed, 
  Eye, X, Filter 
} from 'lucide-react';
import { getHistorialPedidos } from '@/api/pedidos';
import type { PedidoActivo } from '@/types';
import { fechaPeruISO, formatearFechaHoraPeru } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

function hoy() { return fechaPeruISO(); }
function hace7Dias() { const d = new Date(); d.setDate(d.getDate() - 7); return fechaPeruISO(d); }

// ============================================================================
// COMPONENTE: MODAL DE DETALLE (Ticket Clean)
// ============================================================================
function ModalDetalleHistorial({ pedido, onClose }: { pedido: PedidoActivo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-gray-900 font-black text-2xl tracking-tight flex items-center gap-2">
              <Receipt className="text-blue-500" size={24} /> Orden #{pedido.id}
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-1">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2.5 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Atendido por</p>
              <p className="font-bold text-blue-900">{pedido.mozo}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Fecha de cobro</p>
              <p className="font-semibold text-blue-800 text-sm">{formatearFechaHoraPeru(pedido.fechaCreacion)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              {pedido.items.map((item) => (
                <div key={item.detalleId} className="flex justify-between items-center text-sm p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                  <div className="flex-1 pr-4">
                    <span className="font-black text-gray-900 mr-2">{item.cantidad}x</span> 
                    <span className="font-semibold text-gray-600">{item.nombreProducto}</span>
                    {item.estadoItem === 'CANCELADO' && (
                      <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold border border-red-100">CANCELADO</span>
                    )}
                  </div>
                  <span className="font-bold text-gray-900">S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
              <span>Subtotal</span>
              <span>S/ {(pedido.total + pedido.descuento).toFixed(2)}</span>
            </div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between text-sm font-bold text-emerald-600 mb-2 bg-emerald-50 p-2 rounded-lg">
                <span>Descuento</span>
                <span>- S/ {pedido.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Pagado</span>
              <span className="text-3xl font-black text-gray-900 tracking-tight">S/ {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function HistorialPedidosPage() {
  const [inicio, setInicio] = useState(hace7Dias());
  const [fin, setFin] = useState(hoy());
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoActivo | null>(null);

  // 🚨 EXTRAEMOS LA SEDE GLOBAL PARA MULTI-TENANT
  const { sedeSeleccionadaId } = useAuthStore();

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      // 🚨 ENVIAMOS LA SEDE A LA API
      const data = await getHistorialPedidos(inicio, fin, sedeSeleccionadaId || undefined);
      setPedidos(data);
      if (data.length > 0) {
        sileo.success({ title: `Se cargaron ${data.length} pedidos.` });
      } else {
        sileo.error({ title: 'No hay pedidos en este rango para la sede seleccionada.' });
      }
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error de conexión al servidor.' });
    } finally { setLoading(false); }
  }, [inicio, fin, sedeSeleccionadaId]); // 🚨 SE RECARGA AL CAMBIAR DE SEDE

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const pedidosFiltrados = pedidos.filter(p => 
    p.id.toString().includes(busqueda) || 
    (p.mesa && p.mesa.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* ========================================================= */}
        {/* HEADER DE LA PANTALLA CON DEGRADADO                       */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Registro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Ventas</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Auditoría detallada de todos los tickets cerrados en caja.</p>
          </div>
          
          <button onClick={cargarHistorial} disabled={loading} className="bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-900/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
            <Filter size={18} /> {loading ? 'Refrescando...' : 'Refrescar Datos'}
          </button>
        </div>

        {/* ========================================================= */}
        {/* BARRA DE CONTROLES CON PROFUNDIDAD                        */}
        {/* ========================================================= */}
        <div className="bg-slate-100/80 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-5">
          
          <div className="w-full xl:w-96 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar mesa o número de orden..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="bg-transparent text-gray-900 text-sm font-semibold outline-none w-full placeholder-gray-400" 
            />
          </div>

          <div className="hidden xl:block w-px h-8 bg-slate-300"></div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-3 px-5 py-2.5 border border-gray-200 shadow-sm rounded-xl hover:border-gray-300 transition-colors bg-white">
              <Calendar size={18} className="text-blue-500"/>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Inicial</span>
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
              </div>
            </div>

            <span className="text-slate-400 font-black">-</span>

            <div className="flex items-center gap-3 px-5 py-2.5 border border-gray-200 shadow-sm rounded-xl hover:border-gray-300 transition-colors bg-white">
              <Calendar size={18} className="text-blue-500"/>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha Final</span>
                <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABLA DE RESULTADOS MINIMALISTA                           */}
        {/* ========================================================= */}
        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-8 py-5">Ticket</th>
                  <th className="px-8 py-5">Fecha Emisión</th>
                  <th className="px-8 py-5">Identificador</th>
                  <th className="px-8 py-5">Mozo Responsable</th>
                  <th className="px-8 py-5">Total Facturado</th>
                  <th className="px-8 py-5">Estado</th>
                  <th className="px-8 py-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-32 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><Search size={24} className="text-gray-300"/></div>
                        <p className="font-bold text-gray-600 text-lg">No hay registros</p>
                        <p className="text-sm mt-1">Ajusta los filtros de fecha para encontrar resultados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                      <td className="px-8 py-4 font-black text-gray-900 text-base">#{pedido.id}</td>
                      <td className="px-8 py-4 text-gray-500 font-medium">{formatearFechaHoraPeru(pedido.fechaCreacion)}</td>
                      <td className="px-8 py-4 font-bold text-gray-700">{pedido.mesa || pedido.tipoConsumo}</td>
                      <td className="px-8 py-4 text-gray-500 font-medium flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">{pedido.mozo.charAt(0)}</div>
                        {pedido.mozo}
                      </td>
                      <td className="px-8 py-4 font-black text-gray-900 text-base">S/ {pedido.total.toFixed(2)}</td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                          pedido.estadoActual === 'PAGADO' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pedido.estadoActual === 'PAGADO' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          {pedido.estadoActual}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => setPedidoSeleccionado(pedido)} className="text-gray-400 bg-white border border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm" title="Ver Detalles">
                          Ver Ticket
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {pedidoSeleccionado && <ModalDetalleHistorial pedido={pedidoSeleccionado} onClose={() => setPedidoSeleccionado(null)} />}
    </AdminLayout>
  );
}