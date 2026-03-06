import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";
import { askAI, COPILOT_SUGGESTIONS, CopilotContext } from "@/lib/aiService";

interface CopilotPanelProps {
  context: CopilotContext;
  textToImprove?: string;
  userRole?: "entreprise" | "facilitateur";
  /** Compact = just inline buttons, no panel expansion */
  compact?: boolean;
}

export default function CopilotPanel({
  context,
  textToImprove,
  userRole = "facilitateur",
  compact = false,
}: CopilotPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; prompt: string } | null>(null);

  const suggestions = COPILOT_SUGGESTIONS[context] || [];

  const runSuggestion = async (prompt: string, label: string) => {
    setLoading(true);
    setOpen(true);
    setResult(null);

    const fullPrompt = textToImprove ? `${prompt}\n\nTexte actuel :\n"${textToImprove}"` : prompt;

    const res = await askAI({
      role: "copilot",
      context,
      input: fullPrompt,
      userRole,
    });

    setResult({ text: res.text, prompt: label });
    setLoading(false);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map((s) => (
          <button
            key={s.label}
            onClick={() => runSuggestion(s.prompt, s.label)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
            style={{
              borderColor: "hsl(var(--primary) / 0.3)",
              color: "hsl(var(--primary))",
              background: "hsl(var(--secondary))",
            }}
          >
            <Sparkles size={11} />
            {s.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: open ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))",
        background: open ? "hsl(var(--secondary) / 0.5)" : "transparent",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles size={12} style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          <span className="text-sm font-semibold text-foreground">Copilot — Améliorer avec l'IA</span>
        </div>
        {open ? (
          <ChevronUp size={15} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={15} className="text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => runSuggestion(s.prompt, s.label)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 hover:scale-105"
                style={{
                  borderColor: "hsl(var(--primary) / 0.3)",
                  color: "hsl(var(--primary))",
                  background: "hsl(var(--card))",
                }}
              >
                <Sparkles size={11} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Résultat */}
          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>L'IA analyse et prépare une suggestion…</span>
            </div>
          )}

          {result && !loading && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {result.prompt}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="text-sm text-foreground leading-relaxed">
                {result.text.split("\n").map((line, i) => {
                  const parts = line.split("**");
                  return (
                    <p key={i} className={i > 0 && line ? "mt-2" : ""}>
                      {parts.map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
