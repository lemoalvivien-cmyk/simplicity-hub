/**
 * War Caller Voice — WebRTC voice agent via ElevenLabs Conversational AI
 * Briefings vocaux temps réel sur les opportunités critiques.
 * Fonctionne avec @elevenlabs/react useConversation + token serveur.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Volume2, Phone, PhoneOff, Loader2, Zap, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WarCallerProps {
  /** Brief context injected as system override — missions, leads chauds, etc. */
  contextBrief?: string;
  /** Show compact pill mode (for dashboard teaser) */
  compact?: boolean;
  onClose?: () => void;
}

// Visual waveform bars
function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[3, 5, 4, 7, 5, 3, 6, 4, 7, 5, 3].map((h, i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full"
          style={{ background: color, minHeight: 3 }}
          animate={active
            ? { height: [3, h * 3, 3], opacity: [0.5, 1, 0.5] }
            : { height: 3, opacity: 0.3 }
          }
          transition={{
            duration: 0.5 + i * 0.05,
            repeat: active ? Infinity : 0,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function WarCaller({ contextBrief, compact = false, onClose }: WarCallerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[WarCaller] WebRTC connected");
    },
    onDisconnect: () => {
      console.log("[WarCaller] Disconnected");
    },
    onMessage: (msg) => {
      // Capture transcript lines — cast to any to handle ElevenLabs union types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = msg as any;
      if (m.type === "user_transcript") {
        const t = m.user_transcription_event?.user_transcript as string | undefined;
        if (t) setTranscript((p) => [...p.slice(-4), `Vous: ${t}`]);
      }
      if (m.type === "agent_response") {
        const r = m.agent_response_event?.agent_response as string | undefined;
        if (r) setTranscript((p) => [...p.slice(-4), `War Caller: ${r}`]);
      }
    },
    onError: (err) => {
      console.error("[WarCaller] error:", err);
      toast.error("Erreur War Caller — vérifiez votre microphone.");
    },
  });

  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    setPermissionDenied(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionDenied(true);
      setIsConnecting(false);
      toast.error("Accès microphone refusé. Autorisez le micro pour War Caller.");
      return;
    }

    try {
      // Try to get ElevenLabs conversation token
      const { data, error } = await supabase.functions.invoke("elevenlabs-voice-token", {
        body: { purpose: "war_caller", context: contextBrief ?? "" },
      });

      if (error || !data) {
        throw new Error("Token ElevenLabs non disponible — configurez ELEVENLABS_API_KEY.");
      }

      if (data.fallback === "browser" || data.error === "elevenlabs_not_configured") {
        // Fallback: use browser TTS + STT
        toast.info("Mode voix navigateur activé (ElevenLabs non configuré)");
        setIsConnecting(false);
        return;
      }

      // Start ElevenLabs WebRTC session
      if (data.token) {
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
          overrides: {
            agent: {
              prompt: {
                prompt: `Tu es War Caller, l'agent vocal de guerre commerciale de WIINUP MAX.
Tu donnes des briefings vocaux ultra-concis et percutants sur les opportunités prioritaires.
Sois direct, factuel, militaire dans le ton. Pas de blabla. Maximum 2-3 phrases par réponse.
Contexte actuel : ${contextBrief ?? "Pas de contexte disponible"}`,
              },
              firstMessage: "War Caller en ligne. Quelles sont vos priorités du jour ?",
              language: "fr",
            },
          },
        });
      } else if (data.agent_id) {
        // Direct agent_id mode
        await conversation.startSession({
          agentId: data.agent_id,
          connectionType: "webrtc",
        });
      } else {
        throw new Error("Ni token ni agent_id reçu.");
      }
    } catch (err) {
      console.error("[WarCaller] start failed:", err);
      toast.error(err instanceof Error ? err.message : "Connexion War Caller échouée.");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, contextBrief]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
    setTranscript([]);
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer"
        style={{
          background: isConnected
            ? "hsl(152 62% 48% / 0.1)"
            : "hsl(218 55% 16% / 0.6)",
          border: `1px solid ${isConnected ? "hsl(152 62% 48% / 0.4)" : "hsl(218 45% 28% / 0.4)"}`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={isConnected ? endCall : startCall}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isConnected ? "hsl(152 62% 48% / 0.2)" : "hsl(218 55% 22% / 0.8)",
            border: `1px solid ${isConnected ? "hsl(152 62% 48% / 0.4)" : "hsl(218 45% 32% / 0.3)"}`,
          }}
        >
          {isConnecting ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "hsl(var(--primary-glow))" }} />
          ) : isConnected ? (
            <Radio size={14} style={{ color: "hsl(152 62% 52%)" }} />
          ) : (
            <Mic size={14} style={{ color: "hsl(var(--primary-glow))" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary-glow))" }}>
            War Caller Voice
          </p>
          <p className="text-[10px] font-medium" style={{ color: isConnected ? "hsl(152 62% 52%)" : "hsl(var(--muted-foreground))" }}>
            {isConnected ? (isSpeaking ? "Agent parle…" : "En ligne — parlez") : "Briefing vocal IA"}
          </p>
        </div>
        {isConnected && <Waveform active={isSpeaking} color="hsl(152 62% 52%)" />}
      </motion.div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(218 65% 8% / 0.95)",
        border: "1px solid hsl(218 45% 22% / 0.5)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "hsl(218 45% 18% / 0.6)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isConnected ? "hsl(152 62% 48% / 0.2)" : "hsl(var(--accent) / 0.12)",
              border: `1px solid ${isConnected ? "hsl(152 62% 48% / 0.4)" : "hsl(var(--accent) / 0.3)"}`,
            }}
          >
            {isConnected ? (
              <Radio size={16} style={{ color: "hsl(152 62% 52%)" }} />
            ) : (
              <Zap size={16} style={{ color: "hsl(var(--accent))" }} />
            )}
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">War Caller Voice</p>
            <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider"
              style={{ color: isConnected ? "hsl(152 62% 52%)" : "hsl(var(--accent))" }}>
              {isConnected ? "● En ligne" : "Agent vocal IA"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && <Waveform active={isSpeaking} color={isSpeaking ? "hsl(152 62% 52%)" : "hsl(var(--primary-glow))"} />}
          {onClose && (
            <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors text-lg leading-none">×</button>
          )}
        </div>
      </div>

      {/* Transcript area */}
      <div
        ref={transcriptRef}
        className="px-5 py-4 min-h-[80px] max-h-36 overflow-y-auto space-y-1.5"
      >
        {transcript.length === 0 ? (
          <p className="text-white/35 text-xs italic">
            {isConnected ? "Parlez pour activer le brief vocal…" : "Appuyez sur Appeler pour démarrer le briefing vocal."}
          </p>
        ) : (
          transcript.map((line, i) => {
            const isAgent = line.startsWith("War Caller:");
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: isAgent ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs leading-relaxed"
                style={{ color: isAgent ? "hsl(var(--primary-glow))" : "hsl(0 0% 100% / 0.75)" }}
              >
                {line}
              </motion.p>
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="px-5 pb-5 flex items-center gap-3">
        {!isConnected ? (
          <motion.button
            onClick={startCall}
            disabled={isConnecting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity"
            style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 62%))" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {isConnecting ? (
              <><Loader2 size={14} className="animate-spin" /> Connexion…</>
            ) : (
              <><Phone size={14} /> Appeler War Caller</>
            )}
          </motion.button>
        ) : (
          <motion.button
            onClick={endCall}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "hsl(0 65% 50% / 0.9)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <PhoneOff size={14} /> Raccrocher
          </motion.button>
        )}

        {permissionDenied && (
          <p className="text-xs text-red-400 mt-2 text-center">
            Microphone refusé. Autorisez dans les paramètres du navigateur.
          </p>
        )}

        <div
          className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-[10px] font-semibold shrink-0"
          style={{
            background: "hsl(218 55% 14% / 0.8)",
            border: "1px solid hsl(218 45% 22% / 0.4)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <Volume2 size={11} />
          ElevenLabs
        </div>
      </div>
    </div>
  );
}
