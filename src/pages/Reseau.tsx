import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Network, Shield, Globe, Zap, Star, TrendingUp, MapPin,
  CheckCircle2, ArrowRight, Sparkles, Users, Link2, BarChart3,
  Lock, ChevronRight
} from "lucide-react";

// ── Business corridors data ────────────────────────────────────────────────
const CORRIDORS = [
  { from: "🇫🇷 France", to: "🇮🇱 Israël", strength: 92, langs: ["Français", "Hébreu", "Anglais"], active: true },
  { from: "🇫🇷 France", to: "🇧🇪 Belgique", strength: 88, langs: ["Français", "Néerlandais"], active: true },
  { from: "🇫🇷 France", to: "🇨🇭 Suisse", strength: 85, langs: ["Français", "Allemand"], active: true },
  { from: "🇫🇷 France", to: "🇬🇧 UK", strength: 79, langs: ["Français", "Anglais"], active: true },
  { from: "🇫🇷 France", to: "🇦🇪 EAU", strength: 74, langs: ["Français", "Arabe", "Anglais"], active: true },
  { from: "🇪🇸 Espagne", to: "🇲🇽 LATAM", strength: 81, langs: ["Espagnol", "Portugais"], active: false },
  { from: "🇫🇷 France", to: "🇨🇦 Canada", strength: 76, langs: ["Français", "Anglais"], active: false },
  { from: "🌍 Europe", to: "🌍 Afrique fr.", strength: 69, langs: ["Français", "Arabe"], active: false },
];

// ── Mock proof ledger entries ──────────────────────────────────────────────
const PROOF_ENTRIES = [
  {
    id: "1", contact: "Marie D.", facilitator: "Thomas B.", status: "transformee",
    date: "2026-03-05", linked_gain: true, company: "Acme SaaS",
    label: "Introduction prouvée", color: "hsl(142 50% 30%)", bg: "hsl(142 50% 95%)"
  },
  {
    id: "2", contact: "Jean-Paul R.", facilitator: "Sophie M.", status: "acceptee",
    date: "2026-03-04", linked_gain: false, company: "FinTech Paris",
    label: "Acceptée", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 95%)"
  },
  {
    id: "3", contact: "Carlos V.", facilitator: "Ahmed K.", status: "envoyee",
    date: "2026-03-03", linked_gain: false, company: "Global Trade",
    label: "En cours", color: "hsl(38 90% 40%)", bg: "hsl(38 90% 95%)"
  },
];

const PROOF_CYCLE = [
  { step: "Demandée", icon: Users, color: "hsl(var(--muted-foreground))" },
  { step: "Envoyée", icon: ArrowRight, color: "hsl(218 72% 40%)" },
  { step: "Vue", icon: CheckCircle2, color: "hsl(38 90% 40%)" },
  { step: "Acceptée", icon: Star, color: "hsl(152 62% 30%)" },
  { step: "Transformée", icon: TrendingUp, color: "hsl(142 50% 30%)" },
];

const RELATIONSHIP_TYPES = [
  { type: "introduced", label: "A introduit", count: 24, icon: Users, color: "hsl(218 72% 40%)" },
  { type: "matched_to", label: "Matchés", count: 18, icon: Zap, color: "hsl(38 90% 40%)" },
  { type: "trusted_by", label: "Fait confiance", count: 31, icon: Shield, color: "hsl(142 50% 30%)" },
  { type: "converted_to", label: "Convertis", count: 9, icon: TrendingUp, color: "hsl(152 62% 30%)" },
];

const TRUST_LEVELS = [
  { label: "Très fort", min: 85, color: "hsl(142 50% 30%)", count: 7 },
  { label: "Fort", min: 65, color: "hsl(218 72% 40%)", count: 14 },
  { label: "Moyen", min: 40, color: "hsl(38 90% 40%)", count: 22 },
  { label: "Faible", min: 0, color: "hsl(var(--muted-foreground))", count: 8 },
];

function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export default function Reseau() {
  const [activeTab, setActiveTab] = useState<"graph" | "proofs" | "corridors">("graph");

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Network size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Réseau intelligent</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Le réseau qui trouve le meilleur chemin d'accès. Chaque connexion est prouvée.
            </p>
          </div>
        </div>

        {/* ── JARVIS WOW strip ──────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--primary) / 0.2)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">OpenClaw voit votre meilleur chemin d'accès</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Votre facilitateur Thomas B. a un score de confiance de 94 — chemin optimal vers FinTech Paris.
            </p>
          </div>
          <button className="ml-auto shrink-0 text-xs text-primary font-semibold hover:underline">
            Explorer →
          </button>
        </div>

        {/* ── KPI row ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Connexions actives", value: "51", icon: Link2, sub: "+3 cette semaine" },
            { label: "Introductions prouvées", value: "24", icon: Shield, sub: "Certifiées" },
            { label: "Score moyen confiance", value: "78", icon: Star, sub: "Sur 100" },
            { label: "Corridors actifs", value: "5", icon: Globe, sub: "International" },
          ].map(kpi => (
            <div key={kpi.label} className="card-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={14} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {[
            { id: "graph", label: "Connexions", icon: Network },
            { id: "proofs", label: "Introductions prouvées", icon: Shield },
            { id: "corridors", label: "Corridors business", icon: Globe },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? "shadow-sm" : ""
              }`}
              style={{
                background: activeTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: activeTab === tab.id ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════ TAB: GRAPH / CONNEXIONS ═══════════════════════════════ */}
        {activeTab === "graph" && (
          <div className="space-y-5">

            {/* Relation types */}
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground mb-4">Types de connexions</h2>
              <div className="grid grid-cols-2 gap-4">
                {RELATIONSHIP_TYPES.map(rel => (
                  <div key={rel.type} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: rel.color + "18" }}
                    >
                      <rel.icon size={16} style={{ color: rel.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rel.count}</p>
                      <p className="text-xs text-muted-foreground">{rel.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust levels */}
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground mb-4">Niveaux de confiance</h2>
              <div className="space-y-3">
                {TRUST_LEVELS.map(level => (
                  <div key={level.label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold w-20 shrink-0" style={{ color: level.color }}>
                      {level.label}
                    </span>
                    <div className="flex-1">
                      <StrengthBar value={(level.count / 51) * 100} color={level.color} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{level.count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 border-t pt-3" style={{ borderColor: "hsl(var(--border))" }}>
                La confiance n'est pas déclarative. Elle se construit via les introductions, les gains et les avis.
              </p>
            </div>

            {/* OpenClaw recommendations */}
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={15} className="text-primary" />
                <h2 className="font-semibold text-foreground">Ce qu'OpenClaw recommande</h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: "Activez Thomas B. pour votre opportunité FinTech",
                    reason: "Score confiance 94 · Corridor France → Israël · Parle hébreu",
                    priority: "high",
                  },
                  {
                    title: "Sophie M. est idéale pour votre marché RH",
                    reason: "Spécialiste RH · Zone Île-de-France · 12 introductions réussies",
                    priority: "medium",
                  },
                  {
                    title: "Renforcez votre corridor France → EAU",
                    reason: "2 opportunités détectées · Facilitateurs disponibles · Parle arabe",
                    priority: "low",
                  },
                ].map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{
                        background: rec.priority === "high"
                          ? "hsl(142 50% 40%)"
                          : rec.priority === "medium"
                          ? "hsl(38 90% 50%)"
                          : "hsl(218 72% 50%)",
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: PROOFS / LEDGER ═══════════════════════════════════ */}
        {activeTab === "proofs" && (
          <div className="space-y-5">

            {/* Cycle explication */}
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground mb-4">Cycle d'une introduction prouvée</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {PROOF_CYCLE.map((step, i) => (
                  <div key={step.step} className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: step.color + "15", color: step.color }}
                    >
                      <step.icon size={11} />
                      {step.step}
                    </div>
                    {i < PROOF_CYCLE.length - 1 && (
                      <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Chaque introduction importante est horodatée, tracée et prouvée dans WIINUP MAX.
              </p>
            </div>

            {/* Proof entries */}
            <div className="card-surface divide-y" style={{ "--divider": "hsl(var(--border))" } as React.CSSProperties}>
              <div className="p-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Introductions prouvées</h2>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "hsl(142 50% 95%)", color: "hsl(142 50% 30%)" }}
                >
                  {PROOF_ENTRIES.length} preuves actives
                </span>
              </div>
              {PROOF_ENTRIES.map(entry => (
                <div key={entry.id} className="p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: entry.bg }}
                  >
                    <Shield size={18} style={{ color: entry.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {entry.contact} → {entry.company}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      via {entry.facilitator} · {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: entry.bg, color: entry.color }}
                    >
                      {entry.label}
                    </span>
                    {entry.linked_gain && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(38 90% 95%)", color: "hsl(38 90% 40%)" }}
                      >
                        Gain lié ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Anti-bypass shield */}
            <div
              className="rounded-xl p-4 border flex items-start gap-3"
              style={{ background: "hsl(var(--secondary))", borderColor: "hsl(142 50% 40% / 0.2)" }}
            >
              <Lock size={18} style={{ color: "hsl(142 50% 35%)", marginTop: 2 }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Anti-contournement actif</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chaque introduction est horodatée et liée à un facilitateur. Le ledger protège votre écosystème
                  et alimenter les scores de réputation automatiquement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════ TAB: CORRIDORS BUSINESS ═══════════════════════════════ */}
        {activeTab === "corridors" && (
          <div className="space-y-5">

            <div className="card-surface p-4 flex items-center gap-3">
              <Globe size={18} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">
                OpenClaw identifie automatiquement vos meilleurs corridors business selon vos facilitateurs, vos opportunités et vos langues.
              </p>
            </div>

            <div className="space-y-3">
              {CORRIDORS.map((corridor, i) => (
                <div
                  key={i}
                  className="card-surface p-4 flex items-center gap-4"
                  style={{ opacity: corridor.active ? 1 : 0.6 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {corridor.from}
                      </span>
                      <ArrowRight size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {corridor.to}
                      </span>
                      {corridor.active && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(142 50% 95%)", color: "hsl(142 50% 30%)" }}
                        >
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {corridor.langs.map(lang => (
                        <span
                          key={lang}
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                    <StrengthBar value={corridor.strength} color="hsl(var(--primary))" />
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-xl font-bold text-foreground">{corridor.strength}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              className="rounded-xl p-5 border"
              style={{ background: "var(--gradient-primary)", borderColor: "transparent" }}
            >
              <p className="text-white font-semibold text-sm mb-1">Activez un nouveau corridor business</p>
              <p className="text-white/80 text-xs mb-3">
                OpenClaw recommande vos meilleurs corridors selon vos facilitateurs disponibles et vos opportunités en cours.
              </p>
              <button
                className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{ background: "hsl(var(--background))", color: "hsl(var(--primary))" }}
              >
                Voir les recommandations →
              </button>
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
