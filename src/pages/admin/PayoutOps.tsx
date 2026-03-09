/**
 * Admin Payout Ops — PROOF:PAYOUT_OPS_V1:admin_reads_payout_tables
 * Reads from: payouts, payout_batches, payout_audit_log
 * Writes via: update_payout_status RPC, create_payout_batch RPC
 * Zero mock data.
 */
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw,
  Package, Plus, FileText, ChevronDown, ChevronUp
} from "lucide-react";

type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";
type BatchStatus = "draft" | "processing" | "paid" | "failed";

interface Payout {
  id: string;
  facilitator_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: string | null;
  reference: string | null;
  batch_id: string | null;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface PayoutBatch {
  id: string;
  label: string | null;
  status: BatchStatus;
  total_amount: number;
  payout_count: number;
  created_at: string;
  processed_at: string | null;
}

interface AuditEntry {
  id: string;
  payout_id: string | null;
  batch_id: string | null;
  actor_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
}

const STATUS_CFG: Record<PayoutStatus | BatchStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  pending:    { label: "En attente",  cls: "badge-warning",  icon: Clock },
  processing: { label: "En cours",   cls: "badge-warning",  icon: Clock },
  paid:       { label: "Payé",       cls: "badge-success",  icon: CheckCircle2 },
  failed:     { label: "Échoué",     cls: "bg-destructive/10 text-destructive inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", icon: XCircle },
  cancelled:  { label: "Annulé",    cls: "badge-muted",    icon: XCircle },
  draft:      { label: "Brouillon", cls: "badge-muted",    icon: FileText },
};

const fmtDate = (d: string | null) => d ? format(new Date(d), "d MMM yyyy HH:mm", { locale: fr }) : "—";
const fmtAmt  = (n: number, cur = "EUR") => `${n.toLocaleString("fr")} ${cur}`;

export default function AdminPayoutOps() {
  const { user } = useAuth();
  const [payouts, setPayouts]         = useState<Payout[]>([]);
  const [batches, setBatches]         = useState<PayoutBatch[]>([]);
  const [audit, setAudit]             = useState<AuditEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [batchLabel, setBatchLabel]   = useState("");
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showAudit, setShowAudit]     = useState(false);
  const [activeTab, setActiveTab]     = useState<"payouts" | "batches">("payouts");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: p, error: pErr },
        { data: b, error: bErr },
        { data: a, error: aErr },
      ] = await Promise.all([
        supabase.from("payouts" as "profiles").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("payout_batches" as "profiles").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("payout_audit_log" as "profiles").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      if (pErr) throw pErr;
      if (bErr) throw bErr;
      if (aErr) throw aErr;
      setPayouts((p ?? []) as unknown as Payout[]);
      setBatches((b ?? []) as unknown as PayoutBatch[]);
      setAudit((a ?? []) as unknown as AuditEntry[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Update payout status via RPC (writes audit_log) ──────────────────────
  const updateStatus = async (payoutId: string, newStatus: PayoutStatus, note?: string) => {
    if (!user) return;
    setActionLoading(payoutId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("update_payout_status", {
        p_payout_id: payoutId,
        p_new_status: newStatus,
        p_actor_id: user.id,
        p_note: note ?? null,
      });
      if (error) throw error;
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Create batch from selected pending payouts ─────────────────────────────
  const createBatch = async () => {
    if (!user || selected.size === 0) return;
    setActionLoading("batch");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("create_payout_batch", {
        p_actor_id: user.id,
        p_label: batchLabel || `Batch ${new Date().toLocaleDateString("fr")}`,
        p_payout_ids: Array.from(selected),
      });
      if (error) throw error;
      setSelected(new Set());
      setBatchLabel("");
      setShowBatchForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de création du batch");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const pendingPayouts  = payouts.filter(p => p.status === "pending");
  const totalPending    = pendingPayouts.reduce((s, p) => s + p.amount, 0);
  const totalPaid       = payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  // ── Generate payouts from validated gains (idempotent RPC) ────────────────
  const [generating, setGenerating] = useState(false);
  const generateFromGains = async () => {
    setGenerating(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcErr } = await (supabase.rpc as any)("generate_payouts_from_validated_gains");
      if (rpcErr) throw rpcErr;
      const created = data as number;
      await load();
      if (created === 0) {
        setError("0 nouveau payout créé — tous les gains validés ont déjà un payout existant.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AdminLayout title="Payout Ops" subtitle="Gestion des paiements facilitateurs — données réelles">

      {/* PROOF:PAYOUT_PIPELINE_V1 — generate_payouts_from_validated_gains */}
      <div className="mb-5 p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-sm text-foreground">Pipeline payout → gains validés</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scanne les gains <code>valide/recu</code> sans payout existant et crée les entrées manquantes.
            Idempotent — appel multiple sans risque.
          </p>
        </div>
        <button
          onClick={generateFromGains}
          disabled={generating}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
          {generating ? "Génération…" : "Générer depuis gains validés"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-warning">{fmtAmt(totalPending)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pendingPayouts.length} payouts en attente</p>
        </div>
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-success">{fmtAmt(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total payé (historique)</p>
        </div>
        <div className="stat-card">
          <p className="font-display text-2xl font-bold text-foreground">{batches.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Batches créés</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Fermer</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {(["payouts", "batches"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "payouts" ? `Payouts (${payouts.length})` : `Batches (${batches.length})`}
          </button>
        ))}
      </div>

      {/* Batch creation form */}
      {activeTab === "payouts" && selected.size > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">
              {selected.size} payout(s) sélectionné(s) ·{" "}
              <span className="text-primary font-bold">
                {fmtAmt(payouts.filter(p => selected.has(p.id)).reduce((s, p) => s + p.amount, 0))}
              </span>
            </p>
            <button
              onClick={() => setShowBatchForm(!showBatchForm)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
            >
              <Package size={14} />
              Créer un batch
              {showBatchForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          {showBatchForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Label du batch (optionnel)"
                value={batchLabel}
                onChange={e => setBatchLabel(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={createBatch}
                disabled={actionLoading === "batch"}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={14} />
                {actionLoading === "batch" ? "Création…" : "Confirmer"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payouts table */}
      {activeTab === "payouts" && (
        <div className="card-surface overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">
              Payouts individuels
            </h2>
            <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chargement…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Facilitateur</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Montant</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Méthode</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Créé</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => {
                    const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                    const Icon = cfg.icon;
                    const isLoading = actionLoading === p.id;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          {p.status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => toggleSelect(p.id)}
                              className="rounded border-border"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-muted-foreground">{p.facilitator_id.slice(0, 8)}…</p>
                          {p.reference && <p className="text-xs text-muted-foreground">Réf: {p.reference}</p>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmtAmt(p.amount, p.currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`${cfg.cls} inline-flex items-center gap-1`}>
                            <Icon size={11} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.method ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.status === "pending" && (
                              <button
                                onClick={() => updateStatus(p.id, "paid", "Marqué payé manuellement")}
                                disabled={isLoading}
                                className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                              >
                                {isLoading ? "…" : "Payé"}
                              </button>
                            )}
                            {p.status === "pending" && (
                              <button
                                onClick={() => updateStatus(p.id, "failed", "Marqué échoué manuellement")}
                                disabled={isLoading}
                                className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
                              >
                                Échec
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {payouts.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">Aucun payout — table vide ou accès insuffisant.</p>
                  <p className="text-xs text-muted-foreground mt-1">Les payouts seront créés ici lors des gains validés des facilitateurs.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batches table */}
      {activeTab === "batches" && (
        <div className="card-surface overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">Batches de paiement</h2>
          </div>
          {loading ? (
            <div className="py-10 text-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Label</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Montant total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Payouts</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Créé</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => {
                    const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.draft;
                    const Icon = cfg.icon;
                    return (
                      <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{b.label ?? "Sans label"}</p>
                          <p className="font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${cfg.cls} inline-flex items-center gap-1`}>
                            <Icon size={11} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmtAmt(b.total_amount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.payout_count}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(b.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {batches.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">Aucun batch créé.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audit Log */}
      <div className="card-surface overflow-hidden">
        <button
          onClick={() => setShowAudit(!showAudit)}
          className="w-full flex items-center justify-between px-5 py-3 border-b border-border text-sm font-semibold text-foreground hover:bg-muted/20 transition-colors"
        >
          <span className="flex items-center gap-2"><FileText size={15} /> Journal d'audit ({audit.length})</span>
          {showAudit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showAudit && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Note</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Acteur</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {audit.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono text-foreground">{a.action}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.old_status && <><span className="line-through">{a.old_status}</span> → </>}
                      {a.new_status}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">{a.note ?? "—"}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{a.actor_id.slice(0, 8)}…</td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audit.length === 0 && (
              <p className="py-6 text-center text-muted-foreground text-sm">Aucune entrée d'audit.</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Source : tables <code>payouts</code>, <code>payout_batches</code>, <code>payout_audit_log</code> ·
        Mutations via RPC <code>update_payout_status</code> + <code>create_payout_batch</code>
      </p>
    </AdminLayout>
  );
}
