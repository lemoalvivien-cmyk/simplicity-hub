/**
 * GO-LIVE HEALTH — Single source of truth for launch blockers and warnings.
 * PROOF:GOLIVE_V1:go_live_blockers_real → this file
 *
 * Updated: 2026-03-08 — GOLIVE HARDENING V1
 * Used by /admin/system-health and /admin/go-live
 */

export type BlockerSeverity = "blocker" | "warning" | "info";
export type BlockerStatus   = "open" | "resolved" | "partial";

export interface GoLiveBlocker {
  id: string;
  label: string;
  severity: BlockerSeverity;
  status: BlockerStatus;
  area: string;
  note: string;
}

// PROOF:GOLIVE_V1:go_live_blockers_real
export const GO_LIVE_BLOCKERS: GoLiveBlocker[] = [
  // ── REAL BLOCKERS ───────────────────────────────────────────────────────────
  {
    id: "stripe_webhook_secret",
    label: "STRIPE_WEBHOOK_SECRET non configuré",
    severity: "blocker",
    status: "open",
    area: "Billing",
    note: "Sans ce secret, les webhooks Stripe peuvent être forgés. Obligatoire avant prod.",
  },
  {
    id: "stripe_customer_portal",
    label: "Stripe Customer Portal non activé dans le dashboard Stripe",
    severity: "blocker",
    status: "open",
    area: "Billing",
    note: "L'edge function customer-portal est déployée mais inutilisable sans activation dans Stripe.",
  },

  // ── WARNINGS ────────────────────────────────────────────────────────────────
  {
    id: "passive_still_semi_batch",
    label: "Passive ingestion: mode semi-batch (RPC + client trigger)",
    severity: "warning",
    status: "partial",
    area: "Passive OS",
    note: "ingest_passive_signal() RPC existe et est idempotent. Appelé depuis PassiveOS au mount. Pas encore un vrai webhook temps-réel. Limite documentée : pas d'ingestion sans que le facilitateur ouvre la page.",
  },
  {
    id: "message_templates_not_versioned",
    label: "Templates messages: pas de versioning ni de variables dynamiques",
    severity: "warning",
    status: "open",
    area: "Messages",
    note: "Les templates sont persistés en DB (GOLIVE_V1) mais pas versionnés. Les variables comme [Prénom] sont manuelles.",
  },
  {
    id: "automation_rules_minimal",
    label: "Règles d'automatisation: minimales — pas encore de moteur d'exécution côté backend",
    severity: "warning",
    status: "partial",
    area: "Règles",
    note: "La table automation_rules est persistée. L'UI lit/écrit la vraie DB. Mais les règles ne déclenchent pas encore d'actions backend (ex: auto_promote_intro n'est pas encore branché au trigger DB).",
  },
  {
    id: "openclaw_gateway_not_configured",
    label: "OpenClaw Gateway non configurée pour canaux avancés",
    severity: "warning",
    status: "open",
    area: "OpenClaw",
    note: "WhatsApp, LinkedIn, auto-send nécessitent gateway_url + gateway_secret par utilisateur.",
  },
  {
    id: "radar_not_wired_to_all_pages",
    label: "Radar signal → pipeline: non branché à toutes les pages Radar",
    severity: "warning",
    status: "partial",
    area: "Radar",
    note: "createLeadFromRadar() existe dans leadPipeline.ts. Radar.tsx l'appelle pour les signaux manuels. Les signaux automatiques (scanner) ne créent pas encore de lead_intake.",
  },

  // ── INFO ─────────────────────────────────────────────────────────────────────
  {
    id: "regles_real_db",
    label: "Règles: persistées en DB réelle",
    severity: "info",
    status: "resolved",
    area: "Règles",
    note: "automation_rules table créée. Regles.tsx utilise useAutomationRules hook. Seed auto au 1er accès.",
  },
  {
    id: "messages_real_db",
    label: "Messages: templates persistés en DB réelle",
    severity: "info",
    status: "resolved",
    area: "Messages",
    note: "message_templates table créée. Messages.tsx utilise useMessageTemplates hook. Seed auto au 1er accès.",
  },
  {
    id: "passive_rpc_exists",
    label: "Passive: ingest_passive_signal() RPC déployé",
    severity: "info",
    status: "resolved",
    area: "Passive OS",
    note: "RPC serveur avec guard idempotence. PassiveOS.tsx l'appelle via supabase.rpc() — plus de client-side brut.",
  },
  {
    id: "action_audit_trail",
    label: "Audit trail actions: lead_action_events opérationnel",
    severity: "info",
    status: "resolved",
    area: "Pipeline",
    note: "Chaque mutation de statut via update_lead_action_status() écrit un événement tracé dans lead_action_events.",
  },
  {
    id: "typescript_strict_null_checks",
    label: "TypeScript: strictNullChecks désactivé",
    severity: "warning",
    status: "open",
    area: "Infrastructure",
    note: "tsconfig.app.json : strict=false. Risque de null-deref latent. ~50 erreurs estimées si activé.",
  },
  {
    id: "campaign_sequences_not_implemented",
    label: "Séquences de campagne: pas encore de table campaign_steps",
    severity: "warning",
    status: "open",
    area: "Campagnes",
    note: "CampagneDetail affiche la section séquences mais sans données DB réelles.",
  },
];

export const BLOCKERS_ONLY   = GO_LIVE_BLOCKERS.filter(b => b.severity === "blocker"  && b.status !== "resolved");
export const WARNINGS_OPEN   = GO_LIVE_BLOCKERS.filter(b => b.severity === "warning"  && b.status !== "resolved");
export const RESOLVED        = GO_LIVE_BLOCKERS.filter(b => b.status === "resolved");

export const GO_LIVE_SCORE = Math.round(
  (RESOLVED.length / GO_LIVE_BLOCKERS.length) * 100
);
