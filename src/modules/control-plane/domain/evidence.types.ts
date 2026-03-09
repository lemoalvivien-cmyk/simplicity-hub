// PROOF:CONTROL_PLANE_V2:evidence_types_domain
/**
 * Evidence Types — Registry des preuves vivantes
 *
 * Chaque preuve est horodatée, classée et liée à une capability.
 * Ce n'est PAS du mock — chaque EvidenceRecord doit être
 * produit par un check réel ou déclaré honnêtement comme externe/manuel.
 */

export type EvidenceSourceKind =
  | "db-query"       // résultat d'une requête Supabase réelle
  | "rpc-call"       // appel RPC PostgreSQL
  | "edge-fn-call"   // appel à une edge function
  | "code-presence"  // présence vérifiée dans le code source
  | "external"       // config ou service externe non vérifiable ici
  | "manual"         // étape manuelle documentée, non automatisable ici
  | "derived";       // calculé à partir d'autres preuves

export type EvidenceSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface EvidenceRecord {
  id: string;
  capabilityKey: string;
  title: string;
  evidenceType: "code" | "runtime" | "external-config" | "manual-step" | "unknown";
  sourceKind: EvidenceSourceKind;
  sourceLabel: string;        // ex: "table launch_quota", "RPC increment_launch_quota_used_slots"
  verifiedAt: string;         // ISO string
  stale: boolean;             // si lastCheck > staleAfterMs
  severity: EvidenceSeverity;
  summary: string;
  rawDetails?: string;        // détails techniques bruts
  recommendedAction?: string;
  blastRadius?: string;       // quels systèmes sont impactés si ça casse
}

export interface EvidenceRegistryState {
  records: EvidenceRecord[];
  lastRefreshedAt: string;
  loading: boolean;
  error: string | null;
}
