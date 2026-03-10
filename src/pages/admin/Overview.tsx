import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Users, Tag, CreditCard, TrendingUp, ArrowUpRight,
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

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<{ id: string; email: string; prenom: string | null; role: string | null; created_at: string; source: string }[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true);
      try {
        const [usersRes, missionsRes, introsRes, codesRes, revenueRes, recentUsersRes] =
          await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }),
            supabase.from("missions").select("id", { count: "exact", head: true }),
            supabase.from("introductions").select("id", { count: "exact", head: true }),
            supabase.from("promo_codes").select("id", { count: "exact", head: true }).eq("is_used", true),
            supabase.from("billing_events").select("payload").eq("event_type", "checkout.session.completed"),
            supabase.from("profiles").select("id, email, prenom, role, created_at").order("created_at", { ascending: false }).limit(8),
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
          ? await supabase.from("promo_code_uses").select("user_id").in("user_id", userIds)
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
    { label: "Introductions", value: stats.totalIntroductions.toString(), sub: "Total soumises", icon: TrendingUp, to: "/admin/users", color: "text-primary" },
  ] : [];

  return (
    <AdminLayout
      title="Vue d'ensemble"
      subtitle="Statistiques en temps réel — données directes depuis la base."
    >
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
            {recentUsers.slice(0, 8).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.prenom || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</p>
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
    </AdminLayout>
  );
}
