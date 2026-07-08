import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingDown, PieChart, Activity, Lock, ArrowLeft, 
  RefreshCw, Sparkles, Clock, ArrowRight, DollarSign 
} from 'lucide-react';
import { getMargenVentas } from '@/api/reportes';
import type { MargenVentasDTO } from '@/api/reportes';
import AdminLayout from '@/components/layouts/AdminLayout';
import { fechaPeruISO } from '@/lib/datetimePeru';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const MetricCard = ({ icon, title, value, colorClass, bgClass }: any) => (
  <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
    <div className="flex justify-between items-start mb-6">
      <div className={`${bgClass} p-4 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
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

  const cargarDatos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getMargenVentas(inicio, fin);
      setDatos(data); setIsPremium(true);
    } catch (err: any) {
      // El backend arroja 403 si el restaurante no tiene la suscripción requerida
      if (err.response?.status === 403 || err.response?.data?.codigo === 'MODULO_NO_HABILITADO') {
        setIsPremium(false);
      } else {
        setError('Ocurrió un error al calcular los márgenes financieros.');
      }
    } finally { setLoading(false); }
  }, [inicio, fin]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ========================================================= */}
        {/* PANTALLA DE BLOQUEO PREMIUM (REDISEÑADA)                  */}
        {/* ========================================================= */}
        {!isPremium ? (
          <div className="relative bg-[#0a0f1c] rounded-[2.5rem] p-12 overflow-hidden shadow-2xl border border-gray-800/60 min-h-[70vh] flex flex-col items-center justify-center text-center">
            {/* Background Mesh Gradients */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/20 to-red-600/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/5 border border-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                <Lock size={40} className="text-orange-400" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-5 backdrop-blur-md">
                <Sparkles size={14} /> Módulo Bloqueado
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                Plan Premium Requerido
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mb-10 leading-relaxed">
                El análisis avanzado de <strong>Costos y Rentabilidad (Módulo 5)</strong> incluye el cálculo de utilidad bruta y mermas mediante el algoritmo de Kardex Ponderado. Actualiza tu plan para desbloquearlo.
              </p>
              
              <button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-orange-500/25 active:scale-95">
                <ArrowLeft size={20} /> Volver al Dashboard
              </button>
            </div>
          </div>
        ) : (
          
          /* ========================================================= */
          /* PANTALLA FINANCIERA (SI TIENE ACCESO)                       */
          /* ========================================================= */
          <>
            {/* HERO BANNER */}
            <div className="relative bg-[#0a0f1c] rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl border border-gray-800/60">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/30 to-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-600/20 to-teal-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-5 backdrop-blur-md">
                    <PieChart size={14} /> Análisis Financiero
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    Costos y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">Rentabilidad</span>
                  </h1>
                  <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
                    Evaluación de márgenes de ganancia basados en el algoritmo de Promedio Ponderado del inventario (Kardex).
                  </p>
                </div>
                
                {/* CONTROLES FECHA */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 backdrop-blur-2xl p-2.5 rounded-[2rem] border border-white/10 shadow-2xl w-full sm:w-auto">
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-[1.5rem] border border-white/5 w-full sm:w-auto hover:bg-white/10 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10}/> Inicio</span>
                      <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <ArrowRight className="text-gray-500 hidden sm:block" size={16} />
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-[1.5rem] border border-white/5 w-full sm:w-auto hover:bg-white/10 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={10}/> Fin</span>
                      <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <button onClick={cargarDatos} disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white p-4 rounded-[1.5rem] transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex justify-center items-center">
                    <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold border border-red-200">{error}</div>}

            {/* TARJETAS FINANCIERAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard icon={<DollarSign size={28} strokeWidth={2.5} />} title="Ingresos" value={`S/ ${datos?.ingresosTotales.toFixed(2) || '0.00'}`} bgClass="bg-green-100/50" colorClass="text-green-600" />
              <MetricCard icon={<Activity size={28} strokeWidth={2.5} />} title="Costo de Ventas" value={`S/ ${datos?.costoVentas.toFixed(2) || '0.00'}`} bgClass="bg-red-100/50" colorClass="text-red-600" />
              <MetricCard icon={<PieChart size={28} strokeWidth={2.5} />} title="Utilidad Bruta" value={`S/ ${datos?.utilidadBruta.toFixed(2) || '0.00'}`} bgClass="bg-blue-100/50" colorClass="text-blue-600" />
              
              {/* Tarjeta Destacada Margen Global */}
              <div className="bg-gray-900 p-7 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[40px]"></div>
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="bg-white/10 p-4 rounded-2xl text-white backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
                    <TrendingDown size={28} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Margen Global</p>
                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 tracking-tight">
                    {datos?.margenBrutoPct.toFixed(1) || '0.0'} %
                  </h3>
                </div>
              </div>
            </div>

            {/* ALERTA DE MERMAS */}
            {datos && datos.costoMerma > 0 && (
              <div className="bg-red-50/50 border border-red-100 p-6 rounded-[2rem] flex items-center gap-4 hover:bg-red-50 transition-colors">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600"><TrendingDown size={24} /></div>
                <div>
                  <p className="text-base font-black text-red-900 tracking-tight">Pérdida por Mermas Detectada</p>
                  <p className="text-sm font-medium text-red-700 mt-1">Se han perdido <strong>S/ {datos.costoMerma.toFixed(2)}</strong> en ítems que fueron preparados por cocina y posteriormente cancelados.</p>
                </div>
              </div>
            )}

            {/* TABLA DE DESGLOSE */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><PieChart size={20}/></div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Rentabilidad por Producto</h3>
              </div>
              <div className="overflow-x-auto p-2">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">Producto Evaluado</th>
                      <th className="px-6 py-4 text-right">Ingresos</th>
                      <th className="px-6 py-4 text-right">Costo Inv.</th>
                      <th className="px-6 py-4 text-right">Utilidad</th>
                      <th className="px-6 py-4 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {datos?.desglosePorProducto.map((prod) => (
                      <tr key={prod.productoId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-black text-gray-900 text-base">{prod.producto}</span>
                          {prod.esEstimado && <span className="block mt-1 w-max text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">Costo Referencial</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">S/ {prod.ingresos.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-500">S/ {prod.costoVentas.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-black text-gray-900 text-base">S/ {prod.utilidadBruta.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-xs tracking-wider ${prod.margenPct >= 50 ? 'bg-green-100 text-green-800' : prod.margenPct >= 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {prod.margenPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {datos?.desglosePorProducto.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium text-base">No hay ventas registradas en este período para analizar.</td></tr>
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