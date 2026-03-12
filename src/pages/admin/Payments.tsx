
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PRICING } from "@/lib/pricingConfig";
import BillingProofPanel from "@/components/admin/billing/BillingProofPanel";

type PaymentRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  source: "stripe" | "promo" | "gratuit";
  offer_type: string | null;
  status: string;
  amount: number | null;
  created_at: string;
  period_end: string | null;
  stripe_subscription_id: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: typeof CheckCircle2 }> = {
  active:    { label: "actif",       badge: "badge-success", icon: CheckCircle2 },
  trialing:  { label: "essai",       badge: "badge-warning", icon: Clock },
  canceled:  { label: "annulé",      badge: "badge-muted",   icon: XCircle },
  past_due:  { label: "impayé",      badge: "bg-destructive/10 text-destructive inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", icon: XCircle },
  promo:     { label: "promo actif", badge: "badge-warning", icon: CheckCircle2 },
  expiré:    { label: "expiré",      badge: "badge-muted",   icon: Clock },
  gratuit:   { label: "gratuit",     badge: "badge-muted",   icon: CheckCircle2 },
};

const offerAmount = (type: string | null): number => {
  if (type === "launch") return PRICING.launch.amount;
  if (type === "standard") return PRICING.standard.amount;
  return 0;
};

export default function AdminPayments() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Stripe subscriptions
        const { data: subs, error: sErr } = await supabase
          .from("subscriptions")
          .select("id, user_id, status, offer_type, current_period_end, stripe_subscription_id, created_at")
          .order("created_at", { ascending: false });
        if (sErr) throw sErr;

        // 2. Promo redemptions
        const { data: promos, error: prErr } = await supabase
          .from("promo_code_redemptions")
          .select("id, user_id, status, end_at, created_at")
          .order("created_at", { ascending: false });
        if (prErr) throw prErr;

        // 3. Profiles emails
        const allUserIds = [
          ...(subs ?? []).map((s) => s.user_id),
          ...(promos ?? []).map((p) => p.user_id),
        ].filter(Boolean) as string[];

        const emailMap = new Map<string, string>();
        if (allUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", allUserIds);
          (profiles ?? []).forEach((p) => emailMap.set(p.id, p.email ?? "—"));
        }

        const stripeRows: PaymentRow[] = (subs ?? []).map((s) => ({
          id: s.id,
          user_id: s.user_id,
          email: emailMap.get(s.user_id) ?? "—",
          source: "stripe",
          offer_type: s.offer_type,
          status: s.status,
          amount: offerAmount(s.offer_type),
          created_at: s.created_at,
          period_end: s.current_period_end ?? null,
          stripe_subscription_id: s.stripe_subscription_id,
        }));

        const promoRows: PaymentRow[] = (promos ?? []).map((p) => {
          const expired = new Date(p.end_at) < new Date();
          return {
            id: p.id,
            user_id: p.user_id,
            email: emailMap.get(p.user_id) ?? "—",
            source: "promo",
            offer_type: "promo_12mois",
            status: expired ? "expiré" : "promo",
            amount: 0,
            created_at: p.created_at,
            period_end: p.end_at,
            stripe_subscription_id: null,
          };
        });

        setRows([...stripeRows, ...promoRows].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stripeActive = rows.filter((r) => r.source === "stripe" && r.status === "active");
  const promoActive  = rows.filter((r) => r.source === "promo"  && r.status === "promo");
  const revenue      = stripeActive.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const fmtDate      = (d: string | null) =>
    d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";

  const [tab, setTab] = useState<"subscriptions" | "proof">("proof");

  return (
    <AdminLayout title="Paiements" subtitle="Abonnements Stripe + accès promo — chaîne de preuve billing">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setTab("proof")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === "proof" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck size={12} /> Billing Proof Chain
        </button>
        <button
          onClick={() => setTab("subscriptions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === "subscriptions" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Abonnements ({rows.length})
        </button>
      </div>

      {tab === "proof" && <BillingProofPanel />}

      {tab === "subscriptions" && (
        <>
          {/* Summary */}
          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-success">{revenue.toLocaleString("fr")} €</p>
              <p className="text-xs text-muted-foreground mt-0.5">Revenu ARR calculé</p>
            </div>
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-foreground">{stripeActive.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Abonnements Stripe actifs</p>
            </div>
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-warning">{promoActive.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Accès promo actifs</p>
            </div>
            <div className="stat-card">
              <p className="font-display text-2xl font-bold text-muted-foreground">{rows.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Entrées totales observées</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

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
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Compte</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Source</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Offre</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Montant</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expiration</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Créé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.expiré;
                      const Icon = cfg.icon;
                      return (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{r.email}</p>
                            <p className="font-mono text-xs text-muted-foreground">{r.user_id?.slice(0, 8)}…</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={r.source === "stripe" ? "badge-success" : r.source === "promo" ? "badge-warning" : "badge-muted"}>
                              {r.source}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs font-mono">{r.offer_type ?? "—"}</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {r.amount ? `${r.amount.toLocaleString("fr")} €` : <span className="text-muted-foreground">0 €</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`${cfg.badge} inline-flex items-center gap-1`}>
                              <Icon size={11} /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs">{fmtDate(r.period_end)}</td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs">{fmtDate(r.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">Aucune entrée — base vide ou accès insuffisant.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Les paiements Stripe apparaîtront ici après réception du premier webhook Stripe.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Source : tables <code>subscriptions</code> + <code>promo_code_redemptions</code>.
          </p>
        </>
      )}
    </AdminLayout>
  );
}
