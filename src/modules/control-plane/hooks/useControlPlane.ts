// PROOF:CONTROL_PLANE_V3:use_control_plane_hook_billing_first
/**
 * useControlPlane — Hook principal du Control Plane
 *
 * Orchestre:
 * 1. Checks de capacités calculés (runtime + statiques honnêtes)
 * 2. Evidence registry construite depuis des sources réelles
 * 3. Release gate calculé depuis les résultats réels + billing proof context live
 * 4. Stale detection automatique
 *
 * V3 : billingProofContext injecté depuis get_billing_proof_summary (RPC admin).
 * Si l'appelant n'est pas admin, le context est absent → fallback comportement V2.
 */

import { useQuery } from "@tanstack/react-query";
import { runAllCapabilityChecks, buildCapabilityMatrix } from "../services/capability-engine";
import { computeReleaseGate } from "../services/release-gate-engine";
import type { BillingProofContext } from "../services/release-gate-engine";
import { buildEvidenceRegistry } from "../services/evidence-engine";
import { supabase } from "@/integrations/supabase/client";
import type { Capability } from "../domain/capability.types";
import type { ReleaseGateResult } from "../domain/gate.types";
import type { EvidenceRecord } from "../domain/evidence.types";

const STALE_TIME = 90 * 1000;    // 90s avant re-fetch
const GC_TIME   = 5 * 60 * 1000; // 5min

export interface ControlPlaneState {
  capabilities: Capability[];
  capabilitiesByGroup: Record<string, Capability[]>;
  releaseGate: ReleaseGateResult;
  evidence: EvidenceRecord[];
  billingProof: BillingProofContext | null;
  summary: {
    ready: number;
    partial: number;
    blocked: number;
    unknown: number;
    total: number;
    score: number;
  };
  loading: boolean;
  error: string | null;
  lastRefreshedAt: string | null;
  refetch: () => void;
}

async function fetchControlPlaneData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [checkResults, evidenceRecords, summaryRes] = await Promise.all([
    runAllCapabilityChecks(),
    buildEvidenceRegistry(),
    db.rpc("get_billing_proof_summary").then((r: { data: unknown; error: unknown }) => r),
  ]);

  const capabilities = buildCapabilityMatrix(checkResults);

  // Build billing proof context from live DB summary (admin-only RPC)
  let billingProof: BillingProofContext | undefined;
  if (summaryRes.data && !summaryRes.error) {
    const s = summaryRes.data as Record<string, number>;
    billingProof = {
      totalBillingEvents: s.total_billing_events ?? 0,
      fullProofEvents:    s.full_proof_events    ?? 0,
      quotaConsumedCount: s.quota_consumed_count ?? 0,
    };
  }

  const releaseGate = computeReleaseGate(capabilities, billingProof);

  return { capabilities, evidenceRecords, releaseGate, billingProof: billingProof ?? null };
}

export function useControlPlane(): ControlPlaneState {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["control-plane"],
    queryFn:  fetchControlPlaneData,
    staleTime: STALE_TIME,
    gcTime:    GC_TIME,
    retry: 1,
  });

  const capabilities  = data?.capabilities ?? [];
  const evidence      = data?.evidenceRecords ?? [];
  const billingProof  = data?.billingProof ?? null;
  const releaseGate   = data?.releaseGate ?? {
    verdict: "DEV_ONLY" as const,
    justification: "Données en cours de chargement…",
    blockers: [],
    warnings: [],
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    computedAt: new Date().toISOString(),
    confidenceScore: 0,
  };

  const capabilitiesByGroup = capabilities.reduce<Record<string, Capability[]>>(
    (acc, cap) => {
      if (!acc[cap.group]) acc[cap.group] = [];
      acc[cap.group].push(cap);
      return acc;
    },
    {}
  );

  const ready   = capabilities.filter((c) => c.status === "ready").length;
  const partial = capabilities.filter((c) => c.status === "partial").length;
  const blocked = capabilities.filter((c) => c.status === "blocked").length;
  const unknown = capabilities.filter((c) => c.status === "unknown").length;
  const total   = capabilities.length;
  const score   = total > 0 ? Math.round((ready / total) * 100) : 0;

  return {
    capabilities,
    capabilitiesByGroup,
    releaseGate,
    evidence,
    billingProof,
    summary: { ready, partial, blocked, unknown, total, score },
    loading: isLoading,
    error: error ? String(error) : null,
    lastRefreshedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null,
    refetch,
  };
}
