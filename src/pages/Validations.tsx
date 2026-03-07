import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Eye,
  ChevronRight, Shield, MessageSquare, Zap, Send,
  TrendingUp, Info, Filter, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
type ValidationStatus = "en_attente" | "validee" | "refusee";
type ValidationRisque = "faible" | "moyen" | "eleve";
type ValidationType = "message" | "campagne" | "action" | "introduction" | "gain" | "blocage";

interface Validation {
  id: string;
  agent: string;
  type: ValidationType;
  action: string;
  description: string;
  consequence_valide: string;
  consequence_refuse: string;
  risque: ValidationRisque;
  depuis: string;
  statut: ValidationStatus;
  details?: string[];
}

// ── Données mock ─────────────────────────────────────────────────────────────
const ALL_VALIDATIONS: Validation[] = [
  {
    id: "v1",
    agent: "Agent Message",
    type: "message",
    action: "Envoi de 23 messages LinkedIn",
    description: "Votre agent a préparé une séquence de 23 messages personnalisés pour votre campagne SaaS B2B. Chaque message est adapté au profil du destinataire.",
    consequence_valide: "Les 23 messages seront envoyés sur LinkedIn, 3 par jour pendant 8 jours.",
    consequence_refuse: "La campagne LinkedIn sera suspendue. Votre agent attendra vos instructions.",
    risque: "moyen",
    depuis: "il y a 2h",
    statut: "en_attente",
    details: [
      "23 contacts ciblés · Secteur Finance · Île-de-France",
      "Ton : professionnel, direct",
      "Limite : 3 envois/jour (règle de sécurité)",
      "Canal : LinkedIn uniquement",
    ],
  },
  {
    id: "v2",
    agent: "Agent Exécution",
    type: "campagne",
    action: "Lancement d'une campagne email",
    description: "Une campagne ciblant 47 contacts dans le secteur Finance est prête à être lancée. L'agent Stratège a validé la liste et les messages ont été préparés par l'agent Message.",
    consequence_valide: "La campagne email démarrera aujourd'hui. Premiers envois dans 1h.",
    consequence_refuse: "La campagne reste en brouillon. Vous pourrez la relancer à tout moment.",
    risque: "moyen",
    depuis: "il y a 45min",
    statut: "en_attente",
    details: [
      "47 contacts dans la liste 'Finance Paris'",
      "3 emails planifiés sur 2 semaines",
      "Objet : 'Une question rapide sur votre équipe commerciale'",
      "Taux d'envoi : 10/jour maximum",
    ],
  },
  {
    id: "v3",
    agent: "Agent Contrôle",
    type: "blocage",
    action: "Campagne email suspendue automatiquement",
    description: "L'agent Contrôle a suspendu la campagne email 'Relance Octobre' car le taux de rebond a dépassé le seuil autorisé (8% vs 5% max).",
    consequence_valide: "La campagne reprend avec les paramètres actuels. Risque de blacklistage.",
    consequence_refuse: "La campagne reste suspendue. Recommandé : nettoyer la liste d'abord.",
    risque: "eleve",
    depuis: "il y a 3h",
    statut: "en_attente",
    details: [
      "Taux de rebond : 8.2% (seuil : 5%)",
      "12 emails déjà envoyés sur 47 prévus",
      "Recommandation : nettoyer la liste avant de reprendre",
      "Règle de sécurité : 'S'arrêter si taux d'échec > 5%'",
    ],
  },
  {
    id: "v4",
    agent: "Agent Sourcing",
    type: "introduction",
    action: "Introduction proposée : Marie D. → Cabinet Dumas & Associés",
    description: "Votre agent Sourcing a identifié une opportunité d'introduction. Marie D. cherche un partenaire expert-comptable pour une PME de 45 salariés.",
    consequence_valide: "L'introduction sera préparée et envoyée avec votre accord final.",
    consequence_refuse: "L'opportunité sera archivée. Votre agent cherchera d'autres pistes.",
    risque: "faible",
    depuis: "hier à 16h",
    statut: "en_attente",
    details: [
      "Contact : Marie D., DRH · PME 45 salariés",
      "Besoin : Cabinet comptable pour externalisation paie",
      "Pertinence estimée : 87%",
      "Mission correspondante : 'Cabinet comptable · Paris'",
    ],
  },
  {
    id: "v5",
    agent: "Agent Qualification",
    type: "action",
    action: "Réponse classée 'Opportunité chaude' : Antoine P.",
    description: "Antoine P. a répondu à votre message LinkedIn et a exprimé un intérêt fort. Votre agent Qualification propose de le faire passer en 'Rendez-vous à planifier'.",
    consequence_valide: "Antoine P. sera classé en opportunité chaude. JARVIS vous rappellera de le recontacter.",
    consequence_refuse: "La qualification reste en attente. Vous pouvez la faire manuellement plus tard.",
    risque: "faible",
    depuis: "il y a 1h",
    statut: "en_attente",
    details: [
      "Antoine P., CEO · Startup 12 salariés",
      "Réponse : 'Effectivement, on cherche quelque chose comme ça'",
      "Source : Campagne LinkedIn 'SaaS Île-de-France'",
      "Prochaine action suggérée : appel découverte",
    ],
  },
  {
    id: "v6",
    agent: "Agent Exécution",
    type: "gain",
    action: "Gain confirmé : introduction SaaS B2B transformée",
    description: "L'introduction envoyée il y a 3 semaines à Nexus Solutions vient de se transformer en contrat signé. Votre gain estimé est de 500€.",
    consequence_valide: "Le gain sera enregistré et apparaîtra dans votre tableau de suivi.",
    consequence_refuse: "Le gain ne sera pas comptabilisé.",
    risque: "faible",
    depuis: "aujourd'hui à 09h",
    statut: "en_attente",
    details: [
      "Entreprise : Nexus Solutions",
      "Montant estimé : 500€",
      "Mission liée : 'Partenariat SaaS · Lyon'",
      "Introduction envoyée le : 14 février 2026",
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function RisqueBadge({ risque }: { risque: ValidationRisque }) {
  const map = {
    faible: { label: "Faible risque", color: "hsl(142 50% 28%)", bg: "hsl(142 50% 35% / 0.1)" },
    moyen: { label: "Risque modéré", color: "hsl(24 80% 36%)", bg: "hsl(24 100% 45% / 0.1)" },
    eleve: { label: "Risque élevé", color: "hsl(0 60% 32%)", bg: "hsl(0 60% 40% / 0.1)" },
  };
  const r = map[risque];
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

function TypeIcon({ type }: { type: ValidationType }) {
  const map: Record<ValidationType, { icon: React.ElementType; color: string; bg: string }> = {
    message: { icon: MessageSquare, color: "hsl(24 100% 45%)", bg: "hsl(24 100% 45% / 0.1)" },
    campagne: { icon: Zap, color: "hsl(218 72% 30%)", bg: "hsl(218 72% 30% / 0.1)" },
    action: { icon: CheckCircle2, color: "hsl(142 50% 35%)", bg: "hsl(142 50% 35% / 0.1)" },
    introduction: { icon: Send, color: "hsl(250 60% 40%)", bg: "hsl(250 60% 40% / 0.1)" },
    gain: { icon: TrendingUp, color: "hsl(142 50% 28%)", bg: "hsl(142 50% 35% / 0.1)" },
    blocage: { icon: Shield, color: "hsl(0 60% 40%)", bg: "hsl(0 60% 40% / 0.1)" },
  };
  const { icon: Icon, color, bg } = map[type];
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
      <Icon size={16} style={{ color }} />
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Validations() {
  const [validations, setValidations] = useState<Validation[]>(ALL_VALIDATIONS);
  const [filtre, setFiltre] = useState<"toutes" | "en_attente" | "validees" | "refusees">("en_attente");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleValider = (id: string) => {
    setValidations((prev) => prev.map((v) => v.id === id ? { ...v, statut: "validee" as ValidationStatus } : v));
  };

  const handleRefuser = (id: string) => {
    setValidations((prev) => prev.map((v) => v.id === id ? { ...v, statut: "refusee" as ValidationStatus } : v));
  };

  const filtrees = validations.filter((v) => {
    if (filtre === "toutes") return true;
    if (filtre === "en_attente") return v.statut === "en_attente";
    if (filtre === "validees") return v.statut === "validee";
    if (filtre === "refusees") return v.statut === "refusee";
    return true;
  });

  const enAttente = validations.filter((v) => v.statut === "en_attente").length;

  return (
    <UserLayout jarvisContext="agents">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: enAttente > 0 ? "hsl(24 100% 45% / 0.12)" : "hsl(var(--secondary))" }}
          >
            <AlertTriangle size={18} style={{ color: enAttente > 0 ? "hsl(24 100% 45%)" : "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
              Boîte de validation
            </h1>
            <p className="text-sm text-muted-foreground">
              {enAttente > 0
                ? `${enAttente} action${enAttente > 1 ? "s" : ""} attend${enAttente > 1 ? "ent" : ""} votre décision.`
                : "Tout est à jour. Vos agents peuvent continuer."}
            </p>
          </div>
        </div>

        {/* ── Explication ─────────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: "hsl(var(--muted))" }}>
          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos agents ne peuvent pas agir seuls sur les points importants.
            Chaque validation ici correspond à une action que votre équipe d'agents a préparée et attend votre accord.
            <strong className="text-foreground"> Vous gardez toujours la main.</strong>
          </p>
        </div>

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "en_attente" as const, label: `En attente (${enAttente})` },
            { id: "validees" as const, label: "Validées" },
            { id: "refusees" as const, label: "Refusées" },
            { id: "toutes" as const, label: "Toutes" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0"
              style={{
                background: filtre === f.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: filtre === f.id ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Liste des validations ────────────────────────────────────────── */}
        {filtrees.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">Rien ici pour l'instant</p>
            <p className="text-sm text-muted-foreground">
              {filtre === "en_attente"
                ? "Vos agents n'ont rien à vous soumettre pour le moment."
                : "Aucune validation dans cette catégorie."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrees.map((v) => {
              const isExpanded = expandedId === v.id;
              const isTraitee = v.statut !== "en_attente";

              return (
                <div
                  key={v.id}
                  className="card-surface rounded-xl border overflow-hidden transition-all"
                  style={{
                    borderColor:
                      v.statut === "validee"
                        ? "hsl(142 50% 35% / 0.2)"
                        : v.statut === "refusee"
                        ? "hsl(var(--border))"
                        : v.risque === "eleve"
                        ? "hsl(0 60% 40% / 0.2)"
                        : v.risque === "moyen"
                        ? "hsl(24 100% 45% / 0.2)"
                        : "hsl(var(--border))",
                    opacity: isTraitee ? 0.75 : 1,
                  }}
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <TypeIcon type={v.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm leading-snug">{v.action}</p>
                          {v.statut === "validee" && (
                            <span className="flex items-center gap-1 text-xs font-semibold shrink-0"
                              style={{ color: "hsl(142 50% 28%)" }}>
                              <CheckCircle2 size={12} /> Validée
                            </span>
                          )}
                          {v.statut === "refusee" && (
                            <span className="flex items-center gap-1 text-xs font-semibold shrink-0"
                              style={{ color: "hsl(var(--muted-foreground))" }}>
                              <XCircle size={12} /> Refusée
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Par {v.agent} · {v.depuis}</span>
                          <RisqueBadge risque={v.risque} />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  </div>

                  {/* Conséquences */}
                  {!isTraitee && (
                    <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl" style={{ background: "hsl(142 50% 35% / 0.06)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "hsl(142 50% 28%)" }}>Si vous validez</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{v.consequence_valide}</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                        <p className="text-xs font-semibold mb-1 text-muted-foreground">Si vous refusez</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{v.consequence_refuse}</p>
                      </div>
                    </div>
                  )}

                  {/* Détails expandable */}
                  {v.details && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="w-full px-4 py-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye size={12} /> Voir les détails
                      </span>
                      <ChevronRight size={12} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                  )}

                  {isExpanded && v.details && (
                    <div className="px-4 pb-4 pt-3 border-t border-border space-y-1.5">
                      {v.details.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                          <span className="text-muted-foreground">{d}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {!isTraitee && (
                    <div className="px-4 py-3 border-t border-border flex gap-2">
                      <button
                        onClick={() => handleValider(v.id)}
                        className="btn-cta flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> Valider
                      </button>
                      <button
                        onClick={() => handleRefuser(v.id)}
                        className="flex-1 py-2.5 text-sm rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors font-semibold"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── JARVIS note ──────────────────────────────────────────────────── */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">JARVIS vous conseille</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Commencez par les validations à risque élevé. Vos agents sont bloqués tant que vous n'avez pas décidé.
          </p>
          <Link
            to="/agents"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Voir la console agents <ChevronRight size={11} />
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
