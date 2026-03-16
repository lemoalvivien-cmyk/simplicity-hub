/**
 * Admin Beta — Dashboard bêta privée
 * Voir : compteur de slots · liste waitlist · statut beta
 * Protégé : admin uniquement
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Mail, Clock, CheckCircle2, Lock, Unlock,
  RefreshCw, Download, Zap,
} from "lucide-react";
import { CLOSED_BETA, BETA_MAX_SLOTS, PUBLIC_MAX_SLOTS } from "@/lib/betaConfig";
import { useFounderSlots } from "@/hooks/useFounderSlots";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  created_at: string;
  properties: { email?: string; source?: string } | null;
}

export default function AdminBeta() {
  const { remaining, loading: slotsLoading } = useFounderSlots();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWaitlist = async () => {
    setRefreshing(true);
    const { data, error } = await (supabase.from("analytics_events") as any)
      .select("id, created_at, properties")
      .eq("event_type", "waitlist_signup")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Erreur lors du chargement de la liste d'attente.");
    else setWaitlist(data ?? []);
    setLoadingList(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchWaitlist(); }, []);

  const handleExportCSV = () => {
    if (!waitlist.length) return;
    const rows = [
      ["Email", "Source", "Date d'inscription"],
      ...waitlist.map(e => [
        e.properties?.email ?? "—",
        e.properties?.source ?? "—",
        new Date(e.created_at).toLocaleString("fr-FR"),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-wiinupmax-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${waitlist.length} adresses exportées`);
  };

  const usedPublic = remaining !== null ? PUBLIC_MAX_SLOTS - remaining : null;
  const betaProgress = Math.min((waitlist.length / BETA_MAX_SLOTS) * 100, 100);

  return (
    <AdminLayout title="Tableau de bord Bêta" subtitle="Gestion de la bêta privée et liste d'attente">
      <div className="max-w-3xl mx-auto space-y-6 pb-10">

        {/* Status badge */}
        <div className="flex items-center">
          <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={
                CLOSED_BETA
                  ? { background: "hsl(38 95% 50% / 0.12)", border: "1px solid hsl(38 95% 50% / 0.3)", color: "hsl(38 95% 55%)" }
                  : { background: "hsl(152 62% 34% / 0.12)", border: "1px solid hsl(152 62% 34% / 0.3)", color: "hsl(152 62% 50%)" }
              }
            >
              {CLOSED_BETA ? <Lock size={11} /> : <Unlock size={11} />}
              {CLOSED_BETA ? "Bêta privée active" : "Site public ouvert"}
            </div>
          </div>
        </div>

        {/* Toggle instruction */}
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{
            background: CLOSED_BETA ? "hsl(38 95% 50% / 0.05)" : "hsl(152 62% 34% / 0.05)",
            borderColor: CLOSED_BETA ? "hsl(38 95% 50% / 0.25)" : "hsl(152 62% 34% / 0.25)",
          }}
        >
          <Zap size={16} style={{ color: CLOSED_BETA ? "hsl(38 95% 55%)" : "hsl(152 62% 50%)" }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {CLOSED_BETA ? "Pour ouvrir au public :" : "La plateforme est ouverte au public."}
            </p>
            {CLOSED_BETA ? (
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Ouvrir <code className="bg-muted px-1 rounded">src/lib/betaConfig.ts</code></li>
                <li>Mettre <code className="bg-muted px-1 rounded">CLOSED_BETA = false</code></li>
                <li>Vérifier <code className="bg-muted px-1 rounded">launch_quota.total_slots = 100</code> en base</li>
                <li>Publier via Lovable → Update</li>
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">
                Mettre <code className="bg-muted px-1 rounded">CLOSED_BETA = true</code> dans betaConfig.ts pour repasser en mode privé.
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Places bêta max</p>
            <p className="font-display font-black text-3xl text-foreground">{BETA_MAX_SLOTS}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sur liste d'attente</p>
            {loadingList ? (
              <div className="h-9 w-16 rounded bg-muted animate-pulse mx-auto" />
            ) : (
              <p className="font-display font-black text-3xl" style={{ color: "hsl(var(--accent))" }}>
                {waitlist.length}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Places payantes</p>
            {slotsLoading ? (
              <div className="h-9 w-16 rounded bg-muted animate-pulse mx-auto" />
            ) : (
              <p className="font-display font-black text-3xl" style={{ color: "hsl(152 62% 50%)" }}>
                {usedPublic ?? "—"}
              </p>
            )}
          </div>
        </div>

        {/* Waitlist progress */}
        {CLOSED_BETA && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Remplissage liste d'attente</p>
              <p className="text-sm font-bold text-muted-foreground">{waitlist.length} / {BETA_MAX_SLOTS}</p>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${betaProgress}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary-glow)), hsl(var(--accent)))",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {betaProgress >= 100
                ? "Liste complète — prêt à ouvrir au public"
                : `${Math.round(betaProgress)}% rempli — ${BETA_MAX_SLOTS - waitlist.length} places restantes`}
            </p>
          </div>
        )}

        {/* Waitlist table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Mail size={14} className="text-primary" />
              Liste d'attente ({waitlist.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchWaitlist}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
              <button
                onClick={handleExportCSV}
                disabled={!waitlist.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Download size={11} />
                Export CSV
              </button>
            </div>
          </div>

          {loadingList ? (
            <div className="p-5 space-y-2">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : waitlist.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={28} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Aucune inscription pour l'instant</p>
              <p className="text-xs text-muted-foreground">Les emails apparaîtront ici dès que quelqu'un s'inscrit.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {waitlist.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                    {(entry.properties?.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.properties?.email ?? "Email inconnu"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.properties?.source ?? "landing"} · {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <CheckCircle2 size={14} style={{ color: "hsl(152 62% 50%)" }} className="shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch checklist */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "hsl(218 72% 10% / 0.5)", borderColor: "hsl(var(--border))" }}
        >
          <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary" /> Checklist de lancement
          </h2>
          <ul className="space-y-2.5 text-sm">
            {[
              { ok: true,          label: "betaConfig.ts créé avec toggle commenté" },
              { ok: true,          label: "ClosedBetaBanner sur la landing" },
              { ok: true,          label: "GuaranteeBadge sur landing, pricing, checkout, success" },
              { ok: true,          label: "usePageTracking actif dans App.tsx" },
              { ok: true,          label: "Funnel analytics complet (landing → gain_paid)" },
              { ok: true,          label: "Page /admin-beta avec export CSV waitlist" },
              { ok: !CLOSED_BETA,  label: "CLOSED_BETA = false (site ouvert au public)" },
              { ok: false,         label: "Repo GitHub rendu privé (manuel)" },
              { ok: false,         label: "Historique Git purgé avec git filter-repo (manuel)" },
              { ok: false,         label: "STRIPE_WEBHOOK_SECRET configuré en production" },
            ].map(({ ok, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: ok ? "hsl(152 62% 34% / 0.2)" : "hsl(var(--muted))" }}
                >
                  {ok
                    ? <CheckCircle2 size={12} style={{ color: "hsl(152 62% 52%)" }} />
                    : <Clock size={12} className="text-muted-foreground" />
                  }
                </div>
                <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
