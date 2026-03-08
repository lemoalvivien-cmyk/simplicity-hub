import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, profile, role } = useAuth();
  const location = useLocation();

  // PASSE A: Re-validate session when tab regains focus to catch expired tokens
  useEffect(() => {
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Session expired — supabase onAuthStateChange will handle the SIGNED_OUT event
        await supabase.auth.signOut();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

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
    // PASSE F: preserve intent URL so Login can redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect to onboarding if not done
  if (profile && !profile.onboarding_done && !adminOnly) {
    const currentPath = location.pathname;
    if (!currentPath.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
