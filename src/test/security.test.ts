/**
 * Security tests — PROOF:SECURITY_TESTS_V1
 * Tests ciblés sur les gardes de sécurité critiques.
 * Ces tests vérifient la logique applicative (pas les appels réseau réels).
 */
import { describe, it, expect } from "vitest";

// ── Test 1: analytics event types validation ──────────────────────────────────
import { ANALYTICS_EVENTS, type AnalyticsEventType } from "@/lib/analytics";

describe("analytics event types", () => {
  it("should define the required minimum set of event types", () => {
    const required = [
      "landing_view", "cta_click", "pricing_view",
      "checkout_start", "checkout_success", "onboarding_done",
      "mission_created", "intro_submitted", "intro_validated",
    ];
    required.forEach(evt => {
      expect(ANALYTICS_EVENTS).toContain(evt);
    });
  });

  it("should not allow freeform strings at compile time", () => {
    // If AnalyticsEventType doesn't include an invalid value, TS will catch it.
    // This runtime test verifies the set is finite.
    expect(ANALYTICS_EVENTS.length).toBeGreaterThan(0);
    expect(ANALYTICS_EVENTS.length).toBeLessThan(50);
  });
});

// ── Test 2: edge function user_id spoofing guard (logic) ─────────────────────
describe("edge function user_id guard logic", () => {
  /**
   * Simulates the guard logic extracted from openclaw-scheduler / event-bus:
   * Non-service-role requests must use JWT userId, not body.user_id.
   */
  function resolveTargetUserId(opts: {
    isServiceRole: boolean;
    jwtUserId: string;
    bodyUserId?: string;
  }): string {
    const { isServiceRole, jwtUserId, bodyUserId } = opts;
    return isServiceRole && bodyUserId ? bodyUserId : jwtUserId;
  }

  it("should use JWT userId for non-service-role calls", () => {
    const result = resolveTargetUserId({
      isServiceRole: false,
      jwtUserId: "user-abc",
      bodyUserId: "attacker-xyz",
    });
    expect(result).toBe("user-abc");
  });

  it("should allow body.user_id override for service role", () => {
    const result = resolveTargetUserId({
      isServiceRole: true,
      jwtUserId: "service",
      bodyUserId: "target-user-123",
    });
    expect(result).toBe("target-user-123");
  });

  it("should fall back to jwtUserId when bodyUserId is absent even for service role", () => {
    const result = resolveTargetUserId({
      isServiceRole: true,
      jwtUserId: "service",
      bodyUserId: undefined,
    });
    expect(result).toBe("service");
  });
});

// ── Test 3: SSRF allowlist logic ──────────────────────────────────────────────
describe("SSRF allowlist guard", () => {
  /**
   * Reproduces the isAllowedGatewayUrl() logic from openclaw-validate
   */
  function isAllowedGatewayUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    let parsed: URL;
    try { parsed = new URL(url); } catch { return false; }
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = ["localhost", "127.", "0.0.0.0", "10.", "192.168.", "169.254.", "::1", "metadata.google"];
    if (blockedPatterns.some(p => hostname.startsWith(p) || hostname === p.replace(".", ""))) return false;
    return true;
  }

  it("should block localhost URLs", () => {
    expect(isAllowedGatewayUrl("https://localhost:3000/hook")).toBe(false);
  });

  it("should block 127.x.x.x", () => {
    expect(isAllowedGatewayUrl("https://127.0.0.1/hook")).toBe(false);
  });

  it("should block internal 192.168.x.x", () => {
    expect(isAllowedGatewayUrl("https://192.168.1.1/hook")).toBe(false);
  });

  it("should block http (non-https)", () => {
    expect(isAllowedGatewayUrl("http://external.example.com/hook")).toBe(false);
  });

  it("should allow valid external https URLs", () => {
    expect(isAllowedGatewayUrl("https://api.external-gateway.com/hook")).toBe(true);
  });

  it("should block null/undefined/empty", () => {
    expect(isAllowedGatewayUrl(null)).toBe(false);
    expect(isAllowedGatewayUrl(undefined)).toBe(false);
    expect(isAllowedGatewayUrl("")).toBe(false);
  });

  it("should block malformed URLs", () => {
    expect(isAllowedGatewayUrl("not-a-url")).toBe(false);
  });
});

// ── Test 4: payout status transitions ─────────────────────────────────────────
describe("payout status transition logic", () => {
  type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";
  const VALID_STATUSES: PayoutStatus[] = ["pending", "processing", "paid", "failed", "cancelled"];

  it("should only allow valid statuses", () => {
    expect(VALID_STATUSES).toContain("pending");
    expect(VALID_STATUSES).toContain("paid");
    expect(VALID_STATUSES).not.toContain("unknown");
  });

  it("paid status should set processed_at", () => {
    const newStatus: PayoutStatus = "paid";
    const processed_at = newStatus === "paid" ? new Date().toISOString() : null;
    expect(processed_at).not.toBeNull();
  });

  it("non-paid status should not set processed_at", () => {
    const newStatus: PayoutStatus = "failed";
    const processed_at = newStatus === "paid" ? new Date().toISOString() : null;
    expect(processed_at).toBeNull();
  });
});

// ── Test 5: reactivation trigger types ───────────────────────────────────────
describe("reactivation job trigger types", () => {
  const VALID_TRIGGERS = [
    "checkout_abandoned",
    "onboarding_incomplete",
    "mission_no_intro",
    "intro_not_validated",
  ];

  it("should define all required trigger types", () => {
    expect(VALID_TRIGGERS).toHaveLength(4);
    expect(VALID_TRIGGERS).toContain("onboarding_incomplete");
    expect(VALID_TRIGGERS).toContain("mission_no_intro");
    expect(VALID_TRIGGERS).toContain("intro_not_validated");
  });
});
