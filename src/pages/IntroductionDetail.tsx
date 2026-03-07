/**
 * IntroductionDetail — Détail d'une introduction (côté facilitateur).
 * FULLY WIRED: lit les données réelles depuis Supabase.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, ChevronRight,
  Send, AlertCircle, Euro, Briefcase, Loader2
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";

interface IntroductionData {
  id: string;
  contact_nom: string;
  contact_email: string | null;
  contact_telephone: string | null;
  contexte: string | null;
  pertinence: string | null;
  statut: Status;
  created_at: string;
  updated_at: string;
  mission_id: string | null;
  mission_titre?: string | null;
  gain_montant?: number | null;
  gain_statut?: string | null;
  gain_id?: string | null;
}

const statusConfig: Record<Status, { icon: JSX.Element; color: string; bg: string; label: string; explication: string }> = {
  en_attente: { icon: <Clock size={13} />, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "En attente", explication: "L'entreprise n'a pas encore répondu. Elle a généralement 72h pour examiner votre contact." },
  en_cours: { icon: <ChevronRight size={13} />, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours", explication: "L'entreprise a accepté votre introduction et est en train d'échanger avec votre contact." },
  validee: { icon: <CheckCircle2 size={13} />, color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée ✓", explication: "L'entreprise a confirmé que votre contact correspond à ses critères. Votre gain est confirmé." },
  refusee: { icon: <XCircle size={13} />, color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée", explication: "L'entreprise a indiqué que ce contact ne correspond pas à ses critères actuels." },
};

export default function IntroductionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [intro, setIntro] = useState<IntroductionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      // Load intro + associated mission title + gain
      const [introRes, gainRes] = await Promise.all([
        db.from("introductions").select("*").eq("id", id).eq("facilitateur_id", user.id).single(),
        db.from("gains").select("id, montant, statut").eq("introduction_id", id).maybeSingle(),
      ]);

      if (!introRes.data) { setLoading(false); return; }

      let missionTitre: string | null = null;
      if (introRes.data.mission_id) {
        const { data: mission } = await db.from("missions").select("titre").eq("id", introRes.data.mission_id).single();
        missionTitre = mission?.titre ?? null;
      }

      setIntro({
        ...introRes.data,
        mission_titre: missionTitre,
        gain_montant: gainRes.data?.montant ?? null,
        gain_statut: gainRes.data?.statut ?? null,
        gain_id: gainRes.data?.id ?? null,
      });
      setLoading(false);
    };
    load();
  }, [id, user]);

  if (loading) return (
    <UserLayout role="facilitateur">
      <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
    </UserLayout>
  );

  if (!intro) return (
    <UserLayout role="facilitateur">
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">Cette introduction n'existe pas ou ne vous appartient pas.</p>
        <Link to="/introductions" className="btn-primary text-sm py-2.5 px-5">Retour aux introductions</Link>
      </div>
    </UserLayout>
  );

  const cfg = statusConfig[intro.statut] ?? statusConfig.en_attente;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <UserLayout role="facilitateur">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={15} /> Retour aux introductions
        </button>

        {/* Header */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                {intro.contact_nom.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg leading-tight">{intro.contact_nom}</p>
                <p className="text-xs text-muted-foreground">{formatDate(intro.created_at)}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Explication statut */}
          <div className="p-3 rounded-xl text-xs leading-relaxed mb-4" style={{ background: cfg.bg, color: cfg.color }}>
            <strong>Ce que ça veut dire :</strong> {cfg.explication}
          </div>

          {/* Mission liée */}
          {intro.mission_titre && (
            <div className="flex items-start gap-2 mb-3">
              <Briefcase size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Mission</p>
                {intro.mission_id
                  ? <Link to={`/missions/${intro.mission_id}`} className="text-sm font-medium text-primary hover:underline">{intro.mission_titre}</Link>
                  : <p className="text-sm font-medium text-foreground">{intro.mission_titre}</p>
                }
              </div>
            </div>
          )}

          {/* Gain si validée */}
          {intro.statut === "validee" && (
            <div className="flex items-center gap-2 text-sm font-semibold p-3 rounded-xl"
              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
              <Euro size={15} />
              {intro.gain_montant ? <>Gain confirmé : <strong>{intro.gain_montant} €</strong> <span className="font-normal text-xs ml-1">— versement sous 30 jours</span></> : <>Gain confirmé — montant à préciser par l'entreprise</>}
            </div>
          )}
        </div>

        {/* Contact details */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-3">Contact présenté</h2>
          <div className="space-y-3">
            {intro.contact_email && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm text-foreground">{intro.contact_email}</p>
              </div>
            )}
            {intro.contact_telephone && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Téléphone</p>
                <p className="text-sm text-foreground">{intro.contact_telephone}</p>
              </div>
            )}
            {intro.contexte && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{intro.contexte}</p>
              </div>
            )}
            {intro.pertinence && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Pourquoi ce contact est pertinent</p>
                <p className="text-sm text-foreground leading-relaxed">{intro.pertinence}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochaine étape */}
        <div className="p-5 rounded-xl mb-4 border"
          style={{
            borderColor: intro.statut === "validee" ? "hsl(var(--success) / 0.3)" : intro.statut === "refusee" ? "hsl(var(--destructive) / 0.2)" : "hsl(var(--primary) / 0.2)",
            background: intro.statut === "validee" ? "hsl(var(--success-light))" : intro.statut === "refusee" ? "hsl(0 72% 97%)" : "hsl(var(--secondary))",
          }}>
          <p className="font-semibold text-foreground text-sm mb-2">Ce qui se passe maintenant</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {intro.statut === "en_attente" && "L'entreprise doit maintenant examiner si votre contact correspond à ses critères. Vous serez notifié(e) dès qu'elle aura répondu."}
            {intro.statut === "en_cours" && "L'entreprise a accepté votre introduction et est en train d'échanger avec votre contact."}
            {intro.statut === "validee" && "Votre introduction a été validée. Votre gain est confirmé et sera versé sous 30 jours."}
            {intro.statut === "refusee" && "Ce contact ne correspondait pas aux critères de l'entreprise. Vous pouvez essayer avec une autre personne."}
          </p>
        </div>

        {/* Statut gain */}
        {intro.gain_id && (
          <div className="card-surface p-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Gain associé</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: intro.gain_statut === "valide" ? "hsl(var(--success-light))" : "hsl(var(--muted))",
                  color: intro.gain_statut === "valide" ? "hsl(var(--success))" : "hsl(var(--muted-foreground))"
                }}>
                {intro.gain_statut === "valide" ? "Validé ✓" : intro.gain_statut === "recu" ? "Reçu" : "En attente"}
              </span>
            </div>
            {intro.gain_montant && (
              <p className="text-2xl font-bold text-foreground mt-1">{intro.gain_montant} €</p>
            )}
          </div>
        )}

        {/* Actions selon statut */}
        {intro.statut === "refusee" && intro.mission_id && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/missions/${intro.mission_id}`} className="btn-cta text-sm py-3 px-5 flex-1 justify-center">
              <Send size={14} /> Essayer avec un autre contact
            </Link>
            <Link to="/missions" className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Voir d'autres missions
            </Link>
          </div>
        )}

        {intro.statut === "validee" && (
          <Link to="/gains" className="btn-primary text-sm py-3 px-6 w-full justify-center">
            <Euro size={15} /> Voir mes gains
          </Link>
        )}

        {(intro.statut === "en_attente" || intro.statut === "en_cours") && (
          <div className="p-4 rounded-xl border border-border bg-muted flex gap-3">
            <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              En attente de l'entreprise. Vous serez notifié(e) dès qu'elle prendra une décision.
            </p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
