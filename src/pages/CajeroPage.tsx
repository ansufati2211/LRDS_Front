import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Lock, Unlock, Receipt, X, Split, CircleCheck, 
  FileText, Printer, Ban, Moon, Sun, ShieldAlert, Loader2,
  Banknote, ArrowRightCircle, AlertTriangle, History,
  TrendingUp, Smartphone, CreditCard, PieChart, ChevronDown, CheckCircle
} from 'lucide-react';
import { abrirCaja, cerrarCaja, getCajaActiva, procesarPago, getResumenCaja } from '@/api/caja';
import { getPedidosActivos, crearDocumentoCobro, listarDocumentosCobro, pagarDocumentoCobro, getHistorialPedidos } from '@/api/pedidos';
import { emitirDocumentoVenta, anularDocumentoVenta, listarPorPedido } from '@/api/documentosVenta';
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
    appBg: 'bg-slate-100', panelBg: 'bg-white', cardBg: 'bg-white', itemBg: 'bg-slate-50', 
    textMain: 'text-slate-900', textMuted: 'text-slate-500',
    border: 'border-slate-200', borderLight: 'border-slate-100',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200', 
    secondaryBtn: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm',
    inputBg: 'bg-white focus:bg-slate-50 text-slate-900', ring: 'focus:ring-indigo-500', iconBadge: 'bg-indigo-600 text-white'
  },
  dark: {
    appBg: 'bg-[#0f172a]', panelBg: 'bg-[#1e293b]', cardBg: 'bg-[#1e293b]', itemBg: 'bg-[#0b1120]', 
    textMain: 'text-white', textMuted: 'text-slate-400',
    border: 'border-slate-700', borderLight: 'border-slate-800',
    primaryBtn: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20', 
    secondaryBtn: 'bg-[#334155] hover:bg-[#475569] text-white border-transparent',
    inputBg: 'bg-[#0b1120] focus:bg-[#1e293b] text-white', ring: 'focus:ring-indigo-400', iconBadge: 'bg-indigo-500 text-white'
  }
};
type ThemeKey = 'light' | 'dark';

const METODOS_INFO: Record<string, { icon: React.ReactNode, label: string, color: string, bg: string }> = {
  'EFECTIVO': { icon: <Banknote size={18} />, label: 'Efectivo', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'YAPE': { icon: <Smartphone size={18} />, label: 'Yape', color: 'text-purple-600', bg: 'bg-purple-100' },
  'PLIN': { icon: <Smartphone size={18} />, label: 'Plin', color: 'text-sky-600', bg: 'bg-sky-100' },
  'TARJETA': { icon: <CreditCard size={18} />, label: 'Tarjeta', color: 'text-blue-600', bg: 'bg-blue-100' },
};

const puedeAnular = (rol?: string) => rol === 'ROLE_GERENTE_SEDE' || rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA';

const imprimirTicketTexto = async (pedidoId: number) => {
  try {
    const res = await api.get(`/pedidos/${pedidoId}/ticket`, { responseType: 'text' });
    const win = window.open('', '_blank', 'width=450,height=700');
    if (!win) return sileo.error({ title: 'Ventana bloqueada', description: 'Permite los popups en el navegador.' });
    
    win.document.write(`
      <html>
        <head>
          <title>Ticket #${pedidoId}</title>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; font-size: 13px; margin: 0; padding: 20px; color: #000; background: #fff;">
${res.data}
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
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
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-8 flex flex-col items-center text-center ${type === 'danger' ? 'bg-rose-50' : 'bg-indigo-50'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${type === 'danger' ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>
            {type === 'danger' ? <ShieldAlert size={40} /> : <AlertTriangle size={40} />}
          </div>
          <h2 className={`font-black text-2xl tracking-tight mb-3 ${type === 'danger' ? 'text-rose-700' : 'text-indigo-700'}`}>{title}</h2>
          <p className="text-sm font-bold text-slate-600 leading-relaxed">{message}</p>
        </div>
        {requireInput && (
          <div className="px-8 pt-4 pb-8 bg-white">
            <input autoFocus type={type === 'number' ? 'number' : 'text'} step="0.1" value={val} onChange={(e) => setVal(e.target.value)} placeholder={inputPlaceholder} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-slate-900 outline-none font-black text-lg text-center transition-all" />
          </div>
        )}
        <div className={`px-8 pb-8 flex gap-4 bg-white ${!requireInput ? 'pt-8' : ''}`}>
          <button onClick={onCancel} disabled={loading} className="flex-1 px-6 py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 active:scale-95 transition-transform">Volver</button>
          <button onClick={() => onConfirm(val)} disabled={loading || (requireInput && !val)} className={`flex-1 px-6 py-4 text-white rounded-2xl font-bold active:scale-95 transition-transform flex justify-center items-center gap-2 ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50 shadow-lg`}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Procesando' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectorPagos({ total, c, onConfirmar }: any) {
  const [pagos, setPagos] = useState<any[]>([{ metodoPago: 'EFECTIVO', monto: total === 0 ? '' : total, numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const [procesando, setProcesando] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState<number | null>(null);

  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const vuelto = totalPagado - total;
  const saldoPendiente = total - totalPagado;

  const agregarMetodo = () => setPagos((prev) => [...prev, { metodoPago: 'YAPE', monto: saldoPendiente > 0 ? saldoPendiente : '', numeroYape: '', ultimosDigitos: '', titular: '' }]);
  const quitarMetodo = (i: number) => setPagos((prev) => prev.filter((_, idx) => idx !== i));
  const actualizarPago = (i: number, campo: string, valor: string | number) => {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const handleConfirmar = async () => {
    if (saldoPendiente > 0.01) return sileo.error({ title: 'Falta Saldo', description: `Faltan S/ ${saldoPendiente.toFixed(2)} por cubrir.` });
    setProcesando(true);
    try { 
      const pagosLimpios = pagos.map(p => ({ ...p, monto: Number(p.monto) || 0 }));
      await onConfirmar(pagosLimpios); 
    } 
    catch (err: any) { sileo.error({ title: 'Error de Cobro', description: err.response?.data?.message || err.message }); } 
    finally { setProcesando(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {pagos.map((pago, i) => (
          <div key={i} className={`p-4 md:p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} space-y-4 shadow-sm`}>
            
            <div className="flex gap-2 items-center relative">
              <div className="relative flex-1 min-w-0">
                <button 
                  onClick={() => setDropdownAbierto(dropdownAbierto === i ? null : i)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 ${c.panelBg} border ${c.border} rounded-xl text-sm font-black outline-none transition-colors hover:border-indigo-400`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${METODOS_INFO[pago.metodoPago].bg} ${METODOS_INFO[pago.metodoPago].color}`}>
                      {METODOS_INFO[pago.metodoPago].icon}
                    </div>
                    <span className={c.textMain}>{METODOS_INFO[pago.metodoPago].label}</span>
                  </div>
                  <ChevronDown size={16} className={c.textMuted} />
                </button>

                {dropdownAbierto === i && (
                  <div className={`absolute top-full left-0 w-full mt-2 ${c.panelBg} border ${c.border} rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95`}>
                    {Object.entries(METODOS_INFO).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => { actualizarPago(i, 'metodoPago', key); setDropdownAbierto(null); }}
                        className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${c.textMain}`}
                      >
                        <div className={`p-1.5 rounded-lg ${info.bg} ${info.color}`}>{info.icon}</div>
                        {info.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative shrink-0">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${c.textMuted} font-bold`}>S/</span>
                <input 
                  type="number" min="0" step="0.10" value={pago.monto} 
                  onChange={(e) => actualizarPago(i, 'monto', e.target.value === '' ? '' : e.target.value)} 
                  className={`w-28 md:w-32 pl-8 pr-3 py-3.5 ${c.inputBg} border ${c.border} rounded-xl text-sm md:text-base font-black outline-none transition-colors focus:ring-2 focus:ring-indigo-500`} 
                />
              </div>
              {pagos.length > 1 && <button onClick={() => quitarMetodo(i)} className={`shrink-0 p-3.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors`}><X size={18} /></button>}
            </div>

            {(pago.metodoPago === 'YAPE' || pago.metodoPago === 'PLIN') && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={16} />
                <input type="text" placeholder="Nro de Operación / Celular" value={pago.numeroYape || ''} onChange={(e) => actualizarPago(i, 'numeroYape', e.target.value)} className={`w-full min-w-0 pl-11 pr-4 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`} />
              </div>
            )}

            {pago.metodoPago === 'TARJETA' && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="relative w-32 md:w-40 shrink-0">
                  <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.textMuted}`} size={16} />
                  <input type="text" placeholder="4 Dígitos" maxLength={4} value={pago.ultimosDigitos || ''} onChange={(e) => actualizarPago(i, 'ultimosDigitos', e.target.value.replace(/\D/g, ''))} className={`w-full min-w-0 pl-9 pr-2 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`} />
                </div>
                <input type="text" placeholder="Titular de la Tarjeta" value={pago.titular || ''} onChange={(e) => actualizarPago(i, 'titular', e.target.value)} className={`flex-1 min-w-0 px-4 py-3.5 text-xs md:text-sm font-bold border ${c.border} rounded-xl ${c.inputBg} outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`} />
              </div>
            )}
          </div>
        ))}
        {pagos.length < 3 && <button onClick={agregarMetodo} className="w-full py-4 border-2 border-dashed border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 rounded-xl text-xs font-black tracking-widest uppercase transition-colors">+ Añadir Pago Dividido</button>}
      </div>

      <div className={`${c.panelBg} border ${c.border} rounded-2xl p-6 space-y-3 text-sm font-bold shadow-lg`}>
        <div className={`flex justify-between ${c.textMuted}`}><span>Total a cobrar</span><span>S/ {total.toFixed(2)}</span></div>
        <div className={`flex justify-between ${c.textMuted}`}><span>Monto recibido</span><span>S/ {totalPagado.toFixed(2)}</span></div>
        {vuelto > 0.01 && <div className="flex justify-between text-emerald-500 font-black pt-3 border-t border-emerald-500/20"><span className="uppercase tracking-widest text-[10px]">Vuelto a entregar</span><span className="text-xl">S/ {vuelto.toFixed(2)}</span></div>}
        {saldoPendiente > 0.01 && <div className="flex justify-between text-rose-500 font-black pt-3 border-t border-rose-500/20"><span className="uppercase tracking-widest text-[10px]">Monto Faltante</span><span className="text-xl">S/ {saldoPendiente.toFixed(2)}</span></div>}
      </div>
      <button onClick={handleConfirmar} disabled={procesando || saldoPendiente > 0.01} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-5 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl`}>
        {procesando ? <Loader2 size={20} className="animate-spin" /> : <Banknote size={20} />}
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
      sileo.success({ title: '¡Transacción Exitosa!' });
    } catch (err: any) { sileo.error({ title: 'Atención', description: `Cobro realizado, pero el comprobante falló: ${err.message}` }); }
  };

  const handleAnular = () => {
    if (!comprobante) return;
    setConfirmDialog({
      isOpen: true, title: 'Anular Comprobante', message: 'Ingresa el motivo exacto de la anulación para auditoría.', type: 'danger', requireInput: true, inputPlaceholder: 'Ej. Error en los datos del cliente', isProcessing: false,
      onConfirm: async (motivo: string) => {
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          setComprobante(await anularDocumentoVenta(comprobante.id, motivo.trim()));
          sileo.success({ title: 'Comprobante Anulado' });
        } catch (err: any) { sileo.error({ title: 'Error al anular', description: err.message }); } 
        finally { setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className={`${c.panelBg} rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border ${c.border}`}>
        <div className="bg-emerald-500 px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-black text-2xl tracking-tight">Cobrar #{pedido.id}</h2>
            <p className="text-emerald-100 font-bold text-sm mt-0.5">{pedido.mesa || 'Para Llevar'}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-rose-500 p-2.5 rounded-full active:scale-95 transition-all"><X size={20} /></button>
        </div>
        
        {exito ? (
          <div className="p-10 text-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <p className={`text-4xl font-black ${c.textMain} tracking-tight mb-2`}>¡Pagado!</p>
            <p className={`text-sm font-bold ${c.textMuted}`}>La cuenta ha sido saldada.</p>
            
            {comprobante && (
              <div className={`mt-8 rounded-2xl border ${c.border} p-6 text-left ${comprobante.estadoEmision === 'ANULADO' ? 'opacity-50' : c.itemBg} shadow-sm`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-black uppercase tracking-widest ${c.textMuted}`}>{comprobante.tipo.replace('_', ' ')}</span>
                  {comprobante.estadoEmision === 'ANULADO' && <span className="text-[10px] font-black text-white bg-rose-500 px-3 py-1 rounded-lg uppercase tracking-widest">Anulada</span>}
                </div>
                <p className={`font-mono font-black ${c.textMain} text-2xl tracking-tight`}>{comprobante.serie}-{String(comprobante.correlativo).padStart(6, '0')}</p>
                <p className={`text-lg font-black text-indigo-500 mt-1`}>S/ {comprobante.total.toFixed(2)}</p>
              </div>
            )}
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => imprimirTicketTexto(pedido.id)} className={`w-full ${c.secondaryBtn} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 flex items-center justify-center gap-2`}>
                <Printer size={18} /> Imprimir Ticket
              </button>
              {comprobante?.estadoEmision !== 'ANULADO' && puedeAnular(user?.rol) && (
                <button onClick={handleAnular} className="w-full text-rose-500 hover:text-rose-700 bg-rose-500/10 font-bold py-4 rounded-xl text-sm flex justify-center items-center gap-2 transition-transform active:scale-95">
                  <Ban size={18} /> Anular Comprobante
                </button>
              )}
              <button onClick={onPagado} className={`w-full ${c.primaryBtn} font-black py-4 rounded-xl text-sm transition-transform active:scale-95 mt-4`}>Finalizar y Cerrar</button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className={`${c.itemBg} rounded-2xl p-5 space-y-3 max-h-40 overflow-y-auto border ${c.borderLight} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-inner`}>
              {pedido.items.map((item: any, i: number) => (
                <div key={i} className={`flex justify-between text-sm ${item.estadoItem === 'CANCELADO' ? 'opacity-40 line-through' : ''}`}>
                  <span className={`${c.textMain} font-bold`}><span className="text-indigo-500">{item.cantidad}x</span> {item.nombreProducto}</span>
                  <span className={`${c.textMuted} font-black`}>S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <label className={`block text-xs font-black uppercase tracking-widest ${c.textMuted}`}>Comprobante de Venta</label>
              <div className={`flex p-1.5 ${c.appBg} rounded-xl border ${c.border}`}>
                {(['NOTA_VENTA', 'BOLETA', 'FACTURA'] as const).map(t => (
                  <button key={t} onClick={() => setTipoDoc(t)} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${tipoDoc === t ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    {t === 'NOTA_VENTA' ? 'Nota' : t === 'BOLETA' ? 'Boleta' : 'Factura'}
                  </button>
                ))}
              </div>
              {tipoDoc !== 'NOTA_VENTA' && (
                <div className="space-y-3 animate-in fade-in pt-3">
                  <input 
                    type="text" 
                    placeholder={tipoDoc === 'FACTURA' ? 'RUC (11 dígitos)' : 'DNI (Opcional - Máx 8)'} 
                    maxLength={tipoDoc === 'FACTURA' ? 11 : 8} 
                    value={numeroDocReceptor} 
                    onChange={e => setNumeroDocReceptor(e.target.value.replace(/\D/g, ''))} 
                    className={`w-full min-w-0 px-5 py-4 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c.inputBg} transition-colors`} 
                  />
                  <input type="text" placeholder="Razón Social / Nombre" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={`w-full min-w-0 px-5 py-4 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c.inputBg} transition-colors`} />
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

        <div className="flex-1 overflow-y-auto p-8 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                            <input 
                              type="text" 
                              placeholder={tipoDocSplit === 'FACTURA' ? 'RUC (11)' : 'DNI (8)'} 
                              maxLength={tipoDocSplit === 'FACTURA' ? 11 : 8} 
                              value={rucSplit} 
                              onChange={e => setRucSplit(e.target.value.replace(/\D/g, ''))} 
                              className={`w-1/3 min-w-0 px-4 py-3.5 border ${c.borderLight} rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c.inputBg}`} 
                            />
                            <input type="text" placeholder="Razón Social / Nombre" value={razonSocialSplit} onChange={e => setRazonSocialSplit(e.target.value)} className={`w-2/3 min-w-0 px-4 py-3.5 border ${c.borderLight} rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c.inputBg}`} />
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
                  <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2">
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
                  <input type="number" min="0" max={totalPorAsignar} step="0.10" value={montoLibre} onChange={(e) => setMontoLibre(e.target.value)} placeholder="0.00" className={`w-full min-w-0 px-4 py-3.5 border ${c.border} rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${c.inputBg}`} />
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
    <header className="bg-slate-950 border-b border-slate-900 px-8 py-5 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-4">
        <div className="bg-white p-3 rounded-2xl"><Receipt className="text-slate-900 w-6 h-6" strokeWidth={2.5} /></div>
        <div>
          <h1 className="text-2xl font-black text-white leading-none tracking-tight">VERONICA Caja</h1>
          <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Operador: <span className="text-white">{user?.nombre || user?.correo}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <button onClick={() => changeTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="h-10 w-px bg-slate-800 mx-2"></div>
        <button onClick={logout} className="flex items-center gap-2 p-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all">
          <LogOut size={20} /> Salir
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
  const [resumenPagos, setResumenPagos] = useState<Record<string, number>>({}); 
  const [vistaActiva, setVistaActiva] = useState<'POR_COBRAR' | 'HISTORIAL' | 'ARQUEO'>('POR_COBRAR');

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

  const getFechaLocalHoy = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  };

  const cargarEstado = useCallback(async () => {
    try {
      const hoy = getFechaLocalHoy();
      const [cajaRes, pedidosRes, historialRes] = await Promise.allSettled([
        getCajaActiva(), 
        getPedidosActivos(),
        getHistorialPedidos(hoy, hoy)
      ]);
      
      let cajaActiva = null;
      if (cajaRes.status === 'fulfilled' && cajaRes.value) {
        cajaActiva = cajaRes.value;
        setSesion(cajaActiva);
        if (cajaActiva.estado === 'ABIERTA') {
          const resumen = await getResumenCaja().catch(() => ({}));
          setResumenPagos(resumen);
        }
      } else {
        setSesion(null);
      }
      
      if (pedidosRes.status === 'fulfilled') {
        const entregados = pedidosRes.value.filter((p) => p.estadoActual === 'ENTREGADO');
        setPedidosEntregados(entregados);
        const docs = await Promise.all(entregados.map(async (p) => [p.id, await listarDocumentosCobro(p.id).catch(() => [])] as const));
        setDocumentosPorPedido(Object.fromEntries(docs));
      }

      if (historialRes.status === 'fulfilled') {
        const listaHistorial = historialRes.value.filter((p: any) => p.estadoActual === 'PAGADO' || p.estadoActual === 'ENTREGADO');
        
        const comprobantes = await Promise.all(
          listaHistorial.map(p => listarPorPedido(p.id).catch(() => []))
        );
        
        const historialConDocs = listaHistorial.map((p, i) => ({
           ...p,
           documentosVenta: comprobantes[i] || []
        }));
        
        setHistorialHoy(historialConDocs.sort((a,b) => b.id - a.id));
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
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
      isOpen: true, title: accion === 'ABRIR' ? 'Aperturar Turno' : 'Arqueo de Caja',
      message: accion === 'ABRIR' 
        ? `¿Confirmas la apertura con S/ ${monto.toFixed(2)}?` 
        : `Vas a declarar S/ ${monto.toFixed(2)} físicos en la caja. El sistema validará los descuadres.`,
      type: accion === 'ABRIR' ? 'warning' : 'danger', requireInput: false, isProcessing: false,
      onConfirm: async () => {
        setOperando(true);
        setConfirmDialog((p: any) => ({ ...p, loading: true }));
        try {
          if (accion === 'ABRIR') {
            await abrirCaja(monto);
            setMontoApertura(''); sileo.success({ title: '¡Turno Iniciado!' });
          } else {
            const cerrada = await cerrarCaja(sesion!.id, monto);
            setMontoCierre(''); setVistaActiva('POR_COBRAR');
            sileo.success({ title: 'Turno Cerrado', description: `Diferencia de Arqueo: ${cerrada.diferencia! >= 0 ? '+' : ''}S/ ${cerrada.diferencia?.toFixed(2)}` });
          }
          await cargarEstado();
        } catch (err: any) { sileo.error({ title: 'Error', description: err.response?.data?.message || err.message }); } 
        finally { setOperando(false); setConfirmDialog((p: any) => ({ ...p, isOpen: false, loading: false })); }
      }
    });
  };

  if (loading) return <div className={`flex h-screen items-center justify-center font-black ${c.appBg} ${c.textMuted}`}><Loader2 size={64} className="animate-spin" /></div>;

  const totalEfectivo = (resumenPagos['EFECTIVO'] || 0);
  const totalDigital = (resumenPagos['YAPE'] || 0) + (resumenPagos['PLIN'] || 0) + (resumenPagos['TARJETA'] || 0) + (resumenPagos['TRANSFERENCIA'] || 0);
  const granTotal = totalEfectivo + totalDigital;

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-300 ${c.appBg} relative`}>
      <HeaderCajero user={user} theme={theme} changeTheme={changeTheme} logout={() => { logout(); navigate('/login'); }} />

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: PANEL DE CAJA */}
        <aside className={`w-full md:w-96 lg:w-[420px] ${c.panelBg} border-r ${c.border} flex flex-col shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shadow-2xl z-20`}>
          <div className="p-10 space-y-8">
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-3`}>Estado de Caja</p>
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner transition-colors ${!sesion || sesion.estado === 'CERRADA' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {!sesion || sesion.estado === 'CERRADA' ? <Lock size={48} /> : <Unlock size={48} />}
              </div>
              <h2 className={`text-5xl font-black tracking-tight ${c.textMain} mb-2`}>
                {!sesion || sesion.estado === 'CERRADA' ? 'Cerrado' : 'Abierto'}
              </h2>
              {sesion?.estado === 'ABIERTA' && (
                <div className="mt-6 space-y-4 animate-in fade-in">
                  <div className={`p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} shadow-sm`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Aperturado el</p>
                    <p className={`font-black text-sm ${c.textMain}`}>{formatearFechaHoraPeru(sesion.fechaApertura)}</p>
                  </div>
                  <div className={`p-5 rounded-[1.5rem] border ${c.borderLight} ${c.itemBg} shadow-sm flex items-center justify-between`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Fondo de Inicio</p>
                      <p className={`font-black text-3xl tracking-tight ${c.textMain}`}>S/ {sesion.montoInicial.toFixed(2)}</p>
                    </div>
                    <Banknote size={32} className={c.textMuted} />
                  </div>
                </div>
              )}
            </div>

            <div className={`pt-8 border-t ${c.borderLight}`}>
              {!sesion || sesion.estado === 'CERRADA' ? (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-2 block`}>Fondo Base para dar Vuelto (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} className={`w-full min-w-0 pl-12 pr-5 py-5 ${c.inputBg} border-2 ${c.border} rounded-2xl text-xl font-black focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('ABRIR')} disabled={!montoApertura || operando} className={`w-full ${c.primaryBtn} disabled:opacity-50 py-5 rounded-2xl font-black text-base transition-transform active:scale-95 flex justify-center items-center gap-2`}>
                    Comenzar Turno <ArrowRightCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-2 block`}>Dinero Físico en Caja Registradora (S/)</label>
                    <div className="relative">
                      <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-sm ${c.textMuted}`}>S/</span>
                      <input type="number" min="0" step="0.5" value={montoCierre} onChange={e => setMontoCierre(e.target.value)} className={`w-full min-w-0 pl-12 pr-5 py-5 ${c.inputBg} border-2 ${c.border} rounded-2xl text-xl font-black focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all`} placeholder="0.00" />
                    </div>
                  </div>
                  <button onClick={() => handleAccionCaja('CERRAR')} disabled={!montoCierre || operando} className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-base transition-transform active:scale-95 shadow-xl shadow-rose-500/20 flex justify-center items-center gap-2">
                    <Lock size={20} /> Ejecutar Cierre
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL: TABS */}
        <main className={`flex-1 flex flex-col relative overflow-hidden ${c.appBg}`}>
          {(!sesion || sesion.estado === 'CERRADA') ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className={`w-40 h-40 rounded-full flex items-center justify-center bg-rose-500/5 mb-8 border-2 border-dashed border-rose-500/20`}>
                <AlertTriangle size={64} className="text-rose-400 opacity-80" />
              </div>
              <h2 className={`text-5xl font-black tracking-tight ${c.textMain} mb-4`}>Terminal Inactiva</h2>
              <p className={`text-xl font-medium ${c.textMuted} max-w-lg`}>Debes aperturar la caja indicando el fondo base para poder visualizar y gestionar las transacciones.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* NAVEGACIÓN SUPERIOR */}
              <div className={`px-10 pt-10 pb-6 flex items-center justify-between shrink-0`}>
                <div className={`flex p-2 ${c.panelBg} rounded-2xl border ${c.border} shadow-sm`}>
                  <button onClick={() => setVistaActiva('POR_COBRAR')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'POR_COBRAR' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <FileText size={18} /> Salón 
                    {pedidosEntregados.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-md">{pedidosEntregados.length}</span>}
                  </button>
                  <button onClick={() => setVistaActiva('HISTORIAL')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'HISTORIAL' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <History size={18} /> Comprobantes
                  </button>
                  <button onClick={() => setVistaActiva('ARQUEO')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${vistaActiva === 'ARQUEO' ? c.primaryBtn : `${c.textMuted} hover:${c.textMain}`}`}>
                    <PieChart size={18} /> Arqueo
                  </button>
                </div>
                <button onClick={cargarEstado} className={`${c.secondaryBtn} border ${c.border} px-6 py-3 rounded-2xl text-xs font-black transition-transform active:scale-95 uppercase tracking-widest flex items-center gap-2`}>
                  <TrendingUp size={16} /> Refrescar
                </button>
              </div>

              {/* VISTA 1: SALÓN POR COBRAR */}
              <div className="flex-1 overflow-y-auto px-10 pb-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {vistaActiva === 'POR_COBRAR' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in">
                    {pedidosEntregados.map((pedido) => {
                      const docs = documentosPorPedido[pedido.id] || [];
                      const tieneSplit = docs.length > 0;
                      return (
                        <div key={pedido.id} className={`${c.cardBg} rounded-[2.5rem] border ${c.border} p-8 shadow-sm hover:shadow-2xl transition-all flex flex-col group`}>
                          <div className={`flex justify-between items-start mb-6 border-b ${c.borderLight} pb-6`}>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Orden #{pedido.id}</p>
                              <h3 className={`text-3xl font-black tracking-tight mt-1.5 ${c.textMain}`}>{pedido.mesa || 'Llevar'}</h3>
                            </div>
                            <span className={`bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider`}>Entregado</span>
                          </div>
                          
                          <div className="flex-1 max-h-48 overflow-y-auto space-y-3 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-3">
                            {pedido.items.map((i) => (
                              <div key={i.detalleId} className={`flex justify-between text-sm font-medium ${c.textMuted} items-start bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl`}>
                                <span className="pr-2 leading-tight">
                                  <span className={`font-black ${c.textMain}`}>{i.cantidad}x</span> {i.nombreProducto}
                                </span>
                                <span className={`font-black ${c.textMain} whitespace-nowrap`}>S/{i.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className={`mt-auto pt-6 border-t ${c.borderLight}`}>
                            <div className="flex items-end justify-between mb-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Monto a Cobrar</span>
                              <span className="text-4xl font-black text-amber-500 tracking-tight leading-none">S/ {pedido.total.toFixed(2)}</span>
                            </div>
                            <button onClick={() => setPedidoACobrar(pedido)} className={`w-full ${c.primaryBtn} text-base font-black py-5 rounded-2xl transition-transform active:scale-95 shadow-lg`}>
                              Procesar Pago
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {pedidosEntregados.length === 0 && (
                      <div className={`col-span-full py-32 flex flex-col items-center justify-center ${c.cardBg} rounded-[3rem] border-2 border-dashed ${c.border} opacity-70`}>
                        <CircleCheck size={80} className={`${c.textMuted} mb-6 opacity-30`} />
                        <p className={`font-black text-4xl tracking-tight ${c.textMain}`}>Salón al día</p>
                        <p className={`text-lg font-bold mt-3 ${c.textMuted}`}>No hay mesas pendientes de cobro.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* VISTA 2: HISTORIAL Y DOCUMENTOS */}
                {vistaActiva === 'HISTORIAL' && (
                  <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in">
                    {historialHoy.length === 0 ? (
                      <div className={`text-center py-20 ${c.textMuted}`}><History size={56} className="mx-auto mb-5 opacity-30" /><p className="font-bold text-lg">No hay transacciones registradas hoy</p></div>
                    ) : (
                      historialHoy.map(p => (
                        <div key={p.id} className={`${c.cardBg} border ${c.border} rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center font-black text-xl ${p.estadoActual === 'PAGADO' || p.estadoActual === 'ENTREGADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              #{p.id}
                            </div>
                            <div>
                              <h3 className={`font-black text-2xl tracking-tight ${c.textMain}`}>{p.mesa || 'Para Llevar'}</h3>
                              <p className={`text-xs font-bold ${c.textMuted} mt-1`}>{formatearFechaHoraPeru(p.fechaCreacion)}</p>
                              <div className="flex gap-2 mt-3">
                                {p.documentosVenta?.map((doc: any) => (
                                  <span key={doc.id} className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${doc.tipo === 'FACTURA' ? 'border-purple-300 text-purple-700 bg-purple-50' : doc.tipo === 'BOLETA' ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-slate-300 text-slate-700 bg-slate-100'}`}>
                                    {doc.tipo.replace('_', ' ')}: {doc.serie}-{doc.correlativo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
                            <div className="text-right">
                              <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted}`}>Total</p>
                              <p className={`text-2xl font-black ${c.textMain}`}>S/ {p.total.toFixed(2)}</p>
                            </div>
                            <button onClick={() => imprimirTicketTexto(p.id)} className={`${c.secondaryBtn} border ${c.border} p-4 rounded-2xl hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all shadow-sm`} title="Imprimir Ticket">
                              <Printer size={24} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* VISTA 3: ARQUEO FINANCIERO */}
                {vistaActiva === 'ARQUEO' && (
                  <div className="max-w-5xl mx-auto animate-in fade-in">
                    <h3 className={`text-2xl font-black ${c.textMain} mb-8 tracking-tight`}>Resumen de Operaciones del Turno</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* EFECTIVO */}
                      <div className={`${c.panelBg} rounded-[2rem] border ${c.border} p-8 shadow-sm flex items-center gap-6`}>
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                          <Banknote size={32} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Total Efectivo Físico</p>
                          <p className={`text-4xl font-black ${c.textMain} tracking-tight`}>S/ {totalEfectivo.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* DIGITAL GLOBAL */}
                      <div className={`${c.panelBg} rounded-[2rem] border ${c.border} p-8 shadow-sm flex items-center gap-6`}>
                        <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                          <TrendingUp size={32} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Total Cobros Digitales</p>
                          <p className={`text-4xl font-black ${c.textMain} tracking-tight`}>S/ {totalDigital.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* DESGLOSE DIGITAL */}
                      <div className="md:col-span-2 grid grid-cols-3 gap-6">
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><Smartphone size={20} className="text-purple-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Yape</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['YAPE'] || 0).toFixed(2)}</p>
                        </div>
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><Smartphone size={20} className="text-sky-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Plin</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['PLIN'] || 0).toFixed(2)}</p>
                        </div>
                        <div className={`${c.itemBg} rounded-[1.5rem] border ${c.borderLight} p-6 text-center shadow-sm`}>
                          <div className="flex justify-center mb-2"><CreditCard size={20} className="text-blue-500"/></div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${c.textMuted} mb-1`}>Tarjetas</p>
                          <p className={`text-2xl font-black ${c.textMain}`}>S/ {(resumenPagos['TARJETA'] || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* GRAN TOTAL */}
                      <div className={`md:col-span-2 bg-slate-900 rounded-[2rem] p-10 shadow-xl flex items-center justify-between border border-slate-800`}>
                        <div>
                          <p className={`text-sm font-black uppercase tracking-widest text-slate-400 mb-2`}>Ingresos Globales del Turno</p>
                          <p className={`text-6xl font-black text-white tracking-tight`}>S/ {granTotal.toFixed(2)}</p>
                        </div>
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                          <PieChart size={48} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ModalConfirmacion {...confirmDialog} onCancel={() => setConfirmDialog((p: any) => ({ ...p, isOpen: false }))} />
      {pedidoACobrar && sesion && <ModalPago pedido={pedidoACobrar} sesionId={sesion.id} c={c} onClose={() => setPedidoACobrar(null)} onPagado={() => { setPedidoACobrar(null); cargarEstado(); }} />}
    </div>
  );
}