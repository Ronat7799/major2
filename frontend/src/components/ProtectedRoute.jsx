import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] text-sm text-black/60">
        Loading…
      </div>
    );
  }

  if (!user || (role && user.role !== role)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
