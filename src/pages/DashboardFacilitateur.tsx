import { useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Trophy, Clock, Send, Star, ArrowRight, Sparkles,
  Bell, MapPin, Building2, CheckCircle2, Circle, AlertCircle,
  Plus, ShieldCheck, Info, ChevronDown, ChevronUp, ChevronRight,
  Loader2,
} from "lucide-react";
import GlossaryTooltip from "@/components/ui/GlossaryTooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardFacilitateurData } from "@/hooks/useDashboardFacilitateurData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Mission {
  id: string;
  titre: string;
  secteur: string | null;
  zone: string | null;
  recompense: string | null;
  match_score?: number | null;
}

interface Request {
  id: string;
  request_context: string | null;
  openclaw_note: string | null;
}

const STATUT_MAP: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  en_attente: { label: "En attente", color: "hsl(38 95% 50%)",  Icon: Clock },
  validee:    { label: "Validée",    color: "hsl(152 62% 38%)", Icon: CheckCircle2 },
  refusee:    { label: "Refusée",    color: "hsl(0 72% 51%)",   Icon: AlertCircle },
  en_cours:   { label: "En cours",   color: "hsl(218 72% 45%)", Icon: Circle },
};
function StatutPill({ statut }: { statut: string | null }) {
  const s = STATUT_MAP[statut ?? ""] ?? { label: statut ?? "—", color: "hsl(218 15% 50%)", Icon: Circle };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${s.color}22`, color: s.color }}>
      <s.Icon size={10} />{s.label}
    </span>
  );
}

function StatCard({ label, value, to, loading, accent }: {
  label: React.ReactNode; value: string | number; to: string; loading: boolean; accent?: boolean;
}) {
  return (
    <Link to={to}
      className="flex-1 rounded-2xl p-4 border-2 transition-all hover:shadow-md"
      style={{
        background: accent ? "hsl(var(--accent) / 0.06)" : "hsl(var(--card))",
        borderColor: accent ? "hsl(var(--accent) / 0.5)" : "hsl(var(--border))",
      }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      <p className="font-display font-bold text-2xl text-foreground leading-none">
        {loading ? <span className="inline-block w-10 h-6 rounded bg-muted animate-pulse" /> : value}
      </p>
    </Link>
  );
}

export default function DashboardFacilitateur() {
  const { user, profile } = useAuth();
  const prenom = profile?.prenom ?? "vous";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ── React Query ─────────────────────────────────────────────────────────────
  const { data, isLoading: loading } = useDashboardFacilitateurData(user?.id);

  const gains        = data?.gains        ?? [];
  const intros       = data?.intros       ?? [];
  const introsCount  = data?.introsCount  ?? 0;
  const missions     = data?.missions     ?? [];
  const missionsCount = data?.missionsCount ?? 0;
  const trustScore   = data?.trustScore   ?? null;
  const requests     = data?.requests     ?? [];

  const acceptRequest = async (reqId: string) => {
    setAcceptingId(reqId);
    await supabase.from("facilitator_requests").update({ status: "acceptee" }).eq("id", reqId);
    setAcceptingId(null);
    void queryClient.invalidateQueries({ queryKey: ["dashboard-facilitateur", user?.id] });
  };

  const declineRequest = async (reqId: string) => {
    await supabase.from("facilitator_requests").update({ status: "refusee" }).eq("id", reqId);
    void queryClient.invalidateQueries({ queryKey: ["dashboard-facilitateur", user?.id] });
  };

  const totalValide  = gains.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant ?? 0), 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant ?? 0), 0);
  const trustPct     = trustScore ?? 0;
  const trustUnknown = trustScore === null;
  const trustColor   = trustUnknown
    ? "hsl(var(--muted-foreground))"
    : trustPct >= 80 ? "hsl(152 62% 38%)"
    : trustPct >= 50 ? "hsl(218 72% 45%)"
    : "hsl(38 95% 50%)";

  return (
    <TooltipProvider>
      <UserLayout role="facilitateur" jarvisContext="dashboard-facilitateur">
        <div className="max-w-2xl mx-auto space-y-5 pb-8">

          {/* ═══ HERO ══════════════════════════════════════════ */}
          <div className="rounded-2xl p-5 border-2"
            style={{ borderColor: "hsl(var(--accent) / 0.6)", background: "hsl(24 80% 52% / 0.06)" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-foreground text-xl leading-tight mb-1">
                  Bonjour {prenom} 👋
                </h1>
                <p className="text-sm text-foreground font-medium">
                  {loading
                    ? <span className="inline-block w-40 h-4 rounded bg-muted animate-pulse" />
                    : missionsCount > 0
                    ? `${missionsCount} mission${missionsCount > 1 ? "s" : ""} vous attendent`
                    : "Bienvenue sur votre espace de revenus."}
                </p>
              </div>
              {requests.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: "hsl(24 100% 52% / 0.15)", color: "hsl(24 100% 60%)" }}>
                  <Bell size={11} /> {requests.length} demande{requests.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* ═══ 3 STAT CARDS ══════════════════════════════════ */}
          <div className="flex gap-3">
            <StatCard label={<GlossaryTooltip term="Mission">Missions dispo</GlossaryTooltip>} value={missionsCount} to="/missions" loading={loading} />
            <StatCard label={<GlossaryTooltip term="Introduction">Intros envoyées</GlossaryTooltip>} value={introsCount} to="/introductions" loading={loading} />
            <StatCard
              label="Gains validés"
              value={`${totalValide.toLocaleString("fr-FR")} €`}
              to="/gains"
              loading={loading}
              accent={totalValide > 0}
            />
          </div>

          {/* ═══ PREMIÈRE ACTION SUGGÉRÉE ══════════════════════ */}
          {!loading && introsCount === 0 && missionsCount > 0 && (
            <div className="rounded-2xl p-4 border-2 flex items-center gap-3"
              style={{ borderColor: "hsl(var(--primary) / 0.4)", background: "hsl(var(--secondary))" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Première action suggérée</p>
                <p className="text-xs text-muted-foreground">
                  {missionsCount} mission{missionsCount > 1 ? "s" : ""} ouverte{missionsCount > 1 ? "s" : ""} — faites votre première introduction pour gagner
                </p>
              </div>
              <Link to="/missions" className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: "hsl(var(--primary))", color: "white" }}>
                Voir <ArrowRight size={11} />
              </Link>
            </div>
          )}

          {/* ═══ RACCOURCIS ════════════════════════════════════ */}
          <div className="flex flex-wrap gap-2">
            <Link to="/missions"
              className="btn-cta flex items-center gap-1.5 px-5 py-2.5 text-sm">
              <Sparkles size={14} /> Explorer les missions
            </Link>
            <Link to="/introductions"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors">
              <Send size={14} /> Mes introductions
            </Link>
          </div>

          {/* ═══ DÉTAILS — ACCORDÉON ═══════════════════════════ */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setDetailsOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <span className="flex items-center gap-2">
                <Trophy size={15} className="text-primary" />
                Détails de mes revenus
              </span>
              {detailsOpen
                ? <ChevronUp size={15} className="text-muted-foreground" />
                : <ChevronDown size={15} className="text-muted-foreground" />}
            </button>

            {detailsOpen && (
              <div className="border-t border-border divide-y divide-border">

                {/* Demandes entreprises */}
                {requests.length > 0 && (
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell size={13} className="text-primary" />
                      <p className="text-sm font-semibold text-foreground">Demandes de mise en relation</p>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "hsl(var(--primary))" }}>
                        {requests.length}
                      </span>
                    </div>
                    {requests.map((req: Request) => (
                      <div key={req.id} className="bg-background rounded-xl p-4 space-y-3 border border-border mb-2">
                        <p className="text-sm font-medium text-foreground">Une entreprise vous sollicite</p>
                        {req.openclaw_note && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{ background: "hsl(218 65% 10%)" }}>
                            <Sparkles size={11} className="text-white/60 shrink-0 mt-0.5" />
                            <p className="text-xs text-white/60">{req.openclaw_note}</p>
                          </div>
                        )}
                        {req.request_context && (
                          <p className="text-xs text-muted-foreground italic">"{req.request_context}"</p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => acceptRequest(req.id)} disabled={acceptingId === req.id}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                            style={{ background: "var(--gradient-primary)" }}>
                            {acceptingId === req.id ? "…" : "Accepter"}
                          </button>
                          <button onClick={() => declineRequest(req.id)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                            Décliner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gains détaillés */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Trophy size={14} className="text-primary" /> Revenus
                    </h2>
                    <Link to="/gains" className="text-xs text-primary font-medium hover:underline">Voir tout</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/gains" className="rounded-xl p-4 hover:opacity-90 transition-opacity"
                      style={{ background: "hsl(152 62% 10% / 0.6)", border: "1px solid hsl(152 62% 25% / 0.4)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Trophy size={12} style={{ color: "hsl(152 62% 50%)" }} />
                        <p className="text-xs font-medium" style={{ color: "hsl(152 62% 50%)" }}>Gains validés</p>
                      </div>
                      <p className="font-bold text-xl text-white leading-none">{totalValide.toLocaleString("fr-FR")} €</p>
                    </Link>
                    <Link to="/gains" className="rounded-xl p-4 hover:opacity-90 transition-opacity"
                      style={{ background: "hsl(38 95% 8% / 0.6)", border: "1px solid hsl(38 95% 25% / 0.4)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock size={12} style={{ color: "hsl(38 95% 60%)" }} />
                        <p className="text-xs font-medium" style={{ color: "hsl(38 95% 60%)" }}>En attente</p>
                      </div>
                      <p className="font-bold text-xl text-white leading-none">{totalAttendu.toLocaleString("fr-FR")} €</p>
                    </Link>
                  </div>
                </div>

                {/* Missions recommandées */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" /> Missions recommandées
                    </h2>
                    <Link to="/missions" className="text-xs text-primary font-medium hover:underline">Toutes</Link>
                  </div>
                  {loading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                  ) : missions.length === 0 ? (
                    <div className="text-center py-6">
                      <Sparkles size={20} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune mission disponible pour l'instant.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {missions.map((m: Mission, idx: number) => (
                        <div key={m.id}
                          className="rounded-xl p-3.5 border border-border hover:border-primary/40 transition-colors"
                          style={{ background: "hsl(var(--muted))" }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {m.match_score != null ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: "hsl(24 100% 52% / 0.15)", color: "hsl(24 100% 58%)" }}>
                                    <Sparkles size={9} /> Match IA {m.match_score}%
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: "hsl(218 72% 18% / 0.12)", color: "hsl(218 72% 50%)" }}>
                                    <Sparkles size={9} /> IA #{idx + 1}
                                  </span>
                                )}
                                {m.recompense && (
                                  <span className="text-xs font-bold" style={{ color: "hsl(152 62% 42%)" }}>
                                    {m.recompense}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-foreground truncate">{m.titre}</p>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                {m.secteur && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building2 size={10} /> {m.secteur}
                                  </span>
                                )}
                                {m.zone && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin size={10} /> {m.zone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Link to={`/missions/${m.id}`}
                              className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                              style={{ background: "hsl(var(--primary))", color: "white" }}>
                              Voir <ArrowRight size={11} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Introductions en cours */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Send size={14} className="text-primary" /> Mes introductions
                    </h2>
                    <div className="flex items-center gap-3">
                      <Link to="/introductions" className="text-xs text-primary font-medium hover:underline">Toutes</Link>
                      <Link to="/introductions/new"
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background: "hsl(var(--accent))", color: "white" }}>
                        <Plus size={11} /> Nouvelle
                      </Link>
                    </div>
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {[0, 1].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                    </div>
                  ) : intros.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-sm text-muted-foreground mb-3">Aucune introduction envoyée pour l'instant.</p>
                      <Link to="/missions"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
                        style={{ background: "var(--gradient-primary)", color: "white" }}>
                        Voir les missions disponibles <ArrowRight size={12} />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {intros.map(intro => (
                        <div key={intro.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{intro.contact_nom}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(intro.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                          <StatutPill statut={intro.statut} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trust score */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: "hsl(218 72% 18% / 0.08)" }}>
                        <ShieldCheck size={13} className="text-primary" />
                      </div>
                      <h2 className="font-semibold text-foreground text-sm">
                        <GlossaryTooltip term="Score de confiance">Score de confiance</GlossaryTooltip>
                      </h2>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={13} className="text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Ce score influence votre visibilité auprès des entreprises.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Link to="/profil/facilitateur" className="text-xs text-primary font-medium hover:underline">
                      Mon profil
                    </Link>
                  </div>
                  {loading ? (
                    <div className="h-10 bg-muted rounded-xl animate-pulse" />
                  ) : (
                    <>
                      <div className="flex items-end justify-between mb-2">
                        <span className="font-bold text-3xl text-foreground">
                          {trustScore !== null ? trustScore : "—"}
                          {trustScore !== null && (
                            <span className="text-base font-normal text-muted-foreground">/100</span>
                          )}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: `${trustColor}18`, color: trustColor }}>
                          {trustUnknown ? "Score en cours de calcul"
                            : trustPct >= 80 ? "Expert"
                            : trustPct >= 60 ? "Confirmé"
                            : trustPct >= 40 ? "En cours"
                            : "Débutant"}
                        </span>
                      </div>
                      <div className="relative h-2.5 rounded-full overflow-hidden"
                        style={{ background: "hsl(var(--muted))" }}>
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{ width: `${trustPct}%`, background: trustColor }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {trustUnknown
                          ? "Score en cours de calcul — effectuez votre première introduction pour l'activer."
                          : trustPct < 50
                          ? "Envoyez des introductions qualifiées pour augmenter votre score."
                          : "Continuez à envoyer des introductions validées pour progresser."}
                      </p>
                    </>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </UserLayout>
    </TooltipProvider>
  );
}
