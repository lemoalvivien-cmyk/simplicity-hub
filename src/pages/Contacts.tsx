import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Search, Plus, Upload, ChevronRight, Phone, Mail,
  User, Clock, CheckCircle2, AlertCircle, Filter
} from "lucide-react";

type ContactStatus = "a_contacter" | "contacte" | "en_discussion" | "converti" | "pas_interesse";
type ContactSource = "import" | "manuel" | "introduction" | "prospection";

interface Contact {
  id: number;
  nom: string;
  prenom: string;
  entreprise: string;
  poste?: string;
  email?: string;
  telephone?: string;
  status: ContactStatus;
  source: ContactSource;
  liste?: string;
  prochaine_action?: string;
  date_ajout: string;
}

const contacts: Contact[] = [
  { id: 1, nom: "Duval", prenom: "Jean-Pierre", entreprise: "Boulangerie Duval", poste: "Gérant", email: "jp.duval@boulangerie.fr", status: "en_discussion", source: "introduction", liste: "Mission Acme SaaS", prochaine_action: "Attendre réponse Acme SaaS", date_ajout: "Aujourd'hui" },
  { id: 2, nom: "Morin", prenom: "Gérard", entreprise: "Morin Industrie", poste: "Directeur financier", email: "g.morin@morin.com", telephone: "06 12 34 56 78", status: "en_discussion", source: "introduction", liste: "Mission FinEdge", prochaine_action: "Suivi FinEdge", date_ajout: "Hier" },
  { id: 3, nom: "Petit", prenom: "Isabelle", entreprise: "Boutique Isabelle", poste: "Gérante", email: "isabelle@boutique.fr", status: "converti", source: "introduction", liste: "Mission Acme SaaS", date_ajout: "Il y a 2 jours" },
  { id: 4, nom: "Martin", prenom: "Sophie", entreprise: "RH Conseil", poste: "Responsable RH", email: "s.martin@rhconseil.fr", status: "a_contacter", source: "import", liste: "Prospects RH", prochaine_action: "Premier contact à faire", date_ajout: "Il y a 3 jours" },
  { id: 5, nom: "Leblanc", prenom: "Antoine", entreprise: "Tech Solutions", poste: "CEO", email: "a.leblanc@techsolutions.fr", telephone: "06 98 76 54 32", status: "contacte", source: "prospection", liste: "Campagne Octobre", prochaine_action: "Relancer dans 5 jours", date_ajout: "Il y a 4 jours" },
  { id: 6, nom: "Fontaine", prenom: "Marie", entreprise: "Cabinet MF", poste: "Directrice", email: "m.fontaine@cabinet.fr", status: "pas_interesse", source: "import", liste: "Prospects RH", date_ajout: "Il y a 1 semaine" },
];

const statusConfig: Record<ContactStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  a_contacter: { label: "À contacter", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <User size={11} /> },
  contacte: { label: "Contacté", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <Clock size={11} /> },
  en_discussion: { label: "En discussion", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)", icon: <Clock size={11} /> },
  converti: { label: "Converti ✓", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={11} /> },
  pas_interesse: { label: "Pas intéressé", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <AlertCircle size={11} /> },
};

const sourceConfig: Record<ContactSource, { label: string; color: string }> = {
  import: { label: "Import", color: "hsl(var(--muted-foreground))" },
  manuel: { label: "Ajouté manuellement", color: "hsl(var(--muted-foreground))" },
  introduction: { label: "Introduction", color: "hsl(var(--primary))" },
  prospection: { label: "Prospection", color: "hsl(38 80% 30%)" },
};

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "tous">("tous");

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.entreprise.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "tous" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const aContacter = contacts.filter((c) => c.status === "a_contacter").length;

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              Mes contacts
            </h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length} personne{contacts.length > 1 ? "s" : ""} dans votre base.
              {aContacter > 0 && (
                <span style={{ color: "hsl(var(--primary))" }} className="font-medium ml-1">
                  {aContacter} à contacter.
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to="/contacts/import"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Upload size={14} /> Importer
            </Link>
            <button className="btn-cta text-sm py-2.5 px-4">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "À contacter", value: contacts.filter((c) => c.status === "a_contacter").length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            { label: "En discussion", value: contacts.filter((c) => c.status === "en_discussion").length, color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
            { label: "Convertis", value: contacts.filter((c) => c.status === "converti").length, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
            { label: "Total", value: contacts.length, color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Recherche + filtre */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un nom, une entreprise, un email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContactStatus | "tous")}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            >
              <option value="tous">Tous</option>
              <option value="a_contacter">À contacter</option>
              <option value="contacte">Contactés</option>
              <option value="en_discussion">En discussion</option>
              <option value="converti">Convertis</option>
              <option value="pas_interesse">Pas intéressés</option>
            </select>
            <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <User size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucun contact trouvé</p>
            <p className="text-sm text-muted-foreground mb-4">
              Importez un fichier ou ajoutez un contact manuellement.
            </p>
            <Link to="/contacts/import" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Upload size={14} /> Importer des contacts
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const cfg = statusConfig[c.status];
              const src = sourceConfig[c.source];
              return (
                <Link
                  key={c.id}
                  to={`/contacts/${c.id}`}
                  className="card-surface p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                  >
                    {c.prenom.charAt(0)}{c.nom.charAt(0)}
                  </div>

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {c.prenom} {c.nom}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.entreprise}
                      {c.poste && ` · ${c.poste}`}
                    </p>
                    {c.prochaine_action && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--primary))" }}>
                        → {c.prochaine_action}
                      </p>
                    )}
                  </div>

                  {/* Source + contact */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-medium" style={{ color: src.color }}>
                      {src.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {c.email && <Mail size={12} className="text-muted-foreground" />}
                      {c.telephone && <Phone size={12} className="text-muted-foreground" />}
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile : bouton importer */}
        <div className="mt-6 sm:hidden">
          <Link to="/contacts/import" className="btn-primary w-full py-3 justify-center">
            <Upload size={14} /> Importer des contacts
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
