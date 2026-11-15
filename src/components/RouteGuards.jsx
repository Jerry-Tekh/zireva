import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { LoadingSkeleton } from './LoadingSkeleton.jsx';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton label="Checking your session" className="loading-skeleton--route"><span className="loading-skeleton__route-card" aria-hidden="true" /></LoadingSkeleton>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton label="Checking your session" className="loading-skeleton--route"><span className="loading-skeleton__route-card" aria-hidden="true" /></LoadingSkeleton>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div style={{ maxWidth: 620, padding: '70px 0' }}>
        <span className="eyebrow">Restricted</span>
        <h1 style={{ marginTop: 12 }}>This workspace is not available for your role.</h1>
        <p className="muted">Signed in as <span className="mono">{user.role}</span>.</p>
      </div>
    );
  }
  return children;
}
