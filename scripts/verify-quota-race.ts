/**
 * QUOTA RACE TEST — Gap 4: concurrent delivery race
 *
 * WHAT THIS PROVES:
 *   Two concurrent calls to consumeLaunchSlotIfEligible() for the SAME
 *   subscription ID do not produce a double-increment.
 *
 *   The unique constraint on launch_quota_consumed.stripe_subscription_id
 *   is the primary guard. This test exercises that constraint under
 *   controlled concurrency using Promise.all().
 *
 * TECHNIQUE:
 *   - N_CONCURRENT calls are fired simultaneously (Promise.all) for the same sub ID.
 *   - Only one should return 'incremented'; the rest must return
 *     'skipped_already_consumed' or 'skipped_insert_conflict'.
 *   - used_slots must increase by exactly 1.
 *   - Exactly one consumed row must exist after all calls settle.
 *
 * LIMITATIONS:
 *   Promise.all() in a single Deno process shares the event loop — true OS-level
 *   parallelism is not exercised. Real concurrent webhook delivery (two distinct
 *   HTTP requests hitting the function simultaneously) is not tested here.
 *   The DB-level unique constraint is what matters; this test proves the
 *   insert-conflict path fires correctly under JS concurrency.
 *
 *   For true OS-level concurrency: use `deno run --unstable-worker-options` with
 *   multiple Web Workers, or a load-testing tool (e.g., k6, wrk) hitting the
 *   stripe-webhook endpoint directly with the same event ID.
 *
 * RUN:
 *   deno run --allow-env --allow-net scripts/verify-quota-race.ts
 *
 * PREREQUISITES:
 *   - VITE_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  consumeLaunchSlotIfEligible,
  PRICE_LAUNCH,
  type ConsumeResult,
} from "../supabase/functions/_shared/quotaEngine.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  Deno.exit(1);
}

const N_CONCURRENT = 5; // number of parallel calls for the same sub ID

const noop = () => {};

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`  ✅ PASS: ${name}`); passed++; }
  else { console.error(`  ❌ FAIL: ${name}${detail ? " — " + detail : ""}`); failed++; }
}

async function getUsedSlots(db: ReturnType<typeof createClient>): Promise<number> {
  const { data, error } = await db
    .from("launch_quota").select("used_slots").limit(1).maybeSingle();
  if (error || !data) throw new Error("launch_quota row missing: " + error?.message);
  return data.used_slots as number;
}

async function consumedRowExists(db: ReturnType<typeof createClient>, subId: string): Promise<boolean> {
  const { data } = await db
    .from("launch_quota_consumed").select("id").eq("stripe_subscription_id", subId).maybeSingle();
  return data !== null;
}

async function cleanupConsumedRow(db: ReturnType<typeof createClient>, subId: string) {
  await db.from("launch_quota_consumed").delete().eq("stripe_subscription_id", subId);
}

// ─── Scenario: N concurrent calls, same subscription ─────────────────────────
console.log("\n" + "─".repeat(60));
console.log(`GAP TEST 4: Concurrent delivery race (${N_CONCURRENT} parallel calls, same sub ID)`);
console.log("─".repeat(60));

const TEST_SUB = `test_sub_race_${Date.now()}`;

// Each concurrent call gets its own Supabase client instance to avoid
// connection sharing that could serialize requests artificially.
const clients = Array.from({ length: N_CONCURRENT }, () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
);

// Cleanup before test
for (const c of clients) await cleanupConsumedRow(c, TEST_SUB).catch(() => null);

const slotsBefore = await getUsedSlots(clients[0]);
console.log(`  Slots before: ${slotsBefore}`);

// Fire all N calls simultaneously
const results: ConsumeResult[] = await Promise.all(
  clients.map(c => consumeLaunchSlotIfEligible(c, TEST_SUB, "launch", PRICE_LAUNCH, noop))
);

const slotsAfter = await getUsedSlots(clients[0]);
const consumedExists = await consumedRowExists(clients[0], TEST_SUB);

console.log(`  Results:     ${JSON.stringify(results)}`);
console.log(`  Slots after: ${slotsAfter}`);

const incrementedCount = results.filter(r => r === "incremented").length;
const skippedCount     = results.filter(r =>
  r === "skipped_already_consumed" || r === "skipped_insert_conflict"
).length;
const otherCount       = results.filter(r =>
  r !== "incremented" && r !== "skipped_already_consumed" && r !== "skipped_insert_conflict"
).length;

assert(
  `exactly 1 of ${N_CONCURRENT} calls returned 'incremented'`,
  incrementedCount === 1,
  `got ${incrementedCount} incremented results`
);
assert(
  `remaining ${N_CONCURRENT - 1} calls were safely skipped`,
  skippedCount === N_CONCURRENT - 1,
  `got ${skippedCount} skipped, ${otherCount} unexpected`
);
assert(
  "used_slots increased by exactly 1 (no double-increment)",
  slotsAfter === slotsBefore + 1,
  `before=${slotsBefore} after=${slotsAfter} delta=${slotsAfter - slotsBefore}`
);
assert(
  "exactly 1 consumed row exists (not N)",
  consumedExists,
  "consumed row should exist"
);

// Count consumed rows explicitly
const { data: allRows } = await clients[0]
  .from("launch_quota_consumed")
  .select("id")
  .eq("stripe_subscription_id", TEST_SUB);
assert(
  "consumed row count is exactly 1",
  (allRows?.length ?? 0) === 1,
  `found ${allRows?.length ?? 0} rows`
);

// Cleanup
for (const c of clients) await cleanupConsumedRow(c, TEST_SUB).catch(() => null);
// Restore used_slots
await clients[0].from("launch_quota")
  .update({ used_slots: slotsBefore })
  .neq("id", "00000000-0000-0000-0000-000000000000");

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Race test: ${passed} passed, ${failed} failed`);

console.log(`\nCONCURRENCY NOTE:`);
console.log(`  This test uses Promise.all() in a single Deno event loop.`);
console.log(`  It proves the DB unique constraint fires correctly under JS concurrency.`);
console.log(`  It does NOT prove OS-level parallelism (two separate processes/workers).`);
console.log(`  For true multi-process test: run this script twice simultaneously,`);
console.log(`  or use k6 / wrk against the stripe-webhook endpoint with same event ID.`);

if (failed > 0) {
  console.error("\n❌ Race test failures — double-increment risk detected!");
  Deno.exit(1);
} else {
  console.log("\n✅ Gap 4 (JS concurrency): unique constraint holds. No double-increment.");
  console.log("   Caveat: OS-level multi-process concurrency not exercised here.");
}
