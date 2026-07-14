import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, PieChart, Activity, Lock, ArrowLeft, 
  RefreshCw, Sparkles, DollarSign, Calendar, TrendingUp, AlertTriangle
} from 'lucide-react';
import { getMargenVentas } from '@/api/reportes';
import type { MargenVentasDTO } from '@/api/reportes';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layouts/AdminLayout';
import { fechaPeruISO } from '@/lib/datetimePeru';

// ============================================================================
// COMPONENTES AUXILIARES (Diseño Moderno)
// ============================================================================

const MetricCard = ({ icon, title, value, subtitle, colorClass, bgClass, borderClass }: any) => (
  <div className={`bg-white p-6 rounded-[2rem] border ${borderClass} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div className={`p-3.5 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      {subtitle && <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{subtitle}</span>}
    </div>
    <div className="relative z-10">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

function hoy() { return fechaPeruISO(); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminFinanzasPage() {
  const navigate = useNavigate();
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  const [datos, setDatos] = useState<MargenVentasDTO | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [error, setError] = useState('');

  // Obtenemos la sede seleccionada del menú superior
  const { sedeSeleccionadaId } = useAuthStore();

  const cargarDatos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Inyectamos la sede para que el reporte sea específico al local
      const data = await getMargenVentas(inicio, fin, sedeSeleccionadaId || undefined);
      setDatos(data); 
      setIsPremium(true);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.data?.codigo === 'MODULO_NO_HABILITADO') {
        setIsPremium(false);
      } else {
        setError('Ocurrió un error al calcular los márgenes financieros.');
      }
    } finally { setLoading(false); }
  }, [inicio, fin, sedeSeleccionadaId]); // Recarga automáticamente si cambias de sede

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ========================================================= */}
        {/* PANTALLA DE BLOQUEO PREMIUM                               */}
        {/* ========================================================= */}
        {!isPremium ? (
          <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 min-h-[60vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
            <div className="w-24 h-24 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Lock size={40} className="text-orange-500" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-widest mb-4">
              <Sparkles size={14} /> Módulo Bloqueado
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Plan Premium Requerido
            </h2>
            <p className="text-gray-500 font-medium text-lg max-w-xl mb-10">
              El análisis avanzado de <strong>Rentabilidad</strong> utiliza el algoritmo de Kardex Ponderado para calcular tu utilidad real. Actualiza tu plan para desbloquearlo.
            </p>
            <button onClick={() => navigate('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95">
              <ArrowLeft size={20} /> Volver al Dashboard
            </button>
          </div>
        ) : (
          
          /* ========================================================= */
          /* PANTALLA FINANCIERA PRINCIPAL                             */
          /* ========================================================= */
          <>
            {/* CABECERA LIMPIA Y MODERNA */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Rentabilidad <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Financiera</span>
                </h1>
                <p className="text-gray-500 font-medium mt-1">Análisis de costos y utilidad por sede y período.</p>
              </div>

              {/* FILTROS TIPO "PILL" (CÁPSULA) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-[1.5rem] border border-gray-200 shadow-sm w-full xl:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-full sm:w-auto">
                  <Calendar size={16} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Desde</span>
                    <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
                  </div>
                </div>
                <span className="text-gray-300 hidden sm:block">-</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl w-full sm:w-auto">
                  <Calendar size={16} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Hasta</span>
                    <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="bg-transparent text-gray-900 text-sm font-bold outline-none cursor-pointer" />
                  </div>
                </div>
                <button onClick={cargarDatos} disabled={loading} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl transition-all active:scale-95 flex justify-center items-center">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3"><AlertTriangle size={18}/> {error}</div>}

            {/* TARJETAS DE MÉTRICAS (GRID FLOTANTE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                icon={<DollarSign size={24} strokeWidth={2.5} />} 
                title="Ingresos Totales" 
                value={`S/ ${datos?.ingresosTotales.toFixed(2) || '0.00'}`} 
                bgClass="bg-emerald-50" colorClass="text-emerald-600" borderClass="border-emerald-100/50"
              />
              <MetricCard 
                icon={<Activity size={24} strokeWidth={2.5} />} 
                title="Costo de Ventas (Kardex)" 
                value={`S/ ${datos?.costoVentas.toFixed(2) || '0.00'}`} 
                subtitle="Inversión"
                bgClass="bg-rose-50" colorClass="text-rose-600" borderClass="border-rose-100/50"
              />
              <MetricCard 
                icon={<TrendingUp size={24} strokeWidth={2.5} />} 
                title="Utilidad Bruta" 
                value={`S/ ${datos?.utilidadBruta.toFixed(2) || '0.00'}`} 
                bgClass="bg-blue-50" colorClass="text-blue-600" borderClass="border-blue-100/50"
              />
              
              {/* TARJETA DESTACADA: MARGEN GLOBAL */}
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[30px] group-hover:bg-orange-500/30 transition-colors"></div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="bg-white/10 p-3.5 rounded-2xl text-orange-400 backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
                    <PieChart size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-bold text-white/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">Global</span>
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Margen de Ganancia</p>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    {datos?.margenBrutoPct.toFixed(1) || '0.0'}%
                  </h3>
                </div>
              </div>
            </div>

            {/* ALERTA DE MERMAS (Minimalista) */}
            {datos && datos.costoMerma > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-5 rounded-[1.5rem] flex items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl text-rose-500 shadow-sm"><TrendingDown size={20} /></div>
                <div>
                  <p className="text-sm font-black text-rose-900 tracking-tight">Alerta de Mermas Registradas</p>
                  <p className="text-xs font-medium text-rose-700 mt-0.5">Se han reportado pérdidas por un valor de <strong>S/ {datos.costoMerma.toFixed(2)}</strong> en este período debido a ítems cancelados o desechados.</p>
                </div>
              </div>
            )}

            {/* TABLA DE DESGLOSE LIMPIA */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm border border-gray-100"><PieChart size={18}/></div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Rendimiento por Producto</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[11px] text-gray-400 uppercase tracking-widest font-bold bg-white">
                    <tr>
                      <th className="px-8 py-5 border-b border-gray-50">Plato / Producto</th>
                      <th className="px-8 py-5 border-b border-gray-50 text-right">Ingresos</th>
                      <th className="px-8 py-5 border-b border-gray-50 text-right">Costo Inv.</th>
                      <th className="px-8 py-5 border-b border-gray-50 text-right">Utilidad</th>
                      <th className="px-8 py-5 border-b border-gray-50 text-center">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {datos?.desglosePorProducto.map((prod) => (
                      <tr key={prod.productoId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-black text-gray-900 text-[15px]">{prod.producto}</span>
                          {prod.esEstimado && <span className="ml-3 inline-block text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider border border-amber-100">Costo Referencial</span>}
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-emerald-600">S/ {prod.ingresos.toFixed(2)}</td>
                        <td className="px-8 py-5 text-right font-bold text-rose-500">S/ {prod.costoVentas.toFixed(2)}</td>
                        <td className="px-8 py-5 text-right font-black text-gray-900 text-base">S/ {prod.utilidadBruta.toFixed(2)}</td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 rounded-xl font-black text-xs tracking-wider ${
                            prod.margenPct >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            prod.margenPct >= 20 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                            'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {prod.margenPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {datos?.desglosePorProducto.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <p className="text-gray-400 font-bold text-base">No hay ventas registradas en esta sede para el período seleccionado.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  );
}