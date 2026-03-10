/**
 * AIScoreBadge — Displays the Gemini AI lead score as a colored badge.
 * Labels: Froid (1-3) / Tiède (4-5) / Chaud (6-7) / Brûlant (8-10)
 */

interface AIScoreBadgeProps {
  score: number | null | undefined;
  label: string | null | undefined;
  reasoning?: string | null;
  /** "sm" = compact chip, "md" = with score number (default) */
  size?: "sm" | "md";
  /** Show tooltip with reasoning on hover */
  showReasoning?: boolean;
}

const LABEL_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  Froid:    { color: "hsl(220 60% 45%)", bg: "hsl(220 60% 95%)",  emoji: "🧊" },
  Tiède:    { color: "hsl(38 85% 38%)",  bg: "hsl(38 85% 94%)",   emoji: "🌤" },
  Chaud:    { color: "hsl(25 90% 40%)",  bg: "hsl(25 90% 93%)",   emoji: "🔥" },
  Brûlant:  { color: "hsl(0 80% 42%)",   bg: "hsl(0 80% 94%)",    emoji: "⚡" },
};

function getConfigForScore(score: number): typeof LABEL_CONFIG[string] {
  if (score <= 3) return LABEL_CONFIG.Froid;
  if (score <= 5) return LABEL_CONFIG.Tiède;
  if (score <= 7) return LABEL_CONFIG.Chaud;
  return LABEL_CONFIG.Brûlant;
}

export default function AIScoreBadge({
  score,
  label,
  reasoning,
  size = "md",
  showReasoning = false,
}: AIScoreBadgeProps) {
  if (score == null) return null;

  const normalizedLabel = label && LABEL_CONFIG[label] ? label : null;
  const cfg = normalizedLabel
    ? LABEL_CONFIG[normalizedLabel]
    : getConfigForScore(score);

  const displayLabel = normalizedLabel ?? (
    score <= 3 ? "Froid" : score <= 5 ? "Tiède" : score <= 7 ? "Chaud" : "Brûlant"
  );

  const emoji = cfg.emoji;

  if (size === "sm") {
    return (
      <span
        title={showReasoning && reasoning ? reasoning : undefined}
        className="inline-flex items-center gap-1 px-1.5 py-0 rounded text-xs font-bold leading-5 shrink-0"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {emoji} {displayLabel}
      </span>
    );
  }

  return (
    <span
      title={showReasoning && reasoning ? reasoning : undefined}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span>{displayLabel}</span>
      <span
        className="font-extrabold text-xs px-1 rounded"
        style={{ background: `${cfg.color}22`, color: cfg.color }}
      >
        {score}/10
      </span>
    </span>
  );
}
