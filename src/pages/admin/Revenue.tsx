import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Euro, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  Download, RefreshCw, Play, Filter, Loader2, Users, AlertTriangle,
  Bell, X, ChevronDown, Zap, Target, Activity,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface DailyPoint {
  day: string;
  revenue_eur: number;
  payouts_paid: number;
  leads_openclaw: number;
  intros_validees: number;
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Chart theme ──────────────────────────────────────────────────────────────
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

// ── CSV export ───────────────────────────────────────────────────────────────
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

// ── Alert banner ─────────────────────────────────────────────────────────────
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

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminRevenue() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCharts, setShowCharts] = useState(true);

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 365;

  // ── Business health (KPIs) ────────────────────────────────────────────────
  const { data: health, isLoading: healthLoading } = useQuery<BusinessHealth>({
    queryKey: ["admin-business-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_health");
      if (error) throw error;
      return data as BusinessHealth;
    },
    refetchInterval: 60_000,
  });

  // ── Daily time-series ─────────────────────────────────────────────────────
  const { data: dailyData = [], isLoading: dailyLoading } = useQuery<DailyPoint[]>({
    queryKey: ["admin-daily-timeseries", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_timeseries", { p_days: days });
      if (error) throw error;
      return (data ?? []) as DailyPoint[];
    },
    refetchInterval: 60_000,
  });

  // ── Monthly time-series ───────────────────────────────────────────────────
  const { data: monthlyData = [], isLoading: monthlyLoading } = useQuery<MonthlyPoint[]>({
    queryKey: ["admin-monthly-timeseries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_revenue_timeseries", { p_days: 365 });
      if (error) throw error;
      return (data ?? []) as MonthlyPoint[];
    },
    refetchInterval: 120_000,
  });

  // ── Active alerts ─────────────────────────────────────────────────────────
  const { data: alerts = [], refetch: refetchAlerts } = useQuery<BusinessAlert[]>({
    queryKey: ["admin-business-alerts"],
    queryFn: async () => {
      // First generate new alerts
      await supabase.rpc("generate_business_alerts");
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
      toast.success(`Batch : ${data.paid} payout(s) payé(s) — ${fmtEur(data.total_paid_eur)}`);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-business-health"] });
      setSelected(new Set());
    },
    onError: (err) => toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll  = () => setSelected(new Set(payouts.filter((p) => p.status === "pending").map((p) => p.id)));
  const clearSelect = () => setSelected(new Set());

  // ── KPI cards ─────────────────────────────────────────────────────────────
  const kpiCards = health ? [
    {
      label: "Revenu Stripe total",
      value: fmtEur(health.total_revenue),
      sub: `LTV moy : ${fmtEur(health.ltv)}`,
      icon: <Euro size={16} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: null,
    },
    {
      label: "Abonnements actifs",
      value: health.active_subs.toString(),
      sub: `+${health.new_subs_30d} ce mois`,
      icon: <Users size={16} />,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      trend: health.new_subs_30d > 0 ? "up" : null,
    },
    {
      label: "Churn rate (30j)",
      value: `${health.churn_rate}%`,
      sub: `${health.churned_30d} désinscrit(s)`,
      icon: <TrendingDown size={16} />,
      color: health.churn_rate > 5 ? "text-destructive" : "text-green-600",
      bg: health.churn_rate > 5 ? "bg-red-50" : "bg-green-50",
      trend: health.churn_rate > 5 ? "alert" : null,
    },
    {
      label: "Payouts en attente",
      value: `${payouts.filter(p => p.status === "pending").length}`,
      sub: health.pending_48h > 0 ? `⚠️ ${health.pending_48h} >48h` : "Tous récents",
      icon: <Clock size={16} />,
      color: health.pending_48h > 0 ? "text-yellow-600" : "text-muted-foreground",
      bg: health.pending_48h > 0 ? "bg-yellow-50" : "bg-muted/30",
      trend: null,
    },
    {
      label: "OpenClaw aujourd'hui",
      value: health.openclaw_today.toString(),
      sub: `Quota : ${health.openclaw_quota_pct}%`,
      icon: <Zap size={16} />,
      color: health.openclaw_quota_pct > 80 ? "text-yellow-600" : "text-purple-600",
      bg: health.openclaw_quota_pct > 80 ? "bg-yellow-50" : "bg-purple-50",
      trend: null,
    },
  ] : [];

  const chartData = timeRange === "ytd" ? [] : dailyData;
  const isChartsLoading = dailyLoading || monthlyLoading;

  return (
    <AdminLayout title="Revenue Ops" subtitle="Cockpit business · live · churn · LTV · payouts Stripe Connect">

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
          {kpiCards.map(({ label, value, sub, icon, color, bg, trend }) => (
            <div key={label} className="stat-card relative overflow-hidden">
              {trend === "alert" && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${bg} ${color}`}>
                {icon}
              </div>
              <p className={`font-display text-2xl font-bold mb-0.5 ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts section ─────────────────────────────────────────────────── */}
      <div className="card-surface mb-5 overflow-hidden">
        {/* Header + time range */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Graphiques live</h2>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "ytd"] as TimeRange[]).map((r) => (
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
              onClick={() => setShowCharts((v) => !v)}
              className="ml-2 p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform ${showCharts ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>

        {showCharts && (
          <div className="p-5 space-y-8">
            {isChartsLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* ── Chart 1: Revenu + Payouts (Area) ──────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    💰 Revenu Stripe & Payouts exécutés
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeRange === "ytd" ? monthlyData.map(m => ({
                      day: m.period,
                      revenue_eur: Number(m.revenue_eur),
                      payouts_paid: Number(m.payouts_paid),
                      leads_openclaw: Number(m.leads_openclaw),
                      intros_validees: 0,
                    })) : chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
                      <Tooltip {...TooltipStyle} formatter={(v: number, n: string) => [fmtEur(v), n === "revenue_eur" ? "Revenu" : "Payouts"]} />
                      <Legend formatter={(v) => v === "revenue_eur" ? "Revenu Stripe" : "Payouts payés"} />
                      <Area type="monotone" dataKey="revenue_eur" stroke={C.revenue} fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="payouts_paid" stroke={C.payouts} fill="url(#gradPayouts)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Chart 2: Leads OpenClaw (Bar) ───────────────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    🎯 Leads OpenClaw générés
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={timeRange === "ytd" ? monthlyData.map(m => ({
                      day: m.period,
                      leads_openclaw: Number(m.leads_openclaw),
                      intros_validees: 0,
                    })) : chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Leads IA"]} />
                      <Bar dataKey="leads_openclaw" fill={C.leads} radius={[4, 4, 0, 0]} name="Leads OpenClaw" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Chart 3: Introductions validées (Line) ──────────────── */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    ✅ Introductions validées
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Introductions"]} />
                      <Line type="monotone" dataKey="intros_validees" stroke={C.intros} strokeWidth={2} dot={false} name="Intros validées" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Chart 4 + 5: LTV & Churn (monthly, bar) ────────────── */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      📈 Abonnements actifs (mensuel)
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip {...TooltipStyle} formatter={(v: number) => [v, "Abonnements"]} />
                        <Bar dataKey="subs_active" fill={C.subs} radius={[4, 4, 0, 0]} name="Abonnés actifs" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      📊 Revenu mensuel cumulé (YTD)
                    </p>
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
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Actions bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["all", "pending", "paid", "failed"] as StatusFilter[]).map((f) => (
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
            onClick={() => { qc.invalidateQueries({ queryKey: ["admin-payouts"] }); qc.invalidateQueries({ queryKey: ["admin-business-health"] }); qc.invalidateQueries({ queryKey: ["admin-business-alerts"] }); }}
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && payouts.filter((p) => p.status === "pending").every((p) => selected.has(p.id))}
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
                  const isOld48h = isPending && new Date(p.created_at) < new Date(Date.now() - 48*3600*1000);
                  return (
                    <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${selected.has(p.id) ? "bg-primary/5" : ""} ${isOld48h ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        {isPending && (
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {p.facilitator_id.slice(0, 8)}…
                        </p>
                        {isOld48h && <span className="text-xs text-yellow-600 font-semibold">{"⚠️ >48h"}</span>}
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
                            {p.stripe_transfer_id.slice(0, 16)}…
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
          <span className="ml-auto opacity-60">Calculé le {new Date(health.computed_at).toLocaleTimeString("fr-FR")}</span>
        </div>
      )}
    </AdminLayout>
  );
}
