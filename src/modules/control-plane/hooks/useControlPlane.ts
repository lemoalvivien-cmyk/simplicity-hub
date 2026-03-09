// PROOF:CONTROL_PLANE_V2:use_control_plane_hook
/**
 * useControlPlane — Hook principal du Control Plane
 *
 * Orchestre:
 * 1. Checks de capacités calculés (runtime + statiques honnêtes)
 * 2. Evidence registry construite depuis des sources réelles
 * 3. Release gate calculé depuis les résultats réels
 * 4. Stale detection automatique
 */

import { useQuery } from "@tanstack/react-query";
import { runAllCapabilityChecks, buildCapabilityMatrix } from "../services/capability-engine";
import { computeReleaseGate } from "../services/release-gate-engine";
import { buildEvidenceRegistry } from "../services/evidence-engine";
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
  const [checkResults, evidenceRecords] = await Promise.all([
    runAllCapabilityChecks(),
    buildEvidenceRegistry(),
  ]);

  const capabilities = buildCapabilityMatrix(checkResults);
  const releaseGate  = computeReleaseGate(capabilities);

  return { capabilities, evidenceRecords, releaseGate };
}

export function useControlPlane(): ControlPlaneState {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["control-plane"],
    queryFn:  fetchControlPlaneData,
    staleTime: STALE_TIME,
    gcTime:    GC_TIME,
    retry: 1,
  });

  const capabilities = data?.capabilities ?? [];
  const evidence     = data?.evidenceRecords ?? [];
  const releaseGate  = data?.releaseGate ?? {
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
    summary: { ready, partial, blocked, unknown, total, score },
    loading: isLoading,
    error: error ? String(error) : null,
    lastRefreshedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null,
    refetch,
  };
}
