import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ChevronRight, Building2, Users, ArrowRight, Loader2,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

// ── Types ─────────────────────────────────────────────────────
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

// ── Shared sub-components ─────────────────────────────────────
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

// ── SECTOR SELECT with search ─────────────────────────────────
const ENTREPRISE_SECTORS = [
  "SaaS / Tech",
  "Cybersécurité",
  "Intelligence artificielle",
  "E-commerce",
  "Marketing digital",
  "Immobilier",
  "Immobilier commercial",
  "Finance / Assurance",
  "Banque / Fintech",
  "RH / Recrutement",
  "Formation / E-learning",
  "Santé / MedTech",
  "Industrie / Manufacturing",
  "Transport / Logistique",
  "Énergie / Greentech",
  "Juridique / LegalTech",
  "Conseil / Management",
  "Retail / Distribution",
  "Hôtellerie / Tourisme",
  "Restauration",
  "Événementiel",
  "Médias / Communication",
  "BTP / Construction",
  "Agriculture / AgriTech",
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

function SectorSearch({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
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
          <p className="col-span-2 text-xs text-muted-foreground py-2 text-center">Aucun résultat</p>
        )}
      </div>
    </div>
  );
}

// ── STEP 1 — extracted as top-level component to prevent remount ──
interface Step1Props {
  role: Role;
  prenom: string;
  nomEntite: string;
  onRoleChange: (r: Role) => void;
  onPrenomChange: (v: string) => void;
  onNomEntiteChange: (v: string) => void;
  onNext: () => void;
}

function StepIdentity({ role, prenom, nomEntite, onRoleChange, onPrenomChange, onNomEntiteChange, onNext }: Step1Props) {
  const step1Valid = role !== null && prenom.trim().length > 1 && nomEntite.trim().length > 1;

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
          type="button"
          onClick={() => onRoleChange("entreprise")}
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
          type="button"
          onClick={() => onRoleChange("facilitateur")}
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
            value={prenom}
            onChange={(e) => onPrenomChange(e.target.value)}
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

// ── STEP 2 — extracted as top-level component to prevent remount ──
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
  role, secteur, objectif, cible, saving,
  onSecteurChange, onObjectifChange, onCibleChange, onSave, onBack,
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
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">Votre activité</h1>
        <p className="text-muted-foreground text-sm">Ces infos aident à trouver les bonnes opportunités.</p>
      </div>

      <div className="space-y-5 mb-6">
        {/* Sector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEntreprise ? "Secteur d'activité" : "Domaine de réseau"}
          </label>
          <SectorSearch options={sectorOptions} value={secteur} onChange={onSecteurChange} />
        </div>

        {/* Cible commerciale — entreprise only */}
        {isEntreprise && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cible commerciale <span className="text-muted-foreground font-normal">(qui achetez-vous ?)</span>
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
                  <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Objectif */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Objectif principal <span className="text-muted-foreground font-normal">(un seul)</span>
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
                {objectif === g && <CheckCircle2 size={15} className="text-primary shrink-0" />}
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
          <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
        ) : (
          <>Terminer et accéder à mon espace <ArrowRight size={16} /></>
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

// ── DONE SCREEN ───────────────────────────────────────────────
interface DoneProps { role: Role; prenom: string; onNavigate: (path: string) => void; }

function StepDone({ role, prenom, onNavigate }: DoneProps) {
  const isEntreprise = role === "entreprise";
  const name = prenom || "vous";
  return (
    <div className="w-full max-w-md animate-fade-in text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "hsl(var(--success) / 0.15)" }}
      >
        <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
      </div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Bienvenue, {name} ! 🎉
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
        type="button"
        onClick={() => onNavigate(isEntreprise ? "/dashboard/entreprise" : "/dashboard/facilitateur")}
        className="btn-cta w-full py-4 mb-3"
      >
        Accéder à mon espace <ArrowRight size={16} />
      </button>
      <button
        type="button"
        onClick={() => onNavigate("/missions")}
        className="w-full px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {isEntreprise ? "Créer ma première mission" : "Voir les missions disponibles"}
      </button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [prenom, setPrenom] = useState("");
  const [nomEntite, setNomEntite] = useState("");
  const [secteur, setSecteur] = useState("");
  const [objectif, setObjectif] = useState("");
  const [cible, setCible] = useState<Cible>("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const subscription = useSubscription();

  // Stable callbacks — prevent re-renders from destroying child focus
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
    if (saving || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await db
        .from("profiles")
        .update({ role, prenom, onboarding_done: true })
        .eq("id", user.id);

      if (role === "entreprise") {
        await db.from("entreprise_profiles").upsert(
          { user_id: user.id, nom_entreprise: nomEntite, secteur, cible_client: cible || null },
          { onConflict: "user_id" }
        );
      } else if (role === "facilitateur") {
        await db.from("facilitateur_profiles").upsert(
          { user_id: user.id, secteur },
          { onConflict: "user_id" }
        );
      }

      // Persist locally so ProtectedRoute doesn't bounce during the async refreshProfile
      try {
        localStorage.setItem("onboarding_done", "true");
        localStorage.setItem("onboarding_role", role ?? "");
      } catch { /* storage may be unavailable */ }

      trackEvent("onboarding_done", user.id, { role: role ?? "unknown", cible });
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
        toast.success("Le cerveau WiinupMax analyse votre profil. Vos premières recommandations arrivent…");
      } else if (role === "facilitateur") {
        supabase.functions
          .invoke("openclaw-scheduler", { body: { tick_type: "welcome_scan", user_id: user.id } })
          .catch(() => {});
      }

      setDone(true);
    } catch {
      savingRef.current = false;
      toast.error("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [user, saving, role, prenom, nomEntite, secteur, cible, subscription.status, refreshProfile]);

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

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
        {done ? (
          <StepDone role={role} prenom={prenom} onNavigate={handleNavigate} />
        ) : step === 1 ? (
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
