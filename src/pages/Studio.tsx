import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Layers, Play, Database, MessageSquare, Shield, Radio,
  ArrowRight, Sparkles, Target, ChevronRight, Zap, CheckCircle2
} from "lucide-react";

const modules = [
  {
    icon: Play,
    title: "Créer une campagne",
    desc: "Préparez une campagne de prospection en quelques étapes simples.",
    cta: "Préparer une campagne",
    to: "/campagnes/nouvelle",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    badge: "Essentiel",
  },
  {
    icon: Database,
    title: "Sources & contacts",
    desc: "Importez ou connectez vos contacts. Voyez d'où vient chaque personne.",
    cta: "Gérer mes sources",
    to: "/sources",
    color: "hsl(220 80% 45%)",
    bg: "hsl(220 80% 95%)",
    badge: null,
  },
  {
    icon: MessageSquare,
    title: "Mes messages",
    desc: "Préparez vos messages de prospection, relances et introductions à l'avance.",
    cta: "Voir mes modèles",
    to: "/messages",
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    badge: null,
  },
  {
    icon: Radio,
    title: "Canaux de contact",
    desc: "Choisissez comment contacter vos prospects : email, téléphone, introduction…",
    cta: "Voir les canaux",
    to: "/canaux",
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    badge: null,
  },
  {
    icon: Shield,
    title: "Règles & sécurités",
    desc: "Définissez quand valider, quand s'arrêter, quand demander confirmation.",
    cta: "Définir mes règles",
    to: "/regles",
    color: "hsl(280 60% 45%)",
    bg: "hsl(280 60% 95%)",
    badge: "Recommandé",
  },
  {
    icon: Target,
    title: "Mes opportunités",
    desc: "Suivez les opportunités créées par vos campagnes, introductions et missions.",
    cta: "Voir les opportunités",
    to: "/opportunites",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    badge: null,
  },
];

const etapesLancement = [
  { num: "1", label: "Importez ou préparez vos contacts", done: true },
  { num: "2", label: "Créez une liste de personnes à contacter", done: true },
  { num: "3", label: "Préparez vos messages", done: false },
  { num: "4", label: "Créez votre campagne", done: false },
  { num: "5", label: "Vérifiez et lancez", done: false },
];

export default function Studio() {
  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
                Studio de prospection
              </h1>
              <p className="text-xs text-muted-foreground">
                Préparez, configurez et lancez votre machine commerciale.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            C'est ici que vous construisez votre stratégie de prospection.
            Préparez vos contacts, vos messages et vos campagnes avant de lancer.
          </p>
        </div>

        {/* Progression vers le premier lancement */}
        <div className="card-surface p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
            <p className="font-semibold text-foreground text-sm">Votre parcours de démarrage</p>
          </div>
          <div className="space-y-2.5">
            {etapesLancement.map((e) => (
              <div key={e.num} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={
                    e.done
                      ? { background: "hsl(var(--success))", color: "white" }
                      : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {e.done ? <CheckCircle2 size={13} /> : e.num}
                </div>
                <span
                  className="text-sm"
                  style={{ color: e.done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}
                >
                  {e.label}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/campagnes/nouvelle"
            className="mt-4 w-full btn-cta text-sm py-2.5 flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Créer ma première campagne
          </Link>
        </div>

        {/* Modules */}
        <h2 className="font-display font-bold text-foreground text-base mb-3">
          Tous les outils disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {modules.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="card-surface p-4 hover:shadow-md transition-shadow block group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: m.bg }}
                >
                  <m.icon size={16} style={{ color: m.color }} />
                </div>
                {m.badge && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: m.bg, color: m.color }}
                  >
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{m.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.desc}</p>
              <div
                className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all"
                style={{ color: m.color }}
              >
                {m.cta} <ChevronRight size={13} />
              </div>
            </Link>
          ))}
        </div>

        {/* Aide JARVIS */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
            <p className="font-semibold text-foreground text-sm">
              Pas sûr par où commencer ?
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            JARVIS peut vous guider pas à pas selon votre situation et votre objectif.
          </p>
          <div className="space-y-2">
            {[
              "Aide-moi à préparer ma première campagne",
              "Quel canal choisir pour ma prospection ?",
              "Comment organiser mes contacts ?",
            ].map((q) => (
              <button
                key={q}
                className="w-full text-left text-xs font-medium px-3 py-2.5 rounded-lg bg-card hover:bg-muted transition-colors flex items-center justify-between gap-2"
              >
                <span>{q}</span>
                <ArrowRight size={12} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
