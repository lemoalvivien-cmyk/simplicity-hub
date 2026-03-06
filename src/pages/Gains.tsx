import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { CheckCircle2, Clock, ArrowDownCircle, XCircle, Euro, Info, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type GainStatus = "en_attente" | "valide" | "recu" | "annule";
type GainTab = "tous" | GainStatus;

interface Gain {
  id: string;
  introduction_id: string;
  mission_id: string;
  montant: number;
  statut: GainStatus;
  created_at: string;
  updated_at: string;
}

const tabConfig: { id: GainTab; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Validés" },
  { id: "recu", label: "Reçus" },
  { id: "annule", label: "Annulés" },
];

const statusConfig: Record<GainStatus, { icon: JSX.Element; color: string; bg: string; label: string; explication_courte: string }> = {
  en_attente: { icon: <Clock size={13} />, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "En attente", explication_courte: "L'entreprise n'a pas encore validé votre contact." },
  valide: { icon: <CheckCircle2 size={13} />, color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validé ✓", explication_courte: "L'entreprise a confirmé votre contact. Le versement arrive bientôt." },
  recu: { icon: <ArrowDownCircle size={13} />, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "Reçu", explication_courte: "Votre gain a été versé." },
  annule: { icon: <XCircle size={13} />, color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Annulé", explication_courte: "Ce gain n'a pas abouti." },
};

export default function Gains() {
  const { user } = useAuth();
  const [gains, setGains] = useState<Gain[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GainTab>("tous");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await db
        .from("gains")
        .select("*")
        .eq("facilitateur_id", user.id)
        .order("created_at", { ascending: false });
      setGains(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = activeTab === "tous" ? gains : gains.filter(g => g.statut === activeTab);
  const totalValide = gains.filter(g => g.statut === "valide").reduce((s, g) => s + g.montant, 0);
  const totalAttendu = gains.filter(g => g.statut === "en_attente").reduce((s, g) => s + g.montant, 0);
  const totalRecu = gains.filter(g => g.statut === "recu").reduce((s, g) => s + g.montant, 0);
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes gains</h1>
          <p className="text-sm text-muted-foreground">Voici ce que vous avez gagné grâce à vos introductions.</p>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Validés", value: `${totalValide} €`, sub: "Confirmés, versement en cours", color: "hsl(var(--success))", bg: "hsl(var(--success-light))", icon: <CheckCircle2 size={17} /> },
            { label: "En attente", value: `${totalAttendu} €`, sub: "En cours de validation", color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", icon: <Clock size={17} /> },
            { label: "Reçus", value: `${totalRecu} €`, sub: "Déjà versés", color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", icon: <ArrowDownCircle size={17} /> },
          ].map(({ label, value, sub, color, bg, icon }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col gap-1" style={{ background: bg }}>
              <div style={{ color }}>{icon}</div>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
              <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* Info paiement */}
        <div className="p-4 rounded-xl border border-border bg-muted flex gap-3 mb-6">
          <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Comment fonctionne le versement ?</strong>{" "}
            Une fois votre contact validé par l'entreprise, votre gain est confirmé. Le versement est effectué dans les 30 jours qui suivent.
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Euro size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucun gain ici pour l'instant</p>
            <p className="text-sm text-muted-foreground mb-4">Faites votre première introduction pour commencer à gagner.</p>
            <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">Voir les missions disponibles</Link>
          </div>
        ) : (
          <div className="card-surface p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Détail de mes gains
            </h2>
            <div className="space-y-4">
              {filtered.map((g) => {
                const cfg = statusConfig[g.statut];
                return (
                  <div key={g.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                          {formatDate(g.created_at).charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Introduction · {formatDate(g.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-base font-bold text-foreground">{g.montant} €</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed ml-11">{cfg.explication_courte}</p>
                    <div className="mt-2 ml-11">
                      <Link to={`/introductions/${g.introduction_id}`}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                        Voir l'introduction <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
