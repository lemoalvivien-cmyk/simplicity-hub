// PROOF:CONTROL_PLANE_V2:golive_honest_no_fake_ready
/**
 * GoLive — Vérité honnête, aucun secret marqué "ready" côté client
 */
import AdminLayout from "@/components/layout/AdminLayout";
import { BUILD_INFO } from "@/lib/buildInfo";
import { PRICING } from "@/lib/pricingConfig";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Info, Zap, CreditCard, Server } from "lucide-react";
import { Link } from "react-router-dom";

type ReadinessStatus = "ready" | "partial" | "external-config" | "manual-required" | "not-ready";

interface ReadinessItem {
  label: string;
  status: ReadinessStatus;
  note: string;
}

// RÈGLE: jamais "ready" pour un secret cloud côté client
const BRICKS: ReadinessItem[] = [
  { label: "Auth email/password", status: "ready", note: "Supabase Auth + ProtectedRoute + RLS opérationnels — PROUVÉ PAR LE CODE" },
  { label: "Rôles (user_roles table)", status: "ready", note: "has_role() SECURITY DEFINER — PROUVÉ PAR LE CODE" },
  { label: "Checkout Stripe", status: "partial", note: `create-checkout fn déployée. STRIPE_SECRET_KEY: config externe requise. Flux E2E NON EXERCÉ.` },
  { label: "Webhook Stripe", status: "external-config", note: "stripe-webhook fn déployée. STRIPE_WEBHOOK_SECRET: config cloud requise — NON VÉRIFIABLE CÔTÉ CLIENT. Flux E2E non prouvé." },
  { label: "check-subscription", status: "ready", note: "Edge fn déployée — PROUVÉ PAR LE CODE" },
  { label: "Customer Portal Stripe", status: "manual-required", note: "customer-portal fn déployée. BLOQUÉ: activation manuelle dans Stripe Dashboard → Billing → Customer Portal requise." },
  { label: "Codes promo (redeem-promo)", status: "ready", note: "Edge fn + table promo_codes — PROUVÉ PAR LE CODE" },
  { label: "Quota lancement (100 slots)", status: "ready", note: "launch_quota table + RPC atomique — PROUVÉ PAR RUNTIME" },
  { label: "Missions → Introductions → Gains", status: "ready", note: "Flux complet avec triggers SQL + trust engine — PROUVÉ PAR LE CODE" },
  { label: "pg_cron OpenClaw Scheduler", status: "partial", note: "openclaw-scheduler configuré et observé (jobid 4, */5min). Crons reactivation+payout NON créés." },
  { label: "pg_cron Réactivation", status: "manual-required", note: "Script SQL disponible dans supabase/infra/scheduled-jobs.md — NON EXÉCUTÉ EN BASE." },
  { label: "pg_cron Payout", status: "manual-required", note: "Script SQL disponible dans supabase/infra/scheduled-jobs.md — NON EXÉCUTÉ EN BASE." },
  { label: "Email réactivation (Resend)", status: "external-config", note: "send-reactivation-email fn déployée. RESEND_API_KEY: config externe — NON VÉRIFIABLE CÔTÉ CLIENT. Livraison email non testée." },
  { label: "OpenClaw Gateway externe", status: "external-config", note: "Edge fn déployée. gateway_url + gateway_secret requis par utilisateur — config externe." },
  { label: "PWA installable", status: "ready", note: "vite-plugin-pwa + manifest — PROUVÉ PAR LE CODE" },
  { label: "Domaine canonique", status: "external-config", note: "DNS wiinupmax.com — non vérifiable depuis Lovable. Vérifier Project Settings → Domains." },
];

const PRE_LAUNCH_CHECKLIST = [
  { done: true,  item: "Edge functions déployées" },
  { done: true,  item: "Codes promo créés (304)" },
  { done: true,  item: "Quota lancement configuré (100 slots)" },
  { done: true,  item: "RLS activé sur tables critiques" },
  { done: false, item: "Vérifier STRIPE_WEBHOOK_SECRET dans Cloud secrets" },
  { done: false, item: "Vérifier STRIPE_SECRET_KEY dans Cloud secrets" },
  { done: false, item: "Activer Customer Portal Stripe Dashboard" },
  { done: false, item: "Tester checkout end-to-end avec carte 4242" },
  { done: false, item: "Créer crons pg_cron (scripts dans scheduled-jobs.md)" },
  { done: false, item: "Vérifier RESEND_API_KEY + tester email réactivation" },
  { done: false, item: "Confirmer domaine canonique dans Settings → Domains" },
];

const statusIcon = (s: ReadinessStatus) => {
  if (s === "ready") return <CheckCircle2 size={15} className="text-success shrink-0" />;
  if (s === "partial") return <AlertTriangle size={15} className="text-warning shrink-0" />;
  if (s === "external-config") return <Clock size={15} className="text-accent shrink-0" />;
  if (s === "manual-required") return <AlertTriangle size={15} className="text-destructive shrink-0" />;
  return <XCircle size={15} className="text-destructive shrink-0" />;
};

const statusBadge = (s: ReadinessStatus) => {
  const map: Record<ReadinessStatus, string> = {
    ready:             "badge-success",
    partial:           "badge-warning",
    "external-config": "badge-muted",
    "manual-required": "bg-destructive/10 text-destructive text-xs font-medium px-2 py-0.5 rounded-full",
    "not-ready":       "bg-destructive/10 text-destructive text-xs font-medium px-2 py-0.5 rounded-full",
  };
  const labels: Record<ReadinessStatus, string> = {
    ready:             "Prêt",
    partial:           "Partiel",
    "external-config": "Config externe",
    "manual-required": "Étape manuelle",
    "not-ready":       "Bloquant",
  };
  return <span className={map[s]}>{labels[s]}</span>;
};

export default function AdminGoLive() {
  const readyCount = BRICKS.filter(b => b.status === "ready").length;
  const partialCount = BRICKS.filter(b => b.status === "partial").length;
  const externalCount = BRICKS.filter(b => b.status === "external-config").length;
  const manualCount = BRICKS.filter(b => b.status === "manual-required").length;
  const checksDone = PRE_LAUNCH_CHECKLIST.filter(c => c.done).length;

  return (
    <AdminLayout title="Go-Live Readiness" subtitle="Lecture honnête — secrets cloud jamais marqués 'ready' côté client.">
      <div className="space-y-8">

        <div className="p-3 rounded-xl bg-warning/8 border border-warning/20 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">⚠ Règle absolue: </span>
          Les secrets cloud (STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, RESEND_API_KEY) ne peuvent pas être vérifiés
          depuis le client. Ils sont marqués <span className="font-mono font-bold">external-config</span>, jamais ready.
          La source de vérité est{" "}
          <Link to="/admin" className="text-primary underline">le Control Plane → Capability Matrix</Link>.
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Build Identity</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Build ID</p>
              <p className="font-mono font-bold text-foreground">{BUILD_INFO.build_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Version</p>
              <p className="font-mono text-foreground">{BUILD_INFO.app_version}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Environnement</p>
              <p className="font-mono text-foreground">{BUILD_INFO.environment}</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { val: readyCount,    label: "Prêts",           cls: "text-success" },
            { val: partialCount,  label: "Partiels",        cls: "text-warning" },
            { val: externalCount, label: "Config externe",  cls: "text-accent" },
            { val: manualCount,   label: "Étape manuelle",  cls: "text-destructive" },
          ].map(({ val, label, cls }) => (
            <div key={label} className="stat-card text-center">
              <p className={`font-display text-3xl font-bold ${cls}`}>{val}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Checklist pré-lancement</h2>
            <span className="text-xs text-muted-foreground">{checksDone}/{PRE_LAUNCH_CHECKLIST.length} faits</span>
          </div>
          <div className="card-surface overflow-hidden">
            {PRE_LAUNCH_CHECKLIST.map(({ done, item }) => (
              <div key={item} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                {done ? <CheckCircle2 size={15} className="text-success shrink-0" /> : <XCircle size={15} className="text-destructive shrink-0" />}
                <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{item}</span>
                {!done && <span className="ml-auto badge-warning text-xs">À faire</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-4">État par brique</h2>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">Brique</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {BRICKS.map(({ label, status, note }) => (
                    <tr key={label} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {statusIcon(status)}
                          <span className="font-medium text-foreground">{label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(status)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-4">Cohérence pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { offer: PRICING.launch,   label: "Offre lancement", color: "text-primary" },
              { offer: PRICING.standard, label: "Standard",        color: "text-accent" },
            ].map(({ offer, label, color }) => (
              <div key={label} className="card-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={15} className={color} />
                  <span className="font-medium text-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-display">{offer.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{offer.price_id}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-foreground mb-4">À surveiller — 7 premiers jours</h2>
          <div className="card-surface p-5">
            <ul className="space-y-2">
              {[
                "Taux de signup → onboarding (objectif : > 70%)",
                "Premier checkout Stripe réel — vérifier stripe-webhook logs",
                "Quota lancement consommé (alert si > 80 slots)",
                "Premières introductions soumises",
                "Scheduler — premiers jobs exécutés",
                "Erreurs edge functions (logs Cloud)",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Server size={13} className="text-primary mt-1 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Info size={13} className="text-primary" />
            <span className="font-semibold text-foreground">Source de vérité:</span>
          </div>
          <p>Pour une analyse runtime en temps réel avec preuves horodatées, utiliser le{" "}
            <Link to="/admin" className="text-primary underline">Control Plane → Capability Matrix</Link>.
            Cette page liste uniquement les briques — le Control Plane calcule leur état réel.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
