# CANONICAL MIGRATION SEQUENCE

## Status: replay-safe as of 2026-03-08

This document is the authoritative record of the migration order and what each
critical migration does. It exists because migration files are immutable once
applied, and some early migrations contain misleading comments that must be
understood before running a full replay.

---

## What is in this repo — verified filenames

The following quota-related and landing_ab_events-related files physically
exist in `supabase/migrations/` as of 2026-03-08:

```
20260308213829_d8c2baed-ea09-42d0-84ae-f43a22effaec.sql
20260308214710_ff43d5d4-cfc3-4604-a200-47636e3d5354.sql
20260308214735_d5ca7889-1695-4279-9a00-797b6dc952ca.sql
20260308215734_4ea7ab1c-8429-4271-a443-b3b1128f85da.sql
20260308221228_1c3240fc-bcb1-4538-b22b-51b417b4ae9b.sql
```

No other quota-related or singleton-enforcement migration exists.
Any filename not in this list that appears in docs is a fiction.

---

## Quota billing — sequence

| File slug | What it does | Status |
|-----------|-------------|--------|
| `d8c2baed` (`20260308213829`) | Adds `user_agent` + `referrer` columns to `landing_ab_events`, adds CHECK + label-length constraints. | **DIRTY MIGRATION**: Contains a false comment claiming `launch_quota_consumed already ran`. **This comment is still present in the file and has NOT been corrected** — migration files are immutable once applied. The SQL itself only touches `landing_ab_events` and is correct on a fresh (empty) table. On a dirty DB with out-of-enum `event_type` rows, the CHECK will fail without the cleanup in subsequent migrations. |
| `ff43d5d4` (`20260308214710`) | Creates `launch_quota_consumed` table + `increment_launch_quota_used_slots()` RPC. | **Sole source of truth** for quota schema. |
| `d5ca7889` (`20260308214735`) | Cleans up legacy `event_type = 'variant_assign'` typo, then adds CHECK + label-length constraints idempotently. | Supersedes the unsafe CHECK in `d8c2baed` — runs UPDATE first, then guards the constraint with `IF NOT EXISTS`. |
| `4ea7ab1c` (`20260308215734`) | **SQUASH CORRECTIF**: idempotent replay-safe baseline. Normalises all out-of-enum `event_type` values, re-applies constraints idempotently, and seeds `launch_quota` singleton row if missing. | **Recommended operational baseline** — run this if a previous replay left constraints in broken state. |
| `1c3240fc` (`20260308221228`) | Adds `CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_quota_singleton ON public.launch_quota ((TRUE))`. | Enforces AT MOST one row in `launch_quota`. Combined with `4ea7ab1c` (which seeds AT LEAST one row), guarantees exactly one row. |

---

## landing_ab_events — constraint replay risk

**Problem**: `d8c2baed` tries to add CHECK constraints without first cleaning
legacy data. On a dirty intermediate DB this will fail if rows with disallowed
`event_type` values exist.

**Fix chain**:
1. `d5ca7889` adds idempotent UPDATE-before-CHECK logic.
2. `4ea7ab1c` (squash) re-runs the same cleanup unconditionally — any clone that
   skipped `d5ca7889` or ran `d8c2baed` in isolation still reaches clean state.

**The false comment** in `d8c2baed` is **still present and has NOT been corrected**.
Migration files are immutable once applied. The comment is factually wrong — it claims
`launch_quota_consumed` was already created in a prior migration, which is false (it is
created in `ff43d5d4`). This document explicitly contradicts that comment. The SQL
statements in `d8c2baed` are unrelated to quota and are otherwise correct.

---

## launch_quota singleton

**AT LEAST one row**: Guaranteed by the squash migration `4ea7ab1c` via
`INSERT WHERE NOT EXISTS`.

**AT MOST one row**: Guaranteed by migration `1c3240fc` via
`CREATE UNIQUE INDEX idx_launch_quota_singleton ON public.launch_quota ((TRUE))`.

**Combined guarantee**: On a fresh deploy with both migrations applied in order,
`launch_quota` will contain exactly one row. This is a DB-enforced constraint,
not a documentation claim.

**Script behaviour**: `verify-quota-flow.ts` uses `.maybeSingle()` (not `.single()`)
plus `.limit(1)` to read quota state. It will throw if the row is missing, but
will not throw on the JS side if there were multiple rows — the DB unique index
prevents that case from arising.

---

## Honest replay assessment

| Scenario | Safe? | Notes |
|----------|-------|-------|
| Fresh deploy (all 5 migrations in order) | ✅ Yes | `4ea7ab1c` seeds quota row; `1c3240fc` enforces singleton; constraints idempotent |
| Replay with dirty `event_type` data | ✅ Yes | `d5ca7889` + `4ea7ab1c` both UPDATE before CHECK |
| `d8c2baed` applied alone on dirty data | ❌ No | CHECK without prior UPDATE will fail if bad rows exist |
| `launch_quota` attempted duplicate INSERT | ✅ No | `idx_launch_quota_singleton` blocks it at DB level |

**Verdict**: Fresh deploy with all 5 migrations is safe. Historical dirty replay
is safe if the squash `4ea7ab1c` was included. `d8c2baed` alone on dirty data is
still unsafe — the fix is to always run the full migration chain.

---

## at_capacity — semantic truth

When the RPC returns `at_capacity`:
- A row **has been inserted** into `launch_quota_consumed`
- That row is **rolled back** by `quotaEngine.ts` (explicit DELETE after RPC returns `at_capacity` or `no_quota_row`)
- **INVARIANT enforced**: a row in `launch_quota_consumed` exists **if and only if** a slot was successfully incremented
- The rollback code is in `supabase/functions/_shared/quotaEngine.ts` lines 120–126

---

## Verification

```bash
# Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
# Shortest form (entry point in package.json):
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
- RPC error rollback (scenario 6) requires DB fault injection — not covered.
- Concurrent delivery race requires a parallel execution harness — not covered.
- A true end-to-end test requires Stripe test-mode + webhook relay.
