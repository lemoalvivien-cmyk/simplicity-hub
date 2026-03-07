/**
 * Offres — Marketplace passive industrielle de WIINUP MAX
 * "OpenClaw transforme une offre en machine de diffusion."
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Share2, Link2, Copy, MessageCircle, Mail, Globe,
  TrendingUp, CheckCircle2, ArrowRight, Sparkles, Loader2,
  ChevronDown, ChevronUp, Zap, Brain, RefreshCw, Flame,
  Target, BarChart3, Star
} from "lucide-react";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SharedOffer {
  id: string;
  company_user_id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
  email_text: string | null;
  social_text: string | null;
  status: string;
}

interface OfferPack {
  id: string;
  whatsapp_short: string | null;
  whatsapp_natural: string | null;
  email_simple: string | null;
  email_premium: string | null;
  post_short: string | null;
  private_message: string | null;
  pitch_ultra_short: string | null;
  language: string;
  status: string;
}

interface ShareLink {
  id: string;
  offer_id: string | null;
  tracking_code: string;
  clicks_count: number;
  unique_clicks_count: number;
  qualified_interest_count: number;
  opportunity_count: number;
  converted: boolean;
  last_click_at: string | null;
}

const CHANNEL_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  whatsapp_short: { label: "WhatsApp court", icon: "💬", color: "hsl(142 70% 45%)" },
  whatsapp_natural: { label: "WhatsApp humain", icon: "💬", color: "hsl(142 70% 40%)" },
  email_simple: { label: "Email simple", icon: "📧", color: "hsl(var(--primary))" },
  email_premium: { label: "Email premium", icon: "📧", color: "hsl(218 72% 40%)" },
  post_short: { label: "Post réseaux", icon: "📢", color: "hsl(24 100% 52%)" },
  private_message: { label: "Message privé", icon: "✉️", color: "hsl(38 80% 40%)" },
  pitch_ultra_short: { label: "Pitch oral", icon: "🎙️", color: "hsl(280 60% 50%)" },
};

function PackSlot({ label, icon, color, text, onCopy }: {
  label: string; icon: string; color: string; text: string;
  onCopy: (text: string, label: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-3 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopy(text, label)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border hover:bg-background transition-colors font-medium"
            style={{ color }}
          >
            <Copy size={10} /> Copier
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-lg hover:bg-background transition-colors">
            {expanded ? <ChevronUp size={11} className="text-muted-foreground" /> : <ChevronDown size={11} className="text-muted-foreground" />}
          </button>
        </div>
      </div>
      {expanded && (
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-border pt-2 mt-1">{text}</p>
      )}
    </div>
  );
}

function OfferCard({ offer, myLinks, pack, onGetLink, onCopy, onGeneratePack, generatingId }: {
  offer: SharedOffer;
  myLinks: ShareLink[];
  pack: OfferPack | null;
  onGetLink: (offer: SharedOffer) => void;
  onCopy: (text: string, label: string) => void;
  onGeneratePack: (offerId: string) => void;
  generatingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const existingLink = myLinks.find(l => l.offer_id === offer.id);
  const trackedUrl = existingLink ? `${window.location.origin}/r/${existingLink.tracking_code}` : null;
  const isGenerating = generatingId === offer.id;

  const packSlots = pack ? Object.entries(CHANNEL_LABELS).filter(([key]) => {
    const val = pack[key as keyof OfferPack] as string | null;
    return val && val.length > 0;
  }) : [];

  const totalClicks = existingLink?.clicks_count || 0;
  const uniqueClicks = existingLink?.unique_clicks_count || 0;
  const qualified = existingLink?.qualified_interest_count || 0;

  return (
    <div className="card-surface p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
              background: "hsl(var(--success-light))", color: "hsl(var(--success))"
            }}>● Active</span>
            {pack && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Pack prêt</span>}
          </div>
          <h3 className="font-semibold text-foreground">{offer.title}</h3>
          {offer.short_description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{offer.short_description}</p>
          )}
        </div>
        {existingLink && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-foreground">{totalClicks}</p>
            <p className="text-xs text-muted-foreground">clics</p>
            {qualified > 0 && <p className="text-xs font-semibold mt-0.5" style={{ color: "hsl(152 62% 40%)" }}>{qualified} intérêts</p>}
          </div>
        )}
      </div>

      {/* Lien traqué */}
      {trackedUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/40">
            <Link2 size={13} className="text-primary shrink-0" />
            <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{trackedUrl}</p>
            <button onClick={() => onCopy(trackedUrl, "Lien traqué")}
              className="p-1.5 rounded-lg border border-border hover:bg-background transition-colors">
              <Copy size={11} className="text-muted-foreground" />
            </button>
          </div>
          {existingLink && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BarChart3 size={10} /> {totalClicks} clics · {uniqueClicks} uniques</span>
              {existingLink.converted && <span className="font-semibold" style={{ color: "hsl(152 62% 40%)" }}>✓ Converti</span>}
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => onGetLink(offer)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-primary)" }}>
          <Link2 size={13} /> Obtenir mon lien traqué
        </button>
      )}

      {/* Pack OpenClaw */}
      <div>
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles size={11} className="text-primary" />
            {pack ? `Pack prêt — ${packSlots.length} format${packSlots.length > 1 ? "s" : ""}` : "Générer les messages"}
            {expanded ? <ChevronUp size={10} className="ml-1" /> : <ChevronDown size={10} className="ml-1" />}
          </button>
          <button
            onClick={() => onGeneratePack(offer.id)}
            disabled={isGenerating}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {pack ? "Regénérer" : "Générer via IA"}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {pack && packSlots.length > 0 ? (
              packSlots.map(([key, meta]) => (
                <PackSlot
                  key={key}
                  label={meta.label}
                  icon={meta.icon}
                  color={meta.color}
                  text={(pack[key as keyof OfferPack] as string) || ""}
                  onCopy={onCopy}
                />
              ))
            ) : (
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <Brain size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground mb-3">OpenClaw peut générer vos messages en 1 clic.</p>
                <button
                  onClick={() => onGeneratePack(offer.id)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {isGenerating ? "Génération en cours…" : "Générer les packs"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Offres() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [myLinks, setMyLinks] = useState<ShareLink[]>([]);
  const [packs, setPacks] = useState<Record<string, OfferPack>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"offres" | "mes_liens">("offres");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  // Heat scores per offer
  const [heatScores, setHeatScores] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!user) return;
    const [offersRes, linksRes] = await Promise.all([
      db.from("shared_offers").select("*").eq("status", "active").order("created_at", { ascending: false }),
      db.from("offer_share_links").select("*").eq("facilitator_id", user.id).order("created_at", { ascending: false }),
    ]);
    const loadedOffers: SharedOffer[] = offersRes.data || [];
    const loadedLinks: ShareLink[] = linksRes.data || [];
    setOffers(loadedOffers);
    setMyLinks(loadedLinks);

    // Compute heat scores
    const scores: Record<string, number> = {};
    for (const offer of loadedOffers) {
      const myLink = loadedLinks.find(l => l.offer_id === offer.id);
      if (myLink) {
        const recency = myLink.last_click_at
          ? Math.max(0, 40 - Math.floor((Date.now() - new Date(myLink.last_click_at).getTime()) / (1000 * 60 * 60 * 24)) * 3)
          : 0;
        scores[offer.id] = Math.min(100, Math.round(
          30 +
          (myLink.clicks_count || 0) * 2 +
          (myLink.unique_clicks_count || 0) * 4 +
          (myLink.qualified_interest_count || 0) * 15 +
          (myLink.opportunity_count || 0) * 20 +
          (myLink.converted ? 25 : 0) +
          recency
        ));
      } else {
        scores[offer.id] = 30; // base: not yet shared
      }
    }
    setHeatScores(scores);

    // Load packs for all offers
    if (loadedOffers.length > 0) {
      const offerIds = loadedOffers.map(o => o.id);
      const { data: packsData } = await db.from("offer_packs")
        .select("*")
        .in("shared_offer_id", offerIds)
        .eq("status", "active");
      if (packsData) {
        const packsMap: Record<string, OfferPack> = {};
        for (const p of packsData) {
          packsMap[p.shared_offer_id] = p;
        }
        setPacks(packsMap);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié ✓`, description: "Prêt à coller dans votre message." });
  };

  const getOfferLink = async (offer: SharedOffer) => {
    if (!user) return;
    const { data, error } = await db.from("offer_share_links").insert({
      facilitator_id: user.id,
      offer_id: offer.id,
      company_id: offer.company_user_id,
    }).select().single();
    if (!error && data) {
      setMyLinks(prev => [data, ...prev]);
      const url = `${window.location.origin}/r/${data.tracking_code}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Lien traqué créé ✓", description: "Copié dans votre presse-papier." });
    }
  };

  const generatePack = async (offerId: string) => {
    if (!user) return;
    setGeneratingId(offerId);
    try {
      const { data, error } = await supabase.functions.invoke("openclaw-generate-packs", {
        body: { shared_offer_id: offerId, language: "fr" },
      });
      if (error) throw error;
      if (data?.pack) {
        setPacks(prev => ({ ...prev, [offerId]: data.pack }));
        toast({ title: "Pack généré par OpenClaw ✓", description: "Vos messages sont prêts à être copiés." });
      }
    } catch (err) {
      toast({ title: "Erreur de génération", description: "Impossible de générer le pack pour le moment.", variant: "destructive" });
    } finally {
      setGeneratingId(null);
    }
  };

  const totalClicks = myLinks.reduce((s, l) => s + (l.clicks_count || 0), 0);
  const totalUnique = myLinks.reduce((s, l) => s + (l.unique_clicks_count || 0), 0);
  const converted = myLinks.filter(l => l.converted).length;

  // Sort offers by heat score descending
  const sortedOffers = [...offers].sort((a, b) => (heatScores[b.id] || 0) - (heatScores[a.id] || 0));

  return (
    <UserLayout role="facilitateur" jarvisContext="offres">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/passive" className="text-xs text-muted-foreground hover:text-foreground">Mode passif</Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-foreground font-medium">Offres</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Offres prêtes à partager</h1>
          <p className="text-muted-foreground text-sm mt-1">OpenClaw prépare vos messages. Vous copiez, envoyez, gagnez.</p>
        </div>

        {/* Stats */}
        {myLinks.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Liens", value: myLinks.length, color: "hsl(var(--primary))" },
              { label: "Clics", value: totalClicks, color: "hsl(var(--primary))" },
              { label: "Uniques", value: totalUnique, color: "hsl(var(--primary))" },
              { label: "Convertis", value: converted, color: "hsl(152 62% 40%)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-surface p-3 text-center">
                <p className="font-bold text-xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted">
          {(["offres", "mes_liens"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "offres" ? `Offres (${offers.length})` : `Mes liens (${myLinks.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {tab === "offres" && (
              <>
                {offers.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Share2 size={30} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucune offre disponible</p>
                    <p className="text-sm text-muted-foreground">Les entreprises publieront bientôt des offres à partager.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map(offer => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        myLinks={myLinks}
                        pack={packs[offer.id] || null}
                        onGetLink={getOfferLink}
                        onCopy={copyText}
                        onGeneratePack={generatePack}
                        generatingId={generatingId}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "mes_liens" && (
              <div className="space-y-3">
                {myLinks.length === 0 ? (
                  <div className="card-surface p-10 text-center">
                    <Link2 size={30} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucun lien créé</p>
                    <p className="text-sm text-muted-foreground mb-4">Créez votre premier lien traqué depuis une offre.</p>
                    <button onClick={() => setTab("offres")} className="text-sm text-primary font-semibold hover:underline">
                      Voir les offres →
                    </button>
                  </div>
                ) : myLinks.map(link => (
                  <div key={link.id} className="card-surface p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: link.converted ? "hsl(var(--success-light))" : "hsl(var(--secondary))" }}>
                        {link.converted
                          ? <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} />
                          : <Link2 size={14} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs font-semibold text-foreground">{link.clicks_count} clics</span>
                          <span className="text-xs text-muted-foreground">{link.unique_clicks_count} uniques</span>
                          {(link.qualified_interest_count || 0) > 0 && (
                            <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 40%)" }}>
                              {link.qualified_interest_count} intérêts
                            </span>
                          )}
                          {link.converted && (
                            <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 40%)" }}>✓ Converti</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => copyText(`${window.location.origin}/r/${link.tracking_code}`, "Lien")}
                        className="p-2 rounded-lg border border-border hover:bg-background transition-colors">
                        <Copy size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                    {link.last_click_at && (
                      <p className="text-xs text-muted-foreground">
                        Dernier clic : {new Date(link.last_click_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* OpenClaw CTA */}
        <div className="rounded-xl p-4 border" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          borderColor: "hsl(218 40% 25% / 0.4)"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">OpenClaw prépare tout</p>
              <p className="text-white/50 text-xs">Cliquez sur "Générer via IA" pour obtenir vos messages prêts.</p>
            </div>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
