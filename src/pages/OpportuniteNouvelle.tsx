import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Target, Euro, CheckCircle2, AlertTriangle,
  Lightbulb, ArrowRight, Loader2, Sparkles, ChevronLeft,
  TrendingUp, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OpportunityAnalysis {
  potential_score: number;
  estimated_commission: string;
  success_factors: string[];
  risks: string[];
  recommended_approach: string;
}

function ScoreDial({ score }: { score: number }) {
  const color =
    score >= 8 ? "hsl(var(--success))" :
    score >= 6 ? "hsl(var(--primary))" :
    score >= 4 ? "hsl(38 80% 40%)" :
    "hsl(var(--destructive))";
  const bg =
    score >= 8 ? "hsl(var(--success-light))" :
    score >= 6 ? "hsl(var(--secondary))" :
    score >= 4 ? "hsl(var(--accent-light))" :
    "hsl(0 72% 97%)";
  const label =
    score >= 8 ? "Excellent" :
    score >= 6 ? "Bon potentiel" :
    score >= 4 ? "Moyen" :
    "Faible";

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-2">
        <TrendingUp size={16} style={{ color }} />
        <span className="text-sm font-semibold text-foreground">Potentiel</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}<span className="text-sm font-normal text-muted-foreground">/10</span>
        </span>
      </div>
    </div>
  );
}

export default function OpportuniteNouvelle() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company_name: "",
    opportunity_description: "",
    estimated_value: "",
    summary: "",
  });

  const [analysis, setAnalysis] = useState<OpportunityAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canAnalyze =
    form.opportunity_description.trim().length >= 20;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-opportunity-analysis", {
        body: {
          opportunity_description: form.opportunity_description,
          target_company: form.company_name,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setAnalysis(data as OpportunityAnalysis);
      toast.success("Analyse IA terminée !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !form.company_name.trim()) {
      toast.error("Le nom de l'entreprise est requis.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.from("opportunities").insert({
        user_id: user.id,
        company_name: form.company_name.trim(),
        summary: form.summary.trim() || form.opportunity_description.slice(0, 200),
        origin: "manual",
        status: "nouveau",
      } as Parameters<typeof db.from<"opportunities">>[0] extends never ? never : { user_id: string; company_name: string; summary: string; origin: string; status: string });

      if (error) throw error;
      toast.success("Opportunité créée !");
      navigate("/opportunites");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Impossible de créer l'opportunité.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">

        {/* Back + Header */}
        <button
          onClick={() => navigate("/opportunites")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ChevronLeft size={15} /> Retour aux opportunités
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Target size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
              Nouvelle opportunité
            </h1>
            <p className="text-sm text-muted-foreground">
              Décrivez votre opportunité, puis laissez l'IA l'analyser avant de la créer.
            </p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Entreprise cible */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Entreprise cible <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">Le nom de l'entreprise que vous ciblez.</p>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : Acme Corp, Startup XYZ…"
            />
          </div>

          {/* Description */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Description de l'opportunité <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Décrivez le contexte, le besoin, et comment vous pouvez aider. Minimum 20 caractères pour l'analyse IA.
            </p>
            <textarea
              rows={4}
              value={form.opportunity_description}
              onChange={(e) => setForm((f) => ({ ...f, opportunity_description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : Cette entreprise cherche à améliorer sa facturation. Ils ont besoin d'un logiciel simple pour 10 salariés. Je peux les mettre en contact avec notre offre SaaS."
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">
              {form.opportunity_description.length} car. {form.opportunity_description.length < 20 && <span className="text-destructive">(min. 20)</span>}
            </p>
          </div>

          {/* Valeur estimée */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Valeur estimée du deal (€)
            </label>
            <p className="text-xs text-muted-foreground mb-3">Optionnel — aide l'IA à estimer votre commission.</p>
            <div className="relative">
              <Euro size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                min="0"
                value={form.estimated_value}
                onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="ex : 5000"
              />
            </div>
          </div>

          {/* AI Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              canAnalyze && !analyzing
                ? "border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 text-primary"
                : "border-2 border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            }`}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Brain size={16} />
                🧠 Analyser cette opportunité
              </>
            )}
          </button>

          {/* Analysis error */}
          {analysisError && !analyzing && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{analysisError}</p>
            </div>
          )}

          {/* Analysis Result Card */}
          {analysis && !analyzing && (
            <div className="card-surface p-5 space-y-4 border-primary/20 ring-1 ring-primary/10">
              {/* Title */}
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-primary" />
                <p className="text-sm font-bold text-foreground">Analyse IA</p>
              </div>

              {/* Score */}
              <ScoreDial score={analysis.potential_score} />

              {/* Commission */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Euro size={14} className="text-primary" />
                  <span className="font-semibold">Commission estimée</span>
                </div>
                <span className="text-sm font-bold text-primary">{analysis.estimated_commission}</span>
              </div>

              {/* Success factors */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 size={11} className="text-success" style={{ color: "hsl(var(--success))" }} />
                  Facteurs de succès
                </p>
                <ul className="space-y-1.5">
                  {analysis.success_factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
                      >
                        {i + 1}
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert size={11} className="text-destructive" />
                  Risques à anticiper
                </p>
                <ul className="space-y-1.5">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended approach */}
              <div className="rounded-xl bg-secondary px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Lightbulb size={11} className="text-primary" />
                  Approche recommandée
                </p>
                <p className="text-sm text-foreground leading-relaxed">{analysis.recommended_approach}</p>
              </div>

              {/* Re-analyze */}
              <button
                onClick={handleAnalyze}
                className="w-full py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Brain size={12} /> Relancer l'analyse
              </button>
            </div>
          )}

          {/* Notes */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Note interne (optionnel)
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="Contexte interne, source du contact…"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !form.company_name.trim()}
            className="btn-cta w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Création…</>
            ) : (
              <><ArrowRight size={16} /> Créer l'opportunité</>
            )}
          </button>
        </div>

      </div>
    </UserLayout>
  );
}
