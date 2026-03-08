import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Eye, EyeOff, Zap, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const { signIn, profile, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // PASSE F: preserve intent URL + show confirmation banner
  const confirmed = searchParams.get("confirmed") === "true";
  const from = (location.state as { from?: Location })?.from?.pathname || null;

  // Redirect ONLY after profile is fully loaded (not on every render)
  useEffect(() => {
    if (loading || !user || !profile) return;
    setRedirecting(true);
    if (!profile.onboarding_done) {
      navigate("/onboarding", { replace: true });
    } else if (profile.role === "entreprise") {
      navigate("/dashboard/entreprise", { replace: true });
    } else if (profile.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      // PASSE F: restore intent URL if available
      navigate(from || "/dashboard/facilitateur", { replace: true });
    }
  }, [loading, user, profile, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      const msg = authError.message || "";
      if (msg.includes("Email not confirmed")) {
        setError("Confirmez d'abord votre e-mail. Vérifiez votre boîte mail.");
      } else if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        setError("Email ou mot de passe incorrect. Vérifiez vos informations.");
      } else {
        setError("Impossible de se connecter. Réessayez dans quelques instants.");
      }
      setSubmitting(false);
      return;
    }
    // Profile loading + redirect handled by useEffect above
  };

  // Show full-page spinner while redirect is happening
  if (redirecting || (loading && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Connexion en cours…</p>
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
            <h1 className="font-display text-2xl font-bold text-foreground">Bon retour 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Connectez-vous à votre espace WIINUP MAX</p>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary block text-center w-full py-3 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter →"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Pas encore de compte ?{" "}
            <Link to="/pricing" className="text-primary font-medium hover:underline">
              Démarrer maintenant
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
