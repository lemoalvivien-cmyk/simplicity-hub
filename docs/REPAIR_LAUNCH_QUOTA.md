# REPAIR LAUNCH QUOTA SINGLETON

## Purpose

This document provides the exact procedure to recover a `launch_quota` table
that contains more than one row before migration `1c3240fc` can be applied or
re-applied.

**When is this needed?**
- Migration `20260308221228_1c3240fc-bcb1-4538-b22b-51b417b4ae9b.sql` fails with
  a unique index violation.
- A previous deploy left multiple rows in `public.launch_quota`.
- The `verify-quota-flow.ts` script throws `"launch_quota row missing or error"`.

---

## Safety classification

**MANUAL-ONLY — do not run in an automated pipeline.**

These statements modify quota accounting data. Run them by a human operator
with a service-role connection against a verified backup.

---

## Step 1 — Inspect the current state

```sql
-- How many rows exist?
SELECT id, total_slots, used_slots, updated_at
FROM public.launch_quota
ORDER BY updated_at DESC;
```

Expected output on a clean DB: exactly one row.
If more than one row is returned, proceed to Step 2.

---

## Step 2 — Choose the row to keep

**Rule**: keep the row with the highest `used_slots` value and the most recent
`updated_at`. This preserves the most complete billing state.

If two rows have the same `used_slots`, keep the one with the more recent `updated_at`.

```sql
-- Identify the row to KEEP (highest used_slots, most recent updated_at)
SELECT id
FROM public.launch_quota
ORDER BY used_slots DESC, updated_at DESC
LIMIT 1;
-- Note this UUID — it is the KEEPER ID.
```

---

## Step 3 — Delete duplicate rows

Replace `<KEEPER_ID>` with the UUID identified in Step 2.

```sql
-- DELETE all rows except the keeper
-- VERIFY the keeper ID before running.
DELETE FROM public.launch_quota
WHERE id <> '<KEEPER_ID>';
```

Confirm:

```sql
SELECT COUNT(*) FROM public.launch_quota;
-- Expected: 1
```

---

## Step 4 — Create (or verify) the singleton index

If migration `1c3240fc` has not yet been applied, the index may not exist.

```sql
-- Create the singleton index (idempotent — safe to re-run)
CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_quota_singleton
  ON public.launch_quota ((TRUE));
```

If the index already exists and Step 3 was completed successfully, this is a no-op.

---

## Step 5 — Verify

```sql
-- Should return exactly 1 row with the correct slot counts
SELECT id, total_slots, used_slots, updated_at
FROM public.launch_quota;

-- Index should exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'launch_quota'
  AND indexname = 'idx_launch_quota_singleton';
```

---

## Step 6 — Run the verification script

After the repair, run the quota verification harness to confirm idempotency:

```bash
npm run verify:quota
```

Expected: 5 scenarios pass, 0 failures.

---

## What this does NOT fix

- If `launch_quota_consumed` contains rows for subscriptions that were never
  actually incremented (e.g. orphaned rows from a previous rollback failure),
  those must be audited separately. Cross-reference with your Stripe subscription
  list and the `used_slots` value.
- The real Stripe webhook HTTP endpoint is not exercised by `verify:quota`.
  A true end-to-end audit requires Stripe test-mode + webhook relay.

---

## Reference

- Migration introducing the singleton index: `20260308221228_1c3240fc-bcb1-4538-b22b-51b417b4ae9b.sql`
- Quota engine logic: `supabase/functions/_shared/quotaEngine.ts`
- Invariant: a row in `launch_quota_consumed` exists **if and only if** a slot was
  successfully incremented.
