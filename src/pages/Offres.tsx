/**
 * Offres — Marketplace d'offres prêtes à partager + liens traqués
 * "Partagez une offre avec un lien traqué. OpenClaw prépare vos messages."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Share2, Link2, Copy, MessageCircle, Mail, Globe,
  TrendingUp, CheckCircle2, ArrowRight, Sparkles, Loader2,
  ExternalLink, ChevronDown, ChevronUp, Zap, Brain
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SharedOffer {
  id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
  email_text: string | null;
  social_text: string | null;
  pitch_vocal: string | null;
  status: string;
  created_at: string;
}

interface ShareLink {
  id: string;
  offer_id: string | null;
  tracking_code: string;
  clicks_count: number;
  unique_clicks_count: number;
  converted: boolean;
  last_click_at: string | null;
}

interface Mission {
  id: string;
  titre: string;
  recompense: string | null;
  secteur: string | null;
  zone: string | null;
  description: string | null;
}

function OfferCard({ offer, myLinks, onGetLink, onCopy }: {
  offer: SharedOffer;
  myLinks: ShareLink[];
  onGetLink: (offer: SharedOffer) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const existingLink = myLinks.find(l => l.offer_id === offer.id);
  const trackedUrl = existingLink ? `${window.location.origin}/r/${existingLink.tracking_code}` : null;

  return (
    <div className="card-surface p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-success text-xs">Active</span>
          </div>
          <h3 className="font-semibold text-foreground">{offer.title}</h3>
          {offer.short_description && (
            <p className="text-sm text-muted-foreground mt-1">{offer.short_description}</p>
          )}
        </div>
        {existingLink && (
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-foreground">{existingLink.clicks_count}</p>
            <p className="text-xs text-muted-foreground">clics</p>
          </div>
        )}
      </div>

      {/* Lien traqué */}
      {trackedUrl ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/40">
          <Link2 size={13} className="text-primary shrink-0" />
          <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{trackedUrl}</p>
          <button
            onClick={() => onCopy(trackedUrl, "Lien traqué")}
            className="p-1.5 rounded-lg border border-border hover:bg-background transition-colors shrink-0"
          >
            <Copy size={12} className="text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onGetLink(offer)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Link2 size={13} /> Obtenir mon lien traqué
        </button>
      )}

      {/* Packs de messages */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Sparkles size={11} className="text-primary" />
          Packs messages préparés par OpenClaw
          {expanded ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {offer.whatsapp_text && (
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={12} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Message WhatsApp</span>
                  </div>
                  <button
                    onClick={() => onCopy(offer.whatsapp_text!, "Message WhatsApp")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border hover:bg-background transition-colors"
                  >
                    <Copy size={10} /> Copier
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{offer.whatsapp_text}</p>
              </div>
            )}
            {offer.email_text && (
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Email</span>
                  </div>
                  <button
                    onClick={() => onCopy(offer.email_text!, "Email")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border hover:bg-background transition-colors"
                  >
                    <Copy size={10} /> Copier
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{offer.email_text}</p>
              </div>
            )}
            {offer.social_text && (
              <div className="p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Post réseau social</span>
                  </div>
                  <button
                    onClick={() => onCopy(offer.social_text!, "Post social")}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-border hover:bg-background transition-colors"
                  >
                    <Copy size={10} /> Copier
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{offer.social_text}</p>
              </div>
            )}
            {!offer.whatsapp_text && !offer.email_text && !offer.social_text && (
              <div className="p-3 rounded-xl bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">Les packs messages seront générés par OpenClaw prochainement.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionCard({ mission, myLinks, onGetLink, onCopy }: {
  mission: Mission;
  myLinks: ShareLink[];
  onGetLink: (mission: Mission) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const existingLink = myLinks.find(l => l.offer_id === null && /* no offer_id, use mission-based */ false);
  return (
    <div className="card-surface p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{mission.titre}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {mission.recompense && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                {mission.recompense}
              </span>
            )}
            {mission.secteur && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{mission.secteur}</span>}
            {mission.zone && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{mission.zone}</span>}
          </div>
          {mission.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mission.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onCopy(
            `Je connais peut-être des personnes qui peuvent vous intéresser. Une entreprise cherche : ${mission.titre}${mission.secteur ? ` (${mission.secteur})` : ""}${mission.zone ? ` - ${mission.zone}` : ""}. Intéressé(e) ? Contactez-moi.`,
            "Message de présentation"
          )}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors"
        >
          <Copy size={11} /> Copier le pitch
        </button>
        <button
          onClick={() => onGetLink(mission)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Link2 size={11} /> Lien traqué
        </button>
      </div>
    </div>
  );
}

export default function Offres() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [myLinks, setMyLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"offres" | "missions" | "mes_liens">("offres");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [offersRes, missionsRes, linksRes] = await Promise.all([
        db.from("shared_offers").select("*").eq("status", "active").order("created_at", { ascending: false }),
        db.from("missions").select("id, titre, recompense, secteur, zone, description").eq("statut", "active").limit(20),
        db.from("offer_share_links").select("*").eq("facilitator_id", user.id).order("created_at", { ascending: false }),
      ]);
      setOffers(offersRes.data || []);
      setMissions(missionsRes.data || []);
      setMyLinks(linksRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

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

  const getMissionLink = async (mission: Mission) => {
    if (!user) return;
    const { data, error } = await db.from("offer_share_links").insert({
      facilitator_id: user.id,
      mission_id: mission.id,
    }).select().single();
    if (!error && data) {
      setMyLinks(prev => [data, ...prev]);
      const url = `${window.location.origin}/r/${data.tracking_code}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Lien traqué créé ✓", description: `Lien pour "${mission.titre}" copié.` });
    }
  };

  const totalClicks = myLinks.reduce((s, l) => s + l.clicks_count, 0);
  const converted = myLinks.filter(l => l.converted).length;

  return (
    <UserLayout role="facilitateur" jarvisContext="offres">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/passive" className="text-xs text-muted-foreground hover:text-foreground">Mode passif</Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-foreground font-medium">Offres</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Offres prêtes à partager</h1>
          <p className="text-muted-foreground text-sm mt-1">OpenClaw prépare les messages. Vous copiez, vous envoyez, vous gagnez.</p>
        </div>

        {/* ── STATS ────────────────────────────────────────────── */}
        {myLinks.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Liens créés", value: myLinks.length },
              { label: "Clics totaux", value: totalClicks },
              { label: "Convertis", value: converted },
            ].map(({ label, value }) => (
              <div key={label} className="card-surface p-4 text-center">
                <p className="font-bold text-xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ─────────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted">
          {(["offres", "missions", "mes_liens"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "offres" ? "Offres" : t === "missions" ? "Missions" : "Mes liens"}
            </button>
          ))}
        </div>

        {/* ── CONTENT ──────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {tab === "offres" && (
              <>
                {offers.length === 0 ? (
                  <div className="card-surface p-8 text-center">
                    <Share2 size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucune offre disponible</p>
                    <p className="text-sm text-muted-foreground">Les entreprises publient des offres depuis leurs missions. Consultez les missions disponibles.</p>
                    <button onClick={() => setTab("missions")} className="mt-4 text-sm text-primary font-medium hover:underline">
                      Voir les missions →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map(offer => (
                      <OfferCard key={offer.id} offer={offer} myLinks={myLinks} onGetLink={getOfferLink} onCopy={copyText} />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "missions" && (
              <div className="space-y-4">
                {missions.length === 0 ? (
                  <div className="card-surface p-8 text-center">
                    <p className="text-sm text-muted-foreground">Aucune mission active.</p>
                  </div>
                ) : missions.map(mission => (
                  <MissionCard key={mission.id} mission={mission} myLinks={myLinks} onGetLink={getMissionLink} onCopy={copyText} />
                ))}
              </div>
            )}

            {tab === "mes_liens" && (
              <div className="space-y-3">
                {myLinks.length === 0 ? (
                  <div className="card-surface p-8 text-center">
                    <Link2 size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-semibold text-foreground mb-1">Aucun lien créé</p>
                    <p className="text-sm text-muted-foreground">Générez votre premier lien traqué depuis une offre ou une mission.</p>
                    <button onClick={() => setTab("offres")} className="mt-4 text-sm text-primary font-medium hover:underline">
                      Voir les offres →
                    </button>
                  </div>
                ) : myLinks.map(link => (
                  <div key={link.id} className="card-surface p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: link.converted ? "hsl(var(--success-light))" : "hsl(var(--secondary))" }}>
                        {link.converted ? <CheckCircle2 size={14} style={{ color: "hsl(var(--success))" }} /> : <Link2 size={14} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground truncate">{window.location.origin}/r/{link.tracking_code}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-foreground font-medium">{link.clicks_count} clics · {link.unique_clicks_count} uniques</span>
                          {link.converted && <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>✓ Converti</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => copyText(`${window.location.origin}/r/${link.tracking_code}`, "Lien")}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <Copy size={13} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CTA OpenClaw ─────────────────────────────────────── */}
        <div className="rounded-xl p-4 border flex items-center gap-3" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", borderColor: "hsl(218 40% 25% / 0.4)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
            <Brain size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">OpenClaw génère vos packs messages</p>
            <p className="text-white/50 text-xs">WhatsApp, email, post social — déjà préparés pour chaque offre.</p>
          </div>
          <Link to="/agents" className="text-xs font-semibold text-white/70 hover:text-white transition-colors shrink-0">
            Agents →
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
