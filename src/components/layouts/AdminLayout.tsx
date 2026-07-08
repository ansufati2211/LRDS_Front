import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings,
  LogOut, PieChart, Package, Receipt, ChefHat, 
  ArrowRightLeft, UtensilsCrossed, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  
  const linkClass = (path: string) => `w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
    isActive(path) 
      ? 'bg-gray-900 text-white shadow-md' 
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
  }`;

  // SALVAVIDAS: Extraemos el nombre real, y si tu navegador tiene caché viejo, usamos el correo temporalmente
  const nombreMostrar = user?.nombre || user?.correo?.split('@')[0] || 'Administrador';

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans overflow-hidden">
      
      {/* ─── SIDEBAR FIJO ─── */}
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col flex-shrink-0 z-20">
        
        {/* Logo y Perfil Real */}
        <div className="p-6 mb-2 flex items-center gap-4 border-b border-gray-50">
          <div className="bg-gray-900 p-3 rounded-2xl text-white shadow-sm flex-shrink-0">
            <UtensilsCrossed size={24} />
          </div>
          <div className="overflow-hidden">
            {/* Imprimimos la variable segura */}
            <h1 className="text-base font-black text-gray-900 tracking-tight leading-tight truncate">
              {nombreMostrar}
            </h1>
            <p className="text-xs text-gray-500 font-medium truncate">{user?.correo}</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => navigate('/dashboard')} className={linkClass('/dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => navigate('/admin/finanzas')} className={linkClass('/admin/finanzas')}>
            <PieChart size={18} /> Rentabilidad
          </button>
          <button onClick={() => navigate('/historial')} className={linkClass('/historial')}>
            <Receipt size={18} /> Historial Ventas
          </button>
          <button onClick={() => navigate('/admin/catalogo')} className={linkClass('/admin/catalogo')}>
            <Package size={18} /> Catálogo Menú
          </button>
          <button onClick={() => navigate('/admin/recetas')} className={linkClass('/admin/recetas')}>
            <ChefHat size={18} /> Recetas Insumos
          </button>
          <button onClick={() => navigate('/admin/inventario')} className={linkClass('/admin/inventario')}>
            <ShoppingBag size={18} /> Almacén
          </button>
          <button onClick={() => navigate('/admin/kardex')} className={linkClass('/admin/kardex')}>
            <ArrowRightLeft size={18} /> Kardex
          </button>
          <button onClick={() => navigate('/admin/personal')} className={linkClass('/admin/personal')}>
            <Users size={18} /> Personal
          </button>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-6 space-y-2 bg-white border-t border-gray-50">
          <button onClick={() => navigate('/admin/configuracion')} className={linkClass('/admin/configuracion')}>
            <Settings size={18} /> Ajustes
          </button>
          <div className="flex items-center justify-between px-4 py-3 mt-2 text-gray-500">
            <button onClick={handleLogout} className="flex items-center gap-3 font-medium hover:text-red-600 transition-colors w-full">
              <LogOut size={18} /> Salir del sistema
            </button>
          </div>
        </div>
      </aside>

      {/* ─── ÁREA DE CONTENIDO ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Superior */}
        <header className="bg-white/60 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">VERONICA Back-Office</h2>
            <p className="text-sm text-gray-500 font-medium">
              Hola, <span className="font-bold text-gray-800">{nombreMostrar}</span>
            </p>
          </div>
          <button className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-orange-500 rounded-full shadow-sm transition relative">
            <Bell size={18} />
          </button>
        </header>

        {/* CAJA DE SCROLL */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8">
          {children}
        </div>
      </main>

    </div>
  );
}