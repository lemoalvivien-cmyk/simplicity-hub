import AdminLayout from "@/components/layout/AdminLayout";
import { BUILD_INFO, FEATURE_FLAGS } from "@/lib/buildInfo";
import { PRICING } from "@/lib/pricingConfig";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Globe, CreditCard,
  Tag, Database, Server, Settings, Info
} from "lucide-react";

type ReadinessStatus = "ready" | "partial" | "env-dep" | "not-ready";

interface ReadinessItem {
  label: string;
  status: ReadinessStatus;
  note: string;
}

const BRICKS: ReadinessItem[] = [
  // Auth
  { label: "Auth email/password", status: "ready", note: "Supabase Auth + ProtectedRoute + RLS opérationnels" },
  { label: "Rôles (entreprise / facilitateur / admin)", status: "ready", note: "Stockés dans profiles.role, vérifiés côté serveur" },
  { label: "Onboarding obligatoire", status: "ready", note: "Redirect auto si onboarding_done = false" },

  // Billing
  { label: "Checkout Stripe (lancement 99 €)", status: "ready", note: `price_id: ${PRICING.launch.price_id} — edge fn create-checkout opérationnel` },
  { label: "Checkout Stripe (standard 490 €)", status: "ready", note: `price_id: ${PRICING.standard.price_id} — même edge fn, paramétrable` },
  { label: "Webhook Stripe", status: "ready", note: "stripe-webhook edge fn déployé — vérifie la signature si STRIPE_WEBHOOK_SECRET est configuré" },
  { label: "check-subscription", status: "ready", note: "Edge fn déployée — consultée au login + toutes les 5 min" },
  { label: "customer-portal", status: "ready", note: "Edge fn déployée — nécessite activation du Customer Portal dans Stripe Dashboard" },

  // Promo
  { label: "Système codes promo (redeem-promo)", status: "ready", note: "Edge fn + table promo_codes — 304 codes créés en DB" },
  { label: "Quota lancement (100 slots)", status: "ready", note: "table launch_quota — compteur lu en temps réel sur la landing" },

  // Core flows
  { label: "Missions → Introductions → Gains", status: "ready", note: "Flux complet avec triggers SQL + trust engine" },
  { label: "Passive OS (offres, liens, clics)", status: "ready", note: "shared_offers + offer_share_links + link_events — dépend de la data utilisateur" },
  { label: "Graph engine (edges, best path)", status: "ready", note: "DB + edge fn openclaw-graph-engine — se peuple à l'usage" },
  { label: "Trust engine (scores, litiges)", status: "ready", note: "trust_scores + disputes + triggers automatiques" },

  // OpenClaw
  { label: "Scheduler autonome (pg_cron)", status: "partial", note: "Edge fn openclaw-scheduler + cron tick configuré et observé (jobid 4). Jobs reactivation/payout : scripts disponibles dans supabase/infra/scheduled-jobs.md, PAS encore créés en base." },
  { label: "Job executor", status: "ready", note: "openclaw-job-executor + claim_next_job() avec verrouillage atomique" },
  { label: "Event bus (bus d'événements)", status: "ready", note: "openclaw-event-bus + triggers DB sur 5 tables" },
  { label: "Channel actions / dispatch", status: "ready", note: "openclaw-channel-dispatch — email + introduction opérationnels" },
  { label: "Kill switch global", status: "ready", note: "openclaw-kill-switch edge fn + kill_switch_global table" },
  { label: "Gateway OpenClaw externe", status: "env-dep", note: "Edge fn déployée — nécessite gateway_url + gateway_secret configurés par l'utilisateur" },

  // Admin
  { label: "Admin Overview", status: "ready", note: "/admin — données statiques (à remplacer par données réelles post-lancement)" },
  { label: "Admin Revenue", status: "ready", note: "/admin/revenue — données réelles depuis la DB" },
  { label: "Admin Users", status: "partial", note: "/admin/users — UI présente, données statiques (mock)" },
  { label: "Admin Payments", status: "partial", note: "/admin/payments — UI présente, données statiques (mock)" },
  { label: "Admin Promo codes", status: "ready", note: "/admin/promo-codes" },

  // PWA / Mobile
  { label: "PWA installable", status: "ready", note: "vite-plugin-pwa + manifest + /install" },
  { label: "Responsive mobile", status: "partial", note: "Nav mobile OK — certaines vues denses non optimisées mobile" },

  // Externals
  { label: "ElevenLabs voice (VoiceWelcome)", status: "env-dep", note: "ELEVENLABS_API_KEY configurée — nécessite connexion active ElevenLabs" },
  { label: "Stripe WEBHOOK_SECRET", status: "env-dep", note: "Optionnel mais recommandé en production — si absent, signature non vérifiée" },
];

const KNOWN_LIMITATIONS = [
  { item: "Admin Users / Payments", note: "Données statiques (mock). À connecter à la DB après premiers vrais utilisateurs." },
  { item: "Admin Overview stats", note: "Chiffres affichés sont hardcodés. Utiliser /admin/revenue pour les vraies métriques." },
  { item: "Gateway OpenClaw", note: "Nécessite une instance OpenClaw auto-hébergée par l'utilisateur. Pas de gateway centralisé." },
  { item: "Scheduler cron", note: "pg_cron configuré mais non encore observé — DB vide au lancement. Activé dès 1er utilisateur." },
  { item: "NetworkValueMap passive", note: "Requiert CSV bien renseigné (secteur/zone/langue) pour être précis." },
  { item: "WhatsApp / LinkedIn channels", note: "Préparation du message OK — envoi réel nécessite gateway ou API externe." },
  { item: "Webhook Stripe signature", note: "STRIPE_WEBHOOK_SECRET non configuré → pas de vérification de signature (risque en prod)." },
  { item: "Mobile — vues denses", note: "WarRoom, Operations, DashboardEntreprise : lisibles mais non optimisées tactile." },
  { item: "Analytics landing (funnel)", note: "Données simulées dans /admin/analytics. Tracking réel à connecter post-lancement." },
];

const PRE_LAUNCH_CHECKLIST = [
  { done: true, item: "Configurer STRIPE_SECRET_KEY en secret Supabase" },
  { done: true, item: "Déployer toutes les edge functions" },
  { done: true, item: "Configurer pg_cron + pg_net pour le scheduler" },
  { done: true, item: "Créer les codes promo (304 créés)" },
  { done: true, item: "Vérifier quota lancement (100 slots)" },
  { done: true, item: "RLS activé sur toutes les tables critiques" },
  { done: false, item: "Configurer STRIPE_WEBHOOK_SECRET pour sécuriser le webhook" },
  { done: false, item: "Activer le Customer Portal Stripe (pour manage subscription)" },
  { done: false, item: "Tester un vrai checkout end-to-end avec carte de test Stripe" },
  { done: false, item: "Tester redeem-promo avec un code réel" },
  { done: false, item: "Configurer le domaine email custom (auth emails)" },
  { done: false, item: "Connecter un outil d'analytics réel (Plausible, PostHog...)" },
];

const WATCH_FIRST_7_DAYS = [
  "Taux de signup → onboarding (objectif : > 70%)",
  "Taux de conversion signup → payant ou promo",
  "Premier checkout Stripe réel — vérifier stripe-webhook",
  "Quota lancement consommé (alert si > 80 slots)",
  "Premiers clics sur liens passifs",
  "Première introduction soumise",
  "Scheduler — premiers jobs exécutés",
  "Erreurs edge functions (logs Supabase)",
];

const statusIcon = (s: ReadinessStatus) => {
  if (s === "ready") return <CheckCircle2 size={15} className="text-success shrink-0" />;
  if (s === "partial") return <AlertTriangle size={15} className="text-warning shrink-0" />;
  if (s === "env-dep") return <Clock size={15} className="text-accent shrink-0" />;
  return <XCircle size={15} className="text-destructive shrink-0" />;
};

const statusBadge = (s: ReadinessStatus) => {
  const map: Record<ReadinessStatus, string> = {
    ready: "badge-success",
    partial: "badge-warning",
    "env-dep": "badge-muted",
    "not-ready": "bg-destructive/10 text-destructive text-xs font-medium px-2 py-0.5 rounded-full",
  };
  const labels: Record<ReadinessStatus, string> = {
    ready: "Prêt",
    partial: "Partiel",
    "env-dep": "Config requise",
    "not-ready": "Bloquant",
  };
  return <span className={map[s]}>{labels[s]}</span>;
};

export default function AdminGoLive() {
  const readyCount = BRICKS.filter(b => b.status === "ready").length;
  const partialCount = BRICKS.filter(b => b.status === "partial").length;
  const envDepCount = BRICKS.filter(b => b.status === "env-dep").length;

  const checksDone = PRE_LAUNCH_CHECKLIST.filter(c => c.done).length;

  return (
    <AdminLayout
      title="Go-Live Readiness"
      subtitle="Lecture froide et honnête de l'état réel du produit avant lancement."
    >
      <div className="space-y-8">
        {/* Build ID */}
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

        {/* Résumé readiness */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <p className="font-display text-3xl font-bold text-success">{readyCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Briques prêtes</p>
          </div>
          <div className="stat-card text-center">
            <p className="font-display text-3xl font-bold text-warning">{partialCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Partiellement prêtes</p>
          </div>
          <div className="stat-card text-center">
            <p className="font-display text-3xl font-bold text-muted-foreground">{envDepCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Dépendent de la configuration</p>
          </div>
        </div>

        {/* Checklist pré-lancement */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Checklist pré-lancement</h2>
            <span className="text-xs text-muted-foreground">{checksDone} / {PRE_LAUNCH_CHECKLIST.length} faits</span>
          </div>
          <div className="card-surface overflow-hidden">
            {PRE_LAUNCH_CHECKLIST.map(({ done, item }) => (
              <div key={item} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                {done
                  ? <CheckCircle2 size={15} className="text-success shrink-0" />
                  : <XCircle size={15} className="text-destructive shrink-0" />
                }
                <span className={`text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{item}</span>
                {!done && <span className="ml-auto badge-warning">À faire</span>}
              </div>
            ))}
          </div>
        </div>

        {/* État des briques */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">État par brique</h2>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Brique</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Note</th>
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

        {/* Limitations honnêtes */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Limitations honnêtes</h2>
          <div className="card-surface overflow-hidden">
            {KNOWN_LIMITATIONS.map(({ item, note }) => (
              <div key={item} className="flex items-start gap-3 px-5 py-3 border-b border-border last:border-0">
                <Info size={14} className="text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surveiller les 7 premiers jours */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">À surveiller — 7 premiers jours</h2>
          <div className="card-surface p-5">
            <ul className="space-y-2">
              {WATCH_FIRST_7_DAYS.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Server size={13} className="text-primary mt-1 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Cohérence pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="card-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={15} className="text-primary" />
                <span className="font-medium text-foreground">Offre lancement</span>
                <CheckCircle2 size={13} className="text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{PRICING.launch.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{PRICING.launch.description}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{PRICING.launch.price_id}</p>
              <p className="text-xs text-muted-foreground mt-1">Quota : {PRICING.launch.slots} slots</p>
            </div>
            <div className="card-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={15} className="text-accent" />
                <span className="font-medium text-foreground">Standard</span>
                <CheckCircle2 size={13} className="text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground font-display">{PRICING.standard.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{PRICING.standard.description}</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{PRICING.standard.price_id}</p>
            </div>
          </div>
        </div>

        {/* Feature flags summary */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Feature manifest (extrait)</h2>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">Feature</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">État</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(FEATURE_FLAGS) as [string, { state: string; note: string }][]).map(([key, { state, note }]) => (
                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{key}</td>
                      <td className="px-4 py-2.5">
                        <span className={
                          state === "live" ? "badge-success"
                          : state === "env-dep" ? "badge-muted"
                          : "badge-warning"
                        }>{state}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
