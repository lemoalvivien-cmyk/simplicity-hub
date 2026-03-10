import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layout/UserLayout";
import PageTitle from "@/components/ui/PageTitle";
import ListPagination from "@/components/ui/ListPagination";
import { Send, CheckCircle2, Clock, XCircle, ChevronRight, Plus, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Status = "en_attente" | "en_cours" | "validee" | "refusee";
type Tab = Status | "toutes";

interface Introduction {
  id: string;
  contact_nom: string;
  contact_email: string;
  mission_id: string;
  statut: Status;
  created_at: string;
  contexte: string;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "en_attente", label: "En attente" },
  { id: "en_cours", label: "En cours" },
  { id: "validee", label: "Validées" },
  { id: "refusee", label: "Refusées" },
];

const statusConfig: Record<Status, { icon: JSX.Element; color: string; bg: string; label: string; explication: string }> = {
  en_attente: { icon: <Clock size={13} />, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", label: "En attente", explication: "L'entreprise n'a pas encore répondu." },
  en_cours:   { icon: <ChevronRight size={13} />, color: "hsl(var(--primary))", bg: "hsl(var(--secondary))", label: "En cours", explication: "L'entreprise échange avec votre contact." },
  validee:    { icon: <CheckCircle2 size={13} />, color: "hsl(var(--success))", bg: "hsl(var(--success-light))", label: "Validée ✓", explication: "L'entreprise a confirmé votre contact." },
  refusee:    { icon: <XCircle size={13} />, color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", label: "Refusée", explication: "Ce contact ne correspondait pas aux critères." },
};

const PAGE_SIZE = 20;

export default function Introductions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("toutes");
  const [page, setPage] = useState(0);

  const handleTab = (tab: Tab) => { setActiveTab(tab); setPage(0); };

  // Summary counts (all, unaffected by pagination)
  const { data: counts } = useQuery({
    queryKey: ["introductions-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("introductions")
        .select("statut")
        .eq("facilitateur_id", user!.id);
      const all = data || [];
      return {
        en_attente: all.filter(i => i.statut === "en_attente").length,
        validee: all.filter(i => i.statut === "validee").length,
        refusee: all.filter(i => i.statut === "refusee").length,
      };
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["introductions", user?.id, activeTab, page],
    enabled: !!user,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let q = db
        .from("introductions")
        .select("*", { count: "exact" })
        .eq("facilitateur_id", user!.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (activeTab !== "toutes") q = q.eq("statut", activeTab);

      const { data, count, error } = await q;
      if (error) throw error;
      return { items: (data || []) as Introduction[], total: count ?? 0 };
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <UserLayout>
      <PageTitle title="Mes introductions" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes introductions</h1>
            <p className="text-sm text-muted-foreground">
              Voici l'état de chaque contact que vous avez présenté à une entreprise.
            </p>
          </div>
          <Link to="/missions" className="btn-cta text-sm py-2.5 px-4 shrink-0 hidden sm:inline-flex">
            <Plus size={14} /> Nouvelle introduction
          </Link>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "En attente", value: counts?.en_attente ?? 0, color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))", sub: "Réponse attendue" },
            { label: "Validées",   value: counts?.validee ?? 0,    color: "hsl(var(--success))", bg: "hsl(var(--success-light))", sub: "Gain confirmé" },
            { label: "Refusées",   value: counts?.refusee ?? 0,    color: "hsl(var(--destructive))", bg: "hsl(0 72% 95%)", sub: "Ne correspondait pas" },
          ].map(({ label, value, color, bg, sub }) => (
            <div key={label} className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: bg }}>
              <p className="font-display text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold" style={{ color }}>{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Send size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune introduction ici</p>
            <p className="text-sm text-muted-foreground mb-4">
              Parcourez les missions disponibles pour faire votre première introduction.
            </p>
            <Link to="/missions" className="btn-cta text-sm py-2.5 px-5">Voir les missions</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((intro) => {
                const cfg = statusConfig[intro.statut];
                return (
                  <Link key={intro.id} to={`/introductions/${intro.id}`}
                    className="card-surface p-5 block hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                          {intro.contact_nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{intro.contact_nom}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(intro.created_at)}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed" style={{ background: "hsl(var(--muted))" }}>
                      <span className="text-foreground">{cfg.explication}</span>
                    </div>

                    {intro.statut === "refusee" && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                        <ChevronRight size={12} /> Essayer avec un autre contact
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            <ListPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}

        <div className="mt-6 sm:hidden">
          <Link to="/missions" className="btn-cta w-full py-3 justify-center">
            <Plus size={14} /> Faire une nouvelle introduction
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
