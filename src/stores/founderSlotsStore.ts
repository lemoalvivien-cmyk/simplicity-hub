/**
 * Zustand store — Founder Slots (launch_quota)
 * Single source of truth: 1 fetch + 1 realtime channel for the entire app.
 * Replaces FounderSlotsContext (React Context + useEffect pattern).
 */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const URGENT_THRESHOLD = 10;

export interface FounderSlotsState {
  remaining: number | null;
  total: number;
  usedPct: number;
  isUrgent: boolean;
  isSoldOut: boolean;
  loading: boolean;
}

interface FounderSlotsActions {
  _fetch: () => Promise<void>;
  _startRealtime: () => () => void;
  _setSlots: (total: number, used: number) => void;
}

type FounderSlotsStore = FounderSlotsState & FounderSlotsActions;

function deriveState(
  remaining: number | null,
  total: number
): Pick<FounderSlotsState, "usedPct" | "isUrgent" | "isSoldOut"> {
  return {
    isSoldOut: remaining === 0,
    isUrgent: remaining !== null && remaining > 0 && remaining <= URGENT_THRESHOLD,
    usedPct:
      remaining !== null
        ? Math.round(((total - remaining) / total) * 100)
        : 0,
  };
}

let _channel: RealtimeChannel | null = null;

export const useFounderSlotsStore = create<FounderSlotsStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    remaining: null,
    total: 100,
    usedPct: 0,
    isUrgent: false,
    isSoldOut: false,
    loading: true,

    // ── Actions ────────────────────────────────────────────────────────────
    _setSlots: (total: number, used: number) => {
      const remaining = Math.max(0, total - used);
      set({ remaining, total, loading: false, ...deriveState(remaining, total) });
    },

    _fetch: async () => {
      try {
        const { data, error } = await supabase
          .from("launch_quota")
          .select("total_slots, used_slots")
          .single();
        if (!error && data) {
          // Display a credible minimum to create urgency — does NOT affect real quota
          const displayUsed = Math.max(data.used_slots, 23);
          get()._setSlots(data.total_slots, displayUsed);
        }
      } catch {
        // silent — keep previous value
      } finally {
        set((s) => (s.loading ? { loading: false } : {}));
      }
    },

    _startRealtime: () => {
      // Deduplicate — only one channel globally
      if (_channel) return () => {};

      _channel = supabase
        .channel("founder-slots-global")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "launch_quota" },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              total_slots?: number;
              used_slots?: number;
            } | null;
            if (
              row?.total_slots !== undefined &&
              row?.used_slots !== undefined
            ) {
              get()._setSlots(row.total_slots, row.used_slots);
            } else {
              get()._fetch();
            }
          }
        )
        .subscribe();

      return () => {
        if (_channel) {
          supabase.removeChannel(_channel);
          _channel = null;
        }
      };
    },
  }))
);

// ── Initializer: call once at app root, not per component ────────────────────
let _initialized = false;
let _cleanup: (() => void) | null = null;

export function initFounderSlots(): () => void {
  if (_initialized) return _cleanup ?? (() => {});
  _initialized = true;

  const store = useFounderSlotsStore.getState();
  store._fetch();
  _cleanup = store._startRealtime();

  return () => {
    _initialized = false;
    _cleanup?.();
    _cleanup = null;
  };
}

// ── Selectors (stable references for components) ─────────────────────────────
export const selectSlots = (s: FounderSlotsState) => ({
  remaining: s.remaining,
  total: s.total,
  usedPct: s.usedPct,
  isUrgent: s.isUrgent,
  isSoldOut: s.isSoldOut,
  loading: s.loading,
});
