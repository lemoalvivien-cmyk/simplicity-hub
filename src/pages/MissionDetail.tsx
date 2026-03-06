import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Send, Info, AlertCircle, ChevronRight, CheckCircle2, Clock, MapPin, Euro, Briefcase, Users
} from "lucide-react";
import CopilotPanel from "@/components/ai/CopilotPanel";

// ─── Données mock partagées ───────────────────────────────────────────────────
export const allMissions = [
  {
    id: 1,
    entreprise: "Acme SaaS",
    initiale: "A",
    titre: "Clients TPE en commerce et artisanat",
    description:
      "Nous cherchons des TPE qui ont besoin de simplifier leur facturation. Si vous connaissez des commerçants, artisans ou prestataires qui galèrent encore avec Excel, cette mission est pour vous.",
    besoin:
      "Un dirigeant de TPE (1 à 10 salariés) qui utilise encore Excel ou du papier pour gérer sa facturation et qui serait ouvert à découvrir un outil simple.",
    secteur: "SaaS / Tech",
    zone: "France entière",
    gain: 300,
    gainLabel: "300 € par client validé",
    status: "ouverte",
    introductions: 3,
    apres_intro:
      "L'entreprise examinera votre contact sous 72h. Si il correspond, votre gain est confirmé et versé sous 30 jours.",
  },
  {
    id: 2,
    entreprise: "FinEdge",
    initiale: "F",
    titre: "PME cherchant un financement ou crédit pro",
    description:
      "Nous accompagnons les PME dans leur recherche de financement. Si vous connaissez un dirigeant qui a du mal à obtenir un prêt ou cherche un partenaire financier, parlez-nous de lui.",
    besoin:
      "Un dirigeant de PME (10 à 250 salariés) en Île-de-France qui cherche activement un financement, un crédit professionnel ou un partenaire investisseur.",
    secteur: "Finance / Assurance",
    zone: "Île-de-France",
    gain: 500,
    gainLabel: "500 € par mise en relation aboutie",
    status: "ouverte",
    introductions: 1,
    apres_intro:
      "FinEdge contactera votre contact sous 48h. Une fois la mise en relation aboutie, votre récompense est confirmée.",
  },
  {
    id: 3,
    entreprise: "FormaPro",
    initiale: "F",
    titre: "Responsables formation en entreprise",
    description:
      "Nous proposons des formations certifiantes pour les équipes. Si vous connaissez des responsables RH ou formation qui cherchent à développer les compétences de leurs collaborateurs, contactez-nous.",
    besoin:
      "Un responsable RH ou responsable formation dans une entreprise de 20 salariés ou plus, qui a un budget formation à utiliser ou un projet de montée en compétence.",
    secteur: "Formation",
    zone: "France entière",
    gain: 200,
    gainLabel: "200 € par inscription confirmée",
    status: "ouverte",
    introductions: 0,
    apres_intro:
      "FormaPro reprend contact avec votre recommandation dans les 5 jours ouvrés. Votre gain est confirmé après inscription.",
  },
  {
    id: 4,
    entreprise: "ImmoConnect",
    initiale: "I",
    titre: "Investisseurs immobiliers en recherche de biens",
    description:
      "Nous sourcions des biens off-market pour des investisseurs qualifiés. Si vous avez des contacts dans l'investissement immobilier, cette mission peut vous rapporter.",
    besoin:
      "Un investisseur immobilier actif, à la recherche d'un bien à acquérir dans les 3 à 6 prochains mois, dans les zones de Lyon, Bordeaux ou Nantes.",
    secteur: "Immobilier",
    zone: "Lyon, Bordeaux, Nantes",
    gain: 800,
    gainLabel: "800 € par transaction réalisée",
    status: "ouverte",
    introductions: 2,
    apres_intro:
      "ImmoConnect analysera votre introduction sous 5 jours ouvrés. Si une transaction aboutit, vous recevez votre récompense.",
  },
];

const statusConfig = {
  ouverte: {
    label: "Ouverte",
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    icon: <CheckCircle2 size={13} />,
    dot: "hsl(var(--success))",
  },
  en_cours: {
    label: "En cours",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    icon: <Clock size={13} />,
    dot: "hsl(var(--primary))",
  },
  fermee: {
    label: "Fermée",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    icon: <AlertCircle size={13} />,
    dot: "hsl(var(--muted-foreground))",
  },
};

// ─── Composant étape du cycle ─────────────────────────────────────────────────
function CycleStep({
  num, label, active,
}: { num: number; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "" : "opacity-40"}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: active ? "hsl(var(--primary))" : "hsl(var(--muted))",
          color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        {num}
      </div>
      <p className="text-xs text-center text-muted-foreground leading-tight max-w-[60px]">
        {label}
      </p>
    </div>
  );
}

// ─── Formulaire Introduction ──────────────────────────────────────────────────
interface IntroFormProps {
  mission: (typeof allMissions)[0];
  onSuccess: () => void;
  onCancel: () => void;
}

function IntroductionForm({ mission, onSuccess, onCancel }: IntroFormProps) {
  const [form, setForm] = useState({ nom: "", contexte: "", pourquoi: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = form.nom.trim().length > 1 && form.contexte.trim().length > 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Merci de remplir le nom et le contexte avant d'envoyer.");
      return;
    }
    setLoading(true);
    // Simulation envoi
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1200);
  }

  return (
    <div className="card-surface p-6 mt-4">
      <h2 className="font-semibold text-foreground text-lg mb-1">
        Envoyer une introduction
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Partagez les informations de la personne que vous souhaitez présenter à{" "}
        <strong>{mission.entreprise}</strong>. C'est simple et rapide.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nom ou prénom de la personne
          </label>
          <input
            type="text"
            placeholder="Ex : Jean-Pierre Duval"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Pas besoin de l'email ou du téléphone pour l'instant.
          </p>
        </div>

        {/* Contexte */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Décrivez brièvement cette personne
          </label>
          <textarea
            rows={3}
            placeholder="Ex : Gérant d'une boulangerie à Lyon, utilise encore des cahiers pour sa compta…"
            value={form.contexte}
            onChange={(e) => setForm({ ...form, contexte: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Aidez l'entreprise à comprendre pourquoi cette personne peut être intéressante.
          </p>
        </div>

        {/* Pourquoi */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Pourquoi pensez-vous qu'elle correspond ?{" "}
            <span className="text-muted-foreground font-normal">(optionnel)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ex : Elle m'a dit la semaine dernière qu'elle cherchait un outil de facturation simple…"
            value={form.pourquoi}
            onChange={(e) => setForm({ ...form, pourquoi: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: "hsl(0 72% 95%)", color: "hsl(var(--destructive))" }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Info après envoi */}
        <div className="p-3 rounded-xl bg-muted flex gap-3 text-xs text-muted-foreground">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Après envoi, {mission.entreprise} examinera votre contact. Si tout correspond,
            votre gain de <strong className="text-foreground">{mission.gainLabel}</strong> sera confirmé.
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="btn-cta text-sm py-3 px-6 flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Envoi en cours…
              </span>
            ) : (
              <>
                <Send size={15} /> Envoyer l'introduction
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Écran succès ─────────────────────────────────────────────────────────────
function SuccessScreen({ mission, onContinue }: { mission: (typeof allMissions)[0]; onContinue: () => void }) {
  return (
    <div className="card-surface p-8 mt-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "hsl(var(--success-light))" }}
      >
        <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        Introduction envoyée !
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
        {mission.entreprise} va examiner votre contact très prochainement.{" "}
        {mission.apres_intro}
      </p>
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-6"
        style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
      >
        <Clock size={14} /> Gain potentiel : <strong>{mission.gainLabel}</strong>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/introductions" className="btn-primary text-sm py-3 px-6">
          Voir mes introductions
        </Link>
        <button
          onClick={onContinue}
          className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Voir d'autres missions
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  // Rôle simulé — dans le vrai produit : récupéré depuis le contexte auth
  const role = "facilitateur" as "facilitateur" | "entreprise";

  const mission = allMissions.find((m) => m.id === Number(id));

  if (!mission) {
    return (
      <UserLayout role={role}>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Cette mission n'existe pas ou a été supprimée.</p>
          <Link to="/missions" className="btn-primary text-sm py-2.5 px-5">
            Retour aux missions
          </Link>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[mission.status as keyof typeof statusConfig] ?? statusConfig.ouverte;

  return (
    <UserLayout role={role}>
      <div className="max-w-2xl mx-auto">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux missions
        </button>

        {/* Header mission */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                {mission.initiale}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{mission.entreprise}</p>
                <span className="badge-muted text-xs">{mission.secteur}</span>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <h1 className="font-display text-xl font-bold text-foreground mb-3 leading-snug">
            {mission.titre}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {mission.description}
          </p>

          {/* Méta */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={13} /> {mission.zone}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "hsl(var(--success))" }}
            >
              <Euro size={13} /> {mission.gainLabel}
            </div>
            {mission.introductions > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={13} /> {mission.introductions} introduction{mission.introductions > 1 ? "s" : ""} déjà envoyée{mission.introductions > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Ce qu'il faut faire */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-primary" />
            Qui cherche-t-on exactement ?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{mission.besoin}</p>
        </div>

        {/* Cycle */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">
            Ce qui se passe, étape par étape
          </h2>
          <div className="flex items-start justify-between gap-2">
            <CycleStep num={1} label="Vous envoyez une intro" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={2} label="L'entreprise examine" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={3} label="Elle valide" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={4} label="Vous recevez votre gain" active />
          </div>
          <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-xl leading-relaxed">
            {mission.apres_intro}
          </p>
        </div>

        {/* CTA ou formulaire ou succès — côté facilitateur */}
        {role === "facilitateur" && (
          <>
            {success ? (
              <SuccessScreen mission={mission} onContinue={() => navigate("/missions")} />
            ) : showForm ? (
              <IntroductionForm
                mission={mission}
                onSuccess={() => { setSuccess(true); setShowForm(false); }}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-cta text-sm py-3 px-6 flex-1"
                >
                  <Send size={15} /> Envoyer une introduction
                </button>
                <Link
                  to="/missions"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Voir d'autres missions
                </Link>
              </div>
            )}
          </>
        )}

        {/* Vue entreprise */}
        {role === "entreprise" && (
          <div className="card-surface p-5 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Introductions reçues</h2>
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
              >
                {mission.introductions}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {mission.introductions === 0
                ? "Aucune introduction reçue pour cette mission pour l'instant."
                : `Vous avez reçu ${mission.introductions} introduction${mission.introductions > 1 ? "s" : ""}. Rendez-vous dans la section Introductions pour les examiner.`}
            </p>
            <Link to="/introductions" className="btn-primary text-sm py-2.5 px-5">
              Voir les introductions reçues
            </Link>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
