import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, 
  Wallet, FileSpreadsheet, BoxSelect, MapPin, ChevronDown,
  Menu, Moon, Sun, ShieldCheck, BarChart3
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
  
  // 🔥 FIX 1: Creamos una referencia para el menú lateral
  const navRef = useRef<HTMLElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(true);

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

  // 🔥 FIX 2: Restauramos el scroll de la barra lateral al cargar la página
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar-scroll');
    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  // 🔥 FIX 3: Guardamos el scroll cada vez que nos movemos
  const handleNavScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem('sidebar-scroll', navRef.current.scrollTop.toString());
    }
  };

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

  const themeSidebarBg = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white border-gray-200';
  const themeHeaderBg = isDarkMode ? 'bg-[#0a0a0a] border-gray-800/60 text-white' : 'bg-white border-gray-200 text-gray-900';
  const themeText = isDarkMode ? 'text-white' : 'text-gray-900';
  const themeTextMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  const renderNavItem = (item: typeof navItems[number]) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    const wrapperBase = `group relative flex items-center gap-3 rounded-2xl font-bold transition-all duration-300 ${
      isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'w-full px-4 py-3'
    }`;

    const wrapperTheme = active
      ? 'bg-[#FFC640] text-black shadow-lg shadow-[#FFC640]/10'
      : isDarkMode
        ? 'text-gray-400 hover:text-white hover:bg-white/5'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100';

    return (
      <Link key={item.path} to={item.path} className={`${wrapperBase} ${wrapperTheme}`} title={isCollapsed ? item.name : undefined}>
        <span className={`flex items-center justify-center shrink-0 transition-all duration-300 ${active ? 'text-black' : ''}`}>
          <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        </span>
        {!isCollapsed && (
          <span className="truncate text-sm tracking-wide">{item.name}</span>
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
      <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} ${themeSidebarBg} flex flex-col flex-shrink-0 z-20 relative overflow-hidden transition-all duration-300 ease-in-out border-r ${isDarkMode ? 'border-gray-800/60' : 'border-gray-200'}`}>
        
        <div className={`p-6 mb-2 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} relative z-10 transition-all`}>
          {isCollapsed ? (
            <div className="text-3xl font-black text-[#FFC640]">RS</div>
          ) : (
            <div className="overflow-hidden animate-in fade-in duration-300">
              <h1 className={`text-2xl font-black ${themeText} tracking-tight leading-tight truncate`}>
                SIS<span className="text-[#FFC640]">TE</span>MA 
              </h1>
              <p className={`text-[10px] ${themeTextMuted} font-bold uppercase tracking-widest truncate mt-0.5`}>
                La Ruta del Sabor
              </p>
            </div>
          )}
        </div>

        <div className={`mx-6 h-px ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />

        {/* 🔥 FIX 4: Asignamos el ref y el onScroll al contenedor de navegación */}
        <nav 
          ref={navRef}
          onScroll={handleNavScroll}
          className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10 flex flex-col`}
        >
          {filteredNavItems.map(renderNavItem)}
        </nav>

        <div className={`p-6 relative z-10 flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`mb-3 h-px ${isDarkMode ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`} />
          <button 
            onClick={handleLogout} 
            className={`group flex items-center gap-4 font-bold transition-all ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            } ${isCollapsed ? 'p-3 w-12 h-12 justify-center mx-auto' : 'w-full px-4 py-3'} rounded-2xl`}
            title={isCollapsed ? "Salir del Sistema" : undefined}
          >
            <span className="flex items-center justify-center shrink-0 transition-all">
              <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </span>
            {!isCollapsed && <span className="text-sm tracking-wide">Salir del Sistema</span>}
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
                className={`h-[3px] rounded-full mt-1.5 ${isDarkMode ? 'bg-[#FFC640]' : 'bg-gray-900'}`}
                style={{ animation: 'underline-grow 0.4s ease-out forwards' }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-[#FFC640]/10 hover:bg-[#FFC640]/20 text-[#FFC640]' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
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
                  <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${isDarkMode ? 'bg-[#FFC640]/10' : 'bg-orange-50'}`}>
                    <MapPin size={14} className={isDarkMode ? 'text-[#FFC640]' : 'text-orange-500'} />
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
                  <ShieldCheck size={10} className={isDarkMode ? 'text-[#FFC640]' : 'text-orange-500'} />
                  {user?.rol.replace('ROLE_', '').replace('_', ' ')}
                </span>
              </div>
              <div className="relative w-11 h-11 shrink-0">
                <div className={`absolute inset-0 rounded-xl p-[2px] ${isDarkMode ? 'bg-[#FFC640]' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`}>
                  <div className={`w-full h-full rounded-[9px] flex items-center justify-center font-black text-lg ${isDarkMode ? 'bg-[#0a0a0a] text-[#FFC640]' : 'bg-white text-orange-600'}`}>
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