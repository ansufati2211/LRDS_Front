import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Lock, Unlock, Receipt, X, LogOut, CheckCircle, Printer, Bell, Ban, Split, CircleCheck } from 'lucide-react';
import { abrirCaja, cerrarCaja, getCajaActiva, procesarPago } from '@/api/caja';
import {
  getPedidosActivos,
  crearDocumentoCobro,
  listarDocumentosCobro,
  pagarDocumentoCobro,
} from '@/api/pedidos';
import type { DocumentoCobro } from '@/api/pedidos';
import { emitirDocumentoVenta, anularDocumentoVenta } from '@/api/documentosVenta';
import type { DocumentoVenta } from '@/api/documentosVenta';
import { useAuthStore } from '@/store/authStore';
import type { SesionCaja, PagoItem } from '@/api/caja';
import type { PedidoActivo } from '@/types';
import { formatearFechaHoraPeru, formatearHoraPeru } from '@/lib/datetimePeru';

const puedeAnular = (rol?: string) => rol === 'ROLE_GERENTE' || rol === 'ROLE_SUPER_ADMIN';

interface AvisoPedidoListo {
  pedidoId: number;
  numeroOrden: number;
  mesa: string;
  tipoConsumo: string;
  timestamp: Date;
}

const METODOS = ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'] as const;
type Metodo = typeof METODOS[number];

const METODO_ICON: Record<Metodo, string> = {
  EFECTIVO: '💵',
  YAPE: '💜',
  PLIN: '💚',
  TARJETA: '💳',
};

// ─── Selector de métodos de pago (multi-método, reutilizable) ─────────────────
interface SelectorPagosProps {
  total: number;
  onConfirmar: (pagos: PagoItem[]) => Promise<void>;
}

function SelectorPagos({ total, onConfirmar }: SelectorPagosProps) {
  const [pagos, setPagos] = useState<PagoItem[]>([{ metodoPago: 'EFECTIVO', monto: total }]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const totalPagado = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const vuelto = totalPagado - total;
  const saldoPendiente = total - totalPagado;

  const agregarMetodo = () => {
    setPagos((prev) => [...prev, { metodoPago: 'EFECTIVO', monto: Math.max(0, saldoPendiente) }]);
  };

  const quitarMetodo = (i: number) => setPagos((prev) => prev.filter((_, idx) => idx !== i));

  const actualizarPago = (i: number, campo: keyof PagoItem, valor: string | number) => {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  const handleConfirmar = async () => {
    if (saldoPendiente > 0.01) {
      setError(`Faltan S/ ${saldoPendiente.toFixed(2)} por cubrir.`);
      return;
    }
    setProcesando(true);
    setError('');
    try {
      await onConfirmar(pagos);
    } catch {
      setError('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Métodos de pago */}
      <div className="space-y-3">
        {pagos.map((pago, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={pago.metodoPago}
              onChange={(e) => actualizarPago(i, 'metodoPago', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {METODO_ICON[m]} {m}
                </option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
              <input
                type="number"
                min="0"
                step="0.10"
                value={pago.monto}
                onChange={(e) => actualizarPago(i, 'monto', parseFloat(e.target.value) || 0)}
                className="w-28 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            {pagos.length > 1 && (
              <button onClick={() => quitarMetodo(i)} className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        {pagos.length < 3 && (
          <button
            onClick={agregarMetodo}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium"
          >
            + Agregar otro método de pago
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Total a cobrar</span>
          <span className="font-semibold">S/ {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Recibido</span>
          <span className="font-semibold">S/ {totalPagado.toFixed(2)}</span>
        </div>
        {vuelto > 0.01 && (
          <div className="flex justify-between text-green-700 font-bold">
            <span>Vuelto</span>
            <span>S/ {vuelto.toFixed(2)}</span>
          </div>
        )}
        {saldoPendiente > 0.01 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Pendiente</span>
            <span>S/ {saldoPendiente.toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        onClick={handleConfirmar}
        disabled={procesando || saldoPendiente > 0.01}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition"
      >
        {procesando ? 'Procesando...' : `Confirmar cobro S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}

// ─── Modal de cobro directo de un pedido completo ─────────────────────────────
interface ModalPagoProps {
  pedido: PedidoActivo;
  sesionId: number;
  onClose: () => void;
  onPagado: () => void;
}

function ModalPago({ pedido, sesionId, onClose, onPagado }: ModalPagoProps) {
  const { user } = useAuthStore();
  const [exito, setExito] = useState(false);
  const [comprobante, setComprobante] = useState<DocumentoVenta | null>(null);
  const [anulando, setAnulando] = useState(false);

  const handleConfirmarPago = async (pagos: PagoItem[]) => {
    await procesarPago(pedido.id, sesionId, pagos);
    setExito(true);
    // Módulo 7: Nota de Venta se emite automáticamente al cobrar, sin paso extra del cajero
    try {
      const doc = await emitirDocumentoVenta({ tipo: 'NOTA_VENTA', pedidoId: pedido.id });
      setComprobante(doc);
    } catch {
      // El pago ya quedó registrado; si la emisión falla no revertimos el cobro
    }
  };

  const handleAnular = async () => {
    if (!comprobante) return;
    const motivo = window.prompt('Motivo de anulación (obligatorio):');
    if (!motivo || !motivo.trim()) return;
    setAnulando(true);
    try {
      const anulado = await anularDocumentoVenta(comprobante.id, motivo.trim());
      setComprobante(anulado);
    } finally {
      setAnulando(false);
    }
  };

  const imprimirTicket = () => {
    const token = useAuthStore.getState().token;
    window.open(`/api/pedidos/${pedido.id}/ticket?token=${token}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Encabezado */}
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Cobrar Pedido #{pedido.id}</h2>
            <p className="text-orange-100 text-sm">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {exito ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-900 mb-1">¡Pago registrado!</p>

            {comprobante ? (
              <div className={`mt-3 rounded-xl border p-4 text-left ${
                comprobante.estadoEmision === 'ANULADO' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-orange-50 border-orange-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nota de venta</span>
                  {comprobante.estadoEmision === 'ANULADO' && (
                    <span className="text-xs font-bold text-red-600">ANULADA</span>
                  )}
                </div>
                <p className="font-mono font-bold text-gray-900">{comprobante.numeroDocumento}</p>
                <p className="text-sm text-gray-500">S/ {comprobante.total.toFixed(2)}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">No se pudo emitir el comprobante automáticamente.</p>
            )}

            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={imprimirTicket}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition"
              >
                <Printer size={15} />
                Ver ticket
              </button>
              {comprobante && comprobante.estadoEmision !== 'ANULADO' && puedeAnular(user?.rol) && (
                <button
                  onClick={handleAnular}
                  disabled={anulando}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition disabled:opacity-50"
                >
                  <Ban size={15} />
                  {anulando ? 'Anulando...' : 'Anular comprobante'}
                </button>
              )}
            </div>

            <button
              onClick={onPagado}
              className="mt-6 w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Resumen de items */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 max-h-36 overflow-y-auto">
              {pedido.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.cantidad}x {item.nombreProducto}</span>
                  <span className="text-gray-500">S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1.5 mt-1.5 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-orange-600">S/ {pedido.total.toFixed(2)}</span>
              </div>
            </div>

            <SelectorPagos total={pedido.total} onConfirmar={handleConfirmarPago} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal de split de cuenta (Módulo 4) ──────────────────────────────────────
interface ModalSplitCuentaProps {
  pedido: PedidoActivo;
  sesionId: number;
  onClose: () => void;
  onCambio: () => Promise<void>;
}

function ModalSplitCuenta({ pedido, sesionId, onClose, onCambio }: ModalSplitCuentaProps) {
  const { user } = useAuthStore();
  const [documentos, setDocumentos] = useState<DocumentoCobro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [montoLibre, setMontoLibre] = useState('');
  const [creando, setCreando] = useState(false);
  const [docPagandoId, setDocPagandoId] = useState<number | null>(null);
  const [comprobantes, setComprobantes] = useState<Record<number, DocumentoVenta>>({});
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setDocumentos(await listarDocumentosCobro(pedido.id));
    } finally {
      setCargando(false);
    }
  }, [pedido.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const itemsActivos = pedido.items.filter((i) => i.estadoItem !== 'CANCELADO');
  const idsAsignados = new Set(documentos.flatMap((d) => d.detalleIds));
  const itemsDisponibles = itemsActivos.filter((i) => !idsAsignados.has(i.detalleId));

  const totalAsignado = documentos.reduce((s, d) => s + d.total, 0);
  const totalPorAsignar = pedido.total - totalAsignado;
  const totalPagado = documentos.filter((d) => d.estado === 'PAGADO').reduce((s, d) => s + d.total, 0);
  const pedidoCompletado = totalPagado >= pedido.total - 0.01;

  const toggleSeleccion = (detalleId: number) => {
    setSeleccionados((prev) => (prev.includes(detalleId) ? prev.filter((id) => id !== detalleId) : [...prev, detalleId]));
  };

  const handleCrearPorItems = async () => {
    if (seleccionados.length === 0) return;
    setCreando(true);
    try {
      await crearDocumentoCobro(pedido.id, { tipo: 'ITEMS', detalleIds: seleccionados });
      setSeleccionados([]);
      await cargar();
    } finally {
      setCreando(false);
    }
  };

  const handleCrearPorMonto = async () => {
    const monto = parseFloat(montoLibre);
    if (isNaN(monto) || monto <= 0 || monto > totalPorAsignar + 0.01) return;
    setCreando(true);
    try {
      await crearDocumentoCobro(pedido.id, { tipo: 'MONTO', monto });
      setMontoLibre('');
      await cargar();
    } finally {
      setCreando(false);
    }
  };

  const handlePagarDocumento = async (doc: DocumentoCobro, pagos: PagoItem[]) => {
    await pagarDocumentoCobro(doc.id, sesionId, pagos);
    try {
      const comp = await emitirDocumentoVenta({ tipo: 'NOTA_VENTA', documentoCobroId: doc.id });
      setComprobantes((prev) => ({ ...prev, [doc.id]: comp }));
    } catch {
      // El pago ya quedó registrado; si la emisión falla no revertimos el cobro
    }
    setDocPagandoId(null);
    await cargar();
    await onCambio();
  };

  const handleAnularComprobante = async (documentoCobroId: number) => {
    const comp = comprobantes[documentoCobroId];
    if (!comp) return;
    const motivo = window.prompt('Motivo de anulación (obligatorio):');
    if (!motivo || !motivo.trim()) return;
    setAnulandoId(documentoCobroId);
    try {
      const anulado = await anularDocumentoVenta(comp.id, motivo.trim());
      setComprobantes((prev) => ({ ...prev, [documentoCobroId]: anulado }));
    } finally {
      setAnulandoId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Dividir cuenta — Pedido #{pedido.id}</h2>
            <p className="text-orange-100 text-sm">{pedido.mesa || pedido.tipoConsumo} · Total S/ {pedido.total.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {pedidoCompletado && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700 text-sm font-semibold">
              <CircleCheck size={18} />
              Cuenta cobrada por completo
            </div>
          )}

          {/* Documentos ya creados */}
          {cargando ? (
            <p className="text-center text-gray-400 text-sm py-4">Cargando...</p>
          ) : documentos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Documentos de cobro</p>
              {documentos.map((doc) => {
                const comp = comprobantes[doc.id];
                return (
                  <div key={doc.id} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {doc.tipo === 'ITEMS' ? `${doc.detalleIds.length} ítem(s)` : 'Monto libre'}
                        </p>
                        <p className="text-xs text-gray-500">S/ {doc.total.toFixed(2)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        doc.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.estado}
                      </span>
                    </div>

                    {doc.estado === 'PENDIENTE' && docPagandoId === doc.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <SelectorPagos total={doc.total} onConfirmar={(pagos) => handlePagarDocumento(doc, pagos)} />
                      </div>
                    )}
                    {doc.estado === 'PENDIENTE' && docPagandoId !== doc.id && (
                      <button
                        onClick={() => setDocPagandoId(doc.id)}
                        className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition"
                      >
                        Cobrar este documento
                      </button>
                    )}
                    {doc.estado === 'PAGADO' && comp && (
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-mono text-gray-600">{comp.numeroDocumento}</span>
                        {comp.estadoEmision === 'ANULADO' ? (
                          <span className="font-bold text-red-600">ANULADA</span>
                        ) : puedeAnular(user?.rol) ? (
                          <button
                            onClick={() => handleAnularComprobante(doc.id)}
                            disabled={anulandoId === doc.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {anulandoId === doc.id ? 'Anulando...' : 'Anular'}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Crear nuevo documento */}
          {!pedidoCompletado && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Nuevo documento — S/ {totalPorAsignar.toFixed(2)} por asignar
              </p>

              {itemsDisponibles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Por ítems específicos</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {itemsDisponibles.map((item) => (
                      <label key={item.detalleId} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(item.detalleId)}
                          onChange={() => toggleSeleccion(item.detalleId)}
                        />
                        <span className="flex-1">{item.cantidad}x {item.nombreProducto}</span>
                        <span className="font-semibold text-gray-600">S/ {item.subtotal.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleCrearPorItems}
                    disabled={creando || seleccionados.length === 0}
                    className="w-full bg-gray-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold py-2.5 rounded-lg transition"
                  >
                    Crear documento con {seleccionados.length} ítem(s)
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-gray-500">O por monto libre</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.10"
                      value={montoLibre}
                      onChange={(e) => setMontoLibre(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <button
                    onClick={handleCrearPorMonto}
                    disabled={creando || !montoLibre}
                    className="bg-gray-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold px-4 rounded-lg transition"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function CajeroPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [sesion, setSesion] = useState<SesionCaja | null>(null);
  const [pedidosEntregados, setPedidosEntregados] = useState<PedidoActivo[]>([]);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [diferenciaCierre, setDiferenciaCierre] = useState<number | null>(null);
  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoActivo | null>(null);
  const [pedidoSplit, setPedidoSplit] = useState<PedidoActivo | null>(null);
  const [documentosPorPedido, setDocumentosPorPedido] = useState<Record<number, DocumentoCobro[]>>({});
  const [cargando, setCargando] = useState(true);
  const [operando, setOperando] = useState(false);
  const [error, setError] = useState('');
  // R2-8: avisos de pedidos LISTO que el mozo no ha retirado (escalación t=2min)
  const [avisos, setAvisos] = useState<AvisoPedidoListo[]>([]);

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    try {
      const [cajaData, pedidosData] = await Promise.allSettled([
        getCajaActiva(),
        getPedidosActivos(),
      ]);

      if (cajaData.status === 'fulfilled') {
        setSesion(cajaData.value);
      } else {
        setSesion(null); // 404 = no hay caja abierta
      }

      if (pedidosData.status === 'fulfilled') {
        const entregados = pedidosData.value.filter((p) => p.estadoActual === 'ENTREGADO');
        setPedidosEntregados(entregados);

        // Exclusividad cobro directo/split: solo ocultamos "Cobrar" si ya existe
        // al menos un DocumentoCobro para ese pedido (ver ModalSplitCuenta).
        const pares = await Promise.all(
          entregados.map(async (p) => [p.id, await listarDocumentosCobro(p.id).catch(() => [])] as const)
        );
        setDocumentosPorPedido(Object.fromEntries(pares));
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  // R2-8: SSE — recibe escalación nivel 2 (t=2min) cuando un pedido LISTO no fue retirado
  useEffect(() => {
    const token = useAuthStore.getState().token;
    const es = new EventSource(`/api/kds/eventos?token=${token}`);

    es.addEventListener('AVISO_PEDIDO_LISTO', (e) => {
      const data = JSON.parse(e.data) as AvisoPedidoListo;
      setAvisos((prev) => {
        if (prev.some((a) => a.pedidoId === data.pedidoId)) return prev;
        return [{ ...data, timestamp: new Date() }, ...prev];
      });
    });

    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoApertura);
    if (isNaN(monto) || monto < 0) { setError('Ingresa un monto válido'); return; }
    setOperando(true);
    setError('');
    try {
      const nueva = await abrirCaja(monto);
      setSesion(nueva);
      setMontoApertura('');
    } catch {
      setError('Error al abrir la caja.');
    } finally {
      setOperando(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!sesion) return;
    const monto = parseFloat(montoCierre);
    if (isNaN(monto) || monto < 0) { setError('Ingresa el monto físico de cierre'); return; }
    setOperando(true);
    setError('');
    try {
      const cerrada = await cerrarCaja(sesion.id, monto);
      setSesion(cerrada);
      setDiferenciaCierre(cerrada.diferencia);
      setMontoCierre('');
    } catch {
      setError('Error al cerrar la caja.');
    } finally {
      setOperando(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-orange-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Caja · La Ruta del Sabor</h1>
            <p className="text-xs text-gray-500">{user?.correo}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition"
        >
          <LogOut size={15} />
          Salir
        </button>
      </header>

      {cargando ? (
        <div className="flex items-center justify-center py-32 text-gray-400">Cargando...</div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* R2-8: avisos de pedidos LISTO sin retirar (escalación t=2min) */}
          {avisos.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-amber-600" />
                <span className="text-sm font-bold text-amber-800">
                  Pedidos listos sin retirar ({avisos.length})
                </span>
              </div>
              <div className="space-y-2">
                {avisos.map((aviso) => (
                  <div key={aviso.pedidoId} className="flex items-center justify-between bg-white rounded-xl px-4 py-2 border border-amber-100">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Orden #{aviso.numeroOrden}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        · {aviso.mesa || aviso.tipoConsumo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-600">
                        {formatearHoraPeru(aviso.timestamp)}
                      </span>
                      <button
                        onClick={() => setAvisos((prev) => prev.filter((a) => a.pedidoId !== aviso.pedidoId))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel apertura / cierre */}
          {(!sesion || sesion.estado === 'CERRADA') ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Unlock size={18} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Abrir caja</h2>
                  <p className="text-xs text-gray-500">Ingresa el efectivo inicial</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    placeholder="0.00"
                    value={montoApertura}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <button
                  onClick={handleAbrirCaja}
                  disabled={operando}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                >
                  {operando ? '...' : 'Abrir'}
                </button>
              </div>
              {diferenciaCierre !== null && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-semibold ${
                  diferenciaCierre >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  Última caja — Diferencia: {diferenciaCierre >= 0 ? '+' : ''}S/ {diferenciaCierre.toFixed(2)}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Lock size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900">Caja abierta</h2>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        ACTIVA
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Abierta: {sesion.fechaApertura ? formatearFechaHoraPeru(sesion.fechaApertura) : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Monto inicial</p>
                  <p className="text-xl font-black text-gray-900">S/ {sesion.montoInicial?.toFixed(2)}</p>
                </div>
              </div>

              {/* Cierre */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3">Cerrar caja — ingresa el efectivo físico contado</p>
                <div className="flex gap-2 max-w-xs">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">S/</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      placeholder="0.00"
                      value={montoCierre}
                      onChange={(e) => setMontoCierre(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                  <button
                    onClick={handleCerrarCaja}
                    disabled={operando}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                  >
                    {operando ? '...' : 'Cerrar caja'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pedidos entregados pendientes de cobro */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt size={18} className="text-orange-500" />
                Pedidos por cobrar
                {pedidosEntregados.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pedidosEntregados.length}
                  </span>
                )}
              </h2>
              <button onClick={cargarEstado} className="text-xs text-gray-400 hover:text-orange-500 transition">
                Actualizar
              </button>
            </div>

            {pedidosEntregados.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                <p>No hay pedidos pendientes de cobro</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosEntregados.map((pedido) => {
                  const docs = documentosPorPedido[pedido.id] ?? [];
                  const tieneSplit = docs.length > 0;
                  const abrirModal = (fn: () => void) => {
                    if (!sesion || sesion.estado !== 'ABIERTA') {
                      setError('Debes abrir la caja antes de cobrar.');
                      return;
                    }
                    fn();
                  };
                  return (
                    <div key={pedido.id} className="bg-white rounded-2xl border border-purple-200 p-4 shadow-sm shadow-purple-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold text-gray-900">#{pedido.id}</span>
                          <p className="text-xs text-gray-500">{pedido.mesa || pedido.tipoConsumo}</p>
                        </div>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                          ENTREGADO
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {pedido.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-600">{item.cantidad}x {item.nombreProducto}</span>
                            <span className="text-gray-500">S/ {item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                        <span className="text-base font-bold text-gray-900">S/ {pedido.total.toFixed(2)}</span>
                        <div className="flex gap-2">
                          {!tieneSplit && (
                            <button
                              onClick={() => abrirModal(() => setPedidoACobrar(pedido))}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
                            >
                              Cobrar
                            </button>
                          )}
                          <button
                            onClick={() => abrirModal(() => setPedidoSplit(pedido))}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            <Split size={13} />
                            {tieneSplit ? 'Ver división' : 'Dividir cuenta'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de cobro */}
      {pedidoACobrar && sesion && (
        <ModalPago
          pedido={pedidoACobrar}
          sesionId={sesion.id}
          onClose={() => setPedidoACobrar(null)}
          onPagado={async () => {
            setPedidoACobrar(null);
            await cargarEstado();
          }}
        />
      )}

      {/* Modal de split de cuenta */}
      {pedidoSplit && sesion && (
        <ModalSplitCuenta
          pedido={pedidoSplit}
          sesionId={sesion.id}
          onClose={() => setPedidoSplit(null)}
          onCambio={cargarEstado}
        />
      )}
    </div>
  );
}
