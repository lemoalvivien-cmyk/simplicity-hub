/**
 * BestOfferToPush — Top 3 offres à pousser maintenant
 * "Le moteur sait quelle offre mérite votre attention maintenant."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Copy, Link2, Loader2, Sparkles, ArrowRight, TrendingUp, ChevronRight } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ScoredOffer {
  id: string;
  title: string;
  short_description: string | null;
  heat_score: number;
  reason: string;
  channel_hint: string;
  corridor_hint: string | null;
  existing_link?: { tracking_code: string; clicks_count: number; qualified_interest_count: number };
  pack_ready: boolean;
  badge: "hot" | "trending" | "ready";
}

function HeatBadge({ badge }: { badge: ScoredOffer["badge"] }) {
  const map = {
    hot: { label: "🔥 Très chaude", color: "hsl(24 100% 52%)", bg: "hsl(24 100% 52% / 0.12)" },
    trending: { label: "📈 En hausse", color: "hsl(38 80% 40%)", bg: "hsl(38 80% 40% / 0.12)" },
    ready: { label: "✓ Prête à diffuser", color: "hsl(152 62% 35%)", bg: "hsl(152 62% 35% / 0.12)" },
  };
  const s = map[badge];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export default function BestOfferToPush({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<ScoredOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch active offers, my links, and packs in parallel
      const [offersRes, linksRes, packsRes] = await Promise.all([
        db.from("shared_offers").select("id, title, short_description, status").eq("status", "active").limit(20),
        db.from("offer_share_links")
          .select("offer_id, tracking_code, clicks_count, unique_clicks_count, qualified_interest_count, opportunity_count, converted, last_click_at")
          .eq("facilitator_id", user.id),
        db.from("offer_packs").select("shared_offer_id, status").eq("status", "active"),
      ]);

      const rawOffers = offersRes.data || [];
      const links = linksRes.data || [];
      const packs = new Set((packsRes.data || []).map((p: { shared_offer_id: string | null }) => p.shared_offer_id));

      const scored: ScoredOffer[] = rawOffers.map((offer) => {
        const myLink = links.find((l) => l.offer_id === offer.id);
        const hasPack = packs.has(offer.id);

        // Compute heat score
        let heat = 30; // base score
        const reasons: string[] = [];

        if (myLink) {
          const clicks = myLink.clicks_count || 0;
          const unique = myLink.unique_clicks_count || 0;
          const interests = myLink.qualified_interest_count || 0;
          const opportunities = myLink.opportunity_count || 0;

          // Recency bonus
          const recency = myLink.last_click_at
            ? Math.max(0, 40 - Math.floor((Date.now() - new Date(myLink.last_click_at).getTime()) / (1000 * 60 * 60 * 24)) * 3)
            : 0;

          heat += clicks * 2 + unique * 4 + interests * 15 + opportunities * 20 + recency;
          if (myLink.converted) heat += 25;

          if (interests > 0) reasons.push(`${interests} intérêt${interests > 1 ? "s" : ""} qualifié${interests > 1 ? "s" : ""} détecté${interests > 1 ? "s" : ""}`);
          else if (clicks > 5) reasons.push(`${clicks} clics — bon départ`);
          else if (clicks > 0) reasons.push(`${clicks} clic${clicks > 1 ? "s" : ""} enregistré${clicks > 1 ? "s" : ""}`);
        }

        if (hasPack) {
          heat += 10;
          reasons.push("Pack prêt à copier");
        }

        if (!myLink) {
          reasons.push("Pas encore partagée — opportunité à saisir");
        }

        heat = Math.min(100, heat);

        const badge: ScoredOffer["badge"] =
          heat >= 65 ? "hot" : heat >= 40 ? "trending" : "ready";

        const reason = reasons[0] || "Offre active disponible";

        return {
          id: offer.id,
          title: offer.title,
          short_description: offer.short_description,
          heat_score: heat,
          reason,
          channel_hint: hasPack ? "WhatsApp · Email · Post" : "Générer le pack",
          corridor_hint: null,
          existing_link: myLink
            ? {
                tracking_code: myLink.tracking_code,
                clicks_count: myLink.clicks_count,
                qualified_interest_count: myLink.qualified_interest_count,
              }
            : undefined,
          pack_ready: hasPack,
          badge,
        };
      });

      // Sort by heat descending
      scored.sort((a, b) => b.heat_score - a.heat_score);
      setOffers(scored.slice(0, compact ? 3 : 5));
      setLoading(false);
    };
    load();
  }, [user, compact]);

  const generateLink = async (offerId: string) => {
    if (!user) return;
    const { data, error } = await db.from("offer_share_links").insert({
      facilitator_id: user.id,
      offer_id: offerId,
    }).select().single();
    if (!error && data) {
      const url = `${window.location.origin}/r/${data.tracking_code}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Lien traqué créé ✓", description: "Copié dans votre presse-papier." });
      setOffers(prev => prev.map(o =>
        o.id === offerId
          ? { ...o, existing_link: { tracking_code: data.tracking_code, clicks_count: 0, qualified_interest_count: 0 } }
          : o
      ));
    }
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
    toast({ title: "Lien copié ✓" });
  };

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="card-surface p-5 text-center">
        <Flame size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Aucune offre disponible pour le moment.</p>
        <Link to="/offres" className="text-xs text-primary font-medium mt-2 inline-block hover:underline">Voir les offres →</Link>
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Flame size={14} style={{ color: "hsl(24 100% 52%)" }} />
          Meilleure offre à pousser maintenant
        </h2>
        <Link to="/offres" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Tout voir <ArrowRight size={10} />
        </Link>
      </div>

      <div className="space-y-3">
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className="p-4 rounded-xl border transition-colors"
            style={{
              borderColor: index === 0
                ? "hsl(24 100% 52% / 0.3)"
                : "hsl(var(--border))",
              background: index === 0
                ? "linear-gradient(135deg, hsl(24 80% 8% / 0.4), hsl(38 60% 9% / 0.3))"
                : "hsl(var(--muted) / 0.3)",
            }}
          >
            {/* Rank + badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{
                    background: index === 0
                      ? "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))"
                      : "hsl(var(--secondary))",
                    color: index === 0 ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {index + 1}
                </div>
                <p className="font-semibold text-foreground text-sm truncate">{offer.title}</p>
              </div>
              <HeatBadge badge={offer.badge} />
            </div>

            {/* Why this offer */}
            <div className="flex items-start gap-2 mb-3">
              <Sparkles size={11} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{offer.reason}</p>
            </div>

            {/* Channel hint + heat score */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-muted-foreground">{offer.channel_hint}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${offer.heat_score}%`,
                      background: offer.heat_score >= 65
                        ? "hsl(24 100% 52%)"
                        : offer.heat_score >= 40
                        ? "hsl(38 80% 40%)"
                        : "hsl(var(--primary))",
                    }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums" style={{
                  color: offer.heat_score >= 65 ? "hsl(24 100% 52%)" : offer.heat_score >= 40 ? "hsl(38 80% 40%)" : "hsl(var(--primary))"
                }}>
                  {offer.heat_score}°
                </span>
              </div>
            </div>

            {/* Action */}
            {offer.existing_link ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyLink(offer.existing_link!.tracking_code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-background transition-colors flex-1 justify-center"
                >
                  <Copy size={10} /> Copier lien
                </button>
                <Link
                  to="/offres"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <TrendingUp size={10} /> Voir stats
                </Link>
              </div>
            ) : (
              <button
                onClick={() => generateLink(offer.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Link2 size={11} /> Créer mon lien traqué
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
