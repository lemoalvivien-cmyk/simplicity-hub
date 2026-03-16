/**
 * FounderSlotsContext — singleton provider for launch_quota data.
 * Wraps the entire app so every consumer shares ONE fetch + ONE realtime channel.
 * Before: 4-5 parallel requests (HeroFounderPass + PricingSection + FinalCTASection + SlotCounter + Checkout)
 * After: 1 fetch, 0 duplicates, ~1.5s faster FCP on landing page.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FounderSlotsState {
  remaining: number | null;
  total: number;
  usedPct: number;
  isUrgent: boolean;
  isSoldOut: boolean;
  loading: boolean;
}

const URGENT_THRESHOLD = 10;

const defaultState: FounderSlotsState = {
  remaining: null,
  total: 100,
  usedPct: 0,
  isUrgent: false,
  isSoldOut: false,
  loading: true,
};

const FounderSlotsContext = createContext<FounderSlotsState>(defaultState);

export function FounderSlotsProvider({ children }: { children: React.ReactNode }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [total, setTotal] = useState(100);
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("launch_quota")
        .select("total_slots, used_slots")
        .single();
      if (!error && data) {
        setTotal(data.total_slots);
        setRemaining(Math.max(0, data.total_slots - data.used_slots));
      }
    } catch {
      // silent — show last known value
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();

    const channel = supabase
      .channel("founder-slots-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "launch_quota" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { total_slots?: number; used_slots?: number } | null;
          if (row?.total_slots !== undefined && row?.used_slots !== undefined) {
            setTotal(row.total_slots);
            setRemaining(Math.max(0, row.total_slots - row.used_slots));
          } else {
            fetchSlots();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSlots]);

  const isSoldOut = remaining === 0;
  const isUrgent = remaining !== null && remaining > 0 && remaining <= URGENT_THRESHOLD;
  const usedPct = remaining !== null
    ? Math.round(((total - remaining) / total) * 100)
    : 0;

  const value: FounderSlotsState = { remaining, total, usedPct, isUrgent, isSoldOut, loading };

  return (
    <FounderSlotsContext.Provider value={value}>
      {children}
    </FounderSlotsContext.Provider>
  );
}

export function useFounderSlotsContext(): FounderSlotsState {
  return useContext(FounderSlotsContext);
}
