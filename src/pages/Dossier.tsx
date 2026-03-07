import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Building2, Target, MapPin, Zap, BarChart3, MessageSquare,
  Shield, ChevronRight, ChevronLeft, CheckCircle2, Save,
  Brain, Sparkles, AlertCircle
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ModeProspection = "manuel" | "assiste" | "semi-auto" | "agent";
type TonMessage = "professionnel" | "chaleureux" | "direct" | "premium";

interface DossierState {
  // 1. Activité
  activite: string;
  offre: string;
  valeur: string;
  // 2. Cible
  typeCible: string;
  tailleEntreprise: string;
  typeDecideur: string;
  // 3. Zone
  zone: string;
  secteursPrioritaires: string[];
  exclusions: string;
  // 4. Mode prospection
  mode: ModeProspection;
  canauxActives: string[];
  canauxExclus: string[];
  // 5. Objectifs
  nbOpportunites: string;
  nbRDV: string;
  prioriteActuelle: string;
  // 6. Ton
  ton: TonMessage;
  positionnnement: string;
  // 7. Contraintes
  contraintes: string;
  clientsInterdits: string;
  validationHumaine: boolean;
}

// ── Config des étapes ──────────────────────────────────────────────────────────
const ETAPES = [
  { id: 1, label: "Votre activité", icon: Building2, description: "Ce que vous proposez et pourquoi c'est utile" },
  { id: 2, label: "Qui vous cherchez", icon: Target, description: "Le profil exact de votre client idéal" },
  { id: 3, label: "Où vous cherchez", icon: MapPin, description: "Zones et secteurs prioritaires" },
  { id: 4, label: "Comment prospecter", icon: Zap, description: "Votre mode d'action et vos canaux" },
  { id: 5, label: "Vos objectifs", icon: BarChart3, description: "Ce que vous voulez atteindre" },
  { id: 6, label: "Votre ton", icon: MessageSquare, description: "Comment vous souhaitez être perçu" },
  { id: 7, label: "Vos limites", icon: Shield, description: "Ce qu'OpenClaw ne doit jamais faire" },
];

const SECTEURS = ["SaaS / Tech", "Finance / Assurance", "Immobilier", "Commerce", "Industrie", "Formation", "Santé", "RH / Recrutement", "Conseil", "Autre"];
const CANAUX = ["Email", "LinkedIn", "Téléphone", "Courrier postal", "SMS", "Introduction directe"];
const TAILLES = ["Indépendant (1 pers.)", "Petite entreprise (2–10)", "PME (10–100)", "ETI (100–1000)", "Grande entreprise (+1000)"];

export default function Dossier() {
  const [etape, setEtape] = useState(1);
  const [saved, setSaved] = useState(false);
  const [dossier, setDossier] = useState<DossierState>({
    activite: "",
    offre: "",
    valeur: "",
    typeCible: "",
    tailleEntreprise: "",
    typeDecideur: "",
    zone: "France entière",
    secteursPrioritaires: [],
    exclusions: "",
    mode: "assiste",
    canauxActives: ["Email", "LinkedIn"],
    canauxExclus: [],
    nbOpportunites: "10",
    nbRDV: "3",
    prioriteActuelle: "",
    ton: "professionnel",
    positionnnement: "",
    contraintes: "",
    clientsInterdits: "",
    validationHumaine: true,
  });

  const set = <K extends keyof DossierState>(key: K, value: DossierState[K]) =>
    setDossier((prev) => ({ ...prev, [key]: value }));

  const toggleArray = (key: "secteursPrioritaires" | "canauxActives" | "canauxExclus", value: string) => {
    setDossier((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const etapeComplete = (e: number) => {
    if (e === 1) return dossier.activite.length > 0 && dossier.offre.length > 0;
    if (e === 2) return dossier.typeCible.length > 0;
    if (e === 3) return dossier.zone.length > 0;
    if (e === 4) return dossier.canauxActives.length > 0;
    if (e === 5) return dossier.nbRDV.length > 0;
    if (e === 6) return true;
    if (e === 7) return true;
    return false;
  };

  const completionCount = ETAPES.filter((e) => etapeComplete(e.id)).length;
  const completionPct = Math.round((completionCount / ETAPES.length) * 100);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const stepIcon = ETAPES[etape - 1].icon;

  return (
    <UserLayout jarvisContext="profil_entreprise">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
            <Brain size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
              Dossier entreprise
            </h1>
            <p className="text-muted-foreground text-sm">
              Ce dossier est la base d'OpenClaw. Plus il est précis, mieux vos agents travaillent.
            </p>
          </div>
        </div>

        {/* ── Barre de progression ────────────────────────────────────────── */}
        <div className="card-surface p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Complétion du dossier</span>
            <span className="text-sm font-bold text-primary">{completionPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%`, background: "var(--gradient-primary)" }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              {completionPct < 50
                ? "OpenClaw a besoin de plus d'informations pour optimiser votre prospection."
                : "Presque prêt. Finalisez les dernières sections pour des résultats maximaux."}
            </p>
          )}
          {completionPct === 100 && (
            <p className="text-xs mt-2" style={{ color: "hsl(142 50% 28%)" }}>
              ✓ Dossier complet. OpenClaw peut travailler à pleine capacité.
            </p>
          )}
        </div>

        {/* ── Navigation étapes ─────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {ETAPES.map((e) => {
            const Icon = e.icon;
            const isActive = etape === e.id;
            const isDone = etapeComplete(e.id) && etape !== e.id;
            return (
              <button
                key={e.id}
                onClick={() => setEtape(e.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isActive ? "shadow-sm" : ""
                }`}
                style={{
                  background: isActive ? "hsl(var(--primary))" : isDone ? "hsl(142 50% 35% / 0.08)" : "hsl(var(--muted))",
                  color: isActive ? "hsl(var(--primary-foreground))" : isDone ? "hsl(142 50% 28%)" : "hsl(var(--muted-foreground))",
                }}
              >
                {isDone ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                <span className="hidden sm:inline">{e.label}</span>
                <span className="sm:hidden">{e.id}</span>
              </button>
            );
          })}
        </div>

        {/* ── Contenu étape ─────────────────────────────────────────────── */}
        <div className="card-surface p-6 mb-6">
          {/* Titre étape */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary))" }}>
              {(() => { const Icon = stepIcon; return <Icon size={16} className="text-primary" />; })()}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{ETAPES[etape - 1].label}</h2>
              <p className="text-xs text-muted-foreground">{ETAPES[etape - 1].description}</p>
            </div>
          </div>

          {/* ─── Étape 1 : Activité ─── */}
          {etape === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">En une phrase, que faites-vous ?</label>
                <p className="text-xs text-muted-foreground mb-2">Décrivez votre activité simplement, comme si vous l'expliquez à un inconnu.</p>
                <input
                  type="text"
                  value={dossier.activite}
                  onChange={(e) => set("activite", e.target.value)}
                  placeholder="ex : On aide les artisans à facturer facilement sans Excel"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Qu'est-ce que vous proposez concrètement ?</label>
                <p className="text-xs text-muted-foreground mb-2">Votre offre, votre service ou votre produit principal.</p>
                <textarea
                  rows={3}
                  value={dossier.offre}
                  onChange={(e) => set("offre", e.target.value)}
                  placeholder="ex : Un logiciel de facturation en ligne à 29€/mois, accessible depuis le téléphone..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Quelle est votre vraie valeur ajoutée ?</label>
                <p className="text-xs text-muted-foreground mb-2">Pourquoi vous plutôt qu'un autre ? Quel problème résolvez-vous vraiment ?</p>
                <textarea
                  rows={2}
                  value={dossier.valeur}
                  onChange={(e) => set("valeur", e.target.value)}
                  placeholder="ex : On fait gagner 2h par semaine et on réduit les erreurs de comptabilité de 80%..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* ─── Étape 2 : Cible ─── */}
          {etape === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Quel type d'entreprise cherchez-vous ?</label>
                <p className="text-xs text-muted-foreground mb-2">Secteur, contexte, situation typique de votre client idéal.</p>
                <textarea
                  rows={3}
                  value={dossier.typeCible}
                  onChange={(e) => set("typeCible", e.target.value)}
                  placeholder="ex : Artisans et commerçants indépendants qui gèrent encore leur facturation sur Excel ou papier..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Quelle taille d'entreprise ?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {TAILLES.map((t) => (
                    <button
                      key={t}
                      onClick={() => set("tailleEntreprise", t)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        dossier.tailleEntreprise === t
                          ? "border-primary bg-primary/5 font-medium text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Qui est le décideur chez eux ?</label>
                <input
                  type="text"
                  value={dossier.typeDecideur}
                  onChange={(e) => set("typeDecideur", e.target.value)}
                  placeholder="ex : Le dirigeant, le DAF, le responsable commercial..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* ─── Étape 3 : Zone ─── */}
          {etape === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Quelle zone géographique ?</label>
                <div className="grid grid-cols-2 gap-2">
                  {["France entière", "Île-de-France", "Grand Ouest", "Grand Sud", "Grand Est", "International"].map((z) => (
                    <button
                      key={z}
                      onClick={() => set("zone", z)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        dossier.zone === z
                          ? "border-primary bg-primary/5 font-medium text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Secteurs prioritaires</label>
                <p className="text-xs text-muted-foreground mb-2">Sélectionnez les secteurs que vous ciblez en priorité.</p>
                <div className="flex flex-wrap gap-2">
                  {SECTEURS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleArray("secteursPrioritaires", s)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        dossier.secteursPrioritaires.includes(s)
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Y a-t-il des zones à exclure ?</label>
                <input
                  type="text"
                  value={dossier.exclusions}
                  onChange={(e) => set("exclusions", e.target.value)}
                  placeholder="ex : Pas d'international pour l'instant, pas le secteur public..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* ─── Étape 4 : Mode prospection ─── */}
          {etape === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Comment souhaitez-vous prospecter ?</label>
                <p className="text-xs text-muted-foreground mb-3">Choisissez le niveau de délégation que vous êtes à l'aise avec.</p>
                <div className="space-y-2">
                  {[
                    { id: "manuel" as ModeProspection, label: "Manuel", desc: "Je décide et j'exécute tout moi-même. OpenClaw m'assiste uniquement." },
                    { id: "assiste" as ModeProspection, label: "Assisté", desc: "OpenClaw prépare, je valide et j'exécute." },
                    { id: "semi-auto" as ModeProspection, label: "Semi-automatique", desc: "OpenClaw exécute les actions simples, me demande pour les points importants." },
                    { id: "agent" as ModeProspection, label: "Mode agent", desc: "Mes agents agissent avec grande autonomie, avec des garde-fous stricts." },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => set("mode", m.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        dossier.mode === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className={`font-semibold text-sm ${dossier.mode === m.id ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Canaux autorisés</label>
                <div className="flex flex-wrap gap-2">
                  {CANAUX.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleArray("canauxActives", c)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                        dossier.canauxActives.includes(c)
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Étape 5 : Objectifs ─── */}
          {etape === 5 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Opportunités / mois</label>
                  <input
                    type="number"
                    min="1"
                    value={dossier.nbOpportunites}
                    onChange={(e) => set("nbOpportunites", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">RDV / mois</label>
                  <input
                    type="number"
                    min="1"
                    value={dossier.nbRDV}
                    onChange={(e) => set("nbRDV", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Votre priorité du moment</label>
                <p className="text-xs text-muted-foreground mb-2">Quel secteur, quel segment ou quel objectif est le plus important maintenant ?</p>
                <textarea
                  rows={3}
                  value={dossier.prioriteActuelle}
                  onChange={(e) => set("prioriteActuelle", e.target.value)}
                  placeholder="ex : En ce moment, je veux m'imposer dans le secteur artisanat en Île-de-France avant l'été..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* ─── Étape 6 : Ton ─── */}
          {etape === 6 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Quel ton souhaitez-vous adopter ?</label>
                <p className="text-xs text-muted-foreground mb-3">Ce ton sera celui de vos messages et de votre positionnement.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "professionnel" as TonMessage, label: "Professionnel", desc: "Sérieux, structuré, rassurant" },
                    { id: "chaleureux" as TonMessage, label: "Chaleureux", desc: "Humain, accessible, proche" },
                    { id: "direct" as TonMessage, label: "Direct", desc: "Court, efficace, sans détour" },
                    { id: "premium" as TonMessage, label: "Premium", desc: "Élégant, qualitatif, exclusif" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => set("ton", t.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        dossier.ton === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className={`font-semibold text-sm ${dossier.ton === t.id ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Votre angle principal</label>
                <p className="text-xs text-muted-foreground mb-2">Quel est votre argument principal ? Gain de temps ? Économies ? Simplicité ? Croissance ?</p>
                <input
                  type="text"
                  value={dossier.positionnnement}
                  onChange={(e) => set("positionnnement", e.target.value)}
                  placeholder="ex : Nous sommes le seul outil pensé pour les artisans, pas les grandes entreprises"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* ─── Étape 7 : Contraintes ─── */}
          {etape === 7 && (
            <div className="space-y-5">
              <div
                className="flex gap-3 p-4 rounded-xl text-sm"
                style={{ background: "hsl(24 100% 45% / 0.06)", border: "1px solid hsl(24 100% 45% / 0.15)" }}
              >
                <AlertCircle size={16} style={{ color: "hsl(24 100% 45%)" }} className="shrink-0 mt-0.5" />
                <p style={{ color: "hsl(24 80% 30%)" }}>
                  Ces limites sont des garde-fous absolus. OpenClaw et vos agents ne pourront jamais les franchir, même en mode autonome.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Ce qu'il faut absolument éviter</label>
                <textarea
                  rows={3}
                  value={dossier.contraintes}
                  onChange={(e) => set("contraintes", e.target.value)}
                  placeholder="ex : Ne jamais prospecter des prospects déjà clients de notre partenaire X. Ne pas dépasser 5 relances..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Clients ou secteurs interdits</label>
                <input
                  type="text"
                  value={dossier.clientsInterdits}
                  onChange={(e) => set("clientsInterdits", e.target.value)}
                  placeholder="ex : Secteur défense, grandes administrations, concurrents directs..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div>
                  <p className="font-semibold text-foreground text-sm">Toujours valider avant une action importante</p>
                  <p className="text-xs text-muted-foreground mt-0.5">OpenClaw vous demandera votre avis avant tout envoi massif ou action sensible.</p>
                </div>
                <button
                  onClick={() => set("validationHumaine", !dossier.validationHumaine)}
                  className={`w-12 h-6 rounded-full transition-all relative ${dossier.validationHumaine ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dossier.validationHumaine ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation & Save ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {etape > 1 && (
            <button
              onClick={() => setEtape((e) => e - 1)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              <ChevronLeft size={15} /> Précédent
            </button>
          )}

          {etape < ETAPES.length ? (
            <button
              onClick={() => setEtape((e) => e + 1)}
              className="btn-cta flex-1 py-3"
            >
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSave} className="btn-cta flex-1 py-3">
              <Save size={15} /> Enregistrer le dossier
            </button>
          )}
        </div>

        {/* ── Confirmation save ─────────────────────────────────────────── */}
        {saved && (
          <div
            className="flex items-center gap-2 p-4 rounded-xl mt-4 text-sm font-medium"
            style={{ background: "hsl(142 50% 35% / 0.08)", color: "hsl(142 50% 28%)" }}
          >
            <CheckCircle2 size={16} />
            Dossier enregistré. OpenClaw commence l'analyse — vos agents vont se mettre au travail.
          </div>
        )}

        {/* ── Conseil JARVIS ────────────────────────────────────────────── */}
        <div
          className="p-4 rounded-xl border mt-4"
          style={{
            background: "linear-gradient(135deg, hsl(var(--secondary)), hsl(218 72% 18% / 0.03))",
            borderColor: "hsl(218 72% 18% / 0.12)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Conseil JARVIS</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {etape === 1 && "Soyez précis sur votre offre. Plus c'est clair, plus OpenClaw pourra trouver des contacts qui correspondent vraiment."}
                {etape === 2 && "Décrivez votre client idéal comme si vous parliez à un apporteur d'affaires. Plus c'est visuel, plus les introductions seront pertinentes."}
                {etape === 3 && "Commencez toujours par une zone géographique maîtrisable. Mieux vaut exceller dans une région avant de s'étendre."}
                {etape === 4 && "Pour commencer, choisissez 'Assisté'. Vous garderez le contrôle total tout en bénéficiant de l'intelligence d'OpenClaw."}
                {etape === 5 && "Des objectifs réalistes motivent plus qu'une barre trop haute. 3 RDV/mois bien ciblés valent 30 contacts mal qualifiés."}
                {etape === 6 && "Le ton direct et professionnel fonctionne très bien en prospection B2B. Évitez le trop formel qui crée de la distance."}
                {etape === 7 && "La validation humaine obligatoire est recommandée en phase de démarrage. Vous pourrez toujours l'assouplir plus tard."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
