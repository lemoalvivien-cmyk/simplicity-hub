import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AdminUser = {
  id: string;
  email: string | null;
  prenom: string | null;
  role: string | null;
  onboarding_done: boolean;
  created_at: string;
  // derived from joins
  access_type: "launch" | "standard" | "promo" | "gratuit" | "expiré" | "inconnu";
  subscription_end: string | null;
  subscription_status: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  facilitateur: "badge-muted",
  entreprise: "badge-warning",
  admin: "bg-accent/20 text-accent-foreground inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
};

const ACCESS_BADGE: Record<string, string> = {
  launch: "badge-success",
  standard: "badge-success",
  promo: "badge-warning",
  gratuit: "badge-muted",
  expiré: "bg-destructive/10 text-destructive inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
  inconnu: "badge-muted",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tous");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Load all profiles
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, email, prenom, role, onboarding_done, created_at")
          .order("created_at", { ascending: false });
        if (pErr) throw pErr;
        if (!profiles?.length) { setUsers([]); setLoading(false); return; }

        const userIds = profiles.map((p) => p.id);

        // 2. Load active subscriptions
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("user_id, status, offer_type, current_period_end, stripe_subscription_id")
          .in("user_id", userIds);

        // 3. Load promo redemptions
        const { data: promos } = await supabase
          .from("promo_code_redemptions")
          .select("user_id, status, end_at")
          .in("user_id", userIds);

        const subMap = new Map((subs ?? []).map((s) => [s.user_id, s]));
        const promoMap = new Map((promos ?? []).map((p) => [p.user_id, p]));

        const enriched: AdminUser[] = profiles.map((p) => {
          const sub = subMap.get(p.id);
          const promo = promoMap.get(p.id);

          let access_type: AdminUser["access_type"] = "inconnu";
          let subscription_end: string | null = null;
          let subscription_status: string | null = null;

          if (p.role === "facilitateur" && !sub && !promo) {
            access_type = "gratuit";
          } else if (sub) {
            subscription_status = sub.status;
            subscription_end = sub.current_period_end ?? null;
            if (sub.status === "active") {
              access_type = sub.offer_type === "launch" ? "launch" : "standard";
            } else {
              access_type = "expiré";
            }
          } else if (promo) {
            subscription_status = promo.status;
            subscription_end = promo.end_at;
            const endDate = new Date(promo.end_at);
            access_type = promo.status === "active" && endDate > new Date() ? "promo" : "expiré";
          }

          return { ...p, access_type, subscription_end, subscription_status };
        });

        setUsers(enriched);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.prenom ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "tous" ||
      (filter === "actif" && ["launch", "standard", "promo", "gratuit"].includes(u.access_type)) ||
      (filter === "expiré" && u.access_type === "expiré") ||
      (filter === "promo" && u.access_type === "promo") ||
      (filter === "payant" && ["launch", "standard"].includes(u.access_type)) ||
      (filter === "gratuit" && u.access_type === "gratuit");
    return matchSearch && matchFilter;
  });

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";

  return (
    <AdminLayout
      title="Utilisateurs"
      subtitle={loading ? "Chargement…" : `${users.length} compte${users.length > 1 ? "s" : ""} — données réelles`}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email ou prénom…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-muted-foreground" />
          {["tous", "actif", "payant", "promo", "gratuit", "expiré"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          Erreur : {error}
        </div>
      )}

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des comptes…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Compte</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rôle</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Accès</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Onboarding</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expiration</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Inscrit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {(user.prenom ?? user.email ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.prenom ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{user.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={ROLE_BADGE[user.role ?? ""] ?? "badge-muted"}>
                        {user.role ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={ACCESS_BADGE[user.access_type] ?? "badge-muted"}>
                        {user.access_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={user.onboarding_done ? "badge-success" : "badge-muted"}>
                        {user.onboarding_done ? "✓ terminé" : "en cours"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{fmtDate(user.subscription_end)}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{fmtDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {users.length === 0
                    ? "Aucun compte enregistré — base vide ou accès RLS insuffisant."
                    : "Aucun résultat pour ce filtre."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Données réelles — profiles + subscriptions + promo_code_redemptions. Visiteurs non authentifiés : non observables via DB.
      </p>
    </AdminLayout>
  );
}
