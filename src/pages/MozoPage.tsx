import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Plus, Minus, Send, LogOut, Clock, 
  CheckCircle, ChefHat, Truck, X, Bell, Search, UtensilsCrossed, Loader2
} from 'lucide-react';
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
  RECIBIDO: { label: 'En cocina', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <ChefHat size={14} /> },
  EN_PREPARACION: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <ChefHat size={14} /> },
  LISTO: { label: '¡Listo!', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={14} /> },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={14} /> },
  PAGADO: { label: 'Pagado', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <CheckCircle size={14} /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-500 border-red-200', icon: <X size={14} /> },
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-green-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bell size={20} className="text-white" />
            </div>
            <h2 className="text-white font-bold text-lg">
              {pendientes.length > 0
                ? `${pendientes.length} pedido${pendientes.length > 1 ? 's' : ''} listo${pendientes.length > 1 ? 's' : ''}`
                : 'Historial'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-4 space-y-3">
          {notificaciones.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones recientes</p>
          )}
          {notificaciones.map((n) => (
            <div key={n.pedidoId} className={`bg-white border p-4 rounded-2xl shadow-sm flex items-center justify-between transition-opacity ${n.entregado ? 'opacity-50 border-gray-200' : 'border-green-200'}`}>
              <div>
                <p className="text-base font-bold text-gray-900">
                  Orden #{n.numeroOrden}
                </p>
                <p className="text-sm text-gray-600 font-medium mt-0.5">
                  {n.mesa || n.tipoConsumo}
                </p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={12}/>
                  {n.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  {n.entregado && <span className="ml-2 text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={12}/> Entregado</span>}
                </p>
              </div>
              {!n.entregado && (
                <button
                  onClick={() => onEntregar(n.pedidoId)}
                  className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-green-500/30"
                >
                  Entregar <CheckCircle size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PANTALLA PRINCIPAL ──────────────────────────────────────────────────────
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

  // Notificaciones SSE
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

    es.addEventListener('PEDIDO_LISTO', (e) => {
      const data = JSON.parse(e.data);
      agregarNotificacion(data);
    });

    es.addEventListener('AVISO_PEDIDO_LISTO', (e) => {
      const data = JSON.parse(e.data);
      agregarNotificacion(data);
    });

    es.addEventListener('EN_PREPARACION', () => cargarPedidos());
    es.onerror = () => es.close();

    return () => es.close();
  }, [cargarPedidos]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* ─── HEADER PRINCIPAL ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl">
            <UtensilsCrossed className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">La Ruta del Sabor</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Operador: {user?.nombre || user?.correo}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {notificaciones.length > 0 && (
            <button
              onClick={() => setModalAbierto(true)}
              className={`relative p-2.5 rounded-full transition-all ${
                alertando ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bell size={20} />
              {pendientesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {pendientesCount}
                </span>
              )}
            </button>
          )}
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Cerrar turno</span>
          </button>
        </div>
      </header>

      {/* ─── CONTENEDOR PRINCIPAL (2 COLUMNAS) ────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: CREACIÓN DE PEDIDOS Y CATÁLOGO */}
        <div className="w-[450px] bg-white border-r border-gray-200 flex flex-col shadow-lg z-0">
          
          {/* Opciones de Mesa/Llevar y Buscador */}
          <div className="p-5 border-b border-gray-100 space-y-4 bg-gray-50/50">
            <div className="flex bg-gray-200/60 p-1 rounded-xl">
              {(['MESA', 'PARA_LLEVAR', 'DELIVERY'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipoConsumo(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    tipoConsumo === t
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'MESA' ? 'Salón' : t === 'PARA_LLEVAR' ? 'Llevar' : 'Delivery'}
                </button>
              ))}
            </div>

            {tipoConsumo === 'MESA' && (
              <input
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Número o identificador de mesa..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
              />
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar platillo..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Catálogo de Productos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/30">
            {productosFiltrados.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                 <Search size={32} className="mb-2 opacity-30" />
                 <p className="text-sm font-medium">No hay coincidencias</p>
               </div>
            ) : (
              productosFiltrados.map((prod) => {
                const enCarrito = carrito.find((i) => i.productoId === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => agregarAlCarrito(prod)}
                    className="group flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-orange-700 transition-colors">{prod.nombre}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">S/ {prod.precioVenta.toFixed(2)}</p>
                    </div>
                    {enCarrito ? (
                      <span className="bg-orange-500 text-white text-sm font-extrabold w-8 h-8 flex items-center justify-center rounded-full shadow-sm">
                        {enCarrito.cantidad}
                      </span>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center transition-colors">
                        <Plus size={18} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Carrito de Compras (Borrador) */}
          {carrito.length > 0 && (
            <div className="border-t border-gray-200 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex flex-col max-h-[45vh]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-orange-600" />
                  <span className="text-sm font-bold text-orange-900">Comanda en Borrador</span>
                </div>
                <span className="text-xs font-bold bg-orange-200 text-orange-800 px-2 py-1 rounded-md">{carrito.length} ítems</span>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {carrito.map((item) => (
                  <div key={item.productoId} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                      <button onClick={() => cambiarCantidad(item.productoId, 1)} className="p-1 text-gray-500 hover:text-orange-600">
                        <Plus size={14} strokeWidth={3} />
                      </button>
                      <span className="text-xs font-bold text-gray-900 py-0.5">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.productoId, -1)} className="p-1 text-gray-500 hover:text-red-500">
                        <Minus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 leading-tight">{item.nombre}</p>
                      <p className="text-xs font-bold text-orange-600 mt-1">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-500">Total a cobrar</span>
                  <span className="text-2xl font-black text-gray-900">S/ {totalCarrito.toFixed(2)}</span>
                </div>
                <input
                  value={notasGenerales}
                  onChange={(e) => setNotasGenerales(e.target.value)}
                  placeholder="Notas generales de la orden (opcional)..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                />
                <button
                  onClick={enviarPedido}
                  disabled={enviando}
                  className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20"
                >
                  <Send size={16} />
                  {enviando ? 'Procesando orden...' : 'Confirmar Orden'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL DERECHO: PEDIDOS ACTIVOS */}
        <div className="flex-1 bg-gray-100/50 overflow-y-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Monitoreo de Mesas</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Gestiona los pedidos enviados a cocina.</p>
            </div>
            <button
              onClick={cargarPedidos}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              Actualizar vista
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">No hay órdenes en curso</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {pedidos.map((pedido) => {
                const estado = ESTADO_CONFIG[pedido.estadoActual] || ESTADO_CONFIG['BORRADOR'];
                const esListo = pedido.estadoActual === 'LISTO';
                const esBorrador = pedido.estadoActual === 'BORRADOR';

                return (
                  <div
                    key={pedido.id}
                    className={`bg-white rounded-3xl border flex flex-col overflow-hidden transition-all duration-300 ${
                      esListo 
                        ? 'border-green-300 shadow-[0_8px_30px_rgb(34,197,94,0.15)] ring-1 ring-green-100' 
                        : 'border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Header Tarjeta */}
                    <div className={`px-5 py-4 border-b ${esListo ? 'bg-green-50/50 border-green-100' : 'bg-gray-50/50 border-gray-100'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orden #{pedido.id}</p>
                          <h3 className="text-lg font-black text-gray-900 leading-tight">
                            {pedido.mesa || (pedido.tipoConsumo === 'PARA_LLEVAR' ? 'Para llevar' : 'Delivery')}
                          </h3>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estado.color}`}>
                          {estado.icon}
                          {estado.label}
                        </span>
                      </div>
                    </div>

                    {/* Body Tarjeta */}
                    <div className="flex-1 p-5 space-y-3">
                      {pedido.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                          <div className="flex gap-2">
                            <span className="font-bold text-gray-900">{item.cantidad}x</span>
                            <span className="font-medium text-gray-700">{item.nombreProducto}</span>
                          </div>
                          <span className="font-bold text-gray-500 whitespace-nowrap">S/ {item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Tarjeta */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total</span>
                        <span className="text-lg font-black text-gray-900">S/ {pedido.total.toFixed(2)}</span>
                      </div>
                      
                      {esBorrador && (
                        <button
                          onClick={() => handleConfirmar(pedido.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-sm"
                        >
                          Enviar a Cocina
                        </button>
                      )}
                      {esListo && (
                        <button
                          onClick={() => handleEntregar(pedido.id)}
                          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-sm font-bold py-3 rounded-xl transition-colors shadow-sm shadow-green-500/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} /> Entregar Pedido
                        </button>
                      )}
                      {!esBorrador && !esListo && (
                        <div className="w-full py-3 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin opacity-50" /> Esperando cocina...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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