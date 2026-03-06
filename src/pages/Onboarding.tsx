import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Bienvenue sur Planify !",
    subtitle: "Prenons 2 minutes pour préparer votre espace.",
    question: "Quel est le principal défi que vous cherchez à résoudre ?",
    options: [
      { value: "organize", label: "Mieux m'organiser au quotidien" },
      { value: "time", label: "Gagner du temps sur mes tâches répétitives" },
      { value: "team", label: "Mieux collaborer avec mon équipe" },
      { value: "track", label: "Suivre mes projets et résultats" },
    ],
  },
  {
    id: 2,
    title: "Parlez-nous de vous",
    subtitle: "Pour personnaliser votre expérience.",
    question: "Comment décririez-vous votre activité ?",
    options: [
      { value: "freelance", label: "Indépendant / Freelance" },
      { value: "small", label: "Petite entreprise (1–10 personnes)" },
      { value: "medium", label: "Équipe (10–50 personnes)" },
      { value: "other", label: "Autre" },
    ],
  },
  {
    id: 3,
    title: "Votre espace est presque prêt",
    subtitle: "Une dernière chose.",
    question: "Comment avez-vous entendu parler de Planify ?",
    options: [
      { value: "friend", label: "Un ami ou collègue" },
      { value: "social", label: "Réseaux sociaux" },
      { value: "search", label: "Recherche Google" },
      { value: "invite", label: "J'ai reçu une invitation directe" },
    ],
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  const step = steps[current];
  const selected = answers[step.id];
  const progress = ((current + 1) / steps.length) * 100;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [step.id]: value }));
  };

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-display font-bold text-foreground">Planify</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Étape {current + 1} sur {steps.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-gradient-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in" key={current}>
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-1.5">
              {step.title}
            </h1>
            <p className="text-muted-foreground">{step.subtitle}</p>
          </div>

          <p className="font-medium text-foreground mb-4">{step.question}</p>

          <div className="space-y-2.5">
            {step.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                  selected === opt.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <span>{opt.label}</span>
                {selected === opt.value && (
                  <CheckCircle2 size={17} className="text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!selected}
            className="btn-cta w-full text-center mt-6 py-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {current === steps.length - 1 ? "Accéder à mon espace →" : "Continuer"}
            {current < steps.length - 1 && <ChevronRight size={16} />}
          </button>

          {current > 0 && (
            <button
              onClick={() => setCurrent((c) => c - 1)}
              className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Revenir en arrière
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
