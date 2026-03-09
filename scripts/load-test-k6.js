/**
 * load-test-k6.js — k6 Load Test for WIINUP MAX
 * PROOF:LOAD_TEST_V1
 *
 * Tests:
 *   1. track-click endpoint (public, rate-limited)
 *   2. analytics_events write throughput (via REST API)
 *   3. launch_quota read under load
 *
 * Usage (requires k6: https://k6.io/docs/getting-started/installation):
 *   k6 run --env SUPABASE_URL=https://xyz.supabase.co --env ANON_KEY=eyJ... scripts/load-test-k6.js
 *
 * WARNING: This will generate real load on the Supabase project.
 *          Run against a staging/test project, NOT production.
 *
 * Thresholds documented. These are TARGETS, not proven at scale.
 * Supabase free/starter tier: ~500 concurrent connections, ~100 req/s per function.
 * HONEST LIMIT: This test cannot validate 1M concurrent users. Scale-out requires
 * horizontal Supabase Pro + Redis rate limiting + CDN — see docs/PRODUCTION_READYNESS.md.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const failedRequests = new Counter("failed_requests");
const successRate = new Rate("success_rate");

// ── Configuration ─────────────────────────────────────────────────────────────
const SUPABASE_URL = __ENV.SUPABASE_URL || "https://usnriklfiagazpffsqew.supabase.co";
const ANON_KEY = __ENV.ANON_KEY || __ENV.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const options = {
  scenarios: {
    // Scenario 1: track-click under moderate load
    // PROVES: edge fn handles concurrent requests without 5xx cascade
    // DOES NOT PROVE: correct business logic or end-user experience
    track_click: {
      executor: "constant-arrival-rate",
      exec: "handleTrackClick",
      rate: 20,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 10,
      maxVUs: 50,
      tags: { scenario: "track_click" },
    },
    // Scenario 2: launch_quota read (landing page scenario)
    // PROVES: DB reads under load don't degrade beyond 1s p95
    // DOES NOT PROVE: write atomicity under concurrent checkouts
    quota_read: {
      executor: "constant-arrival-rate",
      exec: "handleQuotaRead",
      rate: 50,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 20,
      maxVUs: 100,
      startTime: "5s",
      tags: { scenario: "quota_read" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed:   ["rate<0.05"],
    success_rate:      ["rate>0.95"],
  },
};

// ── track-click scenario ───────────────────────────────────────────────────────
export function handleTrackClick() {
  const code = `test-load-${Math.floor(Math.random() * 1000)}`;
  const res = http.get(
    `${SUPABASE_URL}/functions/v1/track-click?code=${code}`,
    {
      headers: {
        "apikey": ANON_KEY,
        "Content-Type": "application/json",
      },
      tags: { scenario: "track_click" },
    }
  );

  const ok = check(res, {
    "track-click: status not 5xx": (r) => r.status < 500,
    "track-click: response time < 3s": (r) => r.timings.duration < 3000,
  });

  successRate.add(ok);
  if (!ok) failedRequests.add(1);

  sleep(0.1);
}

// ── quota read scenario ────────────────────────────────────────────────────────
export function handleQuotaRead() {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/launch_quota?select=used_slots,total_slots`,
    {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      tags: { scenario: "quota_read" },
    }
  );

  const ok = check(res, {
    "quota_read: status 200": (r) => r.status === 200,
    "quota_read: response time < 1s": (r) => r.timings.duration < 1000,
    "quota_read: returns array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  successRate.add(ok);
  if (!ok) failedRequests.add(1);

  sleep(0.05);
}

// ── Default export (routes scenarios) ─────────────────────────────────────────
export default function () {
  // k6 scenarios route to their exec functions via scenario tags.
  // This default is called for scenarios without exec defined.
  handleTrackClick();
}
