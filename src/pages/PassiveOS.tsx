/**
 * PassiveOS — Hub du mode passif facilitateur
 * "Monétisez votre réseau sans effort inutile."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Zap, Upload, Share2, Link2, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Copy, MessageCircle, Mail, Brain,
  ExternalLink, Moon, ChevronRight, Users, Target, Star
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ShareLink {
  id: string;
  tracking_code: string;
  clicks_count: number;
  unique_clicks_count: number;
  converted: boolean;
  last_click_at: string | null;
  mission_id: string | null;
  created_at: string;
}

interface SharedOffer {
  id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
  email_text: string | null;
  social_text: string | null;
  status: string;
}

const STEPS = [
  {
    n: "1",
    title: "Importez votre réseau",
    desc: "Uploadez un fichier Excel ou CSV avec vos contacts professionnels.",
    icon: Upload,
    to: "/import-reseau",
    cta: "Importer mes contacts",
    color: "hsl(218 72% 18%)",
  },
  {
    n: "2",
    title: "Choisissez une offre",
    desc: "Parcourez les offres préparées par les entreprises et obtenez votre lien traqué.",
    icon: Share2,
    to: "/offres",
    cta: "Voir les offres",
    color: "hsl(var(--primary))",
  },
  {
    n: "3",
    title: "Partagez en 1 clic",
    desc: "WhatsApp, email, LinkedIn — OpenClaw prépare le texte. Vous copiez et envoyez.",
    icon: MessageCircle,
    to: "/offres",
    cta: "Mes packs prêts",
    color: "hsl(152 62% 35%)",
  },
  {
    n: "4",
    title: "Suivez et gagnez",
    desc: "Chaque clic, chaque intérêt, chaque introduction prouvée se transforme en gain.",
    icon: TrendingUp,
    to: "/gains",
    cta: "Mes gains",
    color: "hsl(38 80% 35%)",
  },
];

export default function PassiveOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalConverted, setTotalConverted] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [linksRes, offersRes, contactsRes] = await Promise.all([
        db.from("offer_share_links").select("*").eq("facilitator_id", user.id).order("created_at", { ascending: false }).limit(10),
        db.from("shared_offers").select("id, title, short_description, whatsapp_text, email_text, social_text, status").eq("status", "active").limit(6),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
      ]);
      const links = linksRes.data || [];
      setShareLinks(links);
      setOffers(offersRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setTotalClicks(links.reduce((s: number, l: ShareLink) => s + (l.clicks_count || 0), 0));
      setTotalConverted(links.filter((l: ShareLink) => l.converted).length);
      setLoading(false);
    };
    load();
  }, [user]);

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié ✓", description: "Partagez-le où vous voulez." });
  };

  const generateLink = async (offer: SharedOffer) => {
    if (!user) return;
    const { data, error } = await db.from("offer_share_links").insert({
      facilitator_id: user.id,
      offer_id: offer.id,
    }).select().single();
    if (!error && data) {
      setShareLinks(prev => [data, ...prev]);
      copyLink(data.tracking_code);
      toast({ title: "Lien traqué créé ✓", description: "Le lien a été copié dans votre presse-papier." });
    }
  };

  return (
    <UserLayout role="facilitateur" jarvisContext="passive-os">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 border" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", borderColor: "hsl(218 40% 25% / 0.5)" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Moon size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(24 100% 65%)" }}>Mode passif</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">Votre réseau travaille pendant que vous vivez.</h1>
              <p className="text-white/60 text-sm leading-relaxed">
                Importez vos contacts, obtenez des offres prêtes à partager, et laissez OpenClaw préparer le reste. Vous validez l'essentiel, le système fait le travail.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t flex gap-3 flex-wrap" style={{ borderColor: "hsl(218 40% 22% / 0.4)" }}>
            {[
              { label: "Contacts importés", value: contactsCount, icon: Users },
              { label: "Clics générés", value: totalClicks, icon: Link2 },
              { label: "Conversions", value: totalConverted, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex-1 min-w-[80px] text-center py-2 px-3 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                <Icon size={14} className="mx-auto mb-1 text-white/40" />
                <p className="font-bold text-white text-lg">{value}</p>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ÉTAPES ───────────────────────────────────────────── */}
        <div className="card-surface p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles size={15} className="text-primary" /> En 4 étapes, votre réseau rapporte
          </h2>
          <div className="space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Link key={step.n} to={step.to} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm" style={{ background: step.color }}>
                    {step.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── OFFRES DISPONIBLES ──────────────────────────────── */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Share2 size={15} className="text-primary" /> Offres prêtes à partager
            </h2>
            <Link to="/offres" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="py-6 text-center text-muted-foreground text-sm">Chargement…</div>
          ) : offers.length === 0 ? (
            <div className="py-6 text-center">
              <Share2 size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Aucune offre disponible pour le moment.</p>
              <p className="text-xs text-muted-foreground">Les entreprises publient des offres pour leurs missions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{offer.title}</p>
                      {offer.short_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.short_description}</p>
                      )}
                    </div>
                    <span className="badge-success shrink-0">Active</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {offer.whatsapp_text && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(offer.whatsapp_text!); toast({ title: "Texte WhatsApp copié ✓" }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors"
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </button>
                    )}
                    {offer.email_text && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(offer.email_text!); toast({ title: "Texte email copié ✓" }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-secondary transition-colors"
                      >
                        <Mail size={11} /> Email
                      </button>
                    )}
                    <button
                      onClick={() => generateLink(offer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Link2 size={11} /> Obtenir mon lien traqué
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MES LIENS & RÉSULTATS ───────────────────────────── */}
        {shareLinks.length > 0 && (
          <div className="card-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" /> Mes liens et résultats
              </h2>
            </div>
            <div className="space-y-2">
              {shareLinks.slice(0, 5).map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">{window.location.origin}/r/{link.tracking_code}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-foreground font-medium">{link.clicks_count} clics</span>
                      <span className="text-xs text-muted-foreground">{link.unique_clicks_count} uniques</span>
                      {link.converted && <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 35%)" }}>✓ Converti</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => copyLink(link.tracking_code)}
                    className="p-2 rounded-lg border border-border hover:bg-background transition-colors"
                  >
                    <Copy size={13} className="text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OPENCLAW ─────────────────────────────────────────── */}
        <div className="rounded-xl p-5 border" style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))", borderColor: "hsl(218 40% 25% / 0.4)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">OpenClaw prépare tout</p>
              <p className="text-white/50 text-xs">Textes, priorités, canaux, suggestions — déjà prêts.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: "/agents", label: "Mes agents", icon: Zap },
              { to: "/pilotage", label: "Pilotage", icon: Target },
              { to: "/offres", label: "Offres à partager", icon: Share2 },
              { to: "/import-reseau", label: "Importer mon réseau", icon: Upload },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors" style={{ background: "hsl(218 40% 16% / 0.5)", border: "1px solid hsl(218 40% 25% / 0.3)" }}>
                <Icon size={12} /> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── QUICK LINKS ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/import-reseau" className="btn-cta py-3 text-sm flex items-center justify-center gap-2">
            <Upload size={14} /> Importer mon réseau
          </Link>
          <Link to="/offres" className="py-3 text-sm rounded-xl font-semibold border border-primary text-primary flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
            <Share2 size={14} /> Voir les offres
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
