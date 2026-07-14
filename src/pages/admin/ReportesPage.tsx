import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Calendar, PieChart, 
  Receipt, Box, FileSpreadsheet, ArrowRight, Activity, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fechaPeruISO } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getMargenVentas } from '@/api/reportes';
import { getHistorialPedidos } from '@/api/pedidos';
import type { MargenVentasDTO } from '@/api/reportes';
import type { PedidoActivo } from '@/types';

function hoy() { return fechaPeruISO(); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }

export default function ReportesPage() {
  const navigate = useNavigate();
  const { sedeSeleccionadaId } = useAuthStore();
  
  // Un solo filtro de fechas maestro para todo el panel
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  
  // Datos interactivos
  const [margen, setMargen] = useState<MargenVentasDTO | null>(null);
  const [historial, setHistorial] = useState<PedidoActivo[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [dataMargen, dataHistorial] = await Promise.all([
        getMargenVentas(inicio, fin, sedeSeleccionadaId || undefined).catch(() => null),
        getHistorialPedidos(inicio, fin, sedeSeleccionadaId || undefined).catch(() => [])
      ]);
      setMargen(dataMargen);
      setHistorial(dataHistorial);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [inicio, fin, sedeSeleccionadaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarExcelVentas = () => {
    const token = useAuthStore.getState().token;
    let url = `/api/v1/reportes/ventas/exportar-excel?inicio=${inicio}&fin=${fin}&token=${token}`;
    if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
    window.open(url, '_blank');
  };

  const pedidosPagados = historial.filter(p => p.estadoActual === 'PAGADO');
  const pedidosAnulados = historial.filter(p => p.estadoActual === 'CANCELADO');

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* CABECERA & CONTROLES MAESTROS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Análisis y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Reportes</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Monitoreo del desempeño financiero y operativo.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-full">
              <Calendar size={16} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Desde</span>
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
              </div>
            </div>
            <span className="text-gray-300 font-bold">-</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-full">
              <Calendar size={16} className="text-gray-400" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hasta</span>
                <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* ========================================================= */}
          {/* REPORTE 1: VENTAS (DESCARGA DEL NUEVO EXCEL CORPORATIVO)  */}
          {/* ========================================================= */}
          <div className="bg-[#0a0f1c] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="relative z-10">
              <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30">
                <FileSpreadsheet size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Reporte de Ventas (Excel)</h2>
              <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed max-w-md">
                Extrae un documento corporativo con auto-formato. Ideal para enviarlo al equipo contable.
              </p>
            </div>

            <div className="relative z-10 bg-white/5 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/10 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-bold text-sm">Tickets procesados:</span>
                <span className="text-white font-black text-lg">{pedidosPagados.length}</span>
              </div>
              <button onClick={descargarExcelVentas} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95">
                <Download size={18} /> Descargar Informe Corporativo
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* REPORTE 2: FINANZAS Y RENTABILIDAD EN VIVO                */}
          {/* ========================================================= */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm border border-blue-100">
                  <PieChart size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Márgenes de Rentabilidad</h2>
              </div>
              {margen && (
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Margen Global</p>
                  <p className="text-3xl font-black text-emerald-600">{margen.margenBrutoPct.toFixed(1)}%</p>
                </div>
              )}
            </div>

            <div className="relative z-10 flex-1">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold animate-pulse">Analizando finanzas...</div>
              ) : margen && margen.desglosePorProducto.length > 0 ? (
                <div className="space-y-3 mt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-2">Top 3 Productos Rentables</p>
                  {/* Ordenamos por Utilidad Bruta y tomamos los 3 primeros */}
                  {[...margen.desglosePorProducto].sort((a, b) => b.utilidadBruta - a.utilidadBruta).slice(0, 3).map((p, i) => (
                    <div key={p.productoId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-sm font-bold text-gray-800"><span className="text-gray-400 mr-2">{i+1}.</span>{p.producto}</span>
                      <span className="text-sm font-black text-emerald-600">S/ {p.utilidadBruta.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold">Sin datos para este período</div>
              )}
            </div>

            <button onClick={() => navigate('/admin/finanzas')} className="relative z-10 mt-6 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all">
              Análisis Financiero Completo <ArrowRight size={16} />
            </button>
          </div>

          {/* ========================================================= */}
          {/* REPORTE 3: AUDITORÍA DE TICKETS EN VIVO                   */}
          {/* ========================================================= */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-600 mb-4 shadow-sm border border-purple-100">
                  <Receipt size={28} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Rendimiento Operativo</h2>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold animate-pulse">Consultando tickets...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <TrendingUp size={20} className="text-emerald-500 mb-2" />
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ingresos del Período</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">
                      S/ {pedidosPagados.reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                    <Activity size={20} className="text-rose-500 mb-2" />
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Tickets Anulados</p>
                    <p className="text-2xl font-black text-rose-700 mt-1">{pedidosAnulados.length}</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/historial')} className="relative z-10 mt-6 w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all">
              Ver Auditoría de Tickets <ArrowRight size={16} />
            </button>
          </div>

          {/* ========================================================= */}
          {/* REPORTE 4: MOVIMIENTOS KARDEX                             */}
          {/* ========================================================= */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-sm border border-orange-100">
                <Box size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Control de Inventario</h2>
              <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed">
                Supervisa el flujo de materia prima. Revisa mermas (pérdidas), compras y ajustes diarios en almacén.
              </p>
            </div>

            <button onClick={() => navigate('/admin/kardex')} className="relative z-10 mt-auto w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all">
              Abrir Registro Kardex <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}