/**
 * useFounderSlots — Realtime-aware Founder Pass slot counter
 * Subscribes to `launch_quota` via Supabase Realtime for live updates.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FounderSlotsState {
  remaining: number | null;   // null = loading
  total: number;
  usedPct: number;            // 0-100, how full the bar is
  isUrgent: boolean;          // ≤ 10 places
  isSoldOut: boolean;         // 0 places
  loading: boolean;
}

const URGENT_THRESHOLD = 10;

export function useFounderSlots(): FounderSlotsState {
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

    // Realtime subscription on launch_quota table
    const channel = supabase
      .channel("founder-slots-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "launch_quota",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { total_slots?: number; used_slots?: number } | null;
          if (row?.total_slots !== undefined && row?.used_slots !== undefined) {
            setTotal(row.total_slots);
            setRemaining(Math.max(0, row.total_slots - row.used_slots));
          } else {
            // Fallback: re-fetch if payload is incomplete
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

  return { remaining, total, usedPct, isUrgent, isSoldOut, loading };
}
