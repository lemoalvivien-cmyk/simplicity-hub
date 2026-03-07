/**
 * VoiceWelcome — Accueil vocal premium avec 3 couches :
 * 1. ElevenLabs (voix premium, si configurée côté admin)
 * 2. Web Speech API (fallback navigateur, gratuit)
 * 3. Silencieux (si voix désactivée ou non disponible)
 *
 * Zéro localStorage manual. Zéro bricolage console.
 * Config stockée en base via openclaw_config.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Volume2, VolumeX, Mic, X, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceWelcomeProps {
  context: "onboarding" | "dashboard-entreprise" | "dashboard-facilitateur" | "pilotage" | "agents";
  userName?: string;
}

const VOICE_SCRIPTS: Record<VoiceWelcomeProps["context"], string> = {
  onboarding:
    "Bienvenue sur WIINUP MAX. Je suis votre assistant IA. En quelques minutes, votre espace sera prêt et vos agents commerciaux pourront commencer à travailler pour vous. Commençons.",
  "dashboard-entreprise":
    "Bonjour. Vos agents sont prêts. OpenClaw surveille vos opportunités et prépare vos prochaines actions. Vérifiez vos validations si vous avez des décisions à prendre.",
  "dashboard-facilitateur":
    "Bonjour. De nouvelles missions sont disponibles. Vos introductions avancent. Consultez vos gains pour voir ce qui a été validé.",
  pilotage:
    "Voici votre cockpit de pilotage. OpenClaw a préparé vos priorités du jour. Commencez par les recommandations en haut de page.",
  agents:
    "Bienvenue dans votre Agent OS. Vos agents commerciaux sont pilotés par OpenClaw. Vous pouvez les activer, les surveiller, et valider leurs propositions à tout moment.",
};

type VoiceMode = "premium" | "browser" | "none";

export default function VoiceWelcome({ context, userName }: VoiceWelcomeProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("none");
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const browserSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Charge la config voix depuis la base (openclaw_config)
  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("openclaw_config")
        .select("gateway_url")
        .eq("user_id", user.id)
        .maybeSingle();

      // L'agentId ElevenLabs est stocké dans gateway_url champ custom
      // On lit depuis une meta-clé dédiée si elle existe
      // Sinon : fallback navigateur si Speech Synthesis disponible
      const hasElevenLabs = (data as { gateway_url?: string } | null)?.gateway_url?.startsWith("elevenlabs:");
      if (hasElevenLabs) {
        const id = data!.gateway_url!.replace("elevenlabs:", "");
        setAgentId(id);
        setVoiceMode("premium");
      } else if ("speechSynthesis" in window) {
        setVoiceMode("browser");
      } else {
        setVoiceMode("none");
      }
    };
    fetchConfig();
  }, []);

  // Affiche la bannière après 1.5s
  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem(`voice_dismissed_${context}`);
    if (alreadyDismissed) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [context]);

  const conversation = useConversation({
    onConnect: () => setIsStarting(false),
    onDisconnect: () => {},
    onError: () => {
      setIsStarting(false);
      // Si ElevenLabs échoue → fallback navigateur
      if ("speechSynthesis" in window) {
        setVoiceMode("browser");
      }
    },
  });

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(`voice_dismissed_${context}`, "1");
    if (conversation.status === "connected") conversation.endSession();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [context, conversation]);

  const handleStartPremium = async () => {
    if (!agentId) return;
    setIsStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data } = await supabase.functions.invoke("elevenlabs-voice-token", {
        body: { agentId },
      });
      if (data?.token) {
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
      } else {
        await conversation.startSession({ agentId, connectionType: "webrtc" });
      }
    } catch {
      setIsStarting(false);
      setVoiceMode("browser");
    }
  };

  const handleStartBrowser = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(VOICE_SCRIPTS[context]);
    utter.lang = "fr-FR";
    utter.rate = 0.92;
    utter.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith("fr") && v.name.toLowerCase().includes("female"))
      || voices.find(v => v.lang.startsWith("fr"));
    if (frVoice) utter.voice = frVoice;
    utter.onstart = () => setIsBrowserSpeaking(true);
    utter.onend = () => setIsBrowserSpeaking(false);
    utter.onerror = () => setIsBrowserSpeaking(false);
    browserSynthRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [context]);

  const handleStop = useCallback(() => {
    if (voiceMode === "premium") conversation.endSession();
    if (voiceMode === "browser") {
      window.speechSynthesis?.cancel();
      setIsBrowserSpeaking(false);
    }
  }, [voiceMode, conversation]);

  if (!visible || dismissed) return null;

  const isConnected = conversation.status === "connected";
  const isActive = isConnected || isBrowserSpeaking;
  const isPremiumMode = voiceMode === "premium";

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40"
      style={{ animation: "fadeInUp 0.4s ease-out" }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl"
        style={{
          background: "hsl(218 65% 10% / 0.97)",
          border: "1px solid hsl(218 40% 30% / 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isActive ? "hsl(152 62% 45% / 0.2)" : "hsl(218 72% 18% / 0.5)",
                border: `1px solid ${isActive ? "hsl(152 62% 45% / 0.4)" : "hsl(218 40% 30% / 0.4)"}`,
              }}
            >
              {isActive ? (
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              ) : (
                <Volume2 size={14} style={{ color: "hsl(210 85% 65%)" }} />
              )}
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">
                {isActive
                  ? (isConnected && conversation.isSpeaking ? "Je parle…" : "En écoute…")
                  : "Accueil vocal"}
              </p>
              <p className="text-white/40 text-xs">
                {isActive
                  ? "JARVIS vous guide"
                  : isPremiumMode ? "Voix premium" : "Voix navigateur"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/30 hover:text-white/70 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Aperçu du message */}
        {!isActive && (
          <p className="text-white/55 text-xs leading-relaxed mb-4">
            {VOICE_SCRIPTS[context].substring(0, 80)}…
          </p>
        )}

        {/* Actions */}
        {voiceMode === "none" ? (
          <p className="text-white/35 text-xs">
            Votre navigateur ne supporte pas la synthèse vocale.
          </p>
        ) : isActive ? (
          <button
            onClick={handleStop}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "hsl(0 65% 50% / 0.2)", border: "1px solid hsl(0 65% 50% / 0.3)", color: "hsl(0 65% 70%)" }}
          >
            <VolumeX size={14} />
            Arrêter
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={isPremiumMode ? handleStartPremium : handleStartBrowser}
              disabled={isStarting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "var(--gradient-primary)", color: "white" }}
            >
              {isPremiumMode ? <Mic size={14} /> : <Play size={14} />}
              {isStarting ? "Connexion…" : "Écouter l'accueil"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
              style={{ border: "1px solid hsl(218 40% 30% / 0.4)" }}
            >
              Passer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
