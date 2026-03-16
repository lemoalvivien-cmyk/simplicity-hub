/**
 * ClosedBetaBanner — Displayed on landing when CLOSED_BETA = true
 * Replaces the main CTA with a waitlist signup form.
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
      // Fire-and-forget analytics event reusing existing table
      await (supabase.from("analytics_events") as any).insert({
        event_type: "waitlist_signup",
        session_id: sessionStorage.getItem("wiinup_sid") ?? crypto.randomUUID(),
        user_id: null,
        page: "/",
        properties: { email: email.trim(), source: "closed_beta_banner" },
      });
      setSubmitted(true);
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border-2 p-6 text-center max-w-md mx-auto"
      style={{
        borderColor: "hsl(var(--primary-glow) / 0.4)",
        background: "linear-gradient(145deg, hsl(218 72% 8%), hsl(218 65% 14%))",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.3)" }}
      >
        <Lock size={22} style={{ color: "hsl(var(--primary-glow))" }} />
      </div>

      <h3 className="font-display font-bold text-lg text-white mb-2">
        {BETA_MESSAGE.headline}
      </h3>
      <p className="text-sm text-white/65 mb-5 leading-relaxed">
        {BETA_MESSAGE.body}
      </p>

      {submitted ? (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "hsl(152 62% 34% / 0.15)", border: "1px solid hsl(152 62% 34% / 0.3)" }}
        >
          <CheckCircle2 size={16} style={{ color: "hsl(152 62% 52%)" }} />
          <span className="text-sm font-semibold" style={{ color: "hsl(152 62% 55%)" }}>
            Vous êtes sur la liste — on vous prévient en premier !
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full pl-9 pr-3 py-3 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-cta px-4 py-3 text-sm font-bold flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={15} />
            )}
          </button>
        </form>
      )}

      <p className="text-[11px] text-white/35 mt-3">
        50 places max · Aucun spam · Désabonnement en un clic
      </p>
    </div>
  );
}
