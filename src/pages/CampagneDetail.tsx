import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Play, PauseCircle, CheckCircle2, Users,
  Mail, Clock, ChevronRight, BarChart2, Edit2, Phone,
  Target, Sparkles, MessageCircle, Plus, ArrowRight
} from "lucide-react";

/* ─── TYPES ────────────────────────────────────────────────── */
interface Etape {
  num: number;
  type: "email" | "relance" | "appel" | "message";
  titre: string;
  delai: string;
  description?: string;
  envoyes: number;
  ouverts: number;
  reponses: number;
  statut: "termine" | "en_cours" | "a_venir";
}

interface CampagneData {
  id: number;
  nom: string;
  objectif: string;
  liste: string;
  contacts: number;
  contactsTraites: number;
  status: "brouillon" | "en_cours" | "terminee" | "en_pause";
  date_creation: string;
  etapes: Etape[];
  reponses: number;
  canal: "email" | "telephone" | "mixte";
  opportunites_generees: number;
}

/* ─── DONNÉES MOCK ─────────────────────────────────────────── */
const campagnesData: CampagneData[] = [
  {
    id: 1, nom: "Campagne Octobre — Tech PME",
    objectif: "Entrer en contact avec des PME tech en Île-de-France pour leur présenter notre solution.",
    liste: "Campagne Octobre", contacts: 45, contactsTraites: 23,
    status: "en_cours", date_creation: "Il y a 4 jours", reponses: 4,
    canal: "email", opportunites_generees: 2,
    etapes: [
      {
        num: 1, type: "email", titre: "Premier contact",
        description: "Présentation courte et claire de votre offre.",
        delai: "Immédiat", envoyes: 23, ouverts: 14, reponses: 2, statut: "en_cours",
      },
      {
        num: 2, type: "relance", titre: "Relance si pas de réponse",
        description: "Un message court pour rappeler votre existence — sans forcer.",
        delai: "3 jours après", envoyes: 12, ouverts: 6, reponses: 2, statut: "en_cours",
      },
      {
        num: 3, type: "email", titre: "Dernier message",
        description: "Le dernier message avant de fermer la séquence sur ce contact.",
        delai: "7 jours après", envoyes: 5, ouverts: 2, reponses: 0, statut: "a_venir",
      },
    ],
  },
  {
    id: 2, nom: "Prospects RH — Novembre",
    objectif: "Présenter la solution aux responsables RH d'entreprises de 50 à 200 personnes.",
    liste: "Prospects RH", contacts: 12, contactsTraites: 0,
    status: "brouillon", date_creation: "Il y a 1 jour", reponses: 0,
    canal: "mixte", opportunites_generees: 0,
    etapes: [
      {
        num: 1, type: "email", titre: "Message d'introduction",
        description: "Présentez-vous et expliquez pourquoi vous les contactez.",
        delai: "Immédiat", envoyes: 0, ouverts: 0, reponses: 0, statut: "a_venir",
      },
      {
        num: 2, type: "appel", titre: "Appel de suivi",
        description: "Un appel court pour qualifier l'intérêt.",
        delai: "5 jours après", envoyes: 0, ouverts: 0, reponses: 0, statut: "a_venir",
      },
    ],
  },
];

/* ─── CONFIGS ──────────────────────────────────────────────── */
const statusConfig = {
  brouillon: { label: "Brouillon", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <Clock size={13} /> },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Play size={13} /> },
  terminee: { label: "Terminée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={13} /> },
  en_pause: { label: "En pause", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <PauseCircle size={13} /> },
};

const etapeTypeConfig: Record<string, { icon: JSX.Element; label: string; color: string }> = {
  email: { icon: <Mail size={14} />, label: "Email", color: "hsl(220 80% 45%)" },
  relance: { icon: <ChevronRight size={14} />, label: "Relance", color: "hsl(38 80% 30%)" },
  appel: { icon: <Phone size={14} />, label: "Appel", color: "hsl(var(--primary))" },
  message: { icon: <MessageCircle size={14} />, label: "Message", color: "hsl(var(--success))" },
};

const etapeStatutConfig = {
  termine: { label: "Terminée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  a_venir: { label: "À venir", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────── */
export default function CampagneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCopilot, setShowCopilot] = useState(false);

  const campagne = id && id !== "nouvelle"
    ? campagnesData.find((c) => c.id === Number(id))
    : null;

  // Mode "nouvelle campagne"
  if (id === "nouvelle" || !campagne) {
    return (
      <UserLayout>
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Retour aux campagnes
          </button>
          <div className="card-surface p-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--secondary))" }}
            >
              <Play size={24} className="text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground mb-2">
              Créer une nouvelle campagne
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Choisissez une liste de contacts, définissez quelques étapes et lancez. C'est tout.
            </p>
            <div className="space-y-3 text-left">
              {[
                { num: 1, label: "Donnez un nom à votre campagne" },
                { num: 2, label: "Choisissez une liste de contacts" },
                { num: 3, label: "Définissez vos étapes (email, appel, relance…)" },
                { num: 4, label: "Lancez quand vous êtes prêt" },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {step.num}
                  </div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                </div>
              ))}
            </div>
            <button className="btn-cta w-full mt-6 py-3 text-sm">
              <Plus size={14} /> Commencer
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[campagne.status];
  const progressPct = campagne.contacts > 0
    ? Math.round((campagne.contactsTraites / campagne.contacts) * 100)
    : 0;

  const tauxReponse = campagne.contactsTraites > 0
    ? Math.round((campagne.reponses / campagne.contactsTraites) * 100)
    : 0;

  return (
    <UserLayout jarvisContext="campagne">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux campagnes
        </button>

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground leading-snug mb-1">
                {campagne.nom}
              </h1>
              <p className="text-sm text-muted-foreground">{campagne.objectif}</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[
              { label: "Contacts", value: campagne.contacts, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
              { label: "Traités", value: campagne.contactsTraites, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
              { label: "Réponses", value: campagne.reponses, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "Taux réponse", value: `${tauxReponse}%`, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-lg font-bold leading-tight" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Progression */}
          {campagne.status === "en_cours" && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Avancement</span>
                <span>{progressPct}% — {campagne.contactsTraites} sur {campagne.contacts}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, background: "hsl(var(--primary))" }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
            <span>Liste : <span className="text-foreground font-medium">{campagne.liste}</span></span>
            <span>·</span>
            <span>Créée {campagne.date_creation}</span>
            {campagne.opportunites_generees > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "hsl(var(--success))" }}>
                  <Target size={11} className="inline mr-1" />
                  {campagne.opportunites_generees} opportunité{campagne.opportunites_generees > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── PLAN D'ACTION (PLAYBOOK) ──────────────────────────── */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart2 size={16} className="text-primary" />
              Plan d'action
            </h2>
            <p className="text-xs text-muted-foreground">{campagne.etapes.length} étapes</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Voici la suite d'actions prévue pour chaque contact de cette campagne.
          </p>

          <div className="space-y-3">
            {campagne.etapes.map((etape, i) => {
              const typeCfg = etapeTypeConfig[etape.type] || etapeTypeConfig.email;
              const statutCfg = etapeStatutConfig[etape.statut];
              return (
                <div key={etape.num}>
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: etape.statut === "en_cours" ? "hsl(var(--secondary))" : "hsl(var(--muted))" }}
                  >
                    {/* Numéro */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        background: etape.statut === "a_venir" ? "hsl(var(--border))" : "hsl(var(--primary))",
                        color: etape.statut === "a_venir" ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                      }}
                    >
                      {etape.num}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Titre + type */}
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span style={{ color: typeCfg.color }}>{typeCfg.icon}</span>
                        <p className="text-sm font-semibold text-foreground">{etape.titre}</p>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: statutCfg.color, background: statutCfg.bg }}
                        >
                          {statutCfg.label}
                        </span>
                      </div>
                      {/* Description */}
                      {etape.description && (
                        <p className="text-xs text-muted-foreground mb-1">{etape.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">
                        <Clock size={10} className="inline mr-1" />{etape.delai}
                      </p>
                      {/* Métriques */}
                      {etape.envoyes > 0 && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="text-muted-foreground">{etape.envoyes} envoyés</span>
                          <span style={{ color: "hsl(var(--primary))" }}>{etape.ouverts} ouverts</span>
                          {etape.reponses > 0 && (
                            <span style={{ color: "hsl(var(--success))" }}>
                              {etape.reponses} réponse{etape.reponses > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}
                      {etape.envoyes === 0 && (
                        <p className="text-xs text-muted-foreground italic">Pas encore démarré</p>
                      )}
                    </div>

                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors shrink-0">
                      <Edit2 size={13} />
                    </button>
                  </div>

                  {i < campagne.etapes.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ChevronRight size={14} className="text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}

            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <Plus size={13} /> Ajouter une étape
            </button>
          </div>
        </div>

        {/* ── AIDE COPILOT ─────────────────────────────────────── */}
        <div className="card-surface p-5 mb-4">
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Améliorer cette campagne</p>
                <p className="text-xs text-muted-foreground">JARVIS peut suggérer des améliorations.</p>
              </div>
            </div>
            <ChevronRight size={15} className={`text-muted-foreground transition-transform ${showCopilot ? "rotate-90" : ""}`} />
          </button>

          {showCopilot && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  "Rendre l'objectif plus clair",
                  "Améliorer le premier message",
                  "Que dois-je faire ensuite ?",
                  "Cette campagne est-elle efficace ?",
                ].map((q) => (
                  <Link
                    key={q}
                    to="/assistant"
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    {q}
                  </Link>
                ))}
              </div>
              <Link to="/assistant" className="btn-cta text-sm py-2.5 px-4 w-full justify-center">
                <MessageCircle size={13} /> Parler à JARVIS de cette campagne
              </Link>
            </div>
          )}
        </div>

        {/* ── ACTIONS CAMPAGNE ──────────────────────────────────── */}
        <div className="flex gap-3 flex-wrap">
          {campagne.status === "brouillon" && (
            <button className="btn-cta text-sm py-3 flex-1 min-w-[140px]">
              <Play size={14} /> Lancer la campagne
            </button>
          )}
          {campagne.status === "en_cours" && (
            <>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-colors min-w-[140px]"
                style={{ borderColor: "hsl(38 95% 52% / 0.4)", color: "hsl(38 80% 30%)", background: "hsl(var(--accent-light))" }}
              >
                <PauseCircle size={14} /> Mettre en pause
              </button>
              <Link
                to="/contacts"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[140px]"
              >
                <Users size={14} /> Voir les contacts
              </Link>
            </>
          )}
          {campagne.status === "terminee" && (
            <>
              <Link
                to="/campagnes"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Retour aux campagnes
              </Link>
              <Link
                to="/contacts"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
              >
                <ArrowRight size={14} /> Voir les réponses
              </Link>
            </>
          )}
        </div>

      </div>
    </UserLayout>
  );
}
