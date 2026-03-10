/**
 * MissionDetail — Page de détail d'une mission + formulaire d'introduction.
 * FULLY WIRED: lit les données réelles depuis Supabase, insère les introductions en DB,
 * et crée une entrée gain + intro_escrow au moment de l'envoi.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ArrowLeft, Send, Info, AlertCircle, ChevronRight, CheckCircle2,
  Clock, MapPin, Euro, Briefcase, Users, Loader2, Sparkles, Star, UserCheck
} from "lucide-react";
import CopilotPanel from "@/components/ai/CopilotPanel";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface Mission {
  id: string;
  entreprise_id: string;
  titre: string;
  description: string | null;
  type_client_recherche: string | null;
  secteur: string | null;
  zone: string | null;
  recompense: string | null;
  statut: string | null;
  created_at: string;
}

interface MissionMatch {
  id: string;
  facilitateur_id: string;
  compatibility_score: number;
  reasoning: string | null;
  status: string;
  facilitateur_name?: string;
}

const statusConfig = {
  active: { label: "Ouverte", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={13} /> },
  en_pause: { label: "En pause", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <Clock size={13} /> },
  fermee: { label: "Fermée", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))", icon: <AlertCircle size={13} /> },
};

function CycleStep({ num, label, active }: { num: number; label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? "" : "opacity-40"}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: active ? "hsl(var(--primary))" : "hsl(var(--muted))", color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}>
        {num}
      </div>
      <p className="text-xs text-center text-muted-foreground leading-tight max-w-[60px]">{label}</p>
    </div>
  );
}

interface IntroFormProps {
  mission: Mission;
  facilitateurId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function IntroductionForm({ mission, facilitateurId, onSuccess, onCancel }: IntroFormProps) {
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", contexte: "", pourquoi: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = form.nom.trim().length > 1 && form.contexte.trim().length > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setError("Merci de remplir le nom et le contexte avant d'envoyer."); return; }
    setLoading(true);
    setError("");
    try {
      // 1. Insert introduction in DB
      const { data: intro, error: introErr } = await db.from("introductions").insert({
        facilitateur_id: facilitateurId,
        entreprise_id: mission.entreprise_id,
        mission_id: mission.id,
        contact_nom: form.nom.trim(),
        contact_email: form.email.trim() || null,
        contact_telephone: form.telephone.trim() || null,
        contexte: form.contexte.trim(),
        pertinence: form.pourquoi.trim() || null,
        statut: "en_attente",
      }).select("id").single();

      if (introErr) throw introErr;

      // 2. Create gain record (en_attente) linked to this introduction
      await db.from("gains").insert({
        facilitateur_id: facilitateurId,
        introduction_id: intro.id,
        mission_id: mission.id,
        source: "mission_directe",
        statut: "en_attente",
        montant: null, // defined once validated by company
      });

      // 3. Create intro_escrow for protection
      await db.from("intro_escrow").insert({
        facilitator_id: facilitateurId,
        company_id: mission.entreprise_id,
        introduction_id: intro.id,
        status: "demandee",
        protected: true,
      });

      // 4. Create introduction_proof entry
      await db.from("introduction_proofs").insert({
        facilitator_id: facilitateurId,
        company_id: mission.entreprise_id,
        introduction_id: intro.id,
        proof_status: "brouillon",
        validation_status: "en_attente",
      });

      // PROOF: intro_submitted → analytics_events (real write)
      trackEvent("intro_submitted", facilitateurId, { mission_id: mission.id, intro_id: intro.id });

      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'envoi. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-6 mt-4">
      <h2 className="font-semibold text-foreground text-lg mb-1">Envoyer une introduction</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Partagez les informations de la personne que vous souhaitez présenter. C'est simple et rapide.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nom de la personne <span className="text-destructive">*</span></label>
          <input type="text" placeholder="Ex : Jean-Pierre Duval" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email (optionnel)</label>
            <input type="email" placeholder="email@exemple.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Téléphone (optionnel)</label>
            <input type="tel" placeholder="+33 6 XX XX XX XX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Décrivez brièvement cette personne <span className="text-destructive">*</span></label>
          <textarea rows={3} placeholder="Ex : Gérant d'une boulangerie à Lyon, utilise encore Excel pour sa compta…" value={form.contexte} onChange={e => setForm({ ...form, contexte: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Pourquoi pensez-vous qu'elle correspond ? <span className="text-muted-foreground font-normal">(optionnel)</span></label>
          <textarea rows={2} placeholder="Ex : Elle cherche une solution depuis quelques semaines…" value={form.pourquoi} onChange={e => setForm({ ...form, pourquoi: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none" />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "hsl(0 72% 95%)", color: "hsl(var(--destructive))" }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {(form.contexte.length > 10 || form.pourquoi.length > 5) && (
          <CopilotPanel context="introduction" textToImprove={`${form.contexte} ${form.pourquoi}`} userRole="facilitateur" compact />
        )}
        <div className="p-3 rounded-xl bg-muted flex gap-3 text-xs text-muted-foreground">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Après envoi, l'entreprise examinera votre contact. Si tout correspond, votre gain sera confirmé.
            {mission.recompense && <> Récompense attendue : <strong className="text-foreground">{mission.recompense}</strong>.</>}
          </span>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading || !valid} className="btn-cta text-sm py-3 px-6 flex-1 disabled:opacity-40">
            {loading ? <><span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />Envoi en cours…</> : <><Send size={15} /> Envoyer l'introduction</>}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Annuler</button>
        </div>
      </form>
    </div>
  );
}

function SuccessScreen({ mission, onContinue }: { mission: Mission; onContinue: () => void }) {
  return (
    <div className="card-surface p-8 mt-4 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--success-light))" }}>
        <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">Introduction envoyée !</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
        L'entreprise va examiner votre contact très prochainement.
        {mission.recompense && <> Une fois validée, vous recevrez <strong className="text-foreground">{mission.recompense}</strong>.</>}
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-6"
        style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
        <Clock size={14} /> Gain potentiel : <strong>{mission.recompense || "À confirmer"}</strong>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/introductions" className="btn-primary text-sm py-3 px-6">Voir mes introductions</Link>
        <button onClick={onContinue} className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Voir d'autres missions
        </button>
      </div>
    </div>
  );
}

export default function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const role = (profile?.role as "facilitateur" | "entreprise") ?? "facilitateur";

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [introCount, setIntroCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [matches, setMatches] = useState<MissionMatch[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const loadMatches = async (missionId: string) => {
    const { data } = await supabase
      .from("mission_matches")
      .select("*")
      .eq("mission_id", missionId)
      .order("compatibility_score", { ascending: false })
      .limit(5);
    if (!data || data.length === 0) return;

    // Fetch names
    const ids = data.map((m: MissionMatch) => m.facilitateur_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, prenom, email")
      .in("id", ids);
    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p: { id: string; prenom: string | null; email: string | null }) => {
      nameMap[p.id] = p.prenom ?? p.email?.split("@")[0] ?? "Apporteur";
    });
    setMatches(data.map((m: MissionMatch) => ({ ...m, facilitateur_name: nameMap[m.facilitateur_id] ?? "Apporteur" })));
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [missionRes, introsRes] = await Promise.all([
        db.from("missions").select("*").eq("id", id).single(),
        db.from("introductions").select("id", { count: "exact", head: true }).eq("mission_id", id),
      ]);
      if (missionRes.data) {
        setMission(missionRes.data);
        if (profile?.role === "entreprise") loadMatches(id);
      }
      setIntroCount(introsRes.count || 0);
      setLoading(false);
    };
    load();
  }, [id, profile?.role]);

  const handleInvite = async (match: MissionMatch) => {
    setInviting(match.facilitateur_id);
    await supabase
      .from("mission_matches")
      .update({ status: "acceptee" })
      .eq("id", match.id);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: "acceptee" } : m));
    toast.success(`Invitation envoyée à ${match.facilitateur_name} !`);
    setInviting(null);
  };

  if (loading) return (
    <UserLayout role={role}>
      <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
    </UserLayout>
  );

  if (!mission) return (
    <UserLayout role={role}>
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">Cette mission n'existe pas ou a été supprimée.</p>
        <Link to="/missions" className="btn-primary text-sm py-2.5 px-5">Retour aux missions</Link>
      </div>
    </UserLayout>
  );

  const cfg = statusConfig[mission.statut as keyof typeof statusConfig] ?? statusConfig.active;

  return (
    <UserLayout role={role}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={15} /> Retour aux missions
        </button>

        {/* Header mission */}
        <div className="card-surface p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                {mission.titre.charAt(0)}
              </div>
              <div>
                {mission.secteur && <span className="badge-muted text-xs mb-0.5 inline-block">{mission.secteur}</span>}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
              style={{ color: cfg.color, background: cfg.bg }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <h1 className="font-display text-xl font-bold text-foreground mb-3 leading-snug">{mission.titre}</h1>
          {mission.description && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mission.description}</p>}

          <div className="flex flex-wrap gap-4 mb-4">
            {mission.zone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={13} /> {mission.zone}
              </div>
            )}
            {mission.recompense && (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>
                <Euro size={13} /> {mission.recompense}
              </div>
            )}
            {introCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={13} /> {introCount} introduction{introCount > 1 ? "s" : ""} envoyée{introCount > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Ce qu'il faut faire */}
        {mission.type_client_recherche && (
          <div className="card-surface p-5 mb-4">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-primary" /> Qui cherche-t-on exactement ?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{mission.type_client_recherche}</p>
          </div>
        )}

        {/* Cycle */}
        <div className="card-surface p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Ce qui se passe, étape par étape</h2>
          <div className="flex items-start justify-between gap-2">
            <CycleStep num={1} label="Vous envoyez une intro" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={2} label="L'entreprise examine" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={3} label="Elle valide" active />
            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0" />
            <CycleStep num={4} label="Vous recevez votre gain" active />
          </div>
          <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-xl leading-relaxed">
            L'entreprise examinera votre contact et vous notifiera de sa décision. Une fois validé, votre gain est confirmé et versé sous 30 jours.
          </p>
        </div>

        {/* CTA ou formulaire ou succès — côté facilitateur */}
        {role === "facilitateur" && (
          <>
            {success ? (
              <SuccessScreen mission={mission} onContinue={() => navigate("/missions")} />
            ) : showForm ? (
              <IntroductionForm
                mission={mission}
                facilitateurId={user!.id}
                onSuccess={() => { setSuccess(true); setShowForm(false); toast.success("Introduction envoyée !"); }}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button onClick={() => setShowForm(true)} className="btn-cta text-sm py-3 px-6 flex-1">
                  <Send size={15} /> Envoyer une introduction
                </button>
                <Link to="/missions" className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Voir d'autres missions
                </Link>
              </div>
            )}
          </>
        )}

        {/* Vue entreprise */}
        {role === "entreprise" && (
          <div className="card-surface p-5 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Introductions reçues</h2>
              <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                {introCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {introCount === 0
                ? "Aucune introduction reçue pour cette mission pour l'instant."
                : `Vous avez reçu ${introCount} introduction${introCount > 1 ? "s" : ""}. Rendez-vous dans la section Introductions pour les examiner.`}
            </p>
            <Link to="/entreprise/introductions" className="btn-primary text-sm py-2.5 px-5">
              Voir les introductions reçues
            </Link>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
