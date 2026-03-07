/**
 * /system-proof — Source of Truth UI
 * Shows real build identity + manifest links + cron status.
 * Based exclusively on real repo state. No marketing.
 */
import UserLayout from "@/components/layout/UserLayout";
import { BUILD_INFO, FEATURE_FLAGS } from "@/lib/buildInfo";
import { useOpenClawCronDiagnostic } from "@/hooks/useOpenClawCronDiagnostic";
import { CheckCircle2, AlertTriangle, Clock, FileText, Cpu, Zap, Hash, Calendar, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

const STATE_COLORS: Record<string, string> = {
  live:      "hsl(var(--success, 142 76% 36%))",
  prepared:  "hsl(var(--warning, 38 92% 50%))",
  "env-dep": "hsl(var(--muted-foreground))",
};
const STATE_LABELS: Record<string, string> = {
  live:      "LIVE",
  prepared:  "PRÉPARÉ",
  "env-dep": "ENV-DEP",
};

export default function SystemProof() {
  const { jobs } = useOpenClawCronDiagnostic();

  const liveCount    = Object.values(FEATURE_FLAGS).filter(f => f.state === "live").length;
  const prepCount    = Object.values(FEATURE_FLAGS).filter(f => f.state === "prepared").length;
  const envDepCount  = Object.values(FEATURE_FLAGS).filter(f => f.state === "env-dep").length;
  const totalRoutes  = 58; // counted from ROUTES_MANIFEST.md
  const totalFns     = 21; // counted from EDGE_FUNCTIONS_MANIFEST.md

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            System Proof
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Source of truth embarquée. Basée sur le code réel du repo.
          </p>
        </div>

        {/* Build Identity */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Hash size={12} /> Build Identity
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Build ID",     value: BUILD_INFO.build_id,     icon: <Zap size={13} /> },
              { label: "Version",      value: BUILD_INFO.app_version,  icon: <GitBranch size={13} /> },
              { label: "Generated",    value: BUILD_INFO.generated_at.slice(0, 10), icon: <Calendar size={13} /> },
              { label: "Environment",  value: BUILD_INFO.environment,  icon: <Cpu size={13} /> },
              { label: "Git SHA",      value: BUILD_INFO.git_sha,      icon: <Hash size={13} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="rounded-lg bg-muted px-3 py-2">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
                  {icon} {label}
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Counts */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Features LIVE",    value: liveCount,   color: "hsl(142 76% 36%)" },
            { label: "Env-dépendantes",  value: envDepCount, color: "hsl(var(--muted-foreground))" },
            { label: "Routes actives",   value: totalRoutes, color: "hsl(var(--primary))" },
            { label: "Edge Functions",   value: totalFns,    color: "hsl(24 100% 52%)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-bold font-display" style={{ color }}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </section>

        {/* Cron Status */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Clock size={12} /> Cron Jobs (pg_cron)
          </h2>
          <div className="space-y-2">
            {jobs.map(job => {
              const status = job.last_cron_run_at
                ? ((Date.now() - new Date(job.last_cron_run_at).getTime()) < 10 * 60 * 1000
                    ? "✅ Actif récent"
                    : "⚠️ Observé (> 10min)")
                : "🔵 Configuré — non observé";
              return (
                <div key={job.run_key} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 gap-3">
                  <div>
                    <div className="text-xs font-semibold font-mono text-foreground">{job.jobname}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {job.schedule} · jobid:{job.jobid ?? "?"} · 📁 Repo: {job.defined_in_repo ? "✓" : "✗"}
                    </div>
                  </div>
                  <span className="text-xs font-medium shrink-0">{status}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Manifest Sample */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <CheckCircle2 size={12} /> Feature Manifest (extrait)
          </h2>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {Object.entries(FEATURE_FLAGS).map(([key, feat]) => (
              <div key={key} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/40 last:border-0">
                <span className="font-mono text-foreground">{key}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold"
                    style={{ background: STATE_COLORS[feat.state] }}
                  >
                    {STATE_LABELS[feat.state]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Manifests Links */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText size={12} /> Manifests versionnés (docs/)
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { label: "REPO_TRUTH_MANIFEST.md",     path: "docs/REPO_TRUTH_MANIFEST.md",      desc: "Pages, routes, hooks, tables" },
              { label: "OPENCLAW_TRUTH_MANIFEST.md", path: "docs/OPENCLAW_TRUTH_MANIFEST.md",  desc: "OpenClaw complet" },
              { label: "CRON_RUNTIME_MANIFEST.md",   path: "docs/CRON_RUNTIME_MANIFEST.md",    desc: "Cron jobs, schedules, preuve" },
              { label: "ROUTES_MANIFEST.md",         path: "docs/ROUTES_MANIFEST.md",          desc: "Toutes les routes" },
              { label: "EDGE_FUNCTIONS_MANIFEST.md", path: "docs/EDGE_FUNCTIONS_MANIFEST.md",  desc: "21 edge functions" },
              { label: "cron-jobs.md",               path: "supabase/infra/cron-jobs.md",       desc: "Script re-création cron" },
            ].map(({ label, path, desc }) => (
              <div key={path} className="rounded-lg bg-muted px-3 py-2.5">
                <div className="text-xs font-mono font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                <div className="text-[10px] text-muted-foreground/60 mt-1">{path}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest limits */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertTriangle size={12} /> Ce qui reste dépendant de l'environnement
          </h2>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Les cron jobs pg_cron sont en base distante — doivent être recréés manuellement sur un nouveau projet (voir cron-jobs.md)</li>
            <li>• <span className="font-mono">daily_sweep</span> et <span className="font-mono">weekly_sweep</span> : configurés, pas encore observés (fenêtres 7h UTC / lundi 6h)</li>
            <li>• <span className="font-mono">openclaw-gateway</span> : inactif sans <span className="font-mono">gateway_url</span> configuré par l'utilisateur</li>
            <li>• Secrets Stripe + ElevenLabs : configurés dans Lovable Cloud secrets (non versionnés)</li>
            <li>• Les jobs métier OpenClaw produisent des outputs uniquement si la data utilisateur (dossier, missions, contacts) est présente</li>
          </ul>
        </section>

        {/* Links */}
        <div className="flex gap-3 flex-wrap">
          <Link to="/operations" className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium">
            → Operations Runtime
          </Link>
          <Link to="/war-room" className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-medium">
            → War Room
          </Link>
          <Link to="/agents" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-medium">
            → Agents OS
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
