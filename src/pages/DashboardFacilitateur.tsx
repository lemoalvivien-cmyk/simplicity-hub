/**
 * Dashboard Facilitateur — Passive Facilitator OS
 * "Votre réseau travaille pendant que vous vivez."
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Moon, Share2, TrendingUp, CheckCircle2, ArrowRight,
  MessageCircle, Zap, Sparkles, Loader2, Brain, Bell,
  Link2, Upload, Star, ShieldCheck, Users, Trophy
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import VoiceWelcome from "@/components/ai/VoiceWelcome";

interface ShareLink {
  id: string;
  tracking_code: string;
  clicks_count: number;
  unique_clicks_count: number;
  converted: boolean;
  last_click_at: string | null;
}

interface SharedOffer {
  id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
}

interface Request {
  id: string;
  request_context: string | null;
  status: string;
  openclaw_note: string | null;
}

interface Gain {
  id: string;
  montant: number | null;
  statut: string;
}

export default function DashboardFacilitateur() {
  const { user, profile } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [gains, setGains] = useState<Gain[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [introsCount, setIntrosCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const prenom = profile?.prenom || "vous";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [linksRes, offersRes, reqRes, gainsRes, contactsRes, introsRes] = await Promise.all([
        db.from("offer_share_links").select("id, tracking_code, clicks_count, unique_clicks_count, converted, last_click_at")
          .eq("facilitator_id", user.id).order("created_at", { ascending: false }).limit(5),
        db.from("shared_offers").select("id, title, short_description, whatsapp_text").eq("status", "active").limit(3),
        db.from("facilitator_requests").select("id, request_context, status, openclaw_note")
          .eq("facilitator_user_id", user.id).in("status", ["envoyee", "vue"]).order("created_at", { ascending: false }).limit(3),
        db.from("gains").select("id, montant, statut").eq("facilitateur_id", user.id),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("introductions").select("id", { count: "exact", head: true }).eq("facilitateur_id", user.id),
      ]);
      setShareLinks(linksRes.data || []);
      setOffers(offersRes.data || []);
      setRequests(reqRes.data || []);
      setGains(gainsRes.data || []);
      setContactsCount(contactsRes.count || 0);
      setIntrosCount(introsRes.count || 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const acceptRequest = async (reqId: string) => {
    setAcceptingId(reqId);
    await db.from("facilitator_requests").update({ status: "acceptee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
    setAcceptingId(null);
  };

  const declineRequest = async (reqId: string) => {
    await db.from("facilitator_requests").update({ status: "refusee" }).eq("id", reqId);
    setRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${code}`);
  };

  const totalClicks = shareLinks.reduce((s, l) => s + (l.clicks_count || 0), 0);
  const converted = shareLinks.filter(l => l.converted).length;
  const totalValide = gains.filter(g => g.statut === "valide").reduce((s, g) => s + (g.montant || 0), 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + (g.montant || 0), 0);

  return (
    <UserLayout role="facilitateur" jarvisContext="dashboard-facilitateur">
      <VoiceWelcome context="dashboard-facilitateur" userName={prenom} />
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── HERO PASSIF ─────────────────────────────────── */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.5)"
        }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 70% 80% at 20% 50%, hsl(24 100% 52% / 0.06) 0%, transparent 70%)"
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Moon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Bonjour {prenom} 👋</p>
                <p className="text-white/50 text-xs mt-0.5">Votre réseau travaille pendant que vous vivez.</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {requests.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "hsl(24 100% 52% / 0.2)", color: "hsl(24 100% 65%)" }}>
                  <Bell size={10} /> {requests.length} en attente
                </span>
              )}
            </div>
          </div>
          {/* Stats passsives */}
          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Contacts", value: loading ? "…" : contactsCount, icon: Users },
              { label: "Clics générés", value: loading ? "…" : totalClicks, icon: Link2 },
              { label: "Introductions", value: loading ? "…" : introsCount, icon: Share2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center py-2.5 px-2 rounded-xl" style={{ background: "hsl(218 40% 16% / 0.6)" }}>
                <Icon size={12} className="mx-auto mb-1 text-white/40" />
                <p className="font-bold text-white text-lg leading-none">{value}</p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOC 1 — VALIDATIONS EN ATTENTE ─────────────── */}
        {requests.length > 0 && (
          <div className="rounded-xl border-2 p-5" style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">À valider maintenant</p>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--primary))" }}>
                {requests.length}
              </span>
            </div>
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-background rounded-xl p-4 space-y-3 border border-border">
                  <p className="text-sm font-medium text-foreground">Une entreprise demande votre introduction</p>
                  {req.openclaw_note && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(218 65% 10%)" }}>
                      <Sparkles size={11} className="text-white/60 shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">{req.openclaw_note}</p>
                    </div>
                  )}
                  {req.request_context && <p className="text-xs text-muted-foreground italic">"{req.request_context}"</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptRequest(req.id)}
                      disabled={acceptingId === req.id}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {acceptingId === req.id ? "…" : "✓ Accepter"}
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BLOC 2 — OFFRES PRÊTES À PARTAGER ──────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Share2 size={14} className="text-primary" /> Offres prêtes à partager
            </h2>
            <Link to="/offres" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Tout voir <ArrowRight size={10} />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-5"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : offers.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
              <Share2 size={22} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Aucune offre disponible</p>
              <p className="text-xs text-muted-foreground mb-3">Les entreprises publient bientôt des offres à partager.</p>
              <Link to="/missions" className="text-xs text-primary font-semibold hover:underline">Voir les missions →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-xl border border-border" style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                  <p className="font-semibold text-foreground text-sm mb-1">{offer.title}</p>
                  {offer.short_description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{offer.short_description}</p>
                  )}
                  <div className="flex gap-2">
                    {offer.whatsapp_text && (
                      <button
                        onClick={() => navigator.clipboard.writeText(offer.whatsapp_text!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-background transition-colors"
                      >
                        <MessageCircle size={10} /> Copier WhatsApp
                      </button>
                    )}
                    <Link
                      to="/offres"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Link2 size={10} /> Lien traqué
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BLOC 3 — MES LIENS & RÉSULTATS ─────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-primary" /> Mes liens & résultats
            </h2>
            <Link to="/offres" className="text-xs text-primary font-medium hover:underline">Gérer</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-5"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : shareLinks.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
              <Link2 size={22} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Aucun lien créé</p>
              <p className="text-xs text-muted-foreground mb-3">Créez votre premier lien traqué depuis une offre ou une mission.</p>
              <Link to="/offres" className="text-xs text-primary font-semibold hover:underline">Voir les offres →</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Liens actifs", value: shareLinks.length },
                  { label: "Clics totaux", value: totalClicks },
                  { label: "Convertis", value: converted },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center py-3 rounded-xl bg-muted">
                    <p className="font-bold text-xl text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {shareLinks.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{
                      background: link.converted ? "hsl(var(--success-light))" : "hsl(var(--secondary))"
                    }}>
                      {link.converted
                        ? <CheckCircle2 size={13} style={{ color: "hsl(var(--success))" }} />
                        : <Link2 size={13} className="text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground truncate">/r/{link.tracking_code}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-foreground">{link.clicks_count} clics</span>
                        {link.converted && <span className="text-xs font-semibold" style={{ color: "hsl(152 62% 35%)" }}>✓ Converti</span>}
                      </div>
                    </div>
                    <button onClick={() => copyLink(link.tracking_code)} className="p-1.5 rounded-lg border border-border hover:bg-background transition-colors">
                      <Share2 size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── BLOC 4 — CE QUI CHAUFFE ─────────────────────── */}
        <Link to="/chaud" className="rounded-xl border-2 p-5 flex items-center justify-between gap-4 hover:opacity-90 transition-all" style={{
          borderColor: "hsl(24 100% 52% / 0.4)",
          background: "linear-gradient(135deg, hsl(24 80% 8%), hsl(38 70% 11%))"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" }}>
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ce qui chauffe maintenant</p>
              <p className="text-white/50 text-xs mt-0.5">Intérêts · Signaux · Opportunités passives</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-white/50 shrink-0" />
        </Link>

        {/* ── BLOC 5 — MES GAINS ──────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Trophy size={14} className="text-primary" /> Mes gains
            </h2>
            <Link to="/gains" className="text-xs text-primary font-medium hover:underline">Détail</Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-5"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : gains.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
              <Trophy size={22} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Vos gains arrivent ici</p>
              <p className="text-xs text-muted-foreground">Chaque introduction validée génère un gain traçable.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--success-light))" }}>
                <p className="font-bold text-2xl" style={{ color: "hsl(var(--success))" }}>{totalValide} €</p>
                <p className="text-xs text-muted-foreground mt-0.5">Validés</p>
              </div>
              <div className="p-4 rounded-xl text-center bg-muted">
                <p className="font-bold text-2xl text-foreground">{totalAttendu} €</p>
                <p className="text-xs text-muted-foreground mt-0.5">En attente</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CONFIANCE — CTA ──────────────────────────────── */}
        <Link to="/trust" className="rounded-xl border p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-all" style={{
          background: "linear-gradient(135deg, hsl(142 62% 4%), hsl(218 65% 8%))",
          borderColor: "hsl(142 62% 35% / 0.35)"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(142 62% 35%), hsl(218 72% 45%))" }}>
              <ShieldCheck size={17} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Ma confiance & réputation</p>
              <p className="text-white/50 text-xs">Introductions protégées · Score · Historique</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/50 shrink-0" />
        </Link>

        {/* ── MODE PASSIF — CTA ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/passive" className="rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 transition-all" style={{
            background: "linear-gradient(135deg, hsl(218 65% 12%), hsl(218 60% 15%))",
            border: "1px solid hsl(218 40% 25% / 0.5)"
          }}>
            <Moon size={18} className="text-white" />
            <p className="font-semibold text-white text-sm">Mode passif</p>
            <p className="text-white/50 text-xs">Hub complet</p>
          </Link>
          <Link to="/import-reseau" className="rounded-xl p-4 flex flex-col gap-2 border border-border hover:bg-secondary transition-colors">
            <Upload size={18} className="text-primary" />
            <p className="font-semibold text-foreground text-sm">Importer réseau</p>
            <p className="text-xs text-muted-foreground">CSV / Excel</p>
          </Link>
        </div>

        {/* ── OPENCLAW ─────────────────────────────────────── */}
        <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.4)"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">OpenClaw prépare tout</p>
              <p className="text-white/40 text-xs">Textes · Priorités · Suggestions</p>
            </div>
          </div>
          <Link to="/agents" className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-colors shrink-0" style={{
            background: "hsl(218 40% 20% / 0.6)",
            border: "1px solid hsl(218 40% 30% / 0.4)"
          }}>
            Mes agents
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
