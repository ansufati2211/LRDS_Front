import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, Box, RotateCcw, X, CheckCircle, ChevronDown } from 'lucide-react';
import { getInsumos, crearInsumo, actualizarInsumo, eliminarInsumo, activarInsumo } from '@/api/inventario';
import type { Insumo, InsumoRequestDTO } from '@/api/inventario';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mt-2">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-3 bg-[#FFC640] hover:bg-amber-400 text-black font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-lg shadow-[#FFC640]/30 transition-all">Sí, confirmar</button>
        </div>
      </div>
    </div>
  );
}

function ModalInsumo({ insumo, onClose, onGuardar }: { insumo?: Insumo | null; onClose: () => void; onGuardar: () => void; }) {
  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [unidadMedida, setUnidadMedida] = useState(insumo?.unidadMedida || 'KG');
  const [loading, setLoading] = useState(false);

  // 🔥 NUEVOS ESTADOS Y REF PARA EL SELECTOR DE UNIDAD CUSTOM
  const [isUnidadOpen, setIsUnidadOpen] = useState(false);
  const unidadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unidadRef.current && !unidadRef.current.contains(event.target as Node)) {
        setIsUnidadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unidades = [
    { value: 'KG', label: 'KG (Kilogramos)' },
    { value: 'GR', label: 'GR (Gramos)' },
    { value: 'LT', label: 'LT (Litros)' },
    { value: 'ML', label: 'ML (Mililitros)' },
    { value: 'UND', label: 'UND (Unidades)' },
    { value: 'PAQ', label: 'PAQ (Paquetes)' },
    { value: 'LAT', label: 'LAT (Latas)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return sileo.error({ title: 'El nombre es obligatorio' });
    if (!unidadMedida.trim()) return sileo.error({ title: 'La unidad de medida es obligatoria' });
    
    setLoading(true);
    try {
      const payload: InsumoRequestDTO = { nombre, unidadMedida, stockMinimo: 0 };
      
      if (insumo) {
        await actualizarInsumo(insumo.id, payload);
        sileo.success({ title: 'Insumo actualizado correctamente' });
      } else {
        await crearInsumo(payload);
        sileo.success({ title: 'Insumo creado correctamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.error || err.response?.data?.message || 'Error al guardar el insumo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-20 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <Box className="text-orange-500" size={20} />
            {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Insumo / Producto</label>
            <input 
              autoFocus value={nombre} onChange={e => setNombre(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="Ej. Tomate, Coca Cola, etc." 
            />
          </div>

          {/* 🔥 SELECTOR DE UNIDAD CUSTOMIZADO */}
          <div className="relative" ref={unidadRef}>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Unidad de Medida</label>
            <div 
              onClick={() => setIsUnidadOpen(!isUnidadOpen)}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl transition-all font-bold text-gray-900 flex justify-between items-center cursor-pointer select-none ${isUnidadOpen ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span>{unidades.find(u => u.value === unidadMedida)?.label || 'Seleccionar...'}</span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isUnidadOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </div>

            {isUnidadOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {unidades.map(u => (
                    <li 
                      key={u.value}
                      onClick={() => {
                        setUnidadMedida(u.value);
                        setIsUnidadOpen(false);
                      }}
                      className={`px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors ${unidadMedida === u.value ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      {u.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
            <p className="text-xs text-orange-800 font-medium">
              Nota: El stock físico y costos se gestionan en <strong>Kardex & Movimientos</strong>.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-[#FFC640] hover:bg-amber-400 text-black font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-lg shadow-[#FFC640]/30 transition-all">
              {loading ? 'Guardando...' : 'Guardar Insumo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function InventarioPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  const [modal, setModal] = useState<{ isOpen: boolean; data?: Insumo | null }>({ isOpen: false });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInsumos(sedeSeleccionadaId || undefined);
      setInsumos(data);
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionadaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Inhabilitar Insumo?',
      message: '¿Estás seguro de inhabilitar este insumo del almacén?',
      action: async () => {
        try { 
          await eliminarInsumo(id); 
          sileo.success({ title: 'Insumo enviado a inhabilitados' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al inhabilitar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Insumo?',
      message: '¿Deseas restaurar este insumo al almacén?',
      action: async () => {
        try { 
          await activarInsumo(id); 
          sileo.success({ title: 'Insumo restaurado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const filtrados = insumos.filter(i => 
    (tab === 'ACTIVOS' ? i.estadoRegistro : !i.estadoRegistro) &&
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Almacén <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Central</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Gestión de insumos y materia prima.</p>
          </div>
        </div>

        <div className="bg-slate-100/80 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-5">
          
          <div className="flex p-1.5 bg-gray-200/50 rounded-2xl w-full xl:w-auto border border-gray-200/50">
            <button 
              onClick={() => setTab('ACTIVOS')} 
              className={`flex-1 xl:w-40 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'ACTIVOS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              Activos
            </button>
            <button 
              onClick={() => setTab('INACTIVOS')} 
              className={`flex-1 xl:w-40 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'INACTIVOS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              Inhabilitados
            </button>
          </div>

          <div className="hidden xl:block w-px h-8 bg-slate-300"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-orange-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar insumo..." 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
                className="bg-transparent text-gray-900 text-sm font-semibold outline-none w-full placeholder-gray-400" 
              />
            </div>
            {isAdmin && tab === 'ACTIVOS' && (
              <button 
                onClick={() => setModal({ isOpen: true, data: null })} 
                className="w-full sm:w-auto bg-[#FFC640] hover:bg-amber-400 text-black shadow-lg shadow-[#FFC640]/30 px-6 py-3 rounded-xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} /> Nuevo Insumo
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="font-bold text-gray-400 animate-pulse">Consultando almacén...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Box size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-1">{tab === 'ACTIVOS' ? 'Almacén Vacío' : 'Papelera Limpia'}</h3>
              <p className="text-sm font-medium">No se encontraron insumos en esta sección.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider">Insumo</th>
                    <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider text-center">Und.</th>
                    <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider text-right">Stock Local</th>
                    <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider text-right">Costo Estimado</th>
                    <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider text-center">Estado</th>
                    {isAdmin && <th className="px-8 py-5 font-black text-xs text-gray-400 uppercase tracking-wider text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(i => {
                    const stock = Number(i.stockActual) || 0;
                    const minimo = Number(i.stockMinimo) || 0;
                    const costo = Number(i.costoUnitario) || 0;
                    const critico = stock <= minimo && minimo > 0;

                    return (
                      <tr key={i.id} className={`hover:bg-gray-50/50 transition-colors group ${!i.estadoRegistro ? 'opacity-60 grayscale' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${tab === 'ACTIVOS' ? 'bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500 group-hover:border-orange-200' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                              <Box size={18} />
                            </div>
                            <span className="font-black text-gray-900 text-[15px]">{i.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs tracking-widest">{i.unidadMedida}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {critico && tab === 'ACTIVOS' && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                            <span className={`font-black text-lg ${critico && tab === 'ACTIVOS' ? 'text-red-600' : 'text-slate-700'}`}>{stock.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-mono font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            S/ {costo.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {!i.estadoRegistro ? (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-200 border border-slate-300">
                               INHABILITADO
                             </span>
                          ) : critico ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-100">
                              <AlertTriangle size={14}/> Bajo Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100">
                              <CheckCircle size={14}/> OK
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                        <td className="px-8 py-5 text-right">
                          {tab === 'ACTIVOS' ? (
                            <div className="flex justify-end gap-4">
                              <button onClick={() => setModal({ isOpen: true, data: i })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                                <Edit2 size={18} strokeWidth={2} />
                              </button>
                              <button onClick={() => handleEliminar(i.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar">
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button onClick={() => handleActivar(i.id)} className="text-emerald-500 hover:scale-110 transition-transform flex items-center gap-1.5 font-bold text-xs" title="Restaurar Insumo">
                                <RotateCcw size={18} strokeWidth={2} /> Restaurar
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal.isOpen && (
        <ModalInsumo 
          insumo={modal.data} 
          onClose={() => setModal({ isOpen: false })} 
          onGuardar={() => { setModal({ isOpen: false }); cargarDatos(); }} 
        />
      )}

      {confirmModal.isOpen && (
        <ModalConfirmacion 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.action}
        />
      )}
    </AdminLayout>
  );
}