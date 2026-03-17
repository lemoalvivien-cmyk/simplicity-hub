/**
 * load-test-k6.js — WIINUP MAX · Stress Test 1000 VUs
 * ─────────────────────────────────────────────────────────────────────────────
 * Scénarios couverts :
 *   1. signup       — Inscription email/password (auth.users + profile)
 *   2. login        — Login + récupération JWT (auth gateway)
 *   3. intro_submit — Création recommandation (Edge Fn submit-introduction)
 *   4. quota_read   — Lecture quota landing (DB read sous charge)
 *   5. checkout_init— Init session Stripe (Edge Fn create-checkout, auth requis)
 *
 * USAGE :
 *   k6 run \
 *     --env SUPABASE_URL=https://usnriklfiagazpffsqew.supabase.co \
 *     --env ANON_KEY=eyJhbGci... \
 *     --env TEST_EMAIL_PREFIX=k6user \
 *     --env TEST_EMAIL_DOMAIN=mailtest.com \
 *     --env TEST_PASSWORD=TestPass123! \
 *     scripts/load-test-k6.js
 *
 * RAPPORT HTML :
 *   K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report.html k6 run ...
 *
 * ⚠️  TOUJOURS tester sur staging — jamais en production.
 * ⚠️  Les comptes créés restent en base — prévoir un cleanup SQL après.
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import { randomString } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ── Custom metrics ─────────────────────────────────────────────────────────────
const signupErrors    = new Counter("signup_errors");
const loginErrors     = new Counter("login_errors");
const introErrors     = new Counter("intro_errors");
const checkoutErrors  = new Counter("checkout_errors");
const successRate     = new Rate("success_rate");
const signupDuration  = new Trend("signup_duration",   true);
const loginDuration   = new Trend("login_duration",    true);
const introDuration   = new Trend("intro_duration",    true);
const checkoutDuration= new Trend("checkout_duration", true);

// ── Env ────────────────────────────────────────────────────────────────────────
const SUPABASE_URL    = __ENV.SUPABASE_URL    || "https://usnriklfiagazpffsqew.supabase.co";
const ANON_KEY        = __ENV.ANON_KEY        || "";
const EMAIL_PREFIX    = __ENV.TEST_EMAIL_PREFIX || "k6user";
const EMAIL_DOMAIN    = __ENV.TEST_EMAIL_DOMAIN || "mailtest.invalid";
const PASSWORD        = __ENV.TEST_PASSWORD    || "TestK6Pass!99";

const AUTH_URL     = `${SUPABASE_URL}/auth/v1`;
const REST_URL     = `${SUPABASE_URL}/rest/v1`;
const FN_URL       = `${SUPABASE_URL}/functions/v1`;

const BASE_HEADERS = {
  "apikey":       ANON_KEY,
  "Content-Type": "application/json",
};

// ── Load profile — rampe vers 1000 VUs ────────────────────────────────────────
export const options = {
  scenarios: {
    // ── Signup : 0 → 200 VUs en 30s, maintenu 60s ──────────────────────────
    signup: {
      executor:        "ramping-vus",
      exec:            "scenarioSignup",
      startVUs:        0,
      stages: [
        { duration: "30s", target: 200 },
        { duration: "60s", target: 200 },
        { duration: "10s", target: 0   },
      ],
      gracefulRampDown: "10s",
      tags: { scenario: "signup" },
    },
    // ── Login : 0 → 400 VUs — démarre à t+40s ──────────────────────────────
    login: {
      executor:        "ramping-vus",
      exec:            "scenarioLogin",
      startTime:       "40s",
      startVUs:        0,
      stages: [
        { duration: "30s", target: 400 },
        { duration: "60s", target: 400 },
        { duration: "10s", target: 0   },
      ],
      gracefulRampDown: "10s",
      tags: { scenario: "login" },
    },
    // ── Intro submit : taux constant 50 req/s — démarre à t+50s ───────────
    intro_submit: {
      executor:          "constant-arrival-rate",
      exec:              "scenarioIntroSubmit",
      startTime:         "50s",
      rate:              50,
      timeUnit:          "1s",
      duration:          "90s",
      preAllocatedVUs:   60,
      maxVUs:            300,
      tags: { scenario: "intro_submit" },
    },
    // ── Quota read : 200 req/s — simule le trafic landing page ────────────
    quota_read: {
      executor:          "constant-arrival-rate",
      exec:              "scenarioQuotaRead",
      rate:              200,
      timeUnit:          "1s",
      duration:          "120s",
      preAllocatedVUs:   50,
      maxVUs:            200,
      tags: { scenario: "quota_read" },
    },
    // ── Checkout init : 20 req/s — Edge Fn Stripe (authentifié) ───────────
    checkout_init: {
      executor:          "constant-arrival-rate",
      exec:              "scenarioCheckout",
      startTime:         "60s",
      rate:              20,
      timeUnit:          "1s",
      duration:          "60s",
      preAllocatedVUs:   30,
      maxVUs:            100,
      tags: { scenario: "checkout_init" },
    },
  },

  // ── Seuils de PASS/FAIL ────────────────────────────────────────────────────
  thresholds: {
    // Latence globale
    http_req_duration:          ["p(95)<3000", "p(99)<5000"],
    http_req_failed:            ["rate<0.05"],     // < 5% d'erreurs HTTP
    success_rate:               ["rate>0.95"],

    // Par scénario
    signup_duration:            ["p(95)<4000"],
    login_duration:             ["p(95)<2000"],
    intro_duration:             ["p(95)<3000"],
    checkout_duration:          ["p(95)<4000"],

    // Compteurs — alertes si trop d'erreurs absolues
    signup_errors:              ["count<100"],
    login_errors:               ["count<50"],
    intro_errors:               ["count<200"],
    checkout_errors:            ["count<30"],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function uniqueEmail() {
  return `${EMAIL_PREFIX}_${randomString(10).toLowerCase()}@${EMAIL_DOMAIN}`;
}

function authHeaders(token) {
  return { ...BASE_HEADERS, "Authorization": `Bearer ${token}` };
}

// ── SCÉNARIO 1 — Signup ────────────────────────────────────────────────────────
export function scenarioSignup() {
  const email = uniqueEmail();

  group("signup", () => {
    const res = http.post(
      `${AUTH_URL}/signup`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: BASE_HEADERS, tags: { scenario: "signup" } }
    );

    signupDuration.add(res.timings.duration);

    const ok = check(res, {
      "signup: status 200/201": (r) => r.status === 200 || r.status === 201,
      "signup: has access_token": (r) => {
        try { return !!JSON.parse(r.body).access_token; } catch { return false; }
      },
      "signup: < 4s": (r) => r.timings.duration < 4000,
    });

    successRate.add(ok);
    if (!ok) signupErrors.add(1);
  });

  sleep(0.5);
}

// ── SCÉNARIO 2 — Login ────────────────────────────────────────────────────────
// Utilise des credentials fixes (compte de test préexistant)
export function scenarioLogin() {
  const email = `${EMAIL_PREFIX}_smoke@${EMAIL_DOMAIN}`;

  group("login", () => {
    const res = http.post(
      `${AUTH_URL}/token?grant_type=password`,
      JSON.stringify({ email, password: PASSWORD }),
      { headers: BASE_HEADERS, tags: { scenario: "login" } }
    );

    loginDuration.add(res.timings.duration);

    const ok = check(res, {
      "login: status 200": (r) => r.status === 200,
      "login: has access_token": (r) => {
        try { return !!JSON.parse(r.body).access_token; } catch { return false; }
      },
      "login: < 2s": (r) => r.timings.duration < 2000,
    });

    successRate.add(ok);
    if (!ok) loginErrors.add(1);
  });

  sleep(0.2);
}

// ── SCÉNARIO 3 — Intro submit (Edge Function authentifiée) ────────────────────
export function scenarioIntroSubmit() {
  // Étape 1 : obtenir un token
  const loginRes = http.post(
    `${AUTH_URL}/token?grant_type=password`,
    JSON.stringify({ email: `${EMAIL_PREFIX}_smoke@${EMAIL_DOMAIN}`, password: PASSWORD }),
    { headers: BASE_HEADERS }
  );

  if (loginRes.status !== 200) {
    introErrors.add(1);
    successRate.add(false);
    return;
  }

  let token;
  try { token = JSON.parse(loginRes.body).access_token; } catch {
    introErrors.add(1);
    return;
  }

  // Étape 2 : soumettre une recommandation
  group("intro_submit", () => {
    const payload = {
      contact_nom:      `Load Test Contact ${randomString(6)}`,
      contact_email:    `contact_${randomString(6)}@mailtest.invalid`,
      contact_telephone: "+33600000000",
      contexte:         "Test k6 — charge simulée",
      mission_id:       null,
    };

    const res = http.post(
      `${FN_URL}/submit-introduction`,
      JSON.stringify(payload),
      {
        headers: authHeaders(token),
        tags: { scenario: "intro_submit" },
      }
    );

    introDuration.add(res.timings.duration);

    const ok = check(res, {
      "intro: not 5xx":  (r) => r.status < 500,
      "intro: < 3s":     (r) => r.timings.duration < 3000,
      // 429 = rate limit (attendu sous charge = acceptable)
      "intro: 200|201|429": (r) => [200, 201, 429].includes(r.status),
    });

    successRate.add(ok);
    if (!ok) introErrors.add(1);
  });

  sleep(0.3);
}

// ── SCÉNARIO 4 — Quota read (lecture publique DB) ─────────────────────────────
export function scenarioQuotaRead() {
  group("quota_read", () => {
    const res = http.get(
      `${REST_URL}/launch_quota?select=used_slots,total_slots`,
      {
        headers: BASE_HEADERS,
        tags: { scenario: "quota_read" },
      }
    );

    const ok = check(res, {
      "quota: status 200":       (r) => r.status === 200,
      "quota: returns array":    (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
      "quota: < 500ms":          (r) => r.timings.duration < 500,
    });

    successRate.add(ok);
    // Pas de sleep — on veut le throughput maximal
  });
}

// ── SCÉNARIO 5 — Checkout init (Edge Fn Stripe) ───────────────────────────────
export function scenarioCheckout() {
  // Auth
  const loginRes = http.post(
    `${AUTH_URL}/token?grant_type=password`,
    JSON.stringify({ email: `${EMAIL_PREFIX}_smoke@${EMAIL_DOMAIN}`, password: PASSWORD }),
    { headers: BASE_HEADERS }
  );

  if (loginRes.status !== 200) {
    checkoutErrors.add(1);
    successRate.add(false);
    return;
  }

  let token;
  try { token = JSON.parse(loginRes.body).access_token; } catch {
    checkoutErrors.add(1);
    return;
  }

  group("checkout_init", () => {
    const res = http.post(
      `${FN_URL}/create-checkout`,
      JSON.stringify({ promo_code: null }),
      {
        headers: authHeaders(token),
        tags: { scenario: "checkout_init" },
      }
    );

    checkoutDuration.add(res.timings.duration);

    const ok = check(res, {
      "checkout: not 5xx":           (r) => r.status < 500,
      "checkout: < 4s":              (r) => r.timings.duration < 4000,
      "checkout: has url or error":  (r) => {
        try {
          const b = JSON.parse(r.body);
          return !!(b.url || b.error);
        } catch { return false; }
      },
    });

    successRate.add(ok);
    if (!ok) checkoutErrors.add(1);
  });

  sleep(1);
}

// ── Default fallback ──────────────────────────────────────────────────────────
export default function () {
  scenarioQuotaRead();
}
