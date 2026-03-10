/**
 * CampagneNouvelle — câblé à Supabase.
 * Lit les vraies listes + contacts depuis Supabase.
 * Crée une vraie campagne + séquence automatisée via ai-sequence-generator.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ChevronLeft, Check, Sparkles, Users, Mail,
  Phone, Play, Shield, Zap, Target, X, Loader2, AlertCircle,
  Edit3, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Etape = "nom" | "contacts" | "mode" | "canaux" | "sequence" | "lancement";

const ETAPES: { id: Etape; label: string }[] = [
  { id: "nom",       label: "Nom" },
  { id: "contacts",  label: "Contacts" },
  { id: "mode",      label: "Mode" },
  { id: "canaux",    label: "Canaux" },
  { id: "sequence",  label: "Séquence" },
  { id: "lancement", label: "Lancer" },
];

interface Liste { id: string; nom: string; }

interface SequenceStep {
  step: number;
  type: "email" | "linkedin" | "appel";
  delay_days: number;
  subject: string;
  body: string;
  rationale: string;
}

const CANAUX = [
  { id: "email",        label: "Email",        desc: "Premier contact ou relance par email",    icon: Mail,  dispo: true },
  { id: "telephone",    label: "Téléphone",     desc: "Appel ou rappel téléphonique",            icon: Phone, dispo: true },
  { id: "introduction", label: "Introduction",  desc: "Via un apporteur d'affaires",             icon: Users, dispo: false },
];

const MODES = [
  { id: "manuel",    icon: Target,   label: "Je gère tout moi-même",      desc: "Contrôle total sur chaque action.",         badge: "Recommandé", disabled: false },
  { id: "assiste",   icon: Sparkles, label: "Aidé par l'IA",              desc: "L'IA suggère, vous validez.",               badge: null,          disabled: false },
  { id: "semi_auto", icon: Zap,      label: "Semi-automatique",           desc: "Actions simples automatiques.",              badge: "Bientôt",    disabled: true  },
];

const TONE_OPTIONS = [
  { id: "decontracte", label: "Décontracté", desc: "Chaleureux, humain" },
  { id: "formel",      label: "Formel",      desc: "Corporate, vouvoiement" },
  { id: "direct",      label: "Direct",      desc: "Concis, sans fioriture" },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  email:    { label: "Email",    color: "hsl(218 72% 50%)" },
  linkedin: { label: "LinkedIn", color: "hsl(210 100% 40%)" },
  appel:    { label: "Appel",    color: "hsl(142 72% 35%)" },
};

export default function CampagneNouvelle() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [etapeIdx, setEtapeIdx] = useState(0);
  const [nom, setNom] = useState("");
  const [objectif, setObjectif] = useState("");
  const [listeId, setListeId] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("manuel");
  const [canauxChoisis, setCanauxChoisis] = useState<string[]>(["email"]);

  const [listes, setListes] = useState<Liste[]>([]);
  const [loadingListes, setLoadingListes] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sequence AI state
  const [sequenceMode, setSequenceMode] = useState<"aucune" | "ai" | "manuelle">("aucune");
  const [targetDescription, setTargetDescription] = useState("");
  const [sector, setSector] = useState("");
  const [numSteps, setNumSteps] = useState(3);
  const [tone, setTone] = useState("decontracte");
  const [generating, setGenerating] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState<SequenceStep[]>([]);
  const [sequenceName, setSequenceName] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [stepEdits, setStepEdits] = useState<Record<number, Partial<SequenceStep>>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingListes(true);
      const { data, error } = await supabase
        .from("listes").select("id, nom")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) setListes((data as Liste[]) || []);
      setLoadingListes(false);
    };
    load();
  }, [user]);

  const etape = ETAPES[etapeIdx].id;
  const isFirst = etapeIdx === 0;
  const isLast = etapeIdx === ETAPES.length - 1;

  const canNext = () => {
    if (etape === "nom")      return nom.trim().length > 0;
    if (etape === "contacts") return listeId !== null;
    if (etape === "canaux")   return canauxChoisis.length > 0;
    if (etape === "sequence") {
      if (sequenceMode === "ai") return generatedSteps.length > 0;
      return true;
    }
    return true;
  };

  const toggleCanal = (id: string) => {
    setCanauxChoisis(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const listeChoisie = listes.find(l => l.id === listeId);

  const handleGenerateSequence = async () => {
    if (!targetDescription.trim() || targetDescription.length < 10) {
      toast.error("Décrivez votre cible (min 10 caractères).");
      return;
    }
    setGenerating(true);
    setGeneratedSteps([]);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sequence-generator", {
        body: { target_description: targetDescription, sector, num_steps: numSteps, tone },
      });
      if (error) throw error;
      const result = data as { sequence_name?: string; steps?: SequenceStep[]; error?: string };
      if (result.error) throw new Error(result.error);
      setGeneratedSteps(result.steps ?? []);
      setSequenceName(result.sequence_name ?? `Séquence ${nom}`);
      toast.success(`${result.steps?.length ?? 0} étapes générées !`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la génération.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const getStepData = (step: SequenceStep): SequenceStep => ({
    ...step,
    ...(stepEdits[step.step] ?? {}),
  });

  const handleLancer = async () => {
    if (!user) return;
    setSaving(true);

    // 1. Create campaign
    const { data: camp, error: campErr } = await supabase.from("campagnes").insert({
      owner_user_id: user.id,
      nom: nom.trim(),
      objectif: objectif.trim() || null,
      canal_principal: canauxChoisis[0] || "email",
      mode_action: mode,
      liste_id: listeId,
      statut: "brouillon",
    }).select("id").single();

    if (campErr || !camp) {
      toast.error("Impossible de créer la campagne.");
      setSaving(false);
      return;
    }

    // 2. Create sequence if AI mode with steps
    if (sequenceMode === "ai" && generatedSteps.length > 0) {
      const finalSteps = generatedSteps.map(s => getStepData(s));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: seq, error: seqErr } = await (supabase.from("prospection_sequences") as any).insert({
        user_id: user.id,
        campaign_id: camp.id,
        name: sequenceName || `Séquence ${nom}`,
        status: "brouillon",
        steps: finalSteps,
      }).select("id").single();

      if (seqErr) {
        console.error("Sequence insert error:", seqErr.message);
        toast.warning("Campagne créée mais séquence non sauvegardée.");
      } else if (seq && listeId) {
        // 3. Load contacts from the list and create executions
        const { data: listContacts } = await supabase
          .from("contacts")
          .select("id")
          .eq("owner_user_id", user.id);

        if (listContacts && listContacts.length > 0) {
          const executions = listContacts.map((c: { id: string }) => ({
            sequence_id: seq.id,
            contact_id: c.id,
            current_step: 1,
            status: "en_cours" as const,
            next_action_at: new Date().toISOString(),
          }));
          await supabase.from("prospection_executions").insert(executions);
          toast.success(`Campagne + séquence créées. ${executions.length} contact(s) enrôlé(s).`);
        } else {
          toast.success("Campagne créée avec séquence IA.");
        }
        navigate(`/campagnes/${camp.id}`);
        return;
      }
    }

    toast.success("Campagne créée !");
    navigate(`/campagnes/${camp.id}`);
  };

  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Nouvelle campagne</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Étape {etapeIdx + 1} sur {ETAPES.length}</p>
          </div>
          <button onClick={() => navigate("/campagnes")} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-1 mb-8">
          {ETAPES.map((e, i) => (
            <div key={e.id} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i < etapeIdx ? "hsl(var(--primary))" : i === etapeIdx ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted))" }} />
          ))}
        </div>

        {/* ── Étape 1 : Nom ── */}
        {etape === "nom" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Comment s'appelle cette campagne ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Choisissez un nom simple pour vous souvenir de l'objectif.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom de la campagne</label>
                <input autoFocus type="text" placeholder="Ex : Prospection PME Novembre" value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Objectif (optionnel)</label>
                <input type="text" placeholder="Ex : Prendre des rendez-vous avec des DSI" value={objectif}
                  onChange={e => setObjectif(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Contacts ── */}
        {etape === "contacts" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Qui souhaitez-vous contacter ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Choisissez une liste existante.</p>
            {loadingListes ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : listes.length === 0 ? (
              <div className="p-5 rounded-xl bg-muted text-center">
                <AlertCircle size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Aucune liste disponible</p>
                <p className="text-xs text-muted-foreground mb-3">Créez d'abord une liste depuis Contacts → Listes.</p>
                <button onClick={() => navigate("/listes")} className="text-xs font-semibold text-primary hover:underline">Créer une liste →</button>
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                {listes.map(l => (
                  <button key={l.id} onClick={() => setListeId(l.id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border transition-all"
                    style={{ borderColor: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--border))", background: listeId === l.id ? "hsl(var(--secondary))" : "hsl(var(--card))" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                        <Users size={14} style={{ color: listeId === l.id ? "white" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-left">{l.nom}</p>
                    </div>
                    {listeId === l.id && <Check size={16} style={{ color: "hsl(var(--primary))" }} />}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => navigate("/contacts/import")}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
              Importer de nouveaux contacts d'abord
            </button>
          </div>
        )}

        {/* ── Étape 3 : Mode ── */}
        {etape === "mode" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Comment voulez-vous travailler ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Vous pouvez changer plus tard.</p>
            <div className="space-y-3">
              {MODES.map(m => (
                <button key={m.id} onClick={() => !m.disabled && setMode(m.id)} disabled={m.disabled}
                  className="w-full text-left p-4 rounded-xl border transition-all"
                  style={{ borderColor: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--border))", background: mode === m.id ? "hsl(var(--secondary))" : m.disabled ? "hsl(var(--muted)/0.4)" : "hsl(var(--card))", opacity: m.disabled ? 0.6 : 1, cursor: m.disabled ? "not-allowed" : "pointer" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                      <m.icon size={14} style={{ color: mode === m.id ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        {m.badge && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{m.badge}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    {mode === m.id && !m.disabled && <Check size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 4 : Canaux ── */}
        {etape === "canaux" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Par quel canal voulez-vous contacter ?</h2>
            <p className="text-sm text-muted-foreground mb-5">On recommande de commencer par un seul.</p>
            <div className="space-y-3">
              {CANAUX.map(c => {
                const selected = canauxChoisis.includes(c.id);
                return (
                  <button key={c.id} onClick={() => c.dispo && toggleCanal(c.id)} disabled={!c.dispo}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{ borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))", background: selected ? "hsl(var(--secondary))" : !c.dispo ? "hsl(var(--muted)/0.3)" : "hsl(var(--card))", opacity: !c.dispo ? 0.6 : 1, cursor: !c.dispo ? "not-allowed" : "pointer" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: selected ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                        <c.icon size={14} style={{ color: selected ? "white" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.label}</p>
                          {!c.dispo && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Bientôt</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      {selected && <Check size={16} style={{ color: "hsl(var(--primary))" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Étape 5 : Séquence automatisée ── */}
        {etape === "sequence" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Séquence automatisée</h2>
            <p className="text-sm text-muted-foreground mb-5">Générez une série de messages avec l'IA ou ignorez cette étape.</p>

            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { id: "aucune",   label: "Sans séquence", icon: "⏭️", desc: "Gérer manuellement" },
                { id: "ai",       label: "Générer avec IA", icon: "✨", desc: "Messages automatiques" },
                { id: "manuelle", label: "Manuelle",       icon: "✏️", desc: "Bientôt disponible", disabled: true },
              ].map(opt => (
                <button key={opt.id} onClick={() => !("disabled" in opt && opt.disabled) && setSequenceMode(opt.id as "aucune" | "ai" | "manuelle")}
                  disabled={"disabled" in opt && opt.disabled}
                  className="p-3 rounded-xl border text-center transition-all"
                  style={{
                    borderColor: sequenceMode === opt.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background: sequenceMode === opt.id ? "hsl(var(--secondary))" : "hsl(var(--card))",
                    opacity: "disabled" in opt && opt.disabled ? 0.5 : 1,
                  }}>
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* AI sequence generator */}
            {sequenceMode === "ai" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Décrivez votre cible *
                  </label>
                  <textarea
                    placeholder="Ex : Directeurs commerciaux de PME industrielles de 50-200 salariés en Île-de-France..."
                    value={targetDescription}
                    onChange={e => setTargetDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Secteur</label>
                    <input type="text" placeholder="Ex : SaaS, Industrie, RH…"
                      value={sector} onChange={e => setSector(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nbre d'étapes</label>
                    <select value={numSteps} onChange={e => setNumSteps(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
                      {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} étapes</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Ton</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TONE_OPTIONS.map(t => (
                      <button key={t.id} onClick={() => setTone(t.id)}
                        className="p-2.5 rounded-xl border text-center transition-all"
                        style={{ borderColor: tone === t.id ? "hsl(var(--primary))" : "hsl(var(--border))", background: tone === t.id ? "hsl(var(--secondary))" : "hsl(var(--card))" }}>
                        <p className="text-xs font-semibold text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleGenerateSequence} disabled={generating || targetDescription.length < 10}
                  className="w-full btn-cta py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating ? <><Loader2 size={14} className="animate-spin" /> Génération en cours…</> : <><Sparkles size={14} /> Générer avec l'IA</>}
                </button>

                {/* Generated steps preview */}
                {generatedSteps.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{sequenceName}</p>
                      <span className="text-xs text-muted-foreground">{generatedSteps.length} étapes</span>
                    </div>
                    {generatedSteps.map((step) => {
                      const s = getStepData(step);
                      const badge = TYPE_BADGE[s.type] ?? TYPE_BADGE.email;
                      const isExpanded = expandedStep === step.step;
                      const isEditing = editingStep === step.step;
                      return (
                        <div key={step.step} className="card-surface p-3 rounded-xl border border-border">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedStep(isExpanded ? null : step.step)}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: "hsl(var(--primary))", color: "white" }}>
                              {s.step}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${badge.color}22`, color: badge.color }}>
                                  {badge.label}
                                </span>
                                <span className="text-xs text-muted-foreground">J+{s.delay_days}</span>
                                <p className="text-xs font-semibold text-foreground truncate flex-1">{s.subject || "(Appel)"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); setEditingStep(isEditing ? null : step.step); setExpandedStep(step.step); }}
                                className="p-1 rounded-lg hover:bg-muted transition-colors">
                                <Edit3 size={12} className="text-muted-foreground" />
                              </button>
                              {isExpanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-border space-y-2">
                              {isEditing ? (
                                <>
                                  {s.type !== "appel" && (
                                    <div>
                                      <label className="text-xs text-muted-foreground mb-1 block">Objet</label>
                                      <input type="text" value={stepEdits[step.step]?.subject ?? s.subject}
                                        onChange={e => setStepEdits(p => ({ ...p, [step.step]: { ...p[step.step], subject: e.target.value } }))}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Corps</label>
                                    <textarea value={stepEdits[step.step]?.body ?? s.body}
                                      onChange={e => setStepEdits(p => ({ ...p, [step.step]: { ...p[step.step], body: e.target.value } }))}
                                      rows={6}
                                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none font-mono" />
                                  </div>
                                  <button onClick={() => setEditingStep(null)}
                                    className="text-xs font-semibold text-primary hover:underline">
                                    ✓ Terminer l'édition
                                  </button>
                                </>
                              ) : (
                                <>
                                  {s.subject && s.type !== "appel" && (
                                    <p className="text-xs font-semibold text-foreground">Objet : {s.subject}</p>
                                  )}
                                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">{s.body}</pre>
                                  <p className="text-xs italic text-muted-foreground/70">💡 {s.rationale}</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {sequenceMode === "aucune" && (
              <div className="p-4 rounded-xl bg-muted text-center">
                <p className="text-sm text-muted-foreground">Pas de séquence automatisée. Vous gérerez les contacts manuellement depuis le tableau de bord.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Étape 6 : Lancement ── */}
        {etape === "lancement" && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsl(var(--secondary))" }}>
                <Play size={28} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Tout est prêt.</h2>
              <p className="text-sm text-muted-foreground">Vérifiez avant de créer.</p>
            </div>

            <div className="card-surface p-4 mb-4 space-y-3">
              {[
                { label: "Campagne",  value: nom || "Sans titre" },
                { label: "Liste",     value: listeChoisie?.nom ?? "—" },
                { label: "Mode",      value: MODES.find(m => m.id === mode)?.label ?? "—" },
                { label: "Canaux",    value: canauxChoisis.join(", ") || "—" },
                { label: "Séquence",  value: sequenceMode === "ai" && generatedSteps.length > 0 ? `${generatedSteps.length} étapes IA` : "Manuelle" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-semibold text-foreground text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl text-xs text-muted-foreground mb-5" style={{ background: "hsl(var(--muted))" }}>
              <Shield size={12} className="inline mr-1" style={{ color: "hsl(var(--success))" }} />
              La campagne sera créée en statut "Brouillon". Lancez-la depuis son détail.
            </div>

            <button onClick={handleLancer} disabled={saving}
              className="w-full btn-cta py-3 text-sm flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Play size={15} />}
              {saving ? "Création en cours…" : "Créer la campagne"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button onClick={() => setEtapeIdx(i => Math.max(0, i - 1))} disabled={isFirst}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all">
            <ChevronLeft size={16} /> Retour
          </button>
          {!isLast && (
            <button onClick={() => setEtapeIdx(i => Math.min(ETAPES.length - 1, i + 1))} disabled={!canNext()}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{ background: "hsl(var(--primary))", color: "white" }}>
              Suivant <ChevronLeft size={14} className="rotate-180" />
            </button>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
