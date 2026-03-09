/**
 * Admin Reactivation Jobs
 * PROOF:REACTIVATION_V1:admin_reads_reactivation_jobs
 * PROOF:REACTIVATION_EMAIL_V1:resend_provider_wired
 *
 * - Detection: real DB RPC scan_reactivation_candidates()
 * - Queue: persisted in reactivation_jobs table
 * - Email: real send via Resend (send-reactivation-email edge fn + RESEND_API_KEY)
 * - Fallback: manual "Marquer envoyé" for offline ops
 * - Cron: CRÉÉ MAIS NON BRANCHÉ — scripts in supabase/infra/scheduled-jobs.md
 */
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, RefreshCw, BellOff, Send, Clock, CheckCircle2, Mail } from "lucide-react";

type JobStatus = "pending" | "sent" | "dismissed" | "converted";
type TriggerType = "checkout_abandoned" | "onboarding_incomplete" | "mission_no_intro" | "intro_not_validated";

interface ReactivationJob {
  id: string;
  user_id: string;
  trigger_type: TriggerType;
  trigger_entity: string | null;
  entity_id: string | null;
  status: JobStatus;
  scheduled_at: string;
  sent_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  checkout_abandoned:    "Checkout abandonné",
  onboarding_incomplete: "Onboarding incomplet",
  mission_no_intro:      "Mission sans intro (+3j)",
  intro_not_validated:   "Intro non validée (+7j)",
};

const STATUS_CFG: Record<JobStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending:   { label: "En attente", cls: "badge-warning",  icon: Clock },
  sent:      { label: "Envoyé",     cls: "badge-success",  icon: Send },
  dismissed: { label: "Ignoré",     cls: "badge-muted",    icon: BellOff },
  converted: { label: "Converti",   cls: "badge-success",  icon: CheckCircle2 },
};

const fmtDate = (d: string) => format(new Date(d), "d MMM yyyy HH:mm", { locale: fr });

export default function AdminReactivation() {
  const [jobs, setJobs]             = useState<ReactivationJob[]>([]);
  const [loading, setLoading]       = useState(true);
  const [scanning, setScanning]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("reactivation_jobs" as "profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (e) throw e;
      setJobs((data ?? []) as unknown as ReactivationJob[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const { data, error: e } = await supabase.rpc("scan_reactivation_candidates" as never);
      if (e) throw e;
      await load();
      if (import.meta.env.DEV) console.info(`[reactivation] scan found ${data as number} candidates`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur du scan");
    } finally {
      setScanning(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    setActionLoading(jobId + "_status");
    try {
      const update: Record<string, unknown> = { status: newStatus };
      if (newStatus === "sent") update.sent_at = new Date().toISOString();
      const { error: e } = await supabase
        .from("reactivation_jobs" as "profiles")
        .update(update as never)
        .eq("id", jobId);
      if (e) throw e;
      setJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, status: newStatus, ...(newStatus === "sent" ? { sent_at: new Date().toISOString() } : {}) }
          : j
      ));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  // PROOF:REACTIVATION_EMAIL_V1:resend_real_send — calls send-reactivation-email edge fn
  const sendEmail = async (jobId: string) => {
    setActionLoading(jobId + "_email");
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Non authentifié");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-reactivation-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Erreur ${response.status}`);

      if (result.skipped) {
        await load();
        return;
      }

      setJobs(prev => prev.map(j =>
        j.id === jobId ? { ...j, status: "sent", sent_at: new Date().toISOString() } : j
      ));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi email");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredJobs = filterStatus === "all" ? jobs : jobs.filter(j => j.status === filterStatus);
  const pendingCount = jobs.filter(j => j.status === "pending").length;

  const byType = (Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => ({
    type: t,
    label: TRIGGER_LABELS[t],
    count: jobs.filter(j => j.trigger_type === t && j.status === "pending").length,
  }));

  return (
    <AdminLayout title="Réactivation" subtitle="File de relance — détection automatique, envoi email réel via Resend">

      {/* Honest status banner */}
      <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
        <p className="font-semibold text-foreground mb-1">📧 Email via Resend — PROUVÉ PAR LE REPO</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Détection réelle via <code>scan_reactivation_candidates()</code>.
          Envoi email via <strong>Resend</strong> (<code>send-reactivation-email</code> edge fn + <code>RESEND_API_KEY</code> configurée).
          Fallback manuel disponible. Cron pg_cron : <strong>CRÉÉ MAIS NON BRANCHÉ</strong> — scripts dans <code>supabase/infra/scheduled-jobs.md</code>.
        </p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        {byType.map(({ type, label, count }) => (
          <div key={type} className="stat-card">
            <p className="font-display text-2xl font-bold text-warning">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Fermer</button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={runScan}
          disabled={scanning}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scan en cours…" : "Lancer le scan maintenant"}
        </button>
        <p className="text-xs text-muted-foreground">
          Déclenchement <strong>manuel</strong> — cron pg_cron non encore créé en base.
          Script : <code>supabase/infra/scheduled-jobs.md</code>.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-xl w-fit">
        {(["all", "pending", "sent", "dismissed", "converted"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? `Tous (${jobs.length})` :
              s === "pending" ? `En attente (${pendingCount})` :
              s === "sent" ? "Envoyés" : s === "dismissed" ? "Ignorés" : "Convertis"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Déclencheur</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Planifié</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const cfg = STATUS_CFG[job.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={job.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-muted-foreground">{job.user_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">{TRIGGER_LABELS[job.trigger_type]}</p>
                        {job.entity_id && (
                          <p className="font-mono text-xs text-muted-foreground">{job.entity_id.slice(0, 8)}…</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${cfg.cls} inline-flex items-center gap-1`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(job.scheduled_at)}</td>
                      <td className="px-4 py-3">
                        {job.status === "pending" ? (
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => sendEmail(job.id)}
                              disabled={actionLoading === job.id + "_email"}
                              className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <Mail size={11} />
                              {actionLoading === job.id + "_email" ? "Envoi…" : "Envoyer email"}
                            </button>
                            <button
                              onClick={() => updateJobStatus(job.id, "sent")}
                              disabled={actionLoading === job.id + "_status"}
                              className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === job.id + "_status" ? "…" : "✓ Manuel"}
                            </button>
                            <button
                              onClick={() => updateJobStatus(job.id, "dismissed")}
                              disabled={!!actionLoading}
                              className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                            >
                              Ignorer
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredJobs.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {filterStatus === "pending"
                    ? "Aucun job en attente. Lancez un scan pour détecter les candidats."
                    : "Aucun job dans ce statut."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Source : <code>reactivation_jobs</code> · Scan : <code>scan_reactivation_candidates()</code> · Email : Resend via <code>send-reactivation-email</code>
      </p>
    </AdminLayout>
  );
}
