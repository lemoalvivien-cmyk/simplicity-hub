import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Play, PauseCircle, CheckCircle2, Users,
  Mail, Clock, ChevronRight, BarChart2, Edit2
} from "lucide-react";

interface Etape {
  num: number;
  type: string;
  titre: string;
  delai: string;
  envoyes: number;
  ouverts: number;
  reponses: number;
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
}

const campagnesData: CampagneData[] = [
  {
    id: 1,
    nom: "Campagne Octobre — Tech PME",
    objectif: "Prospecter des PME tech en Île-de-France",
    liste: "Campagne Octobre",
    contacts: 45,
    contactsTraites: 23,
    status: "en_cours",
    date_creation: "Il y a 4 jours",
    reponses: 4,
    etapes: [
      { num: 1, type: "email", titre: "Premier contact", delai: "Immédiat", envoyes: 23, ouverts: 14, reponses: 2 },
      { num: 2, type: "relance", titre: "Relance si pas de réponse", delai: "3 jours après", envoyes: 12, ouverts: 6, reponses: 2 },
      { num: 3, type: "email", titre: "Dernier message", delai: "7 jours après", envoyes: 5, ouverts: 2, reponses: 0 },
    ],
  },
  {
    id: 2,
    nom: "Prospects RH — Novembre",
    objectif: "Présenter la solution aux RH",
    liste: "Prospects RH",
    contacts: 12,
    contactsTraites: 0,
    status: "brouillon",
    date_creation: "Il y a 1 jour",
    reponses: 0,
    etapes: [
      { num: 1, type: "email", titre: "Message d'introduction", delai: "Immédiat", envoyes: 0, ouverts: 0, reponses: 0 },
      { num: 2, type: "relance", titre: "Relance automatique", delai: "5 jours après", envoyes: 0, ouverts: 0, reponses: 0 },
    ],
  },
];

const statusConfig = {
  brouillon: { label: "Brouillon", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <Clock size={13} /> },
  en_cours: { label: "En cours", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Play size={13} /> },
  terminee: { label: "Terminée", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={13} /> },
  en_pause: { label: "En pause", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <PauseCircle size={13} /> },
};

const etapeTypeIcon: Record<string, JSX.Element> = {
  email: <Mail size={14} />,
  relance: <ChevronRight size={14} />,
};

export default function CampagneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campagne = campagnesData.find((c) => c.id === Number(id));

  if (!campagne) {
    return (
      <UserLayout>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Cette campagne n'existe pas.</p>
          <Link to="/campagnes" className="btn-primary text-sm py-2.5 px-5">
            Retour aux campagnes
          </Link>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[campagne.status];
  const progressPct = campagne.contacts > 0
    ? Math.round((campagne.contactsTraites / campagne.contacts) * 100)
    : 0;

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux campagnes
        </button>

        {/* Header */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-snug">
                {campagne.nom}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{campagne.objectif}</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Contacts", value: campagne.contacts, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
              { label: "Réponses", value: campagne.reponses, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
              { label: "Traités", value: campagne.contactsTraites, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Progression */}
          {campagne.status === "en_cours" && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Avancement</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressPct}%`, background: "hsl(var(--primary))" }}
                />
              </div>
            </div>
          )}

          {/* Liste */}
          <p className="text-xs text-muted-foreground mt-3">
            Liste : <span className="text-foreground font-medium">{campagne.liste}</span>
            {" · "} Créée {campagne.date_creation}
          </p>
        </div>

        {/* Étapes */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" />
            Les étapes de votre campagne
          </h2>
          <div className="space-y-3">
            {campagne.etapes.map((etape, i) => (
              <div key={etape.num}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  >
                    {etape.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>
                        {etapeTypeIcon[etape.type] ?? <Mail size={14} />}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{etape.titre}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{etape.delai}</p>
                    {etape.envoyes > 0 && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{etape.envoyes} envoyés</span>
                        <span style={{ color: "hsl(var(--primary))" }}>{etape.ouverts} ouverts</span>
                        {etape.reponses > 0 && (
                          <span style={{ color: "hsl(var(--success))" }}>{etape.reponses} réponse{etape.reponses > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    )}
                    {etape.envoyes === 0 && (
                      <p className="text-xs text-muted-foreground italic">Pas encore envoyé</p>
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
            ))}

            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
              + Ajouter une étape
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {campagne.status === "brouillon" && (
            <button className="btn-cta text-sm py-3 flex-1">
              <Play size={14} /> Lancer la campagne
            </button>
          )}
          {campagne.status === "en_cours" && (
            <>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: "hsl(38 95% 52% / 0.4)", color: "hsl(38 80% 30%)", background: "hsl(var(--accent-light))" }}
              >
                <PauseCircle size={14} /> Mettre en pause
              </button>
              <Link to="/contacts" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                <Users size={14} /> Voir les contacts
              </Link>
            </>
          )}
          {campagne.status === "terminee" && (
            <Link to="/campagnes" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Retour aux campagnes
            </Link>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
