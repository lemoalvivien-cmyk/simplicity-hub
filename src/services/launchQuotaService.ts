/**
 * Service layer — launch_quota
 * All Supabase access for launch quota is centralised here.
 * UI components must NEVER import supabase directly for this data.
 */
import { supabase } from "@/integrations/supabase/client";

export interface LaunchQuotaData {
  total_slots: number;
  used_slots: number;
  remaining: number;
}

export async function fetchLaunchQuota(): Promise<LaunchQuotaData | null> {
  const { data, error } = await supabase
    .from("launch_quota")
    .select("total_slots, used_slots")
    .single();

  if (error || !data) return null;

  return {
    total_slots: data.total_slots,
    used_slots: data.used_slots,
    remaining: Math.max(0, data.total_slots - data.used_slots),
  };
}
