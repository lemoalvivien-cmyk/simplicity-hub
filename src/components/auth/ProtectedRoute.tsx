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
 *
 * This bridges the async gap between:
 *   1. DB write + localStorage flag  (synchronous, instant)
 *   2. refreshProfile() completing   (async, ~200-500 ms)
 *
 * Without this, ProtectedRoute can re-render between (1) and (2) and see
 * profile.onboarding_done === false, then incorrectly bounce an entreprise user
 * to /checkout before they have a subscription.
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

  // Re-validate session when tab regains focus to catch expired tokens
  useEffect(() => {
    const handleFocus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  // ── ONBOARDING GUARD ────────────────────────────────────────────────────────
  // Combine the DB flag with the localStorage fallback to handle the brief async
  // window between DB write and refreshProfile() completing.
  const localDone = getLocalOnboardingDone();
  const onboardingDone = profile?.onboarding_done || localDone;

  if (profile && !onboardingDone && !adminOnly) {
    if (!location.pathname.startsWith("/onboarding")) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // ── SUBSCRIPTION GUARD ──────────────────────────────────────────────────────
  // Rules:
  //   • Facilitateurs and admins — always free.
  //   • Entreprise — needs active subscription.
  //   • EXCEPTION: if onboarding was JUST completed (localStorage flag is set
  //     but DB profile hasn't refreshed yet), skip the guard entirely.
  //     The user will reach the dashboard; the subscription prompt will appear
  //     there if they truly have no subscription, but after onboarding the
  //     checkout flow is intentional — don't intercept with an auto-redirect.
  //   • EXCEPTION: exempt paths (/checkout, /onboarding, /account).

  if (
    role === "entreprise" &&
    !isAccessActive(subscription.status) &&
    // ↓ Key fix: if localDone is true we just finished onboarding — never bounce
    !localDone &&
    !SUBSCRIPTION_EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))
  ) {
    toast.warning("Activez votre accès pour continuer.", { id: "sub-guard" });
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}
