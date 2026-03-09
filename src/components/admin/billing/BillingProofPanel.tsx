// PROOF:BILLING_PROOF_CHAIN_V1:billing_proof_panel
/**
 * BillingProofPanel — Surface admin billing proof chain
 *
 * Répond en < 10 secondes à la question :
 * "Ce paiement a-t-il été encaissé, vérifié, enregistré, corrélé,
 *  puis a-t-il réellement activé le quota / entitlement attendu ?"
 *
 * Source de vérité : RPC get_billing_proof_chain + get_billing_proof_summary
 * JAMAIS de blob JSON opaque affiché directement.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  CreditCard, Zap, ExternalLink, Info, ShieldCheck, ShieldX,
  BarChart2,
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
    case "consumed":    return { label: "Slot consommé ✓",      cls: "badge-success" };
    case "not_consumed": return { label: "Slot NON consommé ⚠",  cls: "bg-warning/10 text-warning inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" };
    case "not_applicable": return { label: "N/A (standard)",     cls: "badge-muted" };
    case "no_subscription_id": return { label: "Pas de sub ID",  cls: "badge-muted" };
    default: return { label: status,                              cls: "badge-muted" };
  }
}

function syncStatusConfig(status: string) {
  switch (status) {
    case "synced":  return { label: "Synced ✓",    cls: "badge-success" };
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
  } else if (hasBroken) {
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
            Ces événements n'ont pas de stripe_event_id ou sont des webhooks sans corrélation.
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

  return (
    <div className="space-y-3">
      {/* Action 1: Prioritaire */}
      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
              <Zap size={12} className="text-primary" />
              {noEvents ? "ACTION CRITIQUE : Exercer le webhook Stripe" : noFullProof ? "ACTION : Tester un checkout complet" : "Monitoring : Surveiller les preuves complètes"}
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

      {/* Classification */}
      <div className="p-3 rounded-xl border border-border bg-muted/20">
        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <BarChart2 size={12} /> Classification des preuves billing
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
    <div className="space-y-6">
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

      {/* Banner */}
      <BillingProofBanner summary={summary} loading={loading} />

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
