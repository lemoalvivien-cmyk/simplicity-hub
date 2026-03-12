/**
 * Auto-Pilot Toggle — active la génération autonome de leads (mode cron)
 * Persiste autopilot_enabled dans openclaw_dossier via Supabase.
 * RLS : seul l'owner peut modifier son propre dossier.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap, Loader2, ChevronRight, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AutoPilotToggleProps {
  /** Compact pill mode for teaser */
  compact?: boolean;
  onChange?: (enabled: boolean) => void;
}

export default function AutoPilotToggle({ compact = false, onChange }: AutoPilotToggleProps) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current state from DB
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("openclaw_dossier")
      .select("autopilot_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(data?.autopilot_enabled ?? false);
        setLoading(false);
      });
  }, [user?.id]);

  const toggle = async () => {
    if (!user?.id || saving) return;
    const next = !enabled;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("openclaw_dossier")
        .update({ autopilot_enabled: next })
        .eq("user_id", user.id);

      if (error) throw error;
      setEnabled(next);
      onChange?.(next);
      toast.success(
        next
          ? "✅ Auto-Pilot activé — OpenClaw génère des leads automatiquement"
          : "⏸ Auto-Pilot désactivé — génération manuelle uniquement"
      );
    } catch (err) {
      console.error("[AutoPilot] toggle error:", err);
      toast.error("Erreur lors de la mise à jour de l'Auto-Pilot.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "hsl(218 55% 14% / 0.6)" }}>
        <Loader2 size={13} className="animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Chargement Auto-Pilot…</span>
      </div>
    );
  }

  if (compact) {
    return (
      <motion.button
        onClick={toggle}
        disabled={saving}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-left transition-all"
        style={{
          background: enabled ? "hsl(152 62% 48% / 0.1)" : "hsl(218 55% 14% / 0.6)",
          border: `1px solid ${enabled ? "hsl(152 62% 48% / 0.35)" : "hsl(218 45% 26% / 0.4)"}`,
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: enabled ? "hsl(152 62% 48% / 0.18)" : "hsl(218 55% 20% / 0.8)",
            border: `1px solid ${enabled ? "hsl(152 62% 48% / 0.3)" : "hsl(218 45% 28% / 0.3)"}`,
          }}
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "hsl(var(--primary-glow))" }} />
          ) : (
            <Bot size={14} style={{ color: enabled ? "hsl(152 62% 52%)" : "hsl(var(--primary-glow))" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary-glow))" }}>
            Auto-Pilot
          </p>
          <p className="text-[10px] font-medium" style={{ color: enabled ? "hsl(152 62% 52%)" : "hsl(var(--muted-foreground))" }}>
            {enabled ? "● Actif — génération auto" : "Manuel uniquement"}
          </p>
        </div>
        {/* Toggle pill */}
        <div
          className="relative w-9 h-5 rounded-full shrink-0 transition-all"
          style={{ background: enabled ? "hsl(152 62% 48%)" : "hsl(218 45% 24% / 0.8)" }}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(218 65% 8% / 0.95)",
        border: `1px solid ${enabled ? "hsl(152 62% 48% / 0.4)" : "hsl(218 45% 22% / 0.5)"}`,
        backdropFilter: "blur(20px)",
        transition: "border-color 0.3s",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: enabled ? "hsl(152 62% 48% / 0.18)" : "hsl(218 55% 18% / 0.8)",
              border: `1px solid ${enabled ? "hsl(152 62% 48% / 0.35)" : "hsl(218 45% 28% / 0.3)"}`,
              transition: "all 0.3s",
            }}
          >
            <Bot size={18} style={{ color: enabled ? "hsl(152 62% 52%)" : "hsl(var(--primary-glow))" }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Auto-Pilot</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: enabled ? "hsl(152 62% 52%)" : "hsl(var(--muted-foreground))" }}>
              {enabled ? "● Prospection autonome active" : "Mode manuel"}
            </p>
          </div>
        </div>

        {/* Big toggle */}
        <motion.button
          onClick={toggle}
          disabled={saving}
          className="relative w-14 h-7 rounded-full shrink-0 disabled:opacity-60"
          style={{ background: enabled ? "hsl(152 62% 48%)" : "hsl(218 45% 22% / 0.8)" }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
            animate={{ left: enabled ? "calc(100% - 24px)" : "4px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
          {saving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={12} className="animate-spin text-white/70" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Status info */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="mx-5 mb-4 px-4 py-3 rounded-xl"
              style={{
                background: "hsl(152 62% 48% / 0.08)",
                border: "1px solid hsl(152 62% 48% / 0.2)",
              }}
            >
              <div className="flex items-start gap-2">
                <Zap size={12} style={{ color: "hsl(152 62% 52%)" }} className="shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(152 62% 60%)" }}>
                  Triple Threat Swarm génère automatiquement 5 leads/jour via Gemini·Qwen·Grok. 
                  Chaque lead est scoré par consensus et notifié en temps réel.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guard note */}
      <div
        className="flex items-center gap-2 px-5 pb-4 text-[10px]"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        <Shield size={10} className="shrink-0" />
        <span>Vous contrôlez chaque lead avant action — aucun message envoyé automatiquement.</span>
      </div>
    </div>
  );
}
