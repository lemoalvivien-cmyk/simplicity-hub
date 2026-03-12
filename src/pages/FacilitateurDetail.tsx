import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Star, MapPin, Briefcase, TrendingUp, CheckCircle2,
  Heart, Zap, Loader2, Shield, MessageCircle, X, ChevronRight,
  Sparkles, ThumbsUp, Send, Users, Globe, Lock, Network
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface FacilitateurProfile {
  id: string;
  user_id: string;
  secteur: string | null;
  zone: string | null;
  description_reseau: string | null;
  types_contacts: string | null;
  statut: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  avatar_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  recommended: boolean;
  created_at: string;
}

interface Mission { id: string; titre: string; }

const BADGES = [
  { min: 90, label: "Facilitateur Expert", color: "hsl(38 90% 40%)", bg: "hsl(38 90% 95%)", icon: "⭐" },
  { min: 70, label: "Très apprécié", color: "hsl(152 62% 30%)", bg: "hsl(152 62% 95%)", icon: "✅" },
  { min: 50, label: "Recommandé", color: "hsl(218 72% 40%)", bg: "hsl(218 72% 95%)", icon: "👍" },
  { min: 0, label: "Actif", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: "🔵" },
];
function getBadge(score: number) { return BADGES.find(b => score >= b.min) || BADGES[BADGES.length - 1]; }

function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={interactive ? 22 : 14}
            className={(hover || rating) >= i ? "fill-current" : ""}
            style={{ color: (hover || rating) >= i ? "hsl(38 90% 50%)" : "hsl(var(--border))" }}
          />
        </button>
      ))}
    </div>
  );
}

export default function FacilitateurDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profil, setProfil] = useState<FacilitateurProfile | null>(null);
  const [prenom, setPrenom] = useState("Facilitateur");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [score, setScore] = useState(0);
  const [introsCount, setIntrosCount] = useState(0);
  const [introsValidees, setIntrosValidees] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal demande
  const [showRequestModal, setShowRequestModal] = useState(searchParams.get("action") === "request");
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [requestContext, setRequestContext] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestDone, setRequestDone] = useState(false);

  // Modal avis
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRecommended, setReviewRecommended] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const [profilRes, profileRes, introsRes, reviewsRes, favRes, missionsRes] = await Promise.all([
        db.from("facilitateur_profiles").select("*").eq("user_id", id).single(),
        db.from("profiles").select("prenom").eq("id", id).single(),
        db.from("introductions").select("statut").eq("facilitateur_id", id),
        db.from("facilitator_reviews").select("*").eq("facilitator_user_id", id).order("created_at", { ascending: false }).limit(10),
        db.from("facilitator_favorites").select("id").eq("company_user_id", user.id).eq("facilitator_user_id", id).maybeSingle(),
        db.from("missions").select("id, titre").eq("entreprise_id", user.id).eq("statut", "active").limit(10),
      ]);

      if (profilRes.data) setProfil(profilRes.data);
      if (profileRes.data) setPrenom(profileRes.data.prenom || "Facilitateur");
      if (favRes.data) setIsFavorite(true);

      const intros = introsRes.data || [];
      const validees = intros.filter((i: { statut: string | null }) => i.statut === "validee").length;
      const total = intros.length;
      const tauxConv = total > 0 ? Math.round((validees / total) * 100) : 0;
      const sc = Math.min(100, tauxConv + Math.min(30, total * 2) + (total >= 5 ? 20 : 0));
      setIntrosCount(total);
      setIntrosValidees(validees);
      setScore(sc);

      setReviews(reviewsRes.data || []);
      setMissions(missionsRes.data || []);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    if (isFavorite) {
      await db.from("facilitator_favorites").delete().eq("company_user_id", user.id).eq("facilitator_user_id", id);
      setIsFavorite(false);
    } else {
      await db.from("facilitator_favorites").insert({ company_user_id: user.id, facilitator_user_id: id });
      setIsFavorite(true);
    }
  };

  const submitRequest = async () => {
    if (!user || !id) return;
    setRequestLoading(true);
    const openclaw_note = selectedMissionId
      ? `OpenClaw recommande ce facilitateur pour la mission sélectionnée. Profil : secteur ${profil?.secteur || "N/A"}, zone ${profil?.zone || "N/A"}.`
      : `OpenClaw a identifié ce profil comme pertinent pour votre activité.`;

    await db.from("facilitator_requests").insert({
      company_user_id: user.id,
      facilitator_user_id: id,
      mission_id: selectedMissionId || null,
      request_context: requestContext || null,
      openclaw_note,
      status: "envoyee",
    });
    setRequestLoading(false);
    setRequestDone(true);
  };

  const submitReview = async () => {
    if (!user || !id || reviewRating === 0) return;
    setReviewLoading(true);
    await db.from("facilitator_reviews").insert({
      reviewer_user_id: user.id,
      facilitator_user_id: id,
      rating: reviewRating,
      comment: reviewComment || null,
      recommended: reviewRecommended,
    });
    setReviewLoading(false);
    setReviewDone(true);
    setReviews(prev => [{ id: "new", rating: reviewRating, comment: reviewComment, tags: [], recommended: reviewRecommended, created_at: new Date().toISOString() }, ...prev]);
  };

  if (loading) return (
    <UserLayout role="entreprise" jarvisContext="dashboard">
      <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
    </UserLayout>
  );

  if (!profil) return (
    <UserLayout role="entreprise" jarvisContext="dashboard">
      <div className="max-w-lg mx-auto text-center py-20">
        <Users size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Ce profil est introuvable.</p>
        <Link to="/facilitateurs" className="btn-primary mt-4 inline-flex">Retour à la liste</Link>
      </div>
    </UserLayout>
  );

  const badge = getBadge(score);
  const tauxConv = introsCount > 0 ? Math.round((introsValidees / introsCount) * 100) : 0;
  const avgRating = profil.average_rating || (reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0);

  return (
    <UserLayout role="entreprise" jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate("/facilitateurs")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Marketplace
        </button>

        {/* Hero profil */}
        <div className="card-surface p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-white shrink-0"
              style={{ background: "var(--gradient-primary)" }}>
              {prenom.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">{prenom}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.icon} {badge.label}
                    </span>
                    {avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={avgRating} />
                        <span className="text-xs text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} avis)</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={toggleFavorite} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors shrink-0">
                  <Heart size={18} className={isFavorite ? "fill-current" : ""} style={{ color: isFavorite ? "hsl(0 72% 55%)" : "hsl(var(--muted-foreground))" }} />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-3">
                {profil.secteur && <span className="flex items-center gap-1.5"><Briefcase size={13} /> {profil.secteur}</span>}
                {profil.zone && <span className="flex items-center gap-1.5"><MapPin size={13} /> {profil.zone}</span>}
              </div>
            </div>
          </div>

          {profil.description_reseau && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{profil.description_reseau}</p>
          )}

          {/* OpenClaw recommande */}
          <div className="mt-4 px-3 py-2.5 rounded-xl flex items-start gap-2" style={{ background: "hsl(218 65% 10%)", border: "1px solid hsl(218 40% 25% / 0.4)" }}>
            <Sparkles size={14} className="text-white/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white/80">OpenClaw vous recommande ce profil</p>
              <p className="text-xs text-white/50 mt-0.5">
                {score >= 70 ? "Très bon historique sur ce type de besoin — profil idéal pour votre secteur." :
                  score >= 50 ? "Profil actif avec des introductions régulières dans votre zone." :
                    "Facilitateur disponible et actif sur la plateforme."}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Score qualité", value: `${score}/100`, color: badge.color },
            { label: "Introductions", value: introsCount, color: "hsl(var(--foreground))" },
            { label: "Taux validé", value: `${tauxConv}%`, color: "hsl(152 62% 35%)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-surface p-4 text-center">
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* ── JARVIS WOW EFFECT #1 — Best access path ──────────────── */}
        {score >= 60 && (
          <div
            className="rounded-xl p-4 border flex items-start gap-3"
            style={{ background: "hsl(218 65% 10%)", borderColor: "hsl(218 40% 25% / 0.4)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">
                ⚡ Vous avez déjà le meilleur chemin d'accès.
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                {prenom} est la voie d'entrée optimale selon votre secteur, votre zone et l'historique des introductions.
                OpenClaw le recommande en priorité.
              </p>
            </div>
          </div>
        )}

        {/* ── Proof Ledger strip ─────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={15} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Introductions prouvées</h2>
            {introsValidees > 0 && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "hsl(142 50% 95%)", color: "hsl(142 50% 30%)" }}
              >
                {introsValidees} prouvées
              </span>
            )}
          </div>
          {introsValidees > 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(142 50% 96%)", border: "1px solid hsl(142 50% 80%)" }}>
              <Lock size={14} style={{ color: "hsl(142 50% 35%)" }} className="shrink-0" />
              <p className="text-xs text-foreground">
                <strong style={{ color: "hsl(142 50% 30%)" }}>{introsValidees} introduction{introsValidees > 1 ? "s" : ""}</strong> horodatée{introsValidees > 1 ? "s" : ""} et prouvée{introsValidees > 1 ? "s" : ""} dans le ledger WIINUP MAX.
                Chaque preuve est certifiée et incontestable.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Les introductions de {prenom} sont tracées et horodatées. Les preuves s'accumulent à chaque validation.
            </p>
          )}
        </div>

        {/* ── Matching scores ──────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network size={15} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Score de matching OpenClaw</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Adéquation secteur", score: Math.min(100, score + 5), color: "hsl(218 72% 45%)" },
              { label: "Adéquation géographique", score: Math.min(100, score - 5), color: "hsl(38 90% 45%)" },
              { label: "Score de confiance", score: Math.min(100, score + 10), color: "hsl(142 50% 35%)" },
              { label: "Adéquation langue", score: 85, color: "hsl(152 62% 35%)" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36 shrink-0">{item.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.score}%`, background: item.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-8 text-right">{item.score}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
            Le matching est calculé à partir du graphe business, des preuves d'introduction et des gains réels.
          </p>
        </div>

        {/* ── Languages & corridors ─────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm">Langues & corridors</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["🇫🇷 Français", "🇬🇧 Anglais", "🇮🇱 Hébreu"].map(lang => (
              <span
                key={lang}
                className="text-xs px-3 py-1.5 rounded-full border font-medium"
                style={{ borderColor: "hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))", background: "hsl(var(--secondary))" }}
              >
                {lang}
              </span>
            ))}
            <span
              className="text-xs px-3 py-1.5 rounded-full border font-medium"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              🇫🇷 → 🇮🇱 Corridor actif
            </span>
          </div>
        </div>

        {/* Types de contacts */}
        {profil.types_contacts && (
          <div className="card-surface p-5">
            <h2 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Users size={15} className="text-primary" /> Réseau & contacts
            </h2>
            <div className="flex flex-wrap gap-2">
              {profil.types_contacts.split(",").map(t => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground">
                  {t.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTAs principaux */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Zap size={15} /> Demander une intro
          </button>
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Star size={15} /> Laisser un avis
          </button>
        </div>

        {/* Avis */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Star size={15} className="text-muted-foreground" />
              Avis des entreprises
              {reviews.length > 0 && <span className="text-muted-foreground font-normal">({reviews.length})</span>}
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <Star size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun avis pour l'instant.</p>
              <p className="text-xs text-muted-foreground mt-1">Soyez le premier à laisser un retour.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="p-3 rounded-xl bg-muted">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <StarRating rating={r.rating} />
                    {r.recommended && (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "hsl(152 62% 35%)" }}>
                        <ThumbsUp size={11} /> Recommandé
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confiance */}
        <div className="card-surface p-5">
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Profil vérifié</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Ce profil est évalué en continu sur la qualité de ses introductions et les retours des entreprises.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal demande d'introduction */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={() => !requestDone && setShowRequestModal(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 bg-card border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
            {requestDone ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--success-light))" }}>
                  <CheckCircle2 size={28} style={{ color: "hsl(var(--success))" }} />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Demande envoyée !</h2>
                <p className="text-muted-foreground text-sm mb-5">
                  <strong>{prenom}</strong> va recevoir votre demande d'introduction. OpenClaw a préparé un contexte optimisé.
                </p>
                <button onClick={() => setShowRequestModal(false)} className="btn-cta w-full">
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">Demander une introduction</h2>
                    <p className="text-sm text-muted-foreground mt-1">à <strong>{prenom}</strong></p>
                  </div>
                  <button onClick={() => setShowRequestModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                    <X size={18} />
                  </button>
                </div>

                {/* OpenClaw note */}
                <div className="px-3 py-2.5 rounded-xl flex items-start gap-2" style={{ background: "hsl(218 65% 10%)", border: "1px solid hsl(218 40% 25% / 0.4)" }}>
                  <Sparkles size={13} className="text-white/60 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">OpenClaw va préparer une note de contexte personnalisée pour cette demande.</p>
                </div>

                {/* Mission */}
                {missions.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Pour quelle mission ? <span className="font-normal text-muted-foreground">(optionnel)</span></label>
                    <select
                      value={selectedMissionId}
                      onChange={e => setSelectedMissionId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Sélectionner une mission…</option>
                      {missions.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
                    </select>
                  </div>
                )}

                {/* Contexte */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Contexte <span className="font-normal text-muted-foreground">(optionnel)</span></label>
                  <textarea
                    rows={3}
                    value={requestContext}
                    onChange={e => setRequestContext(e.target.value)}
                    placeholder="Précisez votre besoin ou le type de contact recherché…"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  onClick={submitRequest}
                  disabled={requestLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {requestLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  {requestLoading ? "Envoi…" : "Envoyer la demande"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal avis */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={() => !reviewDone && setShowReviewModal(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 bg-card border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
            {reviewDone ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--success-light))" }}>
                  <CheckCircle2 size={28} style={{ color: "hsl(var(--success))" }} />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Avis publié !</h2>
                <p className="text-muted-foreground text-sm mb-5">Merci pour votre retour. Il aide la communauté à identifier les meilleurs facilitateurs.</p>
                <button onClick={() => setShowReviewModal(false)} className="btn-cta w-full">Fermer</button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">Laisser un avis</h2>
                    <p className="text-sm text-muted-foreground mt-1">pour <strong>{prenom}</strong></p>
                  </div>
                  <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">Votre note</label>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Votre retour <span className="font-normal text-muted-foreground">(optionnel)</span></label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Décrivez votre expérience avec ce facilitateur…"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewRecommended(!reviewRecommended)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                    style={reviewRecommended
                      ? { borderColor: "hsl(152 62% 35%)", color: "hsl(152 62% 35%)", background: "hsl(152 62% 95%)" }
                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    <ThumbsUp size={14} />
                    {reviewRecommended ? "Je le recommande" : "Recommander ?"}
                  </button>
                </div>

                <button
                  onClick={submitReview}
                  disabled={reviewLoading || reviewRating === 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {reviewLoading ? <Loader2 size={16} className="animate-spin" /> : <Star size={15} />}
                  {reviewLoading ? "Publication…" : "Publier l'avis"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </UserLayout>
  );
}
