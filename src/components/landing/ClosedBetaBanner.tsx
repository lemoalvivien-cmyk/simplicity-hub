/**
 * ClosedBetaBanner — Affiché sur la landing quand CLOSED_BETA = true.
 * Collecte les emails de la liste d'attente (table analytics_events).
 */
import { useState } from "react";
import { Lock, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { BETA_MESSAGE } from "@/lib/betaConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClosedBetaBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await (supabase.from("analytics_events") as any).insert({
        event_type: "waitlist_signup",
        session_id: sessionStorage.getItem("wiinup_sid") ?? crypto.randomUUID(),
        user_id: null,
        page: "/",
        properties: { email: email.trim(), source: "closed_beta_banner" },
      });
      setSubmitted(true);
    } catch {
      toast.error("Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border-2 p-6 sm:p-8 text-center max-w-md mx-auto"
      style={{
        borderColor: "hsl(var(--primary-glow) / 0.35)",
        background: "linear-gradient(145deg, hsl(218 72% 8%), hsl(218 65% 14%))",
      }}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.25)" }}
      >
        <Lock size={24} style={{ color: "hsl(var(--primary-glow))" }} />
      </div>

      {/* Copy */}
      <h3 className="font-display font-bold text-xl text-white mb-2 leading-snug">
        {BETA_MESSAGE.headline}
      </h3>
      <p className="text-sm text-white/60 mb-6 leading-relaxed max-w-xs mx-auto">
        {BETA_MESSAGE.body}
      </p>

      {/* Form / confirmation */}
      {submitted ? (
        <div
          className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl"
          style={{ background: "hsl(152 62% 34% / 0.15)", border: "1px solid hsl(152 62% 34% / 0.3)" }}
        >
          <CheckCircle2 size={17} style={{ color: "hsl(152 62% 52%)" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(152 62% 58%)" }}>
            {BETA_MESSAGE.confirmation}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <div className="flex-1 relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              aria-label="Votre adresse email"
              className="w-full pl-10 pr-3 py-3.5 rounded-xl text-sm border text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              style={{ background: "hsl(218 72% 12%)", borderColor: "hsl(218 55% 25% / 0.6)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            aria-label="M'inscrire sur la liste d'attente"
            className="btn-cta px-5 py-3.5 text-sm font-bold flex items-center gap-2 shrink-0"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span className="hidden sm:inline">{BETA_MESSAGE.cta}</span><ArrowRight size={16} /></>
            }
          </button>
        </form>
      )}

      <p className="text-[11px] text-white/30 mt-4">
        {BETA_MESSAGE.disclaimer}
      </p>
    </div>
  );
}
