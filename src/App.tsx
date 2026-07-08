import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sileo'; // <-- IMPORTAMOS EL TOASTER DE SILEO

import LoginPage from '@/pages/LoginPage';
import MozoPage from '@/pages/MozoPage';
import KdsPage from '@/pages/KdsPage';
import CajeroPage from '@/pages/CajeroPage';

// Páginas de Administración
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminFinanzasPage from '@/pages/admin/AdminFinanzasPage';
import HistorialPedidosPage from '@/pages/admin/HistorialPedidosPage';
import AdminProductosPage from '@/pages/admin/AdminProductosPage';
import InventarioPage from '@/pages/admin/InventarioPage';
import PersonalPage from '@/pages/admin/PersonalPage';
import KardexPage from '@/pages/admin/KardexPage';
import ConfiguracionPage from '@/pages/admin/ConfiguracionPage';
import RecetasPage from '@/pages/admin/RecetasPage';

import PrivateRoute from '@/components/PrivateRoute';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = !!token;
  const user = useAuthStore((state) => state.user);

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (user.rol) {
      case 'ROLE_COCINA': return '/kds';
      case 'ROLE_MOZO': return '/mozo';
      case 'ROLE_CAJERO': return '/cajero';
      case 'ROLE_GERENTE':
      case 'ROLE_SUPER_ADMIN': return '/dashboard';
      default: return '/login';
    }
  };

  return (
    <>
      {/* 
        CONFIGURACIÓN NATIVA DE SILEO:
        - position: Lo ubica en el centro de la parte superior.
        - theme: Activa el modo oscuro nativo para no romper los bordes.
        - options: Fuerza el relleno negro en la animación.
      */}
      <Toaster 
        position="top-center" 
        theme="dark" 
        options={{ fill: 'black' }} 
      /> 

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />} />
          
          {/* Rutas Operativas */}
          <Route path="/mozo" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_CAJERO', 'ROLE_MOZO']}><MozoPage /></PrivateRoute>} />
          <Route path="/kds" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_COCINA']}><KdsPage /></PrivateRoute>} />
          <Route path="/cajero" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_CAJERO']}><CajeroPage /></PrivateRoute>} />

          {/* Rutas Administrativas */}
          <Route path="/dashboard" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><DashboardPage /></PrivateRoute>} />
          <Route path="/admin/finanzas" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><AdminFinanzasPage /></PrivateRoute>} />
          <Route path="/historial" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_CAJERO']}><HistorialPedidosPage /></PrivateRoute>} />
          <Route path="/admin/catalogo" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><AdminProductosPage /></PrivateRoute>} />
          <Route path="/admin/inventario" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><InventarioPage /></PrivateRoute>} />
          <Route path="/admin/personal" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><PersonalPage /></PrivateRoute>} />
          <Route path="/admin/kardex" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><KardexPage /></PrivateRoute>} />
          <Route path="/admin/configuracion" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><ConfiguracionPage /></PrivateRoute>} />
          <Route path="/admin/recetas" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}><RecetasPage /></PrivateRoute>} />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? getHomeRoute() : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}