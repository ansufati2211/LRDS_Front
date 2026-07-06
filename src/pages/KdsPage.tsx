import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CheckCircle, Clock, LogOut, Wifi, WifiOff } from 'lucide-react';
import { getKdsPendientes, marcarPreparando, marcarListo } from '@/api/kds';
import { useAuthStore } from '@/store/authStore';
import type { KdsPedido } from '@/api/kds';

// Agrupa las filas de la vista vw_kds_cocina por pedidoId
function agruparPorPedido(filas: KdsPedido[]): Map<number, { header: KdsPedido; items: KdsPedido[] }> {
  const map = new Map<number, { header: KdsPedido; items: KdsPedido[] }>();
  for (const f of filas) {
    if (!map.has(f.pedidoId)) {
      map.set(f.pedidoId, { header: f, items: [] });
    }
    map.get(f.pedidoId)!.items.push(f);
  }
  return map;
}

export default function KdsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [pedidos, setPedidos] = useState<Map<number, { header: KdsPedido; items: KdsPedido[] }>>(new Map());
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const cargarPedidos = useCallback(async () => {
    const data = await getKdsPendientes();
    setPedidos(agruparPorPedido(data));
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  // SSE: escucha nuevos pedidos en tiempo real
  // R2-2: token requerido vía ?token= porque EventSource no puede enviar headers Authorization
  useEffect(() => {
    const token = localStorage.getItem('token');
    const es = new EventSource(`/api/kds/eventos?token=${token}`);

    es.onopen = () => setConectado(true);
    es.onerror = () => {
      setConectado(false);
      es.close();
    };

    es.addEventListener('NUEVO_PEDIDO', () => {
      cargarPedidos();
    });
    es.addEventListener('PEDIDO_LISTO', () => {
      cargarPedidos();
    });

    return () => es.close();
  }, [cargarPedidos]);

  const handlePreparando = async (pedidoId: number) => {
    setLoading((l) => ({ ...l, [pedidoId]: true }));
    try {
      await marcarPreparando(pedidoId);
      await cargarPedidos();
    } finally {
      setLoading((l) => ({ ...l, [pedidoId]: false }));
    }
  };

  const handleListo = async (pedidoId: number) => {
    setLoading((l) => ({ ...l, [pedidoId]: true }));
    try {
      await marcarListo(pedidoId);
      await cargarPedidos();
    } finally {
      setLoading((l) => ({ ...l, [pedidoId]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const grupos = Array.from(pedidos.values());
  const recibidos = grupos.filter((g) => g.header.estado === 'RECIBIDO');
  const enPreparacion = grupos.filter((g) => g.header.estado === 'EN_PREPARACION');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header oscuro KDS */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-orange-400" />
          <div>
            <h1 className="text-lg font-bold">KDS · Pantalla Cocina</h1>
            <p className="text-xs text-gray-400">{user?.correo}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs ${conectado ? 'text-green-400' : 'text-red-400'}`}>
            {conectado ? <Wifi size={14} /> : <WifiOff size={14} />}
            {conectado ? 'En vivo' : 'Sin conexión'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition"
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Columna RECIBIDOS */}
        <div className="flex-1 border-r border-gray-700 overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              <h2 className="font-bold text-blue-400">NUEVOS ({recibidos.length})</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {recibidos.length === 0 && (
              <p className="text-center text-gray-600 py-10">Sin pedidos nuevos</p>
            )}
            {recibidos.map(({ header, items }) => (
              <div key={header.pedidoId} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="bg-blue-900/40 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                  <div>
                    <span className="text-xl font-black text-white">#{header.numeroOrden || header.pedidoId}</span>
                    <span className="ml-2 text-sm text-gray-400">{header.mesa || header.tipoConsumo}</span>
                  </div>
                  <span className="text-xs text-gray-500">{header.mozo}</span>
                </div>
                <div className="p-4 space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="bg-orange-500 text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0">
                        {item.cantidad}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{item.nombreProducto}</p>
                        {item.notasPreparacion && (
                          <p className="text-xs text-yellow-400 mt-0.5">⚠ {item.notasPreparacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handlePreparando(header.pedidoId)}
                    disabled={loading[header.pedidoId]}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition"
                  >
                    {loading[header.pedidoId] ? 'Procesando...' : '▶ Iniciar preparación'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna EN PREPARACIÓN */}
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-gray-900 px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-yellow-400" />
              <h2 className="font-bold text-yellow-400">EN PREPARACIÓN ({enPreparacion.length})</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {enPreparacion.length === 0 && (
              <p className="text-center text-gray-600 py-10">Ningún pedido en preparación</p>
            )}
            {enPreparacion.map(({ header, items }) => (
              <div key={header.pedidoId} className="bg-gray-800 rounded-2xl border border-yellow-800/50 overflow-hidden">
                <div className="bg-yellow-900/30 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                  <div>
                    <span className="text-xl font-black text-white">#{header.numeroOrden || header.pedidoId}</span>
                    <span className="ml-2 text-sm text-gray-400">{header.mesa || header.tipoConsumo}</span>
                  </div>
                  <span className="text-xs text-gray-500">{header.mozo}</span>
                </div>
                <div className="p-4 space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="bg-yellow-500 text-black text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0">
                        {item.cantidad}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{item.nombreProducto}</p>
                        {item.notasPreparacion && (
                          <p className="text-xs text-yellow-400 mt-0.5">⚠ {item.notasPreparacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => handleListo(header.pedidoId)}
                    disabled={loading[header.pedidoId]}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle size={16} />
                    {loading[header.pedidoId] ? 'Procesando...' : 'Marcar como LISTO'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
