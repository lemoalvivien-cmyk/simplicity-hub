import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ChevronRight, ChevronLeft, Check, Sparkles, Users, Mail,
  Phone, ArrowRight, Play, Shield, Zap, Target, X
} from "lucide-react";

type Etape = "nom" | "contacts" | "mode" | "canaux" | "plan" | "messages" | "lancement";

const ETAPES: { id: Etape; label: string }[] = [
  { id: "nom", label: "Nom" },
  { id: "contacts", label: "Contacts" },
  { id: "mode", label: "Mode" },
  { id: "canaux", label: "Canaux" },
  { id: "plan", label: "Plan" },
  { id: "messages", label: "Messages" },
  { id: "lancement", label: "Lancer" },
];

const LISTES_MOCK = [
  { id: 1, nom: "Campagne Octobre", contacts: 45 },
  { id: 2, nom: "Prospects RH", contacts: 12 },
  { id: 3, nom: "Anciens prospects", contacts: 30 },
];

const CANAUX = [
  { id: "email", label: "Email", desc: "Premier contact ou relance par email", icon: Mail, dispo: true },
  { id: "telephone", label: "Téléphone", desc: "Appel ou rappel téléphonique", icon: Phone, dispo: true },
  { id: "introduction", label: "Introduction", desc: "Via un apporteur d'affaires", icon: Users, dispo: false },
];

const MODES = [
  {
    id: "manuel",
    icon: Target,
    label: "Je gère tout moi-même",
    desc: "Vous voyez chaque action avant qu'elle se passe. Vous gardez le contrôle total.",
    badge: "Recommandé pour débuter",
  },
  {
    id: "assiste",
    icon: Sparkles,
    label: "Aidé par l'IA",
    desc: "L'IA vous suggère les prochaines actions. Vous validez avant chaque étape.",
    badge: null,
  },
  {
    id: "semi_auto",
    icon: Zap,
    label: "Semi-automatique",
    desc: "Les étapes simples se lancent automatiquement. Vous n'intervenez que pour les décisions importantes.",
    badge: "Bientôt disponible",
    disabled: true,
  },
];

const ACTIONS_PLAN = [
  { id: "contact", label: "Premier contact", desc: "Votre premier message ou appel" },
  { id: "relance1", label: "Première relance", desc: "Si pas de réponse après quelques jours" },
  { id: "relance2", label: "Deuxième relance", desc: "Dernière tentative, ton différent" },
  { id: "qualification", label: "Qualification", desc: "Marquer comme intéressé ou pas" },
];

export default function CampagneNouvelle() {
  const navigate = useNavigate();
  const [etapeIdx, setEtapeIdx] = useState(0);
  const [nom, setNom] = useState("");
  const [objectif, setObjectif] = useState("");
  const [listeId, setListeId] = useState<number | null>(null);
  const [mode, setMode] = useState<string>("manuel");
  const [canauxChoisis, setCanauxChoisis] = useState<string[]>(["email"]);
  const [actionsChoisies, setActionsChoisies] = useState<string[]>(["contact", "relance1"]);
  const [msgPremier, setMsgPremier] = useState("");
  const [msgRelance, setMsgRelance] = useState("");

  const etape = ETAPES[etapeIdx].id;
  const isFirst = etapeIdx === 0;
  const isLast = etapeIdx === ETAPES.length - 1;

  const canNext = () => {
    if (etape === "nom") return nom.trim().length > 0;
    if (etape === "contacts") return listeId !== null;
    if (etape === "canaux") return canauxChoisis.length > 0;
    return true;
  };

  const toggleCanal = (id: string) => {
    setCanauxChoisis((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAction = (id: string) => {
    setActionsChoisies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const listeChoisie = LISTES_MOCK.find((l) => l.id === listeId);

  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Nouvelle campagne
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Étape {etapeIdx + 1} sur {ETAPES.length}
            </p>
          </div>
          <button
            onClick={() => navigate("/campagnes")}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-1 mb-8">
          {ETAPES.map((e, i) => (
            <div
              key={e.id}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background:
                  i < etapeIdx
                    ? "hsl(var(--primary))"
                    : i === etapeIdx
                    ? "hsl(var(--primary) / 0.4)"
                    : "hsl(var(--muted))",
              }}
            />
          ))}
        </div>

        {/* ── Étape 1 : Nom ── */}
        {etape === "nom" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Comment s'appelle cette campagne ?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choisissez un nom simple pour vous souvenir de l'objectif.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nom de la campagne
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex : Prospection PME Novembre"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Objectif (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Prendre des rendez-vous avec des DSI"
                  value={objectif}
                  onChange={(e) => setObjectif(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Contacts ── */}
        {etape === "contacts" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Qui souhaitez-vous contacter ?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choisissez une liste de contacts existante, ou importez de nouveaux contacts.
            </p>
            <div className="space-y-2.5 mb-4">
              {LISTES_MOCK.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setListeId(l.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border transition-all"
                  style={{
                    borderColor: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background: listeId === l.id ? "hsl(var(--secondary))" : "hsl(var(--card))",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                    >
                      <Users size={14} style={{ color: listeId === l.id ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">{l.nom}</p>
                      <p className="text-xs text-muted-foreground">{l.contacts} contacts</p>
                    </div>
                  </div>
                  {listeId === l.id && (
                    <Check size={16} style={{ color: "hsl(var(--primary))" }} />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("/contacts/import")}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight size={14} /> Importer de nouveaux contacts d'abord
            </button>
          </div>
        )}

        {/* ── Étape 3 : Mode ── */}
        {etape === "mode" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Comment voulez-vous travailler ?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choisissez votre niveau de contrôle. Vous pouvez toujours changer plus tard.
            </p>
            <div className="space-y-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => !m.disabled && setMode(m.id)}
                  disabled={!!m.disabled}
                  className="w-full text-left p-4 rounded-xl border transition-all"
                  style={{
                    borderColor: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background: mode === m.id ? "hsl(var(--secondary))" : m.disabled ? "hsl(var(--muted)/0.4)" : "hsl(var(--card))",
                    opacity: m.disabled ? 0.6 : 1,
                    cursor: m.disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                    >
                      <m.icon size={14} style={{ color: mode === m.id ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        {m.badge && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: m.disabled ? "hsl(var(--muted))" : "hsl(var(--accent-light))",
                              color: m.disabled ? "hsl(var(--muted-foreground))" : "hsl(38 80% 30%)",
                            }}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    {mode === m.id && !m.disabled && (
                      <Check size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 4 : Canaux ── */}
        {etape === "canaux" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Par quel canal voulez-vous contacter ?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Vous pouvez en choisir plusieurs. On recommande de commencer par un seul.
            </p>
            <div className="space-y-3">
              {CANAUX.map((c) => {
                const selected = canauxChoisis.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => c.dispo && toggleCanal(c.id)}
                    disabled={!c.dispo}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: selected ? "hsl(var(--secondary))" : !c.dispo ? "hsl(var(--muted)/0.3)" : "hsl(var(--card))",
                      opacity: !c.dispo ? 0.6 : 1,
                      cursor: !c.dispo ? "not-allowed" : "pointer",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: selected ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                      >
                        <c.icon size={14} style={{ color: selected ? "white" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.label}</p>
                          {!c.dispo && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              Bientôt
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      {selected && (
                        <Check size={16} style={{ color: "hsl(var(--primary))" }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Étape 5 : Plan d'action ── */}
        {etape === "plan" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Votre plan d'action
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choisissez les étapes de votre campagne. Vous pouvez modifier l'ordre plus tard.
            </p>
            <div className="space-y-2.5">
              {ACTIONS_PLAN.map((a, idx) => {
                const selected = actionsChoisies.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAction(a.id)}
                    className="w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: selected ? "hsl(var(--secondary))" : "hsl(var(--card))",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={
                        selected
                          ? { background: "hsl(var(--primary))", color: "white" }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    {selected && <Check size={16} style={{ color: "hsl(var(--primary))" }} />}
                  </button>
                );
              })}
            </div>
            <div
              className="mt-4 p-3 rounded-xl text-xs text-muted-foreground"
              style={{ background: "hsl(var(--muted))" }}
            >
              <Sparkles size={12} className="inline mr-1" style={{ color: "hsl(var(--primary))" }} />
              JARVIS peut vous aider à choisir le bon rythme selon votre secteur.
            </div>
          </div>
        )}

        {/* ── Étape 6 : Messages ── */}
        {etape === "messages" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">
              Préparez vos messages
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Écrivez un premier message simple et humain. JARVIS peut vous aider.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Premier message
                </label>
                <textarea
                  rows={4}
                  placeholder="Bonjour [Prénom], je vous contacte car…"
                  value={msgPremier}
                  onChange={(e) => setMsgPremier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
                <button
                  className="mt-2 text-xs font-medium flex items-center gap-1 hover:underline transition-colors"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <Sparkles size={11} /> Améliorer avec l'IA
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Message de relance (optionnel)
                </label>
                <textarea
                  rows={3}
                  placeholder="Je me permets de revenir vers vous…"
                  value={msgRelance}
                  onChange={(e) => setMsgRelance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
                <button
                  className="mt-2 text-xs font-medium flex items-center gap-1 hover:underline transition-colors"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <Sparkles size={11} /> Simplifier ce message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 7 : Lancement ── */}
        {etape === "lancement" && (
          <div>
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsl(var(--secondary))" }}
              >
                <Play size={28} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                Tout est prêt.
              </h2>
              <p className="text-sm text-muted-foreground">
                Vérifiez les informations ci-dessous avant de lancer.
              </p>
            </div>

            <div className="card-surface p-4 mb-4 space-y-3">
              {[
                { label: "Campagne", value: nom || "Sans titre" },
                { label: "Contacts", value: listeChoisie ? `${listeChoisie.nom} — ${listeChoisie.contacts} contacts` : "—" },
                { label: "Mode", value: MODES.find((m) => m.id === mode)?.label || "—" },
                { label: "Canaux", value: canauxChoisis.join(", ") || "—" },
                { label: "Étapes", value: `${actionsChoisies.length} action${actionsChoisies.length > 1 ? "s" : ""}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-semibold text-foreground text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div
              className="p-3 rounded-xl text-xs text-muted-foreground mb-5"
              style={{ background: "hsl(var(--muted))" }}
            >
              <Shield size={12} className="inline mr-1" style={{ color: "hsl(var(--success))" }} />
              Les envois automatiques ne se déclenchent pas encore — vous validez chaque action manuellement pour l'instant.
            </div>

            <button
              onClick={() => navigate("/campagnes")}
              className="w-full btn-cta py-3 text-sm flex items-center justify-center gap-2"
            >
              <Play size={15} /> Lancer la campagne
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => setEtapeIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={16} /> Retour
          </button>
          {!isLast ? (
            <button
              onClick={() => setEtapeIdx((i) => Math.min(ETAPES.length - 1, i + 1))}
              disabled={!canNext()}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{
                background: "hsl(var(--primary))",
                color: "white",
              }}
            >
              Continuer <ChevronRight size={16} />
            </button>
          ) : null}
        </div>

      </div>
    </UserLayout>
  );
}
