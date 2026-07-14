import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Building, ShieldAlert, CheckCircle, X, RotateCcw } from 'lucide-react';
import { getSedes, crearSede, actualizarSede, eliminarSede, activarSede } from '@/api/sedes';
import type { Sede } from '@/api/sedes';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

// ==========================================
// COMPONENTE: MODAL CONFIRMACIÓN PREMIUM
// ==========================================
function ModalConfirmacion({ isOpen, title, message, type, onConfirm, onCancel, loading }: any) {
  if (!isOpen) return null;
  
  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-8 py-6 flex flex-col items-center text-center ${isDanger ? 'bg-red-50/50' : 'bg-emerald-50/50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-100 text-red-500 shadow-inner shadow-red-200' : 'bg-emerald-100 text-emerald-500 shadow-inner shadow-emerald-200'}`}>
            {isDanger ? <ShieldAlert size={32} /> : <RotateCcw size={32} />}
          </div>
          <h2 className={`font-black text-xl tracking-tight mb-2 ${isDanger ? 'text-red-700' : 'text-emerald-700'}`}>
            {title}
          </h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="p-6 flex gap-3 bg-white">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading} 
            className={`flex-1 px-5 py-3.5 text-white rounded-xl font-bold transition-all shadow-lg flex justify-center items-center ${isDanger ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/30'} disabled:opacity-50`}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL CREAR/EDITAR SEDE
// ==========================================
function ModalSede({ sede, onClose, onGuardar }: { sede?: Sede | null; onClose: () => void; onGuardar: () => void }) {
  // 🔥 AQUÍ ESTÁ EL CAMBIO: "Sede " por defecto si es una nueva creación
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
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50">
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
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, type: 'danger' | 'success', onConfirm: () => void, isProcessing: boolean }>({
    isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {}, isProcessing: false
  });

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

  // 🔥 NUEVA LÓGICA DE CONFIRMACIÓN CUSTOM (ELIMINA EL WINDOW.CONFIRM)
  const handleEliminar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Inhabilitar Local?',
      message: 'Se cerrará la sesión de todos los usuarios asignados a esta sede y se ocultará del sistema operativo.',
      type: 'danger',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isProcessing: true }));
        try { 
          await eliminarSede(id); 
          sileo.success({ title: 'Local inhabilitado' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al inhabilitar local' }); 
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Restaurar Local?',
      message: 'El local volverá a estar operativo y el personal podrá iniciar sesión.',
      type: 'success',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isProcessing: true }));
        try { 
          await activarSede(id); 
          sileo.success({ title: 'Local restaurado' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al restaurar local' }); 
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
              <button onClick={() => setModal({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
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
                        <span className="font-mono font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">{s.codigoEstablecimiento || '0000'}</span>
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
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setModal({ isOpen: true, data: s })} className="w-10 h-10 bg-white border border-gray-200 rounded-[12px] flex items-center justify-center text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleEliminar(s.id)} className="w-10 h-10 bg-white border border-gray-200 rounded-[12px] flex items-center justify-center text-red-600 hover:border-red-300 hover:bg-red-50 hover:shadow-md transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button onClick={() => handleActivar(s.id)} className="px-4 h-10 bg-emerald-50 border border-emerald-200 rounded-[12px] flex items-center justify-center text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 transition-all font-bold text-xs gap-2">
                              <RotateCcw size={16} /> Restaurar
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
      <ModalConfirmacion 
        isOpen={confirmDialog.isOpen} 
        title={confirmDialog.title} 
        message={confirmDialog.message} 
        type={confirmDialog.type} 
        loading={confirmDialog.isProcessing}
        onConfirm={confirmDialog.onConfirm} 
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </AdminLayout>
  );
}