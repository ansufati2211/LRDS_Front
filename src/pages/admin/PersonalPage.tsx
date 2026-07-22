import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Key, Users, ShieldAlert, CheckCircle, X, RotateCcw, AlertTriangle, User, ChevronDown } from 'lucide-react';
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

// ============================================================================
// COMPONENTE: MODAL DE CONFIRMACIÓN (ESTILO INVENTARIO)
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

// ============================================================================
// COMPONENTE: MODAL USUARIO (DISEÑO PREMIUM)
// ============================================================================
function ModalUsuario({ usuario, sedeId, onClose, onGuardar }: { usuario?: Usuario | null; sedeId: number | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [correo, setCorreo] = useState(usuario?.correo || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || 'ROLE_MOZO');
  
  const [loading, setLoading] = useState(false);

  // 🔥 ESTADOS PARA EL SELECTOR PERSONALIZADO DE ROLES
  const [isRolDropdownOpen, setIsRolDropdownOpen] = useState(false);
  const [busquedaRol, setBusquedaRol] = useState('');
  const rolDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rolDropdownRef.current && !rolDropdownRef.current.contains(event.target as Node)) {
        setIsRolDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const rolesFiltrados = ROLES.filter(r => 
    r.label.toLowerCase().includes(busquedaRol.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return sileo.error({ title: 'Nombre y correo son obligatorios' });
    if (!usuario && !password) return sileo.error({ title: 'La contraseña es obligatoria para nuevos usuarios' });
    if (password && password.length < 8) return sileo.error({ title: 'La contraseña debe tener mínimo 8 caracteres' });
    if (!rol) return sileo.error({ title: 'Debes seleccionar un rol' });
    
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
      const errorReal = err.response?.data?.message || err.response?.data?.error || 'Error al guardar el usuario';
      sileo.error({ title: errorReal });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-20 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <Users className="text-orange-500" size={20} />
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          
          {/* 🔥 SELECTOR PERSONALIZADO CON BUSCADOR PARA ROLES */}
          <div className="relative" ref={rolDropdownRef}>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rol en el Sistema</label>
            <div 
              onClick={() => setIsRolDropdownOpen(!isRolDropdownOpen)}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl transition-all font-bold text-gray-900 flex justify-between items-center cursor-pointer select-none ${isRolDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className={rol ? "text-gray-900" : "text-gray-400"}>
                {rol ? ROLES.find(r => r.value === rol)?.label : "Seleccione un rol..."}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isRolDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </div>

            {isRolDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Search size={16} className="text-gray-400 shrink-0" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Buscar rol..." 
                    value={busquedaRol}
                    onChange={(e) => setBusquedaRol(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full font-medium text-gray-700 placeholder-gray-400"
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                  {rolesFiltrados.length > 0 ? (
                    rolesFiltrados.map(r => (
                      <li 
                        key={r.value}
                        onClick={() => {
                          setRol(r.value);
                          setIsRolDropdownOpen(false);
                          setBusquedaRol('');
                        }}
                        className={`px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors ${rol === r.value ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        {r.label}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 text-center text-sm text-gray-400 font-medium">No se encontraron roles</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl disabled:opacity-50 flex justify-center items-center">
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: MODAL RESETEAR PASSWORD
// ============================================================================
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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-20 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <Key className="text-orange-500" size={20} />
            Resetear Contraseña
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
            <p className="text-xs font-medium text-orange-800 leading-relaxed">
              Estás a punto de forzar el cambio de clave de acceso para <strong className="text-gray-900">{usuario.nombre}</strong>.
            </p>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nueva Contraseña</label>
            <input 
              autoFocus type="text" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all placeholder-gray-300" 
              placeholder="Escribe la nueva clave" 
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading || !passwordNueva} className="flex-1 px-5 py-3.5 bg-[#FFC640] hover:bg-amber-400 text-black rounded-xl font-black transition-all shadow-lg shadow-[#FFC640]/30 disabled:opacity-50 flex justify-center items-center">
              {loading ? 'Aplicando...' : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL (PÁGINA)
// ============================================================================
export default function PersonalPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');

  // Modales de UI
  const [modalUsr, setModalUsr] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  const [modalReset, setModalReset] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  
  // Modal de Confirmación Moderno (Unificado)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

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
    setConfirmModal({
      isOpen: true,
      title: '¿Inhabilitar Usuario?',
      message: 'Este usuario perderá inmediatamente el acceso al sistema. Podrás restaurarlo más adelante si lo deseas.',
      action: async () => {
        try { 
          await eliminarUsuario(id); 
          sileo.success({ title: 'Usuario inhabilitado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al inhabilitar al usuario';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Usuario?',
      message: 'El usuario volverá a tener acceso al sistema con su rol y permisos anteriores.',
      action: async () => {
        try { 
          await activarUsuario(id); 
          sileo.success({ title: 'Usuario restaurado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al restaurar el usuario';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
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
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black px-6 py-3 rounded-xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
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
                            {/* 🔥 AVATAR MODERNO (Reemplazo del círculo naranja) */}
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500 group-hover:border-orange-200 transition-colors">
                              <User size={18} strokeWidth={2.5} />
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

                        {/* 🔥 BOTONES DE ACCIÓN MINIMALISTAS */}
                        {isAdmin && (
                          <td className="px-8 py-5 text-right">
                            {tab === 'ACTIVOS' ? (
                              <div className="flex justify-end gap-4">
                                <button onClick={() => setModalReset({ isOpen: true, data: u })} className="text-blue-500 hover:scale-110 transition-transform" title="Resetear Clave">
                                  <Key size={18} strokeWidth={2} />
                                </button>
                                <button onClick={() => setModalUsr({ isOpen: true, data: u })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                                  <Edit2 size={18} strokeWidth={2} />
                                </button>
                                {u.estadoRegistro && (
                                  <button onClick={() => handleEliminar(u.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Inhabilitar">
                                    <Trash2 size={18} strokeWidth={2} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button onClick={() => handleActivar(u.id)} className="text-emerald-500 hover:scale-110 transition-transform flex items-center gap-1.5 font-bold text-xs" title="Restaurar Usuario">
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

      {modalUsr.isOpen && <ModalUsuario sedeId={sedeSeleccionadaId} usuario={modalUsr.data} onClose={() => setModalUsr({ isOpen: false })} onGuardar={() => { setModalUsr({ isOpen: false }); cargarDatos(); }} />}
      {modalReset.isOpen && modalReset.data && <ModalResetPassword usuario={modalReset.data} onClose={() => setModalReset({ isOpen: false })} />}
      
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