/**
 * Admin — System Health / Feature Registry
 * Vue diagnostic admin : état réel de chaque fonctionnalité.
 * Accessible uniquement aux admins via /admin/system-health.
 */
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Settings, Search, Filter
} from "lucide-react";
import {
  FEATURE_REGISTRY,
  STATUS_META,
  FeatureStatus,
  OwnerArea,
  type FeatureEntry
} from "@/lib/featureRegistry";

const AREA_LABELS: Record<OwnerArea, string> = {
  acquisition:    "Acquisition",
  onboarding:     "Onboarding",
  billing:        "Facturation",
  contacts:       "Contacts",
  campaigns:      "Campagnes",
  referral:       "Apport d'affaires",
  passive_os:     "Passive OS",
  openclaw:       "OpenClaw",
  admin:          "Admin",
  analytics:      "Analytics",
  settings:       "Paramètres",
  infrastructure: "Infrastructure",
};

const STATUS_ICON: Record<FeatureStatus, React.ReactNode> = {
  real:      <CheckCircle2 size={13} />,
  partial:   <AlertTriangle size={13} />,
  mock:      <XCircle size={13} />,
  dead:      <Clock size={13} />,
  "env-dep": <Settings size={13} />,
};

const STATUS_ORDER: FeatureStatus[] = ["mock", "partial", "env-dep", "dead", "real"];

function FeatureRow({ f }: { f: FeatureEntry }) {
  const meta = STATUS_META[f.status];
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-md" style={{ color: meta.color, background: meta.bg }}>
          {STATUS_ICON[f.status]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{f.label}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.bg }}>
              {meta.label}
            </span>
            {f.risk !== "none" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: f.risk === "high" ? "hsl(0 65% 40%)" : "hsl(38 80% 30%)",
                  background: f.risk === "high" ? "hsl(0 65% 95%)" : "hsl(var(--accent-light))",
                }}>
                risque {f.risk}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.note}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {f.pages.map(p => (
            <code key={p} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{p}</code>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSystemHealth() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FeatureStatus | "all">("all");
  const [filterArea, setFilterArea] = useState<OwnerArea | "all">("all");

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = FEATURE_REGISTRY.filter(f => f.status === s).length;
    return acc;
  }, {} as Record<FeatureStatus, number>);

  const filtered = FEATURE_REGISTRY.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.label.toLowerCase().includes(q) || f.note.toLowerCase().includes(q) || f.pages.some(p => p.includes(q));
    const matchStatus = filterStatus === "all" || f.status === filterStatus;
    const matchArea   = filterArea === "all" || f.area === filterArea;
    return matchSearch && matchStatus && matchArea;
  }).sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <AdminLayout
      title="System Health — Feature Registry"
      subtitle="État réel de chaque fonctionnalité. Aucune donnée inventée."
    >
      {/* Résumé statuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUS_ORDER.map(s => {
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className="stat-card text-center cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: filterStatus === s ? meta.color : undefined, borderWidth: filterStatus === s ? 2 : 1 }}
            >
              <p className="font-display text-2xl font-bold" style={{ color: meta.color }}>{counts[s] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une fonctionnalité, une page…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-muted-foreground" />
          <select
            value={filterArea}
            onChange={e => setFilterArea(e.target.value as OwnerArea | "all")}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none"
          >
            <option value="all">Toutes les zones</option>
            {(Object.keys(AREA_LABELS) as OwnerArea[]).map(a => (
              <option key={a} value={a}>{AREA_LABELS[a]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Résultats */}
      <div className="text-xs text-muted-foreground mb-3">
        {filtered.length} fonctionnalité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        {filterStatus !== "all" && ` — filtre : ${STATUS_META[filterStatus].label}`}
      </div>

      <div className="space-y-2">
        {filtered.map(f => <FeatureRow key={f.id} f={f} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">
          Aucune fonctionnalité correspondant à ce filtre.
        </div>
      )}

      {/* Note de bas de page */}
      <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Source :</strong> <code>src/lib/featureRegistry.ts</code> — mise à jour manuelle à chaque itération produit.
          Cette page ne remplace pas le monitoring runtime (Operations, War Room) — elle documente l'état <em>fonctionnel</em> du produit.
        </p>
      </div>
    </AdminLayout>
  );
}
