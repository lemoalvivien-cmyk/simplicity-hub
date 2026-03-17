import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
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
  launchAvailable: boolean | null;
  launchSlotsRemaining: number | null;
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
  const { user, role, registerSubscriptionReset } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    status: "loading",
    subscribed: false,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
    accessType: "loading",
    offerType: null,
    launchAvailable: null,
    launchSlotsRemaining: null,
    loading: true,
  });
  // PASSE F: coordinate refresh across tabs — prevents N×calls on multi-tab
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // PASSE A: reset exposed to AuthContext for signOut cleanup
  const reset = useCallback(() => {
    setInfo({
      status: "none", subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false,
      accessType: "none", offerType: null, launchAvailable: null, launchSlotsRemaining: null, loading: false,
    });
  }, []);

  useEffect(() => {
    registerSubscriptionReset(reset);
  }, [registerSubscriptionReset, reset]);

  const checkSubscription = useCallback(async () => {
    if (!user) { reset(); return; }

    if (role === "facilitateur" || role === "admin") {
      setInfo({ status: "active", subscribed: true, subscriptionEnd: null, cancelAtPeriodEnd: false, accessType: "free", offerType: null, launchAvailable: true, launchSlotsRemaining: 100, loading: false });
      return;
    }

    try {
      setInfo(prev => ({ ...prev, loading: true }));
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (controller.signal.aborted) return;
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
    } catch {
      setInfo(prev => ({ ...prev, loading: false }));
    }
  }, [user, role, reset]);

  useEffect(() => {
    if (!user) { reset(); return; }
    checkSubscription();

    const bc = new BroadcastChannel("subscription_sync");
    channelRef.current = bc;
    bc.onmessage = (e) => { if (e.data?.type === "refresh") checkSubscription(); };

    intervalRef.current = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      bc.close(); channelRef.current = null;
      abortRef.current?.abort();
    };
  }, [user, checkSubscription, reset]);

  const refresh = useCallback(async () => {
    await checkSubscription();
    channelRef.current?.postMessage({ type: "refresh" });
  }, [checkSubscription]);

  const startCheckout = useCallback(async (): Promise<{ offer_type?: string }> => {
    const { data, error } = await supabase.functions.invoke("create-checkout");
    if (error || !data?.url) throw error || new Error("Impossible d'ouvrir le paiement. Réessayez.");
    // PASSE E: same-tab navigation — coherent UX, no 2-tab split
    window.location.href = data.url;
    return { offer_type: data.offer_type };
  }, []);

  const openBillingPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error || !data?.url) throw error || new Error("Impossible d'ouvrir le portail. Réessayez.");
    window.location.href = data.url;
  }, []);

  const redeemPromo = useCallback(async (code: string): Promise<{ valid: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke("redeem-promo", { body: { code } });
    if (error) throw error;
    if (data?.valid) await checkSubscription();
    return { valid: data?.valid ?? false, message: data?.message ?? "Erreur inconnue" };
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ ...info, refresh, startCheckout, openBillingPortal, redeemPromo }}>
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
  if (offerType === "standard") return "Abonnement annuel — 99 € TTC / an";
  return "Aucun abonnement";
}
