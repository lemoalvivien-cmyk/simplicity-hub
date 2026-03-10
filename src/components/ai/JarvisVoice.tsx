/**
 * JarvisVoice — Microphone STT + TTS pour Jarvis
 * STT : Web Speech API (SpeechRecognition)
 * TTS : ElevenLabs (si clé configurée) ou window.speechSynthesis fallback
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JarvisVoiceProps {
  /** Called when speech has been transcribed — send to AI */
  onTranscript: (text: string) => void;
  /** Pass the last Jarvis text to have it spoken */
  lastJarvisText?: string;
  /** Whether to auto-read incoming Jarvis responses */
  autoSpeak?: boolean;
}

type VoiceTTSMode = "elevenlabs" | "browser" | "loading";

// ── Web Speech API — access via window cast to avoid strict TS errors ─────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;

// ── ElevenLabs TTS via REST (not Conversational AI) ───────────────────────────
const ELEVENLABS_VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Brian — clear FR-compatible

async function speakWithElevenLabs(text: string): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ text, voiceId: ELEVENLABS_VOICE_ID }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function speakWithBrowser(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "fr-FR";
  utter.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const frVoice =
    voices.find((v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("female")) ||
    voices.find((v) => v.lang.startsWith("fr"));
  if (frVoice) utter.voice = frVoice;
  window.speechSynthesis.speak(utter);
}

export default function JarvisVoice({ onTranscript, lastJarvisText, autoSpeak }: JarvisVoiceProps) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsMode, setTtsMode] = useState<VoiceTTSMode>("loading");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpokenRef = useRef<string>("");

  // ── Detect TTS capability ────────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { setSupported(false); return; }

    // Check if ElevenLabs TTS edge function exists by probing voice-token
    supabase.functions
      .invoke("elevenlabs-voice-token", { body: { check: true } })
      .then(({ data }) => {
        if (data?.fallback === "browser" || data?.error === "elevenlabs_not_configured") {
          setTtsMode("browser");
        } else {
          // Try to detect elevenlabs-tts function availability
          setTtsMode("browser"); // default safe; will try EL on each speak attempt
        }
      })
      .catch(() => setTtsMode("browser"));
  }, []);

  // ── Auto-speak new Jarvis messages ───────────────────────────────────────────
  useEffect(() => {
    if (!autoSpeak || !lastJarvisText || lastJarvisText === lastSpokenRef.current) return;
    lastSpokenRef.current = lastJarvisText;
    setSpeaking(true);
    const doSpeak = async () => {
      const ok = await speakWithElevenLabs(lastJarvisText);
      if (!ok) speakWithBrowser(lastJarvisText);
      setSpeaking(false);
    };
    doSpeak();
  }, [lastJarvisText, autoSpeak]);

  // ── Start / stop STT ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (transcript.trim()) onTranscript(transcript.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        title={listening ? "Arrêter l'écoute" : "Parler à Jarvis"}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: listening
            ? "hsl(0 65% 50% / 0.15)"
            : "hsl(var(--muted))",
          border: `1.5px solid ${listening ? "hsl(0 65% 50% / 0.5)" : "hsl(var(--border))"}`,
          color: listening ? "hsl(0 65% 55%)" : "hsl(var(--muted-foreground))",
        }}
      >
        {listening ? (
          <MicOff size={15} className="animate-pulse" />
        ) : (
          <Mic size={15} />
        )}
      </button>

      {/* Speaking indicator */}
      {speaking && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: "hsl(var(--secondary))",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <Volume2 size={12} className="animate-pulse" />
          <span>Jarvis parle…</span>
        </div>
      )}

      {/* Listening indicator */}
      {listening && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: "hsl(0 65% 50% / 0.1)",
            color: "hsl(0 65% 55%)",
            border: "1px solid hsl(0 65% 50% / 0.3)",
          }}
        >
          <Loader2 size={12} className="animate-spin" />
          <span>Écoute…</span>
        </div>
      )}

      {ttsMode === "loading" && !listening && !speaking && (
        <span className="text-xs text-muted-foreground">
          <Loader2 size={10} className="inline animate-spin mr-1" />
          Voix…
        </span>
      )}
    </div>
  );
}

// Exported helper for Autonomie page tests
export { speakWithBrowser, speakWithElevenLabs };
