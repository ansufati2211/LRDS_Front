import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sileo';

import LoginPage from '@/pages/LoginPage';
import MozoPage from '@/pages/MozoPage';
import CocinaPage from '@/pages/CocinaPage'; 
import CajeroPage from '@/pages/CajeroPage';

import DashboardPage from '@/pages/admin/DashboardPage';
import AdminFinanzasPage from '@/pages/admin/AdminFinanzasPage';
import HistorialPedidosPage from '@/pages/admin/HistorialPedidosPage';
import AdminProductosPage from '@/pages/admin/AdminProductosPage';
import InventarioPage from '@/pages/admin/InventarioPage';
import PersonalPage from '@/pages/admin/PersonalPage';
import KardexPage from '@/pages/admin/KardexPage';
import ConfiguracionPage from '@/pages/admin/ConfiguracionPage';
import RecetasPage from '@/pages/admin/RecetasPage';
import SedesPage from '@/pages/admin/SedesPage'; 
import ReportesPage from '@/pages/admin/ReportesPage';

// --- SEGURIDAD ---
import PrivateRoute from '@/components/PrivateRoute';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = !!token;
  const user = useAuthStore((state) => state.user);

  const getHomeRoute = () => {
    if (!user) return '/login';
    switch (user.rol) {
      case 'ROLE_COCINA': return '/cocina'; 
      case 'ROLE_MOZO': return '/mozo';
      case 'ROLE_CAJERO': return '/cajero';
      case 'ROLE_GERENTE_SEDE': 
      case 'ROLE_ADMIN_EMPRESA': 
      case 'ROLE_SUPER_ADMIN': return '/dashboard';
      default: return '/login';
    }
  };

  return (
    <>
      <Toaster position="top-center" theme="dark" options={{ fill: 'black' }} /> 
      
      <HashRouter>
        <Routes>

          <Route path="/login" element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />} />
          

          <Route path="/mozo" element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO', 'ROLE_MOZO']}>
              <MozoPage />
            </PrivateRoute>
          } />
          
          <Route path="/cocina" element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_COCINA']}>
              <CocinaPage />
            </PrivateRoute>
          } />
          
          <Route path="/cajero" element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO']}>
              <CajeroPage />
            </PrivateRoute>
          } />

          <Route path="/dashboard" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><DashboardPage /></PrivateRoute>} />
          <Route path="/admin/finanzas" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><AdminFinanzasPage /></PrivateRoute>} />
          <Route path="/historial" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE', 'ROLE_CAJERO']}><HistorialPedidosPage /></PrivateRoute>} />
          <Route path="/admin/catalogo" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><AdminProductosPage /></PrivateRoute>} />
          <Route path="/admin/inventario" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><InventarioPage /></PrivateRoute>} />
          <Route path="/admin/personal" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><PersonalPage /></PrivateRoute>} />
          <Route path="/admin/kardex" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><KardexPage /></PrivateRoute>} />
          <Route path="/admin/configuracion" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><ConfiguracionPage /></PrivateRoute>} />
          <Route path="/admin/recetas" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><RecetasPage /></PrivateRoute>} />
          <Route path="/admin/sedes" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA']}><SedesPage /></PrivateRoute>} />
          <Route path="/admin/reportes" element={<PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA', 'ROLE_GERENTE_SEDE']}><ReportesPage /></PrivateRoute>} />

          <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? getHomeRoute() : "/login"} replace />} />
        </Routes>
      </HashRouter>
    </>
  );
}