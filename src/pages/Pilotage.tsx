/**
 * Pilotage — Mon IA
 * 3 onglets : Ce que l'IA fait / Recommandations / Réglages IA
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Sparkles, Settings2, CheckCircle2, Clock, AlertTriangle,
  Loader2, WifiOff, Wifi, ChevronRight, ArrowRight, Zap, TrendingUp,
  Target, Play, Power, Sliders,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/* ─── NIVEAUX D'AUTONOMIE ─────────────────────────────────── */
const AUTONOMY_LEVELS = [
  { id: 0, label: "Lecture seule",     desc: "L'IA observe et analyse. Elle ne fait rien sans vous." },
  { id: 1, label: "Suggestions",       desc: "L'IA vous propose des actions. Vous choisissez lesquelles exécuter." },
  { id: 2, label: "Assisté",           desc: "L'IA prépare tout. Vous validez avant chaque envoi." },
  { id: 3, label: "Semi-automatique",  desc: "L'IA exécute les étapes simples. Vous validez les décisions importantes." },
  { id: 4, label: "Étendu",            desc: "L'IA gère votre pipeline de façon autonome. Vous gardez la main via le kill switch." },
];

/* ─── TERMES HUMAINS pour les types de jobs ────────────────── */
const JOB_LABELS: Record<string, string> = {
  daily_brief_generate:     "Synthèse quotidienne",
  radar_scan:               "Détection d'opportunités",
  next_best_action_generate:"Suggestions de relance",
  hot_opportunity_rescore:  "Analyse de pipeline",
  facilitator_match_refresh:"Mise à jour des contacts",
  approval_reminder:        "Rappels de validation",
  stuck_pipeline_recheck:   "Vérification des dossiers bloqués",
  trust_recompute:          "Recalcul du score de confiance",
  passive_alert_digest:     "Analyse des signaux passifs",
  passive_offer_refresh:    "Actualisation des offres",
};

function humanJobLabel(jobType: string) {
  return JOB_LABELS[jobType] ?? jobType.replace(/_/g, " ");
}

function humanDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusConfig(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    done:     { label: "Terminé",   color: "hsl(var(--success))",    bg: "hsl(var(--success-light))" },
    running:  { label: "En cours",  color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
    pending:  { label: "Planifié",  color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))" },
    failed:   { label: "Échoué",    color: "hsl(0 65% 40%)",         bg: "hsl(0 65% 96%)" },
    locked:   { label: "En cours",  color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
  };
  return map[status] ?? { label: status, color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" };
}

/* ─── COMPOSANT PRINCIPAL ──────────────────────────────────── */
export default function Pilotage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [autonomyLevel, setAutonomyLevel] = useState(2);
  const [killSwitch, setKillSwitch] = useState(false);
  const [killConfirm, setKillConfirm] = useState(false);
  const [openClawConnected, setOpenClawConnected] = useState(false);
  const [validationsPending, setValidationsPending] = useState(0);

  // Tab 1 — recent IA jobs
  const [recentJobs, setRecentJobs] = useState<{
    id: string; job_type: string; status: string;
    output_summary: string | null; ended_at: string | null; scheduled_at: string;
  }[]>([]);

  // Tab 2 — recommendations
  const [recs, setRecs] = useState<{
    id: string; title: string; summary: string; priority: string; action_label: string | null; action_href: string | null;
  }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [jobsRes, configRes, validRes, recsRes] = await Promise.all([
        db.from("openclaw_job_queue")
          .select("id, job_type, status, output_summary, ended_at, scheduled_at")
          .eq("user_id", user.id)
          .in("status", ["done", "running", "pending", "locked", "failed"])
          .order("scheduled_at", { ascending: false })
          .limit(12),
        db.from("openclaw_config")
          .select("is_connected, kill_switch_global, autonomy_level")
          .eq("user_id", user.id)
          .maybeSingle(),
        db.from("openclaw_validations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("statut", "en_attente"),
        db.from("openclaw_recommendations")
          .select("id, title, summary, priority, action_label, action_href")
          .eq("user_id", user.id)
          .order("priority", { ascending: false })
          .limit(10),
      ]);

      setRecentJobs((jobsRes.data ?? []) as typeof recentJobs);
      const cfg = configRes.data as { is_connected: boolean; kill_switch_global: boolean; autonomy_level?: number } | null;
      setOpenClawConnected((cfg?.is_connected ?? false) && !(cfg?.kill_switch_global ?? false));
      setKillSwitch(cfg?.kill_switch_global ?? false);
      setAutonomyLevel(cfg?.autonomy_level ?? 2);
      setValidationsPending(validRes.count ?? 0);
      setRecs((recsRes.data ?? []) as typeof recs);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAutonomyChange = async (value: number) => {
    setAutonomyLevel(value);
    if (user) {
      await db.from("openclaw_config").upsert({ user_id: user.id, autonomy_level: value }, { onConflict: "user_id" });
    }
  };

  const handleKillSwitch = async (value: boolean) => {
    if (value && !killConfirm) { setKillConfirm(true); return; }
    setKillConfirm(false);
    setKillSwitch(value);
    if (user) {
      await db.from("openclaw_config").upsert({ user_id: user.id, kill_switch_global: value }).eq("user_id", user.id);
    }
  };

  if (loading) {
    return (
      <UserLayout jarvisContext="dashboard">
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Brain size={22} className="text-primary" />
              <GlossaryTooltip term="KITT IA">Mon IA</GlossaryTooltip>
            </h1>
            <p className="text-sm text-muted-foreground">
              Votre assistant IA travaille en arrière-plan pour vous.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {validationsPending > 0 && (
              <Link to="/validations"
                className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ background: "hsl(var(--accent-light))", color: "hsl(38 80% 30%)", border: "1px solid hsl(38 80% 70%)" }}>
                <AlertTriangle size={11} />
                {validationsPending} validation{validationsPending > 1 ? "s" : ""} en attente
              </Link>
            )}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              openClawConnected
                ? "text-foreground"
                : "border-border text-muted-foreground bg-muted"}`}
              style={openClawConnected ? {
                borderColor: "hsl(var(--success) / 0.3)",
                background: "hsl(var(--success-light))",
                color: "hsl(var(--success))"
              } : {}}>
              {openClawConnected
                ? <><Wifi size={11} /> IA active</>
                : <><WifiOff size={11} /> IA inactive</>}
            </div>
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────────────────── */}
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="actions" className="flex items-center gap-1.5 text-xs">
              <Zap size={13} /> Ce que l'IA fait
            </TabsTrigger>
            <TabsTrigger value="recs" className="flex items-center gap-1.5 text-xs">
              <Sparkles size={13} /> Recommandations
              {recs.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">{recs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
              <Settings2 size={13} /> Réglages IA
            </TabsTrigger>
          </TabsList>

          {/* ── ONGLET 1 : Ce que l'IA fait ─────────────────────── */}
          <TabsContent value="actions" className="space-y-3 mt-0">
            {recentJobs.length === 0 ? (
              <div className="card-surface p-8 text-center space-y-3">
                <Brain size={36} className="mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground">
                  <GlossaryTooltip term="OpenClaw">Votre IA</GlossaryTooltip> travaille en arrière-plan.
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Les premières recommandations arrivent sous 24h. Vous serez notifié dès qu'il y a quelque chose à faire.
                </p>
              </div>
            ) : (
              <div className="card-surface divide-y divide-border">
                {recentJobs.map((job) => {
                  const st = statusConfig(job.status);
                  const date = job.ended_at ?? job.scheduled_at;
                  return (
                    <div key={job.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: st.bg }}>
                          <Zap size={12} style={{ color: st.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {humanJobLabel(job.job_type)}
                          </p>
                          {job.output_summary && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {job.output_summary.slice(0, 100)}{job.output_summary.length > 100 ? "…" : ""}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/60 mt-1">{humanDate(date)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                        {job.status === "done" && job.output_summary && (
                          <Link to="/actions"
                            className="text-[11px] text-primary font-medium hover:underline flex items-center gap-0.5">
                            Voir détail <ChevronRight size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link to="/actions"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              Voir toutes les actions <ArrowRight size={12} />
            </Link>
          </TabsContent>

          {/* ── ONGLET 2 : Recommandations ──────────────────────── */}
          <TabsContent value="recs" className="space-y-3 mt-0">
            {recs.length === 0 ? (
              <div className="card-surface p-8 text-center space-y-3">
                <Sparkles size={36} className="mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Aucune recommandation pour l'instant.</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  L'IA génère des recommandations basées sur l'activité de votre pipeline.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recs.map((rec) => {
                  const isHigh = rec.priority === "haute" || rec.priority === "critique";
                  return (
                    <div key={rec.id} className="card-surface p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">{rec.title}</p>
                        {isHigh && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                            style={{ color: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}>
                            Prioritaire
                          </span>
                        )}
                      </div>
                      {rec.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.summary}</p>
                      )}
                      {rec.action_href && rec.action_label && (
                        <Link to={rec.action_href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                          {rec.action_label} <ChevronRight size={11} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── ONGLET 3 : Réglages IA ──────────────────────────── */}
          <TabsContent value="settings" className="space-y-4 mt-0">

            {/* Niveau d'autonomie */}
            <div className="card-surface p-5 space-y-4">
              <div>
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-0.5">
                  <Sliders size={16} className="text-primary" />
                  Niveau d'autonomie
                </h2>
                <p className="text-xs text-muted-foreground">
                  Choisissez jusqu'où l'IA peut agir seule.
                </p>
              </div>

              {/* Curseur visuel 5 positions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-muted-foreground">Lecture</span>
                  <span className="text-[10px] text-muted-foreground">Étendu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={autonomyLevel}
                  onChange={(e) => handleAutonomyChange(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between">
                  {AUTONOMY_LEVELS.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setAutonomyLevel(lvl.id)}
                      className={`flex-1 text-center text-[10px] font-medium py-0.5 rounded transition-colors ${
                        autonomyLevel === lvl.id
                          ? "text-primary"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }`}>
                      {lvl.id + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description du niveau actif */}
              <div className="rounded-xl p-3 space-y-1" style={{ background: "hsl(var(--secondary))" }}>
                <p className="text-sm font-semibold text-foreground">
                  {AUTONOMY_LEVELS[autonomyLevel].label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {AUTONOMY_LEVELS[autonomyLevel].desc}
                </p>
              </div>
            </div>

            {/* Kill Switch */}
            <div className="card-surface p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Power size={16} className={killSwitch ? "text-destructive" : "text-muted-foreground"} />
                    Kill Switch
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Arrête immédiatement toutes les actions automatiques.
                  </p>
                </div>
                <button
                  onClick={() => handleKillSwitch(!killSwitch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    killSwitch ? "bg-destructive" : "bg-muted-foreground/30"
                  }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    killSwitch ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {killConfirm && (
                <div className="rounded-xl p-3 space-y-2 border border-destructive/30 bg-destructive/5">
                  <p className="text-xs font-semibold text-destructive">
                    Confirmer l'activation du Kill Switch ?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toutes les actions IA en cours seront suspendues jusqu'à réactivation.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleKillSwitch(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive text-white">
                      Confirmer l'arrêt
                    </button>
                    <button
                      onClick={() => setKillConfirm(false)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {killSwitch && (
                <div className="rounded-xl p-3 flex items-center gap-2 bg-destructive/10 border border-destructive/20">
                  <Power size={13} className="text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">
                    Kill Switch actif — toutes les actions IA sont suspendues.
                  </p>
                </div>
              )}
            </div>

            {/* Statut connexion */}
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                {openClawConnected
                  ? <Wifi size={16} className="text-success" />
                  : <WifiOff size={16} className="text-muted-foreground" />}
                Connexion gateway
              </h2>
              {openClawConnected ? (
                <div className="flex items-center gap-2 rounded-xl p-3"
                  style={{ background: "hsl(var(--success-light))", border: "1px solid hsl(var(--success) / 0.2)" }}>
                  <span className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                    style={{ background: "hsl(var(--success))" }} />
                  <p className="text-xs font-medium" style={{ color: "hsl(var(--success))" }}>Gateway connecté — l'IA est opérationnelle.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl p-3 bg-muted border border-border">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <p className="text-xs text-muted-foreground">Gateway non connecté — l'IA analyse uniquement.</p>
                  </div>
                  <Link to="/pilotage"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    En savoir plus <ChevronRight size={11} />
                  </Link>
                </div>
              )}
            </div>

          </TabsContent>
        </Tabs>

      </div>
    </UserLayout>
  );
}
