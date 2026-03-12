import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Euro, TrendingUp, Clock, CheckCircle2, XCircle, Download, RefreshCw,
  Play, Filter, Loader2, ArrowUpRight, Users,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
interface RevenueStats {
  totalGains: number;
  gainsPaid: number;
  gainsPending: number;
  gainsValidated: number;
  payoutsExecuted: number;
  payoutsPending: number;
  payoutsFailed: number;
  stripeRevenue: number;
  activeSubs: number;
  ltv: number;
}

interface PayoutRow {
  id: string;
  facilitator_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  gain_id: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  failure_reason: string | null;
  facilitateur_profiles: { user_id: string; secteur: string | null } | null;
  profiles: { email: string | null; prenom: string | null } | null;
}

type StatusFilter = "all" | "pending" | "paid" | "failed";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: "En attente",  color: "hsl(38 80% 30%)",           bg: "hsl(38 80% 92%)",          icon: <Clock size={12} /> },
  paid:       { label: "Payé ✓",      color: "hsl(var(--success))",       bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={12} /> },
  failed:     { label: "Échoué",      color: "hsl(var(--destructive))",   bg: "hsl(0 72% 95%)",           icon: <XCircle size={12} /> },
  processing: { label: "En cours",    color: "hsl(var(--primary))",       bg: "hsl(var(--secondary))",    icon: <Loader2 size={12} className="animate-spin" /> },
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
}

// ── Export CSV ───────────────────────────────────────────────────────────────
function exportCSV(rows: PayoutRow[]) {
  const headers = ["id", "facilitator_id", "amount", "currency", "status", "stripe_transfer_id", "created_at", "paid_at", "failure_reason"];
  const lines = [
    headers.join(";"),
    ...rows.map((r) =>
      [r.id, r.facilitator_id, r.amount, r.currency, r.status, r.stripe_transfer_id ?? "", r.created_at, r.paid_at ?? "", r.failure_reason ?? ""].join(";")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payouts-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminRevenue() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Stats ────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery<RevenueStats>({
    queryKey: ["admin-revenue-stats"],
    queryFn: async () => {
      const [gainsRes, payoutsRes, subsRes, billingRes] = await Promise.all([
        supabase.from("gains").select("montant, statut"),
        supabase.from("payouts").select("amount, status"),
        supabase.from("subscriptions").select("status"),
        supabase.from("billing_events").select("payload").eq("event_type", "checkout.session.completed"),
      ]);

      const gains = (gainsRes.data ?? []) as { montant: number; statut: string }[];
      const payouts = (payoutsRes.data ?? []) as { amount: number; status: string }[];
      const subs = (subsRes.data ?? []) as { status: string }[];

      let stripeRevenue = 0;
      (billingRes.data ?? []).forEach((evt) => {
        const p = evt.payload as Record<string, unknown>;
        if (typeof p?.amount_total === "number") stripeRevenue += p.amount_total / 100;
      });

      const activeSubs = subs.filter((s) => s.status === "active").length;
      const totalGains = gains.reduce((s, g) => s + (g.montant || 0), 0);
      const gainsPaid = gains.filter((g) => g.statut === "recu").reduce((s, g) => s + (g.montant || 0), 0);
      const gainsPending = gains.filter((g) => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0);
      const gainsValidated = gains.filter((g) => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0);
      const payoutsExecuted = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
      const payoutsPending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
      const payoutsFailed = payouts.filter((p) => p.status === "failed").length;
      const ltv = activeSubs > 0 ? Math.round(stripeRevenue / activeSubs) : 0;

      return { totalGains, gainsPaid, gainsPending, gainsValidated, payoutsExecuted, payoutsPending, payoutsFailed, stripeRevenue, activeSubs, ltv };
    },
    refetchInterval: 30_000,
  });

  // ── Payout rows ──────────────────────────────────────────────────────────
  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<PayoutRow[]>({
    queryKey: ["admin-payouts", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("payouts")
        .select(`id, facilitator_id, amount, currency, status, stripe_transfer_id, gain_id, notes, created_at, paid_at, failure_reason`)
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PayoutRow[];
    },
    refetchInterval: 15_000,
  });

  // ── Process batch ────────────────────────────────────────────────────────
  const processMutation = useMutation({
    mutationFn: async (payoutIds?: string[]) => {
      const body: Record<string, unknown> = {};
      if (payoutIds && payoutIds.length > 0) body.payout_ids = payoutIds;
      const { data, error } = await supabase.functions.invoke("process-pending-payouts", {
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Batch exécuté : ${data.paid} payout(s) payé(s) — ${fmt(data.total_paid_eur)} €`);
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      qc.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
      setSelected(new Set());
    },
    onError: (err) => {
      toast.error(`Erreur batch : ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(payouts.filter((p) => p.status === "pending").map((p) => p.id)));
  const clearSelect = () => setSelected(new Set());

  const statCards = stats
    ? [
        { label: "Revenu Stripe total", value: `${fmt(stats.stripeRevenue)} €`, sub: "checkout.session.completed", icon: <Euro size={16} />, color: "text-success" },
        { label: "Gains facilitateurs",  value: `${fmt(stats.totalGains)} €`,   sub: `dont ${fmt(stats.gainsPaid)} € déjà reçus`, icon: <TrendingUp size={16} />, color: "text-primary" },
        { label: "Payouts exécutés",     value: `${fmt(stats.payoutsExecuted)} €`, sub: "Transférés via Stripe Connect", icon: <CheckCircle2 size={16} />, color: "text-success" },
        { label: "Payouts en attente",   value: `${fmt(stats.payoutsPending)} €`,  sub: `${stats.payoutsFailed} échoué(s)`, icon: <Clock size={16} />, color: "text-accent" },
        { label: "Abonnements actifs",   value: stats.activeSubs.toString(),       sub: `LTV moy : ${fmt(stats.ltv)} €`, icon: <Users size={16} />, color: "text-primary" },
      ]
    : [];

  return (
    <AdminLayout title="Revenue Ops" subtitle="Cashflow temps réel · payouts Stripe Connect · LTV">
      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse"><div className="h-8 w-20 bg-muted rounded mb-2" /><div className="h-4 w-24 bg-muted rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {statCards.map(({ label, value, sub, icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-muted mb-3 ${color}`}>{icon}</div>
              <p className="font-display text-2xl font-bold text-foreground mb-0.5">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Status filter */}
        {(["all", "pending", "paid", "failed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "paid" ? "Payés" : "Échoués"}
          </button>
        ))}

        <div className="ml-auto flex gap-2 flex-wrap">
          {/* Refresh */}
          <button
            onClick={() => { qc.invalidateQueries({ queryKey: ["admin-payouts"] }); qc.invalidateQueries({ queryKey: ["admin-revenue-stats"] }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={12} /> Actualiser
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportCSV(payouts)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={12} /> Export CSV
          </button>

          {/* Select all pending */}
          <button
            onClick={selected.size > 0 ? clearSelect : selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter size={12} /> {selected.size > 0 ? `Désélectionner (${selected.size})` : "Sélectionner pending"}
          </button>

          {/* Process batch */}
          <button
            onClick={() => processMutation.mutate(selected.size > 0 ? Array.from(selected) : undefined)}
            disabled={processMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {processMutation.isPending
              ? <><Loader2 size={12} className="animate-spin" /> Traitement…</>
              : <><Play size={12} /> {selected.size > 0 ? `Payer ${selected.size} sélectionné(s)` : "Lancer batch complet"}</>
            }
          </button>
        </div>
      </div>

      {/* ── Payouts table ──────────────────────────────────────────────────── */}
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">
            Payouts facilitateurs
            {payouts.length > 0 && <span className="ml-2 text-muted-foreground font-normal">({payouts.length})</span>}
          </h2>
          {selected.size > 0 && (
            <span className="text-xs text-primary font-semibold">{selected.size} sélectionné(s)</span>
          )}
        </div>

        {payoutsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-10 text-center">
            <Euro size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Aucun payout{statusFilter !== "all" ? ` avec statut "${statusFilter}"` : ""}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">
                    <input
                      type="checkbox"
                      checked={selected.size > 0 && payouts.filter((p) => p.status === "pending").every((p) => selected.has(p.id))}
                      onChange={(e) => e.target.checked ? selectAll() : clearSelect()}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Facilitateur</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Montant</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Statut</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Stripe Transfer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Payé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                  const isPending = p.status === "pending";
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-muted/20 transition-colors ${selected.has(p.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {isPending && (
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                          {p.facilitator_id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-bold text-foreground">
                          {fmt(Number(p.amount))} {(p.currency || "EUR").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                        {p.failure_reason && (
                          <p className="text-xs text-destructive mt-0.5 truncate max-w-[200px]" title={p.failure_reason}>
                            {p.failure_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.stripe_transfer_id ? (
                          <a
                            href={`https://dashboard.stripe.com/transfers/${p.stripe_transfer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary font-mono hover:underline"
                          >
                            {p.stripe_transfer_id.slice(0, 16)}… <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.paid_at ? fmtDate(p.paid_at) : "—"}
      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Stripe Connect setup hint ──────────────────────────────────────── */}
      <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Stripe Connect requis.</strong>{" "}
          Pour exécuter un payout, le facilitateur doit avoir un compte Stripe Connect configuré
          (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">stripe_connect_account_id</code> dans son profil).
          Les payouts sans compte Stripe Connect sont marqués "skipped" et restent en attente.
          Configurez les comptes via le dashboard Stripe Connect → Accounts.
        </p>
      </div>
    </AdminLayout>
  );
}
