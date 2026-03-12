import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart,
} from "recharts";
import {
  Euro, TrendingDown, Clock, CheckCircle2,
  Download, RefreshCw, Play, Filter, Loader2, Users, AlertTriangle,
  Bell, X, ChevronDown, Zap, Target, Activity, Database, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsPoint {
  day: string;
  checkouts: number;
  revenue_eur: number;
  leads_generated: number;
  intros_validated: number;
  payouts_paid_cnt: number;
  payouts_paid_eur: number;
  subs_created: number;
}
interface MonthlyPoint {
  period: string;
  revenue_eur: number;
  subs_active: number;
  payouts_paid: number;
  leads_openclaw: number;
}
interface BusinessHealth {
  active_subs: number;
  churned_30d: number;
  new_subs_30d: number;
  churn_rate: number;
  total_revenue: number;
  ltv: number;
  pending_48h: number;
  failed_payouts_7d: number;
  openclaw_today: number;
  openclaw_quota_pct: number;
  pending_gains_no_payout: number;
  computed_at: string;
}
interface AnalyticsSummary {
  total_checkouts: number;
  total_leads: number;
  total_intros_validated: number;
  total_payouts_paid: number;
  total_subs_created: number;
  total_churned: number;
  events_last_24h: number;
  computed_at: string;
}
interface BusinessAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  value: number;
  threshold: number;
  resolved: boolean;
  created_at: string;
}
interface PayoutRow {
  id: string;
  facilitator_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  gain_id: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  failure_reason: string | null;
}
type StatusFilter = "all" | "pending" | "paid" | "failed";
type TimeRange = "7d" | "30d" | "ytd";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
const fmtEur = (n: number) => `${fmt(n)} €`;

const SEVERITY_CFG: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  critical: { bg: "bg-destructive/8", border: "border-destructive/40", icon: "text-destructive", badge: "bg-destructive text-white" },
  warning:  { bg: "bg-yellow-50",     border: "border-yellow-300",     icon: "text-yellow-600", badge: "bg-yellow-500 text-white" },
  info:     { bg: "bg-primary/5",     border: "border-primary/30",     icon: "text-primary",    badge: "bg-primary text-primary-foreground" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "En attente",  color: "hsl(38 80% 30%)",         bg: "hsl(38 80% 92%)" },
  paid:       { label: "Payé ✓",      color: "hsl(142 72% 29%)",        bg: "hsl(142 72% 94%)" },
  failed:     { label: "Échoué",      color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)" },
  processing: { label: "En cours",    color: "hsl(var(--primary))",     bg: "hsl(var(--secondary))" },
};

// ── Chart colors ──────────────────────────────────────────────────────────────
const C = {
  revenue:  "hsl(221 83% 53%)",
  payouts:  "hsl(142 72% 29%)",
  leads:    "hsl(262 52% 56%)",
  intros:   "hsl(32 95% 44%)",
  subs:     "hsl(199 89% 48%)",
  churn:    "hsl(0 72% 51%)",
};

const TooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  },
};

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(rows: PayoutRow[]) {
  const headers = ["id","facilitator_id","amount","currency","status","stripe_transfer_id","created_at","paid_at","failure_reason"];
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      [r.id,r.facilitator_id,r.amount,r.currency,r.status,r.stripe_transfer_id??"",r.created_at,r.paid_at??"",r.failure_reason??""].join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenue-export-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function AlertBanner({ alert, onResolve }: { alert: BusinessAlert; onResolve: (id: string) => void }) {
  const cfg = SEVERITY_CFG[alert.severity] ?? SEVERITY_CFG.warning;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border} mb-2`}>
      <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${cfg.icon}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>
            {alert.severity.toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-foreground">{alert.title}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
      </div>
      <button
        onClick={() => onResolve(alert.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
        title="Marquer résolu"
      >
        <X size={14} className="text-muted-foreground" />
      </button>
    </div>
  );
}

// ── EmptyChart placeholder ────────────────────────────────────────────────────
function EmptyChartHint({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
      <Database size={24} className="opacity-30" />
      <p className="text-xs">Aucune donnée pour « {label} » sur cette période.</p>
      <p className="text-xs opacity-60">Les données s'afficheront dès qu'un événement réel est enregistré.</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminRevenue() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCharts, setShowCharts] = useState(true);

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 365;

  // ── Business health (KPIs from get_business_health) ───────────────────────
  const { data: health, isLoading: healthLoading } = useQuery<BusinessHealth>({
    queryKey: ["admin-business-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_health");
      if (error) throw error;
      return data as unknown as BusinessHealth;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Analytics event summary (from get_analytics_event_summary) ───────────
  const { data: evtSummary } = useQuery<AnalyticsSummary>({
    queryKey: ["admin-analytics-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_event_summary");
      if (error) throw error;
      return data as unknown as AnalyticsSummary;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Analytics timeseries (get_analytics_timeseries — our new function) ────
  const { data: analyticsData = [], isLoading: analyticsLoading } = useQuery<AnalyticsPoint[]>({
    queryKey: ["admin-analytics-timeseries", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_timeseries", { p_days: days });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        day:              String(r.day ?? ""),
        checkouts:        Number(r.checkouts ?? 0),
        revenue_eur:      Number(r.revenue_eur ?? 0),
        leads_generated:  Number(r.leads_generated ?? 0),
        intros_validated: Number(r.intros_validated ?? 0),
        payouts_paid_cnt: Number(r.payouts_paid_cnt ?? 0),
        payouts_paid_eur: Number(r.payouts_paid_eur ?? 0),
        subs_created:     Number(r.subs_created ?? 0),
      }));
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Monthly timeseries (get_revenue_timeseries — existing) ───────────────
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery<MonthlyPoint[]>({
    queryKey: ["admin-monthly-timeseries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_revenue_timeseries", { p_days: 365 });
      if (error) throw error;
      return (data ?? []) as MonthlyPoint[];
    },
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  // ── Active alerts ─────────────────────────────────────────────────────────
  const { data: alerts = [], refetch: refetchAlerts } = useQuery<BusinessAlert[]>({
    queryKey: ["admin-business-alerts"],
    queryFn: async () => {
      // Run the alert cycle (generate new alerts if thresholds exceeded)
      try { await supabase.rpc("run_alert_cycle"); } catch { /* non-blocking */ }
      const { data, error } = await supabase
        .from("business_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as BusinessAlert[];
    },
    refetchInterval: 120_000,
  });

  // ── Payouts table ─────────────────────────────────────────────────────────
  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<PayoutRow[]>({
    queryKey: ["admin-payouts", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("payouts")
        .select("id,facilitator_id,amount,currency,status,stripe_transfer_id,gain_id,notes,created_at,paid_at,failure_reason")
        .order("created_at", { ascending: false })
        .limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PayoutRow[];
    },
    refetchInterval: 15_000,
  });

  // ── Resolve alert ─────────────────────────────────────────────────────────
  const resolveAlert = useCallback(async (id: string) => {
    await supabase
      .from("business_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);
    refetchAlerts();
  }, [refetchAlerts]);

  // ── Send alert email ──────────────────────────────────────────────────────
  const sendAlertEmail = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("business-alert-dispatcher");
    if (error) toast.error("Erreur envoi email : " + error.message);
    else toast.success(`Email d'alerte envoyé — ${data?.sent ?? 0} alerte(s)`);
  }, []);

  // ── Process payout batch ──────────────────────────────────────────────────
  const processMutation = useMutation({
    mutationFn: async (payoutIds?: string[]) => {
      const body: Record<string, unknown> = {};
      if (payoutIds && payoutIds.length > 0) body.payout_ids = payoutIds;
      const { data, error } = await supabase.functions.invoke("process-pending-payouts", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Batch : ${data.paid} payout(s) payé(s) — ${fmtEur(data.total_paid_eur ?? 0)}`);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-business-health"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics-summary"] });
      setSelected(new Set());
    },
    onError: (err) => toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll  = () => setSelected(new Set(payouts.filter((p) => p.status === "pending").map((p) => p.id)));
  const clearSelect = () => setSelected(new Set());

  // ── KPI cards (blend health + evtSummary for richer data) ────────────────
  const kpiCards = health ? [
    {
      label: "Revenu Stripe total",
      value: fmtEur(health.total_revenue),
      sub: `LTV moy : ${fmtEur(health.ltv)}`,
      icon: <Euro size={16} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: null,
      extra: evtSummary ? `${evtSummary.total_checkouts} checkout(s)` : null,
    },
    {
      label: "Abonnements actifs",
      value: health.active_subs.toString(),
      sub: `+${health.new_subs_30d} ce mois`,
      icon: <Users size={16} />,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      trend: health.new_subs_30d > 0 ? "up" : null,
      extra: evtSummary ? `${evtSummary.total_subs_created} total créés` : null,
    },
    {
      label: "Churn rate (30j)",
      value: `${health.churn_rate}%`,
      sub: `${health.churned_30d} désinscrit(s)`,
      icon: <TrendingDown size={16} />,
      color: health.churn_rate > 5 ? "text-destructive" : "text-green-600",
      bg: health.churn_rate > 5 ? "bg-red-50" : "bg-green-50",
      trend: health.churn_rate > 5 ? "alert" : null,
      extra: evtSummary ? `${evtSummary.total_churned} total` : null,
    },
    {
      label: "Payouts en attente",
      value: `${payouts.filter(p => p.status === "pending").length}`,
      sub: health.pending_48h > 0 ? `⚠️ ${health.pending_48h} >48h` : "Tous récents",
      icon: <Clock size={16} />,
      color: health.pending_48h > 0 ? "text-yellow-600" : "text-muted-foreground",
      bg: health.pending_48h > 0 ? "bg-yellow-50" : "bg-muted/30",
      trend: null,
      extra: evtSummary ? `${evtSummary.total_payouts_paid} payé(s)` : null,
    },
    {
      label: "Leads générés (total)",
      value: evtSummary ? evtSummary.total_leads.toString() : health.openclaw_today.toString(),
      sub: `Aujourd'hui : ${health.openclaw_today}`,
      icon: <Zap size={16} />,
      color: health.openclaw_quota_pct > 80 ? "text-yellow-600" : "text-purple-600",
      bg: health.openclaw_quota_pct > 80 ? "bg-yellow-50" : "bg-purple-50",
      trend: null,
      extra: evtSummary ? `${evtSummary.total_intros_validated} intros validées` : null,
    },
  ] : [];

  // ── Chart data helpers ────────────────────────────────────────────────────
  const hasRevenue = analyticsData.some(d => d.revenue_eur > 0 || d.payouts_paid_eur > 0);
  const hasLeads   = analyticsData.some(d => d.leads_generated > 0);
  const hasIntros  = analyticsData.some(d => d.intros_validated > 0);
  const hasSubs    = monthlyData.some(d => Number(d.subs_active) > 0);
  const hasMRevenu = monthlyData.some(d => Number(d.revenue_eur) > 0);

  return (
    <AdminLayout title="Revenue Ops" subtitle="Cockpit business · live · churn · LTV · payouts Stripe Connect">

      {/* ── Last refresh indicator ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Live · auto-actualisation 60s
            {evtSummary && (
              <span className="ml-2 text-primary font-medium">
                · {evtSummary.events_last_24h} événement(s) business /24h
              </span>
            )}
          </span>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={sendAlertEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Bell size={12} /> Envoyer alerte email ({alerts.length})
          </button>
        )}
      </div>

      {/* ── Alert banners ──────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={14} className="text-destructive" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wide">
              {alerts.length} alerte(s) active(s)
            </span>
          </div>
          {alerts.map((a) => (
            <AlertBanner key={a.id} alert={a} onResolve={resolveAlert} />
          ))}
        </div>
      )}

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      {healthLoading ? (
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-8 w-20 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {kpiCards.map(({ label, value, sub, icon, color, bg, trend, extra }) => (
            <div key={label} className="stat-card relative overflow-hidden">
              {trend === "alert" && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              {trend === "up" && (
                <ArrowUpRight size={14} className="absolute top-2 right-2 text-green-500" />
              )}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg} ${color}`}>
                {icon}
              </div>
              <p className={`font-display text-2xl font-bold mb-0.5 ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
              {extra && <p className="text-xs text-muted-foreground/50 mt-0.5">{extra}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Charts section ─────────────────────────────────────────────────── */}
      <div className="card-surface mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">
              Graphiques live
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (source : analytics_events — triggers DB temps réel)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(["7d","30d","ytd"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  timeRange === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {r === "7d" ? "7 jours" : r === "30d" ? "30 jours" : "YTD"}
              </button>
            ))}
            <button
              onClick={() => setShowCharts(v => !v)}
              className="ml-2 p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${showCharts ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {showCharts && (
          <div className="p-5 space-y-8">
            {analyticsLoading || monthlyLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* ── Chart 1: Revenu Stripe + Payouts ──────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    💰 Revenu Stripe & Payouts exécutés ({timeRange})
                  </p>
                  {!hasRevenue ? (
                    <EmptyChartHint label="Revenu / Payouts" />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={analyticsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.revenue} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradPayouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.payouts} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={C.payouts} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}€`} />
                        <Tooltip {...TooltipStyle} formatter={(v: number, n: string) => [fmtEur(v), n === "revenue_eur" ? "Revenu Stripe" : "Payouts payés"]} />
                        <Legend formatter={(v) => v === "revenue_eur" ? "Revenu Stripe" : "Payouts payés"} />
                        <Area type="monotone" dataKey="revenue_eur"      stroke={C.revenue} fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="payouts_paid_eur" stroke={C.payouts} fill="url(#gradPayouts)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* ── Chart 2: Leads générés ────────────────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    🎯 Leads générés (OpenClaw + imports)
                  </p>
                  {!hasLeads ? (
                    <EmptyChartHint label="Leads générés" />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={analyticsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Leads"]} />
                        <Bar dataKey="leads_generated" fill={C.leads} radius={[4,4,0,0]} name="Leads générés" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* ── Chart 3: Introductions validées ──────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    ✅ Introductions validées + Payouts réalisés
                  </p>
                  {!hasIntros ? (
                    <EmptyChartHint label="Introductions validées" />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart data={analyticsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip {...TooltipStyle} />
                        <Bar    yAxisId="left"  dataKey="intros_validated" fill={C.intros}  radius={[4,4,0,0]} name="Intros validées" />
                        <Line  yAxisId="right" dataKey="payouts_paid_cnt" stroke={C.payouts} strokeWidth={2} dot={false} name="Payouts payés" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* ── Charts 4+5: Monthly KPIs (abonnements + revenu mensuel) ── */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      📈 Abonnements actifs (mensuel)
                    </p>
                    {!hasSubs ? (
                      <EmptyChartHint label="Abonnements actifs" />
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                          <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Abonnements"]} />
                          <Bar dataKey="subs_active" fill={C.subs} radius={[4,4,0,0]} name="Abonnés actifs" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      📊 Revenu mensuel cumulé (YTD)
                    </p>
                    {!hasMRevenu ? (
                      <EmptyChartHint label="Revenu mensuel" />
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                          <defs>
                            <linearGradient id="gradMonthly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.revenue} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}€`} />
                          <Tooltip {...TooltipStyle} formatter={(v: number) => [fmtEur(v), "Revenu"]} />
                          <Area type="monotone" dataKey="revenue_eur" stroke={C.revenue} fill="url(#gradMonthly)" strokeWidth={2} dot={false} name="Revenu mensuel" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ── Event summary bar ─────────────────────────────────────── */}
                {evtSummary && (
                  <div className="bg-muted/30 rounded-xl border border-border px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      📡 Événements business trackés (analytics_events — total all-time)
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span>🛒 Checkouts : <strong className="text-foreground">{evtSummary.total_checkouts}</strong></span>
                      <span>🤝 Subs créées : <strong className="text-foreground">{evtSummary.total_subs_created}</strong></span>
                      <span>📉 Churns : <strong className="text-foreground">{evtSummary.total_churned}</strong></span>
                      <span>🎯 Leads : <strong className="text-foreground">{evtSummary.total_leads}</strong></span>
                      <span>✅ Intros validées : <strong className="text-foreground">{evtSummary.total_intros_validated}</strong></span>
                      <span>💸 Payouts payés : <strong className="text-foreground">{evtSummary.total_payouts_paid}</strong></span>
                      <span className="ml-auto opacity-60">
                        Calculé {new Date(evtSummary.computed_at).toLocaleTimeString("fr-FR")}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Actions bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["all","pending","paid","failed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "paid" ? "Payés" : "Échoués"}
          </button>
        ))}
        <div className="ml-auto flex gap-2 flex-wrap">
          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["admin-payouts"] });
              qc.invalidateQueries({ queryKey: ["admin-business-health"] });
              qc.invalidateQueries({ queryKey: ["admin-business-alerts"] });
              qc.invalidateQueries({ queryKey: ["admin-analytics-timeseries"] });
              qc.invalidateQueries({ queryKey: ["admin-analytics-summary"] });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={12} /> Actualiser
          </button>
          <button
            onClick={() => exportCSV(payouts)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>
          <button
            onClick={selected.size > 0 ? clearSelect : selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter size={12} /> {selected.size > 0 ? `Désélectionner (${selected.size})` : "Sélectionner pending"}
          </button>
          <button
            onClick={() => processMutation.mutate(selected.size > 0 ? Array.from(selected) : undefined)}
            disabled={processMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {processMutation.isPending
              ? <><Loader2 size={12} className="animate-spin" /> Traitement…</>
              : <><Play size={12} /> {selected.size > 0 ? `Payer ${selected.size} sélectionné(s)` : "Lancer batch complet"}</>
            }
          </button>
        </div>
      </div>

      {/* ── Payouts table ──────────────────────────────────────────────────── */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">
            Payouts facilitateurs
            {payouts.length > 0 && <span className="ml-2 text-muted-foreground font-normal">({payouts.length})</span>}
          </h2>
          {selected.size > 0 && (
            <span className="text-xs text-primary font-semibold">{selected.size} sélectionné(s)</span>
          )}
        </div>

        {payoutsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-10 text-center">
            <Target size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Aucun payout{statusFilter !== "all" ? ` avec statut "${statusFilter}"` : ""}.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Les payouts apparaissent dès qu'une introduction est validée (gain auto-généré).</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && payouts.filter(p => p.status === "pending").every(p => selected.has(p.id))}
                      onChange={(e) => e.target.checked ? selectAll() : clearSelect()}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Facilitateur</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Montant</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Statut</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Stripe Transfer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Créé le</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Payé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                  const isPending = p.status === "pending";
                  const isOld48h  = isPending && new Date(p.created_at) < new Date(Date.now() - 48*3600*1000);
                  return (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${selected.has(p.id) ? "bg-primary/5" : ""} ${isOld48h ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        {isPending && (
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {p.facilitator_id.slice(0,8)}…
                        </p>
                        {isOld48h && <span className="text-xs text-yellow-600 font-semibold">⚠️ &gt;48h</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-bold text-foreground">
                          {fmt(Number(p.amount))} {(p.currency || "EUR").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {p.status === "paid" && <CheckCircle2 size={10} />}
                          {cfg.label}
                        </span>
                        {p.failure_reason && (
                          <p className="text-xs text-destructive mt-0.5 truncate max-w-[200px]" title={p.failure_reason}>
                            {p.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.stripe_transfer_id ? (
                          <a
                            href={`https://dashboard.stripe.com/transfers/${p.stripe_transfer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-primary hover:underline truncate max-w-[120px] block"
                          >
                            {p.stripe_transfer_id.slice(0,16)}…
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.paid_at ? fmtDate(p.paid_at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer health summary ──────────────────────────────────────────── */}
      {health && (
        <div className="mt-4 px-4 py-3 rounded-xl border border-border bg-muted/20 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>🏦 Revenu total : <strong className="text-foreground">{fmtEur(health.total_revenue)}</strong></span>
          <span>👥 LTV : <strong className="text-foreground">{fmtEur(health.ltv)}</strong></span>
          <span>📉 Churn 30j : <strong className={health.churn_rate > 5 ? "text-destructive" : "text-foreground"}>{health.churn_rate}%</strong></span>
          <span>⏳ Gains sans payout : <strong className="text-foreground">{health.pending_gains_no_payout}</strong></span>
          {evtSummary && (
            <span>📡 Events /24h : <strong className="text-foreground">{evtSummary.events_last_24h}</strong></span>
          )}
          <span className="ml-auto opacity-60">
            Calculé le {new Date(health.computed_at).toLocaleTimeString("fr-FR")}
          </span>
        </div>
      )}
    </AdminLayout>
  );
}
