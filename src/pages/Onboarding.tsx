import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Building2, Users, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { toast } from "sonner";

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
        style={{
          width: `${((current + 1) / total) * 100}%`,
          background: "var(--gradient-accent)",
        }}
      />
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<ProfileData>({
    role: null,
    prenom: "",
    nomEntite: "",
    secteur: "",
    objectif: "",
    description: "",
  });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const via = params.get("via");

  const welcomeMsg =
    via === "code"
      ? "Votre accès de 12 mois est bien actif. Prenons 2 minutes pour personnaliser votre espace."
      : "Votre accès est activé. Prenons 2 minutes pour préparer votre espace.";

  const saveProfile = async (description: string) => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile role and prenom
      await db
        .from("profiles")
        .update({
          role: role,
          prenom: profile.prenom,
          onboarding_done: true,
        })
        .eq("id", user.id);

      // Create role-specific profile
      if (role === "entreprise") {
        await db
          .from("entreprise_profiles")
          .upsert({
            user_id: user.id,
            nom_entreprise: profile.nomEntite,
            secteur: profile.secteur,
            description: description,
          }, { onConflict: "user_id" });
      } else if (role === "facilitateur") {
        await db
          .from("facilitateur_profiles")
          .upsert({
            user_id: user.id,
            description_reseau: description,
            secteur: profile.secteur,
          }, { onConflict: "user_id" });
      }

      await refreshProfile();
      setDone(true);
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  // ── ÉTAPE 0 — BIENVENUE ─────────────────────────────────────
  const StepWelcome = () => (
    <div className="w-full max-w-md animate-fade-in" key="welcome">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5">
          <span className="text-white font-display font-bold text-xl">W</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Bienvenue sur WIINUP MAX 👋
        </h1>
        <p className="text-muted-foreground leading-relaxed">{welcomeMsg}</p>
      </div>

      {/* Double moteur */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl p-4" style={{
          background: "linear-gradient(135deg, hsl(218 65% 9%), hsl(218 55% 12%))",
          border: "1px solid hsl(218 40% 22% / 0.6)"
        }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(218 72% 65%)" }}>Moteur 1</p>
          <p className="font-semibold text-white text-sm">Prospection automatisée</p>
          <p className="text-white/45 text-xs mt-1">OpenClaw pilote vos agents 24h/24</p>
        </div>
        <div className="rounded-2xl p-4" style={{
          background: "linear-gradient(135deg, hsl(24 60% 8%), hsl(38 50% 11%))",
          border: "1px solid hsl(24 50% 20% / 0.6)"
        }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(24 100% 65%)" }}>Moteur 2</p>
          <p className="font-semibold text-white text-sm">Apport d'affaires</p>
          <p className="text-white/45 text-xs mt-1">Votre réseau ouvre des portes</p>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mb-5">
        Les deux ensemble = plus puissant. Vous activez un double moteur d'acquisition.
      </p>

      <div className="card-surface p-5 mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ce qui vous attend
        </p>
        {[
          { n: "1", label: "Vous dites qui vous êtes", sub: "entreprise ou apporteur d'affaires" },
          { n: "2", label: "Vous renseignez l'essentiel", sub: "quelques informations simples" },
          { n: "3", label: "Vous faites votre première action", sub: "et votre espace est prêt" },
        ].map(({ n, label, sub }) => (
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

      <p className="text-xs text-muted-foreground mb-5 text-center">
        ✓ Moins de 2 minutes · Pas de fausse bonne réponse · Vous pourrez modifier tout ça plus tard
      </p>

      <button onClick={() => setStep(1)} className="btn-cta w-full py-4">
        C'est parti <ArrowRight size={16} />
      </button>
    </div>
  );

  // ── ÉTAPE 1 — CHOIX DU RÔLE ─────────────────────────────────
  const StepRole = () => (
    <div className="w-full max-w-md animate-fade-in" key="role">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Étape 1 sur {TOTAL_STEPS}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Vous êtes plutôt…
        </h1>
        <p className="text-muted-foreground text-sm">
          Cette réponse va personnaliser votre espace. Vous pourrez la modifier plus tard.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <button
          onClick={() => setRole("entreprise")}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
            role === "entreprise"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Je représente une entreprise</p>
                {role === "entreprise" && <CheckCircle2 size={18} className="text-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Je cherche de nouveaux clients grâce à un réseau de recommandation.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRole("facilitateur")}
          className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
            role === "facilitateur"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Users size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">Je suis apporteur d'affaires</p>
                {role === "facilitateur" && <CheckCircle2 size={18} className="text-primary shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                J'ai un réseau et je peux mettre en relation des entreprises avec leurs futurs clients.
              </p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={() => {
          setProfile((p) => ({ ...p, role }));
          setStep(2);
        }}
        disabled={!role}
        className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continuer <ChevronRight size={16} />
      </button>
    </div>
  );

  // ── ÉTAPE 2 — INFORMATIONS ESSENTIELLES ─────────────────────
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
            Étape 2 sur {TOTAL_STEPS}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Parlez-nous de vous
          </h1>
          <p className="text-muted-foreground text-sm">
            Ces informations vont personnaliser vos recommandations. Rien de superflu.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Votre prénom
              <span className="text-muted-foreground font-normal ml-1">— pour qu'on s'adresse à vous correctement</span>
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
              {isEntreprise ? "Nom de votre entreprise" : "Votre nom ou celui de votre activité"}
              <span className="text-muted-foreground font-normal ml-1">— affiché sur votre profil</span>
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
              {isEntreprise ? "Votre secteur d'activité" : "Votre domaine de réseau"}
              <span className="text-muted-foreground font-normal ml-1">— pour vous montrer les bonnes missions</span>
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Votre objectif principal
              <span className="text-muted-foreground font-normal ml-1">— pour prioriser ce qui compte</span>
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
          onClick={() => setStep(3)}
          disabled={!isValid}
          className="btn-cta w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuer <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setStep(1)}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Revenir en arrière
        </button>
      </div>
    );
  };

  // ── ÉTAPE 3 — PREMIÈRE ACTION ────────────────────────────────
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
            Étape 3 sur {TOTAL_STEPS}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Votre espace est presque prêt ✨
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEntreprise
              ? "Décrivez en quelques mots ce que vous proposez. C'est ce que verront les apporteurs d'affaires."
              : "Décrivez en quelques mots le type d'entreprises ou de clients que vous connaissez."}
          </p>
        </div>

        <div className="card-surface p-5 mb-5">
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEntreprise ? "Ce que vous proposez" : "Votre réseau en quelques mots"}
          </label>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={
              isEntreprise
                ? "ex : Je propose un logiciel de facturation pour les TPE. Je cherche des clients dans le commerce et l'artisanat."
                : "ex : J'ai un réseau de dirigeants TPE/PME en Île-de-France, principalement dans le commerce et les services."
            }
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Pas besoin d'être parfait. Vous pouvez compléter votre profil à tout moment.
          </p>
        </div>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="btn-cta w-full py-4 disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Finalisation…</>
          ) : (
            "Terminer et accéder à mon espace →"
          )}
        </button>
        <button
          onClick={() => saveProfile("")}
          disabled={saving}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          Passer cette étape, je compléterai plus tard
        </button>
      </div>
    );
  };

  // ── ÉCRAN FIN ────────────────────────────────────────────────
  const StepDone = () => {
    const isEntreprise = role === "entreprise";
    const prenom = profile.prenom || "vous";

    const primaryCTA = isEntreprise
      ? { label: "Créer ma première mission →", path: "/missions" }
      : { label: "Voir les missions disponibles →", path: "/missions" };

    return (
      <div className="w-full max-w-md animate-fade-in text-center" key="done">
        <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          C'est prêt, {prenom} !
        </h1>
        <p className="text-muted-foreground text-sm mb-7">
          {isEntreprise
            ? "Votre espace entreprise est prêt. Vous pouvez maintenant créer votre première mission et attendre les premières introductions."
            : "Votre espace apporteur est prêt. Vous pouvez maintenant parcourir les missions disponibles et faire votre première introduction."}
        </p>

        <div className="card-surface p-5 mb-6 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ce qui est prêt
          </p>
          {[
            "Votre profil est créé",
            isEntreprise ? "Votre espace entreprise est configuré" : "Votre espace apporteur est configuré",
            "Vous pouvez déjà agir",
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
          {isEntreprise ? "Voir les missions disponibles" : "Explorer les missions"}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-foreground">WIINUP MAX</span>
          {step > 0 && step < 4 && !done && (
            <span className="text-xs text-muted-foreground">Étape {step} sur {TOTAL_STEPS}</span>
          )}
        </div>
      </div>

      {/* Progress */}
      {step > 0 && !done && <ProgressBar current={step - 1} total={TOTAL_STEPS} />}

      {/* Content */}
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
