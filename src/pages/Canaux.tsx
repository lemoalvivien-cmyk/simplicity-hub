import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Mail, Phone, Send, Upload, Play, MoreHorizontal,
  CheckCircle2, Clock, ArrowRight, Zap, ChevronRight
} from "lucide-react";

type CanalStatus = "actif" | "bientot" | "configure";

interface Canal {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  status: CanalStatus;
  color: string;
  bg: string;
  usages: string[];
  action?: string;
  actionTo?: string;
}

const canaux: Canal[] = [
  {
    id: "email",
    icon: Mail,
    label: "Email",
    desc: "Premier message, relance, suivi — le canal principal pour la plupart des prospections.",
    status: "actif",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    usages: ["Premier contact", "Relance", "Suivi"],
    action: "Voir mes messages email",
    actionTo: "/messages",
  },
  {
    id: "telephone",
    icon: Phone,
    label: "Téléphone",
    desc: "Appels de prospection, rappels, suivi vocal. Idéal pour les contacts importants.",
    status: "actif",
    color: "hsl(280 60% 45%)",
    bg: "hsl(280 60% 95%)",
    usages: ["Appel de prospection", "Rappel", "Qualification"],
    action: "Voir les actions téléphone",
    actionTo: "/actions",
  },
  {
    id: "introduction",
    icon: Send,
    label: "Introduction",
    desc: "Mise en relation via un apporteur d'affaires. Canal le plus qualitatif.",
    status: "actif",
    color: "hsl(220 80% 45%)",
    bg: "hsl(220 80% 95%)",
    usages: ["Mise en relation", "Présentation", "Recommandation"],
    action: "Voir mes introductions",
    actionTo: "/introductions",
  },
  {
    id: "import",
    icon: Upload,
    label: "Import",
    desc: "Contacts importés depuis un fichier Excel ou CSV. Pour enrichir rapidement votre base.",
    status: "actif",
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    usages: ["Importer des listes", "Enrichir la base", "Segmenter"],
    action: "Importer des contacts",
    actionTo: "/contacts/import",
  },
  {
    id: "campagne",
    icon: Play,
    label: "Campagne",
    desc: "Séquence de prospection automatisée sur plusieurs étapes et canaux.",
    status: "actif",
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    usages: ["Séquence d'emails", "Relances programmées", "Suivi automatique"],
    action: "Voir mes campagnes",
    actionTo: "/campagnes",
  },
  {
    id: "linkedin",
    icon: Zap,
    label: "LinkedIn",
    desc: "Prospection directe sur LinkedIn. Connexion, message, suivi.",
    status: "bientot",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    usages: ["Demande de connexion", "Message direct", "Suivi"],
  },
  {
    id: "autre",
    icon: MoreHorizontal,
    label: "Autre canal",
    desc: "Salon, événement, recommandation directe, réseau personnel.",
    status: "actif",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    usages: ["Salon / événement", "Recommandation", "Réseau personnel"],
  },
];

const statusConfig: Record<CanalStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  actif: { label: "Disponible", icon: CheckCircle2, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  bientot: { label: "Bientôt", icon: Clock, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  configure: { label: "À configurer", icon: ArrowRight, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
};

export default function Canaux() {
  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Canaux de contact
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Voici tous les moyens disponibles pour contacter vos prospects.
            Chaque canal se relie automatiquement à vos campagnes et vos actions.
          </p>
        </div>

        {/* Canaux disponibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {canaux.map((c) => {
            const sc = statusConfig[c.status];
            return (
              <div
                key={c.id}
                className="card-surface p-4"
                style={{ opacity: c.status === "bientot" ? 0.7 : 1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: c.bg }}
                  >
                    <c.icon size={16} style={{ color: c.color }} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ color: sc.color, background: sc.bg }}
                  >
                    <sc.icon size={10} /> {sc.label}
                  </span>
                </div>

                <p className="font-semibold text-foreground text-sm mb-1">{c.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.desc}</p>

                {/* Usages */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.usages.map((u) => (
                    <span
                      key={u}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                    >
                      {u}
                    </span>
                  ))}
                </div>

                {c.action && c.actionTo && c.status !== "bientot" ? (
                  <Link
                    to={c.actionTo}
                    className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
                    style={{ color: c.color }}
                  >
                    {c.action} <ChevronRight size={11} />
                  </Link>
                ) : c.status === "bientot" ? (
                  <p className="text-xs text-muted-foreground italic">
                    Disponible prochainement
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Logique d'utilisation */}
        <div className="card-surface p-5">
          <p className="font-semibold text-foreground text-sm mb-3">
            Comment utiliser les canaux ensemble ?
          </p>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "Importez vos contacts (Import ou ajout manuel)" },
              { step: "2", text: "Créez une liste ciblée (Listes)" },
              { step: "3", text: "Préparez votre message (Mes messages)" },
              { step: "4", text: "Lancez une campagne email ou téléphone (Campagnes)" },
              { step: "5", text: "Suivez et traitez les réponses (Actions / Pilotage)" },
            ].map((e) => (
              <div key={e.step} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary))", color: "white" }}
                >
                  {e.step}
                </div>
                <span className="text-sm text-foreground">{e.text}</span>
              </div>
            ))}
          </div>
          <Link
            to="/studio"
            className="mt-4 btn-cta text-sm py-2.5 flex items-center justify-center gap-2 w-full"
          >
            <ArrowRight size={14} /> Aller dans le Studio
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
