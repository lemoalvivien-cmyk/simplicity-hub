import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Plus, Copy, CheckCircle2, XCircle, Clock, Tag, Loader2, AlertCircle, Zap } from "lucide-react";
import { db } from "@/lib/supabase";
import { toast } from "sonner";

type CodeStatus = "actif" | "utilisé" | "expiré" | "désactivé";

interface PromoCode {
  id: string;
  code: string;
  status: CodeStatus;
  duration_months: number;
  usage_unique: boolean;
  expires_at: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<CodeStatus, { badge: string; icon: typeof CheckCircle2 }> = {
  actif: { badge: "badge-success", icon: CheckCircle2 },
  utilisé: { badge: "badge-warning", icon: Tag },
  expiré: { badge: "badge-muted", icon: Clock },
  désactivé: { badge: "badge-muted", icon: XCircle },
};

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"tous" | CodeStatus>("tous");
  const [launchUsed, setLaunchUsed] = useState(0);
  const [launchTotal, setLaunchTotal] = useState(100);

  const loadCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const [codesRes, quotaRes] = await Promise.all([
        db.from("promo_codes").select("*").order("created_at", { ascending: false }),
        db.from("launch_quota").select("total_slots, used_slots").single(),
      ]);
      if (codesRes.error) throw codesRes.error;
      setCodes(codesRes.data || []);
      if (quotaRes.data) {
        setLaunchUsed(quotaRes.data.used_slots);
        setLaunchTotal(quotaRes.data.total_slots);
      }
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCodes(); }, []);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Code copié !");
  };

  const createCode = async () => {
    if (!newCode.trim()) return;
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        code: newCode.toUpperCase().replace(/\s/g, ""),
        status: "actif",
        duration_months: 12,
        usage_unique: true,
      };
      if (newExpiry) payload.expires_at = new Date(newExpiry).toISOString();
      else payload.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const { error: err } = await db.from("promo_codes").insert(payload);
      if (err) throw err;
      toast.success("Code créé !");
      setNewCode("");
      setNewExpiry("");
      setShowCreate(false);
      await loadCodes();
    } catch {
      toast.error("Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: CodeStatus) => {
    const newStatus = currentStatus === "actif" ? "désactivé" : currentStatus === "désactivé" ? "actif" : null;
    if (!newStatus) return;
    try {
      const update: Record<string, unknown> = { status: newStatus };
      if (newStatus === "désactivé") update.disabled_at = new Date().toISOString();
      const { error: err } = await db.from("promo_codes").update(update).eq("id", id);
      if (err) throw err;
      await loadCodes();
      toast.success(newStatus === "désactivé" ? "Code désactivé" : "Code réactivé");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const filtered = filter === "tous" ? codes : codes.filter((c) => c.status === filter);

  const launchRemaining = Math.max(0, launchTotal - launchUsed);
  const launchPct = Math.min(100, (launchUsed / launchTotal) * 100);

  const stats = [
    { label: "Codes créés", value: codes.length, color: "text-primary" },
    { label: "Codes actifs", value: codes.filter(c => c.status === "actif").length, color: "text-success" },
    { label: "Codes utilisés", value: codes.filter(c => c.status === "utilisé").length, color: "text-accent" },
    { label: "Expirés / désactivés", value: codes.filter(c => c.status === "expiré" || c.status === "désactivé").length, color: "text-muted-foreground" },
  ];

  return (
    <AdminLayout title="Codes d'invitation" subtitle="Gérez les codes d'accès et suivez leur utilisation.">
      {/* Launch quota */}
      <div className="card-surface p-5 mb-6 border-2 border-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-accent" />
          <h3 className="font-semibold text-foreground text-sm">Offre de lancement — 100 premières entreprises</h3>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{launchUsed} places utilisées sur {launchTotal}</span>
          <span className="font-semibold text-foreground">{launchRemaining} restantes</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${launchPct}%`, background: launchRemaining > 20 ? "hsl(var(--accent))" : "hsl(var(--destructive))" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {launchRemaining > 0
            ? `L'offre à 99 € / an est encore disponible pour ${launchRemaining} entreprise${launchRemaining > 1 ? "s" : ""}.`
            : "L'offre de lancement est épuisée. Le tarif standard à 490 € / an s'applique désormais."}
        </p>
      </div>

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
          <p className="font-medium text-foreground text-sm mb-3">Nouveau code d'invitation — 12 mois gratuits</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="Ex : INVITE2025X"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={createCode} disabled={!newCode || creating} className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2">
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              Créer
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg mb-4">
          <AlertCircle size={14} className="text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Durée</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisé le</th>
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
                        {code.duration_months} mois
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {code.used_at ? new Date(code.used_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString("fr-FR") : "—"}
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
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Aucun code dans cette catégorie.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
