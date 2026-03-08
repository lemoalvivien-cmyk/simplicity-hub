/**
 * Regles — Automation rules backed by real DB (automation_rules table).
 * PROOF:GOLIVE_V1:automation_rules_ui_real → useAutomationRules hook + real DB read/write
 */
import UserLayout from "@/components/layout/UserLayout";
import {
  Shield, CheckCircle2, AlertCircle, PauseCircle,
  Eye, Zap, Settings, ChevronRight, Info, Sparkles
} from "lucide-react";
import { useAutomationRules } from "@/hooks/useAutomationRules";

// PROOF:GOLIVE_V1:automation_rules_ui_real — icon map for each rule_type
const RULE_ICON: Record<string, React.ElementType> = {
  validation_avant_envoi:   Eye,
  pause_si_anomalie:        AlertCircle,
  limite_volume:            Shield,
  pause_manuelle:           PauseCircle,
  actions_simples_auto:     Zap,
  validation_importantes:   CheckCircle2,
};

const NIVEAU_CFG: Record<string, { label: string; color: string; bg: string }> = {
  securite:       { label: "Sécurité",       color: "hsl(var(--success))",       bg: "hsl(var(--success-light))" },
  automatisation: { label: "Automatisation", color: "hsl(220 80% 45%)",           bg: "hsl(220 80% 95%)" },
  validation:     { label: "Validation",     color: "hsl(var(--primary))",        bg: "hsl(var(--secondary))" },
};

const RULE_COLOR: Record<string, { color: string; bg: string }> = {
  validation_avant_envoi:  { color: "hsl(var(--success))",    bg: "hsl(var(--success-light))" },
  pause_si_anomalie:       { color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))" },
  limite_volume:           { color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
  pause_manuelle:          { color: "hsl(280 60% 45%)",       bg: "hsl(280 60% 95%)" },
  actions_simples_auto:    { color: "hsl(220 80% 45%)",       bg: "hsl(220 80% 95%)" },
  validation_importantes:  { color: "hsl(var(--success))",    bg: "hsl(var(--success-light))" },
};

export default function Regles() {
  // PROOF:GOLIVE_V1:automation_rules_ui_real — reads from DB, writes via toggle
  const { rules, loading, error, toggle } = useAutomationRules();

  const actives = rules.filter(r => r.is_enabled).length;

  const grouped = (["securite", "validation", "automatisation"] as const).map(niveau => ({
    niveau,
    cfg: NIVEAU_CFG[niveau],
    items: rules.filter(r => r.niveau === niveau),
  })).filter(g => g.items.length > 0);

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary))" }}>
            <Shield size={20} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Règles & sécurités</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Définissez comment la plateforme doit se comporter.{" "}
                {actives} règle{actives > 1 ? "s" : ""} active{actives > 1 ? "s" : ""} sur {rules.length}.
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30">
            Erreur : {error}
          </div>
        )}

        {/* Info banner */}
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: "hsl(var(--muted))" }}>
          <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ces règles vous permettent de rester en contrôle à tout moment.
            Activez celles qui correspondent à votre façon de travailler.
            Vous pouvez tout modifier à n'importe quel moment.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card-surface p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && rules.length === 0 && (
          <div className="card-surface p-10 text-center">
            <Settings size={28} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground mb-1">Aucune règle configurée</p>
            <p className="text-sm text-muted-foreground">Les règles par défaut seront chargées au prochain accès.</p>
          </div>
        )}

        {/* Grouped rules */}
        {!loading && grouped.map(({ niveau, cfg, items }) => (
          <div key={niveau} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                {cfg.label}
              </span>
            </div>
            <div className="space-y-3">
              {items.map(r => {
                const Icon = RULE_ICON[r.rule_type] ?? Settings;
                const clr = RULE_COLOR[r.rule_type] ?? { color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" };
                return (
                  <div key={r.id} className="card-surface p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: r.is_enabled ? clr.bg : "hsl(var(--muted))" }}>
                        <Icon size={15} style={{ color: r.is_enabled ? clr.color : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-0.5">{r.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                      </div>
                      {/* Toggle — writes to DB via useAutomationRules.toggle */}
                      <button
                        onClick={() => toggle(r.id)}
                        className="shrink-0 w-11 h-6 rounded-full transition-all relative"
                        style={{ background: r.is_enabled ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                        aria-label={r.is_enabled ? "Désactiver" : "Activer"}
                      >
                        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                          style={{ left: r.is_enabled ? "calc(100% - 22px)" : "2px" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary */}
        {!loading && rules.length > 0 && (
          <div className="card-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} style={{ color: "hsl(var(--primary))" }} />
              <p className="font-semibold text-foreground text-sm">Résumé de votre configuration</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Avec ces paramètres, la plateforme va :{" "}
              {rules.filter(r => r.is_enabled).map(r => r.label.toLowerCase()).join(" · ")}.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} />
              <span className="text-xs text-muted-foreground">
                Configuration persistée. Source : table <code>automation_rules</code>.
              </span>
            </div>
          </div>
        )}

        {/* JARVIS */}
        <div className="rounded-2xl p-4 mt-5" style={{ background: "hsl(var(--secondary))" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-semibold text-foreground">Vous avez des questions ?</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            JARVIS peut vous expliquer à quoi sert chaque règle et vous conseiller selon votre usage.
          </p>
          <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
            Demander à JARVIS <ChevronRight size={11} />
          </button>
        </div>

      </div>
    </UserLayout>
  );
}
