import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Key, Users, ShieldAlert, CheckCircle, X, RotateCcw } from 'lucide-react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, resetearPassword, activarUsuario } from '@/api/usuarios';
import type { Usuario, UsuarioRequestDTO } from '@/api/usuarios';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

const ROLES = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'ROLE_GERENTE_SEDE', label: 'Gerente de Sede' },
  { value: 'ROLE_ADMIN_EMPRESA', label: 'Admin Empresa' },
  { value: 'ROLE_CAJERO', label: 'Cajero' },
  { value: 'ROLE_MOZO', label: 'Mozo de Salón' },
  { value: 'ROLE_COCINA', label: 'Personal de Cocina (KDS)' }
];

// ==========================================
// COMPONENTE: MODAL CONFIRMACIÓN PREMIUM
// ==========================================
function ModalConfirmacion({ isOpen, title, message, type, onConfirm, onCancel, loading }: any) {
  if (!isOpen) return null;
  
  const isDanger = type === 'danger';

  return (
    // 🚨 ARREGLO Z-INDEX: Cambiado a z-50 para que Sileo quede por encima
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
// COMPONENTE: MODAL USUARIO
// ==========================================
function ModalUsuario({ usuario, sedeId, onClose, onGuardar }: { usuario?: Usuario | null; sedeId: number | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [correo, setCorreo] = useState(usuario?.correo || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || 'ROLE_MOZO');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return sileo.error({ title: 'Nombre y correo son obligatorios' });
    if (!usuario && !password) return sileo.error({ title: 'La contraseña es obligatoria para nuevos usuarios' });
    if (password && password.length < 8) return sileo.error({ title: 'La contraseña debe tener mínimo 8 caracteres' });
    
    setLoading(true);
    try {
      const payload: any = { nombre, correo, rol, password: password || undefined, sedeId: sedeId || undefined };
      
      if (usuario) {
        await actualizarUsuario(usuario.id, payload);
        sileo.success({ title: 'Usuario actualizado exitosamente' });
      } else {
        await crearUsuario(payload);
        sileo.success({ title: 'Usuario creado exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      // 🚨 ARREGLO: Pasamos el error real directo a Sileo para que se vea en pantalla
      const errorReal = err.response?.data?.message || err.response?.data?.error || 'Error al guardar el usuario';
      sileo.error({ title: errorReal });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚨 ARREGLO Z-INDEX: Cambiado a z-40 para que quede detrás del Toast y Confirmaciones
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <Users className="text-orange-500" size={20} />
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
            <input 
              autoFocus value={nombre} onChange={e => setNombre(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="Ej. Juan Pérez" 
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Correo Electrónico</label>
            <input 
              type="email" value={correo} onChange={e => setCorreo(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
              placeholder="juan@rutadelsabor.com" 
            />
          </div>
          {!usuario && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contraseña (Mín. 8 caracteres)</label>
              <input 
                type="password" value={password} onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rol en el Sistema</label>
            <select 
              value={rol} onChange={e => setRol(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all appearance-none"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL RESETEAR PASSWORD
// ==========================================
function ModalResetPassword({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNueva.length < 8) return sileo.error({ title: 'La contraseña debe tener mínimo 8 caracteres' });
    
    setLoading(true);
    try {
      await resetearPassword(usuario.id, passwordNueva);
      sileo.success({ title: 'Contraseña reseteada exitosamente' });
      onClose();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al resetear la contraseña' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🚨 ARREGLO Z-INDEX: Cambiado a z-40
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-red-100 flex items-center justify-between bg-red-50/50">
          <h2 className="text-red-700 font-black text-xl tracking-tight flex items-center gap-2">
            <Key className="text-red-500" size={20} />
            Resetear Contraseña
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              Estás a punto de forzar el cambio de clave de acceso para <strong className="text-gray-900">{usuario.nombre}</strong>.
            </p>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nueva Contraseña</label>
            <input 
              autoFocus type="text" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} 
              className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-red-400 outline-none transition-all placeholder-gray-300" 
              placeholder="Escribe la nueva clave" 
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading || !passwordNueva} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 disabled:opacity-50">
              {loading ? 'Aplicando...' : 'Confirmar Cambio'}
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
export default function PersonalPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  // 🔥 VARIABLE DE LECTURA CONDICIONAL
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Tab System
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');

  // Modales de UI
  const [modalUsr, setModalUsr] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  const [modalReset, setModalReset] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  
  // Modal de Confirmación Moderno
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, type: 'danger' | 'success', onConfirm: () => void, isProcessing: boolean }>({
    isOpen: false, title: '', message: '', type: 'danger', onConfirm: () => {}, isProcessing: false
  });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuarios(sedeSeleccionadaId || undefined);
      setUsuarios(data);
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionadaId]); 

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Inhabilitar Usuario?',
      message: 'Este usuario perderá inmediatamente el acceso al sistema. Podrás restaurarlo más adelante si lo deseas.',
      type: 'danger',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isProcessing: true }));
        try { 
          await eliminarUsuario(id); 
          sileo.success({ title: 'Usuario inhabilitado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al inhabilitar al usuario' }); 
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Restaurar Usuario?',
      message: 'El usuario volverá a tener acceso al sistema con su rol y permisos anteriores.',
      type: 'success',
      isProcessing: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isProcessing: true }));
        try { 
          await activarUsuario(id); 
          sileo.success({ title: 'Usuario restaurado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al restaurar el usuario' }); 
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filtrados = usuarios.filter(u => 
    (tab === 'ACTIVOS' ? u.estadoRegistro : !u.estadoRegistro) &&
    (u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.correo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* CABECERA LIMPIA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Personal</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Administración de usuarios, roles y accesos del sistema.</p>
          </div>
        </div>

        {/* BARRA DE CONTROLES CON TABS */}
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
            <div className="w-full sm:w-80 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..." 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
                className="bg-transparent text-gray-900 text-sm font-semibold outline-none w-full placeholder-gray-400" 
              />
            </div>
            {/* 🔥 MODO LECTURA: Ocultar botón al gerente */}
            {isAdmin && tab === 'ACTIVOS' && (
              <button 
                onClick={() => setModalUsr({ isOpen: true, data: null })} 
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={18} /> Nuevo Usuario
              </button>
            )}
          </div>
        </div>

        {/* TABLA PREMIUM */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="font-bold text-gray-400 animate-pulse">Cargando personal...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Users size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-1">{tab === 'ACTIVOS' ? 'Sin Personal Activo' : 'Papelera Limpia'}</h3>
              <p className="text-sm font-medium">No se encontraron usuarios en esta sección.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-8 py-5">Colaborador</th>
                    <th className="px-8 py-5">Correo Electrónico</th>
                    <th className="px-8 py-5 text-center">Rol Asignado</th>
                    <th className="px-8 py-5 text-center">Estado</th>
                    {/* 🔥 MODO LECTURA: Ocultar columna al gerente */}
                    {isAdmin && <th className="px-8 py-5 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(u => {
                    const rolInfo = ROLES.find(r => r.value === u.rol) || { label: u.rol };
                    
                    return (
                      <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors group ${!u.estadoRegistro ? 'opacity-60 grayscale' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg border border-orange-200">
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-gray-900 text-[15px]">{u.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 font-medium">
                          {u.correo}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs tracking-wide border border-slate-200">
                              {rolInfo.label}
                            </span>
                            {/* Clasificación de Sede Visual */}
                            {(u.rol === 'ROLE_SUPER_ADMIN' || u.rol === 'ROLE_ADMIN_EMPRESA') ? (
                              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  🌍 Acceso Global
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                  🏢 Empleado Local
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {u.estadoRegistro ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100">
                              <CheckCircle size={14}/> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-700 bg-slate-200 border border-slate-300">
                              <ShieldAlert size={14}/> Inhabilitado
                            </span>
                          )}
                        </td>

                        {/* 🔥 MODO LECTURA: Ocultar acciones al gerente */}
                        {isAdmin && (
                          <td className="px-8 py-5 text-right">
                            {tab === 'ACTIVOS' ? (
                              <div className="flex justify-end gap-3">
                                <button onClick={() => setModalReset({ isOpen: true, data: u })} className="w-10 h-10 bg-white border border-gray-200 rounded-[12px] flex items-center justify-center text-amber-600 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md transition-all duration-200" title="Resetear Clave">
                                  <Key size={18} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setModalUsr({ isOpen: true, data: u })} className="w-10 h-10 bg-white border border-gray-200 rounded-[12px] flex items-center justify-center text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transition-all duration-200" title="Editar">
                                  <Edit2 size={18} strokeWidth={2.5} />
                                </button>
                                {u.estadoRegistro && (
                                  <button onClick={() => handleEliminar(u.id)} className="w-10 h-10 bg-white border border-gray-200 rounded-[12px] flex items-center justify-center text-red-600 hover:border-red-300 hover:bg-red-50 hover:shadow-md transition-all duration-200" title="Inhabilitar">
                                    <Trash2 size={18} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button onClick={() => handleActivar(u.id)} className="px-4 h-10 bg-emerald-50 border border-emerald-200 rounded-[12px] flex items-center justify-center text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-md transition-all duration-200 font-bold text-xs gap-2">
                                  <RotateCcw size={16} strokeWidth={2.5} /> Restaurar
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

      {modalUsr.isOpen && <ModalUsuario sedeId={sedeSeleccionadaId} usuario={modalUsr.data} onClose={() => setModalUsr({ isOpen: false })} onGuardar={() => { setModalUsr({ isOpen: false }); cargarDatos(); }} />}
      {modalReset.isOpen && modalReset.data && <ModalResetPassword usuario={modalReset.data} onClose={() => setModalReset({ isOpen: false })} />}
      
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