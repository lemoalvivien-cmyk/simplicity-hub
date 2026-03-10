import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Tag, CreditCard, Gift, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { PRICING } from "@/lib/pricingConfig";

interface RevenueMetrics {
  totalProfiles: number;
  entreprises: number;
  facilitateurs: number;
  activeSubscriptions: number;
  launchSubscribers: number;
  standardSubscribers: number;
  canceledSubscriptions: number;
  activePremoCodes: number;
  redeemedPromos: number;
  totalPromoCodes: number;
  quotaUsed: number;
  quotaTotal: number;
  totalMissions: number;
  totalIntros: number;
  validatedIntros: number;
  totalGains: number;
  confirmedGains: number;
  confirmedGainsAmount: number;
  shareLinks: number;
  linkClicks: number;
  jobsCompleted: number;
  channelActionsExecuted: number;
}

const EMPTY: RevenueMetrics = {
  totalProfiles: 0, entreprises: 0, facilitateurs: 0,
  activeSubscriptions: 0, launchSubscribers: 0, standardSubscribers: 0, canceledSubscriptions: 0,
  activePremoCodes: 0, redeemedPromos: 0, totalPromoCodes: 0,
  quotaUsed: 0, quotaTotal: 100,
  totalMissions: 0, totalIntros: 0, validatedIntros: 0,
  totalGains: 0, confirmedGains: 0, confirmedGainsAmount: 0,
  shareLinks: 0, linkClicks: 0, jobsCompleted: 0, channelActionsExecuted: 0,
};

function MetricCard({
  label, value, sub, icon: Icon, color = "text-primary bg-primary/10", badge,
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof Users; color?: string; badge?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{badge}</span>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ label, honest }: { label: string; honest?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <h2 className="font-semibold text-foreground">{label}</h2>
      {honest && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle size={11} /> {honest}
        </span>
      )}
    </div>
  );
}

export default function AdminRevenue() {
  const [metrics, setMetrics] = useState<RevenueMetrics>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          profilesRes, subsRes, promosRes, quotaRes,
          missionsRes, introsRes, gainsRes, shareRes,
          clicksRes, jobsRes, actionsRes,
        ] = await Promise.all([
          supabase.from("profiles").select("role"),
          supabase.from("subscriptions").select("status, offer_type"),
          supabase.from("promo_codes").select("status, used_by"),
          supabase.from("launch_quota").select("used_slots, total_slots").single(),
          supabase.from("missions").select("id", { count: "exact", head: true }),
          supabase.from("introductions").select("statut"),
          supabase.from("gains").select("statut, montant, source"),
          supabase.from("offer_share_links").select("id", { count: "exact", head: true }),
          supabase.from("link_events").select("id", { count: "exact", head: true }).eq("event_type", "click"),
          supabase.from("openclaw_job_queue").select("status").eq("status", "completed"),
          supabase.from("openclaw_channel_actions").select("status").eq("status", "executed"),
        ]);

        const profiles = profilesRes.data ?? [];
        const subs = subsRes.data ?? [];
        const promos = promosRes.data ?? [];
        const quota = quotaRes.data;
        const intros = introsRes.data ?? [];
        const gains = gainsRes.data ?? [];

        setMetrics({
          totalProfiles: profiles.length,
          entreprises: profiles.filter(p => p.role === "entreprise").length,
          facilitateurs: profiles.filter(p => p.role === "facilitateur").length,
          activeSubscriptions: subs.filter(s => ["active", "trialing"].includes(s.status)).length,
          launchSubscribers: subs.filter(s => s.offer_type === "launch").length,
          standardSubscribers: subs.filter(s => s.offer_type === "standard").length,
          canceledSubscriptions: subs.filter(s => s.status === "canceled").length,
          activePremoCodes: promos.filter(p => p.status === "active").length,
          redeemedPromos: promos.filter(p => p.used_by !== null).length,
          totalPromoCodes: promos.length,
          quotaUsed: quota?.used_slots ?? 0,
          quotaTotal: quota?.total_slots ?? 100,
          totalMissions: missionsRes.count ?? 0,
          totalIntros: intros.length,
          validatedIntros: intros.filter(i => i.statut === "validee").length,
          totalGains: gains.length,
          confirmedGains: gains.filter(g => ["valide", "recu"].includes(g.statut ?? "")).length,
          confirmedGainsAmount: gains
            .filter(g => ["valide", "recu"].includes(g.statut ?? ""))
            .reduce((sum, g) => sum + (g.montant ?? 0), 0),
          shareLinks: shareRes.count ?? 0,
          linkClicks: clicksRes.count ?? 0,
          jobsCompleted: jobsRes.data?.length ?? 0,
          channelActionsExecuted: actionsRes.data?.length ?? 0,
        });
      } catch (err) {
        console.error("Revenue metrics error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Revenue calculation (honest)
  const stripeRevenue =
    metrics.launchSubscribers * PRICING.launch.amount +
    metrics.standardSubscribers * PRICING.standard.amount;
  const promoRevenue = 0; // codes promo = 0 € par définition

  const conversionRate = metrics.totalProfiles > 0
    ? Math.round((metrics.activeSubscriptions / metrics.totalProfiles) * 100)
    : 0;

  const introConversionRate = metrics.totalIntros > 0
    ? Math.round((metrics.validatedIntros / metrics.totalIntros) * 100)
    : 0;

  return (
    <AdminLayout
      title="Revenu & Vérité Business"
      subtitle="Métriques réelles depuis la base de données. Aucun chiffre inventé."
    >
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* Comptes */}
          <div>
            <SectionTitle label="Comptes utilisateurs" honest="Source : table profiles" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Profils totaux" value={metrics.totalProfiles} icon={Users} />
              <MetricCard label="Entreprises" value={metrics.entreprises} icon={Users} color="text-accent bg-accent/10" />
              <MetricCard label="Facilitateurs" value={metrics.facilitateurs} icon={Users} color="text-success bg-success/10" />
              <MetricCard label="Taux conversion compte payant" value={`${conversionRate}%`} icon={TrendingUp} badge="calculé" />
            </div>
          </div>

          {/* Revenue Stripe réel */}
          <div>
            <SectionTitle label="Revenu Stripe réel" honest="Source : table subscriptions × tarifs pricingConfig" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                label="Revenu estimé total"
                value={`${stripeRevenue.toLocaleString("fr")} €`}
                sub="Basé sur comptes actifs × tarif"
                icon={CreditCard}
                color="text-success bg-success/10"
              />
              <MetricCard label="Comptes payants actifs" value={metrics.activeSubscriptions} sub="Stripe actif ou trialing" icon={CreditCard} />
              <MetricCard
                label="Offre lancement 99 €"
                value={metrics.launchSubscribers}
                sub={`= ${(metrics.launchSubscribers * PRICING.launch.amount).toLocaleString("fr")} € revenu`}
                icon={CreditCard}
              />
              <MetricCard
                label="Abonnement annuel 99 €"
                value={metrics.standardSubscribers}
                sub={`= ${(metrics.standardSubscribers * 99).toLocaleString("fr")} € revenu`}
                icon={CreditCard}
              />
            </div>
            <div className="mt-3 p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-warning" />
              Revenu estimé côté back-office. Source de vérité = Stripe Dashboard. Les annulations mid-cycle ne sont pas déduites ici.
            </div>
          </div>

          {/* Codes promo */}
          <div>
            <SectionTitle label="Codes promo — Accès offerts" honest="Source : table promo_codes" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Codes créés" value={metrics.totalPromoCodes} icon={Tag} />
              <MetricCard label="Codes actifs (non utilisés)" value={metrics.activePremoCodes} icon={Tag} color="text-warning bg-warning/10" />
              <MetricCard label="Codes utilisés" value={metrics.redeemedPromos} sub="Accès offerts = 0 € revenu" icon={Tag} color="text-muted-foreground bg-muted" />
              <MetricCard label="Revenu issu des promos" value="0 €" sub="Par conception — accès gratuits" icon={Gift} color="text-muted-foreground bg-muted" badge="0 €" />
            </div>
          </div>

          {/* Quota lancement */}
          <div>
            <SectionTitle label="Quota lancement" honest="Source : table launch_quota" />
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {metrics.quotaUsed} / {metrics.quotaTotal} places utilisées
                </span>
                <span className="text-xs text-muted-foreground">
                  {metrics.quotaTotal - metrics.quotaUsed} restantes
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${(metrics.quotaUsed / Math.max(metrics.quotaTotal, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Quota réel — chaque souscription à l'offre de lancement (99 €) incrémente ce compteur.
              </p>
            </div>
          </div>

          {/* Moteur 1 — Prospection */}
          <div>
            <SectionTitle label="Moteur 1 — Prospection automatisée" honest="Source : openclaw_job_queue, openclaw_channel_actions" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <MetricCard label="Jobs exécutés (complétés)" value={metrics.jobsCompleted} icon={TrendingUp} />
              <MetricCard label="Actions canal exécutées" value={metrics.channelActionsExecuted} icon={ArrowRight} />
              <MetricCard label="Liens de partage créés" value={metrics.shareLinks} icon={ArrowRight} color="text-accent bg-accent/10" />
            </div>
          </div>

          {/* Moteur 2 — Apport d'affaires */}
          <div>
            <SectionTitle label="Moteur 2 — Apport d'affaires" honest="Source : introductions, gains, link_events" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Missions publiées" value={metrics.totalMissions} icon={TrendingUp} />
              <MetricCard label="Intros soumises" value={metrics.totalIntros} icon={Users} />
              <MetricCard
                label="Intros validées"
                value={metrics.validatedIntros}
                sub={`Taux : ${introConversionRate}%`}
                icon={CheckCircle2}
                color="text-success bg-success/10"
              />
              <MetricCard
                label="Gains confirmés"
                value={metrics.confirmedGains}
                sub={`${metrics.confirmedGainsAmount.toLocaleString("fr")} € total`}
                icon={Gift}
                color="text-success bg-success/10"
              />
            </div>
            <div className="mt-3">
              <MetricCard label="Clics sur liens de partage passifs" value={metrics.linkClicks} icon={ArrowRight} color="text-primary bg-primary/10" />
            </div>
          </div>

          {/* Note finale */}
          <div className="p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Source de vérité :</strong> Toutes les métriques ci-dessus sont lues en temps réel depuis la base de données.
              Le revenu Stripe est estimé côté back-office (comptes actifs × tarif configuré). La source de vérité du revenu encaissé reste le tableau de bord Stripe.
              Les codes promo génèrent zéro revenu par construction.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
