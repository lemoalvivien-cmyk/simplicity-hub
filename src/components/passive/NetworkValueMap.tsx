/**
 * NetworkValueMap — Où votre réseau vaut le plus
 * Simple, actionnable, pas de graphe illisible.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Map, TrendingUp, Loader2, ChevronRight, ArrowRight } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ValueDimension {
  label: string;
  values: { name: string; score: number; count: number; hint: string }[];
}

function DimensionRow({ name, score, count, hint }: { name: string; score: number; count: number; hint: string }) {
  const color = score >= 70 ? "hsl(152 62% 40%)" : score >= 45 ? "hsl(38 80% 40%)" : "hsl(var(--primary))";
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
          </div>
          <span className="text-xs font-bold tabular-nums shrink-0" style={{ color, minWidth: "28px", textAlign: "right" }}>{score}</span>
        </div>
      </div>
    </div>
  );
}

export default function NetworkValueMap() {
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState<ValueDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalContacts, setTotalContacts] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [contactsRes, introRes, gainsRes, profileRes] = await Promise.all([
        db.from("contacts")
          .select("secteur, zone, langue, statut")
          .eq("owner_user_id", user.id),
        db.from("introductions")
          .select("mission_id, statut")
          .eq("facilitateur_id", user.id),
        db.from("gains")
          .select("montant, statut, source")
          .eq("facilitateur_id", user.id),
        db.from("facilitateur_profiles")
          .select("secteur, zone, languages, business_corridors, response_rate")
          .eq("user_id", user.id)
          .single(),
      ]);

      const contacts = contactsRes.data || [];
      const intros = introRes.data || [];
      const gains = gainsRes.data || [];
      const profile = profileRes.data;

      setTotalContacts(contacts.length);

      // --- Secteurs ---
      const sectorMap: Record<string, number> = {};
      contacts.forEach((c: { secteur?: string }) => {
        if (c.secteur) sectorMap[c.secteur] = (sectorMap[c.secteur] || 0) + 1;
      });
      // Add from profile
      if (profile?.secteur) {
        sectorMap[profile.secteur] = (sectorMap[profile.secteur] || 0) + 5;
      }
      const sectors = Object.entries(sectorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({
          name,
          count,
          score: Math.min(95, 30 + count * 8 + (intros.filter(i => i.statut === "validee").length * 5)),
          hint: `${count} contact${count > 1 ? "s" : ""}`,
        }));

      // --- Zones ---
      const zoneMap: Record<string, number> = {};
      contacts.forEach((c: { zone?: string }) => {
        if (c.zone) zoneMap[c.zone] = (zoneMap[c.zone] || 0) + 1;
      });
      if (profile?.zone) {
        zoneMap[profile.zone] = (zoneMap[profile.zone] || 0) + 5;
      }
      const zones = Object.entries(zoneMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({
          name,
          count,
          score: Math.min(95, 25 + count * 7),
          hint: `${count} contact${count > 1 ? "s" : ""}`,
        }));

      // --- Langues ---
      const langMap: Record<string, number> = {};
      contacts.forEach((c: { langue?: string }) => {
        if (c.langue) langMap[c.langue] = (langMap[c.langue] || 0) + 1;
      });
      (profile?.languages || []).forEach((l: string) => {
        langMap[l] = (langMap[l] || 0) + 10;
      });
      const langs = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({
          name,
          count,
          score: Math.min(95, 40 + count * 5),
          hint: count > 10 ? "Natif" : `${count} contact${count > 1 ? "s" : ""}`,
        }));

      // --- Corridors ---
      const corridorValues = (profile?.business_corridors || []).map((c: string, i: number) => ({
        name: c,
        count: i === 0 ? 8 : 5,
        score: i === 0 ? 80 : 55,
        hint: "Actif",
      }));

      // Fallback content if no data
      const fallbackSectors: ValueDimension["values"] = contacts.length === 0 ? [
        { name: "Importez vos contacts", score: 0, count: 0, hint: "Aucune donnée" }
      ] : sectors.length > 0 ? sectors : [{ name: "Données insuffisantes", score: 20, count: 0, hint: "Enrichissez votre profil" }];

      const dims: ValueDimension[] = [
        { label: "Secteurs", values: fallbackSectors },
        { label: "Zones géographiques", values: zones.length > 0 ? zones : [{ name: "Complétez votre profil", score: 20, count: 0, hint: "Zone manquante" }] },
      ];

      if (langs.length > 0) dims.push({ label: "Langues", values: langs });
      if (corridorValues.length > 0) dims.push({ label: "Corridors business", values: corridorValues });

      setDimensions(dims);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="card-surface p-5 flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Map size={14} className="text-primary" />
          Où votre réseau vaut le plus
        </h2>
        <span className="text-xs text-muted-foreground">{totalContacts} contacts</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Vos zones de force. Ce que la machine peut exploiter.</p>

      <div className="space-y-4">
        {dimensions.map((dim) => (
          <div key={dim.label}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{dim.label}</p>
            {dim.values.map((v) => (
              <DimensionRow key={v.name} {...v} />
            ))}
          </div>
        ))}
      </div>

      {totalContacts === 0 && (
        <div className="mt-4 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold text-primary mb-1">Activez votre carte réseau</p>
          <p className="text-xs text-muted-foreground mb-2">Importez vos contacts pour que le moteur sache où vous avez le plus de valeur.</p>
          <Link to="/import-reseau" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            Importer mon réseau <ArrowRight size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}
