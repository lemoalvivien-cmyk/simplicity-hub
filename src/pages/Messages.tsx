/**
 * Messages — Message templates backed by real DB (message_templates table).
 * PROOF:GOLIVE_V1:message_templates_ui_real → useMessageTemplates hook + real DB read/write
 * PROOF:RELEASE_SYNC_V1:messages_page_present → this file
 */
import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  MessageSquare, Plus, Sparkles, Mail, Phone, Send,
  RotateCcw, ChevronRight, Edit2, Copy, CheckCircle2
} from "lucide-react";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import type { MessageTemplate } from "@/hooks/useMessageTemplates";

// PROOF:GOLIVE_V1:message_templates_ui_real — category filter definitions
type FilterType = "tous" | string;

const CANAL_ICON: Record<string, React.ElementType> = {
  email:     Mail,
  telephone: Phone,
  autre:     Send,
};

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  prospect_first_touch:        { color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
  relance:                     { color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))" },
  intro_followup_email:        { color: "hsl(220 80% 45%)",       bg: "hsl(220 80% 95%)" },
  manual_call_prep_note:       { color: "hsl(280 60% 45%)",       bg: "hsl(280 60% 95%)" },
  reponse:                     { color: "hsl(var(--success))",    bg: "hsl(var(--success-light))" },
  facilitator_precision_request: { color: "hsl(38 80% 30%)",     bg: "hsl(var(--accent-light))" },
};

const TYPE_LABEL: Record<string, string> = {
  prospect_first_touch:        "prospection",
  relance:                     "relance",
  intro_followup_email:        "introduction",
  manual_call_prep_note:       "téléphone",
  reponse:                     "réponse",
  facilitator_precision_request: "précision",
};

const CATEGORIES = [
  { id: "tous", label: "Tous" },
  { id: "prospect_first_touch", label: "Prospection" },
  { id: "relance", label: "Relance" },
  { id: "intro_followup_email", label: "Introduction" },
  { id: "manual_call_prep_note", label: "Téléphone" },
  { id: "reponse", label: "Réponse" },
];

function TemplateCard({
  t,
  isExpanded,
  onToggleExpand,
  onUpdateBody,
  onToggleActive,
}: {
  t: MessageTemplate;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateBody: (id: string, body: string) => void;
  onToggleActive: (id: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(t.body);
  const cfg = TYPE_COLORS[t.template_type] ?? { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" };
  const CanalIcon = CANAL_ICON[t.channel] ?? Send;
  const typeLabel = TYPE_LABEL[t.template_type] ?? t.template_type;

  const saveEdit = () => {
    onUpdateBody(t.id, draft);
    setEditMode(false);
  };

  return (
    <div className="card-surface overflow-hidden" style={{ opacity: t.is_active ? 1 : 0.6 }}>
      <button className="w-full text-left p-4" onClick={onToggleExpand}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
            <CanalIcon size={14} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-semibold text-foreground text-sm">{t.title}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ color: cfg.color, background: cfg.bg }}>
                {typeLabel}
              </span>
              {!t.is_active && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">inactif</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisé {t.utilises} fois · {t.channel === "email" ? "Email" : t.channel === "telephone" ? "Téléphone" : "Autre"}
            </p>
          </div>
          <ChevronRight size={15} className="text-muted-foreground shrink-0 transition-transform"
            style={{ transform: isExpanded ? "rotate(90deg)" : "none" }} />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {editMode ? (
            <>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full p-3 rounded-xl text-xs text-foreground bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed mb-3 resize-none"
                rows={8}
              />
              <div className="flex items-center gap-2">
                <button onClick={saveEdit}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-white"
                  style={{ background: "hsl(var(--primary))" }}>
                  <CheckCircle2 size={12} /> Sauvegarder
                </button>
                <button onClick={() => { setDraft(t.body); setEditMode(false); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl text-xs text-foreground whitespace-pre-wrap leading-relaxed mb-3"
                style={{ background: "hsl(var(--muted))", fontFamily: "inherit" }}>
                {t.body}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setDraft(t.body); setEditMode(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                  <Edit2 size={12} /> Modifier
                </button>
                <button onClick={() => navigator.clipboard.writeText(t.body)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                  <Copy size={12} /> Copier
                </button>
                <button onClick={() => onToggleActive(t.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: t.is_active ? "hsl(38 80% 30%)" : "hsl(var(--success))", background: t.is_active ? "hsl(var(--accent-light))" : "hsl(var(--success-light))" }}>
                  {t.is_active ? "Désactiver" : "Activer"}
                </button>
                <button onClick={() => { setDraft(t.body); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground ml-auto">
                  <RotateCcw size={12} /> Réinitialiser
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Messages() {
  // PROOF:GOLIVE_V1:message_templates_ui_real — reads from DB via real hook
  const { templates, loading, error, updateBody, toggleActive } = useMessageTemplates();
  const [filtre, setFiltre] = useState<FilterType>("tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filtre === "tous" ? templates : templates.filter(t => t.template_type === filtre);
  const active = filtered.filter(t => t.is_active);

  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes messages</h1>
            <p className="text-sm text-muted-foreground">
              Préparez vos messages à l'avance. Choisissez-les ensuite dans vos campagnes.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30">
            Erreur : {error}
          </div>
        )}

        {/* AI assist */}
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: "hsl(var(--secondary))" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary))" }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-0.5">JARVIS peut vous aider à écrire</p>
            <p className="text-xs text-muted-foreground mb-2">
              Décrivez votre activité et votre cible. JARVIS génère un message clair, humain et efficace.
            </p>
            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              Générer un message <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFiltre(c.id)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: filtre === c.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                background:  filtre === c.id ? "hsl(var(--primary))" : "transparent",
                color:       filtre === c.id ? "white" : "hsl(var(--muted-foreground))",
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-surface p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Templates list */}
        {!loading && (
          <div className="space-y-3">
            {active.map(t => (
              <TemplateCard
                key={t.id}
                t={t}
                isExpanded={expanded === t.id}
                onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                onUpdateBody={updateBody}
                onToggleActive={toggleActive}
              />
            ))}
            {/* Show inactive templates collapsed */}
            {filtered.filter(t => !t.is_active).map(t => (
              <TemplateCard
                key={t.id}
                t={t}
                isExpanded={expanded === t.id}
                onToggleExpand={() => setExpanded(expanded === t.id ? null : t.id)}
                onUpdateBody={updateBody}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="card-surface p-10 text-center mt-4">
            <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucun message dans cette catégorie</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier modèle de message pour cette catégorie.
            </p>
            <button className="btn-cta text-sm py-2.5 px-5 inline-flex gap-1.5">
              <Plus size={14} /> Créer un message
            </button>
          </div>
        )}

        {/* DB proof footer */}
        {!loading && templates.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {templates.length} template{templates.length > 1 ? "s" : ""} · persistés en base · table <code>message_templates</code>
          </p>
        )}

      </div>
    </UserLayout>
  );
}
