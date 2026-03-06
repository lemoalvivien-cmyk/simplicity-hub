import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Search, Filter, MoreVertical } from "lucide-react";

const users = [
  { id: 1, name: "Marie Dupont", email: "marie@exemple.fr", status: "actif", plan: "Code promo", joined: "5 mars 2024", expires: "5 mars 2025" },
  { id: 2, name: "Julien Martin", email: "julien@exemple.fr", status: "actif", plan: "Payant", joined: "12 fév. 2024", expires: "12 mars 2024" },
  { id: 3, name: "Sophie Laurent", email: "sophie@exemple.fr", status: "actif", plan: "Code promo", joined: "1 mars 2024", expires: "1 mars 2025" },
  { id: 4, name: "Thomas Bernard", email: "thomas@exemple.fr", status: "expiré", plan: "Payant", joined: "10 jan. 2024", expires: "10 fév. 2024" },
  { id: 5, name: "Camille Petit", email: "camille@exemple.fr", status: "actif", plan: "Payant", joined: "20 fév. 2024", expires: "20 mars 2024" },
  { id: 6, name: "Lucas Moreau", email: "lucas@exemple.fr", status: "inactif", plan: "Code promo", joined: "28 jan. 2024", expires: "28 jan. 2025" },
];

const STATUS_BADGE: Record<string, string> = {
  actif: "badge-success",
  expiré: "badge-muted",
  inactif: "badge-warning",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("tous");

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "tous" || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminLayout title="Utilisateurs" subtitle={`${users.length} utilisateurs au total`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-muted-foreground" />
          {["tous", "actif", "expiré", "inactif"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expiration</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Inscrit</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={user.plan === "Code promo" ? "badge-warning" : "badge-muted"}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={STATUS_BADGE[user.status] || "badge-muted"}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{user.expires}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{user.joined}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
