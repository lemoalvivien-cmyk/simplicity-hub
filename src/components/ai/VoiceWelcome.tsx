import { useState, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { Volume2, VolumeX, Mic, X } from "lucide-react";
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

export default function VoiceWelcome({ context, userName }: VoiceWelcomeProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => setIsStarting(false),
    onDisconnect: () => {},
    onError: () => setIsStarting(false),
  });

  // Show banner after 1.5s if not dismissed
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`voice_dismissed_${context}`);
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [context]);

  // Check if ElevenLabs agent is configured
  useEffect(() => {
    const stored = localStorage.getItem("elevenlabs_agent_id");
    if (stored) {
      setAgentId(stored);
      setHasToken(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(`voice_dismissed_${context}`, "1");
    if (conversation.status === "connected") {
      conversation.endSession();
    }
  };

  const handleStartVoice = async () => {
    if (!agentId) return;
    setIsStarting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Get a signed token via edge function
      const { data } = await supabase.functions.invoke("elevenlabs-voice-token", {
        body: { agentId },
      });
      if (data?.token) {
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
      } else if (agentId) {
        // fallback: public agent
        await conversation.startSession({
          agentId,
          connectionType: "webrtc",
        });
      }
    } catch {
      setIsStarting(false);
    }
  };

  const handleStop = () => {
    conversation.endSession();
  };

  if (!visible || dismissed) return null;

  const isConnected = conversation.status === "connected";

  return (
    <div
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40 animate-fade-in"
      style={{ animation: "fadeInUp 0.4s ease-out" }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl border"
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
                background: isConnected
                  ? "hsl(152 62% 45% / 0.2)"
                  : "hsl(218 72% 18% / 0.5)",
                border: `1px solid ${isConnected ? "hsl(152 62% 45% / 0.4)" : "hsl(218 40% 30% / 0.4)"}`,
              }}
            >
              {isConnected ? (
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              ) : (
                <Volume2 size={14} style={{ color: "hsl(210 85% 65%)" }} />
              )}
            </div>
            <div>
              <p className="text-white/90 text-sm font-semibold">
                {isConnected ? "En écoute…" : "Accueil vocal"}
              </p>
              <p className="text-white/40 text-xs">
                {isConnected ? conversation.isSpeaking ? "Je parle…" : "À vous" : "JARVIS vous guide"}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/30 hover:text-white/70 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Message */}
        {!isConnected && (
          <p className="text-white/55 text-xs leading-relaxed mb-4">
            {VOICE_SCRIPTS[context].substring(0, 80)}…
          </p>
        )}

        {/* Actions */}
        {!hasToken ? (
          <p className="text-white/35 text-xs">Configurez un agent ElevenLabs dans les paramètres pour activer la voix.</p>
        ) : isConnected ? (
          <button
            onClick={handleStop}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "hsl(0 65% 50% / 0.2)", border: "1px solid hsl(0 65% 50% / 0.3)", color: "hsl(0 65% 70%)" }}
          >
            <VolumeX size={14} />
            Arrêter
          </button>
        ) : (
          <button
            onClick={handleStartVoice}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--gradient-primary)",
              color: "white",
            }}
          >
            <Mic size={14} />
            {isStarting ? "Connexion…" : "Écouter l'accueil vocal"}
          </button>
        )}
      </div>
    </div>
  );
}
