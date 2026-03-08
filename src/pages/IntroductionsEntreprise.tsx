/**
 * IntroductionsEntreprise — Liste des introductions reçues côté entreprise.
 * FULLY WIRED: lit et écrit dans Supabase.
 * Validation → met à jour intro statut + confirme le gain du facilitateur.
 * Refus → met à jour intro statut + annule le gain.
 * Core Domain v4: affiche le statut lead_intake lié à chaque intro.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle,
  Send, Info, Briefcase, Loader2, Phone, Mail
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LeadIntakeStatus from "@/components/leads/LeadIntakeStatus";
import type { QualificationStatus, NextBestAction } from "@/lib/leadPipeline";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";

interface IntroReçue {
  id: string;
  facilitateur_id: string;
  contact_nom: string;
  contact_email: string | null;
  contact_telephone: string | null;
  contexte: string | null;
  pertinence: string | null;
  mission_id: string | null;
  statut: Status;
  created_at: string;
  mission_titre?: string | null;
  facilitateur_prenom?: string | null;
  gain_id?: string | null;
  // Lead pipeline data (from lead_intakes joined)
  lead_qualification_status?: QualificationStatus | null;
  lead_next_best_action?: NextBestAction | null;
  lead_dedup_status?: string | null;
}

const statusConfig: Record<Status, { icon: JSX.Element; color: string; bg: string; label: string }> = {
  en_attente: { icon: <Clock size={13} />, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "À examiner" },
  en_cours: { icon: <ChevronRight size={13} />, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours" },
  validee: { icon: <CheckCircle2 size={13} />, color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée" },
  refusee: { icon: <XCircle size={13} />, color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée" },
};

interface IntroCardProps {
  intro: IntroReçue;
  onValidate: (id: string) => Promise<void>;
  onRefuse: (id: string) => Promise<void>;
}

function IntroCard({ intro, onValidate, onRefuse }: IntroCardProps) {
  const cfg = statusConfig[intro.statut];
  const [confirming, setConfirming] = useState<"valider" | "refuser" | null>(null);
  const [processing, setProcessing] = useState(false);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const handleAction = async (action: "valider" | "refuser") => {
    setProcessing(true);
    if (action === "valider") await onValidate(intro.id);
    else await onRefuse(intro.id);
    setConfirming(null);
    setProcessing(false);
  };

  return (
    <div className="card-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-foreground">{intro.contact_nom}</p>
          <p className="text-xs text-muted-foreground">
            Présenté par <strong>{intro.facilitateur_prenom || "un apporteur"}</strong> · {formatDate(intro.created_at)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Mission liée */}
      {intro.mission_titre && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Briefcase size={12} />
          <span>Mission :</span>
          {intro.mission_id
            ? <Link to={`/missions/${intro.mission_id}`} className="text-primary font-medium hover:underline">{intro.mission_titre}</Link>
            : <span className="font-medium text-foreground">{intro.mission_titre}</span>
          }
        </div>
      )}

      {/* Contact details */}
      <div className="space-y-1.5 mb-3">
        {intro.contact_email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail size={11} /> {intro.contact_email}
          </div>
        )}
        {intro.contact_telephone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={11} /> {intro.contact_telephone}
          </div>
        )}
      </div>

      {/* Contexte */}
      {intro.contexte && <p className="text-sm text-muted-foreground leading-relaxed mb-2">{intro.contexte}</p>}
      {intro.pertinence && (
        <p className="text-xs text-muted-foreground italic leading-relaxed mb-3">"{intro.pertinence}"</p>
      )}

      {/* Actions validation — uniquement si en attente */}
      {intro.statut === "en_attente" && (
        <>
          {confirming === null ? (
            <>
              <div className="p-3 rounded-xl bg-muted text-xs text-muted-foreground leading-relaxed mb-4 flex gap-2">
                <Info size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                <span>Si vous validez ce contact, le gain de l'apporteur sera confirmé.
                  Si vous refusez, l'apporteur sera informé.</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirming("valider")} className="btn-cta text-sm py-2.5 px-5 flex-1">
                  <CheckCircle2 size={14} /> Valider ce contact
                </button>
                <button onClick={() => setConfirming("refuser")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-muted"
                  style={{ borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}>
                  <XCircle size={14} /> Refuser
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl border"
              style={{
                borderColor: confirming === "valider" ? "hsl(var(--success) / 0.3)" : "hsl(var(--destructive) / 0.3)",
                background: confirming === "valider" ? "hsl(var(--success-light))" : "hsl(0 72% 97%)",
              }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={14} style={{ color: confirming === "valider" ? "hsl(var(--success))" : "hsl(var(--destructive))" }} />
                <p className="text-sm font-semibold text-foreground">
                  {confirming === "valider" ? "Confirmer la validation ?" : "Confirmer le refus ?"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {confirming === "valider"
                  ? "En validant, vous confirmez que ce contact correspond à vos critères. L'apporteur recevra sa récompense."
                  : "En refusant, l'apporteur sera informé que ce contact ne correspond pas à vos critères actuels."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleAction(confirming)} disabled={processing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={confirming === "valider"
                    ? { background: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }
                    : { background: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
                  {processing ? "Traitement…" : confirming === "valider" ? "Oui, valider" : "Oui, refuser"}
                </button>
                <button onClick={() => setConfirming(null)} disabled={processing}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {intro.statut === "validee" && (
        <div className="flex items-center gap-2 text-xs font-medium p-3 rounded-xl"
          style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
          <CheckCircle2 size={13} /> Vous avez validé ce contact. La récompense de l'apporteur est en cours de traitement.
        </div>
      )}
      {intro.statut === "refusee" && (
        <div className="flex items-center gap-2 text-xs font-medium p-3 rounded-xl"
          style={{ background: "hsl(0 72% 95%)", color: "hsl(var(--destructive))" }}>
          <XCircle size={13} /> Vous avez refusé cette introduction.
        </div>
      )}
    </div>
  );
}

export default function IntroductionsEntreprise() {
  const { user } = useAuth();
  const [intros, setIntros] = useState<IntroReçue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Status | "toutes">("toutes");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      // Load introductions for this company
      const { data: introData } = await db
        .from("introductions")
        .select("*")
        .eq("entreprise_id", user.id)
        .order("created_at", { ascending: false });

      if (!introData || introData.length === 0) { setIntros([]); setLoading(false); return; }

      // Batch load missions and profiles
      const missionIds = [...new Set(introData.map((i: IntroReçue) => i.mission_id).filter(Boolean))];
      const facilitateurIds = [...new Set(introData.map((i: IntroReçue) => i.facilitateur_id))];
      const introIds = introData.map((i: IntroReçue) => i.id);

      const [missionsRes, profilesRes, gainsRes] = await Promise.all([
        missionIds.length > 0 ? db.from("missions").select("id, titre").in("id", missionIds) : { data: [] },
        db.from("profiles").select("id, prenom").in("id", facilitateurIds),
        db.from("gains").select("id, introduction_id").in("introduction_id", introIds),
      ]);

      const missionsMap: Record<string, string> = {};
      (missionsRes.data || []).forEach((m: { id: string; titre: string }) => { missionsMap[m.id] = m.titre; });

      const profilesMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: { id: string; prenom: string }) => { profilesMap[p.id] = p.prenom; });

      const gainsMap: Record<string, string> = {};
      (gainsRes.data || []).forEach((g: { id: string; introduction_id: string }) => { gainsMap[g.introduction_id] = g.id; });

      const enriched: IntroReçue[] = introData.map((i: IntroReçue) => ({
        ...i,
        mission_titre: i.mission_id ? missionsMap[i.mission_id] : null,
        facilitateur_prenom: profilesMap[i.facilitateur_id] || null,
        gain_id: gainsMap[i.id] || null,
      }));

      setIntros(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleValidate = async (id: string) => {
    // 1. Update introduction status
    const { error } = await db.from("introductions").update({ statut: "validee" }).eq("id", id).eq("entreprise_id", user!.id);
    if (error) { toast.error("Erreur lors de la validation."); return; }

    // 2. Validate associated gain — update to "valide"
    await db.from("gains").update({ statut: "valide" }).eq("introduction_id", id);

    // 3. Update intro_escrow status
    await db.from("intro_escrow").update({ status: "validee", converted: true }).eq("introduction_id", id);

    // 4. Update introduction_proof
    await db.from("introduction_proofs").update({ validation_status: "validee", proof_status: "certifie", finalized_at: new Date().toISOString() }).eq("introduction_id", id);

    setIntros(prev => prev.map(i => i.id === id ? { ...i, statut: "validee" as Status } : i));
    toast.success("Introduction validée ! Le gain de l'apporteur est confirmé.");
  };

  const handleRefuse = async (id: string) => {
    const { error } = await db.from("introductions").update({ statut: "refusee" }).eq("id", id).eq("entreprise_id", user!.id);
    if (error) { toast.error("Erreur lors du refus."); return; }

    // Annuler le gain associé
    await db.from("gains").update({ statut: "annule" }).eq("introduction_id", id);

    setIntros(prev => prev.map(i => i.id === id ? { ...i, statut: "refusee" as Status } : i));
    toast("Introduction refusée.");
  };

  const aExaminer = intros.filter(i => i.statut === "en_attente").length;
  const filtered = activeTab === "toutes" ? intros : intros.filter(i => i.statut === activeTab);

  const tabs: { id: Status | "toutes"; label: string }[] = [
    { id: "toutes", label: "Toutes" },
    { id: "en_attente", label: `À examiner${aExaminer > 0 ? ` (${aExaminer})` : ""}` },
    { id: "en_cours", label: "En cours" },
    { id: "validee", label: "Validées" },
    { id: "refusee", label: "Refusées" },
  ];

  return (
    <UserLayout role="entreprise">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Introductions reçues</h1>
          <p className="text-sm text-muted-foreground">
            Voici les contacts que des apporteurs d'affaires vous ont présentés. Examinez-les et validez ou refusez.
          </p>
        </div>

        {aExaminer > 0 && (
          <div className="p-4 rounded-xl border mb-5 flex items-start gap-3"
            style={{ borderColor: "hsl(38 95% 52% / 0.3)", background: "hsl(var(--accent-light))" }}>
            <Clock size={16} style={{ color: "hsl(38 80% 30%)" }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {aExaminer} introduction{aExaminer > 1 ? "s" : ""} attend{aExaminer > 1 ? "ent" : ""} votre réponse
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les apporteurs attendent votre validation. Répondez dans les 72h pour maintenir une bonne relation.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Send size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune introduction ici</p>
            <p className="text-sm text-muted-foreground mb-4">
              {intros.length === 0
                ? "Les introductions apparaîtront ici dès qu'un apporteur vous présentera un contact."
                : "Aucune introduction dans cette catégorie."}
            </p>
            {intros.length === 0 && (
              <Link to="/facilitateurs" className="btn-cta text-sm py-2.5 px-5 inline-flex">
                Trouver des facilitateurs
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(intro => (
              <IntroCard key={intro.id} intro={intro} onValidate={handleValidate} onRefuse={handleRefuse} />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
