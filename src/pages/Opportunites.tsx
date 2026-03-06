import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  TrendingUp, Play, Send, Upload, Briefcase,
  ChevronRight, ArrowRight, Target, Clock,
  CheckCircle2, AlertCircle, Sparkles, Filter
} from "lucide-react";

type OrigineType = "prospection" | "introduction" | "campagne" | "mission" | "import";
type StatusType = "a_traiter" | "en_cours" | "en_attente" | "gagne" | "perdu";

interface Opportunite {
  id: number;
  nom: string;
  entreprise: string;
  origine: OrigineType;
  status: StatusType;
  detail: string;
  valeur?: string;
  prochaine_action: string;
  echeance: string;
  lien: string;
}

const opportunites: Opportunite[] = [
  {
    id: 1, nom: "Jean-Pierre Duval", entreprise: "Duval Associés",
    origine: "introduction", status: "en_attente",
    detail: "Introduction via Marc Lefebvre — Mission TPE",
    valeur: "1 200 €", prochaine_action: "Valider l'introduction",
    echeance: "Aujourd'hui", lien: "/entreprise/introductions",
  },
  {
    id: 2, nom: "Sophie Martin", entreprise: "Tech Solutions",
    origine: "campagne", status: "en_cours",
    detail: "Campagne Tech PME — a ouvert 2 fois",
    valeur: "800 €", prochaine_action: "Relancer par email",
    echeance: "Aujourd'hui", lien: "/actions",
  },
  {
    id: 3, nom: "FinEdge SAS", entreprise: "FinEdge",
    origine: "mission", status: "a_traiter",
    detail: "Mission financement entreprise",
    valeur: "2 500 €", prochaine_action: "Soumettre une introduction",
    echeance: "Cette semaine", lien: "/missions/2",
  },
  {
    id: 4, nom: "Malik Diouf", entreprise: "RH Conseil",
    origine: "import", status: "a_traiter",
    detail: "Importé depuis un fichier CSV",
    prochaine_action: "Premier appel à faire",
    echeance: "Cette semaine", lien: "/contacts/3",
  },
  {
    id: 5, nom: "Antoine Leblanc", entreprise: "Groupe Leblanc",
    origine: "prospection", status: "gagne",
    detail: "Réponse positive après 2 relances",
    valeur: "600 €", prochaine_action: "Planifier la prochaine étape",
    echeance: "Terminé", lien: "/contacts/5",
  },
];

const origineConfig: Record<OrigineType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  introduction: { label: "Introduction", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)", icon: Send },
  prospection: { label: "Prospection", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: Target },
  campagne: { label: "Campagne", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: Play },
  mission: { label: "Mission", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: Briefcase },
  import: { label: "Import", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: Upload },
};

const statusConfig: Record<StatusType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  a_traiter: { label: "À traiter", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: AlertCircle },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: ArrowRight },
  en_attente: { label: "En attente", color: "hsl(280 60% 45%)", bg: "hsl(280 60% 95%)", icon: Clock },
  gagne: { label: "Gagné", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: CheckCircle2 },
  perdu: { label: "Perdu", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: Target },
};

export default function Opportunites() {
  const [filtreOrigine, setFiltreOrigine] = useState<OrigineType | "toutes">("toutes");
  const [filtreStatus, setFiltreStatus] = useState<StatusType | "tous">("tous");

  const filtered = opportunites.filter((o) => {
    const okOrigine = filtreOrigine === "toutes" || o.origine === filtreOrigine;
    const okStatus = filtreStatus === "tous" || o.status === filtreStatus;
    return okOrigine && okStatus;
  });

  const totalValeur = opportunites
    .filter((o) => o.valeur)
    .reduce((acc, o) => {
      const v = parseFloat(o.valeur!.replace("€", "").replace(" ", "").trim()) || 0;
      return acc + v;
    }, 0);

  return (
    <UserLayout jarvisContext="missions">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Mes opportunités
          </h1>
          <p className="text-sm text-muted-foreground">
            Toutes vos opportunités — qu'elles viennent d'une prospection, d'une introduction ou d'une mission.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { label: "Total", value: opportunites.length, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
            { label: "À traiter", value: opportunites.filter((o) => o.status === "a_traiter" || o.status === "en_attente").length, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
            { label: "En cours", value: opportunites.filter((o) => o.status === "en_cours").length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            { label: "Gagnées", value: opportunites.filter((o) => o.status === "gagne").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Potentiel total */}
        <div
          className="rounded-xl p-4 mb-5 flex items-center gap-3"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <TrendingUp size={20} style={{ color: "hsl(var(--primary))" }} />
          <div>
            <p className="text-xs text-muted-foreground">Valeur totale identifiée</p>
            <p className="font-display text-lg font-bold text-foreground">{totalValeur.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setFiltreOrigine("toutes")}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
            style={{
              borderColor: filtreOrigine === "toutes" ? "hsl(var(--primary))" : "hsl(var(--border))",
              background: filtreOrigine === "toutes" ? "hsl(var(--primary))" : "transparent",
              color: filtreOrigine === "toutes" ? "white" : "hsl(var(--muted-foreground))",
            }}
          >
            Toutes
          </button>
          {(Object.keys(origineConfig) as OrigineType[]).map((o) => (
            <button
              key={o}
              onClick={() => setFiltreOrigine(o)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                borderColor: filtreOrigine === o ? origineConfig[o].color : "hsl(var(--border))",
                background: filtreOrigine === o ? origineConfig[o].bg : "transparent",
                color: filtreOrigine === o ? origineConfig[o].color : "hsl(var(--muted-foreground))",
              }}
            >
              {origineConfig[o].label}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {filtered.map((opp) => {
            const orig = origineConfig[opp.origine];
            const stat = statusConfig[opp.status];
            const OrigIcon = orig.icon;
            const StatIcon = stat.icon;
            return (
              <Link
                key={opp.id}
                to={opp.lien}
                className="card-surface p-4 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: orig.bg }}
                  >
                    <OrigIcon size={16} style={{ color: orig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{opp.nom}</p>
                        <p className="text-xs text-muted-foreground">{opp.entreprise}</p>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                        style={{ color: stat.color, background: stat.bg }}
                      >
                        <StatIcon size={10} /> {stat.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{opp.detail}</p>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: orig.color, background: orig.bg }}
                      >
                        {orig.label}
                      </span>
                      {opp.valeur && (
                        <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                          {opp.valeur}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">{opp.echeance}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: orig.color }}>
                      <ArrowRight size={11} /> {opp.prochaine_action}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card-surface p-10 text-center mt-2">
            <Target size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune opportunité trouvée</p>
            <p className="text-sm text-muted-foreground">
              Essayez un autre filtre ou lancez une campagne.
            </p>
          </div>
        )}

        {/* JARVIS */}
        <div className="rounded-2xl p-4 mt-5" style={{ background: "hsl(var(--secondary))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-semibold text-foreground">Que faire maintenant ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            JARVIS peut vous dire quelle opportunité traiter en priorité et pourquoi.
          </p>
          <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
            Voir mes priorités <ChevronRight size={11} />
          </button>
        </div>

      </div>
    </UserLayout>
  );
}
