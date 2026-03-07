/**
 * Boîte de validation — Approvals centrales OpenClaw
 * Chaque validation montre : agent, canal, run, motif, risque, délai
 * UX premium, zéro jargon technique
 */
import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Eye,
  ChevronRight, Shield, MessageSquare, Zap, Send,
  Info, Filter, Sparkles, AlertCircle, Brain, Radio,
  Wifi, Lock, RefreshCw, Database, Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOpenClaw, OpenClawValidation } from "@/hooks/useOpenClaw";
import { useOpenClawRuntime, CHANNEL_STATUS_META } from "@/hooks/useOpenClawRuntime";
import { useOpenClawRuns, RUN_TYPE_LABELS } from "@/hooks/useOpenClawRuns";

// ── Risque meta ───────────────────────────────────────────────────────────────
const RISQUE_META = {
  faible: { label: "Risque faible", bg: "hsl(var(--success-light))", color: "hsl(var(--success))", Icon: CheckCircle2 },
  moyen:  { label: "Risque modéré", bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)", Icon: AlertTriangle },
  eleve:  { label: "Risque élevé",  bg: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)", Icon: AlertCircle },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  message:      MessageSquare,
  campagne:     Send,
  action:       Zap,
  introduction: Send,
  gain:         ChevronRight,
  blocage:      Shield,
};

// Agent labels (translated from IDs to human names)
const AGENT_LABELS: Record<string, { label: string; icon: string }> = {
  signal_hunter:       { label: "Chasseur de signaux",   icon: "🎯" },
  opportunity_builder: { label: "Constructeur d'opportunités", icon: "🏗️" },
  matchmaker:          { label: "Connecteur",             icon: "🤝" },
  message_crafter:     { label: "Rédacteur",              icon: "✍️" },
  passive_distributor: { label: "Distribution passive",  icon: "🌐" },
  validator:           { label: "Validateur",             icon: "✅" },
  trust_sentinel:      { label: "Sentinelle confiance",  icon: "🛡️" },
  brief_writer:        { label: "Analyste",               icon: "📋" },
  system:              { label: "Système",                icon: "⚙️" },
};

function formatFuture(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Expirée";
  if (diff < 3600000) return `Expire dans ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `Expire dans ${Math.floor(diff / 3600000)}h`;
  return `Expire dans ${Math.floor(diff / 86400000)}j`;
}

type FilterType = "tout" | "en_attente" | "validee" | "refusee";

// ── Carte de validation enrichie ───────────────────────────────────────────────
function ValidationCard({
  v,
  onApprove,
  onReject,
  processing,
  channelForVal,
  runForVal,
}: {
  v: OpenClawValidation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  processing: string | null;
  channelForVal?: { channel_name: string; status: string } | null;
  runForVal?: { run_type: string; summary?: string | null } | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const risqueMeta = RISQUE_META[v.risque] ?? RISQUE_META.faible;
  const RisqueIcon = risqueMeta.Icon;
  const TypeIcon = TYPE_ICONS[v.type_validation] ?? Eye;
  const isProcessing = processing === v.id;
  const agentMeta = AGENT_LABELS[v.agent_id] ?? { label: v.agent_id, icon: "🤖" };
  const channelMeta = channelForVal ? CHANNEL_STATUS_META[channelForVal.status] : null;

  const statusStyle = {
    en_attente: { bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)", label: "En attente" },
    validee:    { bg: "hsl(var(--success-light))", color: "hsl(var(--success))", label: "Approuvée" },
    refusee:    { bg: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)", label: "Refusée" },
    expiree:    { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: "Expirée" },
  }[v.statut] ?? { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: v.statut };

  return (
    <div className="card-surface overflow-hidden"
      style={v.statut !== "en_attente" ? { opacity: 0.72 } : undefined}>

      {/* Bande de risque */}
      <div className="h-1" style={{ background: risqueMeta.color }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: risqueMeta.bg }}>
            <TypeIcon size={15} style={{ color: risqueMeta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-foreground leading-snug">{v.titre}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {v.statut === "en_attente" && <Radio size={8} className="animate-pulse" />}
                {statusStyle.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(v.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Contexte enrichi : agent + canal + run */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Agent */}
          <div className="rounded-xl p-2 text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-base mb-0.5">{agentMeta.icon}</p>
            <p className="text-xs font-medium text-foreground truncate">{agentMeta.label}</p>
            <p className="text-xs text-muted-foreground">Agent</p>
          </div>
          {/* Canal */}
          <div className="rounded-xl p-2 text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-base mb-0.5">
              {channelForVal?.channel_name === "WhatsApp Business" ? "💬"
               : channelForVal?.channel_name === "Email" ? "📧"
               : channelForVal?.channel_name === "Introduction" ? "🤝"
               : "📡"}
            </p>
            <p className="text-xs font-medium text-foreground truncate">
              {channelForVal?.channel_name ?? "Système"}
            </p>
            {channelMeta && (
              <p className="text-xs font-semibold" style={{ color: channelMeta.color }}>{channelMeta.label}</p>
            )}
          </div>
          {/* Run / Cycle */}
          <div className="rounded-xl p-2 text-center" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-base mb-0.5">
              {runForVal ? (RUN_TYPE_LABELS[runForVal.run_type]?.icon ?? "⚙️") : "💤"}
            </p>
            <p className="text-xs font-medium text-foreground truncate">
              {runForVal ? (RUN_TYPE_LABELS[runForVal.run_type]?.label ?? runForVal.run_type) : "Aucun cycle"}
            </p>
            <p className="text-xs text-muted-foreground">Cycle</p>
          </div>
        </div>

        {/* Risque */}
        <div className="flex items-center gap-1.5 mb-3">
          <RisqueIcon size={12} style={{ color: risqueMeta.color }} />
          <span className="text-xs font-semibold" style={{ color: risqueMeta.color }}>{risqueMeta.label}</span>
          {v.statut === "en_attente" && (
            <span className="ml-auto text-xs text-muted-foreground">
              {formatFuture((v as unknown as Record<string, unknown>).expires_at as string | null)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{v.description}</p>

        {/* Conséquences */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl p-2.5" style={{ background: "hsl(var(--success-light))" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: "hsl(var(--success))" }}>Si j'approuve</p>
            <p className="text-xs text-foreground leading-snug">{v.consequence_valide}</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: "hsl(0 65% 95%)" }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: "hsl(0 65% 40%)" }}>Si je refuse</p>
            <p className="text-xs text-foreground leading-snug">{v.consequence_refuse}</p>
          </div>
        </div>

        {/* Détails toggle */}
        {v.details?.length > 0 && (
          <button className="text-xs text-muted-foreground flex items-center gap-1 mb-3"
            onClick={() => setExpanded(!expanded)}>
            <Eye size={11} /> Voir les détails
            <ChevronRight size={11} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}
        {expanded && v.details?.length > 0 && (
          <ul className="mb-3 space-y-1">
            {v.details.map((d, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "hsl(var(--muted-foreground))" }} />
                <span className="text-xs text-muted-foreground">{d}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Mémoire hint */}
        {v.statut !== "en_attente" && (
          <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs mb-3"
            style={{ background: "hsl(var(--muted))" }}>
            <Database size={10} className="text-primary shrink-0" />
            <span className="text-muted-foreground">
              Cette décision a été enregistrée dans la mémoire du cerveau pour améliorer les prochaines décisions.
            </span>
          </div>
        )}

        {/* Actions */}
        {v.statut === "en_attente" && (
          <div className="flex gap-2">
            <button onClick={() => onReject(v.id)} disabled={isProcessing}
              className="flex-1 text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
              {isProcessing ? <RefreshCw size={11} className="mx-auto animate-spin" /> : "Refuser"}
            </button>
            <button onClick={() => onApprove(v.id)} disabled={isProcessing}
              className="flex-1 text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {isProcessing ? <RefreshCw size={11} className="mx-auto animate-spin" /> : "Approuver ✓"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ────────────────────────────────────────────────────────────
export default function Validations() {
  const [filter, setFilter] = useState<FilterType>("en_attente");
  const [processing, setProcessing] = useState<string | null>(null);
  const { validations, pendingValidations, loading, processValidation } = useOpenClaw();
  const { channels } = useOpenClawRuntime();
  const { runs } = useOpenClawRuns();

  const filtered = validations.filter((v) => filter === "tout" || v.statut === filter);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    await processValidation(id, "approve");
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    await processValidation(id, "reject");
    setProcessing(null);
  };

  // Trouver le canal et le run associés à une validation (par agent_id / type)
  const getContextForValidation = (v: OpenClawValidation) => {
    const payload = v.payload as Record<string, unknown>;
    const channelId = payload?.channel_id as string | undefined;
    const runId = payload?.run_id as string | undefined;

    const channelForVal = channelId
      ? channels.find(c => c.channel_id === channelId) ?? null
      : channels.find(c => c.is_ready) ?? null;

    const runForVal = runId
      ? runs.find(r => r.id === runId) ?? null
      : runs.find(r => r.agent_names?.includes(v.agent_id)) ?? null;

    return { channelForVal, runForVal };
  };

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "en_attente", label: `En attente${pendingValidations.length > 0 ? ` (${pendingValidations.length})` : ""}` },
    { id: "validee",    label: "Approuvées" },
    { id: "refusee",    label: "Refusées" },
    { id: "tout",       label: "Tout" },
  ];

  if (loading) {
    return (
      <UserLayout jarvisContext="agents">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Brain size={20} className="animate-pulse" />
            <span className="text-sm">Chargement…</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(38 80% 90%)" }}>
            <Shield size={20} style={{ color: "hsl(38 80% 30%)" }} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">Approbations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingValidations.length > 0
                ? `${pendingValidations.length} action${pendingValidations.length > 1 ? "s" : ""} attend${pendingValidations.length > 1 ? "ent" : ""} votre décision`
                : "Tout est à jour — vous êtes en avance sur votre cerveau ✓"}
            </p>
          </div>
          <Link to="/war-room"
            className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 bg-muted hover:bg-secondary transition-colors">
            <Activity size={12} className="text-primary" />
            War Room
          </Link>
        </div>

        {/* ── Contexte pédagogique ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-3 flex items-start gap-2 mb-4" style={{ background: "hsl(var(--muted))" }}>
          <Info size={13} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos agents demandent votre accord avant chaque action importante.
            Vous gardez toujours le contrôle final. Chaque décision est enregistrée pour améliorer les prochaines.
          </p>
        </div>

        {/* ── Stats rapides ────────────────────────────────────────────────── */}
        {validations.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "En attente", value: validations.filter(v => v.statut === "en_attente").length, color: "hsl(38 80% 40%)" },
              { label: "Approuvées", value: validations.filter(v => v.statut === "validee").length, color: "hsl(var(--success))" },
              { label: "Refusées",   value: validations.filter(v => v.statut === "refusee").length, color: "hsl(0 65% 40%)" },
              { label: "Total",      value: validations.length, color: "hsl(var(--muted-foreground))" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-surface p-3 text-center">
                <p className="text-base font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: "hsl(var(--muted))" }}>
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all"
              style={{
                background: filter === f.id ? "hsl(var(--background))" : "transparent",
                color: filter === f.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Liste ────────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="card-surface p-8 text-center">
            {filter === "en_attente" ? (
              <>
                <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "hsl(var(--success))" }} />
                <p className="text-sm font-bold text-foreground mb-1">Tout est approuvé ✓</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Aucune action en attente. Vos agents vous notifieront dès qu'une décision sera nécessaire.
                </p>
                <Link to="/war-room" className="text-xs font-semibold flex items-center gap-1 justify-center"
                  style={{ color: "hsl(var(--primary))" }}>
                  Voir le centre de commandement <ChevronRight size={11} />
                </Link>
              </>
            ) : (
              <>
                <Filter size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">Aucune validation dans cette catégorie.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const { channelForVal, runForVal } = getContextForValidation(v);
              return (
                <ValidationCard
                  key={v.id}
                  v={v}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  processing={processing}
                  channelForVal={channelForVal}
                  runForVal={runForVal}
                />
              );
            })}
          </div>
        )}

        {/* ── JARVIS section ───────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 mt-5" style={{ background: "hsl(var(--secondary))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-bold text-foreground">Vous avez des doutes ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            JARVIS peut vous expliquer ce que chaque action implique réellement, analyser le risque et vous conseiller avant de valider.
          </p>
          <Link to="/assistant" className="text-xs font-bold flex items-center gap-1"
            style={{ color: "hsl(var(--primary))" }}>
            Demander à JARVIS <ChevronRight size={11} />
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
