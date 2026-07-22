import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, ShoppingBag, TrendingUp, AlertTriangle, 
  RefreshCw, Download, Sparkles, Clock, ArrowRight,
  Wallet, UtensilsCrossed, ChefHat, ChevronDown, CheckCircle
} from 'lucide-react';
import { getDashboard, getAlertasStock } from '@/api/reportes';
import type { DashboardVentas, InsumoAlerta } from '@/api/reportes';
import { useAuthStore } from '@/store/authStore';
import { fechaPeruISO } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';

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

// ============================================================================
// COMPONENTE: GRÁFICO DE BARRAS DARK (Panorámico)
// ============================================================================
const GraficoBarrasDark = ({ datos }: { datos: any[] }) => {
  if (!datos || datos.length === 0) return <div className="h-full flex items-center justify-center text-gray-500 text-lg font-medium">Sin datos para graficar</div>;
  const maxIngreso = Math.max(...datos.map((d) => d.ingresos), 1);
  const W = 1000, H = 320, PL = 70, PR = 20, PT = 30, PB = 45;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const barW = Math.max(40, (innerW / datos.length) - 30);
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
      {[0, 0.33, 0.66, 1].map((t) => {
        const y = PT + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
            <text x={PL - 15} y={y + 6} textAnchor="end" fontSize="16" fontWeight="700" fill="#94a3b8">
              {Math.round(maxIngreso * t)}
            </text>
          </g>
        );
      })}
      {datos.map((d, i) => {
        const barH = (d.ingresos / maxIngreso) * innerH;
        const x = PL + (i / datos.length) * innerW + (innerW / datos.length - barW) / 2;
        const y = PT + innerH - barH;
        const date = new Date(d.fecha + 'T00:00:00');
        const dayName = dias[date.getDay()];

        return (
          <g key={d.fecha} className="group">
            <line x1={x + barW/2} y1={PT} x2={x + barW/2} y2={PT + innerH} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.2" />
            <rect x={x} y={y} width={barW} height={barH} rx="6" fill="#FFC640" opacity="0.95" className="hover:opacity-100 hover:fill-amber-400 transition-all cursor-pointer">
              <title>{dayName}: S/ {Number(d.ingresos).toFixed(2)}</title>
            </rect>
            {datos.length <= 15 && (
              <text x={x + barW / 2} y={H - PB + 30} textAnchor="middle" fontSize="16" fontWeight="700" fill="#94a3b8">{dayName}</text>
            )}
          </g>
        );
      })}
      <line x1={PL} y1={PT + innerH} x2={W - PR} y2={PT + innerH} stroke="#475569" strokeWidth="2.5" />
    </svg>
  );
};

// ============================================================================
// COMPONENTE: GRÁFICO DE LÍNEAS DARK (Panorámico)
// ============================================================================
const GraficoLineasDark = ({ datos }: { datos: any[] }) => {
  if (!datos || datos.length === 0) return <div className="h-full flex items-center justify-center text-gray-500 text-lg font-medium">Sin datos para graficar</div>;
  const maxPedidos = Math.max(...datos.map((d) => d.pedidos), 1);
  const W = 1000, H = 320, PL = 70, PR = 30, PT = 30, PB = 45;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const points = datos.map((d, i) => {
    const x = PL + (i / Math.max(datos.length - 1, 1)) * innerW;
    const y = PT + innerH - ((d.pedidos / maxPedidos) * innerH);
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible">
      {[0, 0.33, 0.66, 1].map((t) => {
        const y = PT + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />
            <text x={PL - 15} y={y + 6} textAnchor="end" fontSize="16" fontWeight="700" fill="#94a3b8">
              {Math.round(maxPedidos * t)}
            </text>
          </g>
        );
      })}
      
      <path d={pathD} stroke="#FFC640" strokeWidth="4" fill="none" />
      <line x1={PL} y1={PT + innerH} x2={W - PR} y2={PT + innerH} stroke="#475569" strokeWidth="2.5" />
      
      {datos.map((d, i) => {
        const x = PL + (i / Math.max(datos.length - 1, 1)) * innerW;
        const y = PT + innerH - ((d.pedidos / maxPedidos) * innerH);
        const date = new Date(d.fecha + 'T00:00:00');
        const dayName = dias[date.getDay()];

        return (
          <g key={d.fecha}>
            <line x1={x} y1={PT} x2={x} y2={PT + innerH} stroke="#334155" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.2" />
            <circle cx={x} cy={y} r="8" fill="#050505" stroke="#FFC640" strokeWidth="3.5" className="hover:r-[11] transition-all cursor-pointer">
              <title>{dayName}: {d.pedidos} pedidos</title>
            </circle>
            {datos.length <= 15 && (
              <text x={x} y={H - PB + 30} textAnchor="middle" fontSize="16" fontWeight="700" fill="#94a3b8">{dayName}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

function hoy() { return fechaPeruISO(); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, sedeSeleccionadaId } = useAuthStore();
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  const [dashboard, setDashboard] = useState<DashboardVentas | any>(null);
  const [alertas, setAlertas] = useState<InsumoAlerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [stockDesplegado, setStockDesplegado] = useState(false);

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 18 ? 'Buenas tardes' : 'Buenas noches';
  const primerNombre = user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Administrador';

  const cargarDatos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [dashData, alertasData] = await Promise.all([
        getDashboard(inicio, fin, sedeSeleccionadaId || undefined), 
        getAlertasStock(sedeSeleccionadaId || undefined)
      ]);
      setDashboard(dashData); 
      setAlertas(alertasData);
    } catch { 
      setError('Error al cargar métricas.'); 
    } finally { 
      setLoading(false); 
    }
  }, [inicio, fin, sedeSeleccionadaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const descargarExcel = () => {
    const token = useAuthStore.getState().token;
    let url = `http://localhost:8080/api/reportes/excel?inicio=${inicio}&fin=${fin}&token=${token}`;
    if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
    window.open(url, '_blank');
  };

  const ticketPromedio = dashboard && dashboard.pedidosTotalesMensuales > 0 
    ? (dashboard.ingresosTotalesMensuales / dashboard.pedidosTotalesMensuales) 
    : 0;

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* BANNER PRINCIPAL */}
        <div className="relative bg-[#050505] rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl border border-gray-800/40">
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
              <button onClick={descargarExcel} title="Descargar Reporte Excel" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white p-4 rounded-[1.5rem] transition-all flex justify-center items-center gap-2 border border-white/10">
                <Download size={22} />
                <span className="sm:hidden font-bold">Descargar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={() => navigate('/cajero')} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-lg shadow-emerald-500/20 hover:scale-[1.03] transition-transform group text-left">
             <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-2xl group-hover:bg-white/30 transition-colors"><Wallet size={26} strokeWidth={2.5} /></div>
               <div><p className="font-black text-xl tracking-tight">Caja y Pagos</p><p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mt-0.5">Operativa Financiera</p></div>
             </div>
             <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigate('/mozo')} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-lg shadow-blue-500/20 hover:scale-[1.03] transition-transform group text-left">
             <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-2xl group-hover:bg-white/30 transition-colors"><UtensilsCrossed size={26} strokeWidth={2.5} /></div>
               <div><p className="font-black text-xl tracking-tight">Salón (Mozos)</p><p className="text-xs font-bold text-blue-100 uppercase tracking-widest mt-0.5">Toma de Pedidos</p></div>
             </div>
             <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigate('/cocina')} className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-[2rem] text-white flex items-center justify-between shadow-lg shadow-orange-500/20 hover:scale-[1.03] transition-transform group text-left">
             <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-2xl group-hover:bg-white/30 transition-colors"><ChefHat size={26} strokeWidth={2.5} /></div>
               <div><p className="font-black text-xl tracking-tight">Cocina (KDS)</p><p className="text-xs font-bold text-orange-100 uppercase tracking-widest mt-0.5">Pantalla de Chef</p></div>
             </div>
             <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard icon={<DollarSign size={28} strokeWidth={2.5} />} title="Ingresos Totales" value={`S/ ${dashboard?.ingresosTotalesMensuales?.toFixed(2) || '0.00'}`} subtitle="Dinero cobrado en caja" bgClass="bg-green-100/50" colorClass="text-green-600" />
          <MetricCard icon={<ShoppingBag size={28} strokeWidth={2.5} />} title="Pedidos Pagados" value={dashboard?.pedidosTotalesMensuales || 0} subtitle="Mesas y deliveries completados" bgClass="bg-blue-100/50" colorClass="text-blue-600" />
          <MetricCard icon={<TrendingUp size={28} strokeWidth={2.5} />} title="Ticket Promedio" value={`S/ ${ticketPromedio.toFixed(2)}`} subtitle="Gasto promedio por cliente" bgClass="bg-purple-100/50" colorClass="text-purple-600" />
        </div>
        
        {/* ========================================================================= */}
        {/* STOCK CRÍTICO DESPLEGABLE (ACORDEÓN) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => setStockDesplegado(!stockDesplegado)}
            className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${alertas.length > 0 ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {alertas.length > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Alertas de Stock Crítico</h3>
                <p className="text-sm font-medium text-gray-500">
                  {alertas.length > 0 ? `Tienes ${alertas.length} insumos por debajo del mínimo` : 'Tu almacén está en niveles óptimos'}
                </p>
              </div>
            </div>
            <div className={`p-2 rounded-full transition-transform duration-300 ${stockDesplegado ? 'rotate-180 bg-gray-100' : 'bg-gray-50'}`}>
              <ChevronDown className="text-gray-500" size={24} />
            </div>
          </button>
          
          <div className={`transition-all duration-500 ease-in-out ${stockDesplegado ? 'max-h-[500px] border-t border-gray-100 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            {loading ? (
              <div className="p-8 text-center text-gray-400 font-bold">Evaluando almacén...</div>
            ) : alertas.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium bg-gray-50">
                Todo en orden. No hay alertas que revisar.
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 overflow-y-auto max-h-[400px]">
                {alertas.map((a) => {
                  const critico = a.stockActual <= 0;
                  return (
                    <div key={a.insumoId} className={`p-5 rounded-2xl border bg-white flex justify-between items-center shadow-sm ${critico ? 'border-red-100' : 'border-orange-100'}`}>
                      <div>
                        <span className={`font-black text-base ${critico ? 'text-red-600' : 'text-orange-600'}`}>{a.nombre}</span>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Min: {a.stockMinimo} {a.unidadMedida}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black px-3 py-1.5 rounded-xl ${critico ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
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

        {/* ========================================================================= */}
        {/* GRÁFICOS DARK Y TOP PRODUCTOS EN GRID 2x2 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* 1. VENTAS DE LA SEMANA */}
          <div className="bg-[#050505] rounded-[2rem] border border-gray-800/40 shadow-2xl p-8 flex flex-col h-[420px]">
            <h3 className="text-white font-black text-xl tracking-wide mb-6">Ventas de la Semana</h3>
            <div className="flex-1 w-full relative">
              {loading ? <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">Cargando...</div> : <GraficoBarrasDark datos={dashboard?.detalleDiario || []} />}
            </div>
            <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-gray-800/40">
              <div className="w-4 h-4 bg-[#FFC640] rounded-[3px]"></div>
              <span className="text-sm text-gray-400 font-bold">Ventas Totales (S/)</span>
            </div>
          </div>

          {/* 2. TENDENCIA DE PEDIDOS */}
          <div className="bg-[#050505] rounded-[2rem] border border-gray-800/40 shadow-2xl p-8 flex flex-col h-[420px]">
            <h3 className="text-white font-black text-xl tracking-wide mb-6">Tendencia de Pedidos</h3>
            <div className="flex-1 w-full relative">
              {loading ? <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium">Cargando...</div> : <GraficoLineasDark datos={dashboard?.detalleDiario || []} />}
            </div>
            <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-gray-800/40">
              <div className="w-4 h-4 rounded-full border-[3px] border-[#FFC640] bg-[#050505]"></div>
              <span className="text-sm text-gray-400 font-bold">Cantidad de Pedidos</span>
            </div>
          </div>

          {/* 3. VENTAS POR CATEGORÍA (BARRAS DE PROGRESO HORIZONTALES) */}
          <div className="bg-[#050505] rounded-[2rem] border border-gray-800/40 shadow-2xl p-8 flex flex-col h-[420px]">
            <h3 className="text-white font-black text-xl tracking-wide mb-6">Ventas por Categoría</h3>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-sm">Cargando métricas...</div>
            ) : !dashboard?.ventasPorCategoria || dashboard.ventasPorCategoria.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-medium text-sm">Sin datos en este período.</div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-6 overflow-y-auto custom-scrollbar pr-2">
                {dashboard.ventasPorCategoria.slice(0, 5).map((cat: any, i: number) => {
                  const maxVal = Math.max(...dashboard.ventasPorCategoria.map((c:any) => c.ingresosTotales), 1);
                  const pct = (cat.ingresosTotales / maxVal) * 100;
                  
                  return (
                    <div key={i} className="w-full">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-gray-300">{cat.categoria}</span>
                        <span className="text-[#FFC640]">S/ {Number(cat.ingresosTotales).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-800/50 rounded-full h-3.5 border border-gray-800/50 overflow-hidden">
                        <div 
                          className="bg-[#FFC640] h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(255,198,64,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. PRODUCTOS MÁS VENDIDOS */}
          <div className="bg-[#050505] rounded-[2rem] border border-gray-800/40 shadow-2xl p-8 flex flex-col h-[420px] overflow-hidden">
            <h3 className="text-white font-black text-xl tracking-wide mb-6">Productos Más Vendidos</h3>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">Cargando métricas...</div>
            ) : !dashboard?.productosMasVendidos || dashboard.productosMasVendidos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-medium">Aún no hay ventas en este período.</div>
            ) : (
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {dashboard.productosMasVendidos.map((prod: any, index: number) => (
                  <div key={index} className="flex items-center justify-between group bg-gray-900/30 p-4 rounded-2xl border border-gray-800/50 hover:bg-gray-800/60 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full font-black text-sm flex items-center justify-center transition-colors ${index === 0 ? 'bg-[#FFC640] text-black shadow-[0_0_10px_rgba(255,198,64,0.3)]' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{prod.producto}</span>
                    </div>
                    <span className="text-[#FFC640] font-black text-sm bg-orange-900/30 px-3 py-1.5 rounded-xl border border-orange-500/20 shadow-inner">
                      {prod.cantidadVendida} unid.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}