import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/layout/UserLayout";
import PageTitle from "@/components/ui/PageTitle";
import ListPagination from "@/components/ui/ListPagination";
import {
  CheckCircle2, Clock, ArrowDownCircle, XCircle, Euro, Info, TrendingUp,
  ChevronRight, Loader2, Link2, Share2, Flame, Target, Banknote, AlertCircle,
} from "lucide-react";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type GainStatus = "en_attente" | "valide" | "recu" | "annule";
type GainTab = "tous" | GainStatus;

interface Gain {
  id: string;
  introduction_id: string | null;
  mission_id: string | null;
  share_link_id: string | null;
  shared_offer_id: string | null;
  source: string | null;
  montant: number;
  statut: GainStatus;
  created_at: string;
  updated_at: string;
}

interface Payout {
  id: string;
  facilitator_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  gain_id: string | null;
  created_at: string;
  paid_at: string | null;
  withdrawal_requested_at: string | null;
  failure_reason: string | null;
}

const WITHDRAW_THRESHOLD = 100; // € minimum

const tabConfig: { id: GainTab; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Validés" },
  { id: "recu", label: "Reçus" },
  { id: "annule", label: "Annulés" },
];

const statusConfig: Record<GainStatus, { icon: JSX.Element; color: string; bg: string; label: string; explication_courte: string }> = {
  en_attente: { icon: <Clock size={13} />, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "En attente", explication_courte: "L'entreprise n'a pas encore validé votre contact." },
  valide:     { icon: <CheckCircle2 size={13} />, color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validé ✓", explication_courte: "L'entreprise a confirmé votre contact. Le versement arrive bientôt." },
  recu:       { icon: <ArrowDownCircle size={13} />, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "Reçu", explication_courte: "Votre gain a été versé sur votre compte." },
  annule:     { icon: <XCircle size={13} />, color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Annulé", explication_courte: "Ce gain n'a pas abouti." },
};

const SOURCE_LABELS: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  mission_directe:    { label: "Mission directe",    icon: <Target size={10} />, color: "hsl(var(--primary))" },
  diffusion_passive:  { label: "Diffusion passive",  icon: <Flame size={10} />,  color: "hsl(24 100% 52%)" },
  lien_traque:        { label: "Lien traqué",        icon: <Link2 size={10} />,  color: "hsl(38 80% 40%)" },
  apporteur_actif:    { label: "Apport actif",       icon: <Share2 size={10} />, color: "hsl(218 72% 55%)" },
  apporteur_passif:   { label: "Apport passif",      icon: <Flame size={10} />,  color: "hsl(24 100% 52%)" },
  deal_radar:         { label: "Deal Radar",         icon: <Target size={10} />, color: "hsl(152 62% 35%)" },
  demande_entreprise: { label: "Demande entreprise", icon: <Share2 size={10} />, color: "hsl(218 72% 55%)" },
};

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  const cfg = SOURCE_LABELS[source] || { label: source, icon: <Share2 size={10} />, color: "hsl(var(--muted-foreground))" };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}18`, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const PAGE_SIZE = 20;
const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Gains() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<GainTab>("tous");
  const [page, setPage] = useState(0);

  const handleTab = (tab: GainTab) => { setActiveTab(tab); setPage(0); };

  // ── Summary totals ─────────────────────────────────────────────────────────
  const { data: summary } = useQuery({
    queryKey: ["gains-summary", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("gains")
        .select("statut, montant, source")
        .eq("facilitateur_id", user!.id);
      const all = (data || []) as Gain[];
      return {
        totalValide:  all.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0),
        totalAttendu: all.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0),
        totalRecu:    all.filter(g => g.statut === "recu").reduce((s, g) => s + (g.montant || 0), 0),
        passiveCount: all.filter(g => ["diffusion_passive", "lien_traque", "apporteur_passif"].includes(g.source ?? "")).length,
      };
    },
  });

  // ── Paginated gains ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["gains", user?.id, activeTab, page],
    enabled: !!user,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let q = db
        .from("gains")
        .select("id, introduction_id, mission_id, share_link_id, shared_offer_id, source, montant, statut, created_at, updated_at", { count: "exact" })
        .eq("facilitateur_id", user!.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (activeTab !== "tous") q = q.eq("statut", activeTab);
      const { data, count, error } = await q;
      if (error) throw error;
      return { items: (data || []) as Gain[], total: count ?? 0 };
    },
  });

  // ── Payouts history ────────────────────────────────────────────────────────
  const { data: payouts = [] } = useQuery<Payout[]>({
    queryKey: ["my-payouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("id, facilitator_id, amount, currency, status, stripe_transfer_id, gain_id, created_at, paid_at, withdrawal_requested_at, failure_reason")
        .eq("facilitator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Payout[];
    },
    refetchInterval: 15_000,
  });

  // ── Withdraw mutation ──────────────────────────────────────────────────────
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      // Create a pending payout for all validated (valide) gains not yet in a payout
      const { data: validatedGains } = await supabase
        .from("gains")
        .select("id, montant")
        .eq("facilitateur_id", user!.id)
        .eq("statut", "valide");

      if (!validatedGains || validatedGains.length === 0) {
        throw new Error("Aucun gain validé disponible pour le retrait");
      }

      // Check already-payouted gain ids
      const { data: existingPayouts } = await supabase
        .from("payouts")
        .select("gain_id")
        .eq("facilitator_id", user!.id)
        .in("status", ["pending", "processing", "paid"]);

      const alreadyPayouted = new Set((existingPayouts ?? []).map((p) => p.gain_id).filter(Boolean));
      const eligible = validatedGains.filter((g) => !alreadyPayouted.has(g.id));

      if (eligible.length === 0) {
        throw new Error("Tous vos gains validés ont déjà un payout en cours ou exécuté");
      }

      const totalAmount = eligible.reduce((s, g) => s + (g.montant || 0), 0);
      if (totalAmount < WITHDRAW_THRESHOLD) {
        throw new Error(`Montant minimum pour retrait : ${WITHDRAW_THRESHOLD} €. Vous avez ${fmt(totalAmount)} € éligible(s).`);
      }

      // Insert one payout row per eligible gain
      const inserts = eligible.map((g) => ({
        facilitator_id: user!.id,
        amount: g.montant ?? 0,
        currency: "EUR",
        status: "pending",
        gain_id: g.id,
        withdrawal_requested_at: new Date().toISOString(),
        notes: `Retrait demandé manuellement par le facilitateur`,
      }));

      const { error } = await supabase.from("payouts").insert(inserts);
      if (error) throw error;
      return { totalAmount, count: inserts.length };
    },
    onSuccess: ({ totalAmount, count }) => {
      toast.success(`Retrait demandé : ${fmt(totalAmount)} € (${count} gain${count > 1 ? "s" : ""}) — traitement sous 24-48h`);
      qc.invalidateQueries({ queryKey: ["my-payouts", user?.id] });
      qc.invalidateQueries({ queryKey: ["gains-summary", user?.id] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la demande de retrait");
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const canWithdraw = (summary?.totalValide ?? 0) >= WITHDRAW_THRESHOLD;
  const hasPendingPayout = payouts.some((p) => p.status === "pending" || p.status === "processing");

  const PAYOUT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending:    { label: "En cours de traitement", color: "hsl(38 80% 30%)", bg: "hsl(38 80% 92%)" },
    processing: { label: "En cours",               color: "hsl(var(--primary))", bg: "hsl(var(--secondary))" },
    paid:       { label: "Payé ✓",                 color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
    failed:     { label: "Échoué",                 color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)" },
  };

  return (
    <UserLayout>
      <PageTitle title="Mes gains" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes gains</h1>
          <p className="text-sm text-muted-foreground">Suivi de vos gains et versements via Stripe Connect.</p>
        </div>

        {/* ── Résumé ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Validés",    value: `${fmt(summary?.totalValide ?? 0)} €`,  sub: "Confirmés, versement en cours", color: "hsl(var(--success))",   bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={17} /> },
            { label: "En attente", value: `${fmt(summary?.totalAttendu ?? 0)} €`, sub: "En cours de validation",        color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))",  icon: <Clock size={17} /> },
            { label: "Reçus",      value: `${fmt(summary?.totalRecu ?? 0)} €`,    sub: "Déjà versés",                   color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))",     icon: <ArrowDownCircle size={17} /> },
          ].map(({ label, value, sub, color, bg, icon }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col gap-1" style={{ background: bg }}>
              <div style={{ color }}>{icon}</div>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
              <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Passive attribution banner ───────────────────────────────────── */}
        {(summary?.passiveCount ?? 0) > 0 && (
          <div className="mb-5 p-4 rounded-xl flex items-center gap-3" style={{
            background: "hsl(24 100% 52% / 0.08)",
            border: "1px solid hsl(24 100% 52% / 0.25)"
          }}>
            <Flame size={16} style={{ color: "hsl(24 100% 52%)" }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {summary!.passiveCount} gain{summary!.passiveCount > 1 ? "s issus" : " issu"} de votre diffusion passive.
              </p>
              <p className="text-xs text-muted-foreground">Votre apport d'affaires passif génère des résultats réels.</p>
            </div>
          </div>
        )}

        {/* ── Retrait (Withdraw) ────────────────────────────────────────────── */}
        <div className="p-5 rounded-xl border border-border bg-card mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Banknote size={16} className="text-primary shrink-0" />
                <h3 className="font-semibold text-sm text-foreground">Retirer mes gains validés</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Minimum {WITHDRAW_THRESHOLD} € validés requis. Versement sur votre compte Stripe Connect sous 24-48h.
              </p>
              {!canWithdraw && (summary?.totalValide ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle size={12} />
                  Il vous manque {fmt(WITHDRAW_THRESHOLD - (summary?.totalValide ?? 0))} € pour atteindre le seuil.
                </div>
              )}
              {hasPendingPayout && (
                <div className="flex items-center gap-1.5 text-xs text-accent">
                  <Clock size={12} /> Un retrait est déjà en cours de traitement.
                </div>
              )}
            </div>
            <button
              onClick={() => withdrawMutation.mutate()}
              disabled={!canWithdraw || hasPendingPayout || withdrawMutation.isPending}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {withdrawMutation.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Traitement…</>
                : <><Banknote size={14} /> Retirer {canWithdraw ? `${fmt(summary!.totalValide)} €` : ""}</>
              }
            </button>
          </div>
        </div>

        {/* ── Historique payouts ────────────────────────────────────────────── */}
        {payouts.length > 0 && (
          <div className="card-surface p-5 mb-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
              <Banknote size={15} className="text-primary" />
              Historique des versements
            </h2>
            <div className="space-y-3">
              {payouts.map((p) => {
                const cfg = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                      {p.stripe_transfer_id && (
                        <p className="text-xs font-mono text-muted-foreground/70 truncate">
                          Transfer: {p.stripe_transfer_id.slice(0, 20)}…
                        </p>
                      )}
                      {p.failure_reason && (
                        <p className="text-xs text-destructive truncate max-w-[200px]">{p.failure_reason}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="font-display font-bold text-foreground">
                        {fmt(Number(p.amount))} {(p.currency || "EUR").toUpperCase()}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {p.status === "paid" && <CheckCircle2 size={11} />}
                        {p.status === "pending" && <Clock size={11} />}
                        {p.status === "failed" && <XCircle size={11} />}
                        {cfg.label}
                      </span>
                      {p.paid_at && (
                        <p className="text-xs text-muted-foreground">Payé le {formatDate(p.paid_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Info paiement ─────────────────────────────────────────────────── */}
        <div className="p-4 rounded-xl border border-border bg-muted flex gap-3 mb-6">
          <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Comment fonctionne le versement ?</strong>{" "}
            Une fois votre contact validé par l'entreprise, votre gain est confirmé. Cliquez "Retirer" dès 100 € de gains validés.
            Le versement est exécuté sur votre compte Stripe Connect dans les 24-48h.
          </p>
        </div>

        {/* ── Onglets ───────────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Liste gains ────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Euro size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucun gain ici pour l'instant</p>
            <p className="text-sm text-muted-foreground mb-4">Faites votre première introduction pour commencer à gagner.</p>
            <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">Voir les missions disponibles</Link>
          </div>
        ) : (
          <>
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Détail de mes gains
              </h2>
              <div className="space-y-4">
                {items.map((g) => {
                  const cfg = statusConfig[g.statut];
                  // Find linked payout
                  const linkedPayout = payouts.find((p) => p.gain_id === g.id);
                  return (
                    <div key={g.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                            {formatDate(g.created_at).charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{formatDate(g.created_at)}</p>
                            <SourceBadge source={g.source} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-base font-bold text-foreground">{fmt(g.montant)} €</p>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed ml-11">{cfg.explication_courte}</p>

                      {/* Payout status if exists */}
                      {linkedPayout && (
                        <div className="mt-2 ml-11 p-2 rounded-lg border border-border bg-muted/30">
                          {linkedPayout.status === "paid" ? (
                            <p className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                              <CheckCircle2 size={11} className="inline mr-1" />
                              Gain payé {fmt(Number(linkedPayout.amount))} € le {linkedPayout.paid_at ? formatDate(linkedPayout.paid_at) : "—"}
                              {linkedPayout.stripe_transfer_id && (
                                <span className="font-mono text-muted-foreground ml-1">· {linkedPayout.stripe_transfer_id.slice(0, 12)}…</span>
                              )}
                            </p>
                          ) : linkedPayout.status === "failed" ? (
                            <p className="text-xs text-destructive">
                              <XCircle size={11} className="inline mr-1" />
                              Payout échoué : {linkedPayout.failure_reason || "Erreur Stripe"}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              <Clock size={11} className="inline mr-1" />
                              Retrait en cours de traitement…
                            </p>
                          )}
                        </div>
                      )}

                      {(g.source === "diffusion_passive" || g.source === "lien_traque") && (
                        <div className="mt-1.5 ml-11 p-2 rounded-lg" style={{ background: "hsl(24 100% 52% / 0.06)" }}>
                          <p className="text-xs" style={{ color: "hsl(24 100% 45%)" }}>
                            Cette diffusion a créé une opportunité. Votre apport d'affaires passif rapporte vraiment.
                          </p>
                        </div>
                      )}
                      {g.introduction_id && (
                        <div className="mt-2 ml-11">
                          <Link to={`/introductions/${g.introduction_id}`}
                            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                            Voir l'introduction <ChevronRight size={11} />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </div>
    </UserLayout>
  );
}
