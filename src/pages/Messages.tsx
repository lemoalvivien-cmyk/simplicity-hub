import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  MessageSquare, Plus, Sparkles, Mail, Phone, Send,
  RotateCcw, ChevronRight, Edit2, Copy, Trash2
} from "lucide-react";

type CategorieMsgType = "prospection" | "relance" | "introduction" | "telephone" | "reponse";

interface Template {
  id: number;
  titre: string;
  contenu: string;
  categorie: CategorieMsgType;
  canal: "email" | "telephone" | "autre";
  utilises: number;
}

const templates: Template[] = [
  {
    id: 1,
    titre: "Premier contact — direct",
    contenu: "Bonjour [Prénom],\n\nJe vous contacte car votre activité correspond exactement à ce que nous faisons chez [Votre entreprise].\n\nEn quelques mots : nous aidons les PME à [résoudre leur problème] sans [point de douleur].\n\nÇa vous intéresserait d'en savoir plus en 15 minutes cette semaine ?\n\nBonne journée,\n[Votre prénom]",
    categorie: "prospection",
    canal: "email",
    utilises: 23,
  },
  {
    id: 2,
    titre: "Relance douce après silence",
    contenu: "Bonjour [Prénom],\n\nJe me permets de revenir vers vous — mon email précédent a peut-être été noyé dans vos messages.\n\nJuste pour vous demander : est-ce que le sujet [problème] est quelque chose d'actuel pour vous ?\n\n[Votre prénom]",
    categorie: "relance",
    canal: "email",
    utilises: 14,
  },
  {
    id: 3,
    titre: "Introduction — présentation chaleureuse",
    contenu: "Bonjour [Prénom],\n\nJe me permets de vous contacter suite à la recommandation de [Prénom du contact commun].\n\n[Prénom du contact commun] m'a dit que vous pourriez être intéressé par ce que je propose.\n\nVoici en deux lignes : [description simple].\n\nSeriez-vous disponible pour un échange rapide ?\n\n[Votre prénom]",
    categorie: "introduction",
    canal: "email",
    utilises: 5,
  },
  {
    id: 4,
    titre: "Script appel — premier contact",
    contenu: "Bonjour, je suis [Prénom] de [Votre entreprise].\n\nJe vous appelle car nous travaillons avec des entreprises comme la vôtre sur [sujet].\n\nEst-ce que vous avez 2 minutes pour que je vous explique rapidement ?\n\n[Si oui → expliquer la valeur]\n[Si non → proposer un rappel]",
    categorie: "telephone",
    canal: "telephone",
    utilises: 8,
  },
  {
    id: 5,
    titre: "Réponse à une demande entrante",
    contenu: "Bonjour [Prénom],\n\nMerci de votre message.\n\nJe suis ravi de pouvoir vous aider. Voici ce que je vous propose : [solution simple].\n\nEst-ce que vous seriez disponible [créneau] pour en discuter ?\n\n[Votre prénom]",
    categorie: "reponse",
    canal: "email",
    utilises: 11,
  },
];

const categories: { id: CategorieMsgType | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "prospection", label: "Prospection" },
  { id: "relance", label: "Relance" },
  { id: "introduction", label: "Introduction" },
  { id: "telephone", label: "Téléphone" },
  { id: "reponse", label: "Réponse" },
];

const canalIcon: Record<string, React.ElementType> = {
  email: Mail,
  telephone: Phone,
  autre: Send,
};

const categorieColors: Record<CategorieMsgType, { color: string; bg: string }> = {
  prospection: { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  relance: { color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  introduction: { color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  telephone: { color: "hsl(280 60% 45%)", bg: "hsl(280 60% 95%)" },
  reponse: { color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
};

export default function Messages() {
  const [filtre, setFiltre] = useState<CategorieMsgType | "tous">("tous");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = filtre === "tous" ? templates : templates.filter((t) => t.categorie === filtre);

  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Préparez vos messages à l'avance. Choisissez-les ensuite dans vos campagnes.
            </p>
          </div>
          <button className="btn-cta text-sm py-2.5 px-4 shrink-0 flex items-center gap-1.5">
            <Plus size={14} /> Nouveau message
          </button>
        </div>

        {/* Aide IA */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-start gap-3"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-0.5">
              JARVIS peut vous aider à écrire
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Décrivez votre activité et votre cible. JARVIS génère un message clair, humain et efficace.
            </p>
            <button
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "hsl(var(--primary))" }}
            >
              Générer un message <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFiltre(c.id)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: filtre === c.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                background: filtre === c.id ? "hsl(var(--primary))" : "transparent",
                color: filtre === c.id ? "white" : "hsl(var(--muted-foreground))",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="space-y-3">
          {filtered.map((t) => {
            const isExpanded = expanded === t.id;
            const cfg = categorieColors[t.categorie];
            const CanalIcon = canalIcon[t.canal] || Send;

            return (
              <div key={t.id} className="card-surface overflow-hidden">
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpanded(isExpanded ? null : t.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <CanalIcon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground text-sm">{t.titre}</p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {t.categorie}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Utilisé {t.utilises} fois · {t.canal === "email" ? "Email" : t.canal === "telephone" ? "Téléphone" : "Autre"}
                      </p>
                    </div>
                    <ChevronRight
                      size={15}
                      className="text-muted-foreground shrink-0 transition-transform"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div
                      className="p-3 rounded-xl text-xs text-foreground whitespace-pre-wrap leading-relaxed mb-3"
                      style={{ background: "hsl(var(--muted))", fontFamily: "inherit" }}
                    >
                      {t.contenu}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                        <Edit2 size={12} /> Modifier
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground">
                        <Copy size={12} /> Dupliquer
                      </button>
                      <button
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}
                      >
                        <Sparkles size={12} /> Améliorer
                      </button>
                      <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground ml-auto">
                        <RotateCcw size={12} /> Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* État vide */}
        {filtered.length === 0 && (
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

      </div>
    </UserLayout>
  );
}
