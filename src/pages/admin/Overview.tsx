import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import NBACockpit from "@/components/admin/NBACockpit";
import CapabilityMatrixPanel from "@/components/admin/CapabilityMatrixPanel";
import { getReleaseGate, getCapabilityStatusSummary } from "@/lib/capabilityMatrix";
import { Users, Tag, CreditCard, TrendingUp, ArrowUpRight, Loader2, Activity, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/supabase";

interface OverviewStats {
  totalUsers: number;
  totalMissions: number;
  totalIntroductions: number;
  activatedCodes: number;
  totalRevenue: number;
}

interface RecentUser {
  id: string;
  email: string;
  prenom: string | null;
  role: string | null;
  created_at: string;
  source: "promo" | "paiement" | "inconnu";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
}

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  PROD_BLOCKED:        { color: "hsl(var(--level-critical-fg))", bg: "hsl(var(--level-critical-bg))", border: "hsl(var(--level-critical-border))" },
  PUBLIC_BETA_BLOCKED: { color: "hsl(var(--level-high-fg))",    bg: "hsl(var(--level-high-bg))",    border: "hsl(var(--level-high-border))" },
  PRIVATE_BETA_READY:  { color: "hsl(var(--level-ok-fg))",      bg: "hsl(var(--level-ok-bg))",      border: "hsl(var(--level-ok-border))" },
  INTERNAL_TEST:       { color: "hsl(var(--level-medium-fg))",  bg: "hsl(var(--level-medium-bg))",  border: "hsl(var(--level-medium-border))" },
  DEV_ONLY:            { color: "hsl(var(--level-unknown-fg))", bg: "hsl(var(--level-unknown-bg))", border: "hsl(var(--level-unknown-border))" },
};

type OverviewTab = "control" | "matrix";

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OverviewTab>("control");

  const releaseGate = getReleaseGate();
  const capSummary = getCapabilityStatusSummary();
  const verdict = VERDICT_STYLE[releaseGate.verdict] ?? VERDICT_STYLE.PRIVATE_BETA_READY;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, missionsRes, introsRes, codesRes, revenueRes, recentUsersRes] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }),
          db.from("missions").select("id", { count: "exact", head: true }),
          db.from("introductions").select("id", { count: "exact", head: true }),
          db.from("promo_codes").select("id", { count: "exact", head: true }).eq("is_used", true),
          db.from("billing_events").select("payload").eq("event_type", "checkout.session.completed"),
          db.from("profiles").select("id, email, prenom, role, created_at").order("created_at", { ascending: false }).limit(8),
        ]);

        let totalRevenue = 0;
        (revenueRes.data || []).forEach((evt: { payload: unknown }) => {
          if (evt.payload && typeof evt.payload === "object") {
            const amount = (evt.payload as Record<string, unknown>)["amount_total"];
            if (typeof amount === "number") totalRevenue += amount / 100;
          }
        });

        setStats({
          totalUsers: usersRes.count || 0,
          totalMissions: missionsRes.count || 0,
          totalIntroductions: introsRes.count || 0,
          activatedCodes: codesRes.count || 0,
          totalRevenue,
        });

        const userIds = (recentUsersRes.data || []).map((u: { id: string }) => u.id);
        const promoUsersRes = userIds.length > 0
          ? await db.from("promo_code_uses").select("user_id").in("user_id", userIds)
          : { data: [] };
        const promoUserSet = new Set((promoUsersRes.data || []).map((r: { user_id: string }) => r.user_id));

        setRecentUsers(
          (recentUsersRes.data || []).map((u: { id: string; email: string; prenom: string | null; role: string | null; created_at: string }) => ({
            ...u,
            source: promoUserSet.has(u.id) ? "promo" : "paiement",
          }))
        );
      } catch { /* graceful failure */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = stats ? [
    { label: "Utilisateurs", value: stats.totalUsers.toString(), sub: `${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""}`, icon: Users, to: "/admin/users", color: "text-primary bg-primary/10" },
    { label: "Codes activés", value: stats.activatedCodes.toString(), sub: "Codes promo utilisés", icon: Tag, to: "/admin/promo-codes", color: "text-accent bg-accent-light" },
    { label: "Revenu total", value: stats.totalRevenue > 0 ? `${stats.totalRevenue.toLocaleString("fr-FR")} €` : "—", sub: "Stripe checkout.session", icon: CreditCard, to: "/admin/payments", color: "text-success bg-success-light" },
    { label: "Introductions", value: stats.totalIntroductions.toString(), sub: "Total soumises", icon: TrendingUp, to: "/admin/analytics", color: "text-primary bg-primary/10" },
  ] : [];

  return (
    <AdminLayout title="Control Plane" subtitle="Vue opérateur — données réelles, vérité runtime, actions prioritaires.">

      {/* Release Gate Banner */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border mb-6 flex-wrap gap-2"
        style={{ background: verdict.bg, borderColor: verdict.border }}
      >
        <div className="flex items-center gap-2">
          <div className="health-pulse"><span className="health-pulse-dot" /></div>
          <span className="text-xs font-bold font-mono" style={{ color: verdict.color }}>
            {releaseGate.verdict.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{releaseGate.justification}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-success font-semibold">{capSummary.ready} ready</span>
          <span className="text-warning font-semibold">{capSummary.partial} partial</span>
          <span className="text-destructive font-semibold">{capSummary.blocked} blocked</span>
          <Link to="/admin/go-live" className="text-primary hover:underline font-medium">Détail →</Link>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, sub, icon: Icon, to, color }) => (
            <Link key={label} to={to} className="stat-card group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={16} />
                </div>
                <ArrowUpRight size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground mb-0.5">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs text-success font-medium mt-1">{sub}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {([
          { key: "control" as const, label: "NBA + Actions", icon: <Activity size={13} /> },
          { key: "matrix"  as const, label: "Capability Matrix", icon: <Shield size={13} /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === "control" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* NBA Cockpit */}
          <div className="lg:col-span-2">
            <NBACockpit />
          </div>

          {/* Recent users */}
          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-sm text-foreground">Dernières inscriptions</h2>
              <Link to="/admin/users" className="text-xs text-primary hover:underline">Voir tous →</Link>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Aucun utilisateur encore inscrit.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.prenom || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge-${u.source === "promo" ? "warning" : "muted"} text-xs`}>
                        {u.source === "promo" ? "Promo" : "Payant"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(u.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "matrix" && <CapabilityMatrixPanel />}
    </AdminLayout>
  );
}
