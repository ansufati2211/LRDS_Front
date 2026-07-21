import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Lock, Unlock, Receipt, X, Split, CircleCheck, 
  FileText, Printer, Ban, Moon, Sun, ShieldAlert, Loader2,
  Banknote, ArrowRightCircle, AlertTriangle, History, TrendingUp, CheckCircle,
} from 'lucide-react';
import { abrirCaja, cerrarCaja, getCajaActiva, procesarPago } from '@/api/caja';
import { getPedidosActivos, crearDocumentoCobro, listarDocumentosCobro, pagarDocumentoCobro, getHistorialPedidos } from '@/api/pedidos';
import { emitirDocumentoVenta, anularDocumentoVenta } from '@/api/documentosVenta';
import { useAuthStore } from '@/store/authStore';
import { formatearFechaHoraPeru } from '@/lib/datetimePeru';
import { sileo } from 'sileo';
import api from '@/api/client';
import type { SesionCaja, PagoItem } from '@/api/caja';
import type { PedidoActivo } from '@/types';
import type { DocumentoCobro } from '@/api/pedidos';
import type { DocumentoVenta } from '@/api/documentosVenta';

const THEMES = {
  light: {
    appBg: 'bg-slate-50', panelBg: 'bg-white', cardBg: 'bg-white', itemBg: 'bg-slate-50', 
    textMain: 'text-slate-900', textMuted: 'text-slate-500',
    border: 'border-slate-200', borderLight: 'border-slate-100',
    primaryBtn: 'bg-slate-900 hover:bg-black text-white', secondaryBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    inputBg: 'bg-slate-50 focus:bg-white text-slate-900', ring: 'focus:ring-slate-900', iconBadge: 'bg-slate-900 text-white'
  },
  dark: {
    appBg: 'bg-[#0b1120]', panelBg: 'bg-[#111827]', cardBg: 'bg-[#1e293b]', itemBg: 'bg-[#0f172a]', 
    textMain: 'text-white', textMuted: 'text-slate-400',
    border: 'border-slate-700', borderLight: 'border-slate-800',
    primaryBtn: 'bg-white hover:bg-slate-200 text-black', secondaryBtn: 'bg-[#334155] hover:bg-[#475569] text-white',
    inputBg: 'bg-[#0f172a] focus:bg-[#1e293b] text-white', ring: 'focus:ring-white', iconBadge: 'bg-white text-black'
  }
};
type ThemeKey = 'light' | 'dark';
const METODOS = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'] as const;
const puedeAnular = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

const imprimirTicketTexto = async (pedidoId: number) => {
  try {
    const res = await api.get(`/pedidos/${pedidoId}/ticket`, { responseType: 'text' });
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return sileo.error({ title: 'Ventana bloqueada', description: 'Permite los popups en el navegador.' });
    
    win.document.write(`
      <html>
        <head><title>Ticket #${pedidoId}</title></head>
        <body style="font-family: monospace; white-space: pre-wrap; font-size: 14px; margin: 0; padding: 20px; color: #000;">
          ${res.data}
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 200);
  } catch (err) {
    sileo.error({ title: 'Error al obtener ticket' });
  }
};

function ModalConfirmacion({ isOpen, title, message, type, requireInput, inputPlaceholder, onConfirm, onCancel, loading }: any) {
  const [val, setVal] = useState('');
  useEffect(() => { if (isOpen) setVal(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${type === 'danger' ? 'bg-rose-50' : 'bg-amber-50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'}`}>
            <ShieldAlert size={32} />
          </div>
          <h2 className={`font-black text-xl tracking-tight mb-2 ${type === 'danger' ? 'text-rose-700' : 'text-amber-700'}`}>{title}</h2>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{message}</p>
        </div>
        {requireInput && (
          <div className="px-6 pt-2 pb-6 bg-white">
            <input autoFocus type={type === 'number' ? 'number' : 'text'} step="0.1" value={val} onChange={(e) => setVal(e.target.value)} placeholder={inputPlaceholder} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 text-slate-900 outline-none font-bold" />
          </div>
        )}
        <div className={`px-6 pb-6 flex gap-3 bg-white ${!requireInput ? 'pt-6' : ''}`}>
          <button onClick={onCancel} disabled={loading} className="flex-1 px-5 py-3.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 active:scale-95 transition-transform">Volver</button>
          <button onClick={() => onConfirm(val)} disabled={loading || (requireInput && !val)} className={`flex-1 px-5 py-3.5 text-white rounded-xl font-bold active:scale-95 transition-transform flex justify-center items-center gap-2 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-black'} disabled:opacity-50`}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Procesando' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Selector de pagos corregido (envía número de yape y tarjeta sin errores)
function SelectorPagos({ total, c, onConfirmar }: any) {
  const [pagos, setPagos] = useState<PagoItem[]>([{ metodoPago: 'EFECTIVO', monto: total, numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const [procesando, setProcesando] = useState(false);

  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const vuelto = totalPagado - total;
  const saldoPendiente = total - totalPagado;

  const agregarMetodo = () => setPagos((prev) => [...prev, { metodoPago: 'YAPE', monto: Math.max(0, saldoPendiente), numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const quitarMetodo = (i: number) => setPagos((prev) => prev.filter((_, idx) => idx !== i));
  const actualizarPago = (i: number, campo: keyof PagoItem, valor: string | number) => {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const handleConfirmar = async () => {
    if (saldoPendiente > 0.01) return sileo.error({ title: 'Falta Saldo', description: `Faltan S/ ${saldoPendiente.toFixed(2)} por cubrir.` });
    setProcesando(true);
    try { await onConfirmar(pagos); } 
    catch (err: any) { sileo.error({ title: 'Error al cobrar', description: err.response?.data?.message || err.message }); } 
    finally { setProcesando(false); }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {pagos.map((pago, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${c.borderLight} bg-gray-50/50 dark:bg-gray-900/50 space-y-3`}>
            <div className="flex gap-2 items-center">
              <select value={pago.metodoPago} onChange={(e) => actualizarPago(i, 'metodoPago', e.target.value)} className={`flex-1 ${c.inputBg} border ${c.border} rounded-xl px-3 py-2.5 text-sm font-black outline-none`}>
                {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                <input type="number" min="0" step="0.10" value={pago.monto} onChange={(e) => actualizarPago(i, 'monto', parseFloat(e.target.value) || 0)} className={`w-28 pl-8 pr-3 py-2.5 ${c.inputBg} border ${c.border} rounded-xl text-sm font-black outline-none`} />
              </div>
              {pagos.length > 1 && <button onClick={() => quitarMetodo(i)} className={`${c.textMuted} hover:text-rose-500`}><X size={20} /></button>}
            </div>

            {/* Inputs específicos para Yape/Plin/Tarjeta */}
            {(pago.metodoPago === 'YAPE' || pago.metodoPago === 'PLIN') && (
              <input type="text" placeholder="Nro de Celular / Operación Yape" value={pago.numeroYape || ''} onChange={(e) => actualizarPago(i, 'numeroYape', e.target.value)} className={`w-full px-4 py-2.5 text-xs font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none`} />
            )}
            {pago.metodoPago === 'TARJETA' && (
              <div className="flex gap-2">
                <input type="text" placeholder="Últimos 4 dígitos" maxLength={4} value={pago.ultimosDigitos || ''} onChange={(e) => actualizarPago(i, 'ultimosDigitos', e.target.value.replace(/\D/g, ''))} className={`w-1/3 px-3 py-2.5 text-xs font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none`} />
                <input type="text" placeholder="Titular de la Tarjeta" value={pago.titular || ''} onChange={(e) => actualizarPago(i, 'titular', e.target.value)} className={`flex-1 px-3 py-2.5 text-xs font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none`} />
              </div>
            )}
          </div>
        ))}
        {pagos.length < 3 && <button onClick={agregarMetodo} className="text-[11px] text-emerald-500 hover:text-emerald-600 font-black tracking-widest uppercase bg-emerald-500/10 px-3 py-1.5 rounded-lg">+ Añadir Método Dividido</button>}
      </div>

      <div className={`${c.itemBg} border ${c.border} rounded-2xl p-5 space-y-2 text-sm font-bold`}>
        <div className={`flex justify-between ${c.textMuted}`}><span>Total a cobrar</span><span>S/ {total.toFixed(2)}</span></div>
        <div className={`flex justify-between ${c.textMuted}`}><span>Monto recibido</span><span>S/ {totalPagado.toFixed(2)}</span></div>
        {vuelto > 0.01 && <div className="flex justify-between text-emerald-500 font-black pt-2 border-t border-emerald-500/20"><span>Vuelto a entregar</span><span>S/ {vuelto.toFixed(2)}</span></div>}
        {saldoPendiente > 0.01 && <div className="flex justify-between text-rose-500 font-black pt-2 border-t border-rose-500/20"><span>Monto Faltante</span><span>S/ {saldoPendiente.toFixed(2)}</span></div>}
      </div>
      <button onClick={handleConfirmar} disabled={procesando || saldoPendiente > 0.01} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-4 rounded-xl font-black text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg`}>
        {procesando ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
        {procesando ? 'Procesando Transacción...' : `Cobrar S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}

function ModalPago({ pedido, sesionId, c, onClose, onPagado }: any) {
  const { user } = useAuthStore();
  const [exito, setExito] = useState(false);
  const [comprobante, setComprobante] = useState<DocumentoVenta | null>(null);
  const [tipoDoc, setTipoDoc] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [numeroDocReceptor, setNumeroDocReceptor] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<any>({ isOpen: false });

  const handleConfirmarPago = async (pagos: PagoItem[]) => {
    try {
      await procesarPago(pedido.id, sesionId, pagos);
      setExito(true);
      const doc = await emitirDocumentoVenta({ 
        tipo: tipoDoc, pedidoId: pedido.id,
        tipoDocumentoReceptor: tipoDoc === 'FACTURA' ? 'RUC' : (tipoDoc === 'BOLETA' && numeroDocReceptor ? 'DNI' : undefined),
        numeroDocumentoReceptor: tipoDoc !== 'NOTA_VENTA' ? numeroDocReceptor : undefined,
        razonSocialReceptor: tipoDoc !== 'NOTA_VENTA' ? razonSocial : undefined
      });
      setComprobante(doc);
      sileo.success({ title: 'Cobro Completado' });
    } catch (err: any) { sileo.error({ title: 'Atención', description: `Pago exitoso, comprobante falló: ${err.message}` }); }
  };

  const handleAnular = () => {
    if (!comprobante) return;
    setConfirmDialog({
      isOpen: true, title: 'Anular Comprobante', message: 'Ingresa el motivo de anulación.', type: 'danger', requireInput: true, inputPlaceholder: 'Ej. Error en RUC', isProcessing: false,
      onConfirm: async (motivo: string) => {
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          setComprobante(await anularDocumentoVenta(comprobante.id, motivo.trim()));
          sileo.success({ title: 'Comprobante Anulado' });
        } catch (err: any) { sileo.error({ title: 'Error', description: err.message }); } 
        finally { setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border ${c.border}`}>
        <div className="bg-emerald-500 px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">Cobrar #{pedido.id}</h2>
            <p className="text-emerald-100 font-bold text-sm mt-0.5">{pedido.mesa || 'Para Llevar'}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/20 p-2.5 rounded-full active:scale-95 transition-transform"><X size={20} /></button>
        </div>
        
        {exito ? (
          <div className="p-8 text-center overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <p className={`text-3xl font-black ${c.textMain} tracking-tight mb-1`}>¡Pagado!</p>
            {comprobante && (
              <div className={`mt-6 rounded-2xl border ${c.border} p-5 text-left ${comprobante.estadoEmision === 'ANULADO' ? 'opacity-50' : c.itemBg}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>{comprobante.tipo.replace('_', ' ')}</span>
                  {comprobante.estadoEmision === 'ANULADO' && <span className="text-[10px] font-black text-white bg-rose-500 px-2 py-0.5 rounded uppercase">Anulada</span>}
                </div>
                <p className={`font-mono font-black ${c.textMain} text-xl tracking-tight`}>{comprobante.serie}-{String(comprobante.correlativo).padStart(6, '0')}</p>
                <p className={`text-sm font-black text-amber-500 mt-1`}>S/ {comprobante.total.toFixed(2)}</p>
              </div>
            )}
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => imprimirTicketTexto(pedido.id)} className={`w-full ${c.secondaryBtn} border ${c.border} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2`}>
                <Printer size={18} /> Imprimir Ticket
              </button>
              {comprobante?.estadoEmision !== 'ANULADO' && puedeAnular(user?.rol) && (
                <button onClick={handleAnular} className="w-full text-rose-500 hover:text-rose-700 bg-rose-500/10 font-bold py-4 rounded-xl text-sm flex justify-center items-center gap-2 transition-transform active:scale-95">
                  <Ban size={18} /> Anular Comprobante
                </button>
              )}
              <button onClick={onPagado} className={`w-full ${c.primaryBtn} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 mt-2`}>Finalizar y Cerrar</button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <div className={`${c.itemBg} rounded-2xl p-5 space-y-2 max-h-40 overflow-y-auto border ${c.borderLight} custom-scrollbar`}>
              {pedido.items.map((item: any, i: number) => (
                <div key={i} className={`flex justify-between text-sm ${item.estadoItem === 'CANCELADO' ? 'opacity-40 line-through' : ''}`}>
                  <span className={`${c.textMain} font-bold`}>{item.cantidad}x {item.nombreProducto}</span>
                  <span className={`${c.textMuted} font-black`}>S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <label className={`block text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Comprobante de Venta</label>
              <div className={`flex p-1.5 ${c.appBg} rounded-xl border ${c.border}`}>
                {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => (
                  <button key={t} onClick={() => setTipoDoc(t)} className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${tipoDoc === t ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                  </button>
                ))}
              </div>
              {tipoDoc !== 'NOTA_VENTA' && (
                <div className="space-y-3 animate-in fade-in pt-2">
                  <input type="text" placeholder={tipoDoc === 'FACTURA' ? 'RUC (11 dígitos)' : 'DNI (Opcional)'} maxLength={11} value={numeroDocReceptor} onChange={e => setNumeroDocReceptor(e.target.value.replace(/\D/g, ''))} className={`w-full px-4 py-3.5 border ${c.border} rounded-xl text-sm font-bold focus:outline-none ${c.ring} ${c.inputBg}`} />
                  <input type="text" placeholder="Razón Social / Nombre" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={`w-full px-4 py-3.5 border ${c.border} rounded-xl text-sm font-bold focus:outline-none ${c.ring} ${c.inputBg}`} />
                </div>
              )}
            </div>

            <div className={`pt-6 border-t ${c.borderLight}`}>
              <SelectorPagos total={pedido.total} c={c} onConfirmar={handleConfirmarPago} />
            </div>
          </div>
        )}
      </div>
      <ModalConfirmacion {...confirmDialog} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
    </div>
  );
}

function ModalSplitCuenta({ pedido, sesionId, c, onClose, onCambio }: any) {
  const [documentos, setDocumentos] = useState<DocumentoCobro[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [montoLibre, setMontoLibre] = useState('');
  
  const [docPagandoId, setDocPagandoId] = useState<number | null>(null);
  const [tipoDocSplit, setTipoDocSplit] = useState<'NOTA_VENTA' | 'BOLETA' | 'FACTURA'>('NOTA_VENTA');
  const [rucSplit, setRucSplit] = useState('');
  const [razonSocialSplit, setRazonSocialSplit] = useState('');

  const cargar = useCallback(async () => setDocumentos(await listarDocumentosCobro(pedido.id)), [pedido.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const itemsActivos = pedido.items.filter((i: any) => i.estadoItem !== 'CANCELADO');
  const idsAsignados = new Set(documentos.flatMap((d) => d.detalleIds));
  const itemsDisponibles = itemsActivos.filter((i: any) => !idsAsignados.has(i.detalleId));
  
  const totalAsignado = documentos.reduce((s, d) => s + d.total, 0);
  const totalPorAsignar = pedido.total - totalAsignado;
  const pedidoCompletado = documentos.filter((d) => d.estado === 'PAGADO').reduce((s, d) => s + d.total, 0) >= pedido.total - 0.01;

  const handleCrearPorItems = async () => {
    try {
      await crearDocumentoCobro(pedido.id, { tipo: 'ITEMS', detalleIds: seleccionados });
      setSeleccionados([]); await cargar();
      sileo.success({ title: 'División creada' });
    } catch (e: any) { sileo.error({ title: 'Error', description: e.message }); }
  };

  const handleCrearPorMonto = async () => {
    const monto = parseFloat(montoLibre);
    if (monto > 0 && monto <= totalPorAsignar + 0.01) {
      try {
        await crearDocumentoCobro(pedido.id, { tipo: 'MONTO', monto });
        setMontoLibre(''); await cargar();
        sileo.success({ title: 'División creada' });
      } catch (e: any) { sileo.error({ title: 'Error', description: e.message }); }
    }
  };

  const handlePagar = async (doc: DocumentoCobro, pagos: PagoItem[]) => {
    try {
      await pagarDocumentoCobro(doc.id, sesionId, pagos);
      await emitirDocumentoVenta({ 
        tipo: tipoDocSplit, documentoCobroId: doc.id,
        tipoDocumentoReceptor: tipoDocSplit === 'FACTURA' ? 'RUC' : (tipoDocSplit === 'BOLETA' && rucSplit ? 'DNI' : undefined),
        numeroDocumentoReceptor: tipoDocSplit !== 'NOTA_VENTA' ? rucSplit : undefined,
        razonSocialReceptor: tipoDocSplit !== 'NOTA_VENTA' ? razonSocialSplit : undefined
      }).catch(() => {});
      sileo.success({ title: 'Parte cobrada exitosamente' });
      setDocPagandoId(null); await cargar(); await onCambio();
    } catch (e: any) { sileo.error({ title: 'Error', description: e.response?.data?.message || e.message }); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border ${c.border}`}>
        <div className="bg-indigo-600 px-8 py-6 flex justify-between shrink-0 items-center">
          <div>
            <h2 className="text-white font-black text-xl flex items-center gap-2"><Split size={20} /> Dividir Cuenta</h2>
            <p className="text-indigo-200 text-sm font-bold mt-1">Falta asignar: S/ {totalPorAsignar.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/20 p-2.5 rounded-full h-fit active:scale-95 transition-transform"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {pedidoCompletado && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-3 text-emerald-600 text-sm font-black justify-center">
              <CircleCheck size={24} /> ¡Todas las partes pagadas!
            </div>
          )}

          {documentos.length > 0 && (
            <div className="space-y-4">
              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Cuentas Divididas</p>
              {documentos.map((doc) => (
                <div key={doc.id} className={`border ${c.border} rounded-[1.5rem] p-5 ${c.cardBg} shadow-sm transition-all`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className={`text-xs font-bold ${c.textMuted}`}>{doc.tipo === 'ITEMS' ? `${doc.detalleIds.length} ítem(s)` : 'Monto Fijo'}</p>
                      <p className={`text-2xl font-black text-indigo-500 tracking-tight mt-0.5`}>S/ {doc.total.toFixed(2)}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${doc.estado === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {doc.estado}
                    </span>
                  </div>
                  
                  {doc.estado === 'PENDIENTE' && docPagandoId === doc.id && (
                    <div className={`mt-6 pt-6 border-t ${c.borderLight} animate-in fade-in`}>
                      <div className="mb-6 space-y-3">
                        <div className={`flex p-1.5 rounded-xl border ${c.border} ${c.appBg}`}>
                          {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => (
                            <button key={t} onClick={() => setTipoDocSplit(t)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${tipoDocSplit === t ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                              {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                            </button>
                          ))}
                        </div>
                        {tipoDocSplit !== 'NOTA_VENTA' && (
                          <div className="flex gap-2">
                            <input type="text" placeholder="Doc." maxLength={11} value={rucSplit} onChange={e => setRucSplit(e.target.value.replace(/\D/g, ''))} className={`w-1/3 px-4 py-3 border ${c.border} rounded-xl text-xs font-bold focus:outline-none ${c.ring} ${c.inputBg}`} />
                            <input type="text" placeholder="Razón Social" value={razonSocialSplit} onChange={e => setRazonSocialSplit(e.target.value)} className={`w-2/3 px-4 py-3 border ${c.border} rounded-xl text-xs font-bold focus:outline-none ${c.ring} ${c.inputBg}`} />
                          </div>
                        )}
                      </div>
                      <SelectorPagos total={doc.total} c={c} onConfirmar={(p: any) => handlePagar(doc, p)} />
                      <button onClick={() => setDocPagandoId(null)} className={`w-full mt-4 py-3 text-xs font-bold ${c.textMuted} hover:${c.textMain} transition-colors`}>Cancelar pago</button>
                    </div>
                  )}
                  {doc.estado === 'PENDIENTE' && docPagandoId !== doc.id && (
                    <button onClick={() => { setDocPagandoId(doc.id); setTipoDocSplit('NOTA_VENTA'); setRucSplit(''); setRazonSocialSplit(''); }} className={`mt-5 w-full ${c.secondaryBtn} border ${c.border} text-sm font-black py-3.5 rounded-xl transition-transform active:scale-95`}>
                      Cobrar esta parte
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!pedidoCompletado && (
            <div className={`${c.itemBg} p-6 rounded-[1.5rem] border ${c.border} space-y-6`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Nueva división</p>
              
              {itemsDisponibles.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {itemsDisponibles.map((i: any) => (
                      <label key={i.detalleId} className={`flex items-center gap-4 ${c.cardBg} p-4 rounded-xl border ${c.borderLight} cursor-pointer hover:border-indigo-400 transition-colors`}>
                        <input type="checkbox" checked={seleccionados.includes(i.detalleId)} onChange={() => setSeleccionados(p => p.includes(i.detalleId) ? p.filter(x => x !== i.detalleId) : [...p, i.detalleId])} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                        <span className={`flex-1 text-sm font-bold ${c.textMain}`}>{i.cantidad}x {i.nombreProducto}</span>
                        <span className={`font-black text-sm ${c.textMuted}`}>S/ {i.subtotal.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handleCrearPorItems} disabled={seleccionados.length === 0} className={`w-full ${c.primaryBtn} disabled:opacity-50 text-sm font-black py-4 rounded-xl transition-transform active:scale-95`}>
                    Extraer {seleccionados.length} ítem(s)
                  </button>
                </div>
              )}
              
              <div className={`flex flex-col gap-3 pt-5 border-t ${c.borderLight}`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>O extraer por monto (S/)</span>
                <div className="flex gap-2">
                  <input type="number" min="0" max={totalPorAsignar} step="0.10" value={montoLibre} onChange={(e) => setMontoLibre(e.target.value)} placeholder="0.00" className={`w-full px-4 py-3.5 border ${c.border} rounded-xl text-sm font-bold focus:outline-none ${c.ring} ${c.inputBg}`} />
                  <button onClick={handleCrearPorMonto} disabled={!montoLibre} className={`${c.primaryBtn} disabled:opacity-50 text-sm font-black px-6 rounded-xl active:scale-95 transition-transform`}>Extraer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderCajero({ user, theme, changeTheme, logout }: any) {
  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2.5 rounded-xl"><Receipt className="text-black w-5 h-5" strokeWidth={2.5} /></div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-black text-white leading-none tracking-tight">VERONICA Caja</h1>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Operador: <span className="text-white">{user?.nombre || user?.correo}</span></p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="hidden sm:block h-8 w-px bg-gray-800 mx-1"></div>
        <button onClick={logout} className="flex items-center gap-2 p-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all">
          <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}

export default function CajeroPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem('pos_theme_bw') as ThemeKey) || 'light');
  const changeTheme = (newTheme: ThemeKey) => { setTheme(newTheme); localStorage.setItem('pos_theme_bw', newTheme); };
  const c = THEMES[theme];

  const [sesion, setSesion] = useState<SesionCaja | null>(null);
  const [pedidosEntregados, setPedidosEntregados] = useState<PedidoActivo[]>([]);
  const [historialHoy, setHistorialHoy] = useState<any[]>([]); 
  const [vistaActiva, setVistaActiva] = useState<'POR_COBRAR' | 'HISTORIAL'>('POR_COBRAR');

  const [documentosPorPedido, setDocumentosPorPedido] = useState<Record<number, DocumentoCobro[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<any>({ isOpen: false });
  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoActivo | null>(null);
  const [pedidoSplit, setPedidoSplit] = useState<PedidoActivo | null>(null);
  const [operando, setOperando] = useState(false);

  // Cálculo del total recaudado en el día a partir del historial
  const totalRecaudadoHoy = historialHoy
    .filter(p => p.estadoActual === 'PAGADO')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const cargarEstado = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const [cajaRes, pedidosRes, historialRes] = await Promise.allSettled([
        getCajaActiva(), 
        getPedidosActivos(),
        getHistorialPedidos(hoy, hoy)
      ]);
      setSesion(cajaRes.status === 'fulfilled' ? cajaRes.value : null);
      
      if (pedidosRes.status === 'fulfilled') {
        const entregados = pedidosRes.value.filter((p) => p.estadoActual === 'ENTREGADO');
        setPedidosEntregados(entregados);
        const docs = await Promise.all(entregados.map(async (p) => [p.id, await listarDocumentosCobro(p.id).catch(() => [])] as const));
        setDocumentosPorPedido(Object.fromEntries(docs));
      }

      if (historialRes.status === 'fulfilled') {
        // 🔥 FIX: Mapeo amplio para capturar PAGADO y cualquier variante terminada
        const listaHistorial = historialRes.value.filter((p: any) => p.estadoActual === 'PAGADO' || p.estadoActual === 'CANCELADO' || p.estadoActual === 'ENTREGADO');
        setHistorialHoy(listaHistorial);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    const es = new EventSource(`http://localhost:8080/api/kds/eventos?token=${token}`);
    es.addEventListener('PEDIDO_LISTO', () => cargarEstado()); 
    es.addEventListener('NUEVA_COMANDA', () => cargarEstado());
    return () => es.close();
  }, [cargarEstado]);

  const handleAccionCaja = (accion: 'ABRIR' | 'CERRAR') => {
    const monto = parseFloat(accion === 'ABRIR' ? montoApertura : montoCierre);
    if (isNaN(monto) || monto < 0) return sileo.error({ title: 'Monto inválido' });
    
    setConfirmDialog({
      isOpen: true,
      title: accion === 'ABRIR' ? 'Abrir Turno de Caja' : 'Arqueo y Cierre',
      message: accion === 'ABRIR' 
        ? `¿Confirmas la apertura con un fondo base de S/ ${monto.toFixed(2)}?` 
        : `¿Estás seguro de cerrar declarando S/ ${monto.toFixed(2)} físicos? Esta acción recalculará inventarios.`,
      type: accion === 'ABRIR' ? 'warning' : 'danger',
      requireInput: false,
      isProcessing: false,
      onConfirm: async () => {
        setOperando(true);
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          if (accion === 'ABRIR') {
            setSesion(await abrirCaja(monto));
            setMontoApertura('');
            sileo.success({ title: 'Caja Abierta' });
          } else {
            const cerrada = await cerrarCaja(sesion!.id, monto);
            setSesion(cerrada);
            setMontoCierre('');
            sileo.success({ title: 'Caja Cerrada', description: `Diferencia: ${cerrada.diferencia! >= 0 ? '+' : ''}S/ ${cerrada.diferencia?.toFixed(2)}` });
          }
        } catch (err: any) {
          sileo.error({ title: 'Error', description: err.response?.data?.message || err.message });
        } finally {
          setOperando(false);
          setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false }));
        }
      }
    });
  };

  if (loading) return <div className={`flex h-screen items-center justify-center font-black ${c.appBg} ${c.textMuted}`}><Loader2 size={48} className="animate-spin" /></div>;

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg} relative`}>
      <HeaderCajero user={user} theme={theme} changeTheme={changeTheme} logout={() => { logout(); navigate('/login'); }} />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: PANEL DE CAJA Y RESUMEN FINANCIERO */}
        <aside className={`w-full md:w-80 lg:w-[420px] ${c.panelBg} border-r ${c.border} flex flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-xl z-20`}>
          <div className="p-8 space-y-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-2`}>Estado del Turno</p>
              <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-inner ${!sesion || sesion.estado === 'CERRADA' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {!sesion || sesion.estado === 'CERRADA' ? <Lock size={32} /> : <Unlock size={32} />}
              </div>
              <h2 className={`text-3xl font-black tracking-tight ${c.textMain}`}>
                {!sesion || sesion.estado === 'CERRADA' ? 'Caja Cerrada' : 'Caja Abierta'}
              </h2>
              {sesion?.estado === 'ABIERTA' && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Fondo Base Inicial</p>
                    <p className="text-emerald-600 dark:text-emerald-300 font-black text-xl">S/ {sesion.montoInicial.toFixed(2)}</p>
                  </div>
                  {/* 🔥 NUEVO CUADRO: Total Recaudado en el Día */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Cobrado Hoy</p>
                      <p className="text-amber-600 dark:text-amber-300 font-black text-2xl tracking-tight">S/ {totalRecaudadoHoy.toFixed(2)}</p>
                    </div>
                    <TrendingUp size={32} className="text-amber-500 opacity-80" />
                  </div>
                </div>
              )}
            </div>

            <div className={`pt-4 border-t ${c.borderLight}`}>
              {!sesion || sesion.estado === 'CERRADA' ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1.5 block`}>Monto de Apertura (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} className={`w-full pl-10 pr-4 py-3.5 ${c.inputBg} border ${c.border} rounded-2xl text-lg font-black focus:outline-none ${c.ring}`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('ABRIR')} disabled={!montoApertura || operando} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-4 rounded-2xl font-black text-sm transition-transform active:scale-95 shadow-lg flex justify-center items-center gap-2`}>
                    Abrir Turno Ahora <ArrowRightCircle size={18} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1.5 block`}>Efectivo Físico Contado (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoCierre} onChange={e => setMontoCierre(e.target.value)} className={`w-full pl-10 pr-4 py-3.5 ${c.inputBg} border ${c.border} rounded-2xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-rose-500`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('CERRAR')} disabled={!montoCierre || operando} className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm transition-transform active:scale-95 shadow-lg shadow-rose-500/20 flex justify-center items-center gap-2">
                    <Lock size={18} /> Arqueo y Cierre
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL: ÓRDENES */}
        <main className={`flex-1 flex flex-col relative overflow-hidden ${c.appBg}`}>
          {(!sesion || sesion.estado === 'CERRADA') ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-rose-500/5 mb-6 border-2 border-dashed border-rose-500/20`}>
                <AlertTriangle size={48} className="text-rose-400 opacity-80" />
              </div>
              <h2 className={`text-4xl font-black tracking-tight ${c.textMain} mb-3`}>Sistema Bloqueado</h2>
              <p className={`text-lg font-medium ${c.textMuted} max-w-md`}>Para poder visualizar y cobrar las mesas del salón, primero debes aperturar tu turno de caja en el panel lateral.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`px-8 pt-8 pb-4 flex items-center justify-between border-b ${c.borderLight} shrink-0`}>
                <div className={`flex p-1.5 ${c.panelBg} rounded-xl border ${c.borderLight} shadow-sm`}>
                  <button onClick={() => setVistaActiva('POR_COBRAR')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'POR_COBRAR' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <FileText size={16} /> Por Cobrar
                    {pedidosEntregados.length > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md">{pedidosEntregados.length}</span>}
                  </button>
                  <button onClick={() => setVistaActiva('HISTORIAL')} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'HISTORIAL' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <History size={16} /> Historial de Hoy
                    {historialHoy.length > 0 && <span className="ml-2 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-md">{historialHoy.length}</span>}
                  </button>
                </div>
                <button onClick={cargarEstado} className={`${c.secondaryBtn} border ${c.border} px-5 py-2.5 rounded-xl text-xs font-black transition-transform active:scale-95 uppercase tracking-widest`}>
                  Actualizar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {/* VISTA 1: POR COBRAR */}
                {vistaActiva === 'POR_COBRAR' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {pedidosEntregados.map((pedido) => {
                      const docs = documentosPorPedido[pedido.id] || [];
                      const tieneSplit = docs.length > 0;
                      return (
                        <div key={pedido.id} className={`${c.cardBg} rounded-[2rem] border ${c.border} p-6 shadow-sm hover:shadow-xl transition-all flex flex-col group`}>
                          <div className={`flex justify-between items-start mb-6 border-b ${c.borderLight} pb-5`}>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Orden #{pedido.id}</p>
                              <h3 className={`text-2xl font-black tracking-tight mt-1 ${c.textMain}`}>{pedido.mesa || 'Llevar'}</h3>
                            </div>
                            <span className={`bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider`}>Entregado</span>
                          </div>
                          
                          <div className="flex-1 max-h-40 overflow-y-auto space-y-2 mb-6 custom-scrollbar pr-2">
                            {pedido.items.map((i) => (
                              <div key={i.detalleId} className={`flex justify-between text-sm font-medium ${c.textMuted} items-start`}>
                                <span className="pr-2 leading-tight">
                                  <span className={`font-black ${c.textMain}`}>{i.cantidad}x</span> {i.nombreProducto}
                                </span>
                                <span className={`font-black ${c.textMain} whitespace-nowrap`}>S/{i.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className={`mt-auto pt-5 border-t ${c.borderLight}`}>
                            <div className="flex items-end justify-between mb-5">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Total Final</span>
                              <span className="text-3xl font-black text-amber-500 tracking-tight leading-none">S/ {pedido.total.toFixed(2)}</span>
                            </div>
                            <div className="flex gap-2">
                              {!tieneSplit && (
                                <button onClick={() => setPedidoACobrar(pedido)} className={`flex-1 ${c.primaryBtn} text-sm font-black py-4 rounded-xl transition-transform active:scale-95 shadow-md`}>
                                  Cobrar
                                </button>
                              )}
                              <button onClick={() => setPedidoSplit(pedido)} className={`flex-1 ${c.secondaryBtn} border ${c.border} text-sm font-black py-4 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2`}>
                                <Split size={18} /> {tieneSplit ? 'Ver Split' : 'Dividir'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {pedidosEntregados.length === 0 && (
                      <div className={`col-span-full py-32 flex flex-col items-center justify-center ${c.cardBg} rounded-[2rem] border-2 border-dashed ${c.border} opacity-70`}>
                        <CircleCheck size={80} className={`${c.textMuted} mb-6 opacity-30`} />
                        <p className={`font-black text-4xl tracking-tight ${c.textMain}`}>Salón al día</p>
                        <p className={`text-base font-bold mt-3 ${c.textMuted}`}>No hay mesas pendientes de cobro.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* VISTA 2: HISTORIAL DE HOY */}
                {vistaActiva === 'HISTORIAL' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {historialHoy.length === 0 ? (
                      <div className={`text-center py-20 ${c.textMuted}`}><History size={48} className="mx-auto mb-4 opacity-30" /><p className="font-bold">No hay transacciones registradas hoy</p></div>
                    ) : (
                      historialHoy.map(p => (
                        <div key={p.id} className={`${c.cardBg} border ${c.border} rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg ${p.estadoActual === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              #{p.id}
                            </div>
                            <div>
                              <h3 className={`font-black text-lg ${c.textMain}`}>{p.mesa || 'Para Llevar'}</h3>
                              <p className={`text-xs font-bold ${c.textMuted}`}>{formatearFechaHoraPeru(p.fechaCreacion)}</p>
                              <span className={`inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${p.estadoActual === 'PAGADO' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{p.estadoActual}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Total Cobrado</p>
                              <p className={`text-xl font-black ${c.textMain}`}>S/ {p.total.toFixed(2)}</p>
                            </div>
                            {p.estadoActual === 'PAGADO' && (
                              <button onClick={() => imprimirTicketTexto(p.id)} className={`${c.secondaryBtn} border ${c.borderLight} p-3.5 rounded-xl hover:text-amber-500 transition-colors shadow-sm`}>
                                <Printer size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>

      <ModalConfirmacion {...confirmDialog} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
      {pedidoACobrar && sesion && <ModalPago pedido={pedidoACobrar} sesionId={sesion.id} c={c} onClose={() => setPedidoACobrar(null)} onPagado={() => { setPedidoACobrar(null); cargarEstado(); }} />}
      {pedidoSplit && sesion && <ModalSplitCuenta pedido={pedidoSplit} sesionId={sesion.id} c={c} onClose={() => setPedidoSplit(null)} onCambio={cargarEstado} />}
    </div>
  );
}