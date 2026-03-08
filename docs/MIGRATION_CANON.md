# CANONICAL MIGRATION SEQUENCE

## Status: replay-safe as of 2026-03-08

This document is the authoritative record of the migration order and what each
critical migration does. It exists because migration files are immutable once
applied, and some early migrations contain misleading comments that must be
understood before running a full replay.

---

## Quota billing — sequence

| File | What it does | Notes |
|------|-------------|-------|
| `20260308214710_ff43d5d4` | Creates `launch_quota_consumed` table + `increment_launch_quota_used_slots()` RPC | **Sole source of truth** for quota accounting |
| `20260308213829_d8c2baed` | Adds `user_agent` + `referrer` columns to `landing_ab_events` | **WARNING**: line 2–3 contains a false comment claiming `launch_quota_consumed` "already ran in previous migration". This is wrong for a fresh clone. The `ff43d5d4` migration above runs AFTER this one (timestamps: 213829 < 214710). On a fresh DB, the table is created at `214710`, not before `213829`. The comment is misleading but the SQL is harmless. |
| `20260308214735_d5ca7889` | Cleans up legacy `event_type` values, then adds CHECK + label-length constraints | Safe: runs UPDATE before CHECK |
| `20260309000001_e2f8b3a1` | **SQUASH CORRECTIF**: idempotent replay-safe baseline for `landing_ab_events` constraints. Ensures clean state regardless of which prior migrations applied partially. | Run this if a previous replay left constraints in broken state |

---

## landing_ab_events — constraint replay risk

**Problem**: `20260308213829_d8c2baed` originally tried to add CHECK constraints
*before* cleaning legacy data. On a dirty intermediate DB this would fail.

**Fix**: `20260308214735_d5ca7889` wraps the CHECK in `DO $$ IF NOT EXISTS $$`
and runs `UPDATE` cleanup first. This handles the dirty-DB case.

**Squash correctif** (`20260309000001`): ensures idempotent state on any clone
regardless of which combination of prior migrations applied.

---

## Verification

To verify quota accounting end-to-end:

```bash
# Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
deno run --allow-env --allow-net scripts/verify-quota-flow.ts
```

See `scripts/verify-quota-flow.ts` for exact scenarios covered and limitations.

---

## What is NOT proven end-to-end

- The real Stripe webhook is **not** exercised by the verification script.
  The script calls the same quota engine module directly (no HTTP).
  A true end-to-end test would require a Stripe test mode + webhook relay.
- Stripe signature verification is only tested in production/staging environments
  where `STRIPE_WEBHOOK_SECRET` is set.
