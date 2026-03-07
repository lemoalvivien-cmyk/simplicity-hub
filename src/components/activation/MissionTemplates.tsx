/**
 * MissionTemplates — Modèles de missions guidés.
 * Préremplis et prêts à l'emploi pour éviter la page blanche.
 */
import { Briefcase, Users, Target, MapPin, Zap, TrendingUp, Globe, ArrowRight } from "lucide-react";

export interface MissionTemplate {
  id: string;
  icon: React.ElementType;
  titre: string;
  description: string;
  secteur: string;
  zone: string;
  recompense: string;
  type_client_recherche: string;
  badge?: string;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "b2b-clients",
    icon: Briefcase,
    titre: "Je cherche de nouveaux clients B2B",
    description: "Nous recherchons des entreprises intéressées par notre offre. Si vous connaissez un dirigeant qui cherche une solution dans notre domaine, présentez-le nous.",
    secteur: "Tous secteurs",
    zone: "France entière",
    recompense: "300 €",
    type_client_recherche: "Dirigeant PME / TPE",
    badge: "Populaire",
  },
  {
    id: "rdv-qualifies",
    icon: Users,
    titre: "Je cherche des rendez-vous qualifiés",
    description: "Nous souhaitons rencontrer des décideurs prêts à découvrir notre solution. Une introduction vaut mieux qu'une prospection froide.",
    secteur: "Tous secteurs",
    zone: "France entière",
    recompense: "200 €",
    type_client_recherche: "Décideur / Responsable",
  },
  {
    id: "intro-dirigeants",
    icon: Target,
    titre: "Je cherche des introductions vers des dirigeants",
    description: "Nous avons besoin d'accéder à des dirigeants dans notre secteur. Si vous avez ce type de réseau, nous rémunérons bien chaque introduction aboutie.",
    secteur: "Tous secteurs",
    zone: "France entière",
    recompense: "400 €",
    type_client_recherche: "Dirigeant / CEO",
  },
  {
    id: "zone-geo",
    icon: MapPin,
    titre: "Je cherche des clients dans ma zone",
    description: "Nous développons notre présence locale. Nous recherchons des facilitateurs qui connaissent bien le tissu économique de notre région.",
    secteur: "Tous secteurs",
    zone: "À préciser",
    recompense: "250 €",
    type_client_recherche: "Client local / Entreprise régionale",
  },
  {
    id: "secteur-precis",
    icon: Zap,
    titre: "Je cherche des clients dans un secteur précis",
    description: "Notre offre est taillée pour un secteur spécifique. Nous cherchons des contacts très qualifiés dans ce domaine.",
    secteur: "À préciser",
    zone: "France entière",
    recompense: "350 €",
    type_client_recherche: "Professionnel du secteur",
  },
  {
    id: "test-marche",
    icon: TrendingUp,
    titre: "Je veux tester rapidement mon offre",
    description: "Nous lançons une nouvelle offre et cherchons les premiers retours du marché. Les introductions nous aident à valider notre positionnement.",
    secteur: "Tous secteurs",
    zone: "France entière",
    recompense: "150 €",
    type_client_recherche: "Early adopter / Testeur",
    badge: "Nouveau",
  },
  {
    id: "partenaires",
    icon: Globe,
    titre: "Je cherche des partenaires distributeurs",
    description: "Nous voulons développer un réseau de distribution. Si vous connaissez des conseillers, consultants ou revendeurs qui pourraient diffuser notre offre, contactez-nous.",
    secteur: "Tous secteurs",
    zone: "Europe",
    recompense: "500 €",
    type_client_recherche: "Partenaire / Distributeur",
  },
];

interface Props {
  onSelect: (template: MissionTemplate) => void;
  selected?: string;
}

export default function MissionTemplates({ onSelect, selected }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Briefcase size={14} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Choisissez un modèle pour commencer</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Sélectionnez un modèle adapté à votre besoin. Vous pourrez tout modifier ensuite.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MISSION_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = selected === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary/40 relative ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {tpl.badge && (
                <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--accent))" }}>
                  {tpl.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                  <Icon size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-sm font-semibold text-foreground leading-snug">{tpl.titre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{tpl.zone}</span>
                    <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>{tpl.recompense}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center pt-1">
        Pas de modèle adapté ? Créez une mission entièrement personnalisée.
      </p>
    </div>
  );
}
