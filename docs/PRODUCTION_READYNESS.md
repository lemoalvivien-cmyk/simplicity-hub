/**
 * PRODUCTION READYNESS — WIINUP MAX
 * Generated: 2026-03-08
 * Stamp: RC-2026-03-08-HARDENING-V1
 *
 * THIS DOCUMENT IS A FACTUAL AUDIT — NOT MARKETING.
 * Every claim maps to a file or an executed test. No claim exceeds its proof.
 */

# PRODUCTION READYNESS

## 1. State Before This Hardening Pass

| What                               | State                                           |
|------------------------------------|-------------------------------------------------|
| Quota engine (`quotaEngine.ts`)    | ✅ Shared, single source of truth               |
| Stripe webhook                     | ✅ Imports quotaEngine, mandatory sig verify     |
| DB-level idempotency (5 scenarios) | ✅ `scripts/verify-quota-flow.ts` — 5 scenarios  |
| Gap 1 — RPC error rollback         | ⚠️  Logic in code, not exercised by test         |
| Gap 2 — no_quota_row               | ⚠️  Logic in code, not exercised by test         |
| Gap 3 — Stripe HTTP path           | ❌  Not exercised (requires Stripe CLI relay)     |
| Gap 4 — Concurrent delivery race   | ⚠️  DB constraint exists, not tested concurrently |
| CI pipeline                        | ❌  None                                         |
| Hardened public endpoints          | ⚠️  Partial (create-checkout had origin check)   |
| Structured logs on critical flows  | ⚠️  Inconsistent                                 |
| PRODUCTION_READYNESS doc           | ❌  None                                         |

---

## 2. Gap Coverage After This Pass

### Gap 1 — RPC Error Rollback

- **Script:** `scripts/verify-quota-gaps.ts`
- **Technique:** Fault injection — temporarily swaps `increment_launch_quota_used_slots()`
  with a version that raises an exception, exercises the rollback branch, then restores.
- **Status:** ⚠️  PARTIALLY CLOSED
- **Blocker:** The swap requires `CREATE OR REPLACE FUNCTION` rights via DDL execution.
  Standard Supabase projects do not expose arbitrary DDL over HTTP. Requires one of:
  - An `execute_ddl` RPC created by an admin in the Supabase SQL editor
  - A direct `psql` connection with the service role credentials
  - The Supabase Management API (project-level SQL endpoint)
- **What the code proves:** The rollback branch exists and is correct by code inspection.
  `quotaEngine.ts:104–113` — on RPC error, the consumed row is deleted before returning.
- **Residual risk:** If the DELETE in the rollback branch fails silently, an orphaned row
  could block future retries. This failure mode is not tested.
- **Honest verdict:** Logic is correct. Test is not executable via HTTP-only API.
  Run manually: see `scripts/verify-quota-gaps.ts` + Supabase SQL editor.

### Gap 2 — no_quota_row

- **Script:** `scripts/verify-quota-gaps.ts`
- **Technique:** Swap RPC to return `'no_quota_row'` unconditionally, verify rollback.
- **Status:** ⚠️  PARTIALLY CLOSED (same DDL blocker as Gap 1)
- **What the code proves:** `quotaEngine.ts:120–126` — `no_quota_row` triggers the same
  rollback path as `at_capacity`. Consumed row is deleted.
- **Honest verdict:** Same as Gap 1. DDL access required for execution.

### Gap 3 — Stripe HTTP Path + Signature Verification

- **Script:** None automated. Manual procedure only.
- **Status:** ❌  NOT EXERCISED AUTOMATICALLY
- **Manual procedure (must be run before go-live):**
  ```
  # Install Stripe CLI
  brew install stripe/stripe-cli/stripe
  stripe login

  # Forward to deployed function
  stripe listen --forward-to https://usnriklfiagazpffsqew.supabase.co/functions/v1/stripe-webhook

  # In a second terminal, trigger a test event
  stripe trigger checkout.session.completed

  # Expected logs in function:
  #   [STRIPE-WEBHOOK] Event verified - { type: "checkout.session.completed", id: "evt_..." }
  #   [STRIPE-WEBHOOK] Quota consume result - { consumeResult: "incremented" | "skipped_not_launch" }
  ```
- **What the existing code proves:**
  - `stripe-webhook/index.ts:44` — `constructEventAsync()` is mandatory; no fallback.
  - A missing or invalid signature returns 400.
  - A missing `STRIPE_WEBHOOK_SECRET` returns 500 with a clear error message.
- **Residual risk (HIGH):** The Stripe HTTP path has never been exercised end-to-end.
  The signature verification key (`STRIPE_WEBHOOK_SECRET`) must be set and correct.
  Without this, all real Stripe events will fail at the signature check.
- **Prerequisite:** `STRIPE_WEBHOOK_SECRET` secret must be configured before go-live.

### Gap 4 — Concurrent Delivery Race

- **Script:** `scripts/verify-quota-race.ts`
- **Technique:** `Promise.all()` with N=5 parallel clients, same subscription ID.
- **Status:** ✅ EXERCISED (JS concurrency level)
- **What is proved:** The DB unique constraint on `launch_quota_consumed.stripe_subscription_id`
  fires correctly under JavaScript event-loop concurrency. Exactly 1 `'incremented'`,
  N-1 `'skipped_*'` results. Used slots increases by exactly 1.
- **What is NOT proved:** True OS-level parallelism (two separate Deno workers / HTTP
  requests arriving simultaneously at the Edge Function). The DB-level `FOR UPDATE`
  lock in `increment_launch_quota_used_slots()` is the real guard for that case,
  and it exists in the function body.
- **Honest verdict:** JS concurrency: ✅ proved. OS-level concurrency: ⚠️  not directly
  tested but protected by the DB `FOR UPDATE` lock + unique constraint.

---

## 3. Required Secrets / Environment Variables

| Variable                   | Required for                        | Where to set               |
|----------------------------|-------------------------------------|----------------------------|
| `STRIPE_SECRET_KEY`        | create-checkout, stripe-webhook     | Supabase Edge Function secrets |
| `STRIPE_WEBHOOK_SECRET`    | stripe-webhook (CRITICAL)           | Supabase Edge Function secrets |
| `SUPABASE_URL`             | All edge functions (auto-set)       | Lovable Cloud (auto)       |
| `SUPABASE_SERVICE_ROLE_KEY`| All edge functions (auto-set)       | Lovable Cloud (auto)       |
| `SUPABASE_ANON_KEY`        | Client-side auth (auto-set)         | Lovable Cloud (auto)       |
| `ALLOWED_EXTRA_ORIGINS`    | create-checkout (optional)          | Supabase Edge Function secrets |

**CRITICAL:** If `STRIPE_WEBHOOK_SECRET` is not set, the stripe-webhook function returns
500 on every request with the message "Webhook secret not configured." No subscriptions
will be processed.

---

## 4. Verification Commands

```bash
# 5 DB-level idempotency scenarios (no secrets needed beyond Supabase)
npm run verify:quota

# Gap 4: concurrent race test
deno run --allow-env --allow-net scripts/verify-quota-race.ts

# Gap 1 + 2: fault injection (requires execute_ddl RPC or direct pg access)
deno run --allow-env --allow-net scripts/verify-quota-gaps.ts

# Full quality gate (local)
npm run lint
npx tsc --noEmit
npm run test
npm run build

# Gap 3: Stripe HTTP path (manual — requires Stripe CLI)
# stripe listen --forward-to <stripe-webhook-url>
# stripe trigger checkout.session.completed
```

---

## 5. Public Endpoint Security Audit

### `stripe-webhook` (POST)
| Check                     | Status |
|---------------------------|--------|
| Signature verification    | ✅  Mandatory (`constructEventAsync`) |
| Missing secret → 500      | ✅  Explicit check + message |
| Dedup by stripe_event_id  | ✅  `ignoreDuplicates: true` |
| Rate limit                | ⚠️  None (Stripe itself throttles) |
| Input validation          | ✅  Via Stripe SDK parsing |

### `create-checkout` (POST)
| Check                     | Status |
|---------------------------|--------|
| Auth required             | ✅  JWT mandatory |
| Origin allowlist          | ✅  Explicit allowlist + fallback |
| Unauthorized origin → 403 | ✅  Returns 403 |
| Structured logs           | ✅  `logStep` on every path |
| Input validation          | ✅  Auth token checked before use |

### `track-click` (GET — public, unauthenticated)
| Check                     | Status |
|---------------------------|--------|
| code param required       | ✅  Returns 400 |
| code max length           | ✅  64 chars (added in hardening) |
| code pattern              | ✅  `[a-zA-Z0-9_-]` only (added) |
| Rate limit                | ✅  20 req/min/IP in-process (added; resets on cold start) |
| No internal details in 500| ✅  "Internal server error" only (added) |
| Structured logs           | ✅  `log()` on all paths (added) |

### `redeem-promo` (POST)
| Check                     | Status |
|---------------------------|--------|
| Auth required             | ✅  JWT mandatory |
| Role check                | ✅  Facilitateur blocked with clear message |
| Code format validation    | ✅  Trim + toUpperCase |
| Code length validation    | ⚠️  No max length check |
| Structured logs           | ✅  `logStep` |

### `landing analytics` / `track-click` (public GET)
| Rate limit                | ✅  Added (in-process, resets on cold start) |

**Outstanding hardening (not yet done):**
- `redeem-promo`: add max length check on `code` field (LOW risk — code format is controlled)
- All public endpoints: persistent rate limiting (Redis/Upstash) for production hardness

---

## 6. Automated vs. Manual vs. Not Proved

### ✅ Proved Automatically (runnable without human interaction)
- DB-level idempotency: 5 scenarios (`npm run verify:quota`)
- Concurrent race under JS concurrency (`scripts/verify-quota-race.ts`)
- TypeScript type safety (`npx tsc --noEmit`)
- Unit tests (`npm run test`)
- Production build (`npm run build`)

### ⚠️  Proved Manually (requires human operator + external tool)
- Stripe webhook HTTP path + signature verification (Stripe CLI required)
- Origin allowlist enforcement (HTTP client required)
- Promo code redemption end-to-end (requires valid promo code + test account)

### ❌  Not Proved (documented gaps, not hidden)
- Gap 1: RPC error rollback under fault injection (requires DDL execution rights)
- Gap 2: no_quota_row scenario under fault injection (same DDL requirement)
- OS-level multi-process concurrent webhook delivery (requires load testing tool)
- Full E2E Stripe payment flow in test mode (requires Stripe test card + manual checkout)

---

## 7. Remaining Risks

### 🔴 BLOCKING — Must fix before any real money flows

| Risk                                      | Mitigation                                    |
|-------------------------------------------|-----------------------------------------------|
| `STRIPE_WEBHOOK_SECRET` not configured    | Set in Supabase Edge Function secrets NOW      |
| Stripe webhook URL not registered         | Add endpoint in Stripe dashboard (test + live) |
| Gap 3 never exercised                     | Run Stripe CLI relay before opening billing    |

### 🟠 SERIOUS — Fix before public launch

| Risk                                      | Mitigation                                    |
|-------------------------------------------|-----------------------------------------------|
| In-process rate limit resets on cold start| Migrate to Upstash Redis rate limiter         |
| Gap 1 rollback not exercised by a test    | Add execute_ddl RPC + run verify-quota-gaps   |
| OS-level concurrent race not tested       | k6/wrk test against stripe-webhook endpoint  |
| `launch_quota` dirty-DB singleton         | See `docs/REPAIR_LAUNCH_QUOTA.md`             |

### 🟡 ACCEPTABLE — Can go live with awareness

| Risk                                      | Mitigation                                    |
|-------------------------------------------|-----------------------------------------------|
| redeem-promo missing code length check    | Low risk — code format is platform-controlled |
| Gap 2 not exercised by a test             | Same DDL limitation as Gap 1; logic is correct|
| No persistent audit log for quota events  | `billing_events` + `launch_quota_consumed` cover it partially |

---

## 8. Go-Live Decision

| Target                         | Decision            | Condition                                      |
|--------------------------------|---------------------|------------------------------------------------|
| **Dev / internal testing**     | ✅ GO               | Current state is sufficient                    |
| **Beta (closed, real billing)**| ⚠️  CONDITIONAL     | Requires: STRIPE_WEBHOOK_SECRET set + Gap 3 manually exercised |
| **Production (open, public)**  | ⚠️  CONDITIONAL     | Requires: all BLOCKING risks resolved + Stripe CLI E2E run      |
| **Production (scale / HA)**    | ❌ NOT YET          | Requires: persistent rate limiting, OS-level race test, Gap 1+2 automated |

---

## 9. CI Pipeline

**File:** `.github/workflows/ci.yml`

Steps on every push to `main`/PR:
1. `npm ci` — install
2. `npx tsc --noEmit` — type check
3. `npm run lint` — ESLint
4. `npm run test` — Vitest unit tests
5. `npm run build` — production build
6. `npm run verify:quota` — DB idempotency (if secrets configured)
7. `deno run verify-quota-race.ts` — concurrent race test (if secrets configured)
8. `npm audit --audit-level=high` — security audit

**Manual gates** (not in CI, must be run before go-live):
- Stripe CLI relay test (Gap 3)
- Fault injection test (Gap 1+2, if execute_ddl RPC available)
- Full E2E Stripe test mode checkout

---

*Last updated: 2026-03-08 — Hardening pass RC-2026-03-08-HARDENING-V1*
*Author: Lovable AI + operator review*
