import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Plus, Copy, CheckCircle2, XCircle, Clock, Tag,
  Loader2, AlertCircle, Zap, Search, User, Calendar,
  Download, RefreshCw, Filter
} from "lucide-react";
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
  disabled_at?: string | null;
}

interface CodeWithUser extends PromoCode {
  user_email?: string;
  redemption_end_at?: string;
}

const STATUS_CONFIG: Record<CodeStatus, { badge: string; label: string; icon: typeof CheckCircle2 }> = {
  actif:      { badge: "badge-success", label: "Actif",      icon: CheckCircle2 },
  utilisé:    { badge: "badge-warning", label: "Utilisé",    icon: Tag },
  expiré:     { badge: "badge-muted",   label: "Expiré",     icon: Clock },
  désactivé:  { badge: "badge-muted",   label: "Désactivé",  icon: XCircle },
};

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<CodeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"tous" | CodeStatus>("tous");
  const [search, setSearch] = useState("");
  const [launchUsed, setLaunchUsed] = useState(0);
  const [launchTotal, setLaunchTotal] = useState(100);

  const loadCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const [codesRes, quotaRes, redemptionsRes] = await Promise.all([
        db.from("promo_codes").select("*").order("created_at", { ascending: false }),
        db.from("launch_quota").select("total_slots, used_slots").single(),
        db.from("promo_code_redemptions").select("promo_code_id, end_at, user_id"),
      ]);
      if (codesRes.error) throw codesRes.error;

      // Enrich with redemption data
      const redemptionMap: Record<string, { end_at: string; user_id: string }> = {};
      for (const r of (redemptionsRes.data || [])) {
        redemptionMap[r.promo_code_id] = { end_at: r.end_at, user_id: r.user_id };
      }

      const enriched: CodeWithUser[] = (codesRes.data || []).map((c: PromoCode) => ({
        ...c,
        redemption_end_at: redemptionMap[c.id]?.end_at || undefined,
      }));

      setCodes(enriched);
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
      payload.expires_at = newExpiry
        ? new Date(newExpiry).toISOString()
        : new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(); // 2 years

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
      else update.disabled_at = null;
      const { error: err } = await db.from("promo_codes").update(update).eq("id", id);
      if (err) throw err;
      await loadCodes();
      toast.success(newStatus === "désactivé" ? "Code désactivé" : "Code réactivé");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const exportCSV = () => {
    const headers = ["Code", "Statut", "Durée (mois)", "Utilisé le", "Expiration", "Accès jusqu'au"];
    const rows = codes.map(c => [
      c.code,
      c.status,
      String(c.duration_months),
      c.used_at ? new Date(c.used_at).toLocaleDateString("fr-FR") : "",
      c.expires_at ? new Date(c.expires_at).toLocaleDateString("fr-FR") : "",
      c.redemption_end_at ? new Date(c.redemption_end_at).toLocaleDateString("fr-FR") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codes-wiinup-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export téléchargé !");
  };

  const filtered = useMemo(() => {
    let list = filter === "tous" ? codes : codes.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter(c => c.code.toUpperCase().includes(q));
    }
    return list;
  }, [codes, filter, search]);

  const launchRemaining = Math.max(0, launchTotal - launchUsed);
  const launchPct = Math.min(100, (launchUsed / launchTotal) * 100);

  const stats = [
    { label: "Total créés", value: codes.length, color: "text-primary" },
    { label: "Actifs", value: codes.filter(c => c.status === "actif").length, color: "text-success" },
    { label: "Utilisés", value: codes.filter(c => c.status === "utilisé").length, color: "text-accent" },
    { label: "Inactifs", value: codes.filter(c => c.status === "expiré" || c.status === "désactivé").length, color: "text-muted-foreground" },
  ];

  return (
    <AdminLayout title="Codes d'invitation" subtitle="300 codes VIP1AN — 12 mois gratuits chacun.">

      {/* Launch quota */}
      <div className="card-surface p-5 mb-5 border-2 border-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-accent" />
          <h3 className="font-semibold text-foreground text-sm">Offre de lancement payante — 100 premières entreprises</h3>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{launchUsed} places utilisées sur {launchTotal}</span>
          <span className="font-semibold text-foreground">{launchRemaining} restantes</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${launchPct}%`,
              background: launchRemaining > 20 ? "hsl(var(--accent))" : "hsl(var(--destructive))"
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {launchRemaining > 0
            ? `L'offre à 99 € / an est disponible pour encore ${launchRemaining} entreprise${launchRemaining > 1 ? "s" : ""}.`
            : "L'offre de lancement est épuisée. Le tarif standard à 490 € / an s'applique."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="stat-card text-center">
            <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un code…"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring w-44"
            />
          </div>
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
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={loadCodes} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Rafraîchir">
            <RefreshCw size={14} />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download size={13} />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-cta text-xs px-3 py-2 flex items-center gap-1.5 shrink-0"
          >
            <Plus size={13} />
            Nouveau code
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-surface p-4 mb-4 border-2 border-accent/30 animate-fade-in">
          <p className="font-medium text-foreground text-sm mb-3">Créer un code d'invitation — 12 mois gratuits</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="Ex : PARTNER-2025-VIP"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              placeholder="Expiration (optionnel)"
              className="px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={createCode}
              disabled={!newCode || creating}
              className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              Créer
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Annuler
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Par défaut : expiration dans 2 ans si non précisée.</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg mb-4">
          <AlertCircle size={14} className="text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
        <Filter size={11} />
        {filtered.length} code{filtered.length > 1 ? "s" : ""} affichés
      </div>

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
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Utilisé le</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Accès jusqu'au</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Expire le</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((code) => {
                  const config = STATUS_CONFIG[code.status] || STATUS_CONFIG.actif;
                  return (
                    <tr key={code.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs font-semibold text-foreground tracking-wider">
                            {code.code}
                          </code>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={config.badge}>{config.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                        {code.used_at
                          ? <span className="flex items-center gap-1">
                              <User size={11} />
                              {new Date(code.used_at).toLocaleDateString("fr-FR")}
                            </span>
                          : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs hidden lg:table-cell">
                        {code.redemption_end_at
                          ? <span className="text-success font-medium flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(code.redemption_end_at).toLocaleDateString("fr-FR")}
                            </span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => copyCode(code.id, code.code)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Copier le code"
                          >
                            {copiedId === code.id
                              ? <CheckCircle2 size={13} className="text-success" />
                              : <Copy size={13} />}
                          </button>
                          {(code.status === "actif" || code.status === "désactivé") && (
                            <button
                              onClick={() => toggleStatus(code.id, code.status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                code.status === "actif"
                                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  : "bg-success-light text-success hover:bg-success-light/80"
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
            <Tag size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Aucun code dans cette catégorie.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
