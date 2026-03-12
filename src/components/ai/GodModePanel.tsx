/**
 * GodModePanel — Dashboard teaser Triple Threat Swarm
 * Regroupe : Swarm status + War Caller compact + Auto-Pilot toggle
 * Accessible depuis le dashboard entreprise.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Swords, Activity, ChevronRight, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import WarCaller from "@/components/ai/WarCaller";
import AutoPilotToggle from "@/components/ai/AutoPilotToggle";
import { toast } from "sonner";

interface SwarmAgent {
  id: string;
  label: string;
  score: number | null;
  latencyMs: number;
  status: "success" | "error";
}

interface SwarmResult {
  agents: SwarmAgent[];
  total_ms: number;
}

interface GodModePanelProps {
  /** Brief context for War Caller (missions, leads actifs) */
  contextBrief?: string;
}

const AGENT_COLORS: Record<string, string> = {
  gemini: "hsl(var(--primary-glow))",
  qwen:   "hsl(var(--accent))",
  grok:   "hsl(152 62% 52%)",
};

export default function GodModePanel({ contextBrief }: GodModePanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"swarm" | "voice" | "autopilot">("swarm");
  const [generating, setGenerating] = useState(false);
  const [lastSwarm, setLastSwarm] = useState<SwarmResult | null>(null);
  const [lastLead, setLastLead] = useState<{ person_name: string; company_name: string; ai_score: number; ai_label: string } | null>(null);

  const handleSwarm = async () => {
    if (!user?.id || generating) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/openclaw-lead-generator`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ mode: "manual" }),
      });
      const json = await res.json();
      if (json.success && json.lead) {
        setLastSwarm(json.swarm);
        setLastLead(json.lead);
        toast.success(`🎯 Swarm — ${json.lead.person_name} @ ${json.lead.company_name} — Score ${json.lead.ai_score}`);
      } else if (json.skipped) {
        toast.info(json.reason ?? "Swarm en attente.");
      } else {
        toast.error(json.error ?? "Erreur Swarm.");
      }
    } catch {
      toast.error("Erreur réseau Swarm.");
    } finally {
      setGenerating(false);
    }
  };

  const TABS = [
    { id: "swarm" as const,     label: "Swarm",      icon: Swords },
    { id: "voice" as const,     label: "War Caller",  icon: Activity },
    { id: "autopilot" as const, label: "Auto-Pilot",  icon: Zap },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(218 65% 8% / 0.97)",
        border: "1px solid hsl(218 45% 20% / 0.55)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "hsl(var(--accent) / 0.12)",
              border: "1px solid hsl(var(--accent) / 0.3)",
            }}
          >
            <Zap size={14} style={{ color: "hsl(var(--accent))" }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">God Mode</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] mt-0.5"
              style={{ color: "hsl(var(--accent))" }}>Triple Threat Swarm</p>
          </div>
        </div>
        <Link
          to="/pilotage"
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Tout voir <ChevronRight size={10} />
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3 pb-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: isActive ? "hsl(var(--accent) / 0.12)" : "transparent",
                color: isActive ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))",
                border: isActive ? "1px solid hsl(var(--accent) / 0.25)" : "1px solid transparent",
              }}
            >
              <Icon size={11} strokeWidth={2.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">

          {/* ── SWARM ─────────────────────────────────────── */}
          {tab === "swarm" && (
            <motion.div
              key="swarm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* 3 agent pills */}
              <div className="grid grid-cols-3 gap-2">
                {["gemini", "qwen", "grok"].map((id, i) => {
                  const labels = ["Gemini 2.5", "Qwen", "Grok"];
                  const agent = lastSwarm?.agents.find((a) => a.id === id);
                  const color = AGENT_COLORS[id];
                  return (
                    <div
                      key={id}
                      className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl"
                      style={{
                        background: `hsl(${id === "gemini" ? "210 88% 68%" : id === "qwen" ? "38 95% 52%" : "152 62% 52%"} / 0.07)`,
                        border: `1px solid ${color.replace(")", " / 0.25)")}`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: color.replace(")", " / 0.15)"), border: `1px solid ${color.replace(")", " / 0.3)")}` }}
                      >
                        <Swords size={11} style={{ color }} />
                      </div>
                      <p className="text-[9px] font-bold text-center" style={{ color }}>{labels[i]}</p>
                      {agent && (
                        <p className="text-[9px] text-center" style={{ color: agent.status === "success" ? "hsl(152 62% 52%)" : "hsl(0 65% 55%)" }}>
                          {agent.status === "success" ? `${agent.score ?? "—"}/100` : "⚠ err"}
                        </p>
                      )}
                      {!agent && <p className="text-[9px] text-white/30">Inactif</p>}
                    </div>
                  );
                })}
              </div>

              {/* Last result */}
              {lastLead && (
                <div
                  className="px-3 py-2.5 rounded-xl"
                  style={{
                    background: "hsl(152 62% 48% / 0.07)",
                    border: "1px solid hsl(152 62% 48% / 0.2)",
                  }}
                >
                  <p className="text-[10px] font-bold text-white/85">
                    {lastLead.person_name} @ {lastLead.company_name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "hsl(152 62% 52%)" }}>
                    Score consensus : {lastLead.ai_score}/100 · {lastLead.ai_label}
                    {lastSwarm && ` · ${lastSwarm.total_ms}ms`}
                  </p>
                </div>
              )}

              {/* CTA */}
              <motion.button
                onClick={handleSwarm}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 64%))" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /> Swarm en cours…</>
                ) : (
                  <><Sparkles size={14} /> Lancer le Swarm</>
                )}
              </motion.button>

              {lastSwarm && (
                <p className="text-center text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Consensus · {lastSwarm.agents.filter((a) => a.status === "success").length}/3 agents · {lastSwarm.total_ms}ms
                </p>
              )}
            </motion.div>
          )}

          {/* ── WAR CALLER ────────────────────────────────── */}
          {tab === "voice" && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <WarCaller contextBrief={contextBrief} />
            </motion.div>
          )}

          {/* ── AUTO-PILOT ────────────────────────────────── */}
          {tab === "autopilot" && (
            <motion.div
              key="autopilot"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AutoPilotToggle />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
