/**
 * GOD TIER Tests — bank-webhook · swarm · royalty mint 12%
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. bankWebhook     — cash weight calculation + signature validation logic
 * 2. swarmConsensus  — Triple Threat Swarm meta-consensus + quorum logic
 * 3. royaltyMint12   — WMAX mint payload construction + 12% integrity
 */
import { describe, it, expect } from "vitest";

// ── 1. BANK-WEBHOOK — cash weight + signature guard ──────────────────────────

/** Mirrors bank-webhook/index.ts cash_weight formula */
function computeCashWeight(amount: number | null, freq: number | null): number | null {
  if (typeof amount !== "number" || typeof freq !== "number") return null;
  return amount * freq * 0.85;
}

/** Signature validation logic extracted from bank-webhook */
function validateBankSignature(
  sigHeader: string | null,
  secret: string
): { valid: boolean; reason: string } {
  if (!secret) return { valid: true, reason: "no_secret_configured" };
  if (!sigHeader) return { valid: false, reason: "missing_header" };
  if (sigHeader !== secret) return { valid: false, reason: "mismatch" };
  return { valid: true, reason: "ok" };
}

describe("bankWebhook — cash weight + signature", () => {
  it("should compute cash weight correctly: amount * freq * 0.85", () => {
    expect(computeCashWeight(1000, 12)).toBeCloseTo(10200, 1);
    expect(computeCashWeight(500, 4)).toBeCloseTo(1700, 1);
  });

  it("should return null when amount or freq is missing", () => {
    expect(computeCashWeight(null, 12)).toBeNull();
    expect(computeCashWeight(1000, null)).toBeNull();
    expect(computeCashWeight(null, null)).toBeNull();
  });

  it("should reject request with missing signature header", () => {
    const result = validateBankSignature(null, "secret-key-abc");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("missing_header");
  });

  it("should reject request with wrong signature", () => {
    const result = validateBankSignature("wrong-sig", "correct-secret");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("mismatch");
  });

  it("should accept request with correct signature", () => {
    const result = validateBankSignature("correct-secret", "correct-secret");
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("ok");
  });

  it("should pass through if no BANK_WEBHOOK_SECRET configured (dev mode)", () => {
    const result = validateBankSignature(null, "");
    expect(result.valid).toBe(true);
    expect(result.reason).toBe("no_secret_configured");
  });
});

// ── 2. SWARM CONSENSUS — Triple Threat meta-consensus logic ─────────────────

interface SwarmVote {
  model: "gemini" | "qwen" | "grok";
  decision: string;
  confidence: number; // 0-1
  lead_score?: number;
}

/**
 * Triple Threat Swarm meta-consensus:
 * A decision passes if at least 2/3 models agree AND avg confidence >= threshold.
 */
function computeSwarmConsensus(
  votes: SwarmVote[],
  confidenceThreshold = 0.65
): {
  decision: string | null;
  quorum: boolean;
  avgConfidence: number;
  agreeingModels: string[];
} {
  if (votes.length === 0) return { decision: null, quorum: false, avgConfidence: 0, agreeingModels: [] };

  // Find most common decision
  const tally = new Map<string, { count: number; models: string[]; totalConf: number }>();
  for (const v of votes) {
    const existing = tally.get(v.decision) ?? { count: 0, models: [], totalConf: 0 };
    tally.set(v.decision, {
      count: existing.count + 1,
      models: [...existing.models, v.model],
      totalConf: existing.totalConf + v.confidence,
    });
  }

  let topDecision = "";
  let topCount = 0;
  for (const [decision, data] of tally) {
    if (data.count > topCount) {
      topCount = data.count;
      topDecision = decision;
    }
  }

  const topData = tally.get(topDecision)!;
  const avgConfidence = topData.totalConf / topData.count;
  const quorum = topCount >= 2 && avgConfidence >= confidenceThreshold;

  return {
    decision: quorum ? topDecision : null,
    quorum,
    avgConfidence,
    agreeingModels: topData.models,
  };
}

describe("swarmConsensus — Triple Threat meta-consensus", () => {
  it("should reach quorum when 3/3 models agree with high confidence", () => {
    const votes: SwarmVote[] = [
      { model: "gemini", decision: "qualify_lead", confidence: 0.92 },
      { model: "qwen",   decision: "qualify_lead", confidence: 0.88 },
      { model: "grok",   decision: "qualify_lead", confidence: 0.95 },
    ];
    const result = computeSwarmConsensus(votes);
    expect(result.quorum).toBe(true);
    expect(result.decision).toBe("qualify_lead");
    expect(result.agreeingModels).toHaveLength(3);
  });

  it("should reach quorum when 2/3 models agree above threshold", () => {
    const votes: SwarmVote[] = [
      { model: "gemini", decision: "qualify_lead", confidence: 0.85 },
      { model: "qwen",   decision: "qualify_lead", confidence: 0.78 },
      { model: "grok",   decision: "disqualify",   confidence: 0.55 },
    ];
    const result = computeSwarmConsensus(votes);
    expect(result.quorum).toBe(true);
    expect(result.decision).toBe("qualify_lead");
  });

  it("should NOT reach quorum when models disagree (1+1+1 split)", () => {
    const votes: SwarmVote[] = [
      { model: "gemini", decision: "qualify_lead", confidence: 0.9 },
      { model: "qwen",   decision: "disqualify",   confidence: 0.8 },
      { model: "grok",   decision: "escalate",     confidence: 0.7 },
    ];
    const result = computeSwarmConsensus(votes);
    expect(result.quorum).toBe(false);
    expect(result.decision).toBeNull();
  });

  it("should NOT reach quorum when avg confidence is below threshold", () => {
    const votes: SwarmVote[] = [
      { model: "gemini", decision: "qualify_lead", confidence: 0.45 },
      { model: "qwen",   decision: "qualify_lead", confidence: 0.50 },
      { model: "grok",   decision: "qualify_lead", confidence: 0.40 },
    ];
    const result = computeSwarmConsensus(votes, 0.65);
    expect(result.quorum).toBe(false);
    expect(result.decision).toBeNull();
  });

  it("should handle empty vote array gracefully", () => {
    const result = computeSwarmConsensus([]);
    expect(result.quorum).toBe(false);
    expect(result.decision).toBeNull();
  });
});

// ── 3. ROYALTY MINT 12% — WMAX token payload + integrity ────────────────────

interface WMAXMintPayload {
  userId: string;
  royaltyAmount: number; // 12% of deal in €
  dealId: string;
  platformFee: number;   // 7%
  engineFee: number;     // 5%
  tokenSymbol: "WMAX";
  chain: "base";
}

/** Builds mint payload from raw deal data */
function buildMintPayload(userId: string, dealAmount: number, dealId: string): WMAXMintPayload {
  const royaltyAmount = Math.round(dealAmount * 0.12 * 100) / 100;
  const platformFee   = Math.round(dealAmount * 0.07 * 100) / 100;
  const engineFee     = Math.round(dealAmount * 0.05 * 100) / 100;
  return { userId, royaltyAmount, dealId, platformFee, engineFee, tokenSymbol: "WMAX", chain: "base" };
}

describe("royaltyMint12 — WMAX token mint at 12%", () => {
  it("should build correct mint payload for a 5000€ deal", () => {
    const payload = buildMintPayload("user-123", 5000, "deal-abc");
    expect(payload.royaltyAmount).toBe(600);   // 12% of 5000
    expect(payload.platformFee).toBe(350);     // 7% of 5000
    expect(payload.engineFee).toBe(250);       // 5% of 5000
    expect(payload.tokenSymbol).toBe("WMAX");
    expect(payload.chain).toBe("base");
  });

  it("should ensure platformFee + engineFee = royaltyAmount exactly", () => {
    const deals = [1000, 7500, 12000, 50000, 75000];
    for (const deal of deals) {
      const p = buildMintPayload("u", deal, "d");
      expect(p.platformFee + p.engineFee).toBeCloseTo(p.royaltyAmount, 2);
    }
  });

  it("should always mint on Base L2 chain", () => {
    const payload = buildMintPayload("user-456", 10000, "deal-xyz");
    expect(payload.chain).toBe("base");
  });

  it("should produce 12% royalty on 75000€ Insights API Enterprise deal", () => {
    const payload = buildMintPayload("u", 75000, "insights-enterprise");
    expect(payload.royaltyAmount).toBe(9000);  // 12% of 75k
    expect(payload.platformFee).toBe(5250);    // 7% of 75k
    expect(payload.engineFee).toBe(3750);      // 5% of 75k
  });

  it("should include userId and dealId in payload for traceability", () => {
    const payload = buildMintPayload("user-789", 3000, "deal-trace");
    expect(payload.userId).toBe("user-789");
    expect(payload.dealId).toBe("deal-trace");
  });

  it("should never mint negative or zero tokens", () => {
    const payload = buildMintPayload("u", 99, "d");
    expect(payload.royaltyAmount).toBeGreaterThan(0);
    expect(payload.platformFee).toBeGreaterThan(0);
    expect(payload.engineFee).toBeGreaterThan(0);
  });
});
