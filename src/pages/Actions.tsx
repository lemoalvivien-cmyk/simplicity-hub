import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Phone, Mail, ChevronRight, Send, CheckCircle2,
  Clock, AlertCircle, Zap, PhoneCall, PhoneMissed,
  PhoneOff, RefreshCw, Filter
} from "lucide-react";

/* ─── TYPES ────────────────────────────────────────────────── */
type ActionType = "appeler" | "envoyer" | "relancer" | "valider" | "verifier";
type PhoneStatus = "a_appeler" | "appele" | "a_rappeler" | "sans_reponse" | "qualifie";
type ActionSection = "urgent" | "aujourd_hui" | "cette_semaine" | "terminee";
type SourceType = "introduction" | "prospection" | "campagne" | "mission" | "import";

interface Action {
  id: number;
  type: ActionType;
  contact: string;
  entreprise: string;
  description: string;
  lien: string;
  lienLabel: string;
  section: ActionSection;
  source: SourceType;
  canal?: "email" | "telephone" | "autre";
  phoneStatus?: PhoneStatus;
  telephone?: string;
}

/* ─── DONNÉES MOCK ─────────────────────────────────────────── */
const actionsData: Action[] = [
  {
    id: 1, type: "valider", contact: "Jean-Pierre Duval", entreprise: "Boulangerie Duval",
    description: "Une introduction reçue attend votre validation. Validez ou refusez ce contact en 1 clic.",
    lien: "/entreprise/introductions", lienLabel: "Voir l'introduction",
    section: "urgent", source: "introduction", canal: "autre",
  },
  {
    id: 2, type: "relancer", contact: "Antoine Leblanc", entreprise: "Tech Solutions",
    description: "Antoine a ouvert votre email mais n'a pas répondu. C'est le bon moment pour relancer.",
    lien: "/contacts/5", lienLabel: "Voir le contact",
    section: "urgent", source: "campagne", canal: "email",
  },
  {
    id: 3, type: "appeler", contact: "Malik Diouf", entreprise: "Diouf Transport",
    description: "Ce contact a été importé depuis un fichier. Il attend votre premier appel.",
    lien: "/contacts/4", lienLabel: "Voir le contact",
    section: "aujourd_hui", source: "import", canal: "telephone",
    phoneStatus: "a_appeler", telephone: "+33 6 12 34 56 78",
  },
  {
    id: 4, type: "envoyer", contact: "Sophie Martin", entreprise: "RH Conseil",
    description: "Sophie attend votre premier message depuis son import. Prenez contact dès aujourd'hui.",
    lien: "/contacts/4", lienLabel: "Voir le contact",
    section: "aujourd_hui", source: "prospection", canal: "email",
  },
  {
    id: 5, type: "appeler", contact: "Éric Fontaine", entreprise: "Fontaine Immobilier",
    description: "Éric n'a pas décroché lors du premier appel. Essayez à nouveau cette semaine.",
    lien: "/contacts/6", lienLabel: "Voir le contact",
    section: "cette_semaine", source: "import", canal: "telephone",
    phoneStatus: "sans_reponse", telephone: "+33 6 98 76 54 32",
  },
  {
    id: 6, type: "verifier", contact: "Clara Petit", entreprise: "Petit & Associés",
    description: "Ce contact n'a pas d'email renseigné. Vérifiez ses coordonnées avant de le contacter.",
    lien: "/contacts/7", lienLabel: "Compléter le contact",
    section: "cette_semaine", source: "prospection", canal: "autre",
  },
];

/* ─── CONFIGS ──────────────────────────────────────────────── */
const typeConfig: Record<ActionType, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  appeler: { label: "Appeler", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <Phone size={13} /> },
  envoyer: { label: "Contacter", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)", icon: <Mail size={13} /> },
  relancer: { label: "Relancer", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <Send size={13} /> },
  valider: { label: "Valider", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={13} /> },
  verifier: { label: "Vérifier", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <AlertCircle size={13} /> },
};

const phoneStatusConfig: Record<PhoneStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  a_appeler: { label: "À appeler", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <PhoneCall size={12} /> },
  appele: { label: "Appelé", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={12} /> },
  a_rappeler: { label: "À rappeler", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <RefreshCw size={12} /> },
  sans_reponse: { label: "Sans réponse", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <PhoneMissed size={12} /> },
  qualifie: { label: "Qualifié", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={12} /> },
};

const sourceConfig: Record<SourceType, { label: string; color: string; bg: string }> = {
  introduction: { label: "Introduction", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
  prospection: { label: "Prospection", color: "hsl(220 80% 45%)", bg: "hsl(220 80% 95%)" },
  campagne: { label: "Campagne", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
  mission: { label: "Mission", color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  import: { label: "Import", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

const canalIcon: Record<string, JSX.Element> = {
  email: <Mail size={11} />,
  telephone: <Phone size={11} />,
  autre: <Send size={11} />,
};

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────── */
export default function Actions() {
  const [done, setDone] = useState<number[]>([]);
  const [filtreCanal, setFiltreCanal] = useState<"tous" | "email" | "telephone">("tous");

  const restantes = actionsData.filter((a) => !done.includes(a.id));
  const filtrees = filtreCanal === "tous" ? restantes : restantes.filter((a) => a.canal === filtreCanal);

  const urgentes = filtrees.filter((a) => a.section === "urgent");
  const aujourd_hui = filtrees.filter((a) => a.section === "aujourd_hui");
  const cette_semaine = filtrees.filter((a) => a.section === "cette_semaine");
  const terminees = done.length;

  const totalRestantes = filtrees.length;

  return (
    <UserLayout jarvisContext="contact">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            À faire
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalRestantes === 0
              ? "Tout est traité. Bravo !"
              : `${totalRestantes} action${totalRestantes > 1 ? "s" : ""} vous attend${totalRestantes > 1 ? "ent" : ""}${urgentes.length > 0 ? `, dont ${urgentes.length} urgente${urgentes.length > 1 ? "s" : ""}` : ""}.`
            }
          </p>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Urgent", value: actionsData.filter((a) => !done.includes(a.id) && a.section === "urgent").length, color: "hsl(var(--accent))", bg: "hsl(var(--accent-light))" },
            { label: "Aujourd'hui", value: actionsData.filter((a) => !done.includes(a.id) && a.section === "aujourd_hui").length, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
            { label: "Cette sem.", value: actionsData.filter((a) => !done.includes(a.id) && a.section === "cette_semaine").length, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
            { label: "Faites", value: terminees, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: bg }}>
              <p className="font-display text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtres canal */}
        <div className="flex items-center gap-2 mb-5">
          <Filter size={13} className="text-muted-foreground shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {(["tous", "email", "telephone"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFiltreCanal(c)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: filtreCanal === c ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: filtreCanal === c ? "hsl(var(--primary))" : "transparent",
                  color: filtreCanal === c ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {c === "tous" ? "Tous" : c === "email" ? <><Mail size={11} /> Email</> : <><Phone size={11} /> Téléphone</>}
              </button>
            ))}
          </div>
        </div>

        {/* Tout fait */}
        {totalRestantes === 0 && (
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
              Toutes vos actions sont à jour. Profitez-en pour explorer de nouvelles missions ou lancer une campagne.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">Voir les missions</Link>
              <Link to="/campagnes" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Mes campagnes
              </Link>
            </div>
          </div>
        )}

        {/* Section Urgentes */}
        {urgentes.length > 0 && (
          <Section
            icon={<Zap size={15} style={{ color: "hsl(var(--accent))" }} />}
            titre={`${urgentes.length} action${urgentes.length > 1 ? "s" : ""} urgente${urgentes.length > 1 ? "s" : ""} maintenant`}
            actions={urgentes}
            onDone={(id) => setDone((p) => [...p, id])}
          />
        )}

        {/* Section Aujourd'hui */}
        {aujourd_hui.length > 0 && (
          <Section
            icon={<Zap size={15} className="text-primary" />}
            titre="Aujourd'hui"
            actions={aujourd_hui}
            onDone={(id) => setDone((p) => [...p, id])}
          />
        )}

        {/* Section Cette semaine */}
        {cette_semaine.length > 0 && (
          <Section
            icon={<Clock size={15} className="text-muted-foreground" />}
            titre="Cette semaine"
            actions={cette_semaine}
            onDone={(id) => setDone((p) => [...p, id])}
          />
        )}
      </div>
    </UserLayout>
  );
}

/* ─── SECTION ──────────────────────────────────────────────── */
function Section({ icon, titre, actions, onDone }: {
  icon: JSX.Element;
  titre: string;
  actions: Action[];
  onDone: (id: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm font-semibold text-foreground">{titre}</p>
      </div>
      <div className="space-y-3">
        {actions.map((a) => <ActionCard key={a.id} action={a} onDone={() => onDone(a.id)} />)}
      </div>
    </div>
  );
}

/* ─── CARTE ACTION ─────────────────────────────────────────── */
function ActionCard({ action, onDone }: { action: Action; onDone: () => void }) {
  const cfg = typeConfig[action.type];
  const src = sourceConfig[action.source];

  return (
    <div
      className="card-surface p-5"
      style={action.section === "urgent" ? { borderLeft: "3px solid hsl(var(--accent))" } : undefined}
    >
      {/* Ligne du haut */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.icon} {cfg.label}
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: src.color, background: src.bg }}
        >
          {src.label}
        </span>
        {action.canal && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {canalIcon[action.canal]}
            <span className="capitalize">{action.canal === "telephone" ? "Téléphone" : action.canal === "email" ? "Email" : "Autre"}</span>
          </span>
        )}
      </div>

      {/* Contact */}
      <p className="text-sm font-semibold text-foreground mb-0.5">
        {action.contact}
        <span className="font-normal text-muted-foreground ml-1.5">· {action.entreprise}</span>
      </p>

      {/* Téléphone si dispo */}
      {action.telephone && (
        <div className="flex items-center gap-2 mb-1">
          <Phone size={11} className="text-muted-foreground" />
          <span className="text-xs text-foreground font-medium">{action.telephone}</span>
          {action.phoneStatus && (() => {
            const ps = phoneStatusConfig[action.phoneStatus];
            return (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: ps.color, background: ps.bg }}
              >
                {ps.icon} {ps.label}
              </span>
            );
          })()}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{action.description}</p>

      {/* CTAs */}
      <div className="flex gap-2.5">
        <Link
          to={action.lien}
          className="btn-cta text-sm py-2 px-4 flex-1 justify-center"
        >
          {action.lienLabel} <ChevronRight size={12} />
        </Link>
        <button
          onClick={onDone}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <CheckCircle2 size={12} /> Fait
        </button>
        {action.canal === "telephone" && (
          <a
            href={`tel:${action.telephone}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
            style={{ borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))" }}
          >
            <Phone size={12} /> Appeler
          </a>
        )}
      </div>
    </div>
  );
}
