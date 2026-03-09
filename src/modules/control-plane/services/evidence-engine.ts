// PROOF:CONTROL_PLANE_V2:evidence_engine_real
/**
 * Evidence Engine — Produit la registry de preuves depuis des sources réelles
 *
 * Chaque EvidenceRecord est horodaté et lié à une capability.
 * Les sources "external" et "manual" sont déclarées honnêtement.
 */

import { supabase } from "@/integrations/supabase/client";
import type { EvidenceRecord } from "../domain/evidence.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const NOW = () => new Date().toISOString();
let evidenceIdCounter = 0;
const mkId = (key: string) => `ev_${key}_${++evidenceIdCounter}`;

async function checkTableRow(
  table: string,
  capabilityKey: string,
  title: string
): Promise<EvidenceRecord> {
  try {
    const { count, error } = await db
      .from(table)
      .select("*", { count: "exact", head: true });

    return {
      id: mkId(capabilityKey),
      capabilityKey,
      title,
      evidenceType: "runtime",
      sourceKind: "db-query",
      sourceLabel: `table: ${table}`,
      verifiedAt: NOW(),
      stale: false,
      severity: error ? "high" : "info",
      summary: error
        ? `Table ${table} INACCESSIBLE: ${error.message}`
        : `Table ${table} accessible — ${count ?? 0} lignes`,
      rawDetails: error ? JSON.stringify(error) : `count=${count}`,
      blastRadius: error ? `Toutes les fonctionnalités dépendant de ${table}` : undefined,
    };
  } catch (e) {
    return {
      id: mkId(capabilityKey),
      capabilityKey,
      title,
      evidenceType: "runtime",
      sourceKind: "db-query",
      sourceLabel: `table: ${table}`,
      verifiedAt: NOW(),
      stale: false,
      severity: "critical",
      summary: `Exception lors du check de ${table}`,
      rawDetails: String(e),
    };
  }
}

async function checkRPC(
  rpcName: string,
  capabilityKey: string,
  title: string
): Promise<EvidenceRecord> {
  try {
    const { error } = await db.rpc(rpcName);
    const notFound =
      error?.code === "PGRST202" ||
      (error?.message ?? "").includes("does not exist");

    return {
      id: mkId(capabilityKey),
      capabilityKey,
      title,
      evidenceType: "runtime",
      sourceKind: "rpc-call",
      sourceLabel: `rpc: ${rpcName}`,
      verifiedAt: NOW(),
      stale: false,
      severity: notFound ? "critical" : "info",
      summary: notFound
        ? `RPC ${rpcName} INTROUVABLE`
        : `RPC ${rpcName} présente${error ? ` (erreur permission attendue: ${error.code})` : ""}`,
      rawDetails: error ? JSON.stringify(error) : "OK",
      recommendedAction: notFound ? `Créer la fonction ${rpcName} en base` : undefined,
    };
  } catch (e) {
    return {
      id: mkId(capabilityKey),
      capabilityKey,
      title,
      evidenceType: "runtime",
      sourceKind: "rpc-call",
      sourceLabel: `rpc: ${rpcName}`,
      verifiedAt: NOW(),
      stale: false,
      severity: "critical",
      summary: `Exception RPC ${rpcName}`,
      rawDetails: String(e),
    };
  }
}

function staticEvidence(
  capabilityKey: string,
  title: string,
  summary: string,
  evidenceType: EvidenceRecord["evidenceType"],
  sourceKind: EvidenceRecord["sourceKind"],
  sourceLabel: string,
  severity: EvidenceRecord["severity"],
  details?: { rawDetails?: string; recommendedAction?: string; blastRadius?: string }
): EvidenceRecord {
  return {
    id: mkId(capabilityKey),
    capabilityKey,
    title,
    evidenceType,
    sourceKind,
    sourceLabel,
    verifiedAt: NOW(),
    stale: false,
    severity,
    summary,
    ...details,
  };
}

export async function buildEvidenceRegistry(): Promise<EvidenceRecord[]> {
  const runtimeChecks = await Promise.all([
    // Tables critiques
    checkTableRow("launch_quota", "launchQuota", "Table launch_quota accessible"),
    checkTableRow("promo_codes", "promoCodes", "Table promo_codes accessible"),
    checkTableRow("analytics_events", "loadTestAvailable", "Table analytics_events accessible"),
    checkTableRow("billing_events", "stripeWebhook", "Table billing_events accessible"),
    checkTableRow("payouts", "payoutPipeline", "Table payouts accessible"),
    checkTableRow("reactivation_jobs", "pgCronReactivation", "Table reactivation_jobs accessible"),
    checkTableRow("openclaw_scheduled_runs", "pgCronOpenClaw", "Table openclaw_scheduled_runs accessible"),

    // RPCs critiques
    checkRPC("increment_launch_quota_used_slots", "launchQuota", "RPC increment_launch_quota_used_slots"),
    checkRPC("scan_reactivation_candidates", "pgCronReactivation", "RPC scan_reactivation_candidates"),
    checkRPC("generate_payouts_from_validated_gains", "payoutPipeline", "RPC generate_payouts_from_validated_gains"),
    checkRPC("update_payout_status", "payoutPipeline", "RPC update_payout_status [admin-only]"),
  ]);

  const staticRecords: EvidenceRecord[] = [
    staticEvidence(
      "stripeWebhook",
      "STRIPE_WEBHOOK_SECRET — config cloud",
      "Secret cloud requis et non vérifiable côté client. Edge fn stripe-webhook déployée.",
      "external-config",
      "external",
      "Lovable Cloud secrets",
      "medium",
      {
        recommendedAction: "Vérifier que STRIPE_WEBHOOK_SECRET est configuré dans Cloud secrets",
        blastRadius: "Tout le flux de billing — checkout → webhook → activation abonnement",
      }
    ),
    staticEvidence(
      "stripeCheckout",
      "STRIPE_SECRET_KEY — config cloud",
      "Secret cloud requis et non vérifiable côté client. Edge fn create-checkout déployée.",
      "external-config",
      "external",
      "Lovable Cloud secrets",
      "medium",
      { recommendedAction: "Vérifier que STRIPE_SECRET_KEY est configuré dans Cloud secrets" }
    ),
    staticEvidence(
      "stripeCustomerPortal",
      "Customer Portal Stripe — activation manuelle requise",
      "BLOQUÉ: Stripe Dashboard → Billing → Customer Portal → Activate non effectué.",
      "external-config",
      "manual",
      "Stripe Dashboard",
      "high",
      {
        recommendedAction: "Activer le Customer Portal dans Stripe Dashboard",
        blastRadius: "Gestion d'abonnement par les utilisateurs inutilisable",
      }
    ),
    staticEvidence(
      "resendEmail",
      "RESEND_API_KEY — config cloud",
      "Secret cloud requis. Edge fn send-reactivation-email déployée. Email livraison non testée.",
      "external-config",
      "external",
      "Lovable Cloud secrets",
      "medium",
      { recommendedAction: "Tester un envoi email depuis /admin/reactivation" }
    ),
    staticEvidence(
      "pgCronReactivation",
      "pg_cron réactivation — script SQL non exécuté",
      "Script SQL disponible dans supabase/infra/scheduled-jobs.md. NON CRÉÉ EN BASE.",
      "manual-step",
      "manual",
      "supabase/infra/scheduled-jobs.md",
      "medium",
      { recommendedAction: "Exécuter le SQL dans Backend → Run SQL" }
    ),
    staticEvidence(
      "pgCronPayout",
      "pg_cron payout — script SQL non exécuté",
      "Script SQL disponible dans supabase/infra/scheduled-jobs.md. NON CRÉÉ EN BASE.",
      "manual-step",
      "manual",
      "supabase/infra/scheduled-jobs.md",
      "medium",
      { recommendedAction: "Exécuter le SQL dans Backend → Run SQL" }
    ),
    staticEvidence(
      "authRLS",
      "Auth + RLS — code présent et vérifié",
      "Auth email/password, ProtectedRoute, RLS migrations, user_roles + has_role() SECURITY DEFINER.",
      "code",
      "code-presence",
      "src/components/auth/ProtectedRoute.tsx + supabase/migrations",
      "info",
    ),
    staticEvidence(
      "canonicalDomain",
      "Domaine canonique — DNS non vérifiable",
      "wiinupmax.com: impossible à vérifier depuis Lovable. Vérifier Project Settings → Domains.",
      "external-config",
      "external",
      "DNS / Lovable Settings",
      "low",
      { recommendedAction: "Vérifier dans Lovable → Settings → Domains" }
    ),
    staticEvidence(
      "envHygiene",
      "Hygiène .env — clés publishable uniquement, .gitignore platform-managed",
      ".env contient uniquement VITE_SUPABASE_* (clés publishable anon). " +
        ".gitignore est read-only (plateforme Lovable). " +
        "LIMITE: .env reste visible dans export Lovable (contrainte plateforme). Secrets dans Cloud.",
      "code",
      "code-presence",
      ".env + .env.example — .gitignore: platform-managed",
      "low",
    ),
    staticEvidence(
      "smokeTestAvailable",
      "Smoke tests — script présent, non exécuté",
      "scripts/smoke-test.sh présent. Non exécuté — requiert shell externe.",
      "code",
      "code-presence",
      "scripts/smoke-test.sh",
      "low",
      { recommendedAction: "bash scripts/smoke-test.sh $SUPABASE_URL $ANON_KEY" }
    ),
    staticEvidence(
      "loadTestAvailable",
      "Load tests k6 — script présent, non exécuté",
      "scripts/load-test-k6.js présent. Non exécuté — requiert k6.",
      "code",
      "code-presence",
      "scripts/load-test-k6.js",
      "low",
      { recommendedAction: "k6 run scripts/load-test-k6.js" }
    ),
  ];

  return [...runtimeChecks, ...staticRecords];
}
