import { describe, it, expect } from "vitest";

describe("Smoke tests — critical imports", () => {
  it("App renders without crash", async () => {
    const { default: App } = await import("@/App");
    expect(App).toBeDefined();
  });

  it("AuthContext exports required hooks", async () => {
    const mod = await import("@/contexts/AuthContext");
    expect(mod.useAuth).toBeDefined();
    expect(mod.AuthProvider).toBeDefined();
  });

  it("SubscriptionContext exports required hooks", async () => {
    const mod = await import("@/contexts/SubscriptionContext");
    expect(mod.useSubscription).toBeDefined();
    expect(mod.isAccessActive).toBeDefined();
  });

  it("featureRegistry has no dead features enabled", async () => {
    const { FEATURE_REGISTRY } = await import("@/lib/featureRegistry");
    const deadEnabled = FEATURE_REGISTRY.filter(f => f.status === "dead" && f.enabled);
    expect(deadEnabled).toHaveLength(0);
  });

  it("betaConfig CLOSED_BETA is boolean", async () => {
    const { CLOSED_BETA } = await import("@/lib/betaConfig");
    expect(typeof CLOSED_BETA).toBe("boolean");
  });
});
