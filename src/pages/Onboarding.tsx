import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Building2, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

type Role = "entreprise" | "facilitateur" | null;

type ProfileData = {
  role: Role;
  prenom: string;
  nomEntite: string;
  secteur: string;
  objectif: string;
};

const TOTAL_STEPS = 2;

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition placeholder:text-muted-foreground/60";

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 bg-muted">
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%`, background: "var(--gradient-accent)" }}
      />
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<ProfileData>({
    role: null, prenom: "", nomEntite: "", secteur: "", objectif: "",
  });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const subscription = useSubscription();

  const saveProfile = async () => {
    if (!user) return;
    if (saving || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await db
        .from("profiles")
        .update({ role, prenom: profile.prenom, onboarding_done: true })
        .eq("id", user.id);

      if (role === "entreprise") {
        await db.from("entreprise_profiles").upsert(
          { user_id: user.id, nom_entreprise: profile.nomEntite, secteur: profile.secteur },
          { onConflict: "user_id" }
        );
      } else if (role === "facilitateur") {
        await db.from("facilitateur_profiles").upsert(
          { user_id: user.id, secteur: profile.secteur },
          { onConflict: "user_id" }
        );
      }

      trackEvent("onboarding_done", user.id, { role: role ?? "unknown" });
      await refreshProfile();

      // Only fire OpenClaw if the user has an active subscription
      const hasAccess = isAccessActive(subscription.status);

      if (role === "entreprise" && hasAccess) {
        const { count: missionCount } = await db
          .from("missions")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", user.id);

        const calls: Promise<unknown>[] = [
          supabase.functions.invoke("openclaw-dossier-sync", { body: { force: true } }),
          supabase.functions.invoke("openclaw-job-executor", { body: { job_type: "daily_brief_generate" } }),
          supabase.functions.invoke("openclaw-scheduler", { body: { tick_type: "welcome_scan", user_id: user.id } }),
        ];
        if ((missionCount ?? 0) > 0) {
          calls.push(supabase.functions.invoke("openclaw-job-executor", { body: { job_type: "radar_scan" } }));
        }
        Promise.allSettled(calls).catch(() => {});
        toast.success("Le cerveau WiinupMax analyse votre profil. Vos premières recommandations arrivent...");
      } else if (role === "facilitateur") {
        supabase.functions
          .invoke("openclaw-scheduler", { body: { tick_type: "welcome_scan", user_id: user.id } })
          .catch(() => {});
      }

      setDone(true);
    } catch {
      savingRef.current = false; // bug fix: reset ref in catch
      toast.error("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ── STEP 1 — ROLE + IDENTITY ─────────────────────────────
  const StepIdentity = () => {
    const step1Valid =
      role !== null &&
      profile.prenom.trim().length > 1 &&
      profile.nomEntite.trim().length > 1;

    return (
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Étape 1 sur {TOTAL_STEPS}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Bienvenue sur Wiinup Max</h1>
          <p className="text-muted-foreground text-sm">Configurons votre espace en 2 minutes.</p>
        </div>

        {/* Role cards */}
        <div className="space-y-3 mb-5">
          <button
            onClick={() => setRole("entreprise")}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              role === "entreprise" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">Entreprise</p>
                  {role === "entreprise" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Je cherche des clients via le réseau et l'IA</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setRole("facilitateur")}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              role === "facilitateur" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Users size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">Apporteur / Facilitateur</p>
                  {role === "facilitateur" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Je mets en relation et je gagne des commissions</p>
              </div>
            </div>
          </button>
        </div>

        {/* Identity fields */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Votre prénom <span className="text-muted-foreground font-normal">(comment on vous appelle)</span>
            </label>
            <input
              type="text"
              placeholder="ex : Marie"
              value={profile.prenom}
              onChange={(e) => setProfile((p) => ({ ...p, prenom: e.target.value }))}
              className={INPUT_CLASS}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {role === "entreprise" ? "Nom de l'entreprise" : "Votre nom / structure"}
              <span className="text-muted-foreground font-normal ml-1">(visible sur votre profil)</span>
            </label>
            <input
              type="text"
              placeholder={role === "entreprise" ? "ex : Acme SAS" : "ex : Jean Martin Consulting"}
              value={profile.nomEntite}
              onChange={(e) => setProfile((p) => ({ ...p, nomEntite: e.target.value }))}
              className={INPUT_CLASS}
              autoComplete="organization"
            />
          </div>
        </div>

        <button
          onClick={() => { setProfile((p) => ({ ...p, role })); setStep(2); }}
          disabled={!step1Valid}
          className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuer <ChevronRight size={16} />
        </button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Vos données restent privées. Vous pouvez tout modifier plus tard.
        </p>
      </div>
    );
  };

  // ── STEP 2 — SECTOR + GOAL ────────────────────────────────
  const StepSectorGoal = () => {
    const isEntreprise = role === "entreprise";

    const sectorOptions = isEntreprise
      ? ["SaaS / Tech", "Immobilier", "Finance / Assurance", "Formation", "Autre"]
      : ["Conseil / Accompagnement", "Finance / Banque", "Immobilier", "Réseaux professionnels", "Autre"];

    const goals = isEntreprise
      ? [
          "Trouver des clients dans un secteur précis",
          "Développer un réseau de partenaires",
          "Accélérer mes ventes",
          "Tester un nouveau marché",
        ]
      : [
          "Gagner une commission sur mes recommandations",
          "Valoriser mon réseau existant",
          "Accompagner des entreprises que je connais",
          "Trouver de nouvelles sources de revenu",
        ];

    const isValid = !!profile.secteur && !!profile.objectif;

    return (
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Étape 2 sur {TOTAL_STEPS}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Votre activité</h1>
          <p className="text-muted-foreground text-sm">Ces infos aident à trouver les bonnes opportunités.</p>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {isEntreprise ? "Secteur d'activité" : "Domaine de réseau"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sectorOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setProfile((p) => ({ ...p, secteur: s }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    profile.secteur === s
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Objectif principal <span className="text-muted-foreground font-normal">(un seul)</span>
            </label>
            <div className="space-y-2">
              {goals.map((g) => (
                <button
                  key={g}
                  onClick={() => setProfile((p) => ({ ...p, objectif: g }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${
                    profile.objectif === g
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span>{g}</span>
                  {profile.objectif === g && <CheckCircle2 size={15} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={!isValid || saving}
          className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
          ) : (
            <>Terminer et accéder à mon espace <ArrowRight size={16} /></>
          )}
        </button>
        <button
          onClick={() => setStep(1)}
          disabled={saving}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          Retour
        </button>
      </div>
    );
  };

  // ── DONE SCREEN ───────────────────────────────────────────
  const StepDone = () => {
    const isEntreprise = role === "entreprise";
    const prenom = profile.prenom || "vous";
    return (
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "hsl(var(--success) / 0.15)" }}>
          <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Bienvenue, {prenom} ! 🎉
        </h1>
        <p className="text-muted-foreground text-sm mb-7">
          {isEntreprise
            ? "Votre espace entreprise est prêt. OpenClaw démarre la prospection."
            : "Votre profil facilitateur est actif. Explorez les missions disponibles."}
        </p>
        <div className="card-surface p-5 mb-6 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tout est prêt</p>
          {[
            "Profil créé et sécurisé",
            isEntreprise ? "OpenClaw activé — prospection en cours" : "Accès aux missions débloqué",
            "Assistant KITT IA disponible",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 size={15} style={{ color: "hsl(var(--success))" }} />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(isEntreprise ? "/dashboard/entreprise" : "/dashboard/facilitateur")}
          className="btn-cta w-full py-4 mb-3"
        >
          Accéder à mon espace <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate("/missions")}
          className="w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {isEntreprise ? "Créer ma première mission" : "Voir les missions disponibles"}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-foreground">WIINUP MAX</span>
          {!done && (
            <span className="text-xs text-muted-foreground">
              Étape {step} sur {TOTAL_STEPS}
            </span>
          )}
        </div>
      </div>
      {!done && <ProgressBar current={step} total={TOTAL_STEPS} />}
      <div className="flex-1 flex items-center justify-center p-6">
        {done ? <StepDone /> : step === 1 ? <StepIdentity /> : <StepSectorGoal />}
      </div>
    </div>
  );
}
