/**
 * AdminRefunds — Gestion des demandes de remboursement.
 * Charge la table refund_requests + join profiles.email.
 * Actions : Approuver (update status='approved') ou Rejeter (AlertDialog avec motif).
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, RefreshCw } from "lucide-react";

interface RefundRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  stripe_subscription_id: string | null;
  email?: string | null;
}

export default function AdminRefunds() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("refund_requests" as any)
        .select("*, profiles(email)")
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      const rows = (data ?? []).map((r: any) => ({
        ...r,
        email: r.profiles?.email ?? null,
      }));
      setRequests(rows);
    } catch (e: any) {
      toast.error("Erreur chargement : " + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from("refund_requests" as any)
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", id) as any);
      if (error) throw error;
      toast.success(
        <span>
          Approuvé. À traiter manuellement dans{" "}
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            Stripe Dashboard ↗
          </a>
        </span>
      );
      await load();
    } catch (e: any) {
      toast.error("Erreur : " + e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase
        .from("refund_requests" as any)
        .update({
          status: "rejected",
          rejection_reason: rejectReason.trim(),
          processed_at: new Date().toISOString(),
        })
        .eq("id", rejectTarget) as any);
      if (error) throw error;
      toast.success("Demande rejetée.");
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (e: any) {
      toast.error("Erreur : " + e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter((r) => r.status === "pending").length;

  const statusBadge = (status: string) => {
    if (status === "pending")
      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">En attente</Badge>;
    if (status === "approved")
      return <Badge className="bg-green-500/15 text-green-400 border-green-500/30">Approuvé</Badge>;
    return <Badge className="bg-destructive/15 text-destructive border-destructive/30">Rejeté</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Remboursements</h1>
            {pending > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-sm">
                {pending} en attente
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </Button>
        </div>

        {/* Stripe link */}
        <a
          href="https://dashboard.stripe.com/refunds"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink size={13} />
          Gérer les remboursements dans Stripe Dashboard
        </a>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Chargement…</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Aucune demande de remboursement.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motif</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">
                        {r.email ?? r.user_id.slice(0, 8) + "…"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[240px] truncate">
                        {r.rejection_reason
                          ? <span className="text-destructive/80">{r.rejection_reason}</span>
                          : r.reason ?? <span className="opacity-40">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => handleApprove(r.id)}
                              disabled={submitting}
                            >
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => { setRejectTarget(r.id); setRejectReason(""); }}
                              disabled={submitting}
                            >
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reject dialog */}
        <AlertDialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeter la demande de remboursement</AlertDialogTitle>
              <AlertDialogDescription>
                Ce motif sera enregistré. L'utilisateur ne sera pas notifié automatiquement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Motif du rejet (obligatoire)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || submitting}
              >
                {submitting ? "Rejet…" : "Confirmer le rejet"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
