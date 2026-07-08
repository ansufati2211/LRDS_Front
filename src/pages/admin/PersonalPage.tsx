import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Key, Users, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, resetearPassword } from '@/api/usuarios';
import type { Usuario, UsuarioRequestDTO } from '@/api/usuarios';
import AdminLayout from '@/components/layouts/AdminLayout';

const ROLES = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'ROLE_GERENTE', label: 'Gerente' },
  { value: 'ROLE_CAJERO', label: 'Cajero' },
  { value: 'ROLE_MOZO', label: 'Mozo de Salón' },
  { value: 'ROLE_COCINA', label: 'Personal de Cocina (KDS)' }
];

// ==========================================
// COMPONENTE: MODAL USUARIO (Crear/Editar)
// ==========================================
function ModalUsuario({ usuario, onClose, onGuardar }: { usuario?: Usuario | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [correo, setCorreo] = useState(usuario?.correo || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || 'ROLE_MOZO');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return setError('Nombre y correo son obligatorios');
    if (!usuario && !password) return setError('La contraseña es obligatoria para nuevos usuarios');
    if (password && password.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres');
    
    setLoading(true); setError('');
    try {
      const payload: UsuarioRequestDTO = { nombre, correo, rol, password: password || undefined };
      if (usuario) await actualizarUsuario(usuario.id, payload);
      else await crearUsuario(payload);
      onGuardar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-400" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
            <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-400" placeholder="juan@rutadelsabor.com" />
          </div>
          {!usuario && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña (Min. 8 caracteres)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-400" placeholder="********" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol en el Sistema</label>
            <select value={rol} onChange={e => setRol(e.target.value)} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-slate-400 bg-white">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
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
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNueva.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres');
    
    setLoading(true); setError('');
    try {
      await resetearPassword(usuario.id, passwordNueva);
      alert('Contraseña reseteada exitosamente');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al resetear la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-red-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-lg">Resetear Contraseña</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Estás a punto de forzar el cambio de contraseña para <strong>{usuario.nombre}</strong>.</p>
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
            <input autoFocus type="text" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} className="w-full px-3 py-2 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400" placeholder="Nueva clave de acceso" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={loading || !passwordNueva} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50">
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalUsr, setModalUsr] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  const [modalReset, setModalReset] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = async (id: number) => {
    if(!window.confirm('¿Desactivar este usuario? Ya no podrá ingresar al sistema.')) return;
    try { 
      await eliminarUsuario(id); 
      cargarDatos(); 
    } catch (e) { 
      alert('Error al desactivar al usuario.'); 
    }
  };

  const filtrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera Interna */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-3 rounded-xl text-slate-700"><Users size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestión de Personal</h2>
              <p className="text-sm text-gray-500">Usuarios y roles del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar por nombre o correo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
            </div>
            <button onClick={() => setModalUsr({ isOpen: true, data: null })} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm whitespace-nowrap">
              <Plus size={16} /> <span className="hidden sm:inline">Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
              <p>Cargando personal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Nombre Completo</th>
                    <th className="px-6 py-4 font-bold">Correo (Usuario)</th>
                    <th className="px-6 py-4 font-bold">Rol Asignado</th>
                    <th className="px-6 py-4 font-bold text-center">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No se encontraron usuarios.</td></tr>
                  ) : filtrados.map(u => {
                    const rolInfo = ROLES.find(r => r.value === u.rol) || { label: u.rol };
                    return (
                      <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.estadoRegistro ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 font-bold text-gray-900">{u.nombre}</td>
                        <td className="px-6 py-4 text-gray-600">{u.correo}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                            {rolInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.estadoRegistro ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"><CheckCircle size={12}/> ACTIVO</span> 
                          ) : (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"><ShieldAlert size={12}/> INACTIVO</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setModalReset({ isOpen: true, data: u })} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition" title="Resetear Contraseña">
                              <Key size={16} />
                            </button>
                            <button onClick={() => setModalUsr({ isOpen: true, data: u })} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="Editar Datos">
                              <Edit2 size={16} />
                            </button>
                            {u.estadoRegistro && (
                              <button onClick={() => handleEliminar(u.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Desactivar Usuario">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalUsr.isOpen && <ModalUsuario usuario={modalUsr.data} onClose={() => setModalUsr({ isOpen: false })} onGuardar={() => { setModalUsr({ isOpen: false }); cargarDatos(); }} />}
      {modalReset.isOpen && modalReset.data && <ModalResetPassword usuario={modalReset.data} onClose={() => setModalReset({ isOpen: false })} />}
    </AdminLayout>
  );
}