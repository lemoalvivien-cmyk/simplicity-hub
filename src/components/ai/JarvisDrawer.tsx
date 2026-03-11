import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, Send, ChevronRight, Loader2, RotateCcw, Zap, Mic, Volume2, VolumeX } from "lucide-react";
import { askAI, AiResponse, JARVIS_QUICK_QUESTIONS, CopilotContext, ChatHistoryMessage } from "@/lib/aiService";
import { useNavigate } from "react-router-dom";
import JarvisVoice from "./JarvisVoice";

interface Message {
  id: number;
  role: "user" | "jarvis";
  text: string;
  action?: AiResponse["action"];
  suggested_actions?: Array<{ label: string; href: string }>;
  source?: AiResponse["source"];
}

interface JarvisDrawerProps {
  open: boolean;
  onClose: () => void;
  context?: CopilotContext;
  userRole?: "entreprise" | "facilitateur";
}

export default function JarvisDrawer({ open, onClose, context = "dashboard", userRole = "facilitateur" }: JarvisDrawerProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "jarvis",
      text: "Bonjour ! Je suis KITT IA, votre assistant business. Comment puis-je vous aider ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // last jarvis text for TTS
  const lastJarvisText = messages.filter((m) => m.role === "jarvis").at(-1)?.text;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build history from last 5 jarvis<->user exchanges
    const history: ChatHistoryMessage[] = messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const res = await askAI({ role: "jarvis", context, input: text, userRole, history });

    const jarvisMsg: Message = {
      id: Date.now() + 1,
      role: "jarvis",
      text: res.text,
      action: res.action,
      suggested_actions: res.suggested_actions,
      source: res.source,
    };
    setMessages((prev) => [...prev, jarvisMsg]);
    setLoading(false);
  };

  const reset = () => {
    setMessages([{
      id: 0,
      role: "jarvis",
      text: "Bonjour ! Je suis KITT IA, votre assistant business. Comment puis-je vous aider ?",
    }]);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className="fixed bottom-0 right-0 z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          height: "min(600px, 85vh)",
          background: "hsl(var(--card))",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid hsl(var(--border))",
          borderBottom: "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0"
          style={{ borderRadius: "1.25rem 1.25rem 0 0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles size={16} style={{ color: "hsl(var(--primary-foreground))" }} />
            </div>
            <div>
            <p className="font-semibold text-foreground text-sm leading-none">KITT IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">Assistant business IA</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Nouvelle conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "jarvis" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles size={12} style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
              )}
              <div className="max-w-[82%] space-y-1.5">
                {/* AI badge */}
                {msg.role === "jarvis" && msg.source === "model_strong" && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <Zap size={10} className="text-violet-500" />
                    <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">IA</span>
                  </div>
                )}
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    color: msg.role === "user" ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                    borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                  }}
                >
                  {msg.text.split("\n").map((line, i) => {
                    const parts = line.split("**");
                    return (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {parts.map((part, j) =>
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                        )}
                      </p>
                    );
                  })}
                </div>

                {/* Legacy single action */}
                {msg.action && !msg.suggested_actions?.length && (
                  <button
                    onClick={() => { if (msg.action?.href) navigate(msg.action.href); onClose(); }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--border))" }}
                  >
                    {msg.action.label} <ChevronRight size={12} />
                  </button>
                )}

                {/* Suggested actions from AI */}
                {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {msg.suggested_actions.map((sa) => (
                      <button
                        key={sa.href}
                        onClick={() => { navigate(sa.href); onClose(); }}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors"
                        style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--border))" }}
                      >
                        {sa.label} <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Sparkles size={12} style={{ color: "hsl(var(--primary-foreground))" }} />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: "hsl(var(--muted))", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                <Loader2 size={13} className="animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Je réfléchis…</span>
              </div>
            </div>
          )}

          {/* Quick questions */}
          {messages.length === 1 && !loading && (
            <div className="pt-1">
              <p className="text-xs text-muted-foreground mb-2 pl-1">Questions fréquentes :</p>
              <div className="flex flex-wrap gap-2">
                {JARVIS_QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 shrink-0">
          {/* Voice mode toggle + JarvisVoice */}
          <div className="flex items-center justify-between mb-2.5">
            <JarvisVoice
              onTranscript={(text) => send(text)}
              lastJarvisText={voiceMode ? lastJarvisText : undefined}
              autoSpeak={voiceMode}
            />
            <button
              onClick={() => setVoiceMode((v) => !v)}
              title={voiceMode ? "Passer en mode texte" : "Activer le mode vocal"}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all"
              style={{
                background: voiceMode ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                color: voiceMode ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${voiceMode ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
              }}
            >
              {voiceMode ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {voiceMode ? "Vocal actif" : "Vocal"}
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={voiceMode ? "Ou tapez votre question…" : "Posez votre question…"}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Send size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
