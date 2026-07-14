import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, 
  Wallet, FileSpreadsheet, BoxSelect, MapPin, ChevronDown, UtensilsCrossed,
  Menu, Moon, Sun, ShieldCheck,BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getSedes, type Sede } from '@/api/sedes';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, sedeSeleccionadaId, setSedeSeleccionadaId } = useAuthStore();
  
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isSedeMenuOpen, setIsSedeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);

  // 🔥 FIX: persistimos el estado colapsado en localStorage para que
  // no se reinicie si el layout se remonta al cambiar de ruta.
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  useEffect(() => {
    if (user?.rol === 'ROLE_ADMIN_EMPRESA' || user?.rol === 'ROLE_SUPER_ADMIN') {
      getSedes().then(res => {
        setSedes(res);
        if (res.length > 0 && !sedeSeleccionadaId) {
          setSedeSeleccionadaId(res[0].id);
        }
      }).catch(() => {});
    }
  }, [user, sedeSeleccionadaId, setSedeSeleccionadaId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSedeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleLogout = () => { logout(); navigate('/login'); };

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Historial Pedidos', path: '/historial', icon: ShoppingCart, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO'] },
    { name: 'Catálogo', path: '/admin/catalogo', icon: BoxSelect, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Recetas (BOM)', path: '/admin/recetas', icon: FileSpreadsheet, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Inventario', path: '/admin/inventario', icon: Package, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Kardex', path: '/admin/kardex', icon: Package, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Finanzas', path: '/admin/finanzas', icon: Wallet, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Reportes', path: '/admin/reportes', icon: BarChart3, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] }, 
    { name: 'Mis Locales', path: '/admin/sedes', icon: MapPin, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA'] },
    { name: 'RRHH', path: '/admin/personal', icon: Users, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE'] },
    { name: 'Ajustes', path: '/admin/configuracion', icon: Settings, roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA'] },
  ];
  const isActive = (path: string) => location.pathname === path;
  
const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.rol));

  const themeSidebarBg = isDarkMode ? 'bg-[#0a0f1c]' : 'bg-white border-gray-200';
  const themeHeaderBg = isDarkMode ? 'bg-[#0a0f1c] border-gray-800/60 text-white' : 'bg-white border-gray-200 text-gray-900';
  const themeText = isDarkMode ? 'text-white' : 'text-gray-900';
  const themeTextMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  const renderNavItem = (item: typeof navItems[number]) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    const wrapperBase = `group relative flex items-center gap-3 rounded-2xl font-bold transition-all duration-300 ${
      isCollapsed ? 'justify-center w-14 h-14' : 'w-full px-3 py-3'
    }`;

    const wrapperTheme = active
      ? isDarkMode
        ? 'bg-white/10 text-white'
        : 'bg-gray-900/[0.06] text-gray-900'
      : isDarkMode
        ? 'text-gray-400 hover:text-white hover:bg-white/5'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';

    const chipTheme = active
      ? isDarkMode
        ? 'bg-white text-gray-900 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]'
        : 'bg-gray-900 text-white shadow-[0_0_0_4px_rgba(17,24,39,0.08)]'
      : isDarkMode
        ? 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-900';

    return (
      <Link key={item.path} to={item.path} className={`${wrapperBase} ${wrapperTheme}`} title={isCollapsed ? item.name : undefined}>
        {active && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full ${
              isDarkMode ? 'bg-white' : 'bg-gray-900'
            } ${isCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          />
        )}
        <span className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-300 ${chipTheme}`}>
          <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        </span>
        {!isCollapsed && (
          <span className="truncate text-[13px] tracking-tight">{item.name}</span>
        )}
      </Link>
    );
  };

  const nombreMostrar = user?.nombre || user?.correo?.split('@')[0] || 'Administrador';
  const sedeActiva = sedes.find(s => s.id === sedeSeleccionadaId);

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans overflow-hidden">
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes underline-grow {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`${isCollapsed ? 'w-[100px]' : 'w-[280px]'} ${themeSidebarBg} flex flex-col flex-shrink-0 z-20 relative overflow-hidden transition-all duration-300 ease-in-out border-r ${isDarkMode ? 'border-gray-800/60' : 'border-gray-200'}`}>
        
        {isDarkMode && (
          <>
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/[0.08] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-sky-500/[0.05] to-transparent pointer-events-none" />
          </>
        )}

        <div className={`p-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} relative z-10 transition-all`}>
          <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-500/30 flex-shrink-0">
            <UtensilsCrossed size={isCollapsed ? 20 : 24} strokeWidth={2.5} />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#0a0f1c] shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in duration-300">
              <h1 className={`text-base font-black ${themeText} tracking-tight leading-tight truncate`}>
                {nombreMostrar}
              </h1>
              <p className={`text-[10px] ${themeTextMuted} font-bold uppercase tracking-[0.2em] truncate mt-0.5`}>
                Ruta del Sabor OS
              </p>
            </div>
          )}
        </div>

        <div className={`mx-6 h-px ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />

        <nav className={`flex-1 ${isCollapsed ? 'px-3' : 'px-4'} py-6 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Menú Principal</p>
          )}
          {filteredNavItems.map(renderNavItem)}
        </nav>

        <div className={`p-6 relative z-10 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`mb-3 h-px ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />
          <button 
            onClick={handleLogout} 
            className={`group flex items-center gap-3 font-bold transition-all ${
              isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
            } ${isCollapsed ? 'p-3 w-14 justify-center' : 'w-full px-3 py-3'} rounded-2xl`}
            title={isCollapsed ? "Salir del sistema" : undefined}
          >
            <span className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all ${isDarkMode ? 'bg-white/5 group-hover:bg-red-500/10' : 'bg-gray-100 group-hover:bg-red-100'}`}>
              <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </span>
            {!isCollapsed && <span className="text-[13px]">Salir del sistema</span>}
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <header className={`h-20 ${themeHeaderBg} border-b px-6 flex items-center justify-between z-30 sticky top-0 transition-colors duration-300`}>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-black tracking-tight leading-none">
                {navItems.find(i => i.path === location.pathname)?.name || 'Panel'}
              </h2>
              <div
                key={location.pathname}
                className={`h-[3px] rounded-full mt-1.5 ${isDarkMode ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}
                style={{ animation: 'underline-grow 0.4s ease-out forwards' }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {(user?.rol === 'ROLE_ADMIN_EMPRESA' || user?.rol === 'ROLE_SUPER_ADMIN') && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsSedeMenuOpen(!isSedeMenuOpen)}
                  className={`flex items-center gap-3 border px-4 py-2.5 rounded-xl shadow-sm transition-all focus:outline-none active:scale-[0.98] ${isDarkMode ? 'bg-[#131a2b] border-gray-700/60 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                    <MapPin size={14} className="text-orange-500" />
                  </span>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className={`text-[9px] font-black uppercase leading-none tracking-widest mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sede Activa</span>
                    <span className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                      {sedeActiva ? sedeActiva.nombre : 'Cargando locales...'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-1 transition-transform duration-200 ${isSedeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSedeMenuOpen && (
                  <div className={`absolute right-0 mt-3 w-64 border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-[#131a2b] border-gray-700/60' : 'bg-white border-gray-100'}`}>
                    <div className={`p-3 border-b ${isDarkMode ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mis Locales Operativos</p>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                      {sedes.map(s => {
                        const sel = sedeSeleccionadaId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setSedeSeleccionadaId(s.id); setIsSedeMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              sel 
                                ? (isDarkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white shadow-md')
                                : (isDarkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                          >
                            <span className="truncate">{s.nombre}</span>
                            {sel && <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)] shrink-0 ml-2"></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`flex items-center gap-3 pl-3 sm:pl-4 border-l ${isDarkMode ? 'border-gray-700/60' : 'border-gray-200'}`}>
              <div className="text-right hidden md:block">
                <p className={`text-sm font-black leading-tight ${themeText}`}>{user?.nombre}</p>
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  <ShieldCheck size={10} className="text-orange-500" />
                  {user?.rol.replace('ROLE_', '').replace('_', ' ')}
                </span>
              </div>
              <div className="relative w-11 h-11 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-[2px]">
                  <div className={`w-full h-full rounded-[9px] flex items-center justify-center font-black text-lg ${isDarkMode ? 'bg-[#0a0f1c] text-orange-400' : 'bg-white text-orange-600'}`}>
                    {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8 relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}