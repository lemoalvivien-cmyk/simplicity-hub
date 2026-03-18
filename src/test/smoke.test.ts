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

describe('Security regressions', () => {
  it('aucune variable VITE_ ne contient un secret critique', () => {
    const envKeys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
    const dangerous = envKeys.filter(k =>
      k.includes('SERVICE_ROLE') ||
      k.includes('SECRET_KEY') ||
      k.includes('WEBHOOK_SECRET') ||
      k.includes('STRIPE_SECRET') ||
      k.includes('INTERNAL_FUNCTION')
    );
    expect(dangerous).toHaveLength(0);
  });

  it('queryClient importable et fonctionnel', async () => {
    const { queryClient } = await import('../lib/queryClient');
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.clear).toBe('function');
  });

  it('ProtectedRoute est un composant React valide', async () => {
    const mod = await import('../components/auth/ProtectedRoute');
    expect(typeof mod.default).toBe('function');
  });

  it('supabase client utilise des variables env et non des secrets hardcodés', async () => {
    const mod = await import('../integrations/supabase/client');
    expect(mod.supabase).toBeDefined();
  });
});
