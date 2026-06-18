import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authStore";

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="page-shell"><div className="loading">Loading account...</div></main>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (admin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
