/**
 * PassiveOS — Passive Facilitator OS MAX
 * "Votre réseau travaille. La machine a préparé le reste."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Moon, Upload, Share2, Link2, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Copy, Brain,
  ChevronRight, Users, Target, Flame, BarChart3,
  Wifi, Zap, Map
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createLeadFromPassive } from "@/lib/leadPipeline";
import BestOfferToPush from "@/components/passive/BestOfferToPush";
import NetworkValueMap from "@/components/passive/NetworkValueMap";
import PassiveCoachBanner from "@/components/passive/PassiveCoachBanner";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/lib/formatLocale";
import i18n from "@/lib/i18n";

interface ShareLink {
  id: string; offer_id: string | null; tracking_code: string;
  clicks_count: number; unique_clicks_count: number;
  qualified_interest_count: number; opportunity_count: number;
  converted: boolean; last_click_at: string | null;
}
interface PassiveGain { id: string; montant: number | null; statut: string; source: string | null; }

const CHANNELS = [
  { label: "WhatsApp", status: "ready", descKey: "passive_channel_ready", icon: "💬" },
  { label: "Email", status: "ready", descKey: "passive_channel_ready", icon: "📧" },
  { label: "LinkedIn", status: "assisted", descKey: "passive_channel_assisted", icon: "💼" },
  { label: "Lien direct", status: "ready", descKey: "passive_channel_ready", icon: "🔗" },
  { label: "Facebook", status: "assisted", descKey: "passive_channel_assisted", icon: "📘" },
  { label: "SMS / Appel", status: "soon", descKey: "passive_channel_soon", icon: "📱" },
];

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  ready: { color: "hsl(152 62% 35%)", bg: "hsl(152 62% 35% / 0.12)" },
  assisted: { color: "hsl(38 80% 35%)", bg: "hsl(38 80% 35% / 0.12)" },
  soon: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

export default function PassiveOS() {
  const { t } = useTranslation();
  const lang = i18n.language || "fr";
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [gains, setGains] = useState<PassiveGain[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalInterests, setTotalInterests] = useState(0);
  const [totalConverted, setTotalConverted] = useState(0);
  const [tab, setTab] = useState<"home" | "liens" | "canaux">("home");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [linksRes, contactsRes, gainsRes] = await Promise.all([
        db.from("offer_share_links").select("*").eq("facilitator_id", user.id).order("clicks_count", { ascending: false }).limit(10),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("gains").select("id, montant, statut, source").eq("facilitateur_id", user.id).in("source", ["passive", "diffusion_passive", "lien_traque"]),
      ]);
      const links: ShareLink[] = linksRes.data || [];
      setShareLinks(links);
      setGains(gainsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setTotalClicks(links.reduce((s, l) => s + (l.clicks_count || 0), 0));
      setTotalInterests(links.reduce((s, l) => s + (l.qualified_interest_count || 0), 0));
      setTotalConverted(links.filter(l => l.converted).length);
      setLoading(false);

      // PROOF:EXECUTION_V1:passive_pipeline_wired
      // For each link with qualified_interest_count >= 3 (threshold), ensure a lead_intake exists.
      // We fire-and-forget: no blocking, no UI side effects beyond the pipeline.
      for (const link of links) {
        if ((link.qualified_interest_count || 0) >= 3 && !link.converted) {
          // Check if we already have a lead for this share link before creating
          const { data: existing } = await db
            .from("lead_source_events")
            .select("id")
            .eq("user_id", user.id)
            .eq("source_type", "passive_click")
            .eq("source_ref_id", link.id)
            .limit(1)
            .single();
          if (!existing) {
            await createLeadFromPassive({
              userId: user.id,
              shareLinkId: link.id,
              context: `passive_threshold_reached_${link.qualified_interest_count}_interests`,
            });
          }
        }
      }
    };
    load();
  }, [user]);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast({ title: "Lien copié ✓", description: "Partagez-le où vous voulez." });
  };

  const generateLink = async (offerId: string) => {
    if (!user) return;
    const { data, error } = await db.from("offer_share_links").insert({ facilitator_id: user.id, offer_id: offerId }).select().single();
    if (!error && data) {
      setShareLinks(prev => [data, ...prev]);
      copyLink(data.tracking_code);
    }
  };

  // PROOF:EXECUTION_V1:passive_pipeline_wired
  // When a share link reaches a qualified threshold (3+ unique clicks), create a lead_source_event + lead_intake.
  const triggerPassiveLead = async (shareLinkId: string, email?: string, company?: string) => {
    if (!user) return;
    const result = await createLeadFromPassive({
      userId: user.id,
      shareLinkId,
      personEmail: email,
      companyName: company,
      context: "passive_interest_from_share_link",
    });
    if (result.intakeId) {
      toast({ title: "Lead passif enregistré", description: "Visible dans votre pipeline." });
    }
    return result;
  };

  const passiveGainsTotal = gains.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0);

  return (
    <UserLayout role="facilitateur" jarvisContext="passive-os">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 border relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          borderColor: "hsl(218 40% 25% / 0.5)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 80% 70% at 20% 50%, hsl(24 100% 52% / 0.07) 0%, transparent 70%)"
          }} />
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Moon size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(24 100% 65%)" }}>Passive Facilitator OS</span>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(152 62% 35% / 0.2)", color: "hsl(152 62% 65%)" }}>
                    <Wifi size={9} /> {t("status_active")}
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold text-white mb-1">{t("passive_subtitle")}</h1>
                <p className="text-white/55 text-sm">{t("passive_openclaw_sub")}</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: t("passive_kpi_contacts"), value: loading ? "…" : formatNumber(contactsCount, lang), icon: Users },
                { label: t("passive_kpi_clicks"), value: loading ? "…" : formatNumber(totalClicks, lang), icon: BarChart3 },
                { label: t("passive_kpi_interests"), value: loading ? "…" : formatNumber(totalInterests, lang), icon: Flame },
                { label: t("passive_kpi_converted"), value: loading ? "…" : formatNumber(totalConverted, lang), icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center py-2.5 px-2 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                  <Icon size={12} className="mx-auto mb-1 text-white/40" />
                  <p className="font-bold text-white text-lg leading-none">{value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {passiveGainsTotal > 0 && (
              <div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{ background: "hsl(152 62% 30% / 0.2)", border: "1px solid hsl(152 62% 35% / 0.3)" }}>
                <TrendingUp size={14} style={{ color: "hsl(152 62% 60%)" }} className="shrink-0" />
                <p className="text-sm font-semibold" style={{ color: "hsl(152 62% 65%)" }}>
                  {formatNumber(passiveGainsTotal, lang)} € {t("passive_passive_gains")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {([
            { key: "home", label: t("passive_tab_home") },
            { key: "liens", label: `${t("passive_tab_links")} (${shareLinks.length})` },
            { key: "canaux", label: t("passive_tab_channels") },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── HOME TAB ────────────────────────────────────────── */}
        {tab === "home" && (
          <>
            <PassiveCoachBanner />
            <BestOfferToPush compact />

            <Link to="/chaud" className="rounded-xl border-2 p-4 flex items-center justify-between gap-4 hover:opacity-90 transition-all" style={{
              borderColor: "hsl(24 100% 52% / 0.35)",
              background: "linear-gradient(135deg, hsl(24 80% 8%), hsl(38 70% 11%))"
            }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" }}>
                  <Flame size={17} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t("passive_heating_title")}</p>
                  {totalInterests > 0 ? (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(24 100% 65%)" }}>
                      🔥 {formatNumber(totalInterests, lang)} {totalInterests > 1 ? t("passive_heat_plural") : t("passive_heat_label")}
                    </p>
                  ) : (
                    <p className="text-white/50 text-xs mt-0.5">{t("passive_heating_sub")}</p>
                  )}
                </div>
              </div>
              <ArrowRight size={15} className="text-white/50 shrink-0" />
            </Link>

            <NetworkValueMap />

            <div className="card-surface p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("passive_quick_nav")}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/offres", label: t("fac_best_path") === "fac_best_path" ? "Offres à partager" : t("fac_best_path"), icon: Share2, color: "hsl(var(--primary))" },
                  { to: "/import-reseau", label: "Importer mon réseau", icon: Upload, color: "hsl(38 80% 40%)" },
                  { to: "/gains", label: t("gains"), icon: TrendingUp, color: "hsl(152 62% 40%)" },
                  { to: "/agents", label: t("openclaw"), icon: Brain, color: "hsl(218 72% 55%)" },
                ].map(({ to, label, icon: Icon, color }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:bg-secondary transition-colors">
                    <Icon size={14} style={{ color }} className="shrink-0" />
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    <ChevronRight size={11} className="text-muted-foreground ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── LIENS TAB ───────────────────────────────────────── */}
        {tab === "liens" && (
          <div className="space-y-3">
            {shareLinks.length === 0 ? (
              <div className="card-surface p-10 text-center">
                <Link2 size={28} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold text-foreground mb-1">{t("passive_no_links_title")}</p>
                <p className="text-sm text-muted-foreground mb-4">{t("passive_no_links_sub")}</p>
                <Link to="/offres" className="text-sm text-primary font-semibold hover:underline">{t("passive_no_links_cta")}</Link>
              </div>
            ) : (
              shareLinks.map((link) => {
                const heat = Math.min(100, Math.round(
                  (link.clicks_count || 0) * 3 +
                  (link.unique_clicks_count || 0) * 5 +
                  (link.qualified_interest_count || 0) * 15 +
                  (link.opportunity_count || 0) * 20 +
                  (link.converted ? 30 : 0)
                ));
                const heatColor = heat >= 65 ? "hsl(24 100% 52%)" : heat >= 40 ? "hsl(38 80% 40%)" : "hsl(var(--primary))";
                return (
                  <div key={link.id} className="card-surface p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{formatNumber(link.clicks_count, lang)} clics</span>
                          <span className="text-xs text-muted-foreground">{formatNumber(link.unique_clicks_count, lang)} uniques</span>
                          {(link.qualified_interest_count || 0) > 0 && (
                            <span className="text-xs font-bold" style={{ color: "hsl(24 100% 52%)" }}>
                              🔥 {link.qualified_interest_count} {link.qualified_interest_count > 1 ? t("passive_heat_plural") : t("passive_heat_label")}
                            </span>
                          )}
                          {link.converted && (
                            <span className="text-xs font-bold flex items-center gap-1" style={{ color: "hsl(152 62% 35%)" }}>
                              <CheckCircle2 size={10} /> {t("passive_converted_badge")}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => copyLink(link.tracking_code)}
                        className="p-2 rounded-lg border border-border hover:bg-background transition-colors shrink-0">
                        <Copy size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${heat}%`, background: heatColor }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: heatColor }}>{heat}°</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── CANAUX TAB ──────────────────────────────────────── */}
        {tab === "canaux" && (
          <div className="space-y-3">
            <div className="card-surface p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                <Zap size={14} className="text-primary" /> {t("passive_channels_title")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {CHANNELS.map(({ label, status, descKey, icon }) => {
                  const style = STATUS_STYLES[status];
                  const statusLabel = status === "ready" ? t("passive_channel_ready") : status === "assisted" ? t("passive_channel_assisted") : t("passive_channel_soon");
                  return (
                    <div key={label} className="p-3 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-base">{icon}</span>
                        <span className="font-semibold text-foreground text-xs">{label}</span>
                        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: style.bg, color: style.color }}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{statusLabel}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl p-5 border" style={{
              background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
              borderColor: "hsl(218 40% 25% / 0.4)"
            }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Brain size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t("passive_openclaw_title")}</p>
                  <p className="text-white/50 text-xs">{t("passive_openclaw_sub")}</p>
                </div>
              </div>
              <div className="space-y-2">
                {([
                  t("passive_openclaw_1"),
                  t("passive_openclaw_2"),
                  t("passive_openclaw_3"),
                  t("passive_openclaw_4"),
                ]).map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={11} style={{ color: "hsl(152 62% 50%)" }} className="shrink-0" />
                    <p className="text-xs text-white/60">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
