/**
 * Onboarding — 2-step profile wizard
 *
 * Architecture notes
 * ──────────────────
 * • StepIdentity, StepSectorGoal, StepDone are defined as TOP-LEVEL functions
 *   (module scope) so React never unmounts/remounts them on parent re-renders.
 *   This is the ONLY reliable fix for the "focus lost after each keystroke" bug.
 *
 * • All change-handlers in the parent are useCallback with [] deps so their
 *   references are stable across re-renders — child props never change identity.
 *
 * • After saveProfile() succeeds:
 *     1. localStorage flag set (prevents ProtectedRoute /checkout bounce)
 *     2. refreshProfile() awaited (profile.onboarding_done is now true in React)
 *     3. navigate() with replace:true → /dashboard/entreprise or /dashboard/facilitateur
 *   No intermediate "done" screen is shown between save and redirect, which
 *   removed the previous window where ProtectedRoute could re-evaluate and bounce.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  Building2,
  Users,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

// ── Types ──────────────────────────────────────────────────────────────────────
type Role = "entreprise" | "facilitateur" | null;
type Cible = "B2B" | "B2C" | "Les deux" | "";

type ProfileData = {
  role: Role;
  prenom: string;
  nomEntite: string;
  secteur: string;
  objectif: string;
  cible: Cible;
};

const TOTAL_STEPS = 2;

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition placeholder:text-muted-foreground/60";

// ── Secteurs ───────────────────────────────────────────────────────────────────
const ENTREPRISE_SECTORS = [
  "SaaS / Tech",
  "Cybersécurité",
  "Intelligence artificielle",
  "Data / Analytics",
  "Cloud / Infrastructure",
  "E-commerce",
  "Marketplace",
  "Marketing digital",
  "Publicité / Adtech",
  "Immobilier résidentiel",
  "Immobilier commercial",
  "PropTech",
  "Finance / Assurance",
  "Banque / Fintech",
  "Gestion de patrimoine",
  "RH / Recrutement",
  "Formation / E-learning",
  "Santé / MedTech",
  "Pharma / Biotech",
  "Industrie / Manufacturing",
  "Transport / Logistique",
  "Énergie / Greentech",
  "Cleantech / ESG",
  "Juridique / LegalTech",
  "Conseil / Management",
  "Retail / Distribution",
  "Hôtellerie / Tourisme",
  "Restauration / FoodTech",
  "Événementiel",
  "Médias / Communication",
  "BTP / Construction",
  "Agriculture / AgriTech",
  "Sport / Bien-être",
  "Art / Culture",
  "Autre",
];

const FACILITATEUR_SECTORS = [
  "Conseil / Accompagnement",
  "Finance / Banque",
  "Immobilier",
  "Réseaux professionnels",
  "RH / Recrutement",
  "Tech / Digital",
  "Marketing",
  "Santé",
  "Industrie",
  "Juridique",
  "Formation",
  "Énergie",
  "Commerce / Distribution",
  "Événementiel",
  "Autre",
];

// ── SectorSearch — module-level to prevent remount ────────────────────────────
interface SectorSearchProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

function SectorSearch({ options, value, onChange }: SectorSearchProps) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div>
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un secteur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${INPUT_CLASS} pl-8 py-2`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
        {filtered.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
              value === s
                ? "border-primary bg-primary/5 font-medium text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/30"
            }`}
          >
            {s}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-xs text-muted-foreground py-2 text-center">
            Aucun résultat
          </p>
        )}
      </div>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="h-1 bg-muted">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${(current / total) * 100}%`,
          background: "var(--gradient-accent)",
        }}
      />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function OnboardingSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-4" />
      <div className="h-7 w-56 bg-muted rounded mb-2" />
      <div className="h-4 w-64 bg-muted rounded mb-6" />
      <div className="h-20 bg-muted rounded-2xl mb-3" />
      <div className="h-20 bg-muted rounded-2xl mb-5" />
      <div className="h-12 bg-muted rounded-xl mb-3" />
      <div className="h-12 bg-muted rounded-xl mb-5" />
      <div className="h-14 bg-muted rounded-xl" />
    </div>
  );
}

// ── STEP 1 — TOP-LEVEL to guarantee stable identity across parent re-renders ──
interface Step1Props {
  role: Role;
  prenom: string;
  nomEntite: string;
  onRoleChange: (r: Role) => void;
  onPrenomChange: (v: string) => void;
  onNomEntiteChange: (v: string) => void;
  onNext: () => void;
}

function StepIdentity({
  role,
  prenom,
  nomEntite,
  onRoleChange,
  onPrenomChange,
  onNomEntiteChange,
  onNext,
}: Step1Props) {
  const step1Valid =
    role !== null && prenom.trim().length > 1 && nomEntite.trim().length > 1;

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Étape 1 sur {TOTAL_STEPS}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Bienvenue sur Wiinup Max
        </h1>
        <p className="text-muted-foreground text-sm">
          Configurons votre espace en 2 minutes.
        </p>
      </div>

      {/* Role cards */}
      <div className="space-y-3 mb-5">
        <button
          type="button"
          onClick={() => onRoleChange("entreprise")}
          className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
            role === "entreprise"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-sm">Entreprise</p>
                {role === "entreprise" && (
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Je cherche des clients via le réseau et l'IA
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onRoleChange("facilitateur")}
          className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
            role === "facilitateur"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Users size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-sm">
                  Apporteur / Facilitateur
                </p>
                {role === "facilitateur" && (
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Je mets en relation et je gagne des commissions
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Identity fields */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Votre prénom{" "}
            <span className="text-muted-foreground font-normal">
              (comment on vous appelle)
            </span>
          </label>
          <input
            type="text"
            placeholder="ex : Marie"
            value={prenom}
            onChange={(e) => onPrenomChange(e.target.value)}
            className={INPUT_CLASS}
            autoComplete="given-name"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {role === "entreprise"
              ? "Nom de l'entreprise"
              : "Votre nom / structure"}
            <span className="text-muted-foreground font-normal ml-1">
              (visible sur votre profil)
            </span>
          </label>
          <input
            type="text"
            placeholder={
              role === "entreprise"
                ? "ex : Acme SAS"
                : "ex : Jean Martin Consulting"
            }
            value={nomEntite}
            onChange={(e) => onNomEntiteChange(e.target.value)}
            className={INPUT_CLASS}
            autoComplete="organization"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
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
}

// ── STEP 2 — TOP-LEVEL to guarantee stable identity across parent re-renders ──
interface Step2Props {
  role: Role;
  secteur: string;
  objectif: string;
  cible: Cible;
  saving: boolean;
  onSecteurChange: (v: string) => void;
  onObjectifChange: (v: string) => void;
  onCibleChange: (v: Cible) => void;
  onSave: () => void;
  onBack: () => void;
}

function StepSectorGoal({
  role,
  secteur,
  objectif,
  cible,
  saving,
  onSecteurChange,
  onObjectifChange,
  onCibleChange,
  onSave,
  onBack,
}: Step2Props) {
  const isEntreprise = role === "entreprise";
  const sectorOptions = isEntreprise ? ENTREPRISE_SECTORS : FACILITATEUR_SECTORS;

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

  const cibles: { value: Cible; label: string; desc: string }[] = [
    { value: "B2B", label: "B2B", desc: "Vendre à des entreprises" },
    { value: "B2C", label: "B2C", desc: "Vendre à des particuliers" },
    { value: "Les deux", label: "Les deux", desc: "Entreprises & particuliers" },
  ];

  const isValid = !!secteur && !!objectif && (isEntreprise ? !!cible : true);

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Étape 2 sur {TOTAL_STEPS}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Votre activité
        </h1>
        <p className="text-muted-foreground text-sm">
          Ces infos aident à trouver les bonnes opportunités.
        </p>
      </div>

      <div className="space-y-5 mb-6">
        {/* Sector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEntreprise ? "Secteur d'activité" : "Domaine de réseau"}
          </label>
          <SectorSearch
            options={sectorOptions}
            value={secteur}
            onChange={onSecteurChange}
          />
        </div>

        {/* Cible commerciale — entreprise only */}
        {isEntreprise && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cible commerciale{" "}
              <span className="text-muted-foreground font-normal">
                (à qui vendez-vous ?)
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {cibles.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onCibleChange(value)}
                  className={`text-left px-3 py-3 rounded-xl border text-sm transition-all flex flex-col gap-0.5 ${
                    cible === value
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Objectif */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Objectif principal{" "}
            <span className="text-muted-foreground font-normal">(un seul)</span>
          </label>
          <div className="space-y-2">
            {goals.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onObjectifChange(g)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${
                  objectif === g
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span>{g}</span>
                {objectif === g && (
                  <CheckCircle2 size={15} className="text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!isValid || saving}
        className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Enregistrement…
          </>
        ) : (
          <>
            Terminer et accéder à mon espace <ArrowRight size={16} />
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        disabled={saving}
        className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
      >
        Retour
      </button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [prenom, setPrenom] = useState("");
  const [nomEntite, setNomEntite] = useState("");
  const [secteur, setSecteur] = useState("");
  const [objectif, setObjectif] = useState("");
  const [cible, setCible] = useState<Cible>("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const navigate = useNavigate();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  // subscription conservé pour compatibilité contexte (peut être supprimé ultérieurement)
  useSubscription();

  // ── Pre-select role from URL param (?role=entreprise after Founder Pass payment) ──
  // This allows /success → /onboarding?role=entreprise to skip the role selection.
  // useSearchParams is NOT used here to keep stable refs — we read only once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "entreprise" || roleParam === "facilitateur") {
      setRole(roleParam as Role);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stable callbacks ── deps are always [] so identities never change ────────
  const handleRoleChange = useCallback((r: Role) => setRole(r), []);
  const handlePrenomChange = useCallback((v: string) => setPrenom(v), []);
  const handleNomEntiteChange = useCallback((v: string) => setNomEntite(v), []);
  const handleSecteurChange = useCallback((v: string) => setSecteur(v), []);
  const handleObjectifChange = useCallback((v: string) => setObjectif(v), []);
  const handleCibleChange = useCallback((v: Cible) => setCible(v), []);
  const handleNext = useCallback(() => setStep(2), []);
  const handleBack = useCallback(() => setStep(1), []);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    try {
      // ── 1. Persist profile ─────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileErr } = await (db.from("profiles") as any)
        .update({
          role,
          prenom,
          onboarding_done: true,
          target_market: role === "entreprise" ? cible || null : null,
          objectif: objectif || null,
        })
        .eq("id", user.id);

      if (profileErr) throw profileErr;

      // ── 2. Persist role-specific data ──────────────────────────────────────
      if (role === "entreprise") {
        const { error: epErr } = await db
          .from("entreprise_profiles")
          .upsert(
            {
              user_id: user.id,
              nom_entreprise: nomEntite,
              secteur,
              cible_client: cible || null,
            },
            { onConflict: "user_id" }
          );
        if (epErr) throw epErr;
      } else if (role === "facilitateur") {
        const { error: fpErr } = await db
          .from("facilitateur_profiles")
          .upsert({ user_id: user.id, secteur }, { onConflict: "user_id" });
        if (fpErr) throw fpErr;
      }

      // ── 3. refreshProfile() is called next — no localStorage needed since
      //       ProtectedRoute reads onboarding_done from server-side profile only.

      // ── 4. Refresh auth profile so role is available in ProtectedRoute ─────
      await refreshProfile();

      trackEvent("onboarding_done", user.id, { role: role ?? "unknown", cible });

      // ── 5. AUDIT 16/03/2026 – BLOQUANTS LEVÉS
      //       Seed demo data pour les entreprises (non-bloquant, idempotent).
      //       Injecte 3 missions + 1 contact pour que le dashboard ne soit jamais vide.
      if (role === "entreprise") {
        void supabase
          .rpc("seed_demo_data", { p_user_id: user.id, p_role: "entreprise" })
          .then(() => {
            toast.success("Votre espace est prêt. 3 missions d'exemple ont été créées pour démarrer.");
          });
      }

      // ── 6. Navigate — replace so the Back button never returns to /onboarding
      const dest =
        role === "entreprise" ? "/dashboard/entreprise" : "/dashboard/facilitateur";
      navigate(dest, { replace: true });
    } catch (err) {
      savingRef.current = false;
      setSaving(false);
      console.error("[Onboarding] saveProfile error", err);
      toast.error("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    }
    // NOTE: savingRef is intentionally NOT reset on success — prevents double-submit
  }, [
    user,
    role,
    prenom,
    nomEntite,
    secteur,
    cible,
    objectif,
    subscription.status,
    refreshProfile,
    navigate,
  ]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border">
          <div className="container flex items-center h-14">
            <span className="font-display font-bold text-foreground">WIINUP MAX</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <OnboardingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-foreground">WIINUP MAX</span>
          <span className="text-xs text-muted-foreground">
            Étape {step} sur {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <ProgressBar current={step} total={TOTAL_STEPS} />

      <div className="flex-1 flex items-center justify-center p-6">
        {step === 1 ? (
          <StepIdentity
            role={role}
            prenom={prenom}
            nomEntite={nomEntite}
            onRoleChange={handleRoleChange}
            onPrenomChange={handlePrenomChange}
            onNomEntiteChange={handleNomEntiteChange}
            onNext={handleNext}
          />
        ) : (
          <StepSectorGoal
            role={role}
            secteur={secteur}
            objectif={objectif}
            cible={cible}
            saving={saving}
            onSecteurChange={handleSecteurChange}
            onObjectifChange={handleObjectifChange}
            onCibleChange={handleCibleChange}
            onSave={saveProfile}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
