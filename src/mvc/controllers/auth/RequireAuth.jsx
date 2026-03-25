import { Navigate } from "react-router-dom";
import { useAuth } from "@/mvc/controllers/auth/AuthProvider";

function LoadingScreen() {
  return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
}

export function RequireAuth({ children }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // User is authenticated but profile row missing/mismatched.
  if (!profile) return <div className="p-6 text-sm">Profile not found or not configured.</div>;

  return children;
}

export function RequireRole({ roles, children }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <div className="p-6 text-sm">Profile not found.</div>;

  const roleList = Array.isArray(roles) ? roles : [roles];
  if (!roleList.includes(profile.role)) {
    return <div className="p-6 text-sm text-destructive">Access denied for this role.</div>;
  }

  return children;
}

