import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle,
  Send, Info, Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";

interface IntroReçue {
  id: number;
  apporteur: string;
  contact: string;
  contexte: string;
  pourquoi?: string;
  mission: string;
  missionId: number;
  date: string;
  status: Status;
}

const introductionsReçues: IntroReçue[] = [
  {
    id: 1,
    apporteur: "Marc Lefèvre",
    contact: "Jean-Pierre Duval",
    contexte: "Gérant d'une boulangerie à Lyon, utilise encore des feuilles Excel pour sa facturation.",
    pourquoi: "Il cherche une solution plus simple depuis quelques mois.",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    date: "Aujourd'hui à 10h23",
    status: "en_attente",
  },
  {
    id: 2,
    apporteur: "Sophie Martin",
    contact: "Nathalie Bonnet",
    contexte: "Propriétaire d'une fleuriste avec 2 employées, galère avec la facturation papier.",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    date: "Hier à 15h00",
    status: "en_cours",
  },
  {
    id: 3,
    apporteur: "Thomas Renaud",
    contact: "Éric Gauthier",
    contexte: "Menuisier indépendant, cherche à simplifier ses devis clients.",
    mission: "Clients TPE en commerce et artisanat",
    missionId: 1,
    date: "Il y a 3 jours",
    status: "validee",
  },
];

const statusConfig: Record<Status, { icon: JSX.Element; color: string; bg: string; label: string }> = {
  en_attente: {
    icon: <Clock size={13} />,
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    label: "À examiner",
  },
  en_cours: {
    icon: <ChevronRight size={13} />,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    label: "En cours",
  },
  validee: {
    icon: <CheckCircle2 size={13} />,
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    label: "Validée",
  },
  refusee: {
    icon: <XCircle size={13} />,
    color: "hsl(var(--destructive))",
    bg: "hsl(0 72% 95%)",
    label: "Refusée",
  },
};

// ─── Composant carte intro + actions validation ───────────────────────────────
interface IntroCardProps {
  intro: IntroReçue;
  onValidate: (id: number) => void;
  onRefuse: (id: number) => void;
}

function IntroCard({ intro, onValidate, onRefuse }: IntroCardProps) {
  const cfg = statusConfig[intro.status];
  const [confirming, setConfirming] = useState<"valider" | "refuser" | null>(null);

  return (
    <div className="card-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-foreground">{intro.contact}</p>
          <p className="text-xs text-muted-foreground">
            Présenté par <strong>{intro.apporteur}</strong> · {intro.date}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Mission liée */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Briefcase size={12} />
        <span>Mission :</span>
        <Link to={`/missions/${intro.missionId}`} className="text-primary font-medium hover:underline">
          {intro.mission}
        </Link>
      </div>

      {/* Contexte */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{intro.contexte}</p>
      {intro.pourquoi && (
        <p className="text-xs text-muted-foreground italic leading-relaxed mb-3">
          "{intro.pourquoi}"
        </p>
      )}

      {/* Actions validation — uniquement si en attente */}
      {intro.status === "en_attente" && (
        <>
          {confirming === null ? (
            <>
              <div className="p-3 rounded-xl bg-muted text-xs text-muted-foreground leading-relaxed mb-4 flex gap-2">
                <Info size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                <span>
                  Si vous validez ce contact, son gain sera confirmé et versé sous 30 jours.
                  Si vous refusez, l'apporteur sera informé avec une explication.
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming("valider")}
                  className="btn-cta text-sm py-2.5 px-5 flex-1"
                >
                  <CheckCircle2 size={14} /> Valider ce contact
                </button>
                <button
                  onClick={() => setConfirming("refuser")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-muted"
                  style={{ borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}
                >
                  <XCircle size={14} /> Refuser
                </button>
              </div>
            </>
          ) : (
            <div
              className="p-4 rounded-xl border"
              style={{
                borderColor: confirming === "valider"
                  ? "hsl(var(--success) / 0.3)"
                  : "hsl(var(--destructive) / 0.3)",
                background: confirming === "valider"
                  ? "hsl(var(--success-light))"
                  : "hsl(0 72% 97%)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} style={{ color: confirming === "valider" ? "hsl(var(--success))" : "hsl(var(--destructive))" }} />
                <p className="text-sm font-semibold text-foreground">
                  {confirming === "valider"
                    ? "Confirmer la validation ?"
                    : "Confirmer le refus ?"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {confirming === "valider"
                  ? "En validant, vous confirmez que ce contact correspond à vos critères. L'apporteur recevra sa récompense sous 30 jours."
                  : "En refusant, l'apporteur sera informé que ce contact ne correspond pas à vos critères actuels."}
              </p>
              <div className="flex gap-3">
              <button
                  onClick={() => confirming === "valider" ? onValidate(intro.id) : onRefuse(intro.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={
                    confirming === "valider"
                      ? { background: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }
                      : { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }
                  }
                >
                  {confirming === "valider" ? "Oui, valider" : "Oui, refuser"}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Statut final */}
      {intro.status === "validee" && (
        <div
          className="flex items-center gap-2 text-xs font-medium p-3 rounded-xl"
          style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
        >
          <CheckCircle2 size={13} /> Vous avez validé ce contact. La récompense de l'apporteur est en cours de traitement.
        </div>
      )}

      {intro.status === "refusee" && (
        <div
          className="flex items-center gap-2 text-xs font-medium p-3 rounded-xl"
          style={{ background: "hsl(0 72% 95%)", color: "hsl(var(--destructive))" }}
        >
          <XCircle size={13} /> Vous avez refusé cette introduction.
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntroductionsEntreprise() {
  const [intros, setIntros] = useState(introductionsReçues);
  const [activeTab, setActiveTab] = useState<Status | "toutes">("toutes");

  function handleValidate(id: number) {
    setIntros((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "validee" as Status } : i))
    );
  }

  function handleRefuse(id: number) {
    setIntros((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "refusee" as Status } : i))
    );
  }

  const aExaminer = intros.filter((i) => i.status === "en_attente").length;

  const filtered =
    activeTab === "toutes" ? intros : intros.filter((i) => i.status === activeTab);

  const tabs: { id: Status | "toutes"; label: string }[] = [
    { id: "toutes", label: "Toutes" },
    { id: "en_attente", label: `À examiner${aExaminer > 0 ? ` (${aExaminer})` : ""}` },
    { id: "en_cours", label: "En cours" },
    { id: "validee", label: "Validées" },
    { id: "refusee", label: "Refusées" },
  ];

  return (
    <UserLayout role="entreprise">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Introductions reçues
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici les contacts que des apporteurs d'affaires vous ont présentés.
            Examinez-les et validez ou refusez selon vos critères.
          </p>
        </div>

        {/* Alerte si introductions à examiner */}
        {aExaminer > 0 && (
          <div
            className="p-4 rounded-xl border mb-5 flex items-start gap-3"
            style={{
              borderColor: "hsl(38 95% 52% / 0.3)",
              background: "hsl(var(--accent-light))",
            }}
          >
            <Clock size={16} style={{ color: "hsl(38 80% 30%)" }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {aExaminer} introduction{aExaminer > 1 ? "s" : ""} attend{aExaminer > 1 ? "ent" : ""} votre réponse
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les apporteurs attendent votre validation. Répondez dans les 72h pour maintenir une bonne relation.
              </p>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Send size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune introduction ici</p>
            <p className="text-sm text-muted-foreground">
              Les introductions apparaîtront ici dès qu'un apporteur vous présentera un contact.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((intro) => (
              <IntroCard
                key={intro.id}
                intro={intro}
                onValidate={handleValidate}
                onRefuse={handleRefuse}
              />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
