import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 LogOut, AlertTriangle, 
 Search, Moon, Sun, UtensilsCrossed, 
  RefreshCcw, X, Ban, Undo2, Info, Filter, Clock
} from 'lucide-react';
import { 
  getPedidosCocina, marcarPreparando, marcarListo, deshacerPedido,
  getPorciones, marcarAgotadoTemporal, marcarAgotadoServicio, revertirDisponible,
  getRecetaProducto, type KdsPedido, type PorcionDisponible, type RecetaCocina 
} from '@/api/kds';
// 🔥 IMPORTAMOS LOS PEDIDOS GLOBALES PARA EL HISTORIAL
import { getPedidosActivos } from '@/api/pedidos';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

const THEMES = {
  light: {
    appBg: 'bg-gray-100', modalBg: 'bg-white', textMain: 'text-gray-900', textMuted: 'text-gray-500',
    border: 'border-gray-200', borderDark: 'border-gray-300', btnGhost: 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 shadow-sm',
    itemBg: 'bg-white border-gray-200', activeTab: 'bg-gray-900 text-white shadow-md'
  },
  dark: {
    appBg: 'bg-[#050505]', modalBg: 'bg-[#111111]', textMain: 'text-white', textMuted: 'text-gray-400',
    border: 'border-gray-800', borderDark: 'border-gray-700', btnGhost: 'bg-[#1a1a1a] hover:bg-[#222] text-white border-gray-800 shadow-sm',
    itemBg: 'bg-[#141414] border-gray-800', activeTab: 'bg-white text-black shadow-md shadow-white/10'
  }
};
type ThemeKey = 'light' | 'dark';

// ============================================================================
// MODALES (RECETAS Y 86)
// ============================================================================
function ModalReceta({ isOpen, onClose, productoId, nombreProducto, theme }: any) {
  const c = THEMES[theme as ThemeKey];
  const [receta, setReceta] = useState<RecetaCocina | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !productoId) return;
    setLoading(true);
    getRecetaProducto(productoId)
      .then(setReceta)
      .catch(() => setReceta(null))
      .finally(() => setLoading(false));
  }, [isOpen, productoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`${c.modalBg} border ${c.border} rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]`}>
        <div className={`px-6 py-5 border-b ${c.border} flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-xl"><Info className="text-blue-500 w-6 h-6" /></div>
            <h2 className={`${c.textMain} font-black text-xl`}>Ficha Técnica</h2>
          </div>
          <button onClick={onClose} className={`${c.btnGhost} p-2 rounded-xl active:scale-95`}><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <h3 className={`${c.textMain} text-2xl font-black mb-4`}>{nombreProducto}</h3>
          
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCcw className="animate-spin text-gray-500" /></div>
          ) : receta ? (
            <div className="space-y-6">
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-2`}>Ingredientes Estándar</p>
                <div className="space-y-2">
                  {receta.ingredientes.map((ing, i) => (
                    <div key={i} className={`flex justify-between p-3 rounded-xl border ${c.border} ${c.itemBg}`}>
                      <span className={`${c.textMain} font-bold`}>{ing.insumo}</span>
                      <span className={`${c.textMuted} font-black`}>{ing.cantidad} {ing.unidad}</span>
                    </div>
                  ))}
                </div>
              </div>
              {receta.instrucciones && (
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-2`}>Preparación</p>
                  <p className={`${c.textMain} text-sm leading-relaxed p-4 rounded-xl border ${c.border} ${c.itemBg}`}>
                    {receta.instrucciones}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertTriangle className="mx-auto text-amber-500 w-12 h-12 mb-3 opacity-50" />
              <p className={`${c.textMain} font-bold text-lg`}>Receta no vinculada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DisponibilidadModal({ isOpen, onClose, porciones, recargar, theme }: any) {
  const c = THEMES[theme as ThemeKey];
  const [procesando, setProcesando] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState(''); 

  if (!isOpen) return null;

  const filtrados = porciones.filter((p:any) => p.nombreProducto.toLowerCase().includes(busqueda.toLowerCase()));

  const handleAgotadoTemporal = async (id: number) => {
    setProcesando(id);
    try { await marcarAgotadoTemporal(id); sileo.success({ title: 'Agotado Temporal' }); recargar(); } 
    catch (e) { sileo.error({ title: 'Error' }); } finally { setProcesando(null); }
  };

  const handleAgotadoServicio = async (id: number) => {
    if(!window.confirm("86 DEFINITIVO:\nEl producto se bloqueará por el resto del día.\n¿Deseas continuar?")) return;
    setProcesando(id);
    try { await marcarAgotadoServicio(id); sileo.success({ title: '86 Definitivo aplicado' }); recargar(); } 
    catch (e) { sileo.error({ title: 'Error' }); } finally { setProcesando(null); }
  };

  const handleReactivar = async (id: number) => {
    setProcesando(id);
    try { await revertirDisponible(id); sileo.success({ title: 'Nuevamente Disponible' }); recargar(); } 
    catch (e) { sileo.error({ title: 'Error' }); } finally { setProcesando(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`${c.modalBg} border ${c.border} rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
        <div className={`px-6 py-5 border-b ${c.border} shrink-0`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-500 w-6 h-6" strokeWidth={2.5} />
              <h2 className={`${c.textMain} font-black text-xl leading-tight`}>Pizarra 86</h2>
            </div>
            <button onClick={onClose} className={`${c.btnGhost} p-2 rounded-xl active:scale-95`}><X size={20} /></button>
          </div>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={18} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-bold outline-none border ${c.border} bg-transparent ${c.textMain}`} />
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar`}>
          {filtrados.map((p:any) => {
            const isPausado = p.estadoDisponibilidad === 'AGOTADO_TEMPORAL';
            const isDefinitivo = p.estadoDisponibilidad === 'AGOTADO_SERVICIO';

            return (
              <div key={p.productoId} className={`${c.itemBg} p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm ${isPausado || isDefinitivo ? 'opacity-70 grayscale' : ''}`}>
                <div className="w-full">
                  <p className={`${c.textMain} font-black`}>{p.nombreProducto}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    {isPausado ? '🛑 PAUSADO' : isDefinitivo ? '🚫 86 DEFINITIVO' : `✅ Quedan ${p.porcionesDisponibles} porciones`}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {isPausado ? (
                    <button onClick={() => handleReactivar(p.productoId)} disabled={procesando === p.productoId} className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black active:scale-95 transition-all">
                      Restaurar
                    </button>
                  ) : isDefinitivo ? (
                    <span className="px-5 py-3 bg-gray-200 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-black cursor-not-allowed">
                      Bloqueado
                    </span>
                  ) : (
                    <>
                      <button onClick={() => handleAgotadoTemporal(p.productoId)} disabled={procesando === p.productoId} className="flex-1 sm:flex-none px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl text-xs font-bold active:scale-95 transition-transform">
                        Pausar
                      </button>
                      <button onClick={() => handleAgotadoServicio(p.productoId)} disabled={procesando === p.productoId} className="flex-1 sm:flex-none px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-xs font-bold flex gap-1 active:scale-95 transition-transform">
                        <Ban size={16}/> Definitivo
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: TICKET DE COCINA INDIVIDUAL (NUEVO DISEÑO KDS OSCURO)
// ============================================================================
function TicketPedido({ pedido, onPreparar, onListo, onVerReceta, procesando, theme }: { pedido: KdsPedido, onPreparar: (id: number) => void, onListo: (id: number) => void, onVerReceta: (id: number, nombre: string) => void, procesando: boolean, theme: ThemeKey }) {
  const isDark = theme === 'dark';
  const esPreparando = pedido.estadoPedido === 'EN_PREPARACION';
  const min = Math.max(0, Math.floor(pedido.minutosTranscurridos)); 
  
  // 🔥 FIX: Tipado estricto explícito para evitar error "config is possibly undefined"
  type EstadoTicket = 'NUEVO' | 'DEMORADO' | 'URGENTE' | 'EN_PROCESO';
  let state: EstadoTicket = 'NUEVO';
  
  if (esPreparando) state = 'EN_PROCESO';
  else if (min >= 20) state = 'URGENTE';
  else if (min >= 10) state = 'DEMORADO';

  // Configuración de colores basada en el estado usando Record para asegurar que no falle TS
  const configMap: Record<EstadoTicket, { colorBorder: string; colorText: string; badge: string; bgTime: string }> = {
    URGENTE: {
      colorBorder: 'border-red-600/80',
      colorText: 'text-red-500',
      badge: 'URGENTE',
      bgTime: 'bg-red-900/30'
    },
    DEMORADO: {
      colorBorder: 'border-amber-500/80',
      colorText: 'text-amber-500',
      badge: 'DEMORADO',
      bgTime: 'bg-amber-900/20'
    },
    EN_PROCESO: {
      colorBorder: 'border-orange-500/80',
      colorText: 'text-orange-500',
      badge: 'EN PROCESO',
      bgTime: 'bg-orange-900/20'
    },
    NUEVO: {
      colorBorder: 'border-[#FFC640]/70',
      colorText: 'text-[#FFC640]',
      badge: 'NUEVO',
      bgTime: 'bg-[#FFC640]/10'
    }
  };

  const config = configMap[state];

  // Acción del botón (Siempre Amarillo como en la imagen)
  const btnText = esPreparando ? '✓ Marcar Completado' : 'Empezar Preparación';
  const btnAction = esPreparando ? () => onListo(pedido.pedidoId) : () => onPreparar(pedido.pedidoId);

  return (
    <div className={`rounded-2xl border ${config.colorBorder} ${isDark ? 'bg-[#0a0a0a]' : 'bg-white shadow-xl'} p-5 flex flex-col relative transition-all duration-300`}>
      
      {/* Cabecera del Ticket */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className={`font-black text-xl leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ORD-{pedido.numeroOrden?.toString().padStart(3, '0') || pedido.pedidoId}
          </h3>
          <p className={`text-sm mt-1.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {pedido.mesa || pedido.tipoConsumo}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full border ${config.colorBorder} ${config.colorText} text-[10px] font-black tracking-wider uppercase`}>
          {config.badge}
        </span>
      </div>

      {/* Caja de Tiempo */}
      <div className={`w-full rounded-xl ${config.bgTime} p-3.5 flex items-center justify-between mb-5`}>
        <div className={`flex items-center gap-2.5 ${config.colorText}`}>
          <Clock size={18} strokeWidth={2.5} />
          <span className="font-bold text-base">{min} min</span>
        </div>
        {(state === 'URGENTE' || state === 'DEMORADO') && <AlertTriangle size={18} strokeWidth={2.5} className={config.colorText} />}
      </div>

      {/* Lista de Items */}
      <div className="flex-1 flex flex-col">
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Items del Pedido</p>
        <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 max-h-[180px] pr-1">
          {pedido.items.map((item) => (
            <div key={item.detalleId} className={`rounded-xl p-3.5 group relative ${isDark ? 'bg-[#141414]' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <p className={`font-bold text-[15px] ${item.estadoItem === 'CANCELADO' ? 'text-gray-500 line-through' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {item.cantidad}x {item.producto}
                </p>
                <button onClick={() => onVerReceta(item.productoId, item.producto)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition-opacity p-1" title="Ver Receta">
                  <Info size={18} strokeWidth={2.5} />
                </button>
              </div>
              {item.notasPreparacion && (
                <p className={`text-xs mt-1.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nota: {item.notasPreparacion}
                </p>
              )}
            </div>
          ))}
          {pedido.notasGenerales && (
            <div className={`p-3.5 rounded-xl mt-2 ${isDark ? 'bg-red-500/10' : 'bg-red-50 border border-red-100'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                General: {pedido.notasGenerales}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Acción (Siempre Amarillo como en la imagen) */}
      <button 
        onClick={btnAction} 
        disabled={procesando} 
        className="w-full mt-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50 text-[15px]"
      >
        {btnText}
      </button>

    </div>
  );
}

// ============================================================================
// PANTALLA PRINCIPAL DE COCINA (KDS)
// ============================================================================
export default function CocinaPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('kds_theme_bw') as ThemeKey) || 'dark');
  const c = THEMES[theme];
  const changeTheme = (newTheme: ThemeKey) => { setTheme(newTheme); localStorage.setItem('kds_theme_bw', newTheme); };

  const [pedidosActivos, setPedidosActivos] = useState<KdsPedido[]>([]);
  const [pedidosHistorial, setPedidosHistorial] = useState<KdsPedido[]>([]);
  const [porciones, setPorciones] = useState<PorcionDisponible[]>([]);
  
  const [modalAgotados, setModalAgotados] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<{ id: number, nombre: string } | null>(null);
  
  const [vista, setVista] = useState<'TICKETS' | 'CONSOLIDADA' | 'HISTORIAL'>('TICKETS');
  const [estacionFiltro, setEstacionFiltro] = useState<string>('TODAS');
  
  const [menuFiltroAbierto, setMenuFiltroAbierto] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const estaciones = useMemo(() => {
    const cats = new Set<string>();
    pedidosActivos.forEach(p => p.items.forEach(i => { if(i.categoriaNombre) cats.add(i.categoriaNombre); }));
    return Array.from(cats);
  }, [pedidosActivos]);

  const cargarDatos = useCallback(async () => {
    try {
      const [dataPedidos, dataPorciones, dataGlobales] = await Promise.all([ 
        getPedidosCocina(), 
        getPorciones(),
        getPedidosActivos()
      ]);
      
      const activos = dataPedidos
        .filter(p => p.estadoPedido === 'BORRADOR' || p.estadoPedido === 'RECIBIDO' || p.estadoPedido === 'EN_PREPARACION')
        .map(p => ({
          ...p,
          minutosTranscurridos: p.minutosTranscurridos < 0 ? 0 : p.minutosTranscurridos
        }));

      const terminadosKds: KdsPedido[] = dataGlobales
        .filter((p: any) => p.estadoActual === 'LISTO' || p.estadoActual === 'ENTREGADO')
        .map((p: any) => ({
            pedidoId: p.id,
            numeroOrden: p.numeroOrden || p.id,
            tipoConsumo: p.tipoConsumo,
            mesa: p.mesa || p.identificadorMesaReferencia || p.tipoConsumo,
            estadoPedido: p.estadoActual,
            notasGenerales: p.notasGenerales || '',
            horaIngreso: p.fechaCreacion,
            minutosTranscurridos: 0,
            items: p.items.map((i: any) => ({
                detalleId: i.detalleId,
                productoId: i.productoId,
                producto: i.nombreProducto,
                cantidad: i.cantidad,
                notasPreparacion: i.notasPreparacion || '',
                tiempoPreparacionMinutos: 0,
                estadoItem: i.estadoItem,
                numeroComanda: i.numeroComanda
            }))
        }));
      
      setPedidosActivos(activos);
      setPedidosHistorial(terminadosKds);
      setPorciones(dataPorciones);
    } catch (error) { console.error("Error cargando KDS:", error); }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPedidosActivos(prev => prev.map(p => ({
        ...p,
        minutosTranscurridos: p.minutosTranscurridos + (1 / 60)
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const conectarSSE = useCallback(() => {
    const token = useAuthStore.getState().token;
    const es = new EventSource(`http://localhost:8080/api/kds/eventos?token=${token}`);
    
    es.addEventListener('NUEVO_PEDIDO', () => cargarDatos());
    es.addEventListener('NUEVA_COMANDA', () => cargarDatos());
    es.addEventListener('PEDIDO_CANCELADO', () => cargarDatos());
    
    es.onerror = () => {
      es.close();
      setTimeout(conectarSSE, 5000);
    };
    return es;
  }, [cargarDatos]);
  
  useEffect(() => {
    const es = conectarSSE();
    return () => es.close();
  }, [conectarSSE]);

  const handlePreparar = async (pedidoId: number) => {
    setProcesandoId(pedidoId);
    try { await marcarPreparando(pedidoId); await cargarDatos(); } 
    catch (e: any) { sileo.error({ title: 'Error', description: e.message }); } finally { setProcesandoId(null); }
  };

  const handleListo = async (pedidoId: number) => {
    setProcesandoId(pedidoId);
    try { await marcarListo(pedidoId); sileo.success({ title: 'Aviso enviado al salón' }); await cargarDatos(); } 
    catch (e: any) { sileo.error({ title: 'Error', description: e.message }); } finally { setProcesandoId(null); }
  };

  const handleDeshacer = async (pedidoId: number) => {
    setProcesandoId(pedidoId);
    try { await deshacerPedido(pedidoId); sileo.success({ title: 'Pedido devuelto a cocina' }); setVista('TICKETS'); await cargarDatos(); } 
    catch (e: any) { sileo.error({ title: 'Error', description: e.message }); } finally { setProcesandoId(null); }
  };

 const pedidosFiltrados = useMemo(() => {
    if (estacionFiltro === 'TODAS') return pedidosActivos;
    
    return pedidosActivos
      .map(pedido => ({
        ...pedido,
        items: pedido.items.filter(item => item.categoriaNombre === estacionFiltro)
      }))
      .filter(pedido => pedido.items.length > 0);
      
  }, [pedidosActivos, estacionFiltro]);

  const consolidado = useMemo(() => {
    const mapa = new Map<string, { cantidad: number, preparacion: number }>();
    pedidosFiltrados.forEach(p => p.items.forEach(i => {
      if (i.estadoItem !== 'CANCELADO') { // Ya no hace falta re-filtrar la categoría aquí
        const actual = mapa.get(i.producto) || { cantidad: 0, preparacion: 0 };
        mapa.set(i.producto, { cantidad: actual.cantidad + i.cantidad, preparacion: i.tiempoPreparacionMinutos || 0 });
      }
    }));
    return Array.from(mapa.entries()).sort((a, b) => b[1].cantidad - a[1].cantidad);
  }, [pedidosFiltrados]);

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg}`}>
      
      {/* ========================================================================= */}
      {/* HEADER REDISEÑADO AL ESTILO DE LA IMAGEN */}
      {/* ========================================================================= */}
<header className={`border-b px-6 py-4 flex flex-col xl:flex-row items-center justify-between z-30 shrink-0 gap-4 ${theme === 'dark' ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Lado Izquierdo: Título y Subtítulo Limpios */}
        <div className="w-full xl:w-auto text-center xl:text-left">
          <h1 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Sistema de Cocina - KDS
          </h1>
          <p className={`text-sm mt-1 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Gestión en tiempo real de pedidos en cocina
          </p>
        </div>

        {/* Centro: Pestañas y Filtros */}
        {/* 🔥 FIX: Cambiamos overflow-x-auto por flex-wrap para que el menú desplegable NO se corte */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-center">
          <div className={`flex items-center p-1.5 rounded-xl border ${theme === 'dark' ? 'bg-[#141414] border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
            <button onClick={() => setVista('TICKETS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all whitespace-nowrap ${vista === 'TICKETS' ? (theme === 'dark' ? 'bg-white text-black shadow-md' : 'bg-white text-black shadow-sm') : 'text-gray-500 hover:text-gray-300'}`}>
               Tickets
            </button>
            <button onClick={() => setVista('CONSOLIDADA')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all whitespace-nowrap ${vista === 'CONSOLIDADA' ? (theme === 'dark' ? 'bg-white text-black shadow-md' : 'bg-white text-black shadow-sm') : 'text-gray-500 hover:text-gray-300'}`}>
               Consolidado
            </button>
            <button onClick={() => setVista('HISTORIAL')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all whitespace-nowrap ${vista === 'HISTORIAL' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-gray-500 hover:text-rose-400'}`}>
               Historial
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setMenuFiltroAbierto(!menuFiltroAbierto)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition-colors whitespace-nowrap ${theme === 'dark' ? 'bg-[#141414] text-gray-300 border-gray-800 hover:text-white' : 'bg-white text-gray-600 border-gray-200 hover:text-black'}`}
            >
              <Filter size={16} /> {estacionFiltro === 'TODAS' ? 'ÁREAS' : estacionFiltro}
            </button>
            
            {menuFiltroAbierto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuFiltroAbierto(false)}></div>
                <div className={`absolute right-0 xl:left-0 top-full mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in duration-200 ${theme === 'dark' ? 'bg-[#111] border-gray-800' : 'bg-white border-gray-200'}`}>
                  <button 
                    onClick={() => { setEstacionFiltro('TODAS'); setMenuFiltroAbierto(false); }} 
                    className={`w-full text-left px-3 py-3 text-sm font-bold rounded-lg active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                  >
                    TODAS LAS ÁREAS
                  </button>
                  {estaciones.map(e => (
                    <button 
                      key={e} 
                      onClick={() => { setEstacionFiltro(e); setMenuFiltroAbierto(false); }} 
                      className={`w-full text-left px-3 py-3 text-sm font-bold rounded-lg active:scale-95 ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}
                    >
                      {e.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setModalAgotados(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 font-bold text-xs transition-colors flex-shrink-0">
            <AlertTriangle size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Pizarra 86</span>
          </button>
          
          <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2.5 rounded-xl border flex-shrink-0 transition-colors ${theme === 'dark' ? 'bg-[#141414] text-gray-400 border-gray-800 hover:text-white' : 'bg-white text-gray-500 border-gray-200 hover:text-black'}`}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {/* Lado Derecho: Perfil de Usuario Movido Aquí */}
        <div className="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-end shrink-0">
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.nombre?.split(' ')[0] || user?.correo?.split('@')[0] || 'Cocinero'}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{user?.rol || 'Rol Cocina'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FFC640] flex items-center justify-center text-black font-black text-lg shadow-inner">
              {(user?.nombre || user?.correo || 'C').charAt(0).toUpperCase()}
            </div>
          </div>
          <div className={`w-px h-8 mx-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          <button onClick={() => { logout(); navigate('/login'); }} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'}`} title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>

      </header>

      {/* ÁREA DE TRABAJO */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
        
        {vista === 'TICKETS' && (
          pedidosFiltrados.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border ${theme === 'dark' ? 'bg-[#111111] border-gray-800' : 'bg-white border-gray-200'}`}>
                <UtensilsCrossed size={48} strokeWidth={1.5} className={theme === 'dark' ? 'text-gray-700' : 'text-gray-300'} />
              </div>
              <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Estación Libre</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 items-start pb-20">
              {pedidosFiltrados.map((pedido) => (
                <TicketPedido 
                  key={pedido.pedidoId} 
                  pedido={pedido} 
                  onPreparar={handlePreparar} 
                  onListo={handleListo}
                  onVerReceta={(id, nombre) => setRecetaSeleccionada({ id, nombre })}
                  procesando={procesandoId === pedido.pedidoId} 
                  theme={theme} 
                />
              ))}
            </div>
          )
        )}

        {vista === 'CONSOLIDADA' && (
          <div className="max-w-4xl mx-auto">
            <div className={`p-6 rounded-[2rem] border shadow-sm ${theme === 'dark' ? 'bg-[#111111] border-gray-800' : 'bg-white border-gray-200'}`}>
              <h2 className={`${c.textMain} text-2xl font-black mb-6`}>Resumen de Preparación {estacionFiltro !== 'TODAS' && `- ${estacionFiltro}`}</h2>
              {consolidado.length === 0 ? (
                <p className={`${c.textMuted} text-center py-10 font-bold`}>No hay ítems para preparar.</p>
              ) : (
                <div className="space-y-3">
                  {consolidado.map(([nombre, datos], idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FFC640] text-black rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-[#FFC640]/20">
                          {datos.cantidad}
                        </div>
                        <p className={`${c.textMain} font-black text-lg`}>{nombre}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {vista === 'HISTORIAL' && (
          <div className="max-w-5xl mx-auto">
            <h2 className={`${c.textMain} text-2xl font-black mb-6`}>Platos Terminados (Últimos)</h2>
            {pedidosHistorial.length === 0 ? (
              <p className={`${c.textMuted} text-center py-10 font-bold`}>El historial está vacío.</p>
            ) : (
              <div className="space-y-4">
                {pedidosHistorial.slice(0, 10).map((pedido) => (
                  <div key={pedido.pedidoId} className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border shadow-sm gap-4 ${theme === 'dark' ? 'bg-[#111111] border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div>
                      <p className={`${c.textMain} font-black text-lg`}>{pedido.mesa || pedido.tipoConsumo} <span className="text-gray-500 text-sm ml-2">#{pedido.numeroOrden}</span></p>
                      <p className={`${c.textMuted} text-sm font-bold mt-1`}>{pedido.items.length} platos • Terminados hace poco</p>
                    </div>
                    <button onClick={() => handleDeshacer(pedido.pedidoId)} disabled={procesandoId === pedido.pedidoId} className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
                      <Undo2 size={18} /> Recuperar Ticket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <DisponibilidadModal isOpen={modalAgotados} onClose={() => setModalAgotados(false)} porciones={porciones} recargar={cargarDatos} theme={theme} />
      <ModalReceta isOpen={!!recetaSeleccionada} onClose={() => setRecetaSeleccionada(null)} productoId={recetaSeleccionada?.id} nombreProducto={recetaSeleccionada?.nombre} theme={theme} />
    </div>
  );
}