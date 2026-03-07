import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Radar, Zap, TrendingUp, Users, Target, ArrowRight,
  Plus, Sparkles, Brain, Loader2, RefreshCw, Building2,
  ChevronRight, AlertCircle, Clock
} from "lucide-react";
import { toast } from "sonner";

interface Signal {
  id: string;
  company_name: string;
  signal_type: string;
  source: string;
  signal_strength: number;
  normalized_summary: string;
  detected_at: string;
  status: string;
}

interface Opportunity {
  id: string;
  company_name: string;
  summary: string;
  intent_score: number;
  intent_label: string;
  status: string;
  recommended_next_action: string;
  dossier_match_label: string;
  dossier_match_reason: string;
  suggested_facilitators: Array<{ user_id: string; prenom: string; score: number; reason: string; zone: string }>;
  created_at: string;
  origin: string;
}

const signalTypeConfig: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  recrutement:  { label: "Recrutement",    color: "hsl(var(--primary))",   bg: "hsl(var(--secondary))",    emoji: "👥" },
  levee_fonds:  { label: "Levée de fonds", color: "hsl(var(--success))",   bg: "hsl(var(--success-light))", emoji: "💰" },
  actualite:    { label: "Actualité",      color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))",  emoji: "📰" },
  lancement:    { label: "Lancement",      color: "hsl(280 70% 50%)",       bg: "hsl(280 70% 95%)",          emoji: "🚀" },
  croissance:   { label: "Croissance",     color: "hsl(var(--success))",    bg: "hsl(var(--success-light))", emoji: "📈" },
  autre:        { label: "Signal",         color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",  emoji: "⚡" },
};

const intentConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  eleve: { label: "Fort potentiel",    color: "hsl(var(--success))",   bg: "hsl(var(--success-light))", dot: "hsl(var(--success))" },
  moyen: { label: "Potentiel moyen",   color: "hsl(38 80% 30%)",       bg: "hsl(var(--accent-light))",  dot: "hsl(var(--accent))" },
  faible:{ label: "Faible potentiel",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", dot: "hsl(var(--border))" },
};

const matchConfig: Record<string, { color: string; bg: string }> = {
  "Très proche de votre cible": { color: "hsl(var(--success))",   bg: "hsl(var(--success-light))" },
  "Pertinence moyenne":          { color: "hsl(38 80% 30%)",       bg: "hsl(var(--accent-light))" },
  "Hors cible principale":       { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

export default function RadarPage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [newSignal, setNewSignal] = useState({ company_name: "", signal_type: "recrutement", raw_summary: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [sigRes, oppRes] = await Promise.all([
      db.from("signals").select("*").eq("user_id", user.id).order("detected_at", { ascending: false }).limit(20),
      db.from("opportunities").select("*").eq("user_id", user.id).order("intent_score", { ascending: false }).limit(20),
    ]);
    setSignals(sigRes.data || []);
    setOpportunities(oppRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const generateDemoSignals = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deal-radar-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "generate_from_dossier" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`${data.count} nouvelles opportunités détectées par le radar`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const addManualSignal = async () => {
    if (!user || !newSignal.company_name) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deal-radar-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action: "create_signal", ...newSignal }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Signal ajouté et opportunité créée");
      setShowAddSignal(false);
      setNewSignal({ company_name: "", signal_type: "recrutement", raw_summary: "" });
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const hotOpps = opportunities.filter(o => o.intent_label === "eleve" && o.status !== "archivee");
  const newOpps = opportunities.filter(o => o.status === "nouvelle");

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)",
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Radar size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">Deal Radar</h1>
                <p className="text-white/50 text-xs">
                  {newOpps.length > 0
                    ? `${newOpps.length} nouvelle${newOpps.length > 1 ? "s" : ""} opportunité${newOpps.length > 1 ? "s" : ""} détectée${newOpps.length > 1 ? "s" : ""}`
                    : "Le radar surveille les signaux business pour vous"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={generateDemoSignals}
                disabled={generating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-colors"
                style={{ background: "hsl(218 40% 20% / 0.6)", border: "1px solid hsl(218 40% 30% / 0.4)" }}
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Actualiser le radar
              </button>
              <button
                onClick={() => setShowAddSignal(!showAddSignal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Plus size={12} /> Ajouter un signal
              </button>
            </div>
          </div>

          {/* Stats rapides */}
          {!loading && (
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-3" style={{ borderColor: "hsl(218 40% 25% / 0.4)" }}>
              {[
                { label: "Signaux actifs",   value: signals.filter(s => s.status === "nouveau").length, icon: Zap },
                { label: "Opportunités",     value: opportunities.length,                                icon: Target },
                { label: "Fort potentiel",   value: hotOpps.length,                                     icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon size={14} className="mx-auto mb-1 text-white/40" />
                  <p className="font-display text-xl font-bold text-white">{value}</p>
                  <p className="text-white/40 text-xs leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FORMULAIRE AJOUT SIGNAL ────────────────────────────── */}
        {showAddSignal && (
          <div className="card-surface p-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap size={15} className="text-primary" /> Ajouter un signal manuellement
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom de l'entreprise</label>
                <input
                  type="text"
                  placeholder="Ex : Startup XYZ"
                  value={newSignal.company_name}
                  onChange={e => setNewSignal(p => ({ ...p, company_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type de signal</label>
                <select
                  value={newSignal.signal_type}
                  onChange={e => setNewSignal(p => ({ ...p, signal_type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(signalTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Contexte (optionnel)</label>
                <textarea
                  placeholder="Ex : Ils ont publié 3 offres d'emploi cette semaine..."
                  value={newSignal.raw_summary}
                  onChange={e => setNewSignal(p => ({ ...p, raw_summary: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={addManualSignal}
                  disabled={saving || !newSignal.company_name}
                  className="btn-cta text-sm py-2.5 px-5 flex-1 justify-center"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Créer l'opportunité
                </button>
                <button
                  onClick={() => setShowAddSignal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── OPPORTUNITÉS CHAUDES ───────────────────────────────── */}
        {hotOpps.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
              <h2 className="font-semibold text-foreground">Opportunités à fort potentiel</h2>
            </div>
            <div className="space-y-3">
              {hotOpps.slice(0, 3).map(opp => (
                <OpportunityCard key={opp.id} opp={opp} onSelect={setSelectedOpp} selected={selectedOpp?.id === opp.id} />
              ))}
            </div>
          </div>
        )}

        {/* ── ÉTAT VIDE ──────────────────────────────────────────── */}
        {!loading && opportunities.length === 0 && (
          <div className="card-surface p-8 text-center">
            <Radar size={36} className="mx-auto text-muted-foreground mb-3" />
            <h2 className="font-semibold text-foreground mb-2">Le radar est prêt</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              Activez le radar pour détecter automatiquement des opportunités business correspondant à votre profil.
            </p>
            <button
              onClick={generateDemoSignals}
              disabled={generating}
              className="btn-cta text-sm py-3 px-6 inline-flex"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Activer le Deal Radar
            </button>
          </div>
        )}

        {/* ── TOUTES LES OPPORTUNITÉS ────────────────────────────── */}
        {opportunities.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Target size={16} className="text-primary" />
                Toutes les opportunités
              </h2>
              <span className="text-xs text-muted-foreground">{opportunities.length} piste{opportunities.length > 1 ? "s" : ""}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-2">
                {opportunities.map(opp => (
                  <OpportunityRow key={opp.id} opp={opp} onSelect={setSelectedOpp} selected={selectedOpp?.id === opp.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SIGNAUX RÉCENTS ────────────────────────────────────── */}
        {signals.length > 0 && (
          <div className="card-surface p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Signaux récents
            </h2>
            <div className="space-y-2">
              {signals.slice(0, 5).map(sig => {
                const cfg = signalTypeConfig[sig.signal_type] || signalTypeConfig.autre;
                return (
                  <div key={sig.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted">
                    <span className="text-lg shrink-0 mt-0.5">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{sig.company_name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                      </div>
                      {sig.normalized_summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sig.normalized_summary}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sig.signal_strength >= 70 ? "hsl(var(--success-light))" : "hsl(var(--muted))", color: sig.signal_strength >= 70 ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
                      >
                        {sig.signal_strength}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DÉTAIL OPPORTUNITÉ ─────────────────────────────────── */}
        {selectedOpp && (
          <OpportunityDetail opp={selectedOpp} onClose={() => setSelectedOpp(null)} />
        )}

        {/* ── CTA DOSSIER ────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Améliorez la précision du radar</h2>
              <p className="text-xs text-muted-foreground">Plus votre dossier est complet, plus le radar est précis.</p>
            </div>
          </div>
          <Link to="/dossier" className="btn-primary text-sm py-2.5 px-4 w-full justify-center inline-flex gap-1.5">
            <Building2 size={14} /> Compléter mon dossier
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function OpportunityCard({ opp, onSelect, selected }: { opp: Opportunity; onSelect: (o: Opportunity) => void; selected: boolean }) {
  const intent = intentConfig[opp.intent_label] || intentConfig.moyen;
  const match = matchConfig[opp.dossier_match_label] || { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" };

  return (
    <button
      onClick={() => onSelect(selected ? null as any : opp)}
      className="w-full text-left rounded-xl p-4 border transition-all"
      style={{
        borderColor: selected ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
        background: selected ? "hsl(var(--secondary))" : "hsl(var(--muted))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: intent.dot }} />
            <p className="text-sm font-semibold text-foreground">{opp.company_name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: intent.color, background: intent.bg }}>
              {intent.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{opp.summary}</p>
          {opp.dossier_match_label && (
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: match.color, background: match.bg }}>
              {opp.dossier_match_label}
            </span>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="font-display text-xl font-bold" style={{ color: intent.color }}>{opp.intent_score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      {opp.recommended_next_action && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <ArrowRight size={11} className="shrink-0" />
          {opp.recommended_next_action}
        </p>
      )}
    </button>
  );
}

function OpportunityRow({ opp, onSelect, selected }: { opp: Opportunity; onSelect: (o: Opportunity) => void; selected: boolean }) {
  const intent = intentConfig[opp.intent_label] || intentConfig.moyen;
  return (
    <button
      onClick={() => onSelect(selected ? null as any : opp)}
      className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: intent.dot }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{opp.company_name}</p>
          <p className="text-xs text-muted-foreground truncate">{opp.summary?.slice(0, 70)}…</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: intent.color, background: intent.bg }}>
          {opp.intent_score}
        </span>
        <ChevronRight size={13} className="text-muted-foreground" />
      </div>
    </button>
  );
}

function OpportunityDetail({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const intent = intentConfig[opp.intent_label] || intentConfig.moyen;
  const match = matchConfig[opp.dossier_match_label] || { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" };

  return (
    <div className="card-surface p-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.2)" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{opp.company_name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: intent.color, background: intent.bg }}>
            {intent.label} · Score {opp.intent_score}/100
          </span>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
          Fermer
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{opp.summary}</p>

      {opp.dossier_match_label && (
        <div className="rounded-xl p-3 mb-4" style={{ background: match.bg }}>
          <p className="text-xs font-semibold mb-0.5" style={{ color: match.color }}>{opp.dossier_match_label}</p>
          {opp.dossier_match_reason && (
            <p className="text-xs" style={{ color: match.color }}>{opp.dossier_match_reason}</p>
          )}
        </div>
      )}

      {opp.recommended_next_action && (
        <div className="rounded-xl p-3 mb-4 bg-muted">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-0.5">
            <ArrowRight size={12} className="text-primary" /> Prochaine action recommandée
          </p>
          <p className="text-xs text-muted-foreground">{opp.recommended_next_action}</p>
        </div>
      )}

      {opp.suggested_facilitators && opp.suggested_facilitators.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Users size={12} className="text-primary" />
            Facilitateurs suggérés
          </p>
          <div className="space-y-2">
            {opp.suggested_facilitators.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--gradient-primary)", color: "white" }}>
                    {f.prenom?.charAt(0) || "F"}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{f.prenom}</p>
                    <p className="text-xs text-muted-foreground">{f.reason}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                  {f.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link to="/missions" className="flex-1 btn-cta text-sm py-2.5 justify-center">
          <Target size={13} /> Créer une mission
        </Link>
        <Link to="/contacts" className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <Plus size={13} /> Ajouter un contact
        </Link>
      </div>
    </div>
  );
}
