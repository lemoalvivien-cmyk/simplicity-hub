import { useState, useRef, useEffect } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Send, Sparkles, User, Loader2, RefreshCw, ChevronRight, Zap } from "lucide-react";
import { askAI, JARVIS_QUICK_QUESTIONS, AiResponse, ChatHistoryMessage } from "@/lib/aiService";
import { useNavigate } from "react-router-dom";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  action?: AiResponse["action"];
  suggested_actions?: Array<{ label: string; href: string }>;
  source?: AiResponse["source"];
  timestamp: Date;
};

const MAX_HISTORY = 20;

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis KITT IA, votre assistant business. Je suis là pour vous guider, vous aider à comprendre la plateforme, et vous suggérer les meilleures actions. Par où voulez-vous commencer ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      // Keep max 20 messages (excluding initial greeting)
      return next.length > MAX_HISTORY + 1 ? [next[0], ...next.slice(-(MAX_HISTORY))] : next;
    });
    setInput("");
    setLoading(true);

    // Build conversation history for AI (last 10 messages)
    const history: ChatHistoryMessage[] = messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const res = await askAI({
      role: "jarvis",
      context: "dashboard",
      input: text,
      history,
    });

    const reply: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: res.text,
      action: res.action,
      suggested_actions: res.suggested_actions,
      source: res.source,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, reply]);
    setLoading(false);
  };

  const reset = () => {
    setMessages([{
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis KITT IA, votre assistant business. Je suis là pour vous guider, vous aider à comprendre la plateforme, et vous suggérer les meilleures actions. Par où voulez-vous commencer ?",
      timestamp: new Date(),
    }]);
    setInput("");
  };

  const aiMessagesCount = messages.filter(m => m.role === "assistant" && m.source === "model_strong").length;

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles size={20} style={{ color: "hsl(var(--primary-foreground))" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">KITT IA</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  <Zap size={9} /> IA
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Assistant business — {messages.length - 1} message{messages.length > 2 ? "s" : ""} · {aiMessagesCount} réponse{aiMessagesCount > 1 ? "s" : ""} IA
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Nouvelle conversation</span>
          </button>
        </div>

        {/* Chat container */}
        <div className="card-surface flex flex-col" style={{ height: "calc(100vh - 300px)", minHeight: "420px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "" : "bg-muted"}`}
                  style={msg.role === "assistant" ? { background: "var(--gradient-primary)" } : {}}
                >
                  {msg.role === "assistant"
                    ? <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
                    : <User size={14} className="text-muted-foreground" />
                  }
                </div>
                <div className="max-w-[78%] space-y-1.5">
                  {/* AI source badge */}
                  {msg.role === "assistant" && msg.source === "model_strong" && (
                    <div className="flex items-center gap-1">
                      <Zap size={10} className="text-violet-500" />
                      <span className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">Réponse IA</span>
                    </div>
                  )}

                  <div
                    className="px-4 py-3 text-sm leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      color: msg.role === "user" ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                    }}
                  >
                    {msg.content.split("\n").map((line, i) => {
                      const parts = line.split("**");
                      return (
                        <p key={i} className={i > 0 && line ? "mt-1" : ""}>
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
                      onClick={() => msg.action?.href && navigate(msg.action.href)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--border))" }}
                    >
                      {msg.action.label} <ChevronRight size={12} />
                    </button>
                  )}

                  {/* Suggested actions from AI */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {msg.suggested_actions.map((sa) => (
                        <button
                          key={sa.href}
                          onClick={() => navigate(sa.href)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--border))" }}
                        >
                          {sa.label} <ChevronRight size={11} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground pl-1">
                    {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                  <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: "hsl(var(--muted))", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Je réfléchis…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions — always visible when history is short */}
          {messages.length <= 2 && !loading && (
            <div className="px-5 pb-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Questions fréquentes :</p>
              <div className="flex flex-wrap gap-2">
                {JARVIS_QUICK_QUESTIONS.map((q) => (
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

          {/* Input */}
          <div className="border-t border-border p-4">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Send size={15} style={{ color: "hsl(var(--primary-foreground))" }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
