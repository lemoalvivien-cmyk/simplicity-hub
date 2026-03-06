import AdminLayout from "@/components/layout/AdminLayout";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const funnelSteps = [
  { label: "Visite landing page", count: 2840, pct: 100, prev: 2510 },
  { label: "Clic CTA principal", count: 1196, pct: 42, prev: 980 },
  { label: "Visite page tarifs", count: 854, pct: 30, prev: 720 },
  { label: "Début checkout", count: 312, pct: 11, prev: 290 },
  { label: "Inscription terminée", count: 142, pct: 5, prev: 108 },
];

const events = [
  { label: "Codes promo testés", value: "198", trend: "up" },
  { label: "Codes promo validés", value: "89", trend: "up" },
  { label: "Codes promo refusés", value: "109", trend: "down" },
  { label: "Paiements réussis", value: "53", trend: "up" },
  { label: "Paiements échoués", value: "7", trend: "down" },
  { label: "Onboardings terminés", value: "128", trend: "up" },
  { label: "Assistant IA ouvert", value: "312", trend: "up" },
  { label: "Questions FAQ consultées", value: "754", trend: "up" },
  { label: "Annulations", value: "4", trend: "neutral" },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp size={14} className="text-success" />;
  if (trend === "down") return <TrendingDown size={14} className="text-destructive" />;
  return <Minus size={14} className="text-muted-foreground" />;
};

export default function AdminAnalytics() {
  return (
    <AdminLayout title="Analytics" subtitle="Aperçu du tunnel et des événements clés (données simulées).">
      {/* Funnel */}
      <div className="card-surface p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-5">Tunnel de conversion</h2>
        <div className="space-y-3">
          {funnelSteps.map((step) => {
            const change = ((step.count - step.prev) / step.prev * 100).toFixed(0);
            const positive = step.count >= step.prev;
            return (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-foreground font-medium">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium flex items-center gap-1 ${positive ? "text-success" : "text-destructive"}`}>
                      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {positive ? "+" : ""}{change}%
                    </span>
                    <span className="font-bold text-foreground w-14 text-right">{step.count.toLocaleString("fr")}</span>
                    <span className="text-muted-foreground text-xs w-10 text-right">{step.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events grid */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Événements ce mois</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map(({ label, value, trend }) => (
            <div key={label} className="stat-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-xl font-bold text-foreground mt-0.5">{value}</p>
              </div>
              <TrendIcon trend={trend} />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Analytics en temps réel disponibles après connexion à votre solution de tracking.
      </p>
    </AdminLayout>
  );
}
