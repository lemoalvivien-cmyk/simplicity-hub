import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Users, Tag, CreditCard, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
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

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [
          usersRes,
          missionsRes,
          introsRes,
          codesRes,
          revenueRes,
          recentUsersRes,
        ] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }),
          db.from("missions").select("id", { count: "exact", head: true }),
          db.from("introductions").select("id", { count: "exact", head: true }),
          db.from("promo_codes").select("id", { count: "exact", head: true }).eq("is_used", true),
          db.from("billing_events").select("payload").eq("event_type", "checkout.session.completed"),
          db.from("profiles")
            .select("id, email, prenom, role, created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        // Revenue: sum from billing events
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

        // Determine source for recent users using promo_code_uses table
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
      } catch {
        // graceful failure — show partial data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Utilisateurs inscrits", value: stats.totalUsers.toString(), change: `${stats.totalMissions} mission${stats.totalMissions !== 1 ? "s" : ""} publiée${stats.totalMissions !== 1 ? "s" : ""}`, icon: Users, to: "/admin/users", color: "text-primary bg-primary/10" },
        { label: "Codes activés", value: stats.activatedCodes.toString(), change: "Codes promo utilisés", icon: Tag, to: "/admin/promo-codes", color: "text-accent bg-accent-light" },
        { label: "Revenus totaux", value: stats.totalRevenue > 0 ? `${stats.totalRevenue.toLocaleString("fr-FR")} €` : "Données non disponibles", change: "Stripe checkout.session", icon: CreditCard, to: "/admin/payments", color: "text-success bg-success-light" },
        { label: "Introductions", value: stats.totalIntroductions.toString(), change: "Total soumises", icon: TrendingUp, to: "/admin/analytics", color: "text-primary bg-primary/10" },
      ]
    : [];

  return (
    <AdminLayout title="Vue d'ensemble" subtitle="Données réelles — base de données en direct.">
      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, change, icon: Icon, to, color }) => (
              <Link key={label} to={to} className="stat-card group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <ArrowUpRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display text-2xl font-bold text-foreground mb-0.5">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xs text-success font-medium mt-1">{change}</p>
              </Link>
            ))}
          </div>

          {/* Recent users */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Dernières inscriptions</h2>
              <Link to="/admin/users" className="text-xs text-primary hover:underline">
                Voir tous →
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun utilisateur encore inscrit.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisateur</th>
                      <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rôle</th>
                      <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Source</th>
                      <th className="text-left py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3">
                          <p className="font-medium text-foreground">{u.prenom || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="py-3">
                          <span className={`badge-${u.role === "admin" ? "warning" : "muted"}`}>
                            {u.role || "—"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`badge-${u.source === "promo" ? "warning" : "muted"}`}>
                            {u.source === "promo" ? "Code promo" : "Inscription"}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">{timeAgo(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
