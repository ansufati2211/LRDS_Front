import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Send, LogOut, Clock, CheckCircle, ChefHat, Truck, X, Bell } from 'lucide-react';
import {
  getProductos,
  getPedidosActivos,
  crearPedido,
  confirmarPedido,
  entregarPedido,
} from '@/api/pedidos';
import { useAuthStore } from '@/store/authStore';
import type { Producto, PedidoActivo, ItemPedidoLocal, EstadoPedido } from '@/types';

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: <Clock size={14} /> },
  RECIBIDO: { label: 'En cocina', color: 'bg-blue-100 text-blue-700', icon: <ChefHat size={14} /> },
  EN_PREPARACION: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700', icon: <ChefHat size={14} /> },
  LISTO: { label: '¡Listo!', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-100 text-purple-700', icon: <Truck size={14} /> },
  PAGADO: { label: 'Pagado', color: 'bg-slate-100 text-slate-500', icon: <CheckCircle size={14} /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-500', icon: <X size={14} /> },
};

interface NotificacionListo {
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  timestamp: Date;
  entregado: boolean;
}

// ─── Modal de notificaciones LISTO ─────────────────────────────────────────────
function NotificacionModal({
  notificaciones,
  onEntregar,
  onClose,
}: {
  notificaciones: NotificacionListo[];
  onEntregar: (id: number) => Promise<void>;
  onClose: () => void;
}) {
  const pendientes = notificaciones.filter((n) => !n.entregado);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-green-500 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-white" />
            <h2 className="text-white font-bold">
              {pendientes.length > 0
                ? `${pendientes.length} pedido${pendientes.length > 1 ? 's' : ''} listo${pendientes.length > 1 ? 's' : ''} para entregar`
                : 'Historial de notificaciones'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
          {notificaciones.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
          )}
          {notificaciones.map((n) => (
            <div key={n.pedidoId} className={`px-5 py-3 flex items-center justify-between ${n.entregado ? 'opacity-50' : ''}`}>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Orden #{n.numeroOrden} · {n.mesa || n.tipoConsumo}
                </p>
                <p className="text-xs text-gray-400">
                  {n.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  {n.entregado && <span className="ml-2 text-green-600">· Entregado</span>}
                </p>
              </div>
              {!n.entregado && (
                <button
                  onClick={() => onEntregar(n.pedidoId)}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Entregar ✓
                </button>
              )}
              {n.entregado && <CheckCircle size={18} className="text-green-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MozoPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');

  const [carrito, setCarrito] = useState<ItemPedidoLocal[]>([]);
  const [mesa, setMesa] = useState('');
  const [tipoConsumo, setTipoConsumo] = useState<'MESA' | 'PARA_LLEVAR' | 'DELIVERY'>('MESA');
  const [notasGenerales, setNotasGenerales] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);

  // R2-5/R2-6: notificaciones de pedidos LISTO
  const [notificaciones, setNotificaciones] = useState<NotificacionListo[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertando, setAlertando] = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarPedidos = useCallback(async () => {
    const data = await getPedidosActivos();
    setPedidos(data);
  }, []);

  useEffect(() => {
    getProductos().then((data) => setProductos(data.filter((p) => p.estadoRegistro)));
    cargarPedidos();
  }, [cargarPedidos]);

  // SSE: escucha eventos de cocina y escalación server-side
  useEffect(() => {
    const token = localStorage.getItem('token');
    const es = new EventSource(`/api/kds/eventos?token=${token}`);

    const agregarNotificacion = (data: { pedidoId: number; numeroOrden: number; mesa: string; tipoConsumo: string }) => {
      setNotificaciones((prev) => {
        if (prev.some((n) => n.pedidoId === data.pedidoId)) return prev;
        return [
          { ...data, timestamp: new Date(), entregado: false },
          ...prev,
        ];
      });
      setModalAbierto(true);
      cargarPedidos();
    };

    // t=0 notificación directa al mozo creador
    es.addEventListener('PEDIDO_LISTO', (e) => {
      const data = JSON.parse(e.data);
      agregarNotificacion(data);
    });

    // t=1min escalación a todos los mozos (R2 plano horizontal nivel 1)
    es.addEventListener('AVISO_PEDIDO_LISTO', (e) => {
      const data = JSON.parse(e.data);
      agregarNotificacion(data);
    });

    es.addEventListener('EN_PREPARACION', () => cargarPedidos());
    es.onerror = () => es.close();

    return () => es.close();
  }, [cargarPedidos]);

  // R2-6: re-alerta cada 10 s mientras haya pedidos LISTO sin entregar
  useEffect(() => {
    const pendientes = notificaciones.filter((n) => !n.entregado);
    if (alertTimerRef.current) clearInterval(alertTimerRef.current);
    if (pendientes.length === 0) return;

    alertTimerRef.current = setInterval(() => {
      setAlertando(true);
      setTimeout(() => setAlertando(false), 800);
    }, 10_000);

    return () => {
      if (alertTimerRef.current) clearInterval(alertTimerRef.current);
    };
  }, [notificaciones]);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarAlCarrito = (prod: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.productoId === prod.id);
      if (existe) return prev.map((i) => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    );
  };

  const totalCarrito = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const enviarPedido = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      await crearPedido({
        tipoConsumo,
        mesa,
        notasGenerales,
        items: carrito.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          notasPreparacion: i.notas,
        })),
      });
      setCarrito([]);
      setMesa('');
      setNotasGenerales('');
      await cargarPedidos();
    } finally {
      setEnviando(false);
    }
  };

  const handleConfirmar = async (id: number) => {
    await confirmarPedido(id);
    await cargarPedidos();
  };

  const handleEntregar = async (id: number) => {
    await entregarPedido(id);
    // R2-6: marcar notificación como entregada — el modal deja de alertar pero conserva el historial
    setNotificaciones((prev) =>
      prev.map((n) => n.pedidoId === id ? { ...n, entregado: true } : n)
    );
    await cargarPedidos();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendientesCount = notificaciones.filter((n) => !n.entregado).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">La Ruta del Sabor</h1>
            <p className="text-xs text-gray-500">Hola, {user?.correo} · Mozo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* R2-6: botón de notificaciones con badge, vibra al alertar */}
          {notificaciones.length > 0 && (
            <button
              onClick={() => setModalAbierto(true)}
              className={`relative p-2 rounded-full transition ${
                alertando ? 'animate-bounce bg-green-100' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Bell size={18} className={pendientesCount > 0 ? 'text-green-600' : 'text-gray-400'} />
              {pendientesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {pendientesCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-69px)]">
        {/* Panel izquierdo: Carta + Carrito */}
        <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex gap-2">
              {(['MESA', 'PARA_LLEVAR', 'DELIVERY'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoConsumo(t)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                    tipoConsumo === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'MESA' ? '🪑 Mesa' : t === 'PARA_LLEVAR' ? '📦 Para llevar' : '🛵 Delivery'}
                </button>
              ))}
            </div>
            {tipoConsumo === 'MESA' && (
              <input
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Número de mesa (ej: Mesa 3)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            )}
          </div>

          <div className="p-3 border-b border-gray-100">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {productosFiltrados.map((prod) => {
              const enCarrito = carrito.find((i) => i.productoId === prod.id);
              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 border border-transparent hover:border-orange-100 transition cursor-pointer"
                  onClick={() => agregarAlCarrito(prod)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{prod.nombre}</p>
                    <p className="text-xs text-gray-500">S/ {prod.precioVenta.toFixed(2)}</p>
                  </div>
                  {enCarrito ? (
                    <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                      {enCarrito.cantidad}
                    </span>
                  ) : (
                    <Plus size={18} className="text-gray-400" />
                  )}
                </div>
              );
            })}
          </div>

          {carrito.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">Pedido actual</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {carrito.map((item) => (
                  <div key={item.productoId} className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">{item.nombre}</p>
                      <p className="text-xs text-gray-400">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cambiarCantidad(item.productoId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(item.productoId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-base font-bold text-gray-900">S/ {totalCarrito.toFixed(2)}</span>
              </div>
              <input
                value={notasGenerales}
                onChange={(e) => setNotasGenerales(e.target.value)}
                placeholder="Notas generales (opcional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={enviarPedido}
                disabled={enviando}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
              >
                <Send size={14} />
                {enviando ? 'Enviando...' : 'Crear pedido en borrador'}
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: Pedidos activos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Pedidos activos</h2>
            <button
              onClick={cargarPedidos}
              className="text-xs text-gray-500 hover:text-orange-500 transition"
            >
              Actualizar
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p>No hay pedidos activos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pedidos.map((pedido) => {
                const estado = ESTADO_CONFIG[pedido.estadoActual];
                const esListo = pedido.estadoActual === 'LISTO';
                const esBorrador = pedido.estadoActual === 'BORRADOR';
                return (
                  <div
                    key={pedido.id}
                    className={`bg-white rounded-2xl border ${esListo ? 'border-green-400 shadow-md shadow-green-100' : 'border-gray-200'} p-4`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900">#{pedido.id}</span>
                        <p className="text-xs text-gray-500">{pedido.mesa || pedido.tipoConsumo}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                        {estado.icon}
                        {estado.label}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {pedido.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.cantidad}x {item.nombreProducto}</span>
                          <span className="text-gray-500">S/ {item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-900">S/ {pedido.total.toFixed(2)}</span>
                      <div className="flex gap-2">
                        {esBorrador && (
                          <button
                            onClick={() => handleConfirmar(pedido.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Enviar a cocina
                          </button>
                        )}
                        {esListo && (
                          <button
                            onClick={() => handleEntregar(pedido.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            Entregar ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* R2-6: Modal de notificaciones LISTO */}
      {modalAbierto && (
        <NotificacionModal
          notificaciones={notificaciones}
          onEntregar={async (id) => {
            await handleEntregar(id);
          }}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
