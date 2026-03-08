/**
 * Admin Analytics — PROOF:ANALYTICS_RUNTIME_V1:admin_reads_real_data
 * Reads from:
 *   - analytics_events (cta_click, checkout_start, checkout_success, landing_view, etc.)
 *   - profiles, missions, introductions, gains (structural counts, unchanged)
 * NO hardcoded metrics. NO "not_measured" for branchable events.
 */
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { TrendingUp, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AnalyticMetric = {
  label: string;
  value: number | null;
  status: "observed" | "not_measured" | "env_dependent";
  source: string;
  note?: string;
};

type FunnelStep = {
  label: string;
  value: number | null;
  status: "observed" | "not_measured";
};

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  observed:      { label: "observé",           cls: "bg-success/10 text-success" },
  not_measured:  { label: "non mesuré",        cls: "bg-muted text-muted-foreground" },
  env_dependent: { label: "dépend du config",  cls: "bg-warning/10 text-warning" },
};

async function countEvent(eventType: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase.from("analytics_events") as any)
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType);
  return (count as number | null) ?? 0;
}

export default function AdminAnalytics() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [events, setEvents] = useState<AnalyticMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // ── Structural DB counts ─────────────────────────────────────────────
      const [
        { count: signups },
        { count: onboardings },
        { count: missions },
        { count: offers },
        { count: introsTotal },
        { count: introsValidees },
        { count: gainsValides },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_done", true),
        supabase.from("missions").select("*", { count: "exact", head: true }),
        supabase.from("offers").select("*", { count: "exact", head: true }),
        supabase.from("introductions").select("*", { count: "exact", head: true }),
        supabase.from("introductions").select("*", { count: "exact", head: true }).eq("statut", "validee"),
        supabase.from("gains").select("*", { count: "exact", head: true }).in("statut", ["valide", "recu"]),
      ]);

      // ── analytics_events counts (PROOF:ANALYTICS_RUNTIME_V1:admin_reads_real_data) ──
      const [
        landingViews,
        ctaClicks,
        pricingViews,
        checkoutStarts,
        checkoutSuccesses,
        onboardingDoneEvents,
        missionCreatedEvents,
        introSubmittedEvents,
        introValidatedEvents,
      ] = await Promise.all([
        countEvent("landing_view"),
        countEvent("cta_click"),
        countEvent("pricing_view"),
        countEvent("checkout_start"),
        countEvent("checkout_success"),
        countEvent("onboarding_done"),
        countEvent("mission_created"),
        countEvent("intro_submitted"),
        countEvent("intro_validated"),
      ]);

      // ── Reactivation jobs pending ─────────────────────────────────────────
      const { count: reactivationPending } = await supabase
        .from("reactivation_jobs" as "profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // ── Funnel (signup→gain) ──────────────────────────────────────────────
      // Note: landing_view comes from analytics_events. Others from DB structure.
      setFunnel([
        { label: "Vues landing (tracked)",     value: landingViews,           status: "observed" },
        { label: "Inscriptions (signup)",       value: signups ?? 0,           status: "observed" },
        { label: "Onboarding terminé",          value: onboardings ?? 0,       status: "observed" },
        { label: "Mission créée",              value: missions ?? 0,           status: "observed" },
        { label: "Intro soumise",              value: introsTotal ?? 0,        status: "observed" },
        { label: "Intro validée",              value: introsValidees ?? 0,     status: "observed" },
        { label: "Gain validé",               value: gainsValides ?? 0,       status: "observed" },
      ]);

      // ── Events grid ───────────────────────────────────────────────────────
      setEvents([
        // analytics_events tracked
        { label: "Vues landing",              value: landingViews,            status: "observed",      source: "analytics_events" },
        { label: "Clics CTA",                 value: ctaClicks,               status: "observed",      source: "analytics_events" },
        { label: "Vues pricing",              value: pricingViews,            status: "observed",      source: "analytics_events" },
        { label: "Starts checkout",           value: checkoutStarts,          status: "observed",      source: "analytics_events" },
        { label: "Succès checkout",           value: checkoutSuccesses,       status: "observed",      source: "analytics_events" },
        { label: "Onboarding done (events)",  value: onboardingDoneEvents,    status: "observed",      source: "analytics_events" },
        { label: "Mission créées (events)",   value: missionCreatedEvents,    status: "observed",      source: "analytics_events" },
        { label: "Intros soumises (events)",  value: introSubmittedEvents,    status: "observed",      source: "analytics_events" },
        { label: "Intros validées (events)",  value: introValidatedEvents,    status: "observed",      source: "analytics_events" },
        // DB structure counts (always real)
        { label: "Inscriptions totales (DB)", value: signups ?? 0,           status: "observed",      source: "profiles" },
        { label: "Onboardings terminés (DB)", value: onboardings ?? 0,       status: "observed",      source: "profiles" },
        { label: "Missions créées (DB)",      value: missions ?? 0,          status: "observed",      source: "missions" },
        { label: "Offres publiées (DB)",       value: offers ?? 0,           status: "observed",      source: "offers" },
        { label: "Intros totales (DB)",        value: introsTotal ?? 0,       status: "observed",      source: "introductions" },
        { label: "Intros validées (DB)",       value: introsValidees ?? 0,    status: "observed",      source: "introductions" },
        { label: "Gains validés (DB)",         value: gainsValides ?? 0,      status: "observed",      source: "gains" },
        { label: "Jobs réactivation pending", value: reactivationPending ?? 0, status: "observed",    source: "reactivation_jobs" },
        // Honestly unmeasured
        { label: "Taux abandon checkout",     value: null, status: "not_measured", source: "—", note: "Nécessite tracker cross-session" },
        { label: "Paiements Stripe realtime", value: null, status: "env_dependent", source: "—", note: "Nécessite STRIPE_WEBHOOK_SECRET configuré" },
      ]);

      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const maxFunnel = funnel.reduce((m, s) => Math.max(m, s.value ?? 0), 1);

  // Conversion rates (only if data exists)
  const signupToOnboarding = funnel[1]?.value && funnel[2]?.value
    ? Math.round((funnel[2].value / funnel[1].value) * 100)
    : null;
  const checkoutConversion = events.find(e => e.label === "Starts checkout")?.value &&
    events.find(e => e.label === "Succès checkout")?.value
    ? Math.round(
        ((events.find(e => e.label === "Succès checkout")!.value!) /
          (events.find(e => e.label === "Starts checkout")!.value!)) * 100
      )
    : null;

  return (
    <AdminLayout title="Analytics" subtitle="Données réelles — analytics_events + DB structurelle">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUS_CHIP).map(([k, v]) => (
            <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${v.cls}`}>
              {k === "observed" ? <Eye size={11} /> : <EyeOff size={11} />}
              {v.label}
            </span>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastRefresh ? `Mis à jour ${lastRefresh.toLocaleTimeString("fr")}` : "Actualiser"}
        </button>
      </div>

      {/* Conversion summary */}
      {!loading && (signupToOnboarding !== null || checkoutConversion !== null) && (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {signupToOnboarding !== null && (
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-primary">{signupToOnboarding}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taux signup → onboarding terminé</p>
            </div>
          )}
          {checkoutConversion !== null && (
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-success">{checkoutConversion}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taux checkout start → succès</p>
            </div>
          )}
        </div>
      )}

      {/* Funnel */}
      <div className="card-surface p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-1">Funnel activation</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Vues landing depuis <code>analytics_events</code> · reste depuis tables structurelles DB
        </p>
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {funnel.map((step) => {
              const chip = STATUS_CHIP[step.status];
              const pct = step.value != null && maxFunnel > 0 ? Math.round((step.value / maxFunnel) * 100) : 0;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{step.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chip.cls}`}>{chip.label}</span>
                    </div>
                    <span className="font-bold text-foreground">
                      {step.value != null ? step.value.toLocaleString("fr") : "—"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    {step.value != null ? (
                      <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    ) : (
                      <div className="h-full w-full bg-muted-foreground/20 rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Events grid */}
      <div>
        <h2 className="font-semibold text-foreground mb-1">Métriques événements</h2>
        <p className="text-xs text-muted-foreground mb-4">Source indiquée par métrique</p>
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map(({ label, value, status, source, note }) => {
              const chip = STATUS_CHIP[status];
              return (
                <div key={label} className="stat-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="font-display text-xl font-bold text-foreground mt-0.5">
                        {value != null ? value.toLocaleString("fr") : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono truncate">{source}</p>
                      {note && <p className="text-xs text-muted-foreground mt-1 leading-tight">{note}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${chip.cls}`}>
                      {chip.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <TrendingUp size={13} /> Ce qui reste non mesuré (honnêteté)
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Taux d'abandon checkout — observable uniquement avec tracker cross-session</li>
          <li>Paiements Stripe realtime — nécessite webhook <code>STRIPE_WEBHOOK_SECRET</code></li>
          <li>Trafic landing provenant de sources externes non WIINUP (bots, crawlers) — non filtré</li>
        </ul>
      </div>
    </AdminLayout>
  );
}
