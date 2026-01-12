import { Navigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import Loading from "./Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// A higher-order component that protects routes from unauthenticated access
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
