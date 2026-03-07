import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { TrendingUp, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Metric = {
  label: string;
  value: number | null;
  status: "observed" | "not_measured" | "env_dependent";
  note?: string;
};

type FunnelStep = {
  label: string;
  value: number | null;
  status: "observed" | "not_measured";
};

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  observed:      { label: "observé",       cls: "bg-success/10 text-success" },
  not_measured:  { label: "non mesuré",    cls: "bg-muted text-muted-foreground" },
  env_dependent: { label: "dépend du config", cls: "bg-warning/10 text-warning" },
};

export default function AdminAnalytics() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [events, setEvents] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          { count: signups },
          { count: onboardings },
          { count: missions },
          { count: offers },
          { count: introsTotal },
          { count: introsValidees },
          { count: gainsValides },
          { count: jobs },
          { count: channelActions },
          { count: linkClicks },
          { count: opportunities },
          { count: deliveries },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_done", true),
          supabase.from("missions").select("*", { count: "exact", head: true }),
          supabase.from("offers").select("*", { count: "exact", head: true }),
          supabase.from("introductions").select("*", { count: "exact", head: true }),
          supabase.from("introductions").select("*", { count: "exact", head: true }).eq("statut", "validee"),
          supabase.from("gains").select("*", { count: "exact", head: true }).in("statut", ["valide", "recu"]),
          supabase.from("openclaw_job_executions" as "profiles").select("*", { count: "exact", head: true }),
          supabase.from("openclaw_channel_actions").select("*", { count: "exact", head: true }),
          supabase.from("link_events").select("*", { count: "exact", head: true }),
          supabase.from("opportunities" as "profiles").select("*", { count: "exact", head: true }),
          supabase.from("openclaw_channel_deliveries").select("*", { count: "exact", head: true }),
        ]);

        setFunnel([
          { label: "Visiteurs landing",        value: null,              status: "not_measured" },
          { label: "Inscriptions (signup)",     value: signups ?? 0,     status: "observed" },
          { label: "Onboarding terminé",        value: onboardings ?? 0, status: "observed" },
          { label: "Mission créée",             value: missions ?? 0,    status: "observed" },
          { label: "Intro soumise",             value: introsTotal ?? 0, status: "observed" },
          { label: "Intro validée",             value: introsValidees ?? 0, status: "observed" },
          { label: "Gain validé",               value: gainsValides ?? 0, status: "observed" },
        ]);

        setEvents([
          { label: "Inscriptions totales",           value: signups ?? 0,          status: "observed" },
          { label: "Onboardings terminés",           value: onboardings ?? 0,      status: "observed" },
          { label: "Missions créées",                value: missions ?? 0,          status: "observed" },
          { label: "Offres publiées",                value: offers ?? 0,            status: "observed" },
          { label: "Intros soumises",                value: introsTotal ?? 0,       status: "observed" },
          { label: "Intros validées",                value: introsValidees ?? 0,    status: "observed" },
          { label: "Gains validés",                  value: gainsValides ?? 0,      status: "observed" },
          { label: "Jobs exécutés",                  value: jobs ?? 0,              status: "observed" },
          { label: "Channel actions",                value: channelActions ?? 0,    status: "observed" },
          { label: "Link clicks (passif)",           value: linkClicks ?? 0,        status: "observed" },
          { label: "Opportunités détectées",         value: opportunities ?? 0,     status: "observed", note: "table opportunities" },
          { label: "Deliveries canaux",              value: deliveries ?? 0,        status: "observed" },
          { label: "Visiteurs landing page",         value: null,                   status: "not_measured", note: "Nécessite un outil analytics externe (Plausible, GA…)" },
          { label: "Taux de conversion landing→CTA", value: null,                   status: "not_measured", note: "Non observable via DB native" },
          { label: "Paiements Stripe en temps réel", value: null,                   status: "env_dependent", note: "Nécessite webhook Stripe configuré (STRIPE_WEBHOOK_SECRET)" },
        ]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const maxFunnel = funnel.reduce((m, s) => Math.max(m, s.value ?? 0), 1);

  return (
    <AdminLayout title="Analytics" subtitle="Données réelles depuis la base — sans simulation">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {Object.entries(STATUS_CHIP).map(([k, v]) => (
          <span key={k} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${v.cls}`}>
            {k === "observed" ? <Eye size={11} /> : <EyeOff size={11} />}
            {v.label}
          </span>
        ))}
      </div>

      {/* Funnel */}
      <div className="card-surface p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-5">Funnel d'activation — observé depuis la DB</h2>
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {funnel.map((step) => {
              const chip = STATUS_CHIP[step.status];
              const pct = step.value != null ? Math.round((step.value / maxFunnel) * 100) : 0;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{step.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      {step.value != null ? step.value.toLocaleString("fr") : "—"}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    {step.value != null && (
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    {step.value == null && (
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
        <h2 className="font-semibold text-foreground mb-4">Métriques événements — réelles ou étiquetées</h2>
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map(({ label, value, status, note }) => {
              const chip = STATUS_CHIP[status];
              return (
                <div key={label} className="stat-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="font-display text-xl font-bold text-foreground mt-0.5">
                        {value != null ? value.toLocaleString("fr") : "—"}
                      </p>
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
          <TrendingUp size={13} /> Ce qui n'est pas encore mesuré
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Trafic landing page — nécessite Plausible / GA / Posthog branché</li>
          <li>Paiements Stripe en temps réel — nécessite webhook <code>STRIPE_WEBHOOK_SECRET</code></li>
          <li>Clics CTA landing — non observable via DB native</li>
          <li>Taux d'abandon checkout — non observable sans tracker front</li>
        </ul>
      </div>
    </AdminLayout>
  );
}
