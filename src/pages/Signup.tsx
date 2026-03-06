import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);

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

          <div className="card-surface p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Votre prénom
              </label>
              <input
                type="text"
                placeholder="Marie"
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

            <Link to="/onboarding" className="btn-cta block text-center w-full py-3 text-sm">
              Créer mon compte →
            </Link>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              En créant un compte, vous acceptez nos{" "}
              <a href="#" className="underline">CGU</a> et notre{" "}
              <a href="#" className="underline">politique de confidentialité</a>.
            </p>
          </div>

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
