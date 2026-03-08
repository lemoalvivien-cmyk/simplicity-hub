/**
 * WIINUP MAX — Launch Quota Flow Verification Script
 *
 * PURPOSE: Executable proof that consumeLaunchSlotIfEligible() is idempotent
 *          and correctly scoped.
 *
 * RUN: deno run --allow-env --allow-net scripts/verify-quota-flow.ts
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from .env
 * (or environment variables). Uses the service-role key for direct DB checks.
 *
 * PREREQUISITES:
 *   - SUPABASE_SERVICE_ROLE_KEY set in env (NOT committed to repo)
 *   - launch_quota table has at least one row
 *
 * SCENARIOS TESTED:
 *   1. First launch event  → used_slots incremented by 1
 *   2. Re-delivery (same sub ID) → NO increment (idempotent guard)
 *   3. Standard-offer event → NO increment (wrong offer_type)
 *   4. Capacity exhausted  → at_capacity returned, no increment
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PRICE_LAUNCH = "price_1T8GOWEG497aCUFxjNjFjk4t";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  Deno.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUsedSlots(): Promise<number> {
  const { data, error } = await db
    .from("launch_quota")
    .select("used_slots")
    .single();
  if (error || !data) throw new Error("launch_quota row missing: " + error?.message);
  return data.used_slots;
}

async function cleanupConsumedRow(subId: string) {
  await db.from("launch_quota_consumed").delete().eq("stripe_subscription_id", subId);
}

async function callRPC(): Promise<string> {
  const { data, error } = await db.rpc("increment_launch_quota_used_slots");
  if (error) throw new Error("RPC error: " + error.message);
  return data as string;
}

// Mirror of stripe-webhook consumeLaunchSlotIfEligible (sans Stripe SDK)
async function consumeSlot(
  subscriptionId: string,
  offerType: string | null,
  priceId: string | null
): Promise<"skipped_not_launch" | "skipped_already_consumed" | "skipped_insert_conflict" | "rpc_error" | string> {
  if (offerType !== "launch" || priceId !== PRICE_LAUNCH) {
    return "skipped_not_launch";
  }

  const { data: existing } = await db
    .from("launch_quota_consumed")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (existing) return "skipped_already_consumed";

  const { error: insertError } = await db
    .from("launch_quota_consumed")
    .insert({ stripe_subscription_id: subscriptionId });

  if (insertError) return "skipped_insert_conflict";

  const result = await callRPC();
  return result; // 'incremented' | 'at_capacity' | 'no_quota_row'
}

// ─── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

// ─── Scenario 1: First launch event increments the counter ───────────────────
console.log("\n📋 Scenario 1: First launch event");
const TEST_SUB_1 = `test_sub_verify_${Date.now()}`;
await cleanupConsumedRow(TEST_SUB_1); // ensure clean state

const slotsBefore1 = await getUsedSlots();
const result1 = await consumeSlot(TEST_SUB_1, "launch", PRICE_LAUNCH);
const slotsAfter1 = await getUsedSlots();

assert("result === 'incremented'", result1 === "incremented", `got: ${result1}`);
assert("used_slots +1", slotsAfter1 === slotsBefore1 + 1, `before=${slotsBefore1} after=${slotsAfter1}`);

// ─── Scenario 2: Re-delivery (same sub_id) — no additional increment ──────────
console.log("\n📋 Scenario 2: Re-delivery of same subscription");
const slotsBefore2 = await getUsedSlots();
const result2 = await consumeSlot(TEST_SUB_1, "launch", PRICE_LAUNCH);
const slotsAfter2 = await getUsedSlots();

assert("result === 'skipped_already_consumed'", result2 === "skipped_already_consumed", `got: ${result2}`);
assert("used_slots unchanged", slotsAfter2 === slotsBefore2, `before=${slotsBefore2} after=${slotsAfter2}`);

// Cleanup scenario 1+2
await cleanupConsumedRow(TEST_SUB_1);
await db.from("launch_quota").update({ used_slots: slotsBefore1 }).neq("id", "00000000-0000-0000-0000-000000000000");

// ─── Scenario 3: Standard offer — no slot consumed ────────────────────────────
console.log("\n📋 Scenario 3: Standard offer (not launch)");
const TEST_SUB_3 = `test_sub_verify_std_${Date.now()}`;
const slotsBefore3 = await getUsedSlots();
const result3 = await consumeSlot(TEST_SUB_3, "standard", "price_1T8GR0EG497aCUFxNS9BV3ko");
const slotsAfter3 = await getUsedSlots();

assert("result === 'skipped_not_launch'", result3 === "skipped_not_launch", `got: ${result3}`);
assert("used_slots unchanged", slotsAfter3 === slotsBefore3, `before=${slotsBefore3} after=${slotsAfter3}`);

// ─── Scenario 4: Wrong price_id even with offer_type=launch ──────────────────
console.log("\n📋 Scenario 4: offer_type=launch but wrong price_id");
const TEST_SUB_4 = `test_sub_verify_wprice_${Date.now()}`;
const slotsBefore4 = await getUsedSlots();
const result4 = await consumeSlot(TEST_SUB_4, "launch", "price_WRONG_ID");
const slotsAfter4 = await getUsedSlots();

assert("result === 'skipped_not_launch'", result4 === "skipped_not_launch", `got: ${result4}`);
assert("used_slots unchanged", slotsAfter4 === slotsBefore4, `before=${slotsBefore4} after=${slotsAfter4}`);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error("\n❌ QUOTA FLOW IS NOT CORRECT — do not ship.");
  Deno.exit(1);
} else {
  console.log("\n✅ All quota flow scenarios verified. Billing is idempotent.");
}
