import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, ChevronRight,
  Send, AlertCircle, Euro, Briefcase
} from "lucide-react";

type Status = "envoyee" | "en_attente" | "en_cours" | "validee" | "refusee";

interface HistoryItem {
  date: string;
  action: string;
  detail?: string;
}

interface IntroductionData {
  id: number;
  contact: string;
  contexte: string;
  pourquoi?: string;
  mission: string;
  missionId: number;
  entreprise: string;
  date: string;
  status: Status;
  prochaine_action: string;
  qui_agit: "vous" | "entreprise" | "personne";
  gain?: number;
  historique: HistoryItem[];
}

const introductionsData: IntroductionData[] = [
  {
    id: 1,
    contact: "Jean-Pierre Duval",
    contexte: "Gérant d'une boulangerie à Lyon, utilise encore des feuilles Excel pour sa facturation.",
    pourquoi: "Il m'a confié la semaine dernière qu'il cherchait une solution plus simple.",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    entreprise: "Acme SaaS",
    date: "Aujourd'hui à 10h23",
    status: "en_attente",
    prochaine_action: "Acme SaaS doit maintenant examiner si Jean-Pierre Duval correspond à leurs critères. Vous serez notifié(e) dès qu'ils auront répondu.",
    qui_agit: "entreprise",
    historique: [
      { date: "Aujourd'hui à 10h23", action: "Introduction envoyée", detail: "Vous avez présenté Jean-Pierre Duval à Acme SaaS." },
    ],
  },
  {
    id: 2,
    contact: "Isabelle Petit",
    contexte: "Dirigeante d'une boutique de prêt-à-porter, 3 salariés, cherche à mieux gérer ses devis.",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    entreprise: "Acme SaaS",
    date: "Il y a 2 jours",
    status: "validee",
    prochaine_action: "Votre introduction a été validée. Votre gain de 300 € sera versé sous 30 jours.",
    qui_agit: "personne",
    gain: 300,
    historique: [
      { date: "Il y a 2 jours à 14h00", action: "Introduction envoyée", detail: "Vous avez présenté Isabelle Petit à Acme SaaS." },
      { date: "Hier à 09h15", action: "Examinée par Acme SaaS", detail: "L'entreprise a étudié votre introduction." },
      { date: "Aujourd'hui à 08h30", action: "Validée ✓", detail: "Acme SaaS a confirmé que ce contact correspond à leurs critères." },
    ],
  },
  {
    id: 3,
    contact: "Gérard Morin",
    contexte: "Directeur financier d'une PME de 40 salariés, cherche un crédit de 150 000 € pour financer du matériel.",
    mission: "PME cherchant un financement ou crédit pro",
    missionId: 2,
    entreprise: "FinEdge",
    date: "Hier",
    status: "en_cours",
    prochaine_action: "FinEdge a accepté votre introduction. Un premier échange est en cours entre leurs équipes et Gérard Morin.",
    qui_agit: "entreprise",
    historique: [
      { date: "Hier à 11h30", action: "Introduction envoyée", detail: "Vous avez présenté Gérard Morin à FinEdge." },
      { date: "Hier à 16h00", action: "Acceptée par FinEdge", detail: "FinEdge a jugé votre contact pertinent et a pris contact." },
    ],
  },
  {
    id: 4,
    contact: "Céline Rousseau",
    contexte: "Responsable RH d'une entreprise de 15 salariés, en recherche de formations pour son équipe.",
    mission: "Responsables formation en entreprise",
    missionId: 3,
    entreprise: "FormaPro",
    date: "Il y a 5 jours",
    status: "refusee",
    prochaine_action: "Ce contact ne correspondait pas aux critères de FormaPro. Vous pouvez essayer avec une autre personne sur cette mission ou choisir une autre mission.",
    qui_agit: "vous",
    historique: [
      { date: "Il y a 5 jours à 09h00", action: "Introduction envoyée", detail: "Vous avez présenté Céline Rousseau à FormaPro." },
      { date: "Il y a 4 jours à 14h00", action: "Examinée par FormaPro", detail: "L'entreprise a étudié votre introduction." },
      { date: "Il y a 3 jours à 10h00", action: "Refusée", detail: "FormaPro indique que l'entreprise compte moins de 20 salariés, ce qui ne correspond pas à leurs critères actuels." },
    ],
  },
];

const statusConfig: Record<Status, {
  icon: JSX.Element;
  color: string;
  bg: string;
  label: string;
  explication: string;
}> = {
  envoyee: {
    icon: <Send size={13} />,
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    label: "Envoyée",
    explication: "Votre introduction a été envoyée et attend d'être examinée.",
  },
  en_attente: {
    icon: <Clock size={13} />,
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    label: "En attente",
    explication: "L'entreprise n'a pas encore répondu. Elle a généralement 72h pour examiner votre contact.",
  },
  en_cours: {
    icon: <ChevronRight size={13} />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    label: "En cours",
    explication: "L'entreprise a accepté votre introduction et est en train d'échanger avec votre contact.",
  },
  validee: {
    icon: <CheckCircle2 size={13} />,
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    label: "Validée ✓",
    explication: "L'entreprise a confirmé que votre contact correspond à ses critères. Votre gain est confirmé.",
  },
  refusee: {
    icon: <XCircle size={13} />,
    color: "hsl(var(--destructive))",
    bg: "hsl(0 72% 95%)",
    label: "Refusée",
    explication: "L'entreprise a indiqué que ce contact ne correspond pas à ses critères actuels.",
  },
};

const quiAgitLabel: Record<IntroductionData["qui_agit"], string> = {
  vous: "C'est à vous d'agir",
  entreprise: "En attente de l'entreprise",
  personne: "Rien à faire pour l'instant",
};

export default function IntroductionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const role: "facilitateur" | "entreprise" = "facilitateur";
  const intro = introductionsData.find((i) => i.id === Number(id));

  if (!intro) {
    return (
      <UserLayout role={role}>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Cette introduction n'existe pas.</p>
          <Link to="/introductions" className="btn-primary text-sm py-2.5 px-5">
            Retour aux introductions
          </Link>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[intro.status];

  return (
    <UserLayout role={role}>
      <div className="max-w-2xl mx-auto">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux introductions
        </button>

        {/* Header */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
              >
                {intro.contact.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg leading-tight">
                  {intro.contact}
                </p>
                <p className="text-xs text-muted-foreground">{intro.date}</p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Explication statut */}
          <div
            className="p-3 rounded-xl text-xs leading-relaxed mb-4"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <strong>Ce que ça veut dire :</strong> {cfg.explication}
          </div>

          {/* Mission liée */}
          <div className="flex items-start gap-2 mb-3">
            <Briefcase size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Mission</p>
              <Link
                to={`/missions/${intro.missionId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {intro.mission}
              </Link>
              <span className="text-xs text-muted-foreground ml-2">— {intro.entreprise}</span>
            </div>
          </div>

          {/* Gain si validée */}
          {intro.gain && intro.status === "validee" && (
            <div
              className="flex items-center gap-2 text-sm font-semibold p-3 rounded-xl"
              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
            >
              <Euro size={15} /> Gain confirmé : <strong>{intro.gain} €</strong>
              <span className="font-normal text-xs ml-1">— versement sous 30 jours</span>
            </div>
          )}
        </div>

        {/* Ce que vous avez envoyé */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-3">Ce que vous avez partagé</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description du contact</p>
              <p className="text-sm text-foreground leading-relaxed">{intro.contexte}</p>
            </div>
            {intro.pourquoi && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pourquoi ce contact est pertinent</p>
                <p className="text-sm text-foreground leading-relaxed">{intro.pourquoi}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochaine étape */}
        <div
          className="p-5 rounded-xl mb-4 border"
          style={{
            borderColor: intro.status === "validee"
              ? "hsl(var(--success) / 0.3)"
              : intro.status === "refusee"
              ? "hsl(var(--destructive) / 0.2)"
              : "hsl(var(--primary) / 0.2)",
            background: intro.status === "validee"
              ? "hsl(var(--success-light))"
              : intro.status === "refusee"
              ? "hsl(0 72% 97%)"
              : "hsl(var(--secondary))",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="font-semibold text-foreground text-sm">Ce qui se passe maintenant</p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {quiAgitLabel[intro.qui_agit]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {intro.prochaine_action}
          </p>
        </div>

        {/* Historique */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Historique</h2>
          <div className="space-y-4">
            {intro.historique.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{
                      background: i === intro.historique.length - 1
                        ? cfg.color
                        : "hsl(var(--border))",
                    }}
                  />
                  {i < intro.historique.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: "hsl(var(--border))" }} />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{item.date}</p>
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions selon statut */}
        {intro.status === "refusee" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/missions/${intro.missionId}`}
              className="btn-cta text-sm py-3 px-5 flex-1 justify-center"
            >
              <Send size={14} /> Essayer avec un autre contact
            </Link>
            <Link
              to="/missions"
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Voir d'autres missions
            </Link>
          </div>
        )}

        {intro.status === "validee" && (
          <Link to="/gains" className="btn-primary text-sm py-3 px-6 w-full justify-center">
            <Euro size={15} /> Voir mes gains
          </Link>
        )}
      </div>
    </UserLayout>
  );
}
