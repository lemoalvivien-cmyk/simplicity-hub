/**
 * OffresEntreprise — Gestion des offres entreprise + packs OpenClaw
 * "Publiez une offre. OpenClaw prépare le reste."
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Share2, Plus, Sparkles, Loader2, CheckCircle2,
  BarChart3, Users, Link2, Eye, Brain, Zap, ArrowRight,
  MessageCircle, Mail, Globe, Copy, Edit3
} from "lucide-react";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SharedOffer {
  id: string;
  title: string;
  short_description: string | null;
  whatsapp_text: string | null;
  email_text: string | null;
  social_text: string | null;
  status: string;
  created_at: string;
}

interface OfferStats {
  [offerId: string]: {
    links: number;
    clicks: number;
    unique: number;
    converted: number;
    facilitators: number;
  };
}

interface Mission {
  id: string;
  titre: string;
  recompense: string | null;
  secteur: string | null;
}

interface NewOfferForm {
  title: string;
  short_description: string;
  mission_id: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "hsl(152 62% 35%)", bg: "hsl(var(--success-light))" },
  paused: { label: "En pause", color: "hsl(38 80% 35%)", bg: "hsl(38 80% 90%)" },
  draft: { label: "Brouillon", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

export default function OffresEntreprise() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<OfferStats>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<NewOfferForm>({ title: "", short_description: "", mission_id: "" });

  const load = useCallback(async () => {
    if (!user) return;
    const [offersRes, missionsRes] = await Promise.all([
      db.from("shared_offers").select("*").eq("company_user_id", user.id).order("created_at", { ascending: false }),
      db.from("missions").select("id, titre, recompense, secteur").eq("entreprise_id", user.id).eq("statut", "active"),
    ]);
    const loadedOffers: SharedOffer[] = offersRes.data || [];
    setOffers(loadedOffers);
    setMissions(missionsRes.data || []);

    // Load stats per offer
    if (loadedOffers.length > 0) {
      const offerIds = loadedOffers.map(o => o.id);
      const { data: links } = await db.from("offer_share_links")
        .select("offer_id, clicks_count, unique_clicks_count, converted, facilitator_id")
        .in("offer_id", offerIds);
      if (links) {
        const statsMap: OfferStats = {};
        for (const link of links) {
          if (!link.offer_id) continue;
          if (!statsMap[link.offer_id]) {
            statsMap[link.offer_id] = { links: 0, clicks: 0, unique: 0, converted: 0, facilitators: 0 };
          }
          statsMap[link.offer_id].links += 1;
          statsMap[link.offer_id].clicks += link.clicks_count || 0;
          statsMap[link.offer_id].unique += link.unique_clicks_count || 0;
          if (link.converted) statsMap[link.offer_id].converted += 1;
        }
        // Count unique facilitators
        for (const offerId of offerIds) {
          const facilIds = new Set(links.filter(l => l.offer_id === offerId).map(l => l.facilitator_id));
          if (statsMap[offerId]) statsMap[offerId].facilitators = facilIds.size;
        }
        setStats(statsMap);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createOffer = async () => {
    if (!user || !form.title.trim()) return;
    setSubmitting(true);
    const { data, error } = await db.from("shared_offers").insert({
      company_user_id: user.id,
      title: form.title,
      short_description: form.short_description || null,
      mission_id: form.mission_id || null,
      status: "active",
    }).select().single();
    if (!error && data) {
      setOffers(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ title: "", short_description: "", mission_id: "" });
      toast({ title: "Offre publiée ✓", description: "Générez maintenant le pack OpenClaw." });
      // Auto-generate pack
      generatePack(data.id);
    } else {
      toast({ title: "Erreur", description: "Impossible de créer l'offre.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const generatePack = async (offerId: string) => {
    if (!user) return;
    setGeneratingId(offerId);
    try {
      const { error } = await supabase.functions.invoke("openclaw-generate-packs", {
        body: { shared_offer_id: offerId, language: "fr" },
      });
      if (error) throw error;
      await load();
      toast({ title: "Pack OpenClaw généré ✓", description: "Messages WhatsApp, email et post prêts à diffuser." });
    } catch (err) {
      toast({ title: "Erreur IA", description: "Impossible de générer le pack.", variant: "destructive" });
    } finally {
      setGeneratingId(null);
    }
  };

  const toggleStatus = async (offer: SharedOffer) => {
    const newStatus = offer.status === "active" ? "paused" : "active";
    await db.from("shared_offers").update({ status: newStatus }).eq("id", offer.id);
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: newStatus } : o));
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copié ✓` });
  };

  const totalClicks = Object.values(stats).reduce((s, v) => s + v.clicks, 0);
  const totalFacilitators = new Set(
    Object.values(stats).flatMap(() => [])
  ).size;
  const activeFacilitators = Object.values(stats).reduce((max, v) => max + v.facilitators, 0);

  return (
    <UserLayout role="entreprise" jarvisContext="offres-entreprise">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mes offres</h1>
            <p className="text-muted-foreground text-sm mt-1">Publiez une offre. OpenClaw prépare le reste.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus size={14} /> Nouvelle offre
          </button>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Offres actives", value: offers.filter(o => o.status === "active").length, icon: Share2, color: "hsl(var(--primary))" },
            { label: "Clics totaux", value: totalClicks, icon: BarChart3, color: "hsl(var(--primary))" },
            { label: "Facilitateurs", value: activeFacilitators, icon: Users, color: "hsl(152 62% 40%)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card-surface p-4 text-center">
              <Icon size={16} className="mx-auto mb-1.5" style={{ color }} />
              <p className="font-bold text-2xl text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Formulaire de création */}
        {showForm && (
          <div className="card-surface p-5 border-2 border-primary/30">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Plus size={14} className="text-primary" /> Nouvelle offre
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Titre de l'offre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Cherche décideurs RH dans les PME industrielles"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Description courte</label>
                <textarea
                  value={form.short_description}
                  onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))}
                  placeholder="Ce que vous cherchez, pour qui, ce que vous offrez au facilitateur…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              {missions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Lier à une mission (optionnel)</label>
                  <select
                    value={form.mission_id}
                    onChange={e => setForm(p => ({ ...p, mission_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Aucune mission —</option>
                    {missions.map(m => (
                      <option key={m.id} value={m.id}>{m.titre}{m.recompense ? ` · ${m.recompense}` : ""}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={createOffer}
                  disabled={!form.title.trim() || submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {submitting ? "Publication…" : "Publier + Générer le pack IA"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des offres */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : offers.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Share2 size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground mb-2">Aucune offre publiée</p>
            <p className="text-sm text-muted-foreground mb-4">Publiez votre première offre pour activer votre force commerciale passive.</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--gradient-primary)" }}>
              <Plus size={14} /> Créer ma première offre
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map(offer => {
              const s = stats[offer.id] || { links: 0, clicks: 0, unique: 0, converted: 0, facilitators: 0 };
              const statusStyle = STATUS_MAP[offer.status] || STATUS_MAP.draft;
              const hasMessages = offer.whatsapp_text || offer.email_text || offer.social_text;
              const isGenerating = generatingId === offer.id;

              return (
                <div key={offer.id} className="card-surface p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {statusStyle.label}
                        </span>
                        {hasMessages && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Pack prêt</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{offer.title}</h3>
                      {offer.short_description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{offer.short_description}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Liens", value: s.links, color: "hsl(var(--primary))" },
                      { label: "Clics", value: s.clicks, color: "hsl(var(--primary))" },
                      { label: "Facilitateurs", value: s.facilitators, color: "hsl(152 62% 40%)" },
                      { label: "Convertis", value: s.converted, color: "hsl(152 62% 40%)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center py-2 rounded-xl bg-muted">
                        <p className="font-bold text-foreground" style={value > 0 ? { color } : {}}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Packs de messages */}
                  {hasMessages && (
                    <div className="space-y-1.5">
                      {offer.whatsapp_text && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-2">
                            <MessageCircle size={12} className="text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">WhatsApp</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{offer.whatsapp_text.substring(0, 40)}…</span>
                          </div>
                          <button onClick={() => copyText(offer.whatsapp_text!, "WhatsApp")}
                            className="p-1.5 rounded-lg hover:bg-background transition-colors">
                            <Copy size={11} className="text-muted-foreground" />
                          </button>
                        </div>
                      )}
                      {offer.email_text && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">Email</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{offer.email_text.substring(0, 40)}…</span>
                          </div>
                          <button onClick={() => copyText(offer.email_text!, "Email")}
                            className="p-1.5 rounded-lg hover:bg-background transition-colors">
                            <Copy size={11} className="text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => generatePack(offer.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      {isGenerating ? "Génération…" : hasMessages ? "Regénérer le pack" : "Générer le pack IA"}
                    </button>
                    <button
                      onClick={() => toggleStatus(offer)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors"
                    >
                      {offer.status === "active" ? "Mettre en pause" : "Réactiver"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── OFFER INTELLIGENCE PANEL ──────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Conseils pour une offre qui tourne dans le réseau passif</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                icon: "🎯",
                title: "Titre actionnable",
                tip: "Un bon titre dit exactement ce que vous cherchez. Ex : "Cherche décideurs RH dans les PME industrielles du Maghreb".",
              },
              {
                icon: "💰",
                title: "Gain proposé clair",
                tip: "Indiquez le type et le montant de la récompense. Plus c'est précis, plus les facilitateurs s'engagent.",
              },
              {
                icon: "🌍",
                title: "Corridor et langue",
                tip: "Précisez les zones géographiques ciblées et la langue recommandée. Cela oriente le moteur de matching.",
              },
              {
                icon: "👤",
                title: "Profil cible précis",
                tip: "Décrivez le contact idéal : poste, secteur, taille d'entreprise. Plus c'est ciblé, moins c'est rejeté.",
              },
              {
                icon: "📦",
                title: "Générez le pack IA",
                tip: "Après publication, générez le pack OpenClaw : 7 formats de diffusion prêts (WhatsApp, email, post, pitch…).",
              },
            ].map(({ icon, title, tip }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
                <span className="text-lg shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA link to facilitateur marketplace */}
        <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{
          background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
          border: "1px solid hsl(218 40% 25% / 0.4)"
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Activez votre force passive</p>
              <p className="text-white/50 text-xs">OpenClaw sélectionne les meilleurs facilitateurs pour vos offres.</p>
            </div>
          </div>
          <Link to="/facilitateurs" className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white shrink-0">
            Voir <ArrowRight size={12} />
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
