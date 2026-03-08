# CANONICAL MIGRATION SEQUENCE

## Status: replay-safe as of 2026-03-08

This document is the authoritative record of the migration order and what each
critical migration does. It exists because migration files are immutable once
applied, and some early migrations contain misleading comments that must be
understood before running a full replay.

---

## What is in this repo — verified filenames

The following files physically exist in `supabase/migrations/`:

```
20260308213829_d8c2baed-ea09-42d0-84ae-f43a22effaec.sql
20260308214710_ff43d5d4-cfc3-4604-a200-47636e3d5354.sql
20260308214735_d5ca7889-1695-4279-9a00-797b6dc952ca.sql
20260308215734_4ea7ab1c-8429-4271-a443-b3b1128f85da.sql
```

No other quota-related migration exists. There is no `20260309000001_e2f8b3a1`.
That filename was a fiction introduced in an earlier doc pass and has been removed.

---

## Quota billing — sequence

| File slug | What it does | Status |
|-----------|-------------|--------|
| `ff43d5d4` (`20260308214710`) | Creates `launch_quota_consumed` table + `increment_launch_quota_used_slots()` RPC | **Sole source of truth** for quota schema |
| `d8c2baed` (`20260308213829`) | Adds `user_agent` + `referrer` columns to `landing_ab_events`, poses CHECK + label-length constraints | **WARNING — dirty migration**: line 2 contains the false comment `launch_quota_consumed already ran in previous migration`. This is wrong for a fresh clone. The `ff43d5d4` migration runs AFTER this one (timestamps: 213829 < 214710). The comment is a lie; the SQL itself is independently correct. On a fresh DB, `d8c2baed` runs first and only touches `landing_ab_events`. |
| `d5ca7889` (`20260308214735`) | Cleans up legacy `event_type` values, then adds CHECK + label-length constraints idempotently | Supersedes the CHECK in `d8c2baed` — runs UPDATE first, then guards the constraint with `IF NOT EXISTS` |
| `4ea7ab1c` (`20260308215734`) | **SQUASH CORRECTIF**: idempotent replay-safe baseline. Ensures clean state for `landing_ab_events` and seeds `launch_quota` singleton row if missing. | Run this if a previous replay left constraints in broken state |

---

## landing_ab_events — constraint replay risk

**Problem**: `d8c2baed` originally tries to add CHECK constraints without first
cleaning legacy data. On a dirty intermediate DB this will fail if rows with
disallowed `event_type` values exist.

**Fix chain**:
1. `d5ca7889` adds idempotent UPDATE-before-CHECK logic.
2. `4ea7ab1c` (squash) re-runs the same cleanup unconditionally — any clone that
   skipped `d5ca7889` or ran `d8c2baed` in isolation still reaches clean state.

---

## launch_quota singleton

**Guarantee**: the squash migration (`4ea7ab1c`) inserts one row into
`launch_quota` only when `NOT EXISTS`. This guarantees at-least-one-row on a
fresh deploy.

**NOT guaranteed**: exactly-one-row. There is no `UNIQUE` constraint or trigger
preventing a second row from being manually inserted. The `verify-quota-flow.ts`
script uses `.single()` which will throw if 0 or 2+ rows exist. This is a
known fragility documented in the script's header.

**Implication**: on a production DB that was seeded correctly (exactly one row),
this is safe. On a DB with manual data surgery, it is not.

---

## Honest replay assessment

| Scenario | Safe? | Notes |
|----------|-------|-------|
| Fresh deploy (all migrations in order) | ✅ Yes | `4ea7ab1c` squash seeds quota row; constraints are idempotent |
| Replay with dirty `event_type` data | ✅ Yes | `d5ca7889` + `4ea7ab1c` both UPDATE before CHECK |
| `d8c2baed` applied alone on dirty data | ❌ No | CHECK without prior UPDATE will fail if bad rows exist |
| `launch_quota` with > 1 row | ❌ No | `.single()` throws; no DB-level constraint prevents this |

**Verdict**: fresh deploy is safe. Historical dirty replay depends on whether
the squash ran after the problematic migration.

---

## at_capacity — semantic truth

When the RPC returns `at_capacity`:
- A row **has been inserted** into `launch_quota_consumed`
- That row is **rolled back** by `quotaEngine.ts` (explicit DELETE after RPC returns `at_capacity`)
- Therefore: a row in `launch_quota_consumed` always means a slot was consumed
- The rollback code is in `supabase/functions/_shared/quotaEngine.ts`, lines visible in that file

---

## Verification

```bash
# Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
# Shortest form:
npm run verify:quota

# Or directly:
VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  deno run --allow-env --allow-net scripts/verify-quota-flow.ts
```

See `scripts/verify-quota-flow.ts` header for exact scope and limitations.

---

## What is NOT proven end-to-end

- The real Stripe webhook HTTP endpoint is **not** exercised by the verification script.
  The script calls `consumeLaunchSlotIfEligible()` directly (no HTTP).
- Stripe signature verification is not tested in the script.
- A true end-to-end test requires Stripe test-mode + webhook relay.
