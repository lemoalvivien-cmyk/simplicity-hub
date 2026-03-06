import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Phone, Mail, ChevronRight, Send, CheckCircle2,
  Clock, AlertCircle, Zap
} from "lucide-react";

type ActionType = "appeler" | "envoyer" | "relancer" | "valider" | "verifier";
type ActionPriorite = "haute" | "normale";

interface Action {
  id: number;
  type: ActionType;
  contact: string;
  entreprise: string;
  description: string;
  lien: string;
  lienLabel: string;
  priorite: ActionPriorite;
  echeance: string;
  source: "introduction" | "prospection" | "campagne";
}

const actions: Action[] = [
  {
    id: 1, type: "valider", contact: "Jean-Pierre Duval", entreprise: "Boulangerie Duval",
    description: "Répondre à l'introduction reçue de Marc Lefèvre. Validez ou refusez ce contact.",
    lien: "/entreprise/introductions", lienLabel: "Voir l'introduction",
    priorite: "haute", echeance: "Aujourd'hui", source: "introduction",
  },
  {
    id: 2, type: "relancer", contact: "Antoine Leblanc", entreprise: "Tech Solutions",
    description: "Antoine a ouvert votre email mais n'a pas répondu. C'est le bon moment pour le relancer.",
    lien: `/contacts/5`, lienLabel: "Voir le contact",
    priorite: "haute", echeance: "Aujourd'hui", source: "campagne",
  },
  {
    id: 3, type: "envoyer", contact: "Sophie Martin", entreprise: "RH Conseil",
    description: "Sophie attend votre premier message depuis son import. Prenez contact.",
    lien: `/contacts/4`, lienLabel: "Voir le contact",
    priorite: "normale", echeance: "Cette semaine", source: "prospection",
  },
  {
    id: 4, type: "verifier", contact: "Malik Diouf", entreprise: "Diouf Transport",
    description: "Ce contact n'a pas d'email renseigné. Vérifiez ses coordonnées avant de le contacter.",
    lien: `/contacts/4`, lienLabel: "Voir le contact",
    priorite: "normale", echeance: "Cette semaine", source: "prospection",
  },
];

const typeConfig: Record<ActionType, { label: string; color: string; bg: string; icon: JSX.Element; verb: string }> = {
  appeler: { label: "Appeler", verb: "à appeler", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Phone size={14} /> },
  envoyer: { label: "Contacter", verb: "à contacter", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)", icon: <Mail size={14} /> },
  relancer: { label: "Relancer", verb: "à relancer", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <Send size={14} /> },
  valider: { label: "Valider", verb: "à valider", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={14} /> },
  verifier: { label: "Vérifier", verb: "à vérifier", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <AlertCircle size={14} /> },
};

const sourceLabels: Record<Action["source"], string> = {
  introduction: "Introduction",
  prospection: "Prospection",
  campagne: "Campagne",
};

export default function Actions() {
  const [done, setDone] = useState<number[]>([]);

  const remaining = actions.filter((a) => !done.includes(a.id));
  const urgent = remaining.filter((a) => a.priorite === "haute");
  const normale = remaining.filter((a) => a.priorite === "normale");

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            À faire maintenant
          </h1>
          <p className="text-sm text-muted-foreground">
            {remaining.length === 0
              ? "Vous avez tout traité. Bravo !"
              : `${remaining.length} action${remaining.length > 1 ? "s" : ""} vous attendent${urgent.length > 0 ? `, dont ${urgent.length} urgente${urgent.length > 1 ? "s" : ""}` : ""}.`}
          </p>
        </div>

        {/* Tout fait */}
        {remaining.length === 0 && (
          <div className="card-surface p-10 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--success-light))" }}
            >
              <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Rien à faire pour l'instant !
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Toutes vos actions sont à jour. Profitez-en pour explorer les nouvelles missions ou lancer une campagne.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">
                Voir les missions
              </Link>
              <Link to="/campagnes" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Mes campagnes
              </Link>
            </div>
          </div>
        )}

        {/* Urgentes */}
        {urgent.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} style={{ color: "hsl(var(--accent))" }} />
              <p className="text-sm font-semibold text-foreground">
                {urgent.length} action{urgent.length > 1 ? "s" : ""} prioritaire{urgent.length > 1 ? "s" : ""} aujourd'hui
              </p>
            </div>
            <div className="space-y-3">
              {urgent.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onDone={() => setDone((prev) => [...prev, action.id])}
                />
              ))}
            </div>
          </div>
        )}

        {/* Normales */}
        {normale.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                Cette semaine
              </p>
            </div>
            <div className="space-y-3">
              {normale.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onDone={() => setDone((prev) => [...prev, action.id])}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

function ActionCard({ action, onDone }: { action: Action; onDone: () => void }) {
  const cfg = typeConfig[action.type];
  const src = sourceLabels[action.source];

  return (
    <div
      className="card-surface p-5"
      style={
        action.priorite === "haute"
          ? { borderLeft: `3px solid hsl(var(--accent))` }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-xs text-muted-foreground">{src}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{action.echeance}</span>
      </div>

      <p className="text-sm font-semibold text-foreground mb-0.5">
        {action.contact}
        <span className="font-normal text-muted-foreground ml-1">· {action.entreprise}</span>
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        {action.description}
      </p>

      <div className="flex gap-3">
        <Link
          to={action.lien}
          className="btn-cta text-sm py-2 px-4 flex-1 justify-center"
        >
          {action.lienLabel} <ChevronRight size={13} />
        </Link>
        <button
          onClick={onDone}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <CheckCircle2 size={13} /> Fait
        </button>
      </div>
    </div>
  );
}
