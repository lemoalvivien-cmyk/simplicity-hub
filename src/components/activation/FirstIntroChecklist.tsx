/**
 * FirstIntroChecklist — Barre de progression vers la première intro.
 * Ultra simple, motivante, visible dans les dashboards.
 */
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import { useActivation } from "@/hooks/useActivation";
import { useAuth } from "@/contexts/AuthContext";

const ENTREPRISE_STEPS = [
  { label: "Profil complété", path: "/profil/entreprise" },
  { label: "Première mission créée", path: "/missions/nouvelle" },
  { label: "Introduction reçue", path: "/entreprise/introductions" },
  { label: "Résultat confirmé", path: "/entreprise/introductions" },
];

const FACILITATEUR_STEPS = [
  { label: "Profil complété", path: "/profil/facilitateur" },
  { label: "Première mission vue", path: "/missions" },
  { label: "Introduction envoyée", path: "/introductions" },
  { label: "Premier gain en vue", path: "/gains" },
];

interface Props {
  compact?: boolean;
}

export default function FirstIntroChecklist({ compact = false }: Props) {
  const { profile } = useAuth();
  const role = (profile?.role as "entreprise" | "facilitateur" | null) ?? null;
  const { stepsCompleted, nextStep, hasProfile, hasMission, hasIntro, hasGain, hasShareLink, loading } = useActivation(role);

  if (loading || !role) return null;

  const totalSteps = 4;
  const isComplete = stepsCompleted >= totalSteps;

  if (isComplete) return null; // Hide once fully activated

  const progress = Math.round((stepsCompleted / totalSteps) * 100);
  const steps = role === "entreprise" ? ENTREPRISE_STEPS : FACILITATEUR_STEPS;

  const stateMap: Record<number, boolean> = role === "entreprise"
    ? { 0: hasProfile, 1: hasMission, 2: hasIntro, 3: hasGain }
    : { 0: hasProfile, 1: hasShareLink || hasIntro, 2: hasIntro, 3: hasGain };

  const remaining = totalSteps - stepsCompleted;

  if (compact) {
    return (
      <div className="card-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-primary" />
            <p className="text-xs font-semibold text-foreground">
              {remaining === 1 ? "Encore 1 étape" : `Encore ${remaining} étapes`} avant votre premier résultat
            </p>
          </div>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "var(--gradient-primary)" }}
          />
        </div>
        {nextStep && (
          <Link
            to={nextStep.path}
            className="flex items-center justify-between gap-2 text-xs text-primary font-semibold hover:underline"
          >
            {nextStep.cta} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Votre chemin vers le premier résultat
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {remaining === 1
              ? "Vous êtes à 1 étape de votre premier résultat concret."
              : `${remaining} étapes restantes. Continuez, vous y êtes presque.`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{progress}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "var(--gradient-primary)" }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2.5 mb-4">
        {steps.map((step, i) => {
          const done = stateMap[i];
          return (
            <div key={i} className={`flex items-center gap-3 ${done ? "opacity-60" : ""}`}>
              {done
                ? <CheckCircle2 size={16} style={{ color: "hsl(var(--success))" }} className="shrink-0" />
                : <Circle size={16} className="shrink-0 text-muted-foreground" />
              }
              <p className={`text-sm ${done ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {nextStep && (
        <Link
          to={nextStep.path}
          className="btn-primary w-full text-center block py-3 text-sm"
        >
          {nextStep.cta} <ArrowRight size={14} className="inline ml-1" />
        </Link>
      )}
    </div>
  );
}
