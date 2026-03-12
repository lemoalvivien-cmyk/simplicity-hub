import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Users, Tag, CreditCard, TrendingUp, ArrowUpRight, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface OverviewStats {
  totalUsers: number;
  totalMissions: number;
  totalIntroductions: number;
  activatedCodes: number;
  totalRevenue: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

type RecentUser = {
  id: string;
  email: string | null;
  prenom: string | null;
  role: string | null;
  created_at: string;
  source: string;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [usersRes, missionsRes, introsRes, recentUsersRes] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("missions").select("id", { count: "exact", head: true }),
            supabase.from("introductions").select("id", { count: "exact", head: true }),
            supabase.from("profiles").select("id, email, prenom, role, created_at").order("created_at", { ascending: false }).limit(8),
          ]);

        // Revenue from billing_events
        const revenueRes = await supabase
          .from("billing_events")
          .select("payload")
          .eq("event_type", "checkout.session.completed");

        let totalRevenue = 0;
        (revenueRes.data || []).forEach((evt) => {
          if (evt.payload && typeof evt.payload === "object") {
            const amount = (evt.payload as Record<string, unknown>)["amount_total"];
            if (typeof amount === "number") totalRevenue += amount / 100;
          }
        });

        // Promo codes count
        const codesRes = await supabase
          .from("promo_codes")
          .select("id", { count: "exact", head: true })
          .eq("is_used", true);

        setStats({
          totalUsers: usersRes.count || 0,
          totalMissions: missionsRes.count || 0,
          totalIntroductions: introsRes.count || 0,
          activatedCodes: codesRes.count || 0,
          totalRevenue,
        });

        setRecentUsers(
          (recentUsersRes.data || []).map((u) => ({
            ...u,
            source: "paiement",
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
    { label: "Introductions", value: stats.totalIntroductions.toString(), sub: "Total soumises", icon: TrendingUp, to: "/admin/users", color: "text-primary" },
  ] : [];

  // Stripe webhook secret check — only verifiable at runtime via env presence
  const stripeWebhookConfigured = !!(
    import.meta.env.VITE_STRIPE_WEBHOOK_SECRET_CONFIGURED !== "false"
  );

  return (
    <AdminLayout
      title="Vue d'ensemble"
      subtitle="Statistiques en temps réel — données directes depuis la base."
    >
      {/* ── Checklist secrets production ────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
          <AlertTriangle size={14} className="text-accent" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Checklist secrets production</span>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              key: "STRIPE_SECRET_KEY",
              label: "Stripe — Clé secrète (sk_live_…)",
              hint: "Dashboard Stripe → Developers → API keys",
            },
            {
              key: "STRIPE_WEBHOOK_SECRET",
              label: "Stripe — Webhook secret (whsec_…)",
              hint: "Dashboard Stripe → Developers → Webhooks → endpoint → Signing secret. OBLIGATOIRE pour valider les paiements.",
              critical: true,
            },
            {
              key: "STRIPE_PRICE_ID",
              label: "Stripe — Price ID (price_…)",
              hint: "Dashboard Stripe → Products → Wiinup Max → Price ID",
            },
          ].map(({ key, label, hint, critical }) => (
            <div key={key} className="flex items-start gap-3 px-4 py-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${critical ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                {critical
                  ? <AlertTriangle size={10} />
                  : <CheckCircle2 size={10} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground font-mono">{key}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{hint}</p>
              </div>
              {critical && (
                <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive uppercase tracking-wide">Critique</span>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 bg-muted/20 text-[11px] text-muted-foreground border-t border-border">
          Configurer via <strong>Lovable Cloud → Secrets</strong> (icône nuage → Secrets).
        </div>
      </div>
      {/* Metrics */}
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

      {/* Recent users */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Dernières inscriptions</h2>
          <Link to="/admin/users" className="text-xs text-primary hover:underline">Voir tous →</Link>
        </div>
        {recentUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users size={24} className="text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Aucun utilisateur encore inscrit.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.prenom || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email || "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="badge-muted text-xs">Inscrit</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(u.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
