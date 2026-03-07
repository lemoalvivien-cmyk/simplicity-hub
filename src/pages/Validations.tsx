import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Eye,
  ChevronRight, Shield, MessageSquare, Zap, Send,
  Info, Filter, Sparkles, AlertCircle, Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { useOpenClaw, OpenClawValidation } from "@/hooks/useOpenClaw";

// ── Couleurs de risque ────────────────────────────────────────────────────────
const RISQUE_META = {
  faible: { label: "Risque faible", bg: "hsl(var(--success-light))", color: "hsl(var(--success))", Icon: CheckCircle2 },
  moyen:  { label: "Risque modéré", bg: "hsl(38 80% 90%)", color: "hsl(38 80% 30%)", Icon: AlertTriangle },
  eleve:  { label: "Risque élevé",  bg: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)", Icon: AlertCircle },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  message:      MessageSquare,
  campagne:     Send,
  action:       Zap,
  introduction: Eye,
  gain:         ChevronRight,
  blocage:      Shield,
};

type FilterType = "tout" | "en_attente" | "validee" | "refusee";

// ── Carte de validation ────────────────────────────────────────────────────────
function ValidationCard({
  v,
  onApprove,
  onReject,
  processing,
}: {
  v: OpenClawValidation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  processing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const risqueMeta = RISQUE_META[v.risque] ?? RISQUE_META.faible;
  const RisqueIcon = risqueMeta.Icon;
  const TypeIcon = TYPE_ICONS[v.type_validation] ?? Eye;
  const isProcessing = processing === v.id;

  const statusStyle = {
    en_attente: { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: "En attente" },
    validee:    { bg: "hsl(var(--success-light))", color: "hsl(var(--success))", label: "Approuvée" },
    refusee:    { bg: "hsl(0 65% 95%)", color: "hsl(0 65% 40%)", label: "Refusée" },
    expiree:    { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: "Expirée" },
  }[v.statut] ?? { bg: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", label: v.statut };

  return (
    <div
      className="card-surface p-4"
      style={v.statut !== "en_attente" ? { opacity: 0.7 } : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icône type */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: risqueMeta.bg }}>
          <TypeIcon size={14} style={{ color: risqueMeta.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground leading-snug">{v.titre}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span style={{ color: risqueMeta.color }}>{v.agent_id}</span>
            {" · "}
            {new Date(v.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Risque */}
      <div className="flex items-center gap-1.5 mb-3">
        <RisqueIcon size={12} style={{ color: risqueMeta.color }} />
        <span className="text-xs font-semibold" style={{ color: risqueMeta.color }}>{risqueMeta.label}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{v.description}</p>

      {/* Conséquences */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl p-2.5" style={{ background: "hsl(var(--success-light))" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--success))" }}>Si vous approuvez</p>
          <p className="text-xs text-foreground leading-snug">{v.consequence_valide}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: "hsl(0 65% 95%)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "hsl(0 65% 40%)" }}>Si vous refusez</p>
          <p className="text-xs text-foreground leading-snug">{v.consequence_refuse}</p>
        </div>
      </div>

      {/* Détails toggle */}
      {(v.details?.length > 0) && (
        <button
          className="text-xs text-muted-foreground flex items-center gap-1 mb-3"
          onClick={() => setExpanded(!expanded)}
        >
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

      {/* Actions */}
      {v.statut === "en_attente" && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => onReject(v.id)}
            disabled={isProcessing}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            {isProcessing ? "..." : "Refuser"}
          </button>
          <button
            onClick={() => onApprove(v.id)}
            disabled={isProcessing}
            className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {isProcessing ? "Traitement..." : "Approuver ✓"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── PAGE PRINCIPALE ────────────────────────────────────────────────────────────
export default function Validations() {
  const [filter, setFilter] = useState<FilterType>("en_attente");
  const [processing, setProcessing] = useState<string | null>(null);
  const { validations, pendingValidations, loading, processValidation } = useOpenClaw();

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
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(38 80% 90%)" }}>
            <Shield size={20} style={{ color: "hsl(38 80% 30%)" }} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Boîte de validation</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingValidations.length > 0
                ? `${pendingValidations.length} action${pendingValidations.length > 1 ? "s" : ""} en attente de votre décision`
                : "Aucune action en attente — vous êtes à jour ✓"}
            </p>
          </div>
        </div>

        {/* ── Explication ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-3 flex items-start gap-2 mb-5" style={{ background: "hsl(var(--muted))" }}>
          <Info size={13} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos agents demandent votre accord avant chaque action importante.
            Vous gardez toujours le contrôle final. <strong>Approuver</strong> déclenche l'action sur OpenClaw.
            <strong> Refuser</strong> l'annule définitivement.
          </p>
        </div>

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: "hsl(var(--muted))" }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex-1 text-xs font-semibold py-2 px-2 rounded-xl transition-all"
              style={{
                background: filter === f.id ? "hsl(var(--background))" : "transparent",
                color: filter === f.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
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
                <p className="text-sm font-semibold text-foreground mb-1">Tout est à jour ✓</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Aucune action ne nécessite votre validation pour le moment.
                  Vos agents vous notifieront dès qu'une décision sera nécessaire.
                </p>
                <Link to="/agents" className="text-xs font-semibold flex items-center gap-1 justify-center"
                  style={{ color: "hsl(var(--primary))" }}>
                  Voir mes agents <ChevronRight size={11} />
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
            {filtered.map((v) => (
              <ValidationCard
                key={v.id}
                v={v}
                onApprove={handleApprove}
                onReject={handleReject}
                processing={processing}
              />
            ))}
          </div>
        )}

        {/* ── JARVIS section ───────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 mt-6" style={{ background: "hsl(var(--secondary))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-semibold text-foreground">Vous avez des doutes ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            JARVIS peut vous expliquer ce que chaque action implique réellement et vous conseiller avant de valider.
          </p>
          <button className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "hsl(var(--primary))" }}>
            Demander à JARVIS <ChevronRight size={11} />
          </button>
        </div>

      </div>
    </UserLayout>
  );
}
