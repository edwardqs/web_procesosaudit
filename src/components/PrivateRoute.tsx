import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoleId?: number;
}

export default function PrivateRoute({ children, requiredRoleId }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoleId !== undefined && user?.roleId !== requiredRoleId) {
    return <Navigate to={user?.roleId === 1 ? "/dashboard" : "/home"} replace />;
  }

  return <>{children}</>;
}