import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Eye, EyeOff, CheckCircle2, Zap, AlertCircle, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    // PROOF: signup_started → analytics_events (real write on form submit)
    trackEvent("signup_started", null, { source: "signup_form" });
    setLoading(true);
    const { error: authError } = await signUp(email, password, prenom);
    setLoading(false);

    if (authError) {
      const msg = authError.message || "";
      if (msg.includes("already registered") || msg.includes("user_already_exists")) {
        setError("Cette adresse e-mail est déjà utilisée. Connectez-vous.");
      } else if (msg.includes("password")) {
        setError("Mot de passe trop faible. Utilisez au moins 8 caractères.");
      } else {
        setError("Une erreur est survenue. Vérifiez vos informations.");
      }
      return;
    }

    // Show "check your email" — do NOT auto-redirect before email confirmation
    setSuccess(true);
  };

  // ── Success state: check your inbox ──
  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--gradient-electric)" }}>
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Vérifiez votre boîte mail</h1>
            <p className="text-muted-foreground text-sm mb-1">
              Nous avons envoyé un lien de confirmation à
            </p>
            <p className="font-semibold text-foreground text-sm mb-6">{email}</p>
            <div className="card-surface p-5 text-left space-y-3 mb-6">
              {[
                "Ouvrez l'e-mail de WIINUP MAX",
                "Cliquez sur « Confirmer mon compte »",
                "Vous serez redirigé vers votre espace",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground"
                    style={{ background: "hsl(var(--primary))" }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pas reçu ?{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-primary underline hover:no-underline"
              >
                Renvoyer ou modifier l'e-mail
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--gradient-electric)" }}
            >
              <Zap size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Créer mon compte</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Prêt en 2 minutes. Vraiment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle size={15} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Votre prénom
              </label>
              <input
                type="text"
                placeholder="Marie"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                autoComplete="given-name"
                className="input-premium"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Adresse e-mail
              </label>
              <input
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-premium"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-premium pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-destructive mt-1">
                  {8 - password.length} caractère{8 - password.length > 1 ? "s" : ""} manquant{8 - password.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cta block text-center w-full py-3 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Création…
                </>
              ) : (
                "Créer mon compte →"
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              En créant un compte, vous acceptez nos{" "}
              <Link to="/cgu" className="underline hover:text-foreground">CGU</Link> et notre{" "}
              <Link to="/confidentialite" className="underline hover:text-foreground">politique de confidentialité</Link>.
            </p>
          </form>

          <div className="space-y-2 mt-5">
            {[
              "Apporteur d'affaires ? Votre compte est gratuit",
              "Aucune carte requise avec un code d'invitation",
              "Annulable à tout moment",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span className="text-xs text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
