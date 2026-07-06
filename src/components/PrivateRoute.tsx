import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  readonly children: React.ReactNode;
  readonly roles?: string[];
}

function roleHome(rol: string): string {
  if (rol === 'ROLE_COCINA') return '/kds';
  if (rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_GERENTE') return '/dashboard';
  if (rol === 'ROLE_CAJERO') return '/cajero';
  return '/mozo';
}

export default function PrivateRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to={roleHome(user.rol)} replace />;
  }

  return <>{children}</>;
}
