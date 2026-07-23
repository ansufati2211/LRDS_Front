import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Minus, Send, LogOut, Clock, CheckCircle, ChefHat, 
  Truck, X, Bell, Search, UtensilsCrossed, Loader2, ArrowLeft, 
  Trash2, ShieldAlert, Moon, Sun, RefreshCw
} from 'lucide-react';
import { 
  getProductos, getCategorias, getPedidosActivos, crearPedido, 
  confirmarPedido, entregarPedido, agregarItems, cancelarItem, cancelarPedido 
} from '@/api/pedidos';
import { useAuthStore } from '@/store/authStore';
import type { Producto, Categoria, PedidoActivo, ItemPedidoLocal, EstadoPedido, EstadoItem, TipoConsumo } from '@/types';
import { formatearHoraPeru } from '@/lib/datetimePeru';
import { sileo } from 'sileo';

const THEMES = {
  light: {
    appBg: 'bg-gray-50', panelBg: 'bg-white', cardBg: 'bg-white', itemBg: 'bg-gray-50', 
    textMain: 'text-gray-900', textMainHover: 'hover:text-gray-900', textMuted: 'text-gray-500',
    border: 'border-gray-200', borderLight: 'border-gray-100',
    primaryBtn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold', secondaryBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    inputBg: 'bg-white focus:bg-gray-50 text-gray-900', ring: 'focus:ring-orange-400', iconBadge: 'bg-gray-900 text-white'
  },
  dark: {
    appBg: 'bg-[#050505]', panelBg: 'bg-[#0a0a0a]', cardBg: 'bg-[#0a0a0a]', itemBg: 'bg-[#141414]', 
    textMain: 'text-white', textMainHover: 'hover:text-white', textMuted: 'text-gray-400',
    border: 'border-gray-800/60', borderLight: 'border-gray-800/40',
    primaryBtn: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold', secondaryBtn: 'bg-[#141414] hover:bg-[#222] text-white border border-gray-800',
    inputBg: 'bg-[#0a0a0a] focus:bg-[#141414] text-white', ring: 'focus:ring-[#FFC640]/50', iconBadge: 'bg-white text-black'
  }
};
type ThemeKey = 'light' | 'dark';
type PasoFlujo = 'MESA' | 'MENU' | 'CARRITO';

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700', icon: <Clock size={14} /> },
  RECIBIDO: { label: 'En cocina', color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', icon: <ChefHat size={14} /> },
  EN_PREPARACION: { label: 'Preparando', color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800', icon: <ChefHat size={14} /> },
  LISTO: { label: '¡Listo!', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle size={14} /> },
  ENTREGADO: { label: 'Entregado', color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', icon: <Truck size={14} /> },
  PAGADO: { label: 'Pagado', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700', icon: <CheckCircle size={14} /> },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', icon: <X size={14} /> },
};

const puedeCancelarEntregado = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

function ModalConfirmacion({ isOpen, title, message, type, requireInput, inputPlaceholder, onConfirm, onCancel, loading }: any) {
  const [val, setVal] = useState('');
  useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-gray-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-900/10' : 'bg-amber-900/10'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            <ShieldAlert size={32} />
          </div>
          <h2 className={`font-black text-xl tracking-tight mb-2 ${type === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>{title}</h2>
          <p className="text-sm font-medium text-gray-400 leading-relaxed">{message}</p>
        </div>
        {requireInput && (
          <div className="px-6 pt-2 pb-6 bg-[#111]">
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={inputPlaceholder} className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-gray-800 rounded-xl focus:ring-2 focus:ring-[#FFC640]/50 text-white outline-none" />
          </div>
        )}
        <div className={`px-6 pb-6 flex gap-3 bg-[#111] ${!requireInput ? 'pt-6' : ''}`}>
          <button onClick={onCancel} disabled={loading} className="flex-1 px-5 py-3.5 border border-gray-800 text-gray-400 rounded-xl font-bold hover:bg-gray-800 hover:text-white active:scale-95 transition-colors">Volver</button>
          <button onClick={() => onConfirm(val)} disabled={loading} className={`flex-1 px-5 py-3.5 text-black rounded-xl font-bold active:scale-95 ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-[#FFC640] hover:bg-amber-400'} disabled:opacity-50 transition-colors`}>
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
      <div className="bg-[#111] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-gray-800">
        <div className="bg-[#0a0a0a] px-8 py-6 flex items-center justify-between border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${pendientes.length > 0 ? 'bg-emerald-500/20 animate-pulse' : 'bg-white/5'}`}>
              <Bell size={24} className={pendientes.length > 0 ? 'text-emerald-400' : 'text-gray-400'} />
            </div>
            <h2 className="text-white font-black text-xl tracking-tight">
              {pendientes.length > 0 ? `${pendientes.length} Listo(s) para Entregar` : 'Notificaciones'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full active:scale-95 transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar flex-1 bg-[#111]">
          {notificaciones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Bell size={48} className="text-gray-600 mb-4" />
              <p className="text-sm text-gray-500 font-bold text-center">No hay notificaciones recientes</p>
            </div>
          )}
          {notificaciones.map((n: any) => (
            <div key={n.pedidoId} className={`bg-[#0a0a0a] border p-5 rounded-2xl flex items-center justify-between transition-all ${n.entregado ? 'opacity-50 border-gray-800' : 'border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
              <div>
                <p className="text-lg font-black text-white tracking-tight">ORD-{n.numeroOrden?.toString().padStart(3,'0') || n.pedidoId}</p>
                <p className={`text-sm font-bold mt-0.5 ${n.entregado ? 'text-gray-500' : 'text-emerald-400'}`}>{n.mesa || n.tipoConsumo}</p>
                <p className="text-[11px] font-bold text-gray-500 uppercase mt-2 flex items-center gap-1.5"><Clock size={12}/> {formatearHoraPeru(n.timestamp)}</p>
              </div>
              {!n.entregado ? (
                <button onClick={() => onEntregar(n.pedidoId)} className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                  Entregar <CheckCircle size={18} />
                </button>
              ) : (
                <div className="bg-gray-900 border border-gray-800 text-gray-500 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2">
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

// 🔥 COMPONENTE CORREGIDO
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
                <h2 className={`${c.textMain} font-black text-xl`}>Adicionar - ORD-{pedido.id.toString().padStart(3,'0')}</h2>
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
                <button onClick={() => setCatFiltro('TODAS')} className={`px-5 py-2 rounded-full text-xs font-black transition-colors ${catFiltro === 'TODAS' ? c.primaryBtn : c.secondaryBtn}`}>Todas</button>
                {categorias.map((cat: any) => (
                  <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors ${catFiltro === cat.id ? c.primaryBtn : c.secondaryBtn}`}>{cat.nombre}</button>
                ))}
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar ${c.appBg} pb-24`}>
              {disponibles.map((prod: any) => {
                const enCarrito = carrito.find(i => i.productoId === prod.id);
                const ag = prod.estadoDisponibilidad !== 'DISPONIBLE';
                return (
                  <div key={prod.id} onClick={() => !ag && agregar(prod)} className={`${c.itemBg} p-4 rounded-2xl border ${c.border} flex justify-between items-center transition-colors ${ag ? 'opacity-50' : 'cursor-pointer active:scale-95 hover:border-gray-500/50'}`}>
                    <div>
                      <p className={`${c.textMain} font-black text-sm`}>{prod.nombre} {ag && <span className="text-[9px] bg-red-500/20 text-red-500 ml-2 px-2 py-0.5 rounded uppercase tracking-widest font-black">Agotado</span>}</p>
                      <p className={`${c.textMuted} font-bold text-xs mt-1`}>S/ {prod.precioVenta.toFixed(2)}</p>
                    </div>
                    {enCarrito ? (
                      <span className={`${c.iconBadge} w-9 h-9 flex items-center justify-center rounded-xl font-black shadow-inner`}>{enCarrito.cantidad}</span>
                    ) : !ag ? (
                      <div className={`${c.secondaryBtn} w-9 h-9 flex items-center justify-center rounded-xl transition-colors`}><Plus size={18}/></div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {carrito.length > 0 && (
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <button onClick={() => setVista('CARRITO')} className={`w-full ${c.primaryBtn} p-4 rounded-xl shadow-2xl flex items-center justify-between font-black text-sm active:scale-95 transition-transform`}>
                  <span>Ver Comanda ({carrito.length})</span>
                  <span>S/ {carrito.reduce((s, i) => s + i.precio * i.cantidad, 0).toFixed(2)}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col flex-1">
            <div className={`p-6 border-b ${c.border} flex items-center gap-4 shrink-0`}>
              <button onClick={() => setVista('MENU')} className={`${c.secondaryBtn} p-2 rounded-xl transition-colors`}><ArrowLeft size={18}/></button>
              <h2 className={`font-black text-lg ${c.textMain}`}>Comanda {pedido.mesa || pedido.tipoConsumo}</h2>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${c.appBg} custom-scrollbar`}>
              {carrito.map((i: any) => (
                <div key={i.productoId} className={`${c.itemBg} p-4 rounded-2xl border ${c.border} flex items-center gap-4 shadow-sm`}>
                  <div className={`flex flex-col items-center ${c.panelBg} rounded-xl p-1 border ${c.border}`}>
                    <button onClick={() => cambiarCantidad(i.productoId, 1)} className={`${c.textMuted} hover:text-[#FFC640] p-1 transition-colors`}><Plus size={16} strokeWidth={3}/></button>
                    <span className={`font-black ${c.textMain} py-1`}>{i.cantidad}</span>
                    <button onClick={() => cambiarCantidad(i.productoId, -1)} className={`${c.textMuted} hover:text-red-500 p-1 transition-colors`}><Minus size={16} strokeWidth={3}/></button>
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${c.textMain} leading-tight`}>{i.nombre}</p>
                    <p className={`font-black text-xs mt-1 ${c.textMuted}`}>S/ {(i.precio * i.cantidad).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-6 border-t ${c.border} ${c.panelBg}`}>
              <p className={`flex justify-between font-black text-2xl mb-4 ${c.textMain}`}><span>Total:</span><span>S/ {carrito.reduce((s, i) => s + i.precio * i.cantidad, 0).toFixed(2)}</span></p>
              
              <button onClick={handleEnviar} disabled={enviando} className={`w-full ${c.primaryBtn} py-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-md`}>
                {enviando ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} Confirmar Adición
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderMozo({ user, theme, changeTheme, vistaMovil, setVistaMovil, notificaciones, setModalAbierto, handleLogout }: any) {
  const count = notificaciones.filter((n: any) => !n.entregado).length;
  
  return (
    <header className={`border-b px-6 py-4 flex flex-col xl:flex-row items-center justify-between z-30 shrink-0 gap-4 ${theme === 'dark' ? 'bg-[#0a0a0a] border-gray-800/60' : 'bg-white border-gray-200'}`}>
      
      {/* Lado Izquierdo: Branding Limpio */}
      <div className="flex items-center gap-3 w-full xl:w-auto text-center xl:text-left">
        <div className="bg-[#FFC640] p-2.5 rounded-[12px] shadow-inner">
          <UtensilsCrossed className="text-black w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="hidden sm:block">
          <h1 className={`text-xl font-black leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>La Ruta del Sabor</h1>
          <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Salón / Punto de Venta</p>
        </div>
      </div>
      
      {/* Centro: Controles Móviles */}
      <div className={`md:hidden flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-[#141414] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
        <button onClick={() => setVistaMovil('NUEVA_ORDEN')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${vistaMovil === 'NUEVA_ORDEN' ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-white text-black shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}>Menú</button>
        <button onClick={() => setVistaMovil('MESAS')} className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${vistaMovil === 'MESAS' ? (theme === 'dark' ? 'bg-white text-black shadow-sm' : 'bg-white text-black shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}>Salón</button>
      </div>

      {/* Lado Derecho: Controles y Perfil */}
      <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-end shrink-0">
        
        {/* Toggle Tema */}
        <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2.5 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-[#141414] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-500 border-gray-200 hover:text-black'}`}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notificaciones */}
        <button onClick={() => setModalAbierto(true)} className={`relative p-2.5 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-[#141414] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-500 border-gray-200 hover:text-black'}`}>
          <Bell size={18} />
          {count > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-black animate-pulse">{count}</span>}
        </button>

        <div className={`hidden sm:block h-8 w-px mx-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

        {/* Perfil */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <p className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Mozo'}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{user?.rol || 'Rol Mozo'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFC640] flex items-center justify-center text-black font-black text-lg shadow-inner">
            {(user?.nombre || user?.correo || 'M').charAt(0).toUpperCase()}
          </div>
        </div>

        <div className={`w-px h-8 mx-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        
        {/* Logout */}
        <button onClick={handleLogout} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'}`} title="Cerrar Sesión">
          <LogOut size={20} />
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
                    <button key={m} onClick={() => seleccionarMesa(m)} className={`h-20 rounded-2xl text-sm font-black flex items-center justify-center border transition-all ${ocupada ? 'bg-red-500/10 border-red-500/30 text-red-500 cursor-not-allowed' : `${c.itemBg} ${c.textMain} ${c.border} hover:border-gray-500 active:scale-95`}`}>
                      {m.replace('Mesa ', '')}
                    </button>
                  );
                })}
                <button onClick={() => setModoMesaCustom(true)} className={`h-20 rounded-2xl text-[10px] uppercase tracking-widest font-black ${c.secondaryBtn} border ${c.border}`}>Otra</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setModoMesaCustom(false)} className={`${c.secondaryBtn} p-2 rounded-xl transition-colors`} title="Volver a lista de mesas">
                    <ArrowLeft size={18} />
                  </button>
                  <h4 className={`font-black text-sm ${c.textMain}`}>Mesa Personalizada</h4>
                </div>
                <input autoFocus value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej. Barra 1" className={`p-4 rounded-xl text-sm font-bold outline-none border ${c.border} ${c.inputBg} ${c.ring}`} />
                <button onClick={() => seleccionarMesa(mesa || 'Barra')} className={`w-full ${c.primaryBtn} font-black py-4 rounded-xl text-sm active:scale-95 transition-all shadow-md`}>Continuar</button>
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
              <button onClick={() => setCatFiltro('TODAS')} className={`px-5 py-2 rounded-full text-xs font-black transition-colors ${catFiltro === 'TODAS' ? c.primaryBtn : c.secondaryBtn}`}>Todas</button>
              {categorias.map((cat: any) => (
                <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-colors ${catFiltro === cat.id ? c.primaryBtn : c.secondaryBtn}`}>{cat.nombre}</button>
              ))}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 space-y-2 pb-24 ${c.appBg} custom-scrollbar`}>
            {filtrados.length === 0 && <p className={`text-center py-10 font-bold ${c.textMuted}`}>No se encontraron productos.</p>}
            {filtrados.map((prod: any) => {
              const enCar = carrito.find((i: any) => i.productoId === prod.id);
              const ag = prod.estadoDisponibilidad !== 'DISPONIBLE';
              return (
                <div key={prod.id} onClick={() => !ag && agregar(prod)} className={`${c.cardBg} border ${c.border} p-4 rounded-2xl flex justify-between items-center transition-colors ${ag ? 'opacity-50' : 'cursor-pointer active:scale-95 hover:border-gray-500/50'}`}>
                  <div>
                    <p className={`font-black text-sm ${c.textMain}`}>{prod.nombre} {ag && <span className="text-[9px] bg-red-500/20 text-red-500 ml-2 px-2 py-0.5 rounded uppercase tracking-widest font-black">Agotado</span>}</p>
                    <p className={`text-xs font-bold mt-1 ${c.textMuted}`}>S/ {prod.precioVenta.toFixed(2)}</p>
                  </div>
                  {!ag && enCar ? (
                    <span className={`${c.iconBadge} w-9 h-9 flex items-center justify-center rounded-xl font-black shadow-inner`}>{enCar.cantidad}</span>
                  ) : !ag ? (
                    <div className={`${c.secondaryBtn} w-9 h-9 flex items-center justify-center rounded-xl transition-colors`}><Plus size={18}/></div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {carrito.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <button onClick={() => setPaso('CARRITO')} className={`w-full ${c.primaryBtn} p-4 rounded-xl shadow-2xl flex items-center justify-between font-black text-sm active:scale-95 transition-transform`}>
                <span>Ver Comanda ({carrito.length})</span>
                <span>S/ {total.toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {paso === 'CARRITO' && (
        <div className="flex flex-col flex-1">
          <div className={`p-6 border-b ${c.border} flex items-center gap-4 shrink-0`}>
            <button onClick={() => setPaso('MENU')} className={`${c.secondaryBtn} p-2 rounded-xl transition-colors`}><ArrowLeft size={18}/></button>
            <h2 className={`font-black text-lg ${c.textMain}`}>Comanda {mesa}</h2>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${c.appBg} custom-scrollbar`}>
            {carrito.map((i: any) => (
              <div key={i.productoId} className={`${c.itemBg} p-4 rounded-2xl border ${c.border} flex items-center gap-4 shadow-sm`}>
                <div className={`flex flex-col items-center ${c.panelBg} rounded-xl p-1 border ${c.border}`}>
                  <button onClick={() => cambiarCantidad(i.productoId, 1)} className={`${c.textMuted} hover:text-[#FFC640] p-1 transition-colors`}><Plus size={16} strokeWidth={3}/></button>
                  <span className={`font-black ${c.textMain} py-1`}>{i.cantidad}</span>
                  <button onClick={() => cambiarCantidad(i.productoId, -1)} className={`${c.textMuted} hover:text-red-500 p-1 transition-colors`}><Minus size={16} strokeWidth={3}/></button>
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${c.textMain} leading-tight`}>{i.nombre}</p>
                  <p className={`font-black text-xs mt-1 ${c.textMuted}`}>S/ {(i.precio * i.cantidad).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`p-6 border-t ${c.border} ${c.panelBg}`}>
            <p className={`flex justify-between font-black text-2xl mb-4 ${c.textMain}`}><span>Total:</span><span>S/ {total.toFixed(2)}</span></p>
            <input 
              value={notasGenerales} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotasGenerales(e.target.value)} 
              placeholder="Notas generales de la orden (opcional)" 
              className={`w-full p-4 mb-4 rounded-xl border ${c.border} ${c.inputBg} ${c.ring} outline-none text-sm font-bold`} 
            />
            <button onClick={enviarPedido} disabled={enviando} className={`w-full ${c.primaryBtn} py-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 transition-all shadow-md`}>
              {enviando ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} Confirmar Orden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelMonitoreo({ theme, vistaMovil, pedidos, cargarPedidos, handleConfirmar, handleEntregar, handleCancelarPedido, handleCancelarItem, setPedidoAgregando, user }: any) {
  const c = THEMES[theme as ThemeKey];
  const isDark = theme === 'dark';
  
  return (
    <div className={`flex-1 ${c.appBg} flex-col overflow-hidden transition-colors ${vistaMovil === 'MESAS' ? 'flex' : 'hidden md:flex'}`}>
      <div className={`p-6 border-b ${c.border} flex justify-between items-center shrink-0`}>
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${c.textMain}`}>Monitoreo del Salón</h2>
        </div>
        <button onClick={cargarPedidos} className={`${c.secondaryBtn} px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors`}>
          <RefreshCw size={16} /> <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        {pedidos.length === 0 ? (
          <div className={`text-center flex flex-col items-center justify-center h-full ${c.textMuted}`}>
            <UtensilsCrossed size={60} className="mb-6 opacity-20" strokeWidth={1.5} />
            <h2 className="text-2xl font-black tracking-tight">Salón vacío</h2>
            <p className="font-medium mt-2">No hay pedidos activos en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 items-start pb-20">
            {pedidos.map((pedido: any) => {
              const est = ESTADO_CONFIG[pedido.estadoActual as EstadoPedido] || ESTADO_CONFIG['BORRADOR'];
              
              return (
                <div key={pedido.id} className={`${c.cardBg} rounded-[2rem] border ${c.border} flex flex-col overflow-hidden shadow-xl transition-all`}>
                  
                  {/* Cabecera del Ticket */}
                  <div className={`px-6 py-5 border-b ${c.border} flex justify-between items-start`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${c.textMuted}`}>
                        ORD-{pedido.id.toString().padStart(3,'0')}
                      </p>
                      <h3 className={`text-xl font-black leading-none ${c.textMain}`}>
                        {pedido.mesa || pedido.tipoConsumo}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* Etiqueta de Estado */}
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${est.color}`}>
                        {est.icon} {est.label}
                      </span>
                      
                      {/* Botón de Anular - Rediseñado para concordancia */}
                      {pedido.estadoActual !== 'CANCELADO' && pedido.estadoActual !== 'PAGADO' && pedido.estadoActual !== 'ENTREGADO' && (
                        <button 
                          onClick={() => handleCancelarPedido(pedido.id)} 
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40" 
                          title="Anular Orden"
                        >
                          <Trash2 size={14} strokeWidth={2.5} /> Anular
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Cuerpo del Ticket (Items) */}
                  <div className="flex-1 p-5 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.textMuted}`}>Items del Pedido</p>
                    {pedido.items.map((item: any) => {
                      const puedeCancelar = item.estadoItem !== 'CANCELADO' && pedido.estadoActual !== 'CANCELADO' && (item.estadoItem !== 'ENTREGADO' || puedeCancelarEntregado(user?.rol));
                      return (
                        <div key={item.detalleId} className={`flex justify-between items-start p-3 rounded-xl border ${c.border} ${isDark ? 'bg-[#141414]' : 'bg-gray-50'} ${item.estadoItem === 'CANCELADO' ? 'opacity-40 grayscale' : ''}`}>
                          <div className="flex gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white shadow-md'}`}>
                              {item.cantidad}x
                            </span>
                            <div>
                              <p className={`text-[15px] font-bold leading-tight ${item.estadoItem === 'CANCELADO' ? 'line-through text-gray-500' : c.textMain}`}>
                                {item.nombreProducto}
                              </p>
                              {item.notasPreparacion && (
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${c.textMuted}`}>
                                  📝 {item.notasPreparacion}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-sm font-black ${c.textMain}`}>S/ {item.subtotal.toFixed(2)}</span>
                            {puedeCancelar && (
                              <button onClick={() => handleCancelarItem(pedido.id, item.detalleId, item.estadoItem)} className={`p-1.5 rounded-lg ${isDark ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'} transition-colors`} title="Retirar plato">
                                <X size={14} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pie del Ticket (Totales y Botones) */}
                  <div className={`p-6 border-t ${c.border} ${c.appBg}`}>
                    <div className="flex justify-between items-end mb-5">
                      <span className={`text-xs font-black uppercase tracking-widest ${c.textMuted}`}>Total Final</span>
                      <span className={`text-2xl font-black leading-none ${c.textMain}`}>S/ {pedido.total.toFixed(2)}</span>
                    </div>
                    
                    {pedido.estadoActual === 'BORRADOR' && (
                      <button onClick={() => handleConfirmar(pedido.id)} className={`w-full ${c.primaryBtn} py-3.5 rounded-xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-md`}>
                        <ChefHat size={18}/> Enviar a Cocina
                      </button>
                    )}
                    
                    {pedido.estadoActual === 'LISTO' && (
                      <button onClick={() => handleEntregar(pedido.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-sm flex justify-center items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/30 animate-pulse">
                        <CheckCircle size={18}/> Entregar a Mesa
                      </button>
                    )}
                    
                    {(pedido.estadoActual === 'RECIBIDO' || pedido.estadoActual === 'EN_PREPARACION') && (
                      <div className={`w-full border ${c.border} ${isDark ? 'bg-orange-900/20 text-orange-500 border-orange-900/50' : 'bg-orange-50 text-orange-600 border-orange-200'} py-3 rounded-xl text-xs font-black uppercase tracking-widest flex justify-center items-center gap-2`}>
                        <Loader2 size={16} className="animate-spin"/> Cocinando...
                      </div>
                    )}
                    
                    {pedido.estadoActual !== 'BORRADOR' && pedido.estadoActual !== 'CANCELADO' && pedido.estadoActual !== 'PAGADO' && (
                      <button onClick={() => setPedidoAgregando(pedido)} className={`w-full mt-3 ${c.secondaryBtn} py-3 rounded-xl font-black text-xs flex justify-center items-center gap-2 active:scale-95 transition-transform`}>
                        <Plus size={16} strokeWidth={3}/> Adicionar Ítems
                      </button>
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

  const [confirmDialog, setConfirmDialog] = useState<any>({ isOpen: false });
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const reproducirSonido = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.8;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
       const data = await getPedidosActivos();
       setPedidos(data);
       setNotificaciones(prev => {
         let nuevas = [...prev];
         let hayNuevas = false;
         data.forEach(p => {
           if (p.estadoActual === 'LISTO' && !nuevas.some(n => n.pedidoId === p.id)) {
             hayNuevas = true;
             nuevas.unshift({
               pedidoId: p.id,
               numeroOrden: p.id,
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
      setProductos(prods.filter(p => p.estadoRegistro)); 
      setCategorias(cats.filter(c => c.estadoRegistro));
    });
    cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const es = new EventSource(`http://localhost:8080/api/kds/eventos?token=${token}`);
    
    const agg = (data: any) => {
      setNotificaciones(prev => {
        if (prev.some(n => n.pedidoId === data.pedidoId)) return prev;
        reproducirSonido();
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
    try { await confirmarPedido(id); sileo.success({ title: 'Enviado a cocina.' }); await cargarPedidos(); } 
    catch (err: any) { sileo.error({ title: 'Error', description: err.response?.data?.message || err.message }); }
  };

  const handleEntregar = async (id: number) => {
    try { 
       await entregarPedido(id);
       setNotificaciones(p => p.map(n => n.pedidoId === id ? { ...n, entregado: true } : n));
       await cargarPedidos(); 
     } catch(err: any) { 
       sileo.error({ title: 'No se puede entregar', description: err.response?.data?.message || err.message }); 
    }
  };

  const handleCancelarItem = (pId: number, dId: number, estado: EstadoItem) => {
    const req = estado === 'ENTREGADO';
    setConfirmDialog({
      isOpen: true, title: '¿Cancelar plato?', message: req ? 'Motivo (Merma/Error):' : 'Se retirará de la cuenta.', type: 'warning', requireInput: req, isProcessing: false,
      onConfirm: async (m?: string) => {
        if (req && (!m || !m.trim())) return sileo.error({ title: 'Motivo obligatorio' });
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try { await cancelarItem(pId, dId, m); sileo.success({ title: 'Item cancelado' }); await cargarPedidos(); } 
        catch (err: any) { sileo.error({ title: 'Error', description: err.message }); } 
        finally { setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  const handleCancelarPedido = (pId: number) => {
    setConfirmDialog({
      isOpen: true, title: '¿Anular orden completa?', message: 'Esta acción no se puede deshacer.', type: 'danger', requireInput: false, isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try { await cancelarPedido(pId); sileo.success({ title: 'Orden anulada' }); await cargarPedidos(); } 
        catch (err: any) { sileo.error({ title: 'Error', description: err.message }); } 
        finally { setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg} relative`}>
      <HeaderMozo user={user} theme={theme} changeTheme={changeTheme} vistaMovil={vistaMovil} setVistaMovil={setVistaMovil} notificaciones={notificaciones} setModalAbierto={setModalAbierto} handleLogout={() => { logout(); navigate('/login'); }} />
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <PanelNuevaOrden theme={theme} vistaMovil={vistaMovil} paso={paso} setPaso={setPaso} tipoConsumo={tipoConsumo} setTipoConsumo={setTipoConsumo} mesa={mesa} setMesa={setMesa} modoMesaCustom={modoMesaCustom} setModoMesaCustom={setModoMesaCustom} carrito={carrito} setCarrito={setCarrito} notasGenerales={notasGenerales} setNotasGenerales={setNotasGenerales} enviando={enviando} enviarPedido={enviarPedido} productos={productos} categorias={categorias} pedidos={pedidos} />
        <PanelMonitoreo theme={theme} vistaMovil={vistaMovil} pedidos={pedidos} cargarPedidos={cargarPedidos} handleConfirmar={handleConfirmar} handleEntregar={handleEntregar} handleCancelarPedido={handleCancelarPedido} handleCancelarItem={handleCancelarItem} setPedidoAgregando={setPedidoAgregando} user={user} />
      </div>

      {modalAbierto && <NotificacionModal notificaciones={notificaciones} onEntregar={handleEntregar} onClose={() => setModalAbierto(false)} />}
      {pedidoAgregando && <ModalAgregarItems theme={theme} pedido={pedidoAgregando} productos={productos} categorias={categorias} onClose={() => setPedidoAgregando(null)} onAgregado={cargarPedidos} />}
      <ModalConfirmacion {...confirmDialog} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
    </div>
  );
}