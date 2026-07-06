import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import MozoPage from '@/pages/MozoPage';
import KdsPage from '@/pages/KdsPage';
import DashboardPage from '@/pages/DashboardPage';
import CajeroPage from '@/pages/CajeroPage';
import PrivateRoute from '@/components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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

        <Route path="/" element={<Navigate to="/mozo" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
