import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

interface LaunchQuotaBannerProps {
  variant?: "hero" | "inline" | "pricing";
}

// Standard function component — NO forwardRef
function LaunchQuotaBanner({ variant = "inline" }: LaunchQuotaBannerProps) {
  const [slots, setSlots] = useState<number | null>(null);
  const [total, setTotal] = useState(100);

  useEffect(() => {
    supabase.from("launch_quota").select("total_slots, used_slots").single().then(({ data }) => {
      if (data) {
        setSlots(Math.max(0, data.total_slots - data.used_slots));
        setTotal(data.total_slots);
      }
    });
  }, []);

  if (slots === null) return null;
  if (slots === 0) return null;

  const pct = Math.round(((total - slots) / total) * 100);

  if (variant === "hero") {
    return (
      <div className="inline-flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold backdrop-blur-sm">
          <Zap size={11} className="shrink-0" />
          Offre lancement · {slots} place{slots > 1 ? "s" : ""} restante{slots > 1 ? "s" : ""} sur {total} à 99 € / an
        </div>
        <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(218 40% 25% / 0.5)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, hsl(24 100% 52%), hsl(38 90% 55%))"
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "pricing") {
    return (
      <div className="rounded-2xl p-4 mb-5 border" style={{
        background: "hsl(24 100% 52% / 0.06)",
        borderColor: "hsl(24 100% 52% / 0.25)"
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={13} style={{ color: "hsl(24 80% 45%)" }} />
            <p className="text-sm font-semibold" style={{ color: "hsl(24 80% 35%)" }}>
              Offre lancement — {slots} place{slots > 1 ? "s" : ""} restante{slots > 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs font-bold" style={{ color: "hsl(24 80% 45%)" }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, hsl(24 100% 52%), hsl(38 90% 55%))"
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          WiinupMax est au tarif unique de 99 € TTC / an.
        </p>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
      background: "hsl(24 100% 52% / 0.1)",
      border: "1px solid hsl(24 100% 52% / 0.25)",
      color: "hsl(24 80% 38%)"
    }}>
      <Zap size={11} />
      {slots} place{slots > 1 ? "s" : ""} restante{slots > 1 ? "s" : ""} à 99 €
    </div>
  );
}

export default LaunchQuotaBanner;
