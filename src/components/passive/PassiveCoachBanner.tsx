/**
 * PassiveCoachBanner — Ce que JARVIS / OpenClaw suggère maintenant
 * Simple, utile, pas intrusif.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Brain, ChevronRight, X } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface CoachMessage {
  text: string;
  cta: string;
  to: string;
  priority: "high" | "normal";
}

export default function PassiveCoachBanner() {
  const { user } = useAuth();
  const [message, setMessage] = useState<CoachMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [linksRes, contactsRes, alertsRes, validationsRes] = await Promise.all([
        db.from("offer_share_links")
          .select("qualified_interest_count, opportunity_count, clicks_count")
          .eq("facilitator_id", user.id),
        db.from("contacts").select("id", { count: "exact", head: true }).eq("owner_user_id", user.id),
        db.from("passive_alerts")
          .select("id").eq("user_id", user.id).eq("read", false).limit(1),
        db.from("facilitator_requests")
          .select("id").eq("facilitator_user_id", user.id).eq("status", "envoyee").limit(1),
      ]);

      const links = linksRes.data || [];
      const contacts = contactsRes.count || 0;
      const unreadAlerts = (alertsRes.data || []).length;
      const pendingValidations = (validationsRes.data || []).length;

      const totalInterests = links.reduce((s: number, l: { qualified_interest_count: number }) => s + (l.qualified_interest_count || 0), 0);
      const totalOpps = links.reduce((s: number, l: { opportunity_count: number }) => s + (l.opportunity_count || 0), 0);

      // Priority cascade
      if (pendingValidations > 0) {
        setMessage({
          text: "Une entreprise vous a fait une demande. Une seule validation vous sépare d'un gain.",
          cta: "Valider maintenant",
          to: "/introductions",
          priority: "high",
        });
      } else if (totalInterests > 0) {
        setMessage({
          text: `${totalInterests} intérêt${totalInterests > 1 ? "s" : ""} qualifié${totalInterests > 1 ? "s" : ""} détecté${totalInterests > 1 ? "s" : ""}. Le moteur recommande d'agir maintenant.`,
          cta: "Voir ce qui chauffe",
          to: "/chaud",
          priority: "high",
        });
      } else if (unreadAlerts > 0) {
        setMessage({
          text: "Votre réseau travaille. De nouvelles alertes passives attendent votre regard.",
          cta: "Voir les alertes",
          to: "/chaud",
          priority: "normal",
        });
      } else if (contacts === 0) {
        setMessage({
          text: "Votre réseau n'est pas encore importé. La machine ne peut pas travailler pour vous.",
          cta: "Importer mon réseau",
          to: "/import-reseau",
          priority: "normal",
        });
      } else if (links.length === 0) {
        setMessage({
          text: "Vous n'avez pas encore partagé de lien traqué. La diffusion passive n'a pas démarré.",
          cta: "Voir les offres",
          to: "/offres",
          priority: "normal",
        });
      } else {
        setMessage({
          text: "La machine a préparé les meilleures offres à pousser. Voici ce qui peut vous rapporter maintenant.",
          cta: "Voir les offres",
          to: "/offres",
          priority: "normal",
        });
      }
    };
    load();
  }, [user]);

  if (!message || dismissed) return null;

  const isHigh = message.priority === "high";

  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3 relative"
      style={{
        background: isHigh
          ? "linear-gradient(135deg, hsl(24 80% 8% / 0.7), hsl(38 60% 9% / 0.5))"
          : "hsl(218 65% 10% / 0.5)",
        border: `1px solid ${isHigh ? "hsl(24 100% 52% / 0.3)" : "hsl(218 40% 25% / 0.3)"}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: isHigh ? "linear-gradient(135deg, hsl(24 100% 52%), hsl(38 80% 45%))" : "var(--gradient-primary)" }}
      >
        <Brain size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 leading-relaxed">{message.text}</p>
        <Link
          to={message.to}
          className="inline-flex items-center gap-1 text-xs font-bold mt-2"
          style={{ color: isHigh ? "hsl(24 100% 65%)" : "hsl(218 72% 65%)" }}
        >
          {message.cta} <ChevronRight size={11} />
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
      >
        <X size={12} className="text-white/40" />
      </button>
    </div>
  );
}
