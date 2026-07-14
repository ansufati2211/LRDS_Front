import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  readonly children: React.ReactNode;
  readonly roles?: string[];
}

function roleHome(rol: string): string {
  if (rol === 'ROLE_COCINA') return '/kds';
  // FIX: Agregados los nuevos roles maestro y de sede
  if (rol === 'ROLE_SUPER_ADMIN' || rol === 'ROLE_ADMIN_EMPRESA' || rol === 'ROLE_GERENTE_SEDE') return '/dashboard';
  if (rol === 'ROLE_CAJERO') return '/cajero';
  return '/mozo';
}

export default function PrivateRoute({ children, roles }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Si no está autenticado, lo botamos al login
  if (!isAuthenticated || !isAuthenticated()) return <Navigate to="/login" replace />;

  // Si está logueado pero no tiene el rol necesario para esta vista, lo mandamos a su inicio
  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to={roleHome(user.rol)} replace />;
  }
  
  return <>{children}</>;
}