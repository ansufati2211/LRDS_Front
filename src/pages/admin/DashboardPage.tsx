import { useEffect, useState, useCallback } from 'react';
import { 
  DollarSign, ShoppingBag, TrendingUp, AlertTriangle, 
  RefreshCw, Download, Sparkles, Clock, ArrowRight 
} from 'lucide-react';
import { getDashboard, getAlertasStock } from '@/api/reportes';
import type { DashboardVentas, InsumoAlerta } from '@/api/reportes';
import { useAuthStore } from '@/store/authStore';
import { fechaPeruISO } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';

// ============================================================================
// COMPONENTES AUXILIARES REDISEÑADOS
// ============================================================================

const MetricCard = ({ icon, title, value, subtitle, colorClass, bgClass, trend }: any) => (
  <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
    <div className="flex justify-between items-start mb-6">
      <div className={`${bgClass} p-4 rounded-2xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      {trend && <span className="bg-green-50 text-green-600 text-xs font-extrabold px-3 py-1.5 rounded-full border border-green-100">{trend}</span>}
    </div>
    <div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
      {subtitle && <p className="text-sm font-medium text-gray-500 mt-2">{subtitle}</p>}
    </div>
  </div>
);

const GraficoBarras = ({ datos }: { datos: DashboardVentas['detalleDiario'] }) => {
  if (!datos || datos.length === 0) return <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">Sin datos para graficar en este período</div>;
  const maxIngreso = Math.max(...datos.map((d) => d.ingresos), 1);
  const W = 600, H = 250, PL = 50, PR = 12, PT = 20, PB = 36;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const barW = Math.max(6, innerW / datos.length - 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full min-h-[250px] overflow-visible">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={PL} y1={PT + innerH * (1 - t)} x2={W - PR} y2={PT + innerH * (1 - t)} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={PL - 10} y={PT + innerH * (1 - t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#94a3b8">{Math.round(maxIngreso * t)}</text>
        </g>
      ))}
      {datos.map((d, i) => {
        const barH = (d.ingresos / maxIngreso) * innerH;
        const x = PL + (i / datos.length) * innerW + (innerW / datos.length - barW) / 2;
        const y = PT + innerH - barH;
        return (
          <g key={d.fecha} className="group">
            <rect x={x} y={y} width={barW} height={barH} rx="6" fill="#f97316" opacity="0.9" className="group-hover:opacity-100 group-hover:fill-orange-500 transition-all cursor-pointer" />
            {datos.length <= 15 && <text x={x + barW / 2} y={H - PB + 22} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">{d.fecha.slice(5)}</text>}
          </g>
        );
      })}
    </svg>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DASHBOARD
// ============================================================================

function hoy() { return fechaPeruISO(); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  const [dashboard, setDashboard] = useState<DashboardVentas | null>(null);
  const [alertas, setAlertas] = useState<InsumoAlerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 18 ? 'Buenas tardes' : 'Buenas noches';
  
  // Nombre seguro
  const primerNombre = user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Administrador';

  const cargarDatos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashData, alertasData] = await Promise.all([getDashboard(inicio, fin), getAlertasStock()]);
      setDashboard(dashData); setAlertas(alertasData);
    } catch { setError('Error al cargar métricas.'); } finally { setLoading(false); }
  }, [inicio, fin]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const descargarExcel = () => {
    const token = useAuthStore.getState().token;
    window.open(`/api/reportes/excel?inicio=${inicio}&fin=${fin}&token=${token}`, '_blank');
  };

  const ticketPromedio = dashboard && dashboard.pedidosTotalesMensuales > 0 ? (dashboard.ingresosTotalesMensuales / dashboard.pedidosTotalesMensuales) : 0;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HERO BANNER */}
        <div className="relative bg-[#0a0f1c] rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl border border-gray-800/60">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-orange-500/30 to-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-600/20 to-emerald-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-5 backdrop-blur-md">
                <Sparkles size={14} /> Resumen Operativo
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                {saludo}, <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  {primerNombre}
                </span>
              </h1>
              <p className="text-gray-400 font-medium text-lg max-w-xl leading-relaxed">
                Aquí tienes el pulso exacto de tu restaurante. Controla tus ingresos, evalúa tu ticket promedio y anticipa tus compras.
              </p>
            </div>
            
            {/* CONTROLES (Ahora con el botón de EXCEL) */}
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

              <button onClick={cargarDatos} disabled={loading} title="Actualizar Datos" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white p-4 rounded-[1.5rem] transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex justify-center items-center">
                <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
              </button>

              {/* Botón de Excel Restaurado */}
              <button onClick={descargarExcel} title="Descargar Reporte Excel" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white p-4 rounded-[1.5rem] transition-all flex justify-center items-center gap-2 border border-white/10">
                <Download size={22} />
                <span className="sm:hidden font-bold">Descargar Excel</span>
              </button>

            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-bold">{error}</div>}

        {/* Tarjetas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard icon={<DollarSign size={28} strokeWidth={2.5} />} title="Ingresos Totales" value={`S/ ${dashboard?.ingresosTotalesMensuales.toFixed(2) || '0.00'}`} subtitle="Dinero cobrado en caja" bgClass="bg-green-100/50" colorClass="text-green-600" trend="+12.5%" />
          <MetricCard icon={<ShoppingBag size={28} strokeWidth={2.5} />} title="Pedidos Pagados" value={dashboard?.pedidosTotalesMensuales || 0} subtitle="Mesas y deliveries completados" bgClass="bg-blue-100/50" colorClass="text-blue-600" />
          <MetricCard icon={<TrendingUp size={28} strokeWidth={2.5} />} title="Ticket Promedio" value={`S/ ${ticketPromedio.toFixed(2)}`} subtitle="Gasto promedio por cliente" bgClass="bg-purple-100/50" colorClass="text-purple-600" />
        </div>

        {/* Área Principal Inferior */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col min-h-[420px]">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Evolución de Ingresos</h3>
            <div className="flex-1 w-full h-full mt-4">
              {loading ? <div className="h-full flex items-center justify-center text-gray-400 font-medium">Renderizando gráfica...</div> : <GraficoBarras datos={dashboard?.detalleDiario || []} />}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-3">
              <AlertTriangle className={alertas.length > 0 ? "text-orange-500" : "text-gray-400"} size={26} />
              Stock Crítico
            </h3>
            {loading ? (
              <p className="text-center text-gray-400 font-medium mt-10">Evaluando almacén...</p>
            ) : alertas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm"><ShoppingBag size={24} className="text-gray-300"/></div>
                <p className="font-bold text-gray-500 text-lg">Todo en orden</p>
                <p className="text-sm mt-1">Ningún insumo bajo el límite.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {alertas.map((a) => {
                  const critico = a.stockActual <= 0;
                  return (
                    <div key={a.id} className={`p-5 rounded-2xl border flex justify-between items-center transition-all hover:scale-[1.02] ${critico ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                      <div>
                        <span className={`font-black text-[15px] ${critico ? 'text-red-900' : 'text-orange-900'}`}>{a.nombre}</span>
                        <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Min: {a.stockMinimo} {a.unidadMedida}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${critico ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {critico ? 'VACÍO' : `Quedan ${a.stockActual}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}