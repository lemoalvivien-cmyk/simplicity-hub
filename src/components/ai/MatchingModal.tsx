import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Star, MapPin, Briefcase, Trophy, Loader2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MatchResult {
  apporteur_id: string;
  nom: string;
  score: number;
  raison: string;
  points_forts: string[];
}

interface MatchingModalProps {
  open: boolean;
  onClose: () => void;
  enterpriseProfile: {
    sector: string;
    offer_description: string;
    needs: string;
    zone: string;
    target: string;
  };
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "hsl(var(--success))"
      : score >= 60
      ? "hsl(var(--warning))"
      : "hsl(var(--muted-foreground))";

  const bg =
    score >= 80
      ? "hsl(var(--success-light))"
      : score >= 60
      ? "hsl(var(--warning-light, 47 100% 90%))"
      : "hsl(var(--muted))";

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums"
      style={{ background: bg, color }}
    >
      <Trophy size={11} />
      {score}%
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "hsl(var(--success))" : score >= 60 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function MatchingModal({ open, onClose, enterpriseProfile }: MatchingModalProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    setMatches(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-matching", {
        body: { enterprise_profile: enterpriseProfile },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const results: MatchResult[] = data?.matches || [];
      setMatches(results);

      if (results.length === 0) {
        setError("Aucun apporteur actif correspondant trouvé. Réessayez plus tard.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
      setTimeout(() => {
        setMatches(null);
        setError(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Sparkles size={18} className="text-primary" />
            Matching IA — Vos meilleurs apporteurs
          </DialogTitle>
        </DialogHeader>

        {/* Context summary */}
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-1.5 text-sm">
          {enterpriseProfile.sector && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase size={13} />
              <span className="font-medium text-foreground">{enterpriseProfile.sector}</span>
            </div>
          )}
          {enterpriseProfile.zone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={13} />
              <span>{enterpriseProfile.zone}</span>
            </div>
          )}
          {enterpriseProfile.offer_description && (
            <p className="text-muted-foreground line-clamp-2 pt-0.5">{enterpriseProfile.offer_description}</p>
          )}
        </div>

        {/* CTA */}
        {!matches && !loading && (
          <button
            onClick={handleMatch}
            className="btn-cta w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Lancer l'analyse IA
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Analyse des profils en cours…</p>
            <p className="text-xs text-muted-foreground">L'IA sélectionne vos meilleurs apporteurs</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}

        {/* Results */}
        {matches && matches.length > 0 && !loading && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {matches.length} apporteur{matches.length > 1 ? "s" : ""} sélectionné{matches.length > 1 ? "s" : ""}
            </p>
            {matches.map((match, idx) => (
              <div
                key={match.apporteur_id || idx}
                className="card-surface p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Star size={15} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{match.nom}</p>
                      <p className="text-xs text-muted-foreground">Apporteur #{idx + 1}</p>
                    </div>
                  </div>
                  <ScoreBadge score={match.score} />
                </div>

                {/* Score bar */}
                <ScoreBar score={match.score} />

                {/* Reason */}
                <p className="text-sm text-muted-foreground leading-relaxed">{match.raison}</p>

                {/* Points forts */}
                {match.points_forts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {match.points_forts.map((point, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border border-primary/20 text-primary bg-primary/5"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Re-run */}
            <button
              onClick={handleMatch}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Relancer l'analyse
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
