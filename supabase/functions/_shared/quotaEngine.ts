/**
 * QUOTA ENGINE — Single source of truth for launch slot consumption.
 *
 * This module is imported by:
 *   - supabase/functions/stripe-webhook/index.ts  (production path)
 *   - scripts/verify-quota-flow.ts                (verification harness)
 *
 * NEVER duplicate this logic. If the behaviour must change, change it here only.
 *
 * CONTRACT:
 *   consumeLaunchSlotIfEligible(db, subscriptionId, offerType, priceId)
 *     -> ConsumeResult
 *
 * IDEMPOTENCY GUARANTEE:
 *   The launch_quota_consumed table holds a UNIQUE constraint on
 *   stripe_subscription_id. The insert into that table acts as the
 *   dedup gate. A concurrent or re-delivered webhook will hit a
 *   unique-violation and return 'skipped_insert_conflict' without
 *   ever calling the RPC.
 *
 * at_capacity ROLLBACK:
 *   If the RPC returns 'at_capacity', the consumed row is deleted before
 *   returning. This ensures: a row present in launch_quota_consumed always
 *   and only means a slot was actually incremented. No ambiguous state.
 *
 * no_quota_row:
 *   The launch_quota table must have exactly one row (seeded by the squash
 *   migration). If it is empty, the RPC returns 'no_quota_row'. This is a
 *   misconfiguration — the webhook logs it and returns without consuming.
 */

import { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

/** Price ID for the launch offer — only this price consumes a quota slot */
export const PRICE_LAUNCH = "price_1T8GOWEG497aCUFxjNjFjk4t";

export type ConsumeResult =
  | "skipped_not_launch"       // offer_type !== 'launch' OR price_id !== PRICE_LAUNCH
  | "skipped_already_consumed" // row already in launch_quota_consumed (idempotent check)
  | "skipped_insert_conflict"  // concurrent redelivery: unique constraint hit
  | "rpc_error"                // RPC call failed; consumed row rolled back
  | "incremented"              // slot successfully consumed
  | "at_capacity"              // quota full; consumed row rolled back; no slot consumed
  | "no_quota_row";            // launch_quota table is empty (misconfiguration)

/**
 * Idempotently consume one launch slot for a given Stripe subscription.
 *
 * Steps:
 *  1. Guard: skip immediately if not a launch offer with matching price.
 *  2. Check launch_quota_consumed for existing record (fast dedup).
 *  3. Insert into launch_quota_consumed (unique constraint = dedup gate).
 *  4. Call increment_launch_quota_used_slots() RPC atomically.
 *  5. On 'at_capacity': DELETE the consumed row (no slot was taken; no trace left).
 *  6. On RPC error: DELETE the consumed row (caller can retry on redelivery).
 *
 * INVARIANT after this function returns:
 *   - A row in launch_quota_consumed <=> used_slots was incremented for that sub.
 *   - No row in launch_quota_consumed for this sub <=> no slot was consumed.
 */
export async function consumeLaunchSlotIfEligible(
  db: SupabaseClient,
  subscriptionId: string,
  offerType: string | null | undefined,
  priceId: string | null | undefined,
  log: (msg: string, detail?: unknown) => void = () => {}
): Promise<ConsumeResult> {
  // Guard 1: only launch offer + matching price
  if (offerType !== "launch" || priceId !== PRICE_LAUNCH) {
    log("Slot consumption skipped — not a launch offer", { offerType, priceId });
    return "skipped_not_launch";
  }

  // Guard 2: idempotency check — row already present?
  const { data: existing } = await db
    .from("launch_quota_consumed")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (existing) {
    log("Slot already consumed for this subscription — skipping", { subscriptionId });
    return "skipped_already_consumed";
  }

  // Dedup gate: insert first; unique constraint prevents concurrent double-consume
  const { error: insertError } = await db
    .from("launch_quota_consumed")
    .insert({ stripe_subscription_id: subscriptionId });

  if (insertError) {
    // Unique constraint violation = concurrent redelivery — safe to skip
    log("Slot insert conflict (concurrent redelivery) — skipping", {
      error: insertError.message,
    });
    return "skipped_insert_conflict";
  }

  // Atomic increment via RPC (FOR UPDATE lock inside the function)
  const { data: rpcResult, error: updateError } = await db.rpc(
    "increment_launch_quota_used_slots"
  );

  if (updateError) {
    log("ERROR incrementing launch quota — rolling back consumed record", {
      error: updateError.message,
    });
    // Rollback: delete the consumed record so next delivery can retry
    await db
      .from("launch_quota_consumed")
      .delete()
      .eq("stripe_subscription_id", subscriptionId);
    return "rpc_error";
  }

  const result = rpcResult as ConsumeResult;

  // at_capacity: RPC confirmed no slot was taken — delete the consumed row.
  // INVARIANT: a row in launch_quota_consumed MUST mean a slot was incremented.
  if (result === "at_capacity" || result === "no_quota_row") {
    log(`RPC returned '${result}' — rolling back consumed record`, { subscriptionId });
    await db
      .from("launch_quota_consumed")
      .delete()
      .eq("stripe_subscription_id", subscriptionId);
  }

  log("consumeLaunchSlotIfEligible result", { subscriptionId, result });
  return result;
}
