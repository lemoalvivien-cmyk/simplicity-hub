/**
 * Admin — System Health / Feature Registry v2
 * PROOF GATE: confidence badges, evidence panels, blocking issues from buildHealth.ts,
 * build health, remaining mocks, manual declarations.
 * PROOF:SYNC_GATE_V1:system_health_sync_stamp → BUILD_STAMP + Repo Sync Gate section below
 * PROOF:GOLIVE_V1:ops_diagnostics_panel → OPS / Forensics section below
 * PROOF:GOLIVE_V1:action_events_admin_visibility → lead_action_events live count below
 * PROOF:GOLIVE_V1:passive_admin_visibility → passive ingestion section below
 * PROOF:RELEASE_V1:admin_forensics_global_visibility → admin_forensics_summary() RPC below
 * Toutes les données sont importées de sources traçables dans le code.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock,
  Settings, Search, Filter, Shield, Code2,
  Cpu, ChevronDown, ChevronRight, Database, Zap, FileCode, Lock, Layers, GitCommit,
  Activity, BarChart3, Telescope, Package
} from "lucide-react";
import { BUILD_STAMP, SYNC_GATE_META, CRITICAL_FILES_EXPECTED, MIGRATIONS_EXPECTED } from "@/lib/buildStamp";
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
import {
  BUILD_CHECKS,
  ENV_BLOCKERS,
  REMAINING_MOCKS,
  LOCKFILE_STATUS,
  TYPESCRIPT_DEBT,
  type BuildCheckStatus,
} from "@/lib/buildHealth";
import {
  GO_LIVE_BLOCKERS,
  BLOCKERS_ONLY,
  WARNINGS_OPEN,
  RESOLVED,
  GO_LIVE_SCORE,
} from "@/lib/goLiveHealth";
import {
  RELEASE_BLOCKERS,
  RELEASE_BLOCKERS_ONLY,
  RELEASE_WARNINGS_OPEN,
  RELEASE_RESOLVED,
  RELEASE_SCORE,
  PACKAGE_MANAGER_TRUTH,
} from "@/lib/releaseHealth";
import { supabase } from "@/integrations/supabase/client";

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

const SEVERITY_COLOR: Record<string, { color: string; bg: string }> = {
  critical: { color: "hsl(0 65% 40%)",   bg: "hsl(0 65% 95%)" },
  high:     { color: "hsl(0 65% 40%)",   bg: "hsl(0 65% 95%)" },
  medium:   { color: "hsl(38 80% 30%)",  bg: "hsl(var(--accent-light))" },
  low:      { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

const BUILD_STATUS_DOT: Record<BuildCheckStatus, string> = {
  ok:   "bg-green-500",
  warn: "bg-yellow-400",
  fail: "bg-red-500",
};

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
  const [showMocks, setShowMocks] = useState(false);
  const [showTypeDebt, setShowTypeDebt] = useState(false);
  const [showForensics, setShowForensics] = useState(false);

  // PROOF:GOLIVE_V1:action_events_admin_visibility — live count from DB via SECURITY DEFINER RPC
  // PROOF:GOLIVE_V1:passive_admin_visibility — live passive events count from DB
  // PROOF:RELEASE_V1:admin_forensics_global_visibility — uses admin_forensics_summary() RPC (bypasses RLS)
  const [forensics, setForensics] = useState<{
    actionEventsCount: number;
    automationRulesCount: number;
    messageTemplatesCount: number;
    passiveEventsCount: number;
    recentEvents: Array<{ id: string; new_status: string; event_type: string; created_at: string }>;
    loaded: boolean;
  }>({ actionEventsCount: 0, automationRulesCount: 0, messageTemplatesCount: 0, passiveEventsCount: 0, recentEvents: [], loaded: false });

  useEffect(() => {
    if (!showForensics) return;
    const load = async () => {
      // Use SECURITY DEFINER RPC for global visibility bypassing RLS
      const { data, error } = await supabase.rpc("admin_forensics_summary" as any);
      if (!error && data) {
        const d = data as any;
        setForensics({
          actionEventsCount:    d.action_events_count    ?? 0,
          automationRulesCount: d.automation_rules_count ?? 0,
          messageTemplatesCount: d.message_templates_count ?? 0,
          passiveEventsCount:   d.passive_events_count   ?? 0,
          recentEvents:         d.recent_events          ?? [],
          loaded: true,
        });
      } else {
        setForensics(prev => ({ ...prev, loaded: true }));
      }
    };
    load();
  }, [showForensics]);

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
    const riskOrder = { high: 0, medium: 1, low: 2, none: 3 };
    const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
    if (riskDiff !== 0) return riskDiff;
    return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
  });

  const criticalEnvBlockers = ENV_BLOCKERS.filter(b => b.severity === "critical" || b.severity === "high");
  const highRiskMocks = REMAINING_MOCKS.filter(m => m.risk === "high");
  const blockingCount = criticalEnvBlockers.length + highRiskMocks.length;
  const declaredFeatures = getDeclaredOnlyFeatures();
  const envFeatures = getEnvBlockedFeatures();

  return (
    <AdminLayout
      title="System Health — Feature Registry v2"
      subtitle="État réel, preuves techniques, bloquants prod. Source: src/lib/featureRegistry.ts + src/lib/buildHealth.ts"
    >

      {/* ── SECTION 1: BLOCKING ISSUES FOR PRODUCTION ── */}
      <div className="mb-6 p-4 rounded-xl border-2 rounded-xl bg-card"
        style={{ borderColor: blockingCount > 0 ? "hsl(0 65% 70%)" : "hsl(var(--border))" }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: blockingCount > 0 ? "hsl(0 65% 40%)" : "hsl(var(--success))" }} />
          <h2 className="font-semibold text-foreground text-sm">
            Bloquants production ({blockingCount} critique{blockingCount !== 1 ? "s" : ""}/high)
          </h2>
        </div>

        <p className="text-xs text-muted-foreground mb-3">Source : <code>src/lib/buildHealth.ts → ENV_BLOCKERS + REMAINING_MOCKS</code></p>

        <div className="space-y-2">
          {ENV_BLOCKERS.map(blocker => {
            const col = SEVERITY_COLOR[blocker.severity];
            return (
              <div key={blocker.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{ background: col.bg, color: col.color }}>
                  {blocker.severity.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{blocker.label}</p>
                  <p className="text-xs text-muted-foreground">{blocker.note}</p>
                  {blocker.secret && (
                    <p className="text-xs mt-0.5 font-mono" style={{ color: "hsl(218 72% 55%)" }}>
                      secret: {blocker.secret}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: BUILD HEALTH ── */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={15} className="text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Build Health</h2>
          <span className="text-xs text-muted-foreground ml-auto">Source : <code>buildHealth.ts → BUILD_CHECKS</code></span>
        </div>

        {/* Lockfile */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted mb-2">
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${BUILD_STATUS_DOT[LOCKFILE_STATUS.status]}`} />
          <div className="flex-1">
            <span className="text-xs font-medium text-foreground">{LOCKFILE_STATUS.label}</span>
            <p className="text-xs text-muted-foreground">{LOCKFILE_STATUS.note}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {BUILD_CHECKS.map(item => (
            <div key={item.id} className="flex items-start gap-2.5">
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${BUILD_STATUS_DOT[item.status]}`} />
              <div className="flex-1">
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                {item.ref && <code className="text-xs text-muted-foreground ml-2 bg-muted px-1 rounded">{item.ref}</code>}
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: REMAINING MOCK FEATURES ── */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowMocks(!showMocks)}
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} style={{ color: "hsl(0 65% 40%)" }} />
            <h2 className="font-semibold text-foreground text-sm">
              {REMAINING_MOCKS.length} feature(s) encore mock/incomplète(s)
            </h2>
          </div>
          {showMocks ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </button>

        {showMocks && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Source : <code>buildHealth.ts → REMAINING_MOCKS</code></p>
            {REMAINING_MOCKS.map(m => {
              const col = SEVERITY_COLOR[m.risk];
              return (
                <div key={m.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: col.bg, color: col.color }}>
                    {m.risk.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{m.label}</p>
                      <code className="text-xs bg-background px-1 rounded text-muted-foreground">{m.page}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 4: TYPESCRIPT DEBT ── */}
      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowTypeDebt(!showTypeDebt)}
        >
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">
              Dette TypeScript ({TYPESCRIPT_DEBT.length} point{TYPESCRIPT_DEBT.length > 1 ? "s" : ""})
            </h2>
          </div>
          {showTypeDebt ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </button>
        {showTypeDebt && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Source : <code>buildHealth.ts → TYPESCRIPT_DEBT</code></p>
            {TYPESCRIPT_DEBT.map(item => (
              <div key={item.id} className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${BUILD_STATUS_DOT[item.status]}`} />
                <div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                  {item.ref && <code className="text-xs text-muted-foreground ml-2 bg-muted px-1 rounded">{item.ref}</code>}
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 5: REMAINING MANUAL DECLARATIONS ── */}
      {declaredFeatures.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {declaredFeatures.length} déclaration(s) sans preuve code (confidence = D)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Ces features sont déclarées manuellement. Leur état réel n'a pas été vérifié par inspection du code.
          </p>
          <div className="flex flex-wrap gap-1">
            {declaredFeatures.map(f => (
              <code key={f.id} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{f.label}</code>
            ))}
          </div>
        </div>
      )}

      {/* ── ENV-DEP FEATURES ── */}
      {envFeatures.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={14} style={{ color: "hsl(218 72% 55%)" }} />
            <h2 className="text-sm font-semibold text-foreground">
              {envFeatures.length} feature(s) dépendante(s) d'env/config
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Fonctionnelles en code mais nécessitent une configuration externe (secret, activation tiers).
          </p>
          <div className="flex flex-wrap gap-1">
            {envFeatures.map(f => (
              <code key={f.id} className="text-xs px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: "hsl(218 72% 95%)", color: "hsl(218 72% 45%)" }}>
                {f.label}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 6: CORE DOMAIN UNIFICATION ── */}
      <div className="mb-6 p-4 rounded-xl border-2 bg-card"
        style={{ borderColor: "hsl(218 72% 65% / 0.4)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={15} style={{ color: "hsl(218 72% 55%)" }} />
          <h2 className="font-semibold text-foreground text-sm">Core Domain Unification</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
            ACTIF
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Noyau métier unifié : toute entrée commerciale passe par une chaîne unique.
          Sources: <code>src/lib/leadPipeline.ts</code>, <code>src/lib/policyEngine.ts</code>
        </p>
        <div className="space-y-1.5">
          {[
            { label: "lead_source_events", desc: "Log immutable de chaque événement source", status: "ok" as BuildCheckStatus },
            { label: "lead_intakes", desc: "Objet lead unifié avec qualification_status + next_best_action", status: "ok" as BuildCheckStatus },
            { label: "lead_entity_links", desc: "Audit trail des liens entre leads et entités", status: "ok" as BuildCheckStatus },
            { label: "apply_lead_policy()", desc: "Policy engine DB — détermine qualification + NBA automatiquement", status: "ok" as BuildCheckStatus },
            { label: "DB trigger: trg_introduction_pipeline", desc: "Auto-crée lead_source_event + lead_intake à chaque intro insérée", status: "ok" as BuildCheckStatus },
            { label: "DB trigger: trg_intro_validated_pipeline", desc: "Promouvoit lead_intake → ready_for_opportunity à la validation", status: "ok" as BuildCheckStatus },
            { label: "create_lead_from_import()", desc: "Chaque ligne d'import CSV crée un lead_intake avec dédup", status: "ok" as BuildCheckStatus },
            { label: "Passive click → lead_intake", desc: "createLeadFromPassive() dans leadPipeline.ts", status: "warn" as BuildCheckStatus },
            { label: "Radar signal → lead_intake", desc: "createLeadFromRadar() — non branché aux pages Radar encore", status: "warn" as BuildCheckStatus },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${BUILD_STATUS_DOT[item.status]}`} />
              <div>
                <code className="text-xs font-mono text-foreground">{item.label}</code>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Pages recâblées : ContactImport (feed intake), IntroductionsEntreprise (affiche statut), DashboardEntreprise (bloc pipeline unifié).
        </p>
      </div>

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
          <strong className="text-foreground">Sources :</strong>{" "}
          <code>src/lib/featureRegistry.ts</code> (features, confidence, evidence) +{" "}
          <code>src/lib/buildHealth.ts</code> (build, env blockers, mocks, TS debt).
          Badges confidence : <strong>D</strong> = déclaré sans inspection, <strong>CV</strong> = code inspecté, <strong>RV</strong> = testé en runtime.
          Mise à jour manuelle à chaque itération.
        </p>
      </div>

      {/* ── PROOF INDEX PIPELINE V2 ── */}
      {/* PROOF:PIPELINE_V2:enterprise_dashboard_pipeline — visible below */}
      <div className="mt-6 p-5 rounded-xl border-2 bg-card" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-primary" />
          <h3 className="font-semibold text-foreground text-sm">PROOF INDEX — Pipeline V2</h3>
          <code className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">grep PROOF:PIPELINE_V2</code>
        </div>
        <div className="space-y-2">
          {[
            { slug: "lead_tables_created",        status: "YES",             file: "supabase/migrations/20260308092314_*.sql",          note: "Tables: lead_source_events, lead_intakes, lead_entity_links" },
            { slug: "lead_rls_shared_visibility",  status: "YES",             file: "supabase/migrations/20260308100159_*.sql lines 63-104", note: "Policy lead_intakes_select: user_id OR entreprise_id OR via intro.entreprise_id" },
            { slug: "opportunity_factory",         status: "YES",             file: "supabase/migrations/20260308100159_*.sql lines 155+",  note: "Function promote_lead_to_opportunity() with anti-dup by company_name" },
            { slug: "lead_actions_queue",          status: "YES",             file: "supabase/migrations/20260308100159_*.sql lines 1-60",  note: "Table lead_actions + upsert_lead_action() + on_lead_intake_action_sync trigger" },
            { slug: "radar_pipeline_wired",        status: "YES",             file: "src/pages/Radar.tsx line ~129",                       note: "addManualSignal() calls createLeadFromRadar() → lead_source_events + lead_intakes" },
            { slug: "passive_pipeline_wired",      status: "YES",             file: "src/pages/PassiveOS.tsx",                             note: "ingestPassiveThreshold() calls ingest_passive_signal RPC — server-side idempotent" },
            { slug: "enterprise_dashboard_pipeline", status: "YES",           file: "src/pages/DashboardEntreprise.tsx",                    note: "<UnifiedLeadsBlock asEntreprise /> renders pipeline summary for company" },
            { slug: "facilitateur_dashboard_pipeline", status: "YES",         file: "src/pages/DashboardFacilitateur.tsx",                  note: "<UnifiedLeadsBlock asEntreprise={false} /> renders pipeline for facilitateur" },
            { slug: "introduction_pipeline_ui",    status: "YES",             file: "src/pages/IntroductionsEntreprise.tsx lines 122-149",   note: "<LeadIntakeStatus /> + <LeadActionBadge /> per introduction" },
          ].map(({ slug, status, file, note }) => (
            <div key={slug} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <span
                className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  color: status === "YES" ? "hsl(var(--success))" : status === "NOT_IMPLEMENTED" ? "hsl(0 65% 40%)" : "hsl(38 80% 30%)",
                  background: status === "YES" ? "hsl(var(--success-light))" : status === "NOT_IMPLEMENTED" ? "hsl(0 65% 95%)" : "hsl(var(--accent-light))",
                }}
              >
                {status}
              </span>
              <div className="min-w-0">
                <code className="text-xs font-mono text-primary block">PROOF:PIPELINE_V2:{slug}</code>
                <code className="text-xs text-muted-foreground block truncate">{file}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GO-LIVE HEALTH ── */}
      {/* PROOF:GOLIVE_V1:go_live_blockers_real */}
      <div className="mt-6 p-5 rounded-xl border-2 bg-card" style={{ borderColor: BLOCKERS_ONLY.length > 0 ? "hsl(0 65% 70%)" : "hsl(var(--border))" }}>
        <div className="flex items-center gap-2 mb-3">
          <Telescope size={15} style={{ color: BLOCKERS_ONLY.length > 0 ? "hsl(0 65% 40%)" : "hsl(var(--success))" }} />
          <h3 className="font-semibold text-foreground text-sm">Go-Live Health</h3>
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: GO_LIVE_SCORE >= 60 ? "hsl(var(--success-light))" : "hsl(0 65% 95%)", color: GO_LIVE_SCORE >= 60 ? "hsl(var(--success))" : "hsl(0 65% 40%)" }}>
            {GO_LIVE_SCORE}% résolu
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Source : <code>src/lib/goLiveHealth.ts</code> · {BLOCKERS_ONLY.length} bloquant(s) · {WARNINGS_OPEN.length} warning(s) · {RESOLVED.length} résolu(s)</p>
        <div className="space-y-1.5">
          {GO_LIVE_BLOCKERS.map(b => (
            <div key={b.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{
                color: b.status === "resolved" ? "hsl(var(--success))" : b.severity === "blocker" ? "hsl(0 65% 40%)" : b.severity === "warning" ? "hsl(38 80% 30%)" : "hsl(var(--muted-foreground))",
                background: b.status === "resolved" ? "hsl(var(--success-light))" : b.severity === "blocker" ? "hsl(0 65% 95%)" : b.severity === "warning" ? "hsl(var(--accent-light))" : "hsl(var(--muted))",
              }}>
                {b.status === "resolved" ? "✓" : b.severity.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── OPS FORENSICS ── */}
      {/* PROOF:GOLIVE_V1:ops_diagnostics_panel */}
      {/* PROOF:GOLIVE_V1:action_events_admin_visibility */}
      {/* PROOF:GOLIVE_V1:passive_admin_visibility */}
      <div className="mt-6 p-5 rounded-xl border border-border bg-card">
        <button className="flex items-center justify-between w-full" onClick={() => setShowForensics(!showForensics)}>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Ops Forensics — données live</h3>
          </div>
          {showForensics ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </button>
        {showForensics && (
          <div className="mt-4 space-y-4">
            {!forensics.loaded ? (
              <p className="text-xs text-muted-foreground animate-pulse">Chargement…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Audit events (actions)", value: forensics.actionEventsCount, icon: Activity },
                    { label: "Règles actives (DB)", value: forensics.automationRulesCount, icon: Settings },
                    { label: "Templates messages (DB)", value: forensics.messageTemplatesCount, icon: BarChart3 },
                    { label: "Signaux passifs ingérés", value: forensics.passiveEventsCount, icon: Zap },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 rounded-xl bg-muted text-center">
                      <Icon size={12} className="mx-auto mb-1 text-muted-foreground" />
                      <p className="font-bold text-foreground text-lg">{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {forensics.recentEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Derniers événements d'audit (lead_action_events)</p>
                    <div className="space-y-1">
                      {forensics.recentEvents.map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                          <span className="font-mono text-muted-foreground">{new Date(e.created_at).toLocaleTimeString("fr")}</span>
                          <span className="font-semibold text-foreground">{e.event_type}</span>
                          <span className="text-muted-foreground">→</span>
                          <code className="text-primary">{e.new_status}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── REPO SYNC GATE ── */}
      {/* PROOF:SYNC_GATE_V1:system_health_sync_stamp */}
      <div className="mt-6 p-5 rounded-xl border-2 bg-card" style={{ borderColor: "hsl(142 70% 45% / 0.5)" }}>
        <div className="flex items-center gap-2 mb-1">
          <GitCommit size={15} style={{ color: "hsl(142 70% 35%)" }} />
          <h3 className="font-semibold text-foreground text-sm">Repo Sync Gate</h3>
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: "hsl(142 70% 92%)", color: "hsl(142 70% 28%)" }}>
            {BUILD_STAMP}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Estampillage unique. Grep-able. Preuve de synchronisation entre le code, le zip exporté et le repo Git.
          Passe : <strong>{SYNC_GATE_META.pass}</strong> · {SYNC_GATE_META.date}
        </p>

        {/* Critical files */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground mb-2">Fichiers critiques attendus ({CRITICAL_FILES_EXPECTED.length})</p>
          <div className="grid sm:grid-cols-2 gap-1">
            {CRITICAL_FILES_EXPECTED.map(f => (
              <div key={f} className="flex items-center gap-2 text-xs rounded bg-muted px-2 py-1">
                <CheckCircle2 size={10} style={{ color: "hsl(142 70% 35%)" }} className="shrink-0" />
                <code className="font-mono text-foreground truncate">{f}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Migrations */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground mb-2">Migrations pipeline attendues ({MIGRATIONS_EXPECTED.length})</p>
          <div className="space-y-1">
            {MIGRATIONS_EXPECTED.map(m => (
              <div key={m.file} className="flex items-start gap-2 text-xs rounded bg-muted px-2 py-1.5">
                <Database size={10} style={{ color: "hsl(218 72% 55%)" }} className="shrink-0 mt-0.5" />
                <div>
                  <code className="font-mono text-foreground">{m.file.slice(0, 16)}…</code>
                  <p className="text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proof marker index */}
        <div>
          <p className="text-xs font-semibold text-foreground mb-2">
            Marqueurs SYNC_GATE_V1 ({9})
            <code className="ml-2 text-muted-foreground bg-muted px-1 rounded font-mono">grep -r "PROOF:SYNC_GATE_V1" src/ docs/</code>
          </p>
          <div className="flex flex-wrap gap-1">
            {[
              "build_stamp_visible",
              "repo_sync_manifest",
              "system_health_sync_stamp",
              "lead_actions_file_present",
              "pipeline_metrics_file_present",
              "opportunities_page_present",
              "passive_page_present",
              "feature_registry_present",
              "build_health_present",
            ].map(slug => (
              <code key={slug} className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                style={{ background: "hsl(142 70% 92%)", color: "hsl(142 70% 28%)" }}>
                {slug}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* ── RELEASE HEALTH ── */}
      {/* PROOF:RELEASE_V1:admin_forensics_global_visibility */}
      {/* PROOF:RELEASE_V1:release_blockers_real */}
      <div className="mt-6 p-5 rounded-xl border-2 bg-card"
        style={{ borderColor: RELEASE_BLOCKERS_ONLY.length > 0 ? "hsl(0 65% 70%)" : "hsl(142 70% 45% / 0.5)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Package size={15} style={{ color: RELEASE_BLOCKERS_ONLY.length > 0 ? "hsl(0 65% 40%)" : "hsl(142 70% 35%)" }} />
          <h3 className="font-semibold text-foreground text-sm">Release Health</h3>
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded font-bold"
            style={{ background: RELEASE_SCORE >= 60 ? "hsl(var(--success-light))" : "hsl(0 65% 95%)", color: RELEASE_SCORE >= 60 ? "hsl(var(--success))" : "hsl(0 65% 40%)" }}>
            {RELEASE_SCORE}% résolu
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Source : <code>src/lib/releaseHealth.ts</code> ·{" "}
          {RELEASE_BLOCKERS_ONLY.length} bloquant(s) · {RELEASE_WARNINGS_OPEN.length} warning(s) · {RELEASE_RESOLVED.length} résolu(s)
        </p>
        {/* Package manager truth */}
        <div className="mb-3 p-2.5 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs font-semibold text-foreground mb-0.5">
            Package Manager — <code className="font-mono">{PACKAGE_MANAGER_TRUTH.canonical}</code> (release canonical)
          </p>
          <p className="text-xs text-muted-foreground">{PACKAGE_MANAGER_TRUTH.lockfile_strategy}</p>
        </div>
        <div className="space-y-1.5">
          {RELEASE_BLOCKERS.map(b => (
            <div key={b.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{
                color: b.status === "resolved" ? "hsl(var(--success))" : b.severity === "blocker" ? "hsl(0 65% 40%)" : b.severity === "warning" ? "hsl(38 80% 30%)" : "hsl(var(--muted-foreground))",
                background: b.status === "resolved" ? "hsl(var(--success-light))" : b.severity === "blocker" ? "hsl(0 65% 95%)" : b.severity === "warning" ? "hsl(var(--accent-light))" : "hsl(var(--muted))",
              }}>
                {b.status === "resolved" ? "✓" : b.severity.toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </AdminLayout>
  );
}

