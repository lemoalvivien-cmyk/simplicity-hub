import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Shield, CheckCircle2, AlertCircle, PauseCircle,
  Eye, Zap, Settings, ChevronRight, Info, Sparkles
} from "lucide-react";

interface Regle {
  id: string;
  titre: string;
  desc: string;
  icone: React.ElementType;
  actif: boolean;
  niveau: "securite" | "automatisation" | "validation";
  couleur: string;
  bg: string;
}

const reglesInitiales: Regle[] = [
  {
    id: "validation_avant_envoi",
    titre: "Toujours vérifier avant d'envoyer",
    desc: "Chaque message est soumis à votre validation avant d'être envoyé. Rien ne part sans votre accord.",
    icone: Eye,
    actif: true,
    niveau: "securite",
    couleur: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
  },
  {
    id: "pause_si_anomalie",
    titre: "S'arrêter si quelque chose semble anormal",
    desc: "La campagne se met en pause automatiquement si on détecte un problème ou un taux d'erreur trop élevé.",
    icone: AlertCircle,
    actif: true,
    niveau: "securite",
    couleur: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
  },
  {
    id: "limite_volume",
    titre: "Limiter le nombre d'envois par jour",
    desc: "Pour rester naturel et éviter d'être signalé comme spam, on limite les envois quotidiens.",
    icone: Shield,
    actif: true,
    niveau: "securite",
    couleur: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
  },
  {
    id: "pause_manuelle",
    titre: "Pouvoir tout arrêter en un clic",
    desc: "Vous pouvez mettre en pause toutes vos campagnes en un seul clic depuis le pilotage.",
    icone: PauseCircle,
    actif: true,
    niveau: "securite",
    couleur: "hsl(280 60% 45%)",
    bg: "hsl(280 60% 95%)",
  },
  {
    id: "actions_simples_auto",
    titre: "Lancer automatiquement les étapes simples",
    desc: "Certaines actions répétitives (comme programmer une relance) peuvent se faire automatiquement.",
    icone: Zap,
    actif: false,
    niveau: "automatisation",
    couleur: "hsl(220 80% 45%)",
    bg: "hsl(220 80% 95%)",
  },
  {
    id: "validation_importantes",
    titre: "Demander une confirmation avant les actions importantes",
    desc: "Pour les actions à fort impact (envoi massif, qualification, archivage), vous confirmez avant.",
    icone: CheckCircle2,
    actif: true,
    niveau: "validation",
    couleur: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
  },
];

const niveauxLabel: Record<string, { label: string; color: string; bg: string }> = {
  securite: { label: "Sécurité", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  automatisation: { label: "Automatisation", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  validation: { label: "Validation", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
};

export default function Regles() {
  const [regles, setRegles] = useState(reglesInitiales);

  const toggle = (id: string) => {
    setRegles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, actif: !r.actif } : r))
    );
  };

  const actives = regles.filter((r) => r.actif).length;

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--secondary))" }}
          >
            <Shield size={20} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Règles & sécurités
            </h1>
            <p className="text-sm text-muted-foreground">
              Définissez comment la plateforme doit se comporter. {actives} règle{actives > 1 ? "s" : ""} active{actives > 1 ? "s" : ""} sur {regles.length}.
            </p>
          </div>
        </div>

        {/* Explication */}
        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{ background: "hsl(var(--muted))" }}
        >
          <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ces règles vous permettent de rester en contrôle à tout moment.
            Activez celles qui correspondent à votre façon de travailler.
            Vous pouvez tout modifier à n'importe quel moment.
          </p>
        </div>

        {/* Groupes */}
        {(["securite", "validation", "automatisation"] as const).map((niveau) => {
          const groupe = regles.filter((r) => r.niveau === niveau);
          const cfg = niveauxLabel[niveau];
          return (
            <div key={niveau} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-3">
                {groupe.map((r) => (
                  <div key={r.id} className="card-surface p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: r.actif ? r.bg : "hsl(var(--muted))" }}
                      >
                        <r.icone size={15} style={{ color: r.actif ? r.couleur : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-0.5">
                          {r.titre}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {r.desc}
                        </p>
                      </div>
                      {/* Toggle */}
                      <button
                        onClick={() => toggle(r.id)}
                        className="shrink-0 w-11 h-6 rounded-full transition-all relative"
                        style={{
                          background: r.actif ? "hsl(var(--primary))" : "hsl(var(--muted))",
                        }}
                        aria-label={r.actif ? "Désactiver" : "Activer"}
                      >
                        <span
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                          style={{ left: r.actif ? "calc(100% - 22px)" : "2px" }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Résumé de l'état */}
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="font-semibold text-foreground text-sm">Résumé de votre configuration</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Avec ces paramètres, la plateforme va :{" "}
            {regles.filter((r) => r.actif).map((r) => r.titre.toLowerCase()).join(" · ")}.
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} />
            <span className="text-xs text-muted-foreground">
              Votre configuration est sécurisée et prête à l'emploi.
            </span>
          </div>
        </div>

        {/* JARVIS */}
        <div
          className="rounded-2xl p-4 mt-5"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-semibold text-foreground">Vous avez des questions ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            JARVIS peut vous expliquer à quoi sert chaque règle et vous conseiller selon votre usage.
          </p>
          <button
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: "hsl(var(--primary))" }}
          >
            Demander à JARVIS <ChevronRight size={11} />
          </button>
        </div>

      </div>
    </UserLayout>
  );
}
