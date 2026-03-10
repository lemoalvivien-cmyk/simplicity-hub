/**
 * Admin Analytics — PROOF:ANALYTICS_RUNTIME_V1:admin_reads_real_data
 * Reads from: analytics_events, profiles, missions, introductions, gains, subscriptions
 * Platform-wide metrics + funnel + active/paying users
 */
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  TrendingUp, AlertCircle, Eye, EyeOff, RefreshCw,
  Users, Target, Send, Euro, Activity, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import { subDays, subMonths, startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import { fr } from "date-fns/locale";

type FunnelStep = {
  label: string;
  value: number | null;
  status: "observed" | "not_measured";
};

type PlatformMetric = {
  label: string;
  value: number | string | null;
  icon: typeof Users;
  accent?: boolean;
};

async function countEvent(eventType: string): Promise<number> {
  const { count } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType);
  return (count as number | null) ?? 0;
}

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default function AdminAnalytics() {
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [platform, setPlatform] = useState<PlatformMetric[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; signups: number; missions: number; intros: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      // ── Core DB counts ───────────────────────────────────────────────────
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: onboardings },
        { count: totalMissions },
        { count: totalIntros },
        { count: introsValidees },
        { count: totalGains },
        { data: gainsData },
        { count: payingUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true })
          .gte("updated_at", sevenDaysAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_done", true),
        supabase.from("missions").select("*", { count: "exact", head: true }),
        supabase.from("introductions").select("*", { count: "exact", head: true }),
        supabase.from("introductions").select("*", { count: "exact", head: true }).eq("statut", "validee"),
        supabase.from("gains").select("*", { count: "exact", head: true }).in("statut", ["valide", "recu"]),
        supabase.from("gains").select("montant").in("statut", ["valide", "recu"]),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      ]);

      // ── Analytics event counts ───────────────────────────────────────────
      const [
        landingViews,
        ctaClicks,
        pricingViews,
        checkoutStarts,
        checkoutSuccesses,
        missionCreatedEvents,
        introSubmittedEvents,
        pageViews,
      ] = await Promise.all([
        countEvent("landing_view"),
        countEvent("cta_click"),
        countEvent("pricing_view"),
        countEvent("checkout_start"),
        countEvent("checkout_success"),
        countEvent("mission_created"),
        countEvent("intro_submitted"),
        countEvent("page_view"),
      ]);

      const volumeGains = (gainsData ?? []).reduce((s: number, g: { montant: number | null }) => s + (g.montant ?? 0), 0);
      const tauxValidation = (totalIntros ?? 0) > 0
        ? Math.round(((introsValidees ?? 0) / (totalIntros ?? 1)) * 100)
        : null;

      // ── Monthly data (last 6 months) ─────────────────────────────────────
      const { data: profilesAll } = await supabase.from("profiles").select("created_at");
      const { data: missionsAll } = await supabase.from("missions").select("created_at");
      const { data: introsAll } = await supabase.from("introductions").select("created_at");

      const now = new Date();
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const inRange = (s: string) => { const t = parseISO(s); return t >= start && t <= end; };
        return {
          month: MONTHS_FR[d.getMonth()],
          signups: (profilesAll ?? []).filter(p => inRange(p.created_at)).length,
          missions: (missionsAll ?? []).filter(m => inRange(m.created_at)).length,
          intros: (introsAll ?? []).filter(ii => inRange(ii.created_at)).length,
        };
      });
      setMonthly(monthlyData);

      // ── Platform metrics ─────────────────────────────────────────────────
      setPlatform([
        { label: "Utilisateurs total", value: totalUsers ?? 0, icon: Users, accent: true },
        { label: "Actifs (7 derniers jours)", value: activeUsers ?? 0, icon: Activity },
        { label: "Abonnés payants", value: payingUsers ?? 0, icon: Euro, accent: true },
        { label: "Missions totales", value: totalMissions ?? 0, icon: Target },
        { label: "Introductions totales", value: totalIntros ?? 0, icon: Send },
        { label: "Volume gains (€)", value: volumeGains > 0 ? `${volumeGains.toLocaleString("fr")} €` : 0, icon: Euro, accent: volumeGains > 0 },
        { label: "Taux de validation intros", value: tauxValidation !== null ? `${tauxValidation}%` : "—", icon: TrendingUp },
        { label: "Vues landing", value: landingViews, icon: Eye },
        { label: "Starts checkout", value: checkoutStarts, icon: Zap },
        { label: "Succès checkout", value: checkoutSuccesses, icon: Zap, accent: true },
        { label: "Page views (app)", value: pageViews, icon: Eye },
        { label: "Clics CTA", value: ctaClicks, icon: Target },
      ]);

      // ── Funnel ───────────────────────────────────────────────────────────
      setFunnel([
        { label: "Vues landing",         value: landingViews,        status: "observed" },
        { label: "Inscriptions (DB)",    value: totalUsers ?? 0,     status: "observed" },
        { label: "Onboarding terminé",   value: onboardings ?? 0,    status: "observed" },
        { label: "Mission créée",        value: totalMissions ?? 0,  status: "observed" },
        { label: "Intro soumise",        value: totalIntros ?? 0,    status: "observed" },
        { label: "Intro validée",        value: introsValidees ?? 0, status: "observed" },
        { label: "Gain validé",          value: totalGains ?? 0,     status: "observed" },
        { label: "Abonné payant",        value: payingUsers ?? 0,    status: "observed" },
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

  return (
    <AdminLayout title="Analytics" subtitle="Données réelles — utilisateurs, funnel, plateforme">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye size={12} />
          <span>Source : DB structurelle + analytics_events</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          {lastRefresh ? `MàJ ${lastRefresh.toLocaleTimeString("fr")}` : "Actualiser"}
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-6 bg-muted rounded w-16 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Platform KPIs ── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {platform.slice(0, 4).map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className={accent ? "text-primary" : "text-muted-foreground"} />
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                </div>
                <p className={`font-display text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {platform.slice(4).map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className={accent ? "text-primary" : "text-muted-foreground"} />
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                </div>
                <p className={`font-display text-xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>
                  {value ?? "—"}
                </p>
              </div>
            ))}
          </div>

          {/* ── Monthly evolution chart ── */}
          {monthly.some(m => m.signups > 0 || m.missions > 0) && (
            <div className="card-surface p-5 mb-6">
              <h2 className="font-semibold text-foreground mb-1 text-sm">Évolution mensuelle (6 mois)</h2>
              <p className="text-xs text-muted-foreground mb-4">Inscriptions · Missions · Introductions</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="signups" name="Inscriptions" stroke="hsl(218, 72%, 55%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="missions" name="Missions" stroke="hsl(270, 72%, 60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="intros" name="Introductions" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Funnel ── */}
          <div className="card-surface p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-1">Funnel activation plateforme</h2>
            <p className="text-xs text-muted-foreground mb-5">
              De la vue landing au premier gain
            </p>
            <div className="space-y-4">
              {funnel.map((step, idx) => {
                const pct = step.value != null && maxFunnel > 0 ? Math.round((step.value / maxFunnel) * 100) : 0;
                const convFromPrev = idx > 0 && funnel[idx - 1].value && step.value
                  ? Math.round((step.value / funnel[idx - 1].value!) * 100)
                  : null;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{step.label}</span>
                        {convFromPrev !== null && idx > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                            {convFromPrev}%
                          </span>
                        )}
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
          </div>

          {/* ── Honest notes ── */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <EyeOff size={13} /> Ce qui reste non mesuré
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Taux d'abandon checkout — observable uniquement avec tracker cross-session</li>
              <li>Paiements Stripe realtime — nécessite webhook <code>STRIPE_WEBHOOK_SECRET</code></li>
              <li>"Actifs 7j" basé sur <code>profiles.updated_at</code> — non sur une vraie session</li>
            </ul>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
