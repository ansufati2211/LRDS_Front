import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Lock, Unlock, Receipt, X, LogOut, CheckCircle, Printer, Bell, Ban, Split, CircleCheck, FileText } from 'lucide-react';
import { abrirCaja, cerrarCaja, getCajaActiva, procesarPago } from '@/api/caja';
import { getPedidosActivos, crearDocumentoCobro, listarDocumentosCobro, pagarDocumentoCobro } from '@/api/pedidos';
import { emitirDocumentoVenta, anularDocumentoVenta } from '@/api/documentosVenta';
import { useAuthStore } from '@/store/authStore';
import { formatearFechaHoraPeru, formatearHoraPeru } from '@/lib/datetimePeru';
import type { SesionCaja, PagoItem } from '@/api/caja';
import type { PedidoActivo } from '@/types';
import type { DocumentoCobro } from '@/api/pedidos';
import type { DocumentoVenta } from '@/api/documentosVenta';

const puedeAnular = (rol?: string) => rol === 'ROLE_GERENTE' || rol === 'ROLE_SUPER_ADMIN';

const METODOS = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'] as const;
type Metodo = typeof METODOS[number];
const METODO_ICON: Record<Metodo, string> = { EFECTIVO: '💵', YAPE: '💜', PLIN: '💚', TARJETA: '💳' };

// ============================================================================
// COMPONENTE: SELECTOR MULTI-MÉTODO DE PAGO
// ============================================================================
function SelectorPagos({ total, onConfirmar }: { total: number; onConfirmar: (pagos: PagoItem[]) => Promise<void> }) {
  const [pagos, setPagos] = useState<PagoItem[]>([{ metodoPago: 'EFECTIVO', monto: total }]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const vuelto = totalPagado - total;
  const saldoPendiente = total - totalPagado;

  const agregarMetodo = () => setPagos((prev) => [...prev, { metodoPago: 'EFECTIVO', monto: Math.max(0, saldoPendiente) }]);
  const quitarMetodo = (i: number) => setPagos((prev) => prev.filter((_, idx) => idx !== i));
  const actualizarPago = (i: number, campo: keyof PagoItem, valor: string | number) => {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const handleConfirmar = async () => {
    if (saldoPendiente > 0.01) return setError(`Faltan S/ ${saldoPendiente.toFixed(2)} por cubrir.`);
    setProcesando(true); setError('');
    try {
      await onConfirmar(pagos);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {pagos.map((pago, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select value={pago.metodoPago} onChange={(e) => actualizarPago(i, 'metodoPago', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
              {METODOS.map((m) => <option key={m} value={m}>{METODO_ICON[m]} {m}</option>)}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
              <input type="number" min="0" step="0.10" value={pago.monto} onChange={(e) => actualizarPago(i, 'monto', parseFloat(e.target.value) || 0)} className="w-28 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            {pagos.length > 1 && <button onClick={() => quitarMetodo(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>}
          </div>
        ))}
        {pagos.length < 3 && <button onClick={agregarMetodo} className="text-xs text-orange-500 hover:text-orange-700 font-medium">+ Agregar otro método</button>}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600"><span>Total a cobrar</span><span className="font-semibold">S/ {total.toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-600"><span>Recibido</span><span className="font-semibold">S/ {totalPagado.toFixed(2)}</span></div>
        {vuelto > 0.01 && <div className="flex justify-between text-green-700 font-bold"><span>Vuelto</span><span>S/ {vuelto.toFixed(2)}</span></div>}
        {saldoPendiente > 0.01 && <div className="flex justify-between text-red-600 font-bold"><span>Pendiente</span><span>S/ {saldoPendiente.toFixed(2)}</span></div>}
      </div>
      {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}
      <button onClick={handleConfirmar} disabled={procesando || saldoPendiente > 0.01} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition">
        {procesando ? 'Procesando...' : `Confirmar cobro S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}

// ============================================================================
// MODAL: PAGO DIRECTO (Mesa completa + Facturación)
// ============================================================================
function ModalPago({ pedido, sesionId, onClose, onPagado }: { pedido: PedidoActivo; sesionId: number; onClose: () => void; onPagado: () => void }) {
  const { user } = useAuthStore();
  const [exito, setExito] = useState(false);
  const [comprobante, setComprobante] = useState<DocumentoVenta | null>(null);
  const [anulando, setAnulando] = useState(false);
  
  // Módulo 7: Facturación
  const [tipoDoc, setTipoDoc] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');

  const handleConfirmarPago = async (pagos: PagoItem[]) => {
    await procesarPago(pedido.id, sesionId, pagos);
    setExito(true);
    try {
      const doc = await emitirDocumentoVenta({ 
        tipo: tipoDoc, 
        pedidoId: pedido.id,
        numeroDocumentoReceptor: tipoDoc === 'FACTURA' ? ruc : undefined,
        razonSocialReceptor: tipoDoc === 'FACTURA' ? razonSocial : undefined
      });
      setComprobante(doc);
    } catch (err: any) {
      alert(`El pago fue exitoso, pero falló la emisión del comprobante: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAnular = async () => {
    if (!comprobante) return;
    const motivo = window.prompt('Motivo de anulación (obligatorio):');
    if (!motivo || !motivo.trim()) return;
    setAnulando(true);
    try {
      setComprobante(await anularDocumentoVenta(comprobante.id, motivo.trim()));
    } finally { setAnulando(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Cobrar Pedido #{pedido.id}</h2>
            <p className="text-orange-100 text-sm">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        
        {exito ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-900 mb-1">¡Pago registrado!</p>
            {comprobante && (
              <div className={`mt-3 rounded-xl border p-4 text-left ${comprobante.estadoEmision === 'ANULADO' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{comprobante.tipo.replace('_', ' ')}</span>
                  {comprobante.estadoEmision === 'ANULADO' && <span className="text-xs font-bold text-red-600">ANULADA</span>}
                </div>
                <p className="font-mono font-bold text-gray-900">{comprobante.serie}-{String(comprobante.correlativo).padStart(6, '0')}</p>
                <p className="text-sm text-gray-500">S/ {comprobante.total.toFixed(2)}</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={() => window.open(`/api/pedidos/${pedido.id}/ticket?token=${useAuthStore.getState().token}`, '_blank')} className="flex gap-2 text-sm text-gray-500 hover:text-orange-500"><Printer size={15} /> Ver ticket</button>
              {comprobante?.estadoEmision !== 'ANULADO' && puedeAnular(user?.rol) && (
                <button onClick={handleAnular} disabled={anulando} className="flex gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"><Ban size={15} /> {anulando ? 'Anulando...' : 'Anular comprobante'}</button>
              )}
            </div>
            <button onClick={onPagado} className="mt-6 w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition">Listo</button>
          </div>
        ) : (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 max-h-36 overflow-y-auto">
              {pedido.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.cantidad}x {item.nombreProducto}</span>
                  <span className="text-gray-500">S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Módulo 7: Selección de Documento */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de Comprobante</label>
              <div className="flex gap-2">
                {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => (
                  <button key={t} onClick={() => setTipoDoc(t)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tipoDoc === t ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                  </button>
                ))}
              </div>
              {tipoDoc === 'FACTURA' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <input type="text" placeholder="RUC (11 dígitos numéricos)" maxLength={11} value={ruc} onChange={e => setRuc(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-300" />
                  <input type="text" placeholder="Razón Social" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-300" />
                </div>
              )}
            </div>

            <SelectorPagos total={pedido.total} onConfirmar={handleConfirmarPago} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: DIVIDIR CUENTAS (Módulo 4)
// ============================================================================
function ModalSplitCuenta({ pedido, sesionId, onClose, onCambio }: { pedido: PedidoActivo; sesionId: number; onClose: () => void; onCambio: () => Promise<void> }) {
  const [documentos, setDocumentos] = useState<DocumentoCobro[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [montoLibre, setMontoLibre] = useState('');
  const [docPagandoId, setDocPagandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setDocumentos(await listarDocumentosCobro(pedido.id));
  }, [pedido.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const itemsActivos = pedido.items.filter((i) => i.estadoItem !== 'CANCELADO');
  const idsAsignados = new Set(documentos.flatMap((d) => d.detalleIds));
  const itemsDisponibles = itemsActivos.filter((i) => !idsAsignados.has(i.detalleId));
  
  const totalAsignado = documentos.reduce((s, d) => s + d.total, 0);
  const totalPorAsignar = pedido.total - totalAsignado;
  const pedidoCompletado = documentos.filter((d) => d.estado === 'PAGADO').reduce((s, d) => s + d.total, 0) >= pedido.total - 0.01;

  const handleCrearPorItems = async () => {
    await crearDocumentoCobro(pedido.id, { tipo: 'ITEMS', detalleIds: seleccionados });
    setSeleccionados([]); await cargar();
  };

  const handleCrearPorMonto = async () => {
    const monto = parseFloat(montoLibre);
    if (monto > 0 && monto <= totalPorAsignar + 0.01) {
      await crearDocumentoCobro(pedido.id, { tipo: 'MONTO', monto });
      setMontoLibre(''); await cargar();
    }
  };

  const handlePagar = async (doc: DocumentoCobro, pagos: PagoItem[]) => {
    await pagarDocumentoCobro(doc.id, sesionId, pagos);
    await emitirDocumentoVenta({ tipo: 'NOTA_VENTA', documentoCobroId: doc.id }).catch(() => {});
    setDocPagandoId(null); await cargar(); await onCambio();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="bg-gray-900 px-6 py-4 flex justify-between">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><Split size={18} /> Dividir Cuenta #{pedido.id}</h2>
            <p className="text-gray-400 text-sm">Total a cubrir: S/ {pedido.total.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {pedidoCompletado && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 text-sm font-semibold justify-center">
              <CircleCheck size={18} /> Todos los sub-cobros completados. Pedido pagado.
            </div>
          )}

          {documentos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Documentos generados</p>
              {documentos.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{doc.tipo === 'ITEMS' ? `${doc.detalleIds.length} ítem(s)` : 'Monto Fijo'}</p>
                      <p className="text-lg font-black text-orange-600">S/ {doc.total.toFixed(2)}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${doc.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {doc.estado}
                    </span>
                  </div>
                  {doc.estado === 'PENDIENTE' && docPagandoId === doc.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in">
                      <SelectorPagos total={doc.total} onConfirmar={(p) => handlePagar(doc, p)} />
                    </div>
                  )}
                  {doc.estado === 'PENDIENTE' && docPagandoId !== doc.id && (
                    <button onClick={() => setDocPagandoId(doc.id)} className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 rounded-lg transition">
                      Pagar esta parte
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!pedidoCompletado && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Generar nueva división (Falta S/ {totalPorAsignar.toFixed(2)})</p>
              
              {itemsDisponibles.length > 0 && (
                <div className="space-y-2">
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {itemsDisponibles.map((i) => (
                      <label key={i.detalleId} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 cursor-pointer hover:border-orange-300">
                        <input type="checkbox" checked={seleccionados.includes(i.detalleId)} onChange={() => setSeleccionados(p => p.includes(i.detalleId) ? p.filter(x => x !== i.detalleId) : [...p, i.detalleId])} className="w-4 h-4 text-orange-500" />
                        <span className="flex-1 text-sm">{i.cantidad}x {i.nombreProducto}</span>
                        <span className="font-semibold text-sm">S/ {i.subtotal.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleCrearPorItems} disabled={seleccionados.length === 0} className="w-full bg-gray-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg transition">
                    Agrupar {seleccionados.length} ítem(s) para cobro
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">O por monto:</span>
                <input type="number" min="0" max={totalPorAsignar} step="0.10" value={montoLibre} onChange={(e) => setMontoLibre(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <button onClick={handleCrearPorMonto} disabled={!montoLibre} className="bg-gray-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg">Crear</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: CAJERO PAGE
// ============================================================================
export default function CajeroPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sesion, setSesion] = useState<SesionCaja | null>(null);
  const [pedidosEntregados, setPedidosEntregados] = useState<PedidoActivo[]>([]);
  const [documentosPorPedido, setDocumentosPorPedido] = useState<Record<number, DocumentoCobro[]>>({});
  
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [diferenciaCierre, setDiferenciaCierre] = useState<number | null>(null);
  const [operando, setOperando] = useState(false);
  
  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoActivo | null>(null);
  const [pedidoSplit, setPedidoSplit] = useState<PedidoActivo | null>(null);

  const cargarEstado = useCallback(async () => {
    try {
      const [caja, pedidos] = await Promise.allSettled([getCajaActiva(), getPedidosActivos()]);
      setSesion(caja.status === 'fulfilled' ? caja.value : null);
      
      if (pedidos.status === 'fulfilled') {
        const entregados = pedidos.value.filter((p) => p.estadoActual === 'ENTREGADO');
        setPedidosEntregados(entregados);
        
        // Módulo 4: Saber cuáles pedidos ya tienen la cuenta dividida para ocultar el "Cobro Rápido"
        const docs = await Promise.all(entregados.map(async (p) => [p.id, await listarDocumentosCobro(p.id).catch(() => [])] as const));
        setDocumentosPorPedido(Object.fromEntries(docs));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  // Escalación Nivel 2: Cajero recibe alerta si cocina terminó hace > 2 mins y el mozo no recoge
  useEffect(() => {
    const es = new EventSource(`http://localhost:8080/api/kds/eventos?token=${useAuthStore.getState().token}`);
    es.addEventListener('AVISO_PEDIDO_LISTO', () => cargarEstado()); // Refresca o muestra toast
    return () => es.close();
  }, [cargarEstado]);

  const handleCaja = async (accion: 'ABRIR' | 'CERRAR') => {
    const monto = parseFloat(accion === 'ABRIR' ? montoApertura : montoCierre);
    if (isNaN(monto) || monto < 0) return alert('Monto inválido');
    setOperando(true);
    try {
      if (accion === 'ABRIR') {
        setSesion(await abrirCaja(monto));
        setMontoApertura('');
      } else {
        const cerrada = await cerrarCaja(sesion!.id, monto);
        setSesion(cerrada);
        setDiferenciaCierre(cerrada.diferencia);
        setMontoCierre('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error en operación de caja');
    } finally { setOperando(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl text-white"><Receipt size={24} /></div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">VERONICA Caja</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{user?.nombre || user?.correo}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex gap-2 text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"><LogOut size={18} /> Salir</button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* PANEL DE CAJA (Módulo 2) */}
        {(!sesion || sesion.estado === 'CERRADA') ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 max-w-md shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><Unlock size={24} className="text-green-600" /></div>
              <div><h2 className="text-xl font-black text-gray-900">Apertura de Turno</h2><p className="text-sm text-gray-500">Ingresa el efectivo base (Sencillo)</p></div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">S/</span>
                <input type="number" min="0" step="0.5" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 font-semibold" placeholder="0.00" />
              </div>
              <button onClick={() => handleCaja('ABRIR')} disabled={operando} className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 rounded-xl transition">Abrir</button>
            </div>
            {diferenciaCierre !== null && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-bold text-center ${diferenciaCierre >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                Cierre anterior: Diferencia {diferenciaCierre >= 0 ? '+' : ''}S/ {diferenciaCierre.toFixed(2)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><Lock size={24} className="text-orange-500" /></div>
              <div>
                <div className="flex items-center gap-2"><h2 className="text-xl font-black text-gray-900">Caja Activa</h2><span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Operando</span></div>
                <p className="text-sm text-gray-500">Abierta: {sesion.fechaApertura ? formatearFechaHoraPeru(sesion.fechaApertura) : ''}</p>
              </div>
            </div>
            <div className="flex gap-3 items-center w-full md:w-auto bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <div className="text-right pr-4 border-r border-gray-200">
                <p className="text-xs text-gray-500 font-semibold uppercase">Contar Efectivo Final</p>
              </div>
              <div className="relative w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">S/</span>
                <input type="number" min="0" step="0.5" value={montoCierre} onChange={e => setMontoCierre(e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 text-sm font-bold" placeholder="0.00" />
              </div>
              <button onClick={() => handleCaja('CERRAR')} disabled={operando} className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">Cerrar Turno</button>
            </div>
          </div>
        )}

        {/* LISTA DE PEDIDOS LISTOS PARA COBRO */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <FileText size={24} className="text-orange-500" />
              Cuentas por Cobrar
            </h2>
            <button onClick={cargarEstado} className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition">Actualizar listado</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {pedidosEntregados.map((pedido) => {
              const docs = documentosPorPedido[pedido.id] || [];
              const tieneSplit = docs.length > 0;
              
              const requiereCaja = (fn: () => void) => {
                if (!sesion || sesion.estado !== 'ABIERTA') return alert('Abre la caja antes de interactuar con el dinero.');
                fn();
              };

              return (
                <div key={pedido.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Mesa / Orden</p>
                      <h3 className="text-xl font-black text-gray-900 leading-none mt-1">{pedido.mesa || 'Llevar'}</h3>
                      <p className="text-xs font-medium text-gray-500 mt-1">Ref #{pedido.id}</p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Por Cobrar</span>
                  </div>
                  
                  <div className="flex-1 max-h-32 overflow-y-auto space-y-1 mb-4">
                    {pedido.items.map((i) => (
                      <div key={i.detalleId} className="flex justify-between text-xs font-medium text-gray-600">
                        <span className="truncate pr-2">{i.cantidad}x {i.nombreProducto}</span>
                        <span className="font-bold text-gray-900">S/{i.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-500">Total</span>
                      <span className="text-2xl font-black text-orange-600">S/ {pedido.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!tieneSplit && (
                        <button onClick={() => requiereCaja(() => setPedidoACobrar(pedido))} className="flex-1 bg-gray-900 hover:bg-black text-white text-sm font-bold py-2.5 rounded-xl transition">
                          Cobro Rápido
                        </button>
                      )}
                      <button onClick={() => requiereCaja(() => setPedidoSplit(pedido))} className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                        <Split size={16} /> {tieneSplit ? 'Ver División' : 'Dividir'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {pedidosEntregados.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                <CircleCheck size={48} className="mb-4 opacity-20" />
                <p className="font-semibold text-lg">No hay mesas pendientes de pago.</p>
                <p className="text-sm">El salón está al día.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {pedidoACobrar && sesion && <ModalPago pedido={pedidoACobrar} sesionId={sesion.id} onClose={() => setPedidoACobrar(null)} onPagado={() => { setPedidoACobrar(null); cargarEstado(); }} />}
      {pedidoSplit && sesion && <ModalSplitCuenta pedido={pedidoSplit} sesionId={sesion.id} onClose={() => setPedidoSplit(null)} onCambio={cargarEstado} />}
    </div>
  );
}