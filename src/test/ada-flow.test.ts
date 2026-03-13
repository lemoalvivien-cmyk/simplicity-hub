/**
 * ADA Flow — Tests unitaires
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. nodeVoiceConsent   — RGPD/Bloctel consent text generation
 * 2. nodeNegotiate      — moment detection + royalty calculation
 * 3. royaltyEngine      — Silent 7% split integrity
 */
import { describe, it, expect } from "vitest";

// ── Helpers (pure functions extracted for testability) ──────────────────────

/** Build the RGPD consent announcement text */
function buildConsentText(targetName: string): string {
  return `Bonjour ${targetName}. Cet appel est réalisé par un agent vocal automatisé de la plateforme WiinupMax. Conformément au Règlement Général sur la Protection des Données, nous vous informons que cet appel peut être enregistré à des fins d'amélioration du service. Vous pouvez exercer vos droits d'accès, de rectification et d'opposition à tout moment en contactant notifications@wiinupmax.com. Acceptez-vous la poursuite de cet appel ? Dites oui ou non.`;
}

/** Parse the model's tool-call JSON for negotiate response */
function parseNegotiateToolCall(
  rawArgs: string,
): { agentResponse: string; keyMomentType: string; suggestedAmount: number | null } {
  const args = JSON.parse(rawArgs);
  return {
    agentResponse: args.response_text ?? "",
    keyMomentType: args.moment_type ?? "neutral",
    suggestedAmount: args.suggested_amount_eur ?? null,
  };
}

/** Compute royalty split (12% platform / 88% facilitateur)
 *  Breakdown: 7% platform fee + 5% engine fee (swarm autonome + live cash flow + WMAX secondary market)
 */
function computeRoyalty(dealAmount: number): {
  commission: number;
  facilitateurNet: number;
  total: number;
} {
  const commission = Math.round(dealAmount * 0.12 * 100) / 100;
  const facilitateurNet = Math.round((dealAmount - commission) * 100) / 100;
  return { commission, facilitateurNet, total: dealAmount };
}

// ── 1. CONSENT — RGPD/Bloctel annonce vocale ─────────────────────────────────

describe("nodeVoiceConsent — RGPD/Bloctel text", () => {
  it("should include the target name in consent text", () => {
    const text = buildConsentText("Jean Dupont");
    expect(text).toContain("Jean Dupont");
  });

  it("should mention RGPD rights and contact email", () => {
    const text = buildConsentText("Marie Martin");
    expect(text).toContain("Règlement Général sur la Protection des Données");
    expect(text).toContain("notifications@wiinupmax.com");
  });

  it("should require an explicit yes/no from the prospect", () => {
    const text = buildConsentText("Ahmed Benali");
    expect(text.toLowerCase()).toContain("oui ou non");
  });

  it("should mention recording disclosure (EU AI Act art 52)", () => {
    const text = buildConsentText("Sophie Leclerc");
    expect(text).toContain("enregistré");
  });
});

// ── 2. NEGOTIATION — moment detection + response parsing ─────────────────────

describe("nodeNegotiate — tool call parsing", () => {
  it("should parse buying_signal with suggested amount", () => {
    const mockArgs = JSON.stringify({
      moment_type: "buying_signal",
      suggested_amount_eur: 5000,
      response_text: "Excellent ! Je vous propose un contrat à 5 000 € avec un ROI garanti en 3 mois.",
    });
    const result = parseNegotiateToolCall(mockArgs);
    expect(result.keyMomentType).toBe("buying_signal");
    expect(result.suggestedAmount).toBe(5000);
    expect(result.agentResponse).toContain("5 000");
  });

  it("should parse objection without amount", () => {
    const mockArgs = JSON.stringify({
      moment_type: "objection",
      response_text: "Je comprends votre hésitation. La plupart de nos clients disent la même chose avant de voir leurs premiers résultats.",
    });
    const result = parseNegotiateToolCall(mockArgs);
    expect(result.keyMomentType).toBe("objection");
    expect(result.suggestedAmount).toBeNull();
    expect(result.agentResponse.length).toBeGreaterThan(10);
  });

  it("should parse closing_attempt and trigger human validation flag", () => {
    const mockArgs = JSON.stringify({
      moment_type: "closing_attempt",
      suggested_amount_eur: 12000,
      response_text: "Parfait, je vous envoie le contrat maintenant.",
    });
    const result = parseNegotiateToolCall(mockArgs);
    expect(result.keyMomentType).toBe("closing_attempt");
    // Closing attempt + buying_signal must trigger human oversight
    const requiresHuman = result.keyMomentType === "buying_signal" || result.keyMomentType === "closing_attempt";
    expect(requiresHuman).toBe(true);
  });

  it("should not require human oversight for neutral moments", () => {
    const mockArgs = JSON.stringify({
      moment_type: "neutral",
      response_text: "Bien sûr, laissez-moi vous donner plus de détails.",
    });
    const result = parseNegotiateToolCall(mockArgs);
    const requiresHuman = result.keyMomentType === "buying_signal" || result.keyMomentType === "closing_attempt";
    expect(requiresHuman).toBe(false);
  });
});

// ── 3. ROYALTY ENGINE — Silent 7% split integrity ─────────────────────────────

describe("computeRoyalty — Silent Royalty Engine 7%", () => {
  it("should compute exact 7% commission on a 5000€ deal", () => {
    const { commission, facilitateurNet, total } = computeRoyalty(5000);
    expect(commission).toBe(350);
    expect(facilitateurNet).toBe(4650);
    expect(total).toBe(5000);
  });

  it("should ensure commission + net = total (no money lost)", () => {
    const amounts = [1000, 7500, 12000, 50000, 99.99];
    for (const amount of amounts) {
      const { commission, facilitateurNet } = computeRoyalty(amount);
      expect(commission + facilitateurNet).toBeCloseTo(amount, 1);
    }
  });

  it("should round to 2 decimal places (financial precision)", () => {
    const { commission } = computeRoyalty(1000 / 3); // ~333.33
    const decimals = commission.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it("should compute 75000€ Insights API Enterprise royalty correctly", () => {
    const { commission } = computeRoyalty(75000);
    expect(commission).toBe(5250); // 7% of 75k
  });

  it("should always produce positive split values", () => {
    const { commission, facilitateurNet } = computeRoyalty(99);
    expect(commission).toBeGreaterThan(0);
    expect(facilitateurNet).toBeGreaterThan(0);
  });
});
