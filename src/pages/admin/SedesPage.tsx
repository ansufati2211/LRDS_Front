import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Building, ShieldAlert, CheckCircle, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { getSedes, crearSede, actualizarSede, eliminarSede, activarSede } from '@/api/sedes';
import type { Sede } from '@/api/sedes';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

// ============================================================================
// COMPONENTE: MODAL DE CONFIRMACIÓN (ESTILO UNIFICADO PREMIUM)
// ============================================================================
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
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl">Sí, confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL CREAR/EDITAR SEDE
// ==========================================
function ModalSede({ sede, onClose, onGuardar }: { sede?: Sede | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(sede?.nombre || 'Sede ');
  const [direccion, setDireccion] = useState(sede?.direccion || '');
  const [codigoEstablecimiento, setCodigoEstablecimiento] = useState(sede?.codigoEstablecimiento || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || nombre.trim() === 'Sede') return sileo.error({ title: 'Completa el nombre de la sede' });
    
    setLoading(true);
    try {
      const payload = { nombre, direccion, codigoEstablecimiento };
      if (sede) {
        await actualizarSede(sede.id, payload);
        sileo.success({ title: 'Local actualizado exitosamente' });
      } else {
        await crearSede(payload);
        sileo.success({ title: 'Nuevo local registrado exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al guardar el local' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <Building className="text-orange-500" size={20} />
            {sede ? 'Editar Local' : 'Nuevo Local Físico'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre Comercial del Local</label>
            <input 
              autoFocus value={nombre} onChange={e => setNombre(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="Ej. Sede Cañete Principal" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dirección Física</label>
            <input 
              value={direccion} onChange={e => setDireccion(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="Ej. Av. Principal 123" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Código SUNAT (Opcional)</label>
            <input 
              value={codigoEstablecimiento} onChange={e => setCodigoEstablecimiento(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="Ej. 0001, 0002" 
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (PÁGINA)
// ==========================================
export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  
  // Modales
  const [modal, setModal] = useState<{ isOpen: boolean; data?: Sede | null }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSedes();
      setSedes(data);
    } catch (error) {
      sileo.error({ title: 'Error al cargar los locales' });
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Inhabilitar Local?',
      message: 'Se cerrará la sesión de todos los usuarios asignados a esta sede y se ocultará del sistema operativo.',
      action: async () => {
        try { 
          await eliminarSede(id); 
          sileo.success({ title: 'Local inhabilitado' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al inhabilitar local' }); 
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Local?',
      message: 'El local volverá a estar operativo y el personal podrá iniciar sesión.',
      action: async () => {
        try { 
          await activarSede(id); 
          sileo.success({ title: 'Local restaurado' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al restaurar local' }); 
        }
      }
    });
  };

  const filtrados = sedes.filter(s => 
    (tab === 'ACTIVOS' ? s.estadoRegistro : !s.estadoRegistro) &&
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Mis Locales <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Operativos</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Gestión de sedes, sucursales y franquicias físicas.</p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="bg-slate-100/80 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-5">
          <div className="flex p-1.5 bg-gray-200/50 rounded-2xl w-full xl:w-auto border border-gray-200/50">
            <button onClick={() => setTab('ACTIVOS')} className={`flex-1 xl:w-40 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'ACTIVOS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}>
              Activos
            </button>
            <button onClick={() => setTab('INACTIVOS')} className={`flex-1 xl:w-40 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'INACTIVOS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}>
              Inhabilitados
            </button>
          </div>
          <div className="hidden xl:block w-px h-8 bg-slate-300"></div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-orange-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="Buscar local..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="bg-transparent text-gray-900 text-sm font-semibold outline-none w-full placeholder-gray-400" />
            </div>
            {tab === 'ACTIVOS' && (
              <button onClick={() => setModal({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black px-6 py-3 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
                <Plus size={18} /> Nuevo Local
              </button>
            )}
          </div>
        </div>

        {/* TABLA PREMIUM */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="font-bold text-gray-400 animate-pulse">Cargando locales...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-8 py-5">Sucursal / Local</th>
                    <th className="px-8 py-5">Dirección</th>
                    <th className="px-8 py-5 text-center">Código SUNAT</th>
                    <th className="px-8 py-5 text-center">Estado</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(s => (
                    <tr key={s.id} className={`hover:bg-gray-50/50 transition-colors group ${!s.estadoRegistro ? 'opacity-60 grayscale' : ''}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                            <Building size={18} />
                          </div>
                          <span className="font-black text-gray-900 text-[15px]">{s.nombre}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-gray-600 font-medium">
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {s.direccion || 'No especificada'}</div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">{s.codigoEstablecimiento || '0000'}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        {s.estadoRegistro ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100">
                            <CheckCircle size={14}/> Operativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-200 border border-slate-300">
                            <ShieldAlert size={14}/> Inhabilitado
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {tab === 'ACTIVOS' ? (
                          <div className="flex justify-end gap-4">
                            <button onClick={() => setModal({ isOpen: true, data: s })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                              <Edit2 size={18} strokeWidth={2} />
                            </button>
                            <button onClick={() => handleEliminar(s.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar">
                              <Trash2 size={18} strokeWidth={2} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button onClick={() => handleActivar(s.id)} className="text-emerald-500 hover:scale-110 transition-transform flex items-center gap-1.5 font-bold text-xs" title="Restaurar Local">
                              <RotateCcw size={18} strokeWidth={2} /> Restaurar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal.isOpen && <ModalSede sede={modal.data} onClose={() => setModal({ isOpen: false })} onGuardar={() => { setModal({ isOpen: false }); cargarDatos(); }} />}

      {/* MODAL DE CONFIRMACIÓN CUSTOM */}
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