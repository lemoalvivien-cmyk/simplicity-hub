import { useState } from "react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/layout/PublicNav";
import { Mail, ArrowLeft, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("Impossible d'envoyer l'e-mail. Vérifiez l'adresse saisie.");
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "var(--gradient-electric)" }}>
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">E-mail envoyé !</h1>
            <p className="text-muted-foreground text-sm mb-1">Vérifiez votre boîte mail pour</p>
            <p className="font-semibold text-foreground text-sm mb-6">{email}</p>
            <p className="text-xs text-muted-foreground mb-4">
              Cliquez sur le lien dans l'e-mail pour réinitialiser votre mot de passe.
            </p>
            <Link to="/login" className="text-primary text-sm font-medium hover:underline flex items-center justify-center gap-1">
              <ArrowLeft size={13} /> Retour à la connexion
            </Link>
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--gradient-electric)" }}>
              <Zap size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mot de passe oublié</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Saisissez votre e-mail pour recevoir un lien de réinitialisation.
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
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="input-premium pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary block text-center w-full py-3 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Envoi…
                </>
              ) : (
                "Envoyer le lien →"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            <Link to="/login" className="text-primary font-medium hover:underline flex items-center justify-center gap-1">
              <ArrowLeft size={13} /> Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
