import { useState, useRef, useEffect } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Send, Sparkles, User, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import { askAI, JARVIS_QUICK_QUESTIONS, AiResponse } from "@/lib/aiService";
import { useNavigate } from "react-router-dom";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  action?: AiResponse["action"];
  timestamp: Date;
};

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis JARVIS, votre assistant business. Je suis là pour vous guider, vous aider à comprendre la plateforme, et vous suggérer les meilleures actions. Par où voulez-vous commencer ?",
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

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const res = await askAI({
      role: "jarvis",
      context: "dashboard",
      input: text,
    });

    const reply: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: res.text,
      action: res.action,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, reply]);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([{
      id: 0,
      role: "assistant",
      content: "Bonjour ! Je suis JARVIS, votre assistant business. Je suis là pour vous guider, vous aider à comprendre la plateforme, et vous suggérer les meilleures actions. Par où voulez-vous commencer ?",
      timestamp: new Date(),
    }]);
    setInput("");
  };

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
              <h1 className="font-display text-2xl font-bold text-foreground">JARVIS</h1>
              <p className="text-sm text-muted-foreground">Votre assistant business — répond en quelques secondes.</p>
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
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" ? "" : "bg-muted"
                  }`}
                  style={msg.role === "assistant" ? { background: "var(--gradient-primary)" } : {}}
                >
                  {msg.role === "assistant"
                    ? <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
                    : <User size={14} className="text-muted-foreground" />
                  }
                </div>
                <div className="max-w-[78%] space-y-2">
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
                  {msg.action && (
                    <button
                      onClick={() => msg.action?.href && navigate(msg.action.href)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      style={{
                        background: "hsl(var(--secondary))",
                        color: "hsl(var(--primary))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      {msg.action.label} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 flex-row">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles size={14} style={{ color: "hsl(var(--primary-foreground))" }} />
                </div>
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ background: "hsl(var(--muted))", borderRadius: "1rem 1rem 1rem 0.25rem" }}
                >
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Je réfléchis…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3 space-y-2">
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-shadow"
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
