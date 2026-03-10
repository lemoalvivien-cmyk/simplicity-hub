/**
 * MissionNouvelle — Page de création de mission guidée.
 * Modèles préremplis + assistance JARVIS + matching immédiat après création.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import MissionTemplates, { MissionTemplate, MISSION_TEMPLATES } from "@/components/activation/MissionTemplates";
import CopilotPanel from "@/components/ai/CopilotPanel";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivation } from "@/hooks/useActivation";
import { toast } from "sonner";
import { trackEvent as analyticsTrackEvent } from "@/lib/analytics";
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, Briefcase,
  MapPin, Euro, Target, Loader2, Users, Star
} from "lucide-react";

const SECTEURS = ["SaaS / Tech", "Finance / Assurance", "Formation", "Immobilier", "Commerce", "Services", "Industrie", "Autre"];
const ZONES = ["France entière", "Île-de-France", "Auvergne-Rhône-Alpes", "PACA", "Occitanie", "Grand Est", "Hauts-de-France", "Europe", "International"];

type Step = "template" | "edit" | "success";

export default function MissionNouvelle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useActivation("entreprise");

  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);
  const [skipTemplate, setSkipTemplate] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    secteur: "",
    zone: "France entière",
    recompense: "",
    type_client_recherche: "",
  });

  const handleTemplateSelect = (tpl: MissionTemplate) => {
    setSelectedTemplate(tpl.id);
    setForm({
      titre: tpl.titre,
      description: tpl.description,
      secteur: tpl.secteur === "Tous secteurs" ? "" : tpl.secteur,
      zone: tpl.zone === "À préciser" ? "" : tpl.zone,
      recompense: tpl.recompense,
      type_client_recherche: tpl.type_client_recherche,
    });
    setStep("edit");
  };

  const handleBlankMission = () => {
    setSkipTemplate(true);
    setForm({ titre: "", description: "", secteur: "", zone: "France entière", recompense: "", type_client_recherche: "" });
    setStep("edit");
  };

  const isValid = form.titre.trim().length > 3 && form.description.trim().length > 10;

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);
    try {
      const { data, error } = await db.from("missions").insert({
        entreprise_id: user.id,
        titre: form.titre,
        description: form.description,
        secteur: form.secteur || null,
        zone: form.zone || null,
        recompense: form.recompense || null,
        type_client_recherche: form.type_client_recherche || null,
        statut: "active",
      }).select("id").single();

      if (error) throw error;
      const missionId = data?.id ?? null;
      setCreatedMissionId(missionId);
      await trackEvent("first_mission_created");
      // PROOF: mission_created → analytics_events (real write, dual-write with activation hook)
      analyticsTrackEvent("mission_created", user.id, { mission_id: missionId });
      setStep("success");

      // 🔥 Background AI matching — fire-and-forget (don't block UX)
      if (missionId) {
        supabase.functions.invoke("ai-matching", {
          body: {
            mission_id: missionId,
            company_user_id: user.id,
            enterprise_profile: {
              sector: form.secteur,
              offer_description: form.description,
              needs: form.type_client_recherche,
              zone: form.zone,
              target: form.type_client_recherche,
            },
          },
        }).catch(() => {/* silent — matching is best-effort */});
      }
    } catch {
      toast.error("Erreur lors de la création. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout role="entreprise" jarvisContext="mission-creation">
      <div className="max-w-2xl mx-auto">

        {/* ── ÉTAPE 1 : CHOISIR UN MODÈLE ─────────────────── */}
        {step === "template" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft size={16} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Créer une mission</h1>
                <p className="text-xs text-muted-foreground">Choisissez un modèle pour gagner du temps.</p>
              </div>
            </div>

            {/* Hero encourageant */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{
              background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
              border: "1px solid hsl(218 40% 25% / 0.5)"
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Star size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">La première mission, c'est la plus importante.</p>
                  <p className="text-white/50 text-xs mt-0.5">Elle déclenche les introductions. Commencez maintenant.</p>
                </div>
              </div>
            </div>

            <MissionTemplates onSelect={handleTemplateSelect} selected={selectedTemplate} />

            <button
              onClick={handleBlankMission}
              className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Créer une mission personnalisée (sans modèle)
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : ÉDITER ────────────────────────────── */}
        {step === "edit" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep("template")} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft size={16} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">
                  {skipTemplate ? "Votre mission" : "Personnalisez votre mission"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {skipTemplate ? "Décrivez ce que vous recherchez." : "Le modèle est prérempli. Adaptez-le à votre besoin exact."}
                </p>
              </div>
            </div>

            <div className="card-surface p-5 space-y-4">

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-primary" /> Titre de la mission
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="ex : Je cherche des clients B2B dans la tech"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Target size={13} className="text-primary" /> Qui cherchez-vous exactement ?
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez le profil idéal du contact que vous cherchez..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Plus vous êtes précis, meilleures seront les introductions reçues.</p>
              </div>

              {/* Type client */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Users size={13} className="text-primary" /> Type de contact recherché
                </label>
                <input
                  type="text"
                  value={form.type_client_recherche}
                  onChange={e => setForm(f => ({ ...f, type_client_recherche: e.target.value }))}
                  placeholder="ex : Dirigeant PME, Responsable IT, DRH..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Secteur */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Secteur</label>
                <div className="flex flex-wrap gap-2">
                  {SECTEURS.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, secteur: s }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.secteur === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" /> Zone géographique
                </label>
                <div className="flex flex-wrap gap-2">
                  {ZONES.map(z => (
                    <button key={z} onClick={() => setForm(f => ({ ...f, zone: z }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.zone === z ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      }`}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              {/* Récompense */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Euro size={13} className="text-primary" /> Récompense pour le facilitateur
                </label>
                <input
                  type="text"
                  value={form.recompense}
                  onChange={e => setForm(f => ({ ...f, recompense: e.target.value }))}
                  placeholder="ex : 300 € par client validé"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Une récompense claire attire plus de facilitateurs.</p>
              </div>
            </div>

            {/* JARVIS inline si description remplie */}
            {form.description.length > 20 && (
              <CopilotPanel
                context="mission-creation"
                textToImprove={`Titre: ${form.titre}\n\nDescription: ${form.description}`}
                userRole="entreprise"
                compact
              />
            )}

            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="btn-cta w-full py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Création en cours…</>
                : <>Publier ma mission <ArrowRight size={15} /></>
              }
            </button>

            {!isValid && (
              <p className="text-center text-xs text-muted-foreground">
                Remplissez au minimum le titre et la description pour continuer.
              </p>
            )}
          </div>
        )}

        {/* ── ÉTAPE 3 : SUCCÈS + MATCHING ─────────────────── */}
        {step === "success" && (
          <div className="space-y-5">

            {/* Confirmation */}
            <div className="card-surface p-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--success-light))" }}>
                <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground mb-2">
                Votre mission est publiée !
              </h1>
              <p className="text-sm text-muted-foreground mb-1">
                {form.titre}
              </p>
              <p className="text-xs text-muted-foreground">
                Les facilitateurs de votre secteur peuvent désormais vous envoyer des introductions.
              </p>
            </div>

            {/* Matching immédiat */}
            <div className="rounded-2xl p-5" style={{
              background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
              border: "1px solid hsl(218 40% 25% / 0.5)"
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-white/70" />
                <p className="text-sm font-semibold text-white">Le moteur est en marche</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Users, text: "Les facilitateurs correspondent à votre mission" },
                  { icon: Target, text: "Les intérêts passifs sont surveillés pour vous" },
                  { icon: Briefcase, text: "OpenClaw prépare les prochaines recommandations" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(218 40% 20% / 0.8)" }}>
                      <Icon size={12} className="text-white/60" />
                    </div>
                    <p className="text-white/70 text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Prochaines étapes</p>

              <button
                onClick={() => navigate("/facilitateurs")}
                className="w-full card-surface p-4 flex items-center gap-3 text-left hover:bg-secondary transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Users size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Inviter un facilitateur</p>
                  <p className="text-xs text-muted-foreground">Trouvez et contactez les meilleurs profils.</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
              </button>

              <button
                onClick={() => navigate("/dashboard/entreprise")}
                className="w-full card-surface p-4 flex items-center gap-3 text-left hover:bg-secondary transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                  <Briefcase size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Retour au tableau de bord</p>
                  <p className="text-xs text-muted-foreground">Suivez les introductions entrantes.</p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
              </button>

              {createdMissionId && (
                <button
                  onClick={() => navigate(`/missions/${createdMissionId}`)}
                  className="w-full card-surface p-4 flex items-center gap-3 text-left hover:bg-secondary transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                    <Target size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Voir ma mission</p>
                    <p className="text-xs text-muted-foreground">Visualisez et modifiez votre mission.</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
