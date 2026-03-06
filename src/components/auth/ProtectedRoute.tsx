import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, profile, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to onboarding if not done
  if (profile && !profile.onboarding_done && !adminOnly) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
