/**
 * ActivationProgressBar — Mini barre de progression dans le hero dashboard.
 * Très discrète, mais toujours visible.
 */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  stepsCompleted: number;
  totalSteps?: number;
  nextStep: { label: string; path: string; cta: string } | null;
}

export default function ActivationProgressBar({ stepsCompleted, totalSteps = 4, nextStep }: Props) {
  const progress = Math.round((stepsCompleted / totalSteps) * 100);
  if (progress >= 100 || !nextStep) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-white/50 text-xs">Activation : {stepsCompleted}/{totalSteps} étapes</p>
        <span className="text-white/70 text-xs font-semibold">{progress}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: "var(--gradient-accent)" }}
        />
      </div>
      <Link
        to={nextStep.path}
        className="flex items-center gap-1 text-xs font-semibold hover:underline"
        style={{ color: "hsl(var(--accent))" }}
      >
        Prochaine étape : {nextStep.cta} <ArrowRight size={11} />
      </Link>
    </div>
  );
}
