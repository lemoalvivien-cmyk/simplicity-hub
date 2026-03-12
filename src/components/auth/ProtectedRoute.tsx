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

/** Routes exempt from the subscription paywall (entreprise). */
const SUBSCRIPTION_EXEMPT_PATHS = ["/checkout", "/onboarding", "/account"];

/**
 * Returns true if the user just finished onboarding in this browser session.
 *
 * The flag is written by Onboarding.tsx *before* the async refreshProfile()
 * call, so ProtectedRoute can read it even before the DB profile has propagated
 * into React state.
 *
 * IMPORTANT: this flag is NEVER cleared automatically. It acts as a
 * "this device has completed onboarding" marker so that:
 *   - even across hard refreshes the user won't be bounced to /checkout
 *   - it complements (not replaces) profile.onboarding_done from the DB
 */
function getLocalOnboardingDone(): boolean {
  try {
    return localStorage.getItem("onboarding_done") === "true";
  } catch {
    return false;
  }
}

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
  // onboardingDone = DB truth OR localStorage fallback (race-condition bridge).
  const localDone = getLocalOnboardingDone();
  const onboardingDone = profile?.onboarding_done === true || localDone;

  if (profile !== null && !onboardingDone && !adminOnly) {
    if (!location.pathname.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // ── SUBSCRIPTION GUARD ──────────────────────────────────────────────────────
  // Rules (evaluated in order, first match wins):
  //
  //   1. Admins & facilitateurs → always allowed (free tier).
  //   2. Exempt paths (/checkout, /onboarding, /account) → always allowed.
  //   3. localDone === true → ALWAYS allowed.
  //      Rationale: the user just finished onboarding on this device.
  //      If they have no subscription, /checkout will surface naturally
  //      from within the dashboard flow — not via an auto-redirect here.
  //      This is the definitive fix for the "new user → /checkout loop".
  //   4. Subscription is still loading → wait (handled above).
  //   5. Entreprise with inactive subscription → redirect to /checkout.

  const isExemptPath = SUBSCRIPTION_EXEMPT_PATHS.some((p) =>
    location.pathname.startsWith(p)
  );

  if (
    role === "entreprise" &&
    !isAccessActive(subscription.status) &&
    !isExemptPath &&
    !localDone // ← This is the definitive guard. localDone blocks ALL /checkout bounces post-onboarding.
  ) {
    toast.warning("Activez votre accès pour continuer.", { id: "sub-guard" });
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}
