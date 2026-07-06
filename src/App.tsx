import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import MozoPage from '@/pages/MozoPage';
import KdsPage from '@/pages/KdsPage';
import DashboardPage from '@/pages/DashboardPage';
import CajeroPage from '@/pages/CajeroPage';
import PrivateRoute from '@/components/PrivateRoute';
import { useAuthStore } from '@/store/authStore';

export default function App() {

const token = useAuthStore((state) => state.token);
const isAuthenticated = !!token; // <-- Esto fuerza a React a re-dibujar si hay token
const user = useAuthStore((state) => state.user);
  // Función para saber a dónde enviar al usuario según su rol
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
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <LoginPage />
        } />

        {/* Rutas Protegidas */}
        <Route
          path="/mozo"
          element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_CAJERO', 'ROLE_MOZO']}>
              <MozoPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/kds"
          element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_COCINA']}>
              <KdsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE']}>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/cajero"
          element={
            <PrivateRoute roles={['ROLE_SUPER_ADMIN', 'ROLE_GERENTE', 'ROLE_CAJERO']}>
              <CajeroPage />
            </PrivateRoute>
          }
        />

        {/* Redirecciones Base */}
        <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? getHomeRoute() : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}