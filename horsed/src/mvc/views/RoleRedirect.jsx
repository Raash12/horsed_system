import { Navigate } from "react-router-dom";
import { useAuth } from "@/mvc/controllers/auth/AuthProvider";

function LoadingScreen() {
  return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
}

export default function RoleRedirect() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user || !profile) return <Navigate to="/login" replace />;

  const role = profile.role;
  if (role === "super_admin") return <Navigate to="/admin" replace />;
  if (role === "doctor") return <Navigate to="/doctor" replace />;
  if (role === "reception") return <Navigate to="/reception" replace />;

  // Unknown role -> force re-auth/configured profile.
  return <Navigate to="/login" replace />;
}

