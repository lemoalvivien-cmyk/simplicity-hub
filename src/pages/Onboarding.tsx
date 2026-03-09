import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Building2, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { trackEvent } from "@/lib/analytics";

type Role = "entreprise" | "facilitateur" | null;

type ProfileData = {
  role: Role;
  prenom: string;
  nomEntite: string;
  secteur: string;
  objectif: string;
  description: string;
};

const TOTAL_STEPS = 3;

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 bg-muted">
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${((current + 1) / total) * 100}%`, background: "var(--gradient-accent)" }}
      />
    </div>
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<ProfileData>({
    role: null, prenom: "", nomEntite: "", secteur: "", objectif: "", description: "",
  });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const via = params.get("via");

  const welcomeMsg = via === "code"
    ? t("onboarding_welcome_via_code")
    : t("onboarding_welcome_default");

  const saveProfile = async (description: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await db.from("profiles").update({ role, prenom: profile.prenom, onboarding_done: true }).eq("id", user.id);
      if (role === "entreprise") {
        await db.from("entreprise_profiles").upsert({ user_id: user.id, nom_entreprise: profile.nomEntite, secteur: profile.secteur, description }, { onConflict: "user_id" });
      } else if (role === "facilitateur") {
        await db.from("facilitateur_profiles").upsert({ user_id: user.id, description_reseau: description, secteur: profile.secteur }, { onConflict: "user_id" });
      }
      await refreshProfile();
      setDone(true);
    } catch {
      toast.error(t("onboarding_saving_error"));
    } finally {
      setSaving(false);
    }
  };

  // ── STEP 0 — WELCOME ─────────────────────────────────────
  const StepWelcome = () => (
    <div className="w-full max-w-md animate-fade-in" key="welcome">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5">
          <span className="text-white font-display font-bold text-xl">W</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">{t("onboarding_welcome_title")}</h1>
        <p className="text-muted-foreground leading-relaxed">{welcomeMsg}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))", border: "1px solid hsl(218 40% 22% / 0.6)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(218 72% 65%)" }}>Moteur 1</p>
          <p className="font-semibold text-white text-sm">{t("onboarding_moteur1_title")}</p>
          <p className="text-white/45 text-xs mt-1">{t("onboarding_moteur1_sub")}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))", border: "1px solid hsl(24 50% 20% / 0.6)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(24 100% 65%)" }}>Moteur 2</p>
          <p className="font-semibold text-white text-sm">{t("onboarding_moteur2_title")}</p>
          <p className="text-white/45 text-xs mt-1">{t("onboarding_moteur2_sub")}</p>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mb-5">{t("onboarding_double_engine")}</p>

      <div className="card-surface p-5 mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("onboarding_what_awaits")}</p>
        {([
          { n: "1", label: t("onboarding_step1_label"), sub: t("onboarding_step1_sub") },
          { n: "2", label: t("onboarding_step2_label"), sub: t("onboarding_step2_sub") },
          { n: "3", label: t("onboarding_step3_label"), sub: t("onboarding_step3_sub") },
        ] as const).map(({ n, label, sub }) => (
          <div key={n} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold" style={{ color: "hsl(var(--accent))" }}>{n}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mb-5 text-center">{t("onboarding_trust_note")}</p>
      <button onClick={() => setStep(1)} className="btn-cta w-full py-4">
        {t("onboarding_cta_start")} <ArrowRight size={16} />
      </button>
    </div>
  );

  // ── STEP 1 — ROLE ────────────────────────────────────────
  const StepRole = () => (
    <div className="w-full max-w-md animate-fade-in" key="role">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("onboarding_step_label", { step: 1, total: TOTAL_STEPS })}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">{t("onboarding_role_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("onboarding_role_subtitle")}</p>
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={() => setRole("entreprise")}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${role === "entreprise" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Building2 size={20} className="text-primary" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{t("onboarding_role_company_title")}</p>
                {role === "entreprise" && <CheckCircle2 size={18} className="text-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{t("onboarding_role_company_sub")}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRole("facilitateur")}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${role === "facilitateur" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0"><Users size={20} className="text-primary" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{t("onboarding_role_facilitator_title")}</p>
                {role === "facilitateur" && <CheckCircle2 size={18} className="text-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{t("onboarding_role_facilitator_sub")}</p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={() => { setProfile((p) => ({ ...p, role })); setStep(2); }}
        disabled={!role}
        className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t("onboarding_cta_continue")} <ChevronRight size={16} />
      </button>
    </div>
  );

  // ── STEP 2 — PROFILE ─────────────────────────────────────
  const StepProfile = () => {
    const isEntreprise = role === "entreprise";

    const sectorOptions = isEntreprise
      ? ["SaaS / Tech", "Immobilier", "Finance / Assurance", "Formation", "Autre"]
      : ["Conseil / Accompagnement", "Finance / Banque", "Immobilier", "Réseaux professionnels", "Autre"];

    const goalsEntreprise = [
      "Trouver des clients dans un secteur précis",
      "Développer un réseau de partenaires",
      "Accélérer mes ventes",
      "Tester un nouveau marché",
    ];
    const goalsFacilitateur = [
      "Gagner une commission sur mes recommandations",
      "Valoriser mon réseau existant",
      "Accompagner des entreprises que je connais",
      "Trouver de nouvelles sources de revenu",
    ];
    const goals = isEntreprise ? goalsEntreprise : goalsFacilitateur;
    const isValid = profile.prenom.trim().length > 1 && profile.nomEntite.trim().length > 1 && profile.secteur && profile.objectif;

    return (
      <div className="w-full max-w-md animate-fade-in" key="profile">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t("onboarding_step_label", { step: 2, total: TOTAL_STEPS })}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">{t("onboarding_profile_title")}</h1>
          <p className="text-muted-foreground text-sm">{t("onboarding_profile_subtitle")}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t("onboarding_field_prenom")}
              <span className="text-muted-foreground font-normal ml-1">{t("onboarding_field_prenom_hint")}</span>
            </label>
            <input
              type="text"
              placeholder="ex : Marie"
              value={profile.prenom}
              onChange={(e) => setProfile((p) => ({ ...p, prenom: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {isEntreprise ? t("onboarding_field_entity_company") : t("onboarding_field_entity_facilitator")}
              <span className="text-muted-foreground font-normal ml-1">{t("onboarding_field_entity_hint")}</span>
            </label>
            <input
              type="text"
              placeholder={isEntreprise ? "ex : Acme SAS" : "ex : Jean Martin Consulting"}
              value={profile.nomEntite}
              onChange={(e) => setProfile((p) => ({ ...p, nomEntite: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {isEntreprise ? t("onboarding_field_sector_company") : t("onboarding_field_sector_facilitator")}
              <span className="text-muted-foreground font-normal ml-1">{t("onboarding_field_sector_hint")}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sectorOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setProfile((p) => ({ ...p, secteur: s }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${profile.secteur === s ? "border-primary bg-primary/5 font-medium text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t("onboarding_field_goal")}
              <span className="text-muted-foreground font-normal ml-1">{t("onboarding_field_goal_hint")}</span>
            </label>
            <div className="space-y-2">
              {goals.map((g) => (
                <button
                  key={g}
                  onClick={() => setProfile((p) => ({ ...p, objectif: g }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${profile.objectif === g ? "border-primary bg-primary/5 font-medium text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
                >
                  <span>{g}</span>
                  {profile.objectif === g && <CheckCircle2 size={15} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep(3)}
          disabled={!isValid}
          className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("onboarding_cta_continue")} <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setStep(1)}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("onboarding_cta_back")}
        </button>
      </div>
    );
  };

  // ── STEP 3 — FIRST ACTION ────────────────────────────────
  const StepFirstAction = () => {
    const isEntreprise = role === "entreprise";
    const [desc, setDesc] = useState(profile.description);

    const handleFinish = async () => {
      setProfile((p) => ({ ...p, description: desc }));
      await saveProfile(desc);
    };

    return (
      <div className="w-full max-w-md animate-fade-in" key="action">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t("onboarding_step_label", { step: 3, total: TOTAL_STEPS })}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">{t("onboarding_action_title")}</h1>
          <p className="text-muted-foreground text-sm">
            {isEntreprise ? t("onboarding_action_desc_company") : t("onboarding_action_desc_facilitator")}
          </p>
        </div>

        <div className="card-surface p-5 mb-5">
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEntreprise ? t("onboarding_field_desc_company") : t("onboarding_field_desc_facilitator")}
          </label>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={isEntreprise ? t("onboarding_placeholder_desc_company") : t("onboarding_placeholder_desc_facilitator")}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <p className="text-xs text-muted-foreground mt-2">{t("onboarding_desc_note")}</p>
        </div>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="btn-cta w-full py-4 disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> {t("onboarding_saving")}</>
          ) : (
            t("onboarding_cta_finish")
          )}
        </button>
        <button
          onClick={() => saveProfile("")}
          disabled={saving}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          {t("onboarding_cta_skip")}
        </button>
      </div>
    );
  };

  // ── DONE SCREEN ──────────────────────────────────────────
  const StepDone = () => {
    const isEntreprise = role === "entreprise";
    const prenom = profile.prenom || "vous";

    return (
      <div className="w-full max-w-md animate-fade-in text-center" key="done">
        <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          {t("onboarding_done_title", { prenom })}
        </h1>
        <p className="text-muted-foreground text-sm mb-7">
          {isEntreprise ? t("onboarding_done_sub_company") : t("onboarding_done_sub_facilitator")}
        </p>

        <div className="card-surface p-5 mb-6 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("onboarding_done_ready")}</p>
          {[
            t("onboarding_done_item1"),
            isEntreprise ? t("onboarding_done_item2_company") : t("onboarding_done_item2_facilitator"),
            t("onboarding_done_item3"),
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
          {t("onboarding_cta_space")} <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate("/missions")}
          className="w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {isEntreprise ? t("onboarding_cta_missions_company") : t("onboarding_cta_missions_facilitator")}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-foreground">WIINUP MAX</span>
          {step > 0 && step < 4 && !done && (
            <span className="text-xs text-muted-foreground">
              {t("onboarding_step_label", { step, total: TOTAL_STEPS })}
            </span>
          )}
        </div>
      </div>
      {step > 0 && !done && <ProgressBar current={step - 1} total={TOTAL_STEPS} />}
      <div className="flex-1 flex items-center justify-center p-6">
        {done ? <StepDone /> :
          step === 0 ? <StepWelcome /> :
          step === 1 ? <StepRole /> :
          step === 2 ? <StepProfile /> :
          <StepFirstAction />
        }
      </div>
    </div>
  );
}
