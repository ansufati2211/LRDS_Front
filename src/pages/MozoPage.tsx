import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Minus, Send, LogOut, Clock, CheckCircle, ChefHat, 
  Truck, X, Bell, Search, UtensilsCrossed, Loader2, ArrowLeft, 
  Trash2, ShieldAlert, Moon, Sun 
} from 'lucide-react';
import { 
  getProductos, getCategorias, getPedidosActivos, crearPedido, 
  confirmarPedido, entregarPedido, agregarItems, cancelarItem, cancelarPedido 
} from '@/api/pedidos';
import { useAuthStore } from '@/store/authStore';
import type { Producto, Categoria, PedidoActivo, ItemPedidoLocal, EstadoPedido, EstadoItem } from '@/types';
import { formatearHoraPeru } from '@/lib/datetimePeru';
import { sileo } from 'sileo';

// ============================================================================
// 1. CONFIGURACIÓN DEL MODO CLARO / OSCURO
// ============================================================================
const THEMES = {
  light: {
    appBg: 'bg-gray-50', panelBg: 'bg-white', cardBg: 'bg-white', itemBg: 'bg-gray-50', 
    textMain: 'text-gray-900', textMainHover: 'hover:text-gray-900', textMuted: 'text-gray-500',
    border: 'border-gray-200', borderLight: 'border-gray-100',
    primaryBtn: 'bg-gray-900 hover:bg-black text-white', secondaryBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    inputBg: 'bg-white focus:bg-gray-50 text-gray-900', ring: 'focus:ring-gray-900', iconBadge: 'bg-gray-900 text-white'
  },
  dark: {
    appBg: 'bg-[#0f172a]', panelBg: 'bg-[#1e293b]', cardBg: 'bg-[#1e293b]', itemBg: 'bg-[#0f172a]', 
    textMain: 'text-white', textMainHover: 'hover:text-white', textMuted: 'text-gray-400',
    border: 'border-gray-700', borderLight: 'border-gray-800',
    primaryBtn: 'bg-white hover:bg-gray-200 text-black', secondaryBtn: 'bg-[#334155] hover:bg-[#475569] text-white',
    inputBg: 'bg-[#0f172a] focus:bg-[#334155] text-white', ring: 'focus:ring-white', iconBadge: 'bg-white text-black'
  }
};

type ThemeKey = 'light' | 'dark';
type PasoFlujo = 'MESA' | 'MENU' | 'CARRITO';
type TipoConsumo = 'MESA' | 'PARA_LLEVAR' | 'DELIVERY';

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-200 text-gray-800 border-gray-300', icon: <Clock size={14} /> },
  RECIBIDO: { label: 'En cocina', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <ChefHat size={14} /> },
  EN_PREPARACION: { label: 'Preparando', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <ChefHat size={14} /> },
  LISTO: { label: '¡Listo!', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle size={14} /> },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <Truck size={14} /> },
  PAGADO: { label: 'Pagado', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <CheckCircle size={14} /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300', icon: <X size={14} /> },
};

const puedeCancelarEntregado = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

interface NotificacionListo {
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  timestamp: Date;
  entregado: boolean;
}

// ============================================================================
// 2. COMPONENTES MODALES
// ============================================================================
function ModalConfirmacion({ isOpen, title, message, type, requireInput, inputPlaceholder, onConfirm, onCancel, loading }: any) {
  const [val, setVal] = useState('');
  useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-100 text-red-500 shadow-inner' : 'bg-amber-100 text-amber-500 shadow-inner'}`}>
            <ShieldAlert size={32} />
          </div>
          <h2 className={`font-black text-xl tracking-tight mb-2 ${type === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{title}</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">{message}</p>
        </div>
        {requireInput && (
          <div className="px-6 pt-2 pb-6 bg-white">
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={inputPlaceholder} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 text-gray-900 outline-none" />
          </div>
        )}
        <div className={`px-6 pb-6 flex gap-3 bg-white ${!requireInput ? 'pt-6' : ''}`}>
          <button onClick={onCancel} disabled={loading} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 active:scale-95">Volver</button>
          <button onClick={() => onConfirm(val)} disabled={loading} className={`flex-1 px-5 py-3.5 text-white rounded-xl font-bold active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'} disabled:opacity-50`}>
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificacionModal({ notificaciones, onEntregar, onClose }: any) {
  const pendientes = notificaciones.filter((n: any) => !n.entregado);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-gray-700">
        <div className="bg-gray-900 px-8 py-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${pendientes.length > 0 ? 'bg-emerald-500/20 animate-pulse' : 'bg-white/10'}`}>
              <Bell size={24} className={pendientes.length > 0 ? 'text-emerald-400' : 'text-gray-400'} />
            </div>
            <h2 className="text-white font-black text-xl tracking-tight">
              {pendientes.length > 0 ? `${pendientes.length} Listo(s) para Entregar` : 'Notificaciones'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full active:scale-95"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar flex-1 bg-[#0f172a]">
          {notificaciones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Bell size={48} className="text-gray-500 mb-4" />
              <p className="text-sm text-gray-500 font-bold text-center">No hay notificaciones recientes</p>
            </div>
          )}
          {notificaciones.map((n: any) => (
            <div key={n.pedidoId} className={`bg-[#1e293b] border p-5 rounded-2xl flex items-center justify-between transition-all ${n.entregado ? 'opacity-50 border-gray-700' : 'border-emerald-500 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}>
              <div>
                <p className="text-lg font-black text-white tracking-tight">Orden #{n.numeroOrden || n.pedidoId}</p>
                <p className={`text-sm font-bold mt-0.5 ${n.entregado ? 'text-gray-500' : 'text-emerald-400'}`}>{n.mesa || n.tipoConsumo}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase mt-2 flex items-center gap-1.5"><Clock size={12}/> {formatearHoraPeru(n.timestamp)}</p>
              </div>
              {!n.entregado ? (
                <button onClick={() => onEntregar(n.pedidoId)} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  Entregar <CheckCircle size={18} />
                </button>
              ) : (
                <div className="bg-gray-800 text-gray-500 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} /> Entregado
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalAgregarItems({ theme, pedido, productos, categorias, onClose, onAgregado }: any) {
  const c = THEMES[theme as ThemeKey];
  const [carrito, setCarrito] = useState<ItemPedidoLocal[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [catFiltro, setCatFiltro] = useState<number | 'TODAS'>('TODAS');
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState<'MENU' | 'CARRITO'>('MENU');

  const disponibles = productos.filter((p: any) => {
    const prodCatId = p.categoria?.id || p.categoriaId;
    const matchCat = catFiltro === 'TODAS' ? true : prodCatId === catFiltro;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return p.estadoDisponibilidad === 'DISPONIBLE' && matchCat && matchBusqueda;
  });

  const agregar = (prod: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.productoId === prod.id);
      if (existe) return prev.map(i => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito(prev => {
      const nuevo = prev.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i).filter(i => i.cantidad > 0);
      if (nuevo.length === 0) setVista('MENU');
      return nuevo;
    });
  };

  const handleEnviar = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      await agregarItems(pedido.id, carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, notasPreparacion: i.notas })));
      await onAgregado();
      sileo.success({ title: 'Ítems enviados a cocina' });
      onClose();
    } catch (err: any) {
      sileo.error({ title: 'Error al agregar', description: err.response?.data?.message || err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className={`${c.panelBg} rounded-[2rem] shadow-2xl w-full max-w-lg h-[90vh] flex flex-col border ${c.border}`}>
        {vista === 'MENU' ? (
          <>
            <div className={`p-6 border-b ${c.border} flex justify-between items-center shrink-0`}>
              <div>
                <h2 className={`${c.textMain} font-black text-xl`}>Adicionar - #{pedido.id}</h2>
                <p className={`${c.textMuted} text-sm font-bold`}>{pedido.mesa || pedido.tipoConsumo}</p>
              </div>
              <button onClick={onClose} className={`${c.textMuted} hover:${c.textMain}`}><X size={24} /></button>
            </div>
            
            <div className={`p-4 border-b ${c.border} shrink-0`}>
              <div className="relative mb-3">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={18} />
                <input 
                  value={busqueda} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)} 
                  placeholder="Buscar platillo..." 
                  className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-bold outline-none border ${c.border} ${c.inputBg} ${c.ring}`} 
                />
              </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button onClick={() => setCatFiltro('TODAS')} className={`px-5 py-2 rounded-full text-xs font-black ${catFiltro === 'TODAS' ? c.primaryBtn : c.secondaryBtn}`}>Todas</button>
                {categorias.map((cat: any) => (
                  <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap ${catFiltro === cat.id ? c.primaryBtn : c.secondaryBtn}`}>{cat.nombre}</button>
                ))}
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar ${c.appBg} pb-24`}>
              {disponibles.map((prod: any) => {
                const enCarrito = carrito.find(i => i.productoId === prod.id);
                return (
                  <div key={prod.id} onClick={() => agregar(prod)} className={`${c.itemBg} p-4 rounded-xl border ${c.border} flex justify-between items-center cursor-pointer active:scale-95`}>
                    <div>
                      <p className={`${c.textMain} font-black text-sm`}>{prod.nombre}</p>
                      <p className={`${c.textMuted} font-bold text-xs mt-1`}>S/ {prod.precioVenta.toFixed(2)}</p>
                    </div>
                    {enCarrito ? (
                      <span className={`${c.iconBadge} w-8 h-8 flex items-center justify-center rounded-lg font-black`}>{enCarrito.cantidad}</span>
                    ) : (
                      <div className={`${c.secondaryBtn} w-8 h-8 flex items-center justify-center rounded-lg`}><Plus size={18} /></div>
                    )}
                  </div>
                );
              })}
            </div>

            {carrito.length > 0 && (
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <button onClick={() => setVista('CARRITO')} className={`w-full ${c.primaryBtn} p-4 rounded-xl shadow-2xl flex items-center justify-between font-black text-sm`}>
                  <span>Ver Comanda ({carrito.length})</span>
                  <span>S/ {carrito.reduce((s, i) => s + i.precio * i.cantidad, 0).toFixed(2)}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col flex-1">
            <div className={`p-6 border-b ${c.border} flex justify-between items-center shrink-0`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setVista('MENU')} className={c.secondaryBtn} style={{ padding: '8px', borderRadius: '10px' }}><ArrowLeft size={18} /></button>
                <h2 className={`${c.textMain} font-black text-lg`}>Comanda Adicional</h2>
              </div>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar ${c.appBg}`}>
              {carrito.map(item => (
                <div key={item.productoId} className={`${c.itemBg} p-4 rounded-xl border ${c.border} flex items-center gap-4`}>
                  <div className={`flex flex-col items-center ${c.appBg} rounded-lg p-1`}>
                    <button onClick={() => cambiarCantidad(item.productoId, 1)} className={`${c.textMuted} ${c.textMainHover} p-1`}><Plus size={16} strokeWidth={3} /></button>
                    <span className={`${c.textMain} font-black py-1`}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.productoId, -1)} className={`${c.textMuted} hover:text-red-500 p-1`}><Minus size={16} strokeWidth={3} /></button>
                  </div>
                  <div className="flex-1">
                    <p className={`${c.textMain} font-bold text-sm leading-tight`}>{item.nombre}</p>
                    <p className={`${c.textMuted} font-black text-xs mt-1`}>S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-6 border-t ${c.border}`}>
              <button onClick={handleEnviar} disabled={enviando} className={`w-full ${c.primaryBtn} py-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50`}>
                {enviando ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Confirmar Adición
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. COMPONENTES PRINCIPALES (BARRA, PANEL IZQUIERDO Y DERECHO)
// ============================================================================
function HeaderMozo({ user, theme, changeTheme, vistaMovil, setVistaMovil, notificaciones, setModalAbierto, handleLogout }: any) {
  const count = notificaciones.filter((n: any) => !n.entregado).length;

  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2.5 rounded-xl"><UtensilsCrossed className="text-black w-5 h-5" strokeWidth={2.5} /></div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-black text-white leading-none tracking-tight">La Ruta del Sabor</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Mozo: <span className="text-white">{user?.nombre || user?.correo || 'Usuario'}</span></p>
        </div>
      </div>
      
      <div className="md:hidden flex bg-gray-900 p-1 rounded-xl">
        <button onClick={() => setVistaMovil('NUEVA_ORDEN')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${vistaMovil === 'NUEVA_ORDEN' ? 'bg-white text-black' : 'text-gray-400'}`}>Menú</button>
        <button onClick={() => setVistaMovil('MESAS')} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg ${vistaMovil === 'MESAS' ? 'bg-white text-black' : 'text-gray-400'}`}>Salón</button>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title={theme === 'light' ? "Cambiar a Modo Oscuro" : "Cambiar a Modo Claro"}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button onClick={() => setModalAbierto(true)} className="relative p-2.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Ver Notificaciones">
          <Bell size={18} />
          {count > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-pulse">{count}</span>}
        </button>

        <div className="hidden sm:block h-8 w-px bg-gray-800 mx-1"></div>
        <button onClick={handleLogout} className="flex items-center gap-2 p-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all">
          <LogOut size={18} /> <span className="hidden sm:inline">Cerrar</span>
        </button>
      </div>
    </header>
  );
}

function PanelNuevaOrden({ theme, vistaMovil, paso, setPaso, tipoConsumo, setTipoConsumo, mesa, setMesa, modoMesaCustom, setModoMesaCustom, carrito, setCarrito, notasGenerales, setNotasGenerales, enviando, enviarPedido, productos, categorias, pedidos }: any) {
  const c = THEMES[theme as ThemeKey];
  const [busqueda, setBusqueda] = useState<string>('');
  const [catFiltro, setCatFiltro] = useState<number | 'TODAS'>('TODAS');

  const seleccionarMesa = (num: string) => {
    const ocupada = pedidos.some((p: any) => p.tipoConsumo === 'MESA' && p.mesa?.toLowerCase() === num.toLowerCase() && p.estadoActual !== 'CANCELADO' && p.estadoActual !== 'PAGADO');
    if (ocupada) return sileo.error({ title: 'Mesa Ocupada', description: 'Ya existe un pedido activo en esta mesa' });
    setMesa(num); setPaso('MENU');
  };

  const agregar = (prod: Producto) => {
    setCarrito((prev: any) => {
      const ex = prev.find((i: any) => i.productoId === prod.id);
      if (ex) return prev.map((i: any) => i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito((prev: any) => {
      const nuevo = prev.map((i: any) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i).filter((i: any) => i.cantidad > 0);
      if (nuevo.length === 0) setPaso('MENU');
      return nuevo;
    });
  };

  const total = carrito.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
  
  const filtrados = productos.filter((p: any) => {
    const prodCatId = p.categoria?.id || p.categoriaId;
    const matchCat = catFiltro === 'TODAS' ? true : prodCatId === catFiltro;
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusqueda;
  });

  return (
    <div className={`w-full md:w-[460px] xl:w-[500px] ${c.panelBg} flex flex-col z-10 border-r ${c.border} shrink-0 min-h-0 transition-colors ${vistaMovil === 'NUEVA_ORDEN' ? 'flex' : 'hidden md:flex'}`}>
      {paso !== 'CARRITO' && (
        <div className={`p-6 border-b ${c.border} shrink-0`}>
          <div className={`flex ${c.appBg} p-1.5 rounded-2xl border ${c.border}`}>
            {(['MESA', 'PARA_LLEVAR', 'DELIVERY'] as const).map((t) => (
              <button key={t} onClick={() => { setTipoConsumo(t); setMesa(''); setPaso(t === 'MESA' ? 'MESA' : 'MENU'); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${tipoConsumo === t ? c.primaryBtn : c.secondaryBtn}`}>
                {t === 'MESA' ? 'Salón' : t === 'PARA_LLEVAR' ? 'Llevar' : 'Delivery'}
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 'MESA' && (
        <div className="flex-1 flex flex-col">
          <h3 className={`px-8 pt-6 pb-4 text-sm font-black ${c.textMain}`}>Selecciona la Mesa</h3>
          <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
            {!modoMesaCustom ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 15 }, (_, i) => `Mesa ${i + 1}`).map((m) => {
                  const ocupada = pedidos.some((p: any) => p.tipoConsumo === 'MESA' && p.mesa?.toLowerCase() === m.toLowerCase() && p.estadoActual !== 'CANCELADO' && p.estadoActual !== 'PAGADO');
                  return (
                    <button key={m} onClick={() => seleccionarMesa(m)} className={`h-20 rounded-[1.25rem] text-sm font-black flex items-center justify-center border transition-all ${ocupada ? 'bg-red-500/10 border-red-500/30 text-red-500 cursor-not-allowed' : `${c.appBg} ${c.textMain} ${c.border} hover:border-gray-400 active:scale-95`}`}>
                      {m.replace('Mesa ', '')}
                    </button>
                  );
                })}
                <button onClick={() => setModoMesaCustom(true)} className={`h-20 rounded-[1.25rem] text-[10px] uppercase tracking-widest font-black ${c.secondaryBtn} border ${c.border}`}>Otra</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input autoFocus value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej. Barra 1" className={`p-4 rounded-xl text-sm font-bold outline-none border ${c.border} ${c.inputBg} ${c.ring}`} />
                <button onClick={() => seleccionarMesa(mesa || 'Barra')} className={`p-4 rounded-xl font-black text-sm ${c.primaryBtn}`}>Continuar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {paso === 'MENU' && (
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <div className={`p-4 border-b ${c.border} shrink-0 space-y-3`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-black ${c.textMain} text-sm`}>Orden: {tipoConsumo === 'MESA' ? mesa : tipoConsumo}</span>
              {tipoConsumo === 'MESA' && <button onClick={() => setPaso('MESA')} className={`text-[10px] font-bold uppercase ${c.textMuted} hover:${c.textMain}`}>Cambiar Mesa</button>}
            </div>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={18} />
              <input 
                value={busqueda} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)} 
                placeholder="Buscar platillo..." 
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-bold outline-none border ${c.border} ${c.inputBg} ${c.ring}`} 
              />
            </div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button onClick={() => setCatFiltro('TODAS')} className={`px-5 py-2 rounded-full text-xs font-black ${catFiltro === 'TODAS' ? c.primaryBtn : c.secondaryBtn}`}>Todas</button>
              {categorias.map((cat: any) => (
                <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap ${catFiltro === cat.id ? c.primaryBtn : c.secondaryBtn}`}>{cat.nombre}</button>
              ))}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-2 pb-24 ${c.appBg} custom-scrollbar`}>
            {filtrados.length === 0 && <p className={`text-center py-10 font-bold ${c.textMuted}`}>No se encontraron productos.</p>}
            {filtrados.map((prod: any) => {
              const enCar = carrito.find((i: any) => i.productoId === prod.id);
              const ag = prod.estadoDisponibilidad !== 'DISPONIBLE';
              return (
                <div key={prod.id} onClick={() => !ag && agregar(prod)} className={`${c.cardBg} border ${c.border} p-4 rounded-2xl flex justify-between items-center ${ag ? 'opacity-50' : 'cursor-pointer active:scale-95 hover:border-gray-400'}`}>
                  <div>
                    <p className={`font-black text-sm ${c.textMain}`}>{prod.nombre} {ag && <span className="text-[9px] bg-red-500/20 text-red-500 ml-2 px-2 py-0.5 rounded">Agotado</span>}</p>
                    <p className={`text-xs font-bold mt-1 ${c.textMuted}`}>S/ {prod.precioVenta.toFixed(2)}</p>
                  </div>
                  {!ag && enCar ? (
                    <span className={`${c.iconBadge} w-8 h-8 flex items-center justify-center rounded-lg font-black`}>{enCar.cantidad}</span>
                  ) : !ag ? (
                    <div className={`${c.secondaryBtn} w-8 h-8 flex items-center justify-center rounded-lg`}><Plus size={18}/></div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {carrito.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <button onClick={() => setPaso('CARRITO')} className={`w-full ${c.primaryBtn} p-4 rounded-xl shadow-2xl flex items-center justify-between font-black text-sm`}>
                <span>Ver Comanda ({carrito.length})</span>
                <span>S/ {total.toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {paso === 'CARRITO' && (
        <div className="flex flex-col flex-1">
          <div className={`p-6 border-b ${c.border} flex items-center gap-4`}>
            <button onClick={() => setPaso('MENU')} className={`${c.secondaryBtn} p-2 rounded-xl`}><ArrowLeft size={18}/></button>
            <h2 className={`font-black text-lg ${c.textMain}`}>Comanda {mesa}</h2>
          </div>
          <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${c.appBg} custom-scrollbar`}>
            {carrito.map((i: any) => (
              <div key={i.productoId} className={`${c.itemBg} p-4 rounded-xl border ${c.border} flex items-center gap-4`}>
                <div className={`flex flex-col items-center ${c.appBg} rounded-lg p-1`}>
                  <button onClick={() => cambiarCantidad(i.productoId, 1)} className={`${c.textMuted} ${c.textMainHover} p-1`}><Plus size={16}/></button>
                  <span className={`font-black ${c.textMain} py-1`}>{i.cantidad}</span>
                  <button onClick={() => cambiarCantidad(i.productoId, -1)} className={`${c.textMuted} hover:text-red-500 p-1`}><Minus size={16}/></button>
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${c.textMain}`}>{i.nombre}</p>
                  <p className={`font-black text-xs mt-1 ${c.textMuted}`}>S/ {(i.precio * i.cantidad).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={`p-6 border-t ${c.border}`}>
            <p className={`flex justify-between font-black text-2xl mb-4 ${c.textMain}`}><span>Total:</span><span>S/ {total.toFixed(2)}</span></p>
            <input 
              value={notasGenerales} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotasGenerales(e.target.value)} 
              placeholder="Notas (opcional)" 
              className={`w-full p-4 mb-4 rounded-xl border ${c.border} ${c.inputBg} ${c.ring} outline-none text-sm font-bold`} 
            />
            <button onClick={enviarPedido} disabled={enviando} className={`w-full ${c.primaryBtn} p-4 rounded-xl font-black flex justify-center gap-2 disabled:opacity-50`}>
              {enviando ? <Loader2 className="animate-spin" /> : <Send />} Confirmar Orden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelMonitoreo({ theme, vistaMovil, pedidos, cargarPedidos, handleConfirmar, handleEntregar, handleCancelarPedido, handleCancelarItem, setPedidoAgregando, user }: any) {
  const c = THEMES[theme as ThemeKey];

  return (
    <div className={`flex-1 ${c.appBg} flex-col overflow-hidden transition-colors ${vistaMovil === 'MESAS' ? 'flex' : 'hidden md:flex'}`}>
      <div className={`p-7.5 border-b ${c.border} flex justify-between items-center shrink-0`}>
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${c.textMain}`}>Monitoreo</h2>
        </div>
        <button onClick={cargarPedidos} className={`${c.secondaryBtn} px-4 py-2.5 rounded-xl font-bold text-sm flex gap-2 border ${c.border}`}>
          <Clock size={16} /> <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {pedidos.length === 0 ? (
          <div className={`text-center py-20 ${c.textMuted}`}><UtensilsCrossed size={40} className="mx-auto mb-4 opacity-30" /><p className="font-bold">Salón vacío</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {pedidos.map((pedido: any) => {
              const est = ESTADO_CONFIG[pedido.estadoActual as EstadoPedido] || ESTADO_CONFIG['BORRADOR'];
              return (
                <div key={pedido.id} className={`${c.cardBg} rounded-3xl border ${c.border} flex flex-col overflow-hidden shadow-sm`}>
                  <div className={`p-6 border-b ${c.border} flex justify-between items-start`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${c.textMuted}`}>#{pedido.id}</p>
                      <h3 className={`text-xl font-black ${c.textMain}`}>{pedido.mesa || pedido.tipoConsumo}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${est.color}`}>{est.icon} {est.label}</span>
                      {/* 🔥 AQUI PROTEGEMOS LA MESA: Ocultamos el tachito si ya se entregó */}
                      {pedido.estadoActual !== 'CANCELADO' && pedido.estadoActual !== 'PAGADO' && pedido.estadoActual !== 'ENTREGADO' && (
                        <button onClick={() => handleCancelarPedido(pedido.id)} className={`${c.textMuted} hover:text-red-500`}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                    {pedido.items.map((item: any) => {
                      const puedeCancelar = item.estadoItem !== 'CANCELADO' && pedido.estadoActual !== 'CANCELADO' && (item.estadoItem !== 'ENTREGADO' || puedeCancelarEntregado(user?.rol));
                      return (
                        <div key={item.detalleId} className={`flex justify-between items-start ${item.estadoItem === 'CANCELADO' ? 'opacity-40' : ''}`}>
                          <div className="flex gap-3">
                            <span className={`${c.appBg} ${c.textMain} w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black`}>{item.cantidad}x</span>
                            <div>
                              <p className={`text-sm font-bold ${item.estadoItem === 'CANCELADO' ? 'line-through' : ''} ${c.textMain}`}>{item.nombreProducto}</p>
                              {item.notasPreparacion && <p className={`text-[10px] font-bold uppercase mt-1 ${c.textMuted}`}>↳ {item.notasPreparacion}</p>}
                            </div>
                          </div>
                          <div className="flex gap-3 items-center">
                            <span className={`text-xs font-bold ${c.textMuted}`}>S/ {item.subtotal.toFixed(2)}</span>
                            {puedeCancelar && <button onClick={() => handleCancelarItem(pedido.id, item.detalleId, item.estadoItem)} className={`${c.textMuted} hover:text-red-500`}><X size={14}/></button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`p-6 border-t ${c.border} ${c.appBg}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black uppercase ${c.textMuted}`}>Total</span>
                      <span className={`text-xl font-black ${c.textMain}`}>S/ {pedido.total.toFixed(2)}</span>
                    </div>
                    {pedido.estadoActual === 'BORRADOR' && <button onClick={() => handleConfirmar(pedido.id)} className={`w-full ${c.primaryBtn} py-3 rounded-xl font-black text-sm flex justify-center gap-2`}><ChefHat size={18}/> A Cocina</button>}
                    {pedido.estadoActual === 'LISTO' && <button onClick={() => handleEntregar(pedido.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-sm flex justify-center gap-2"><CheckCircle size={18}/> Entregar</button>}
                    {(pedido.estadoActual === 'RECIBIDO' || pedido.estadoActual === 'EN_PREPARACION') && <div className={`w-full ${c.cardBg} border ${c.border} py-3 rounded-xl text-xs font-bold uppercase flex justify-center gap-2 ${c.textMuted}`}><Loader2 size={16} className="animate-spin"/> Cocinando</div>}
                    {pedido.estadoActual !== 'BORRADOR' && pedido.estadoActual !== 'CANCELADO' && pedido.estadoActual !== 'PAGADO' && (
                      <button onClick={() => setPedidoAgregando(pedido)} className={`w-full mt-2 ${c.secondaryBtn} border ${c.border} py-2.5 rounded-xl font-bold text-xs flex justify-center gap-2`}><Plus size={14}/> Adicionar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE CONTENEDOR PRINCIPAL: MOZO PAGE
// ============================================================================
export default function MozoPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('pos_theme_bw') as ThemeKey) || 'light');
  const changeTheme = (newTheme: ThemeKey) => { setTheme(newTheme); localStorage.setItem('pos_theme_bw', newTheme); };
  const c = THEMES[theme];

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [vistaMovil, setVistaMovil] = useState<'NUEVA_ORDEN' | 'MESAS'>('NUEVA_ORDEN'); 
  const [paso, setPaso] = useState<PasoFlujo>('MESA');
  const [tipoConsumo, setTipoConsumo] = useState<TipoConsumo>('MESA');
  const [mesa, setMesa] = useState('');
  const [modoMesaCustom, setModoMesaCustom] = useState(false);
  const [carrito, setCarrito] = useState<ItemPedidoLocal[]>([]);
  const [notasGenerales, setNotasGenerales] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);
  const [pedidoAgregando, setPedidoAgregando] = useState<PedidoActivo | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'danger' | 'warning'; requireInput: boolean; inputPlaceholder?: string; isProcessing: boolean; onConfirm: (val?: string) => void; }>({ isOpen: false, title: '', message: '', type: 'warning', requireInput: false, isProcessing: false, onConfirm: () => {} });

  const [notificaciones, setNotificaciones] = useState<NotificacionListo[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  // 🔔 SONIDO DE CAMPANITA AL RECIBIR PLATOS LISTOS
  const reproducirSonido = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => { /* Auto-play bloqueado, normal hasta hacer click */ });
      }
    } catch (e) {}
  }, []);

  const cargarPedidos = useCallback(async () => {
    try { 
      const data = await getPedidosActivos(); 
      setPedidos(data); 

      // 🔥 FALLBACK: Si falla el socket, verificamos si hay pedidos listos no notificados
      setNotificaciones(prev => {
        let nuevas = [...prev];
        let hayNuevas = false;
        data.forEach(p => {
          if (p.estadoActual === 'LISTO' && !nuevas.some(n => n.pedidoId === p.id)) {
            hayNuevas = true;
            nuevas.unshift({
              pedidoId: p.id,
              numeroOrden: p.id, // Fallback si falta
              mesa: p.mesa || p.tipoConsumo,
              tipoConsumo: p.tipoConsumo,
              timestamp: new Date(),
              entregado: false
            });
          }
        });
        if (hayNuevas) reproducirSonido();
        return nuevas;
      });

    } catch (error) { console.error("Error cargando pedidos:", error); }
  }, [reproducirSonido]);

  useEffect(() => {
    Promise.all([getProductos(), getCategorias()]).then(([prods, cats]) => {
      setProductos(prods.filter(p => p.estadoRegistro)); setCategorias(cats.filter(c => c.estadoRegistro));
    });
    cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const es = new EventSource(`http://localhost:8080/api/v1/kds/eventos?token=${token}`);
    const agg = (data: any) => {
      setNotificaciones(prev => {
        if (prev.some(n => n.pedidoId === data.pedidoId)) return prev;
        reproducirSonido(); // 🔥 SUENA LA CAMPANA
        return [{ ...data, timestamp: new Date(), entregado: false }, ...prev];
      });
      cargarPedidos();
    };
    es.addEventListener('PEDIDO_LISTO', e => agg(JSON.parse(e.data)));
    es.addEventListener('AVISO_PEDIDO_LISTO', e => agg(JSON.parse(e.data)));
    es.addEventListener('EN_PREPARACION', () => cargarPedidos());
    return () => es.close();
  }, [cargarPedidos, reproducirSonido]);

  const enviarPedido = async () => {
    setEnviando(true);
    try {
      await crearPedido({ tipoConsumo, mesa, notasGenerales, items: carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, notasPreparacion: i.notas })) });
      setCarrito([]); setMesa(''); setNotasGenerales(''); setModoMesaCustom(false); setPaso(tipoConsumo === 'MESA' ? 'MESA' : 'MENU');
      await cargarPedidos(); sileo.success({ title: 'Comanda creada.' });
    } catch (err: any) { sileo.error({ title: 'Error', description: err.response?.data?.message || err.message }); } 
    finally { setEnviando(false); }
  };

  const handleConfirmar = async (id: number) => {
    try { await confirmarPedido(id); sileo.success({ title: 'A cocina.' }); await cargarPedidos(); } 
    catch (err: any) { sileo.error({ title: 'Error', description: err.response?.data?.message || err.message }); }
  };

  // 🔥 Aquí se captura el error 400 detallado
  const handleEntregar = async (id: number) => {
    try { 
      await entregarPedido(id); 
      setNotificaciones(p => p.map(n => n.pedidoId === id ? { ...n, entregado: true } : n)); 
      await cargarPedidos(); 
    } catch(err: any) { 
      const mensajeBackend = err.response?.data?.message || err.response?.data?.detalles || err.message;
      sileo.error({ title: 'No se puede entregar', description: mensajeBackend }); 
      console.error("🔥 ERROR ENTREGAR:", err.response?.data || err);
    }
  };

  const handleCancelarItem = (pId: number, dId: number, estado: EstadoItem) => {
    const req = estado === 'ENTREGADO';
    setConfirmDialog({
      isOpen: true, title: '¿Cancelar plato?', message: req ? 'Motivo (Merma/Error):' : 'Se retirará de la cuenta.', type: 'warning', requireInput: req, isProcessing: false,
      onConfirm: async (m?: string) => {
        if (req && (!m || !m.trim())) return sileo.error({ title: 'Motivo obligatorio' });
        setConfirmDialog(p => ({ ...p, isProcessing: true }));
        try { await cancelarItem(pId, dId, m); sileo.success({ title: 'Cancelado' }); await cargarPedidos(); } 
        catch (err: any) { sileo.error({ title: 'Error', description: err.message }); } 
        finally { setConfirmDialog(p => ({ ...p, isOpen: false })); }
      }
    });
  };

  const handleCancelarPedido = (pId: number) => {
    setConfirmDialog({
      isOpen: true, title: '¿Anular orden?', message: 'Se cancelará todo.', type: 'danger', requireInput: false, isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isProcessing: true }));
        try { await cancelarPedido(pId); sileo.success({ title: 'Anulada' }); await cargarPedidos(); } 
        catch (err: any) { sileo.error({ title: 'Error', description: err.message }); } 
        finally { setConfirmDialog(p => ({ ...p, isOpen: false })); }
      }
    });
  };

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg}`}>
      <HeaderMozo user={user} theme={theme} changeTheme={changeTheme} vistaMovil={vistaMovil} setVistaMovil={setVistaMovil} notificaciones={notificaciones} setModalAbierto={setModalAbierto} handleLogout={() => { logout(); navigate('/login'); }} />
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <PanelNuevaOrden theme={theme} vistaMovil={vistaMovil} paso={paso} setPaso={setPaso} tipoConsumo={tipoConsumo} setTipoConsumo={setTipoConsumo} mesa={mesa} setMesa={setMesa} modoMesaCustom={modoMesaCustom} setModoMesaCustom={setModoMesaCustom} carrito={carrito} setCarrito={setCarrito} notasGenerales={notasGenerales} setNotasGenerales={setNotasGenerales} enviando={enviando} enviarPedido={enviarPedido} productos={productos} categorias={categorias} pedidos={pedidos} />
        <PanelMonitoreo theme={theme} vistaMovil={vistaMovil} pedidos={pedidos} cargarPedidos={cargarPedidos} handleConfirmar={handleConfirmar} handleEntregar={handleEntregar} handleCancelarPedido={handleCancelarPedido} handleCancelarItem={handleCancelarItem} setPedidoAgregando={setPedidoAgregando} user={user} />
      </div>
      {modalAbierto && <NotificacionModal notificaciones={notificaciones} onEntregar={handleEntregar} onClose={() => setModalAbierto(false)} />}
      {pedidoAgregando && <ModalAgregarItems theme={theme} pedido={pedidoAgregando} productos={productos} categorias={categorias} onClose={() => setPedidoAgregando(null)} onAgregado={cargarPedidos} />}
      <ModalConfirmacion {...confirmDialog} onCancel={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} />
    </div>
  );
}