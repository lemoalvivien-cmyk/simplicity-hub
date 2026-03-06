import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Plus, Copy, CheckCircle2, XCircle, Clock, Tag } from "lucide-react";

type CodeStatus = "actif" | "utilisé" | "expiré" | "désactivé";

interface PromoCode {
  id: number;
  code: string;
  status: CodeStatus;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
  expiresAt: string;
}

const INITIAL_CODES: PromoCode[] = [
  { id: 1, code: "BIENVENUE12", status: "utilisé", usedBy: "marie@exemple.fr", usedAt: "5 mars 2024", createdAt: "1 jan. 2024", expiresAt: "31 déc. 2024" },
  { id: 2, code: "INVITE2024A", status: "actif", createdAt: "1 jan. 2024", expiresAt: "31 déc. 2024" },
  { id: 3, code: "INVITE2024B", status: "actif", createdAt: "1 jan. 2024", expiresAt: "31 déc. 2024" },
  { id: 4, code: "PROMO2024C", status: "utilisé", usedBy: "sophie@exemple.fr", usedAt: "1 mars 2024", createdAt: "1 jan. 2024", expiresAt: "31 déc. 2024" },
  { id: 5, code: "INVEXT2024D", status: "expiré", createdAt: "1 jan. 2023", expiresAt: "31 déc. 2023" },
  { id: 6, code: "DISABLETEST", status: "désactivé", createdAt: "1 jan. 2024", expiresAt: "31 déc. 2024" },
];

const STATUS_CONFIG: Record<CodeStatus, { badge: string; icon: typeof CheckCircle2 }> = {
  actif: { badge: "badge-success", icon: CheckCircle2 },
  utilisé: { badge: "badge-warning", icon: Tag },
  expiré: { badge: "badge-muted", icon: Clock },
  désactivé: { badge: "badge-muted", icon: XCircle },
};

const stats = [
  { label: "Codes créés", value: "120", color: "text-primary" },
  { label: "Codes activés", value: "89", color: "text-success" },
  { label: "Codes disponibles", value: "18", color: "text-accent" },
  { label: "Codes expirés", value: "13", color: "text-muted-foreground" },
];

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>(INITIAL_CODES);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [filter, setFilter] = useState<"tous" | CodeStatus>("tous");

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createCode = () => {
    if (!newCode.trim()) return;
    const code: PromoCode = {
      id: Date.now(),
      code: newCode.toUpperCase().replace(/\s/g, ""),
      status: "actif",
      createdAt: "Maintenant",
      expiresAt: "31 déc. 2024",
    };
    setCodes((prev) => [code, ...prev]);
    setNewCode("");
    setShowCreate(false);
  };

  const toggleStatus = (id: number, currentStatus: CodeStatus) => {
    setCodes((prev) => prev.map((c) =>
      c.id === id
        ? { ...c, status: currentStatus === "actif" ? "désactivé" : currentStatus === "désactivé" ? "actif" : c.status }
        : c
    ));
  };

  const filtered = filter === "tous" ? codes : codes.filter((c) => c.status === filter);

  return (
    <AdminLayout title="Codes promo" subtitle="Gérez les codes d'invitation et suivez leur utilisation.">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center">
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(["tous", "actif", "utilisé", "expiré", "désactivé"] as const).map((f) => (
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
        <button
          onClick={() => setShowCreate(true)}
          className="btn-cta text-sm px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Plus size={15} />
          Créer un code
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-surface p-4 mb-4 border-2 border-accent/30 animate-fade-in">
          <p className="font-medium text-foreground text-sm mb-3">Nouveau code d'invitation</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="Ex : INVITE2024X"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={createCode} className="btn-primary text-sm px-4 py-2.5">
              Créer
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisé par</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date d'utilisation</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expiration</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((code) => {
                const config = STATUS_CONFIG[code.status];
                return (
                  <tr key={code.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <code className="font-mono text-sm font-semibold text-foreground tracking-wider">
                        {code.code}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={config.badge}>{code.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {code.usedBy || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {code.usedAt || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {code.expiresAt}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => copyCode(code.id, code.code)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Copier"
                        >
                          {copiedId === code.id ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                        {(code.status === "actif" || code.status === "désactivé") && (
                          <button
                            onClick={() => toggleStatus(code.id, code.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              code.status === "actif"
                                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "bg-success-light text-success hover:bg-success-light"
                            }`}
                          >
                            {code.status === "actif" ? "Désactiver" : "Réactiver"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Aucun code dans cette catégorie.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
