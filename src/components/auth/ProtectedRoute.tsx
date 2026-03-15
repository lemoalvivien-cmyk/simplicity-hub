import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  entrepriseOnly?: boolean;
  facilitateurOnly?: boolean;
}

/** Routes exempt from the subscription paywall (entreprise). */
const SUBSCRIPTION_EXEMPT_PATHS = ["/checkout", "/onboarding", "/account"];

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, profile, role } = useAuth();
  const subscription = useSubscription();
  const location = useLocation();

  // Re-validate session on tab focus to catch expired tokens.
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

  // Wait for both auth AND subscription to finish loading.
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

  // ── ONBOARDING GUARD ────────────────────────────────────────────────────────
  // SECURITY: onboardingDone is derived exclusively from the server-side DB
  // profile. localStorage is NOT consulted for this check — it could be
  // trivially manipulated by the user to bypass the paywall.
  // If profile is still loading (null), we let the request through to avoid
  // a redirect loop during the initial load race.
  const onboardingDone = profile?.onboarding_done === true;

  if (profile !== null && !onboardingDone && !adminOnly) {
    if (!location.pathname.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // ── SUBSCRIPTION GUARD ──────────────────────────────────────────────────────
  // SECURITY: Rules evaluated in order, first match wins.
  //
  //   1. Admins & facilitateurs → always allowed (free tier).
  //   2. Exempt paths (/checkout, /onboarding, /account) → always allowed.
  //   3. Entreprise with active subscription → allowed everywhere.
  //   4. Entreprise with inactive subscription → redirect to /checkout.
  //
  // NOTE: The localStorage "onboarding_done" flag that previously bypassed
  // this guard has been removed. The subscription state from Supabase is the
  // only source of truth. This prevents client-side paywall bypass.

  const isExemptPath = SUBSCRIPTION_EXEMPT_PATHS.some((p) =>
    location.pathname.startsWith(p)
  );

  if (
    role === "entreprise" &&
    !isAccessActive(subscription.status) &&
    !isExemptPath
  ) {
    toast.warning("Activez votre accès pour continuer.", { id: "sub-guard" });
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}
