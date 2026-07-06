import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, TrendingUp, ShoppingBag, LogOut, RefreshCw, Download } from 'lucide-react';
import { getDashboard, getAlertasStock } from '@/api/reportes';
import { useAuthStore } from '@/store/authStore';
import type { DashboardVentas, InsumoAlerta } from '@/api/reportes';

function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// Gráfico SVG de barras simple (sin dependencias externas)
function GraficoBarras({ datos }: { datos: DashboardVentas['detalleDiario'] }) {
  if (!datos.length) return <p className="text-center text-gray-400 py-10">Sin datos</p>;

  const maxIngreso = Math.max(...datos.map((d) => d.ingresos), 1);
  const W = 600;
  const H = 180;
  const PL = 50;
  const PR = 12;
  const PT = 10;
  const PB = 36;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const barW = Math.max(4, innerW / datos.length - 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
      {/* Grid horizontal */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PT + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(maxIngreso * t)}
            </text>
          </g>
        );
      })}

      {/* Barras */}
      {datos.map((d, i) => {
        const barH = (d.ingresos / maxIngreso) * innerH;
        const x = PL + (i / datos.length) * innerW + (innerW / datos.length - barW) / 2;
        const y = PT + innerH - barH;
        const label = d.fecha.slice(5); // MM-DD
        return (
          <g key={d.fecha}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill="#f97316" opacity="0.85" />
            {datos.length <= 15 && (
              <text x={x + barW / 2} y={H - PB + 14} textAnchor="middle" fontSize="8" fill="#6b7280">
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [inicio, setInicio] = useState(hace30Dias);
  const [fin, setFin] = useState(hoy);
  const [dashboard, setDashboard] = useState<DashboardVentas | null>(null);
  const [alertas, setAlertas] = useState<InsumoAlerta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, alts] = await Promise.all([getDashboard(inicio, fin), getAlertasStock()]);
      setDashboard(dash);
      setAlertas(alts);
    } catch {
      setError('Error al cargar los datos. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const descargarExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`/api/reportes/excel?inicio=${inicio}&fin=${fin}&token=${token}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-orange-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard · La Ruta del Sabor</h1>
            <p className="text-xs text-gray-500">{user?.correo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mozo')}
            className="text-sm text-gray-500 hover:text-orange-500 transition"
          >
            Ir a Pedidos
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Filtros de fecha */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Download size={14} />
            Exportar Excel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ingresos totales</p>
              <p className="text-2xl font-black text-gray-900">
                S/ {dashboard ? dashboard.ingresosTotalesMensuales.toFixed(2) : '—'}
              </p>
              <p className="text-xs text-gray-400">{inicio} → {fin}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pedidos pagados</p>
              <p className="text-2xl font-black text-gray-900">
                {dashboard ? dashboard.pedidosTotalesMensuales : '—'}
              </p>
              <p className="text-xs text-gray-400">en el período seleccionado</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Ingresos por día (S/)</h2>
          {dashboard ? (
            <GraficoBarras datos={dashboard.detalleDiario} />
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
              {loading ? 'Cargando...' : 'Sin datos'}
            </div>
          )}
        </div>

        {/* Alertas de stock */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Alertas de stock bajo
              {alertas.length > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertas.length}
                </span>
              )}
            </h2>
          </div>

          {alertas.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Todos los insumos tienen stock suficiente ✓</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">Insumo</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">Stock actual</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">Mínimo</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">Unidad</th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a) => {
                    const critico = a.stockActual === 0;
                    return (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-amber-50/40">
                        <td className="py-2.5 font-medium text-gray-800">{a.nombre}</td>
                        <td className={`py-2.5 text-right font-bold ${critico ? 'text-red-600' : 'text-amber-600'}`}>
                          {a.stockActual}
                        </td>
                        <td className="py-2.5 text-right text-gray-500">{a.stockMinimo}</td>
                        <td className="py-2.5 text-right text-gray-400">{a.unidadMedida}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            critico ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {critico ? 'SIN STOCK' : 'BAJO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
