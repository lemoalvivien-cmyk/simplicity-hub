import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

// Routes entreprise can access without an active subscription
const SUBSCRIPTION_EXEMPT_PATHS = ["/checkout", "/onboarding", "/account"];

/**
 * Read the localStorage flag written by Onboarding.tsx immediately after DB save.
 * This prevents a race where profile.onboarding_done hasn't propagated yet from
 * the async refreshProfile() call, which would otherwise trigger the /checkout bounce.
 */
function getLocalOnboardingDone(): boolean {
  try {
    return localStorage.getItem("onboarding_done") === "true";
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading, profile, role } = useAuth();
  const subscription = useSubscription();
  const location = useLocation();

  // Re-validate session when tab regains focus to catch expired tokens
  useEffect(() => {
    const handleFocus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signOut();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Wait for both auth AND subscription to finish loading
  if (loading || subscription.loading) {
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Onboarding guard: combine DB profile with localStorage flag to handle the
  // brief async window between DB write and refreshProfile() completing.
  const onboardingDone = profile?.onboarding_done || getLocalOnboardingDone();
  if (profile && !onboardingDone && !adminOnly) {
    const currentPath = location.pathname;
    if (!currentPath.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // ── SUBSCRIPTION GUARD ────────────────────────────────────
  // Facilitateurs and admins are always free — skip check.
  // Entreprise users must have an active subscription.
  // Also skip if onboarding was JUST completed (localStorage flag set) to avoid
  // bouncing to /checkout before the subscription context refreshes.
  const justFinishedOnboarding = getLocalOnboardingDone() && !profile?.onboarding_done;
  if (
    role === "entreprise" &&
    !isAccessActive(subscription.status) &&
    !justFinishedOnboarding &&
    !SUBSCRIPTION_EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))
  ) {
    toast.warning("Activez votre accès pour continuer.", { id: "sub-guard" });
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}
