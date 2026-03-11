import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase,
  CheckCircle2, Clock, ChevronRight, Send, Plus,
  ListOrdered, AlertCircle
} from "lucide-react";
import CopilotPanel from "@/components/ai/CopilotPanel";

interface ContactData {
  id: number;
  prenom: string;
  nom: string;
  entreprise: string;
  poste?: string;
  email?: string;
  telephone?: string;
  status: string;
  source: string;
  liste?: string;
  listeLien?: string;
  prochaine_action?: string;
  date_ajout: string;
  missionLiee?: string;
  missionId?: number;
  introductionId?: number;
  historique: { date: string; action: string; detail?: string }[];
}

const contactsData: ContactData[] = [
  {
    id: 1, prenom: "Jean-Pierre", nom: "Duval", entreprise: "Boulangerie Duval",
    poste: "Gérant", email: "jp.duval@boulangerie.fr",
    status: "en_discussion", source: "introduction",
    liste: "Mission Acme SaaS", listeLien: "/missions/1",
    prochaine_action: "Attendre la réponse d'Acme SaaS",
    date_ajout: "Aujourd'hui",
    missionLiee: "Clients TPE en commerce", missionId: 1, introductionId: 1,
    historique: [
      { date: "Aujourd'hui à 10h23", action: "Introduction envoyée à Acme SaaS", detail: "Ce contact a été présenté via une introduction." },
    ],
  },
  {
    id: 2, prenom: "Gérard", nom: "Morin", entreprise: "Morin Industrie",
    poste: "Directeur financier", email: "g.morin@morin.com", telephone: "06 12 34 56 78",
    status: "en_discussion", source: "introduction",
    liste: "Mission FinEdge", listeLien: "/missions/2",
    prochaine_action: "Suivi avec FinEdge en cours",
    date_ajout: "Hier",
    missionLiee: "PME cherchant financement", missionId: 2, introductionId: 3,
    historique: [
      { date: "Hier à 11h30", action: "Introduction envoyée à FinEdge" },
      { date: "Hier à 16h00", action: "Acceptée par FinEdge", detail: "FinEdge a jugé ce contact pertinent." },
    ],
  },
  {
    id: 3, prenom: "Isabelle", nom: "Petit", entreprise: "Boutique Isabelle",
    poste: "Gérante", email: "isabelle@boutique.fr",
    status: "converti", source: "introduction",
    liste: "Mission Acme SaaS",
    date_ajout: "Il y a 2 jours",
    missionLiee: "Clients TPE en commerce", missionId: 1, introductionId: 2,
    historique: [
      { date: "Il y a 2 jours à 14h00", action: "Introduction envoyée à Acme SaaS" },
      { date: "Hier à 09h15", action: "Examinée par Acme SaaS" },
      { date: "Aujourd'hui à 08h30", action: "Validée ✓", detail: "Acme SaaS a confirmé ce contact. Gain de 300 € confirmé." },
    ],
  },
  {
    id: 4, prenom: "Sophie", nom: "Martin", entreprise: "RH Conseil",
    poste: "Responsable RH", email: "s.martin@rhconseil.fr",
    status: "a_contacter", source: "import",
    liste: "Prospects RH",
    prochaine_action: "Premier contact à prendre",
    date_ajout: "Il y a 3 jours",
    historique: [
      { date: "Il y a 3 jours", action: "Importé depuis le fichier Excel" },
    ],
  },
  {
    id: 5, prenom: "Antoine", nom: "Leblanc", entreprise: "Tech Solutions",
    poste: "CEO", email: "a.leblanc@techsolutions.fr", telephone: "06 98 76 54 32",
    status: "contacte", source: "prospection",
    liste: "Campagne Octobre", listeLien: "/missions",
    prochaine_action: "Relancer dans 5 jours",
    date_ajout: "Il y a 4 jours",
    historique: [
      { date: "Il y a 4 jours", action: "Ajouté à la campagne Octobre" },
      { date: "Il y a 3 jours", action: "Email de prospection envoyé" },
      { date: "Il y a 2 jours", action: "Email ouvert", detail: "Antoine a ouvert votre email mais n'a pas encore répondu." },
    ],
  },
  {
    id: 6, prenom: "Marie", nom: "Fontaine", entreprise: "Cabinet MF",
    poste: "Directrice", email: "m.fontaine@cabinet.fr",
    status: "pas_interesse", source: "import",
    liste: "Prospects RH",
    date_ajout: "Il y a 1 semaine",
    historique: [
      { date: "Il y a 1 semaine", action: "Importé depuis fichier" },
      { date: "Il y a 5 jours", action: "Email envoyé" },
      { date: "Il y a 4 jours", action: "Pas intéressée", detail: "Marie a répondu qu'elle n'était pas disponible pour l'instant." },
    ],
  },
];

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  a_contacter: { label: "À contacter", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  contacte: { label: "Contacté", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  en_discussion: { label: "En discussion", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  converti: { label: "Converti ✓", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  pas_interesse: { label: "Pas intéressé", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

const sourceLabels: Record<string, string> = {
  import: "Importé depuis un fichier",
  manuel: "Ajouté manuellement",
  introduction: "Venu d'une introduction",
  prospection: "Issu d'une campagne de prospection",
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contact = contactsData.find((c) => c.id === Number(id));

  if (!contact) {
    return (
      <UserLayout>
        <div className="max-w-xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Ce contact n'existe pas.</p>
          <Link to="/contacts" className="btn-primary text-sm py-2.5 px-5">
            Retour aux contacts
          </Link>
        </div>
      </UserLayout>
    );
  }

  const stCfg = statusLabels[contact.status] ?? statusLabels.a_contacter;

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux contacts
        </button>

        {/* Carte identité */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
              >
                {contact.prenom.charAt(0)}{contact.nom.charAt(0)}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">
                  {contact.prenom} {contact.nom}
                </h1>
                {contact.poste && (
                  <p className="text-sm text-muted-foreground">{contact.poste}</p>
                )}
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: stCfg.color, background: stCfg.bg }}
            >
              {stCfg.label}
            </span>
          </div>

          {/* Infos */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={14} className="text-muted-foreground shrink-0" />
              <span className="text-foreground font-medium">{contact.entreprise}</span>
            </div>
            {contact.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-muted-foreground shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.telephone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-muted-foreground shrink-0" />
                <a href={`tel:${contact.telephone}`} className="text-primary hover:underline">
                  {contact.telephone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Briefcase size={14} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{sourceLabels[contact.source]}</span>
            </div>
          </div>

          {/* Prochaine action */}
          {contact.prochaine_action && (
            <div
              className="mt-4 p-3 rounded-xl text-sm flex items-start gap-2"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
            >
              <ChevronRight size={14} className="shrink-0 mt-0.5" />
              <span className="font-medium">{contact.prochaine_action}</span>
            </div>
          )}
        </div>

        {/* Lien mission / introduction */}
        {contact.missionLiee && (
          <div className="card-surface p-5 mb-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Send size={15} className="text-primary" />
              Lié à une introduction
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                <div>
                  <p className="text-xs text-muted-foreground">Mission</p>
                  <Link to={`/missions/${contact.missionId}`} className="text-sm font-medium text-primary hover:underline">
                    {contact.missionLiee}
                  </Link>
                </div>
                <ChevronRight size={13} className="text-muted-foreground shrink-0" />
              </div>
              {contact.introductionId && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted">
                  <div>
                    <p className="text-xs text-muted-foreground">Introduction envoyée</p>
                    <Link to={`/introductions/${contact.introductionId}`} className="text-sm font-medium text-primary hover:underline">
                      Voir le suivi de l'introduction
                    </Link>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste associée */}
        {contact.liste && (
          <div className="card-surface p-5 mb-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <ListOrdered size={15} className="text-primary" />
              Liste associée
            </h2>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
              <p className="text-sm font-medium text-foreground">{contact.liste}</p>
              {contact.listeLien && (
                <Link to={contact.listeLien} className="text-xs text-primary font-medium hover:underline">
                  Voir
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Historique */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Historique</h2>
          <div className="space-y-4">
            {contact.historique.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{
                      background: i === contact.historique.length - 1
                        ? stCfg.color
                        : "hsl(var(--border))",
                    }}
                  />
                  {i < contact.historique.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: "hsl(var(--border))" }} />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{item.date}</p>
                  <p className="text-sm font-medium text-foreground">{item.action}</p>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ajouter une note */}
          <button className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            <Plus size={13} /> Ajouter une note
          </button>
        </div>

        {/* Copilot — aide sur ce contact */}
        <CopilotPanel
          context="contact"
          textToImprove={`${contact.prenom} ${contact.nom} — ${contact.entreprise}${contact.poste ? `, ${contact.poste}` : ""}. Source: ${sourceLabels[contact.source]}. Statut: ${stCfg.label}.`}
          userRole="facilitateur"
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="btn-cta text-sm py-3 px-5 flex-1 justify-center"
            >
              <Mail size={14} /> Écrire un email
            </a>
          )}
          {contact.telephone && (
            <a
              href={`tel:${contact.telephone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Phone size={14} /> Appeler
            </a>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
