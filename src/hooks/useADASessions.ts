/**
 * useADASessions — Real-time ADA Control Panel hook
 * Manages session lifecycle + live transcription + Realtime subscription
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

export type ADAState =
  | "idle" | "scanning" | "preparing_script" | "awaiting_consent"
  | "calling" | "negotiating" | "awaiting_human_validation"
  | "generating_contract" | "awaiting_final_closing" | "closed" | "abandoned" | "error";

export interface ADASession {
  id: string;
  owner_user_id: string;
  target_name: string;
  target_phone: string | null;
  target_email: string | null;
  target_context: Record<string, unknown>;
  state: ADAState;
  previous_state: ADAState | null;
  state_entered_at: string;
  adaptive_script: string | null;
  reasoning_trace: unknown[];
  negotiation_notes: string | null;
  elevenlabs_call_id: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  call_duration_sec: number | null;
  human_validated_at: string | null;
  human_validated_by: string | null;
  final_closed_at: string | null;
  stripe_payment_link: string | null;
  contract_amount: number | null;
  royalty_12pct: number | null;
  outcome: string | null;
  roi_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ADATranscription {
  id: string;
  session_id: string;
  speaker: "agent" | "prospect" | "system";
  text: string;
  is_key_moment: boolean;
  key_moment_type: string | null;
  agent_reasoning: string | null;
  created_at: string;
}

export interface ADANodeEvent {
  id: string;
  session_id: string;
  node_name: string;
  duration_ms: number | null;
  success: boolean;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function callOrchestrator(body: Record<string, unknown>, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ada-orchestrator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function callVoice(body: Record<string, unknown>, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ada-voice-call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (res.headers.get("content-type")?.includes("audio")) return res;
  return res.json();
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useADASessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ADASession[]>([]);
  const [activeSession, setActiveSession] = useState<ADASession | null>(null);
  const [transcriptions, setTranscriptions] = useState<ADATranscription[]>([]);
  const [nodeEvents, setNodeEvents] = useState<ADANodeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Fetch sessions ────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("ada_sessions" as never)
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setSessions(data as unknown as ADASession[]);
  }, [user?.id]);

  // ── Fetch session detail ──────────────────────────────────────────────────
  const fetchSessionDetail = useCallback(async (sessionId: string) => {
    const [{ data: session }, { data: txns }, { data: nodes }] = await Promise.all([
      supabase.from("ada_sessions" as never).select("*").eq("id", sessionId).single(),
      supabase.from("ada_transcriptions" as never).select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      supabase.from("ada_node_events" as never).select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
    ]);
    if (session) setActiveSession(session as unknown as ADASession);
    if (txns) setTranscriptions(txns as unknown as ADATranscription[]);
    if (nodes) setNodeEvents(nodes as unknown as ADANodeEvent[]);
  }, []);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchSessions();

    const channel = supabase
      .channel("ada_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ada_sessions", filter: `owner_user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as ADASession;
          setSessions(prev => {
            const idx = prev.findIndex(s => s.id === updated.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
            return [updated, ...prev];
          });
          if (activeSession?.id === updated.id) setActiveSession(updated);
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ada_transcriptions" },
        (payload) => {
          const t = payload.new as ADATranscription;
          if (t.session_id === activeSession?.id) {
            setTranscriptions(prev => [...prev, t]);
          }
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ada_node_events" },
        (payload) => {
          const n = payload.new as ADANodeEvent;
          if (n.session_id === activeSession?.id) {
            setNodeEvents(prev => [...prev, n]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, activeSession?.id, fetchSessions]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startSession = useCallback(async (params: {
    target_name: string;
    target_phone?: string;
    target_email?: string;
    target_context?: Record<string, unknown>;
  }) => {
    if (!user) return;
    setLoading(true);
    setActionLoading("start");
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token ?? "";
      const result = await callOrchestrator({ action: "start", ...params }, token);
      if (result.success) {
        toast.success(`🎯 Session ADA démarrée — Script prêt pour ${params.target_name}`);
        await fetchSessions();
        await fetchSessionDetail(result.session_id);
      } else {
        toast.error(result.error ?? "Erreur démarrage session");
      }
      return result;
    } catch (e) {
      toast.error("Erreur réseau ADA");
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  }, [user, fetchSessions, fetchSessionDetail]);

  const giveConsent = useCallback(async (sessionId: string, granted: boolean) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("consent");
    try {
      const result = await callOrchestrator({ action: "consent", session_id: sessionId, consent_given: granted }, token);
      if (result.success) {
        toast.success(granted ? "✅ Consentement RGPD enregistré" : "⛔ Session abandonnée — refus de consentement");
        await fetchSessionDetail(sessionId);
      }
      return result;
    } finally {
      setActionLoading(null);
    }
  }, [fetchSessionDetail]);

  const negotiate = useCallback(async (sessionId: string, prospectMessage: string, history: { role: string; content: string }[]) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    return callOrchestrator({
      action: "negotiate",
      session_id: sessionId,
      prospect_message: prospectMessage,
      conversation_history: history,
    }, token);
  }, []);

  const validateCall = useCallback(async (sessionId: string, amount: number) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("validate");
    try {
      const result = await callOrchestrator({ action: "validate", session_id: sessionId, amount }, token);
      if (result.success) {
        toast.success(`✅ Appel validé — Contrat Stripe généré — Royalty 12%: ${result.royalty_12pct}€`);
        await fetchSessionDetail(sessionId);
      } else {
        toast.error(result.error ?? "Erreur validation");
      }
      return result;
    } finally {
      setActionLoading(null);
    }
  }, [fetchSessionDetail]);

  const confirmClosing = useCallback(async (sessionId: string, outcome = "deal_closed", roiScore = 100) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    setActionLoading("close");
    try {
      const result = await callOrchestrator({ action: "close", session_id: sessionId, outcome, roi_score: roiScore }, token);
      if (result.success) {
        toast.success("🎉 Deal closé ! Commission 7% enregistrée.");
        await fetchSessions();
      } else {
        toast.error(result.error ?? "Erreur closing");
      }
      return result;
    } finally {
      setActionLoading(null);
    }
  }, [fetchSessions]);

  const abandonSession = useCallback(async (sessionId: string, reason?: string) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    await callOrchestrator({ action: "abandon", session_id: sessionId, reason }, token);
    toast.info("Session abandonnée");
    await fetchSessions();
  }, [fetchSessions]);

  const synthesizeVoice = useCallback(async (sessionId: string, text: string, includeRgpd = false) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    const token = authSession?.access_token ?? "";
    const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ada-voice-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: ANON_KEY },
      body: JSON.stringify({ action: "synthesize", session_id: sessionId, text, include_rgpd_preamble: includeRgpd }),
    });

    if (res.headers.get("content-type")?.includes("audio")) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      await audioRef.current.play();
      return true;
    }
    return false;
  }, []);

  return {
    sessions,
    activeSession,
    transcriptions,
    nodeEvents,
    loading,
    actionLoading,
    fetchSessions,
    fetchSessionDetail,
    startSession,
    giveConsent,
    negotiate,
    validateCall,
    confirmClosing,
    abandonSession,
    synthesizeVoice,
    setActiveSession,
  };
}
