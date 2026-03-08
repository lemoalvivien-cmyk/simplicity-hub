/**
 * Admin — System Health / Feature Registry v2
 * Foundation Lock: confidence tiers, evidence pointers, blocking issues, build health.
 * Accessible uniquement aux admins via /admin/system-health.
 */
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Settings, Search, Filter, Shield, Code2,
  Cpu, ChevronDown, ChevronRight, Database, Zap, FileCode
} from "lucide-react";
import {
  FEATURE_REGISTRY,
  STATUS_META,
  CONFIDENCE_META,
  FeatureStatus,
  FeatureConfidence,
  OwnerArea,
  type FeatureEntry,
  getHighRiskFeatures,
  getEnvBlockedFeatures,
  getDeclaredOnlyFeatures,
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

// Blocking conditions for production
const BLOCKING_ISSUES = [
  { id: "stripe_webhook_secret", label: "STRIPE_WEBHOOK_SECRET non vérifié", severity: "critical", desc: "Les webhooks Stripe ne sont pas sécurisés en production sans cette variable." },
  { id: "regles_mock", label: "Règles d'automatisation = Mock", severity: "high", desc: "Les règles affichées ne font rien. L'utilisateur pense contrôler l'automatisation." },
  { id: "campaign_sequences_dead", label: "Séquences campagne absentes", severity: "medium", desc: "Le concept de campagne manque sa pièce centrale. Actuellement signalé honnêtement." },
  { id: "declared_only_features", label: `${getDeclaredOnlyFeatures().length} feature(s) déclarée(s) sans preuve code`, severity: "low", desc: "Leur état réel n'est pas vérifié par inspection du code." },
];

const BUILD_HEALTH = [
  { label: "Build dev", status: "ok",      note: "vite build --mode development → OK" },
  { label: "PWA precache", status: "ok",   note: "maximumFileSizeToCacheInBytes = 4MiB — au-dessus du bundle actuel 2.1MiB" },
  { label: "TypeScript",  status: "warn",  note: "strictNullChecks=false dans tsconfig — pas d'erreur bloquante mais fragilité latente" },
  { label: "any paresseux critique", status: "ok", note: "ContactImport et CampagneDetail migrent de db (any) vers supabase typé" },
  { label: "import dynamique aiService", status: "warn", note: "supabase/client importé dynamiquement dans aiService + statiquement ailleurs — avertissement rollup non bloquant" },
];

function ConfidenceBadge({ c }: { c: FeatureConfidence }) {
  const meta = CONFIDENCE_META[c];
  return (
    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ color: meta.color, background: meta.bg }}>
      {meta.short}
    </span>
  );
}

function EvidencePanel({ f }: { f: FeatureEntry }) {
  const [open, setOpen] = useState(false);
  const hasEvidence = f.evidence.tables?.length || f.evidence.edgeFunctions?.length || f.evidence.codeFiles?.length || f.evidence.note;
  if (!hasEvidence) return null;
  return (
    <div className="mt-1.5">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        Preuves techniques
      </button>
      {open && (
        <div className="mt-1.5 pl-3 space-y-1 border-l-2 border-border">
          {f.evidence.tables?.map(t => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database size={10} className="shrink-0" />
              <code className="bg-muted px-1 rounded">{t}</code>
            </div>
          ))}
          {f.evidence.edgeFunctions?.map(fn => (
            <div key={fn} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap size={10} className="shrink-0" />
              <code className="bg-muted px-1 rounded">{fn}</code>
            </div>
          ))}
          {f.evidence.codeFiles?.map(cf => (
            <div key={cf} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileCode size={10} className="shrink-0" />
              <code className="bg-muted px-1 rounded text-xs">{cf.replace("src/", "")}</code>
            </div>
          ))}
          {f.evidence.note && (
            <p className="text-xs text-muted-foreground italic">{f.evidence.note}</p>
          )}
        </div>
      )}
    </div>
  );
}

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
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <ConfidenceBadge c={f.confidence} />
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
        <EvidencePanel f={f} />
      </div>
    </div>
  );
}

export default function AdminSystemHealth() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FeatureStatus | "all">("all");
  const [filterArea, setFilterArea] = useState<OwnerArea | "all">("all");
  const [filterConfidence, setFilterConfidence] = useState<FeatureConfidence | "all">("all");

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = FEATURE_REGISTRY.filter(f => f.status === s).length;
    return acc;
  }, {} as Record<FeatureStatus, number>);

  const filtered = FEATURE_REGISTRY.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.label.toLowerCase().includes(q) || f.note.toLowerCase().includes(q) || f.pages.some(p => p.includes(q));
    const matchStatus = filterStatus === "all" || f.status === filterStatus;
    const matchArea   = filterArea === "all" || f.area === filterArea;
    const matchConf   = filterConfidence === "all" || f.confidence === filterConfidence;
    return matchSearch && matchStatus && matchArea && matchConf;
  }).sort((a, b) => {
    // Sort: by risk first (high > medium > low > none), then by status order
    const riskOrder = { high: 0, medium: 1, low: 2, none: 3 };
    const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
    if (riskDiff !== 0) return riskDiff;
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  const blockingCount = BLOCKING_ISSUES.filter(i => i.severity === "critical" || i.severity === "high").length;

  return (
    <AdminLayout
      title="System Health — Feature Registry v2"
      subtitle="État réel, preuves techniques, bloquants prod. Aucune donnée inventée."
    >
      {/* ── BLOCKING ISSUES ── */}
      <div className="mb-6 p-4 rounded-xl border-2 border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: blockingCount > 0 ? "hsl(0 65% 40%)" : "hsl(var(--success))" }} />
          <h2 className="font-semibold text-foreground text-sm">
            Bloquants production ({blockingCount} critique{blockingCount > 1 ? "s" : ""}/high)
          </h2>
        </div>
        <div className="space-y-2">
          {BLOCKING_ISSUES.map(issue => (
            <div key={issue.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                style={{
                  background: issue.severity === "critical" ? "hsl(0 65% 95%)" : issue.severity === "high" ? "hsl(0 65% 95%)" : issue.severity === "medium" ? "hsl(var(--accent-light))" : "hsl(var(--muted))",
                  color: issue.severity === "critical" || issue.severity === "high" ? "hsl(0 65% 40%)" : issue.severity === "medium" ? "hsl(38 80% 30%)" : "hsl(var(--muted-foreground))",
                }}>
                {issue.severity.toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">{issue.label}</p>
                <p className="text-xs text-muted-foreground">{issue.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BUILD HEALTH ── */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={15} className="text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Build Health</h2>
        </div>
        <div className="space-y-1.5">
          {BUILD_HEALTH.map(item => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === "ok" ? "bg-green-500" : "bg-yellow-400"}`} />
              <span className="text-xs font-medium text-foreground w-36 shrink-0">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DÉCLARATIONS MANUELLES RESTANTES ── */}
      {getDeclaredOnlyFeatures().length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {getDeclaredOnlyFeatures().length} déclaration(s) sans preuve code
            </h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {getDeclaredOnlyFeatures().map(f => (
              <code key={f.id} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{f.label}</code>
            ))}
          </div>
        </div>
      )}

      {/* ── RÉSUMÉ STATUTS ── */}
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

      {/* ── FILTRES ── */}
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
            <option value="all">Toutes zones</option>
            {(Object.keys(AREA_LABELS) as OwnerArea[]).map(a => (
              <option key={a} value={a}>{AREA_LABELS[a]}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterConfidence}
            onChange={e => setFilterConfidence(e.target.value as FeatureConfidence | "all")}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none"
          >
            <option value="all">Toute confiance</option>
            <option value="declared">Déclaré (D)</option>
            <option value="code-verified">Code vérifié (CV)</option>
            <option value="runtime-verified">Runtime vérifié (RV)</option>
          </select>
        </div>
      </div>

      {/* Légende confidence */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        {(["declared", "code-verified", "runtime-verified"] as FeatureConfidence[]).map(c => {
          const meta = CONFIDENCE_META[c];
          return (
            <span key={c} className="flex items-center gap-1.5">
              <span className="font-mono font-bold px-1.5 py-0.5 rounded text-xs" style={{ color: meta.color, background: meta.bg }}>{meta.short}</span>
              {meta.label}
            </span>
          );
        })}
      </div>

      {/* ── RÉSULTATS ── */}
      <div className="text-xs text-muted-foreground mb-3">
        {filtered.length} fonctionnalité{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        {filterStatus !== "all" && ` — filtre : ${STATUS_META[filterStatus].label}`}
        {filterConfidence !== "all" && ` — confiance : ${CONFIDENCE_META[filterConfidence].label}`}
      </div>

      <div className="space-y-2">
        {filtered.map(f => <FeatureRow key={f.id} f={f} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">
          Aucune fonctionnalité correspondant à ce filtre.
        </div>
      )}

      {/* ── NOTE DE BAS DE PAGE ── */}
      <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Source :</strong> <code>src/lib/featureRegistry.ts</code> — mise à jour manuelle à chaque itération produit.
          Badges : <strong>D</strong> = déclaré sans inspection, <strong>CV</strong> = code inspecté et confirmé, <strong>RV</strong> = testé en runtime réel.
          Cette page ne remplace pas le monitoring runtime (Operations, War Room).
        </p>
      </div>
    </AdminLayout>
  );
}
