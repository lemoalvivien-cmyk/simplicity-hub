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
export type OfferType = "launch" | "standard" | "promo" | "unknown" | null;

interface SubscriptionInfo {
  status: SubscriptionStatus;
  subscribed: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  accessType: AccessType;
  offerType: OfferType;
  launchAvailable: boolean;
  launchSlotsRemaining: number;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionInfo {
  refresh: () => Promise<void>;
  startCheckout: () => Promise<{ offer_type?: string }>;
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
    offerType: null,
    launchAvailable: true,
    launchSlotsRemaining: 100,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setInfo({ status: "none", subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "none", offerType: null, launchAvailable: true, launchSlotsRemaining: 100, loading: false });
      return;
    }

    if (role === "facilitateur") {
      setInfo({ status: "active", subscribed: true, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "free", offerType: null, launchAvailable: true, launchSlotsRemaining: 100, loading: false });
      return;
    }

    if (role === "admin") {
      setInfo({ status: "active", subscribed: true, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "free", offerType: null, launchAvailable: true, launchSlotsRemaining: 100, loading: false });
      return;
    }

    try {
      setInfo(prev => ({ ...prev, loading: true }));
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInfo({ status: "none", subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "none", offerType: null, launchAvailable: true, launchSlotsRemaining: 100, loading: false });
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
        offerType: (data.offer_type as OfferType) ?? null,
        launchAvailable: data.launch_available ?? true,
        launchSlotsRemaining: data.launch_slots_remaining ?? 100,
        loading: false,
      });
    } catch (err) {
      console.error("check-subscription error:", err);
      setInfo(prev => ({ ...prev, loading: false }));
    }
  }, [user, role]);

  useEffect(() => {
    checkSubscription();
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
    return { offer_type: data.offer_type };
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

export function isAccessActive(status: SubscriptionStatus): boolean {
  return ["active", "trialing", "promo_active"].includes(status);
}

export function getOfferLabel(offerType: OfferType, accessType: AccessType): string {
  if (accessType === "free") return "Gratuit — Apporteur d'affaires";
  if (accessType === "promo") return "Code d'invitation — 12 mois offerts";
  if (offerType === "launch") return "Offre de lancement — 99 € TTC / an";
  if (offerType === "standard") return "Abonnement annuel — 490 € TTC / an";
  return "Aucun abonnement";
}
