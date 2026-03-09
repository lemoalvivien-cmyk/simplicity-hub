// PROOF:BILLING_PROOF_CHAIN_V3:billing_proof_panel_post_test_lock
/**
 * BillingProofPanel — Surface admin billing proof chain
 *
 * Répond en < 10 secondes à la question :
 * "Ce paiement a-t-il été encaissé, vérifié, enregistré, corrélé,
 *  puis a-t-il réellement activé le quota / entitlement attendu ?"
 *
 * Source de vérité : RPC get_billing_proof_chain + get_billing_proof_summary
 * JAMAIS de blob JSON opaque affiché directement.
 *
 * ÉTATS BILLING (STATE MACHINE) :
 *   no_checkout       → aucun événement billing reçu
 *   checkout_created  → session créée, pas encore complétée
 *   webhook_received  → webhook reçu
 *   webhook_verified  → signature Stripe vérifiée
 *   persisted_only    → persisté en DB, abonnement non synced
 *   quota_mutated     → quota/entitlement muté
 *   full_proof        → chaîne complète checkout→webhook→quota
 *   broken            → chaîne cassée, corrélation impossible
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  CreditCard, Zap, ExternalLink, Info, ShieldCheck, ShieldX,
  BarChart2, Trophy, AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BillingProofRow {
  event_id: string;
  stripe_event_id: string | null;
  event_type: string;
  occurred_at: string;
  processed_at: string;
  user_id: string | null;
  stripe_object_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id_from_event: string | null;
  amount_eur: number | null;
  currency: string | null;
  offer_type: string | null;
  metadata_user_id: string | null;
  object_status: string | null;
  quota_status: string;
  subscription_sync_status: string;
  proof_level: string;
}

interface BillingProofSummary {
  total_billing_events: number;
  checkout_completed_events: number;
  subscription_events: number;
  full_proof_events: number;
  partial_proof_events: number;
  broken_events: number;
  quota_consumed_count: number;
  quota_used_slots: number | null;
  quota_total_slots: number | null;
  active_subscriptions: number;
  computed_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function proofLevelConfig(level: string) {
  switch (level) {
    case "full":
      return { label: "COMPLET", icon: CheckCircle2, cls: "text-success bg-success/10 border-success/20" };
    case "partial":
      return { label: "PARTIEL", icon: AlertTriangle, cls: "text-warning bg-warning/10 border-warning/20" };
    case "subscription_event":
      return { label: "SUB EVENT", icon: Info, cls: "text-primary bg-primary/10 border-primary/20" };
    case "no_event_id":
    case "webhook_only":
      return { label: "CASSÉ", icon: XCircle, cls: "text-destructive bg-destructive/10 border-destructive/20" };
    default:
      return { label: level.toUpperCase(), icon: Clock, cls: "text-muted-foreground bg-muted border-border" };
  }
}

function quotaStatusConfig(status: string) {
  switch (status) {
    case "consumed":       return { label: "Slot consommé ✓",     cls: "badge-success" };
    case "not_consumed":   return { label: "Slot NON consommé ⚠",  cls: "bg-warning/10 text-warning inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" };
    case "not_applicable": return { label: "N/A (standard)",       cls: "badge-muted" };
    case "no_subscription_id": return { label: "Pas de sub ID",   cls: "badge-muted" };
    default:               return { label: status,                  cls: "badge-muted" };
  }
}

function syncStatusConfig(status: string) {
  switch (status) {
    case "synced":  return { label: "Synced ✓",   cls: "badge-success" };
    case "missing": return { label: "Manquant ✗",  cls: "bg-destructive/10 text-destructive inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" };
    default:        return { label: status,         cls: "badge-muted" };
  }
}

function fmtDate(s: string): string {
  try { return new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
}

function shortId(s: string | null): string {
  if (!s) return "—";
  return s.length > 20 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
}

// ── Pipeline State Machine ─────────────────────────────────────────────────────
// PROOF:BILLING_PROOF_CHAIN_V3:pipeline_state_machine_post_test
//
// États observables depuis get_billing_proof_summary (pas de checkbox_created/webhook_missing
// car ces états pré-completion ne sont pas disponibles sans données checkout côté Stripe).
//
//   no_checkout       → billing_events = 0, rien reçu
//   webhook_received  → billing_events > 0, aucun checkout.session.completed
//   quota_not_mutated → checkout complété + persisté, quota non muté (launch sans consommation)
//   quota_mutated     → launch_quota_consumed > 0, pas encore full_proof corrélé
//   full_proof        → proof_level='full' confirmé dans billing_proof_chain
//   broken            → broken_events > 0, corrélation impossible
//
// NOTE : checkout_created / webhook_missing sont des états Stripe-side non observables
// depuis la DB seule. Ils sont exclus pour éviter l'ambiguïté.
type PipelineState =
  | "no_checkout"
  | "webhook_received"
  | "quota_not_mutated"
  | "quota_mutated"
  | "full_proof"
  | "broken";

function computePipelineState(summary: BillingProofSummary | null): PipelineState {
  if (!summary || summary.total_billing_events === 0) return "no_checkout";
  // Broken: events with no correlation AND no full proof
  if (summary.broken_events > 0 && summary.full_proof_events === 0) return "broken";
  // Full proof: the only terminal success state
  if (summary.full_proof_events > 0) return "full_proof";
  // Quota consumed but not yet full_proof correlated
  if (summary.quota_consumed_count > 0) return "quota_mutated";
  // Checkout completed but quota not mutated (offer_type issue or not launch)
  if (summary.checkout_completed_events > 0 && summary.quota_consumed_count === 0) return "quota_not_mutated";
  // Events received but no checkout.session.completed yet
  return "webhook_received";
}

const PIPELINE_STEPS: { key: PipelineState; label: string; desc: string; cause?: string; action?: string }[] = [
  { key: "no_checkout",       label: "Aucun event",       desc: "billing_events = 0",         cause: "Webhook Stripe jamais reçu",             action: "Exécuter scripts/verify-stripe-webhook.sh" },
  { key: "webhook_received",  label: "Webhook reçu",      desc: "Persisté, pas de checkout",  cause: "Événements reçus, checkout non finalisé", action: "Tester checkout complet sur /pricing" },
  { key: "quota_not_mutated", label: "Quota en attente",  desc: "Checkout OK, quota non muté", cause: "offer_type≠launch ou quotaEngine skip",  action: "Vérifier offer_type=launch dans metadata Stripe" },
  { key: "quota_mutated",     label: "Quota muté",        desc: "Entitlement activé",          cause: "Corrélation billing_proof_chain incomplète", action: "Vérifier billing_proof_chain → proof_level" },
  { key: "full_proof",        label: "Preuve complète",   desc: "E2E prouvé ✓",                cause: "—",                                      action: "—" },
];

const PIPELINE_ORDER: Record<PipelineState, number> = {
  no_checkout:       0,
  webhook_received:  1,
  quota_not_mutated: 2,
  quota_mutated:     3,
  full_proof:        4,
  broken:            -1,
};

// ── Premier Euro Hero Block ────────────────────────────────────────────────────

function PremierEuroBlock({
  summary, rows, loading
}: { summary: BillingProofSummary | null; rows: BillingProofRow[]; loading: boolean }) {
  const isProven = (summary?.full_proof_events ?? 0) > 0;

  // Last full_proof row (for proven details)
  const lastFullProof = rows.find((r) => r.proof_level === "full");
  // Last ANY row (for "Dernière tentative observée" — shown even when no full proof)
  const lastAnyRow = rows[0] ?? null;

  const pipelineState = computePipelineState(summary);
  const pipelineIdx = pipelineState === "broken" ? -1 : PIPELINE_ORDER[pipelineState];

  // Active step metadata for contextual action
  const activeStep = PIPELINE_STEPS.find((s) => s.key === pipelineState);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl border border-border bg-muted/20 animate-pulse">
        <div className="h-6 w-64 bg-muted rounded mb-3" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 p-5 ${
      isProven
        ? "border-success/40 bg-success/5"
        : "border-destructive/30 bg-destructive/5"
    }`}>

      {/* ① Bloc Premier paiement prouvé */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {isProven ? (
            <Trophy size={22} className="text-success shrink-0" />
          ) : (
            <AlertCircle size={22} className="text-destructive shrink-0" />
          )}
          <div>
            <p className="text-base font-bold text-foreground">
              Premier paiement prouvé :{" "}
              <span className={isProven ? "text-success" : "text-destructive"}>
                {isProven ? "OUI ✓" : "NON ✗"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isProven
                ? "Chaîne checkout → webhook → quota entièrement tracée."
                : "Aucun full_proof_event en base. Exécuter le runbook Stripe."}
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
          isProven
            ? "bg-success/10 text-success border-success/30"
            : summary && summary.total_billing_events > 0
            ? "bg-warning/10 text-warning border-warning/30"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          {isProven ? "E2E_PROVEN" : summary && summary.total_billing_events > 0 ? "RUNTIME_READY" : "CODE_READY"}
        </span>
      </div>

      {/* ② Détails preuve complète (si prouvé) */}
      {isProven && lastFullProof && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
          <div className="rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">Stripe Event ID</p>
            <p className="font-mono font-semibold text-foreground truncate">{shortId(lastFullProof.stripe_event_id)}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">User impacté</p>
            <p className="font-mono font-semibold text-foreground">{shortId(lastFullProof.user_id)}</p>
          </div>
          <div className="rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">Montant</p>
            <p className="font-semibold text-foreground">
              {lastFullProof.amount_eur != null ? `${lastFullProof.amount_eur.toLocaleString("fr")} €` : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">Mutation quota</p>
            <p className="font-semibold text-success">{lastFullProof.quota_status === "consumed" ? "Consommé ✓" : lastFullProof.quota_status}</p>
          </div>
          <div className="col-span-2 rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">Date preuve</p>
            <p className="font-semibold text-foreground">{fmtDate(lastFullProof.occurred_at)}</p>
          </div>
          <div className="col-span-2 rounded-lg bg-background border border-border p-2.5">
            <p className="text-muted-foreground mb-0.5">Corrélation</p>
            <p className="font-semibold text-success">checkout → webhook → quota ✓</p>
          </div>
        </div>
      )}

      {/* ③ Dernière tentative observée — PROOF:BILLING_PROOF_CHAIN_V3:derniere_tentative_block */}
      {/* Visible même sans full_proof : montre le dernier event ANY (partial, broken, etc.) */}
      {!isProven && lastAnyRow && (
        <div className="mb-4 p-3 rounded-xl border border-border bg-background/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Dernière tentative observée
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-mono font-medium text-foreground truncate">{lastAnyRow.event_type.replace("customer.subscription.", "sub.")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stripe Event ID</p>
              <p className="font-mono font-medium text-foreground">{shortId(lastAnyRow.stripe_event_id)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User impacté</p>
              <p className="font-mono font-medium text-foreground">{shortId(lastAnyRow.user_id)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{fmtDate(lastAnyRow.occurred_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Proof Level</p>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold border ${proofLevelConfig(lastAnyRow.proof_level).cls}`}>
                {proofLevelConfig(lastAnyRow.proof_level).label}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground">Quota</p>
              <span className={`text-xs font-medium ${quotaStatusConfig(lastAnyRow.quota_status).cls}`}>
                {quotaStatusConfig(lastAnyRow.quota_status).label}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Sub ID</p>
              <p className="font-mono text-foreground">{shortId(lastAnyRow.stripe_subscription_id_from_event)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ④ Pipeline state machine */}
      <div className="border-t border-border/60 pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          État du pipeline billing
        </p>
        {pipelineState === "broken" ? (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <XCircle size={12} /> Chaîne cassée — {summary?.broken_events ?? 0} événement(s) non corrélés
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-wrap">
            {PIPELINE_STEPS.filter((s) => s.key !== "no_checkout" || pipelineIdx === 0).map((step, idx, arr) => {
              const stepOrder = PIPELINE_ORDER[step.key];
              const isActive = stepOrder === pipelineIdx;
              const isPast = stepOrder < pipelineIdx;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                    isPast   ? "bg-success/10 border-success/20 text-success" :
                    isActive ? "bg-primary/10 border-primary/30 text-primary font-bold" :
                               "bg-muted border-border text-muted-foreground opacity-50"
                  }`}>
                    {isPast ? <CheckCircle2 size={9} /> : isActive ? <Zap size={9} /> : <Clock size={9} />}
                    {step.label}
                  </div>
                  {idx < arr.length - 1 && (
                    <span className={`text-xs font-bold ${isPast ? "text-success" : "text-muted-foreground/40"}`}>→</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ⑤ Prochaine action unique — dérivée de l'état actif du pipeline */}
      {!isProven && activeStep && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
            <Zap size={11} className="text-primary" />
            {pipelineState === "no_checkout"       && "ACTION : Exercer le premier webhook Stripe"}
            {pipelineState === "webhook_received"  && "ACTION : Déclencher un checkout complet"}
            {pipelineState === "quota_not_mutated" && "DIAGNOSTIC : Quota non muté — vérifier quotaEngine"}
            {pipelineState === "quota_mutated"     && "ACTION : Vérifier la corrélation checkout → quota"}
            {pipelineState === "broken"            && "DIAGNOSTIC : Chaîne cassée — corrélation impossible"}
          </p>
          <p className="text-xs text-muted-foreground">
            {pipelineState === "no_checkout"       && "1. Configurer STRIPE_WEBHOOK_SECRET dans Cloud Secrets → 2. stripe listen --forward-to [endpoint] → 3. Déclencher checkout sur /pricing avec 4242 4242 4242 4242"}
            {pipelineState === "webhook_received"  && "Webhooks reçus mais aucun checkout.session.completed traité. Tester un checkout complet sur /pricing avec carte 4242 4242 4242 4242."}
            {pipelineState === "quota_not_mutated" && "Checkout complété, persisté, mais quota non muté. Vérifier : offer_type=launch dans metadata ? Logs stripe-webhook → 'Quota consume result'. Table launch_quota_consumed."}
            {pipelineState === "quota_mutated"     && "Quota muté mais preuve non corrélée complète. Vérifier billing_proof_chain → chercher proof_level='full'. Comparer stripe_subscription_id avec launch_quota_consumed."}
            {pipelineState === "broken"            && "Événements sans stripe_event_id ou webhooks non corrélés. Causes : signature invalide, webhook réexpédié, event non traité. Vérifier logs Edge Function."}
          </p>
          <p className="text-xs text-primary/80 mt-1 font-mono">→ {activeStep.action}</p>
        </div>
      )}
    </div>
  );
}

// ── BillingProofBanner ─────────────────────────────────────────────────────────

function BillingProofBanner({ summary, loading }: { summary: BillingProofSummary | null; loading: boolean }) {
  if (loading) return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border animate-pulse">
      <div className="w-6 h-6 rounded-full bg-muted" />
      <div className="h-4 w-48 bg-muted rounded" />
    </div>
  );

  if (!summary) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
      <ShieldX size={15} /> Résumé billing indisponible — accès admin requis.
    </div>
  );

  const totalEvents = summary.total_billing_events;
  const hasFullProof = summary.full_proof_events > 0;
  const hasBroken = summary.broken_events > 0;
  const noEvents = totalEvents === 0;

  let bannerCls = "border";
  let Icon = Info;
  let msg = "";

  if (noEvents) {
    bannerCls += " bg-muted/40 border-border";
    Icon = AlertTriangle;
    msg = "Aucun événement billing reçu — webhook Stripe non exercé. Flux revenu non prouvé.";
  } else if (hasBroken && !hasFullProof) {
    bannerCls += " bg-destructive/5 border-destructive/20";
    Icon = ShieldX;
    msg = `${summary.broken_events} événement(s) cassé(s) dans la chaîne. Corrélation incomplète.`;
  } else if (hasFullProof) {
    bannerCls += " bg-success/5 border-success/20";
    Icon = ShieldCheck;
    msg = `${summary.full_proof_events} paiement(s) prouvé(s) E2E — quota: ${summary.quota_used_slots ?? 0}/${summary.quota_total_slots ?? "?"} slots.`;
  } else {
    bannerCls += " bg-warning/5 border-warning/20";
    Icon = AlertTriangle;
    msg = `${totalEvents} événement(s) reçu(s), aucune preuve complète E2E. Checkout test requis.`;
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${bannerCls}`}>
      <Icon size={15} className={hasFullProof ? "text-success" : hasBroken ? "text-destructive" : "text-warning"} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{msg}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          <span>Événements: <strong className="text-foreground">{totalEvents}</strong></span>
          <span>Checkouts: <strong className="text-foreground">{summary.checkout_completed_events}</strong></span>
          <span>Preuve complète: <strong className={hasFullProof ? "text-success" : "text-muted-foreground"}>{summary.full_proof_events}</strong></span>
          <span>Partielle: <strong className="text-foreground">{summary.partial_proof_events}</strong></span>
          <span>Abonnements actifs: <strong className="text-foreground">{summary.active_subscriptions}</strong></span>
        </div>
      </div>
    </div>
  );
}

// ── BillingCorrelationTable ────────────────────────────────────────────────────

function BillingCorrelationTable({ rows, loading }: { rows: BillingProofRow[]; loading: boolean }) {
  if (loading) return (
    <div className="space-y-2 py-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)}
    </div>
  );

  if (rows.length === 0) return (
    <div className="py-10 text-center">
      <CreditCard size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
      <p className="text-sm text-muted-foreground font-medium">Aucun événement billing</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
        Les événements apparaîtront ici après réception du premier webhook Stripe signé.
        <br />Exercer <code className="font-mono">scripts/verify-stripe-webhook.sh</code>.
      </p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Date</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Offre</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Quota</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Sub sync</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Preuve</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Event ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const plvl = proofLevelConfig(row.proof_level);
            const PlvlIcon = plvl.icon;
            const quota = quotaStatusConfig(row.quota_status);
            const sync = syncStatusConfig(row.subscription_sync_status);
            return (
              <tr key={row.event_id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-muted-foreground">{row.event_type.replace("customer.subscription.", "sub.")}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(row.occurred_at)}</td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {row.amount_eur != null ? `${row.amount_eur.toLocaleString("fr")} €` : "—"}
                </td>
                <td className="px-4 py-3">
                  {row.offer_type ? (
                    <span className={row.offer_type === "launch" ? "badge-warning" : "badge-success"}>{row.offer_type}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={quota.cls}>{quota.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={sync.cls}>{sync.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${plvl.cls}`}>
                    <PlvlIcon size={10} />
                    {plvl.label}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{shortId(row.stripe_event_id)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── BillingFailurePanel ────────────────────────────────────────────────────────

function BillingFailurePanel({ rows }: { rows: BillingProofRow[] }) {
  const broken = rows.filter((r) => ["no_event_id", "webhook_only"].includes(r.proof_level));
  const partial = rows.filter((r) => r.proof_level === "partial");
  const notConsumed = rows.filter((r) => r.quota_status === "not_consumed" && r.offer_type === "launch");

  if (broken.length === 0 && partial.length === 0 && notConsumed.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/5 border border-success/20 text-sm text-success">
        <CheckCircle2 size={13} /> Aucun événement cassé ni quota manqué détecté.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {broken.length > 0 && (
        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1.5">
            <XCircle size={12} /> {broken.length} événement(s) cassé(s)
          </p>
          <p className="text-xs text-muted-foreground">
            Sans stripe_event_id ou webhooks sans corrélation.
            Cause probable : webhook réexpédié, signature invalide, ou event non traité.
          </p>
        </div>
      )}
      {partial.length > 0 && (
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
          <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> {partial.length} preuve(s) partielle(s)
          </p>
          <p className="text-xs text-muted-foreground">
            Checkout complété mais abonnement non encore synchronisé ou quota non consommé.
            Vérifier les logs du webhook dans les fonctions edge.
          </p>
        </div>
      )}
      {notConsumed.length > 0 && (
        <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
          <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1.5">
            <AlertTriangle size={12} /> {notConsumed.length} slot(s) launch non consommé(s)
          </p>
          <p className="text-xs text-muted-foreground">
            Offre launch détectée sans entrée dans launch_quota_consumed.
            Risque : quota non décrémenté, entitlement incorrect.
            Vérifier le flow checkout → webhook → quotaEngine.
          </p>
        </div>
      )}
    </div>
  );
}

// ── BillingRunbookPanel ────────────────────────────────────────────────────────

function BillingRunbookPanel({ summary }: { summary: BillingProofSummary | null }) {
  const noEvents = !summary || summary.total_billing_events === 0;
  const noFullProof = !summary || summary.full_proof_events === 0;
  const portalUnknown = true; // Customer Portal activation is external-only

  // Determine classification
  const hasEvents = summary && summary.total_billing_events > 0;
  const classification = summary && summary.full_proof_events > 0
    ? "E2E_PROVEN"
    : hasEvents
    ? "RUNTIME_READY"
    : "CODE_READY";

  const classificationColor =
    classification === "E2E_PROVEN" ? "text-success" :
    classification === "RUNTIME_READY" ? "text-warning" :
    "text-primary";

  return (
    <div className="space-y-3">
      {/* Classification courante */}
      <div className="p-3 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Niveau de preuve actuel</p>
          <span className={`text-xs font-mono font-bold ${classificationColor}`}>{classification}</span>
        </div>
        <div className="space-y-1 text-xs mt-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${classification !== "E2E_PROVEN" ? "bg-success" : "bg-success"}`} />
            <span className="text-muted-foreground">CODE_READY</span>
            <span className="text-success font-mono text-xs ml-auto">✓</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasEvents ? "bg-success" : "bg-muted"}`} />
            <span className="text-muted-foreground">RUNTIME_READY</span>
            <span className={`font-mono text-xs ml-auto ${hasEvents ? "text-success" : "text-muted-foreground"}`}>
              {hasEvents ? "✓" : "— webhook non exercé"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">EXTERNAL_EXECUTION_REQUIRED</span>
            <span className="font-mono text-xs ml-auto text-warning">⚠ Stripe CLI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${summary && summary.full_proof_events > 0 ? "bg-success" : "bg-muted"}`} />
            <span className="text-muted-foreground">E2E_PROVEN</span>
            <span className={`font-mono text-xs ml-auto ${summary && summary.full_proof_events > 0 ? "text-success" : "text-destructive"}`}>
              {summary && summary.full_proof_events > 0 ? "✓" : "✗ NON PROUVÉ"}
            </span>
          </div>
        </div>
      </div>

      {/* Action 1: Prioritaire */}
      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
              <Zap size={12} className="text-primary" />
              {noEvents
                ? "ACTION CRITIQUE : Exercer le webhook Stripe"
                : noFullProof
                ? "ACTION : Tester un checkout complet"
                : "Monitoring : Surveiller les preuves complètes"}
            </p>
            <p className="text-xs text-muted-foreground">
              {noEvents
                ? "Aucun webhook reçu. Configurer STRIPE_WEBHOOK_SECRET dans Cloud Secrets, puis exécuter scripts/verify-stripe-webhook.sh."
                : noFullProof
                ? "Aucune preuve E2E complète. Tester avec carte 4242 4242 4242 4242 sur /pricing → checkout → vérifier webhook reçu."
                : "Preuve E2E présente. Surveiller les nouveaux paiements ici."}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">impactRevenu: CRITIQUE</span>
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">timeToExecute: 15min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action 2: Customer Portal */}
      {portalUnknown && (
        <div className="p-3 rounded-xl border border-warning/20 bg-warning/5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} className="text-warning" />
            Customer Portal Stripe — activation manuelle requise
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Sans activation, les utilisateurs ne peuvent pas gérer leur abonnement (annuler, changer CB).
            Blocage billing pour la beta privée.
          </p>
          <a
            href="https://dashboard.stripe.com/settings/billing/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            Ouvrir Stripe Dashboard <ExternalLink size={10} />
          </a>
          <p className="text-xs text-muted-foreground mt-1">
            Stripe Dashboard → Settings → Billing → Customer portal → Activate
          </p>
        </div>
      )}

      {/* Classification matrix */}
      <div className="p-3 rounded-xl border border-border bg-muted/20">
        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <BarChart2 size={12} /> Matrice de preuves billing
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Edge fn create-checkout</span>
            <span className="font-mono text-primary">PROUVÉ PAR LE CODE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Edge fn stripe-webhook</span>
            <span className="font-mono text-primary">PROUVÉ PAR LE CODE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">billing_proof_chain view</span>
            <span className="font-mono text-primary">PROUVÉ PAR LE CODE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">STRIPE_SECRET_KEY</span>
            <span className="font-mono text-warning">DÉPEND CONFIG EXTERNE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">STRIPE_WEBHOOK_SECRET</span>
            <span className="font-mono text-warning">DÉPEND CONFIG EXTERNE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Checkout → Webhook E2E</span>
            <span className={`font-mono ${summary && summary.full_proof_events > 0 ? "text-success" : "text-destructive"}`}>
              {summary && summary.full_proof_events > 0 ? "PROUVÉ PAR RUNTIME" : "NON PROUVÉ"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer Portal</span>
            <span className="font-mono text-destructive">ÉTAPE MANUELLE REQUISE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ReleaseDecisionBlock ───────────────────────────────────────────────────────
// PROOF:BILLING_PROOF_CHAIN_V5:release_decision_block_billing_only
//
// RÈGLE ABSOLUE : Ce bloc ne peut JAMAIS émettre PRIVATE_BETA_READY de façon autonome.
// PRIVATE_BETA_READY n'est émis que par computeReleaseGate() dans release-gate-engine.ts,
// qui reçoit un BillingProofContext réel depuis useControlPlane → get_billing_proof_summary.
//
// Ce bloc est BILLING-ONLY : il juge uniquement la chaîne billing (checkout → webhook → quota).
// Si full_proof_events >= 1, le billing gate est passé → verdict ici = PRIVATE_BETA_POSSIBLE
// (pas READY), avec instruction de vérifier le Control Plane pour le verdict global.
//
// Seul /admin/overview → ReleaseGateBanner affiche le verdict global réel (computeReleaseGate).

function ReleaseDecisionBlock({
  summary, loading
}: { summary: BillingProofSummary | null; loading: boolean }) {
  if (loading) return null;
  if (!summary) return null;

  const full      = summary.full_proof_events;
  const total     = summary.total_billing_events;
  const checkouts = summary.checkout_completed_events;
  const broken    = summary.broken_events;
  const partial   = summary.partial_proof_events;

  type Decision = {
    verdict: "PUBLIC_BETA_BLOCKED" | "PRIVATE_BETA_POSSIBLE";
    color: string;
    borderColor: string;
    icon: typeof CheckCircle2;
    justification: string;
    nextAction: string;
    billingGatePassed?: boolean;
  };

  let decision: Decision;

  if (full >= 1) {
    // full_proof_events >= 1 → billing gate passé côté Payments.
    // MAIS : ce bloc ne peut pas connaître l'état des capabilities (stripeCustomerPortal, etc.)
    // → verdict ici = PRIVATE_BETA_POSSIBLE (billing OK, verdict global = Control Plane)
    // PRIVATE_BETA_READY ne peut venir que de computeReleaseGate() via useControlPlane.
    decision = {
      verdict: "PRIVATE_BETA_POSSIBLE",
      color: "text-success",
      borderColor: "border-success/30 bg-success/5",
      icon: CheckCircle2,
      justification:
        `${full} preuve(s) E2E complète(s). Quota: ${summary.quota_used_slots ?? "?"}/${summary.quota_total_slots ?? "?"} slots. ` +
        `Billing gate passé — verdict global dépend du Control Plane.`,
      nextAction:
        "→ /admin/overview → ReleaseGateBanner pour le verdict global (PRIVATE_BETA_READY si 0 bloquant critique).",
      billingGatePassed: true,
    };
  } else if (broken > 0) {
    decision = {
      verdict: "PUBLIC_BETA_BLOCKED",
      color: "text-destructive",
      borderColor: "border-destructive/30 bg-destructive/5",
      icon: ShieldX,
      justification:
        `${broken} événement(s) sans corrélation. ${total} events total, 0 full_proof. Flux paiement cassé.`,
      nextAction: "Inspecter les anomalies ci-dessous. Vérifier logs stripe-webhook edge fn.",
    };
  } else if (checkouts > 0 && full === 0) {
    decision = {
      verdict: "PRIVATE_BETA_POSSIBLE",
      color: "text-warning",
      borderColor: "border-warning/30 bg-warning/5",
      icon: AlertTriangle,
      justification:
        `${checkouts} checkout(s), ${partial} partiel(s), 0 full_proof. Quota non consommé ou corrélation incomplète.`,
      nextAction:
        "Vérifier offer_type=launch dans metadata Stripe. Table launch_quota_consumed.",
    };
  } else if (total > 0 && checkouts === 0) {
    decision = {
      verdict: "PRIVATE_BETA_POSSIBLE",
      color: "text-warning",
      borderColor: "border-warning/30 bg-warning/5",
      icon: AlertTriangle,
      justification:
        `${total} event(s) billing, 0 checkout.session.completed. Webhooks reçus, achat non finalisé.`,
      nextAction: "Checkout complet sur /pricing avec carte test 4242 4242 4242 4242.",
    };
  } else {
    decision = {
      verdict: "PUBLIC_BETA_BLOCKED",
      color: "text-muted-foreground",
      borderColor: "border-border bg-muted/20",
      icon: AlertCircle,
      justification:
        "0 événement billing observé. Flux revenu jamais exercé. Architecture CODE_READY uniquement.",
      nextAction:
        "Configurer STRIPE_WEBHOOK_SECRET → scripts/verify-stripe-webhook.sh → checkout /pricing.",
    };
  }

  const DecisionIcon = decision.icon;

  return (
    <div className={`rounded-xl border-2 p-4 ${decision.borderColor}`}>
      <div className="flex items-start gap-3">
        <DecisionIcon size={16} className={`${decision.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-xs font-bold text-foreground">Décision release suggérée</p>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${decision.borderColor} ${decision.color}`}>
              {decision.verdict}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">{decision.justification}</p>
          <p className="text-xs text-foreground font-medium">→ {decision.nextAction}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function BillingProofPanel() {
  const [rows, setRows] = useState<BillingProofRow[]>([]);
  const [summary, setSummary] = useState<BillingProofSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [chainRes, summaryRes] = await Promise.all([
        db.rpc("get_billing_proof_chain", { p_limit: 50 }),
        db.rpc("get_billing_proof_summary"),
      ]);

      if (chainRes.error) throw chainRes.error;
      if (summaryRes.error) throw summaryRes.error;

      setRows(chainRes.data ?? []);
      setSummary(summaryRes.data ?? null);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <CreditCard size={14} className="text-primary" />
            Billing Proof Chain
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Corrélation transactionnelle checkout → webhook → quota. Source: RPC admin sécurisée.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <XCircle size={13} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p className="mt-0.5 text-destructive/80">{error}</p>
            <p className="mt-1 text-muted-foreground">Accès admin requis. Vérifier que votre compte a le rôle admin.</p>
          </div>
        </div>
      )}

      {/* ── PREMIER EURO PROUVÉ — Hero Block (impossible à manquer) ── */}
      <PremierEuroBlock summary={summary} rows={rows} loading={loading} />

      {/* Banner secondary */}
      <BillingProofBanner summary={summary} loading={loading} />

      {/* ── DÉCISION RELEASE SUGGÉRÉE — bloc contextuel post-test ── */}
      <ReleaseDecisionBlock summary={summary} loading={loading} />

      {/* 2-col layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Correlation table — 2/3 */}
        <div className="lg:col-span-2 card-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Événements corrélés</h3>
          </div>
          <BillingCorrelationTable rows={rows} loading={loading} />
        </div>

        {/* Right column: failures + runbook */}
        <div className="space-y-4">
          <div className="card-surface p-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Anomalies détectées</h3>
            <BillingFailurePanel rows={rows} />
          </div>
          <div className="card-surface p-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Actions & Runbook</h3>
            <BillingRunbookPanel summary={summary} />
          </div>
        </div>
      </div>

      {lastRefresh && (
        <p className="text-xs text-muted-foreground text-right">
          Dernière lecture: {lastRefresh.toLocaleTimeString("fr")}
        </p>
      )}
    </div>
  );
}
