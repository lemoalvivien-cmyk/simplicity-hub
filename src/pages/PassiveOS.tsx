/**
 * PassiveOS — Passive Facilitator OS / Hub passif industriel
 * "Votre réseau travaille pendant que vous vivez."
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Moon, Upload, Share2, Link2, TrendingUp, CheckCircle2,
  ArrowRight, Sparkles, Copy, MessageCircle, Brain,
  ChevronRight, Users, Target, Flame, BarChart3,
  Wifi, WifiOff, Clock, Zap
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

interface SharedOffer {
  id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
  status: string;
}

const STEPS = [
  {
    n: "1", title: "Importez votre réseau",
    desc: "CSV ou Excel en 30 secondes. Vos contacts sont dans le système.",
    icon: Upload, to: "/import-reseau", cta: "Importer",
    color: "hsl(218 72% 55%)",
  },
  {
    n: "2", title: "Choisissez une offre",
    desc: "Parcourez les offres. OpenClaw prépare les messages à votre place.",
    icon: Share2, to: "/offres", cta: "Voir les offres",
    color: "hsl(var(--primary))",
  },
  {
    n: "3", title: "Partagez votre lien traqué",
    desc: "WhatsApp, email, LinkedIn — copiez et envoyez. Chaque clic est suivi.",
    icon: Link2, to: "/offres", cta: "Mes liens",
    color: "hsl(152 62% 40%)",
  },
  {
    n: "4", title: "Suivez et gagnez",
    desc: "Clic → intérêt → opportunité → introduction → gain. Tout est tracé.",
    icon: TrendingUp, to: "/gains", cta: "Mes gains",
    color: "hsl(38 80% 40%)",
  },
];

const CHANNELS = [
  { label: "WhatsApp", status: "ready", desc: "Copiez-collez · Prêt", icon: "💬", color: "hsl(142 70% 45%)" },
  { label: "Email", status: "ready", desc: "Copiez-collez · Prêt", icon: "📧", color: "hsl(var(--primary))" },
  { label: "LinkedIn", status: "assisted", desc: "Mode assisté · 1 message à la fois", icon: "💼", color: "hsl(218 80% 55%)" },
  { label: "Lien direct", status: "ready", desc: "Partagez partout · Traqué", icon: "🔗", color: "hsl(24 100% 52%)" },
  { label: "Facebook", status: "assisted", desc: "Mode assisté · Contenu préparé", icon: "📘", color: "hsl(220 70% 55%)" },
  { label: "SMS / Appel", status: "soon", desc: "Bientôt disponible", icon: "📱", color: "hsl(var(--muted-foreground))" },
];

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  ready: { label: "Prêt", color: "hsl(152 62% 35%)", bg: "hsl(var(--success-light))" },
  assisted: { label: "Assisté", color: "hsl(38 80% 35%)", bg: "hsl(38 80% 90%)" },
  soon: { label: "Bientôt", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

export default function PassiveOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsCount, setContactsCount] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalInterests, setTotalInterests] = useState(0);
  const [totalConverted, setTotalConverted] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [linksRes, offersRes, contactsRes] = await Promise.all([
        db.from("offer_share_links").select("*").eq("facilitator_id", user.id).order("created_at", { ascending: false }).limit(10),
        db.from("shared_offers").select("id, title, short_description, whatsapp_text, status").eq("status", "active").limit(4),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
      ]);
      const links: ShareLink[] = linksRes.data || [];
      setShareLinks(links);
      setOffers(offersRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setTotalClicks(links.reduce((s, l) => s + (l.clicks_count || 0), 0));
      setTotalInterests(links.reduce((s, l) => s + (l.qualified_interest_count || 0), 0));
      setTotalConverted(links.filter(l => l.converted).length);
      setLoading(false);
    };
    load();
  }, [user]);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
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
      toast({ title: "Lien traqué créé ✓", description: "Copié dans votre presse-papier." });
    }
  };

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
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(24 100% 65%)" }}>Mode passif</span>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(152 62% 35% / 0.2)", color: "hsl(152 62% 65%)" }}>
                    <Wifi size={9} /> Actif
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold text-white mb-1">Votre réseau travaille pendant que vous vivez.</h1>
                <p className="text-white/55 text-sm">Importez, partagez, suivez. OpenClaw prépare le reste.</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Contacts", value: loading ? "…" : contactsCount, icon: Users },
                { label: "Clics", value: loading ? "…" : totalClicks, icon: BarChart3 },
                { label: "Intérêts", value: loading ? "…" : totalInterests, icon: Flame },
                { label: "Convertis", value: loading ? "…" : totalConverted, icon: CheckCircle2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center py-2.5 px-2 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                  <Icon size={12} className="mx-auto mb-1 text-white/40" />
                  <p className="font-bold text-white text-lg leading-none">{value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EN 4 ÉTAPES ───────────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
            <Sparkles size={14} className="text-primary" /> Votre réseau rapporte en 4 étapes
          </h2>
          <div className="space-y-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Link key={step.n} to={step.to}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-secondary transition-colors group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
                    style={{ background: step.color }}>
                    {step.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── OFFRES PRÊTES ────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Share2 size={14} className="text-primary" /> Offres prêtes pour vous
            </h2>
            <Link to="/offres" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <div className="py-6 text-center text-muted-foreground text-sm">Chargement…</div>
          ) : offers.length === 0 ? (
            <div className="py-6 text-center">
              <Share2 size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune offre disponible pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.slice(0, 3).map((offer) => {
                const hasLink = shareLinks.some(l => l.offer_id === offer.id);
                const existingLink = shareLinks.find(l => l.offer_id === offer.id);
                return (
                  <div key={offer.id} className="p-3.5 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{offer.title}</p>
                        {offer.short_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{offer.short_description}</p>
                        )}
                      </div>
                      {existingLink && (
                        <span className="text-xs font-semibold shrink-0" style={{ color: "hsl(152 62% 40%)" }}>
                          {existingLink.clicks_count} clics
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {offer.whatsapp_text && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(offer.whatsapp_text!); toast({ title: "WhatsApp copié ✓" }); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-background transition-colors">
                          <MessageCircle size={10} /> WhatsApp
                        </button>
                      )}
                      {hasLink ? (
                        <button
                          onClick={() => copyLink(existingLink!.tracking_code)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-primary text-primary hover:bg-primary/5 transition-colors">
                          <Copy size={10} /> Copier lien
                        </button>
                      ) : (
                        <button
                          onClick={() => generateLink(offer)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "var(--gradient-primary)" }}>
                          <Link2 size={10} /> Lien traqué
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MES LIENS & RÉSULTATS ────────────────────────────── */}
        {shareLinks.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <TrendingUp size={14} className="text-primary" /> Mes liens et résultats
              </h2>
              <Link to="/offres" className="text-xs text-primary font-medium hover:underline">Tout voir</Link>
            </div>
            <div className="space-y-2">
              {shareLinks.slice(0, 4).map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-semibold text-foreground">{link.clicks_count} clics</span>
                      <span className="text-xs text-muted-foreground">{link.unique_clicks_count} uniques</span>
                      {(link.qualified_interest_count || 0) > 0 && (
                        <span className="text-xs font-semibold" style={{ color: "hsl(38 80% 40%)" }}>
                          🔥 {link.qualified_interest_count} intérêts
                        </span>
                      )}
                      {link.converted && <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 35%)" }}>✓ Converti</span>}
                    </div>
                  </div>
                  <button onClick={() => copyLink(link.tracking_code)}
                    className="p-2 rounded-lg border border-border hover:bg-background transition-colors">
                    <Copy size={12} className="text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CANAUX ───────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
            <Zap size={14} className="text-primary" /> Mes canaux de diffusion
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map(({ label, status, desc, icon, color }) => {
              const style = STATUS_STYLES[status];
              return (
                <div key={label} className="p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{icon}</span>
                    <span className="font-semibold text-foreground text-xs">{label}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── OPENCLAW ASSISTANT ───────────────────────────────── */}
        <div className="rounded-xl p-5 border" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          borderColor: "hsl(218 40% 25% / 0.4)"
        }}>
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
              { to: "/offres", label: "Offres à partager", icon: Share2 },
              { to: "/import-reseau", label: "Importer mon réseau", icon: Upload },
              { to: "/gains", label: "Mes gains", icon: TrendingUp },
              { to: "/agents", label: "Mes agents IA", icon: Brain },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: "hsl(218 40% 16% / 0.5)", border: "1px solid hsl(218 40% 25% / 0.3)" }}>
                <Icon size={12} /> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
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
