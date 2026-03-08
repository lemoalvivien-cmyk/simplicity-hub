/**
 * CampagneDetail — réel depuis Supabase.
 * Foundation Lock v2:
 * - UUID invalide → redirect immédiat sans crash
 * - Campagne introuvable → message clair + redirect
 * - Erreur réseau → état d'erreur propre
 * - Section séquences honnêtement absente (pas de fausse promesse)
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Play, PauseCircle, CheckCircle2, Users,
  Mail, Clock, BarChart2, ChevronRight,
  Loader2, AlertCircle, Sparkles, MessageCircle, XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type CampagneStatus = "brouillon" | "en_cours" | "terminee" | "en_pause";

interface Campagne {
  id: string;
  nom: string;
  objectif: string | null;
  mode_action: string | null;
  canal_principal: string | null;
  statut: CampagneStatus;
  liste_id: string | null;
  created_at: string;
  owner_user_id: string;
}

// Validate UUID format to avoid unnecessary DB calls
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusConfig: Record<CampagneStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  brouillon: { label: "Brouillon",  color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",          icon: <Clock size={13} /> },
  en_cours:  { label: "En cours",   color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))",       icon: <Play size={13} /> },
  terminee:  { label: "Terminée",   color: "hsl(142 72% 29%)",             bg: "hsl(142 72% 95%)",            icon: <CheckCircle2 size={13} /> },
  en_pause:  { label: "En pause",   color: "hsl(38 80% 30%)",              bg: "hsl(var(--accent-light))",    icon: <PauseCircle size={13} /> },
};

const canalLabel: Record<string, string> = {
  email: "Email", telephone: "Téléphone", import: "Import",
  introduction: "Introduction", campagne: "Campagne", autre: "Autre",
};

const modeLabel: Record<string, string> = {
  manuel: "Manuel", assiste: "Assisté", semi_auto: "Semi-auto",
};

export default function CampagneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    // Guard: validate UUID before hitting DB
    if (!UUID_RE.test(id)) {
      setLoadError("Identifiant de campagne invalide.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("campagnes")
        .select("*")
        .eq("id", id)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("CampagneDetail load error:", error.message);
        setLoadError("Erreur lors du chargement de la campagne. Réessayez.");
        setLoading(false);
        return;
      }

      if (!data) {
        setLoadError("Cette campagne est introuvable ou ne vous appartient pas.");
        setLoading(false);
        return;
      }

      setCampagne(data as Campagne);
      setLoading(false);
    };

    load();
  }, [id, user]);

  const handleStatusChange = async (newStatus: CampagneStatus) => {
    if (!campagne) return;
    setUpdating(true);
    const { error } = await supabase
      .from("campagnes")
      .update({ statut: newStatus })
      .eq("id", campagne.id);

    if (error) {
      console.error("Status update error:", error.message);
      toast.error("Impossible de mettre à jour le statut. Réessayez.");
    } else {
      setCampagne(prev => prev ? { ...prev, statut: newStatus } : prev);
      toast.success(
        newStatus === "en_cours" ? "Campagne lancée." :
        newStatus === "en_pause" ? "Campagne mise en pause." :
        newStatus === "terminee" ? "Campagne terminée." : "Statut mis à jour."
      );
    }
    setUpdating(false);
  };

  // Loading state
  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

  // Error state (UUID invalid, not found, or network error)
  if (loadError || !campagne) {
    return (
      <UserLayout>
        <div className="max-w-md mx-auto pt-8">
          <div className="card-surface p-8 text-center">
            <XCircle size={32} className="mx-auto mb-4" style={{ color: "hsl(0 60% 50%)" }} />
            <h2 className="font-display text-lg font-bold text-foreground mb-2">Campagne introuvable</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {loadError ?? "Cette campagne n'existe pas ou vous n'y avez pas accès."}
            </p>
            <button
              onClick={() => navigate("/campagnes")}
              className="btn-cta text-sm py-2.5 px-6 inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Retour aux campagnes
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  const cfg = statusConfig[campagne.statut] ?? statusConfig.brouillon;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <UserLayout jarvisContext="campagne">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux campagnes
        </button>

        {/* ── HEADER ── */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground leading-snug mb-1">
                {campagne.nom}
              </h1>
              {campagne.objectif && (
                <p className="text-sm text-muted-foreground">{campagne.objectif}</p>
              )}
            </div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
            {campagne.canal_principal && (
              <span className="flex items-center gap-1">
                <Mail size={11} /> {canalLabel[campagne.canal_principal] ?? campagne.canal_principal}
              </span>
            )}
            {campagne.mode_action && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {modeLabel[campagne.mode_action] ?? campagne.mode_action}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> Créée le {formatDate(campagne.created_at)}
            </span>
          </div>
        </div>

        {/* ── PLAN D'ACTION — honnête ── */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Plan d'action</h2>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted">
            <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">Séquences d'étapes — non disponible</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Les étapes détaillées de la campagne (premier contact, relance, appel…) nécessitent
                une table de séquences qui n'est pas encore créée.
                Votre campagne est active et son statut est gérable ci-dessous.
              </p>
            </div>
          </div>
        </div>

        {/* ── AIDE COPILOT ── */}
        <div className="card-surface p-5 mb-4">
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Améliorer cette campagne</p>
                <p className="text-xs text-muted-foreground">JARVIS peut suggérer des améliorations.</p>
              </div>
            </div>
            <ChevronRight size={15} className={`text-muted-foreground transition-transform ${showCopilot ? "rotate-90" : ""}`} />
          </button>

          {showCopilot && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  "Rendre l'objectif plus clair",
                  "Améliorer le premier message",
                  "Que dois-je faire ensuite ?",
                  "Cette campagne est-elle efficace ?",
                ].map((q) => (
                  <Link
                    key={q}
                    to="/assistant"
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    {q}
                  </Link>
                ))}
              </div>
              <Link to="/assistant" className="btn-cta text-sm py-2.5 px-4 w-full justify-center">
                <MessageCircle size={13} /> Parler à JARVIS de cette campagne
              </Link>
            </div>
          )}
        </div>

        {/* ── ACTIONS CAMPAGNE ── */}
        <div className="flex gap-3 flex-wrap">
          {campagne.statut === "brouillon" && (
            <button
              onClick={() => handleStatusChange("en_cours")}
              disabled={updating}
              className="btn-cta text-sm py-3 flex-1 min-w-[140px]"
            >
              {updating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Lancer la campagne
            </button>
          )}
          {campagne.statut === "en_cours" && (
            <>
              <button
                onClick={() => handleStatusChange("en_pause")}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-colors min-w-[140px]"
                style={{ borderColor: "hsl(38 95% 52% / 0.4)", color: "hsl(38 80% 30%)", background: "hsl(var(--accent-light))" }}
              >
                <PauseCircle size={14} /> Mettre en pause
              </button>
              <button
                onClick={() => handleStatusChange("terminee")}
                disabled={updating}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors min-w-[140px]"
              >
                <CheckCircle2 size={14} /> Terminer
              </button>
            </>
          )}
          {campagne.statut === "en_pause" && (
            <>
              <button
                onClick={() => handleStatusChange("en_cours")}
                disabled={updating}
                className="btn-cta text-sm py-3 flex-1 min-w-[140px]"
              >
                <Play size={14} /> Reprendre
              </button>
              <button
                onClick={() => handleStatusChange("terminee")}
                disabled={updating}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <CheckCircle2 size={14} /> Terminer
              </button>
            </>
          )}
          {campagne.statut === "terminee" && (
            <Link
              to="/campagnes"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Retour aux campagnes
            </Link>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
