import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "promo_active"
  | "promo_expired"
  | "loading";

export type AccessType = "stripe" | "promo" | "free" | "none" | "loading";

interface SubscriptionInfo {
  status: SubscriptionStatus;
  subscribed: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  accessType: AccessType;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionInfo {
  refresh: () => Promise<void>;
  startCheckout: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
  redeemPromo: (code: string) => Promise<{ valid: boolean; message: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    status: "loading",
    subscribed: false,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    accessType: "loading",
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setInfo({ status: "none", subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "none", loading: false });
      return;
    }

    // Facilitateurs are always free
    if (role === "facilitateur") {
      setInfo({ status: "active", subscribed: true, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "free", loading: false });
      return;
    }

    // Admin is always active
    if (role === "admin") {
      setInfo({ status: "active", subscribed: true, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "free", loading: false });
      return;
    }

    try {
      setInfo(prev => ({ ...prev, loading: true }));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInfo({ status: "none", subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "none", loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data) throw error;

      setInfo({
        status: (data.status as SubscriptionStatus) || "none",
        subscribed: data.subscribed ?? false,
        subscriptionEnd: data.subscription_end ?? null,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        accessType: (data.access_type as AccessType) || "none",
        loading: false,
      });
    } catch (err) {
      console.error("check-subscription error:", err);
      setInfo(prev => ({ ...prev, loading: false }));
    }
  }, [user, role]);

  useEffect(() => {
    checkSubscription();
    // Refresh every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || !data?.url) throw error || new Error("No checkout URL");
    window.open(data.url, "_blank");
  };

  const openBillingPortal = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || !data?.url) throw error || new Error("No portal URL");
    window.open(data.url, "_blank");
  };

  const redeemPromo = async (code: string): Promise<{ valid: boolean; message: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("redeem-promo", {
      body: { code },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error) throw error;

    if (data?.valid) {
      // Refresh subscription state
      await checkSubscription();
    }

    return { valid: data?.valid ?? false, message: data?.message ?? "Erreur inconnue" };
  };

  return (
    <SubscriptionContext.Provider value={{ ...info, refresh: checkSubscription, startCheckout, openBillingPortal, redeemPromo }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

// Helper: is the user's access currently valid?
export function isAccessActive(status: SubscriptionStatus): boolean {
  return ["active", "trialing", "promo_active"].includes(status);
}
