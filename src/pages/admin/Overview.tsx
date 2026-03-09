// PROOF:CONTROL_PLANE_V2:admin_overview_real_data
/**
 * Admin Overview — Control Plane réel
 * Toutes les données sont calculées depuis des checks runtime réels.
 * Release gate = moteur calculé, jamais hardcodé.
 */
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import NBACockpit from "@/components/admin/NBACockpit";
import CapabilitySection from "@/modules/control-plane/components/CapabilitySection";
import EvidenceTable from "@/modules/control-plane/components/EvidenceTable";
import { useControlPlane } from "@/modules/control-plane/hooks/useControlPlane";
import {
  Users, Tag, CreditCard, TrendingUp, ArrowUpRight, Loader2,
  Activity, Shield, Database, RefreshCw, AlertTriangle,
} from "lucide-react";
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
  source: "promo" | "paiement";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Il y a ${days}j`;
}

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  PROD_BLOCKED:          { color: "hsl(var(--level-critical-fg))", bg: "hsl(var(--level-critical-bg))", border: "hsl(var(--level-critical-border))" },
  PUBLIC_BETA_BLOCKED:   { color: "hsl(var(--level-high-fg))",     bg: "hsl(var(--level-high-bg))",     border: "hsl(var(--level-high-border))" },
  PRIVATE_BETA_READY:    { color: "hsl(var(--level-ok-fg))",       bg: "hsl(var(--level-ok-bg))",       border: "hsl(var(--level-ok-border))" },
  PRIVATE_BETA_POSSIBLE: { color: "hsl(var(--level-ok-fg))",       bg: "hsl(var(--level-ok-bg))",       border: "hsl(var(--level-ok-border))" },
  INTERNAL_TEST:         { color: "hsl(var(--level-medium-fg))",   bg: "hsl(var(--level-medium-bg))",   border: "hsl(var(--level-medium-border))" },
  DEV_ONLY:              { color: "hsl(var(--level-unknown-fg))",  bg: "hsl(var(--level-unknown-bg))",  border: "hsl(var(--level-unknown-border))" },
};

type OverviewTab = "cockpit" | "matrix" | "evidence";

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tab, setTab] = useState<OverviewTab>("cockpit");

  // Real control plane — calculated from actual DB checks
  const cp = useControlPlane();
  const verdict = VERDICT_STYLE[cp.releaseGate.verdict] ?? VERDICT_STYLE.DEV_ONLY;

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [usersRes, missionsRes, introsRes, codesRes, revenueRes, recentUsersRes] =
          await Promise.all([
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
        const promoRes = userIds.length > 0
          ? await db.from("promo_code_uses").select("user_id").in("user_id", userIds)
          : { data: [] };
        const promoSet = new Set((promoRes.data || []).map((r: { user_id: string }) => r.user_id));

        setRecentUsers(
          (recentUsersRes.data || []).map((u: { id: string; email: string; prenom: string | null; role: string | null; created_at: string }) => ({
            ...u,
            source: promoSet.has(u.id) ? "promo" : "paiement",
          }))
        );
      } catch { /* graceful degradation */ }
      finally { setStatsLoading(false); }
    };
    load();
  }, []);

  const statCards = stats ? [
    { label: "Utilisateurs", value: stats.totalUsers.toString(), sub: `${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""}`, icon: Users, to: "/admin/users", color: "text-primary" },
    { label: "Codes activés", value: stats.activatedCodes.toString(), sub: "Codes promo utilisés", icon: Tag, to: "/admin/promo-codes", color: "text-accent" },
    { label: "Revenu total", value: stats.totalRevenue > 0 ? `${stats.totalRevenue.toLocaleString("fr-FR")} €` : "—", sub: "Stripe checkout.session", icon: CreditCard, to: "/admin/payments", color: "text-success" },
    { label: "Introductions", value: stats.totalIntroductions.toString(), sub: "Total soumises", icon: TrendingUp, to: "/admin/analytics", color: "text-primary" },
  ] : [];

  const groups = Object.keys(cp.capabilitiesByGroup);

  return (
    <AdminLayout
      title="Control Plane"
      subtitle="Vérité runtime calculée — données réelles, preuves horodatées, actions prioritaires."
    >
      {/* Release Gate Banner — calculated, never hardcoded */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border mb-6 flex-wrap gap-2"
        style={{ background: verdict.bg, borderColor: verdict.border }}
      >
        <div className="flex items-center gap-2">
          <div className="health-pulse"><span className="health-pulse-dot" /></div>
          <span className="text-xs font-bold font-mono" style={{ color: verdict.color }}>
            {cp.loading ? "COMPUTING…" : cp.releaseGate.verdict.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{cp.releaseGate.justification}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {cp.loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <>
              <span className="text-success font-semibold">{cp.summary.ready} ready</span>
              <span className="text-warning font-semibold">{cp.summary.partial} partial</span>
              <span className="text-destructive font-semibold">{cp.summary.blocked} blocked</span>
              {cp.releaseGate.confidenceScore > 0 && (
                <span className="text-muted-foreground">confiance: {cp.releaseGate.confidenceScore}%</span>
              )}
            </>
          )}
          <button
            onClick={() => cp.refetch()}
            disabled={cp.loading}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Recalculer"
          >
            <RefreshCw size={11} className={cp.loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics — real data from DB */}
      {statsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, sub, icon: Icon, to, color }) => (
            <Link key={label} to={to} className="stat-card group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-muted ${color}`}>
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
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-muted/40 border border-border">
          <p className="text-sm text-muted-foreground">Données non disponibles — connexion requise.</p>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {([
          { key: "cockpit"  as const, label: "NBA + Actions",       icon: <Activity size={13} /> },
          { key: "matrix"   as const, label: "Capability Matrix",   icon: <Shield size={13} /> },
          { key: "evidence" as const, label: `Evidence (${cp.evidence.length})`, icon: <Database size={13} /> },
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

      {tab === "cockpit" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NBACockpit />
          </div>
          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-sm text-foreground">Dernières inscriptions</h2>
              <Link to="/admin/users" className="text-xs text-primary hover:underline">Voir tous →</Link>
            </div>
            {recentUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Users size={24} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Aucun utilisateur encore inscrit.</p>
                <p className="text-xs text-muted-foreground mt-1">Les premiers arriveront après l'ouverture.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.prenom || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
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

      {tab === "matrix" && (
        <div className="space-y-4">
          {/* Summary + warnings */}
          {cp.releaseGate.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/8 border border-warning/20 text-xs">
              <AlertTriangle size={13} className="text-warning shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">Warnings non bloquants:</span>{" "}
                {cp.releaseGate.warnings.join(", ")}
              </span>
            </div>
          )}
          {cp.loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <CapabilitySection
                  key={group}
                  group={group}
                  capabilities={cp.capabilitiesByGroup[group]}
                  evidence={cp.evidence}
                />
              ))}
            </div>
          )}
          {/* Legend */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Légende des preuves</p>
            <div className="flex flex-wrap gap-2">
              <span className="evidence-code">CODE = présence dans le code source</span>
              <span className="evidence-runtime">RUNTIME = comportement observé en base</span>
              <span className="evidence-external">EXTERNAL-CFG = config externe requise</span>
              <span className="evidence-manual">MANUAL STEP = action manuelle requise</span>
              <span className="evidence-unknown">UNKNOWN = impossible à vérifier ici</span>
            </div>
          </div>
        </div>
      )}

      {tab === "evidence" && (
        <EvidenceTable records={cp.evidence} loading={cp.loading} />
      )}

      {cp.lastRefreshedAt && (
        <p className="text-xs text-muted-foreground text-center mt-6">
          Dernière mise à jour: {new Date(cp.lastRefreshedAt).toLocaleTimeString("fr")}
          {cp.releaseGate.confidenceScore > 0 && ` · Confiance globale: ${cp.releaseGate.confidenceScore}%`}
        </p>
      )}
    </AdminLayout>
  );
}
