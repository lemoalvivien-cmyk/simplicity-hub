/**
 * WIINUP MAX — Launch Quota Flow Verification Script
 *
 * WHAT THIS PROVES (exactly, no more):
 *   The consumeLaunchSlotIfEligible() function — shared with the Stripe webhook —
 *   behaves correctly for all 5 accounting scenarios against a real DB.
 *
 * WHAT THIS DOES NOT PROVE:
 *   - The real Stripe webhook endpoint is NOT called here.
 *   - Stripe signature verification is NOT tested here.
 *   - This is a unit/integration harness against the DB, not an E2E test.
 *   - For true E2E, a Stripe test-mode webhook relay is required.
 *
 * SCOPE: PARTIAL PROOF — DB-level idempotency, not webhook HTTP path.
 *
 * RUN:
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   deno run --allow-env --allow-net scripts/verify-quota-flow.ts
 *
 * PREREQUISITES:
 *   - VITE_SUPABASE_URL in env (or .env file)
 *   - SUPABASE_SERVICE_ROLE_KEY in env (NEVER committed to repo)
 *   - launch_quota table has exactly one row (created by squash migration)
 *
 * SCENARIOS TESTED (5):
 *   1. First launch event           → used_slots +1  (returns 'incremented')
 *   2. Re-delivery same sub ID      → used_slots +0  (returns 'skipped_already_consumed')
 *   3. Standard offer               → used_slots +0  (returns 'skipped_not_launch')
 *   4. offer_type=launch wrong price → used_slots +0 (returns 'skipped_not_launch')
 *   5. Capacity exhausted (at_capacity) → used_slots +0 (returns 'at_capacity')
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  consumeLaunchSlotIfEligible,
  PRICE_LAUNCH,
  type ConsumeResult,
} from "../supabase/functions/_shared/quotaEngine.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  Deno.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Silent logger for verification runs
const noop = () => {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUsedSlots(): Promise<number> {
  const { data, error } = await db
    .from("launch_quota")
    .select("used_slots")
    .single();
  if (error || !data) throw new Error("launch_quota row missing: " + error?.message);
  return data.used_slots as number;
}

async function getTotalSlots(): Promise<number> {
  const { data, error } = await db
    .from("launch_quota")
    .select("total_slots")
    .single();
  if (error || !data) throw new Error("launch_quota row missing: " + error?.message);
  return data.total_slots as number;
}

async function setUsedSlots(n: number) {
  // Direct update via service role — only used in verification/cleanup
  await db
    .from("launch_quota")
    .update({ used_slots: n })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // update the single row
}

async function cleanupConsumedRow(subId: string) {
  await db
    .from("launch_quota_consumed")
    .delete()
    .eq("stripe_subscription_id", subId);
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

// Snapshot initial quota state for safe restore
const initialSlots = await getUsedSlots();
const totalSlots   = await getTotalSlots();

console.log(`\nQuota state: ${initialSlots}/${totalSlots} slots used`);
console.log("─".repeat(60));
console.log("NOTE: This script tests consumeLaunchSlotIfEligible() against");
console.log("      a real DB using the SAME module imported by stripe-webhook.");
console.log("      It does NOT exercise the HTTP webhook endpoint.");
console.log("─".repeat(60));

// ─── Scenario 1: First launch event increments the counter ───────────────────
console.log("\n📋 Scenario 1: First launch event");
const TEST_SUB_1 = `test_sub_verify_${Date.now()}`;
await cleanupConsumedRow(TEST_SUB_1);

const slotsBefore1 = await getUsedSlots();
const result1: ConsumeResult = await consumeLaunchSlotIfEligible(
  db, TEST_SUB_1, "launch", PRICE_LAUNCH, noop
);
const slotsAfter1 = await getUsedSlots();

assert("result === 'incremented'", result1 === "incremented", `got: ${result1}`);
assert("used_slots +1", slotsAfter1 === slotsBefore1 + 1, `before=${slotsBefore1} after=${slotsAfter1}`);

// ─── Scenario 2: Re-delivery — no additional increment ──────────────────────
console.log("\n📋 Scenario 2: Re-delivery of same subscription (idempotency)");
const slotsBefore2 = await getUsedSlots();
const result2: ConsumeResult = await consumeLaunchSlotIfEligible(
  db, TEST_SUB_1, "launch", PRICE_LAUNCH, noop
);
const slotsAfter2 = await getUsedSlots();

assert(
  "result === 'skipped_already_consumed'",
  result2 === "skipped_already_consumed",
  `got: ${result2}`
);
assert(
  "used_slots unchanged",
  slotsAfter2 === slotsBefore2,
  `before=${slotsBefore2} after=${slotsAfter2}`
);

// Cleanup scenarios 1+2
await cleanupConsumedRow(TEST_SUB_1);
await setUsedSlots(slotsBefore1); // restore to pre-test state

// ─── Scenario 3: Standard offer — no slot consumed ───────────────────────────
console.log("\n📋 Scenario 3: Standard offer (offer_type != launch)");
const TEST_SUB_3 = `test_sub_verify_std_${Date.now()}`;
const slotsBefore3 = await getUsedSlots();
const result3: ConsumeResult = await consumeLaunchSlotIfEligible(
  db, TEST_SUB_3, "standard", "price_1T8GR0EG497aCUFxNS9BV3ko", noop
);
const slotsAfter3 = await getUsedSlots();

assert("result === 'skipped_not_launch'", result3 === "skipped_not_launch", `got: ${result3}`);
assert("used_slots unchanged", slotsAfter3 === slotsBefore3, `before=${slotsBefore3} after=${slotsAfter3}`);

// ─── Scenario 4: offer_type=launch but wrong price_id ────────────────────────
console.log("\n📋 Scenario 4: offer_type=launch but wrong price_id");
const TEST_SUB_4 = `test_sub_verify_wprice_${Date.now()}`;
const slotsBefore4 = await getUsedSlots();
const result4: ConsumeResult = await consumeLaunchSlotIfEligible(
  db, TEST_SUB_4, "launch", "price_WRONG_ID_NOTREAL", noop
);
const slotsAfter4 = await getUsedSlots();

assert("result === 'skipped_not_launch'", result4 === "skipped_not_launch", `got: ${result4}`);
assert("used_slots unchanged", slotsAfter4 === slotsBefore4, `before=${slotsBefore4} after=${slotsAfter4}`);

// ─── Scenario 5: Capacity exhausted → at_capacity ────────────────────────────
console.log("\n📋 Scenario 5: Capacity exhausted (used_slots == total_slots)");
const TEST_SUB_5 = `test_sub_verify_cap_${Date.now()}`;
await cleanupConsumedRow(TEST_SUB_5);

// Temporarily fill quota to capacity
await setUsedSlots(totalSlots);
const slotsBefore5 = await getUsedSlots();

const result5: ConsumeResult = await consumeLaunchSlotIfEligible(
  db, TEST_SUB_5, "launch", PRICE_LAUNCH, noop
);
const slotsAfter5 = await getUsedSlots();

assert("result === 'at_capacity'", result5 === "at_capacity", `got: ${result5}`);
assert(
  "used_slots unchanged at capacity",
  slotsAfter5 === slotsBefore5,
  `before=${slotsBefore5} after=${slotsAfter5}`
);

// Cleanup scenario 5: restore slot count and remove any consumed row
// Note: at_capacity means the RPC returned early — the consumed row was inserted
// but RPC never incremented. We must clean up the consumed row too.
await cleanupConsumedRow(TEST_SUB_5);
await setUsedSlots(initialSlots); // restore to initial state

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`\nScope reminder: DB-level integration test only.`);
console.log(`The real Stripe webhook HTTP path is NOT covered by this script.`);

if (failed > 0) {
  console.error("\n❌ QUOTA FLOW HAS FAILURES — do not ship.");
  Deno.exit(1);
} else {
  console.log("\n✅ All 5 quota scenarios verified. DB-level idempotency confirmed.");
}
