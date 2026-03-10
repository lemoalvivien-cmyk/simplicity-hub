/**
 * ROIWidget — Mini ROI card for DashboardEntreprise
 * Shows: gains générés / 99 € = ROI%
 * Links to /roi for details
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Euro, ArrowRight } from "lucide-react";

interface Props {
  userId?: string;
}

export default function ROIWidget({ userId }: Props) {
  const [montant, setMontant] = useState<number | null>(null);
  const [intros, setIntros] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [gainsRes, introsRes] = await Promise.all([
        supabase
          .from("gains")
          .select("montant")
          .eq("facilitateur_id", userId)
          .in("statut", ["valide", "recu"]),
        supabase
          .from("introductions")
          .select("id", { count: "exact", head: true })
          .eq("entreprise_id", userId),
      ]);
      const total = (gainsRes.data ?? []).reduce((s: number, g: { montant: number | null }) => s + (g.montant ?? 0), 0);
      setMontant(total);
      setIntros(introsRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  const roi = montant && montant > 0 ? Math.round((montant / 99) * 100) : null;

  if (loading) return null;

  return (
    <Link
      to="/roi"
      className="card-surface p-4 flex items-center gap-4 hover:bg-secondary transition-colors group"
    >
      <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
        <TrendingUp size={17} className="text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Votre ROI</p>
        {roi !== null ? (
          <p className="font-display text-lg font-bold text-success">{roi}%</p>
        ) : (
          <p className="font-display text-lg font-bold text-foreground">—</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {montant && montant > 0
            ? `${montant.toLocaleString("fr")} € générés · ${intros ?? 0} intro(s) reçue(s)`
            : intros && intros > 0
            ? `${intros} intro(s) reçue(s) · gains en attente`
            : "Créez une mission pour mesurer votre ROI"}
        </p>
      </div>
      <ArrowRight size={14} className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
    </Link>
  );
}
