/**
 * Mes Royalty Futures — WMAX Token dashboard tab
 * ─────────────────────────────────────────────────────────────────────────
 * • Live deal history from ada_sessions (state = "closed")
 * • Per-deal breakdown: 12% royalty = 7% platform + 5% engine fee
 * • Mint WMAX token button per deal → calls mintWMAXToken()
 * • Live WMAX token price feed (Base L2 placeholder, upgradeable)
 * • Connect Bank PSD2 → calls bank-webhook edge function
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mintWMAXToken } from "@/lib/wmax-token";
import {
  Coins, Zap, TrendingUp, Loader2, CheckCircle2,
  ExternalLink, Landmark, RefreshCw, Shield,
  ArrowUpRight, Database, Wallet, Bot,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────
interface RoyaltyRecord {
  id: string;
  target_name: string;
  deal_amount: number;
  royalty_12pct: number;
  platform_fee_7pct: number;
  engine_fee_5pct: number;
  facilitateur_net: number;
  closed_at: string;
  minted: boolean;
  tx_hash?: string;
}

interface CashFlowEntry {
  id: string;
  amount: number | null;
  counterparty: string | null;
  cash_weight: number | null;
  created_at: string;
}

// ─── Live WMAX price (Base L2) — upgradeable to real oracle ───────────────
const WMAX_BASE_PRICE = 1.0; // 1 WMAX = 1 € — replace with live feed

// ─── KPI card ─────────────────────────────────────────────────────────────
function KPICard({
  label, value, sub, color, icon: Icon, pulse,
}: {
  label: string; value: string; sub?: string;
  color: string; icon: React.ElementType; pulse?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-2"
      style={{ background: "hsl(var(--card))", borderColor: color.replace(")", " / 0.22)") }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {pulse && (
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: color }}
          />
        )}
      </div>
      <p className="font-display font-black text-xl leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Connect Bank PSD2 panel ───────────────────────────────────────────────
function BankConnectPanel({ userId }: { userId: string }) {
  const [connecting, setConnecting] = useState(false);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [loadingCF, setLoadingCF] = useState(true);

  useEffect(() => {
    supabase
      .from("live_cash_flow")
      .select("id, amount, counterparty, cash_weight, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setCashFlow(data as CashFlowEntry[]);
        setLoadingCF(false);
      });
  }, [userId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Simulate a sample bank transaction push to bank-webhook for demo
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/bank-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          user_id: userId,
          transaction: {
            amount: 5000,
            freq: 12,
            counterparty: "PSD2 Test — Banque démo",
            description: "Virement mensuel entreprise — PSD2 connect",
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("✅ Banque connectée — Live Cash Flow activé !");
        // Reload entries
        const { data } = await supabase
          .from("live_cash_flow")
          .select("id, amount, counterparty, cash_weight, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data) setCashFlow(data as CashFlowEntry[]);
      } else {
        toast.error(json.error ?? "Erreur lors de la connexion bancaire.");
      }
    } catch (e) {
      toast.error("Erreur réseau — réessayez.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(210 85% 45% / 0.3)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{
          background: "hsl(210 85% 12% / 0.6)",
          borderColor: "hsl(210 85% 45% / 0.2)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(210 85% 25% / 0.5)" }}
          >
            <Landmark size={15} style={{ color: "hsl(210 85% 72%)" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Connect Bank PSD2</p>
            <p className="text-[10px] text-muted-foreground">Live Cash Flow · Scoring ADA boosté</p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, hsl(210 85% 38%), hsl(210 85% 52%))" }}
        >
          {connecting
            ? <><Loader2 size={12} className="animate-spin" /> Connexion…</>
            : <><Landmark size={12} /> Connecter ma banque</>
          }
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {loadingCF ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : cashFlow.length === 0 ? (
          <div className="text-center py-5">
            <Database size={22} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Aucune transaction bancaire. Connectez votre banque pour activer le scoring ADA live.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Dernières transactions ingérées
            </p>
            {cashFlow.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border"
                style={{ borderColor: "hsl(210 85% 45% / 0.15)", background: "hsl(210 85% 10% / 0.3)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {tx.counterparty ?? "Transaction"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: (tx.amount ?? 0) >= 0 ? "hsl(152 62% 52%)" : "hsl(0 72% 60%)" }}
                  >
                    {(tx.amount ?? 0) >= 0 ? "+" : ""}{(tx.amount ?? 0).toLocaleString("fr-FR")} €
                  </p>
                  {tx.cash_weight && (
                    <p className="text-[10px] text-muted-foreground">
                      Signal: {tx.cash_weight.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PSD2 reassurance */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <Shield size={11} className="text-muted-foreground shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            Données bancaires jamais stockées en clair · Vectorisation sécurisée · RGPD · DSP2
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function RoyaltyFuturesTab() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Simulated live price — replace with real oracle / websocket
  const [tokenPrice, setTokenPrice] = useState(WMAX_BASE_PRICE);
  useEffect(() => {
    const id = setInterval(() => {
      // Gentle ±2% live fluctuation simulation
      setTokenPrice(p => Math.max(0.85, +(p + (Math.random() - 0.5) * 0.04).toFixed(4)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const fetchRoyalties = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("ada_sessions")
        .select("id, target_name, contract_amount, commission_7pct, final_closed_at, reasoning_trace")
        .eq("owner_user_id", user.id)
        .eq("state", "closed")
        .order("final_closed_at", { ascending: false })
        .limit(50);

      if (data) {
        const mapped: RoyaltyRecord[] = data.map(s => {
          const deal = s.contract_amount ?? 0;
          const r12  = Math.round(deal * 0.12 * 100) / 100;
          const p7   = Math.round(deal * 0.07 * 100) / 100;
          const e5   = Math.round(deal * 0.05 * 100) / 100;
          const net  = Math.round((deal - r12) * 100) / 100;
          const trace = (s.reasoning_trace as Record<string, unknown>[] | null) ?? [];
          const mintData = trace.find((t: Record<string, unknown>) => t.wmax_minted);
          return {
            id: s.id,
            target_name: s.target_name,
            deal_amount: deal,
            royalty_12pct: r12,
            platform_fee_7pct: p7,
            engine_fee_5pct: e5,
            facilitateur_net: net,
            closed_at: s.final_closed_at ?? "",
            minted: !!mintData,
            tx_hash: mintData ? String(mintData.tx_hash ?? "") : undefined,
          };
        });
        setRecords(mapped);
      }
    } catch {
      toast.error("Erreur lors du chargement des royalties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchRoyalties(); }, [fetchRoyalties]);

  const handleRefresh = () => { setRefreshing(true); fetchRoyalties(); };

  const handleMint = async (record: RoyaltyRecord) => {
    if (!user?.id) return;
    setMinting(record.id);
    try {
      const result = await mintWMAXToken(user.id, record.royalty_12pct, record.id);
      if (result.success) {
        toast.success(`✅ ${record.royalty_12pct} WMAX mintés sur Base L2 !`);
        setRecords(prev => prev.map(r =>
          r.id === record.id ? { ...r, minted: true, tx_hash: result.tx_hash } : r,
        ));
      } else {
        toast.error(result.error ?? "Erreur lors du mint.");
      }
    } catch {
      toast.error("Erreur réseau — réessayez.");
    } finally {
      setMinting(null);
    }
  };

  // ── Computed KPIs ──────────────────────────────────────────────────────
  const totalRoyalties = records.reduce((a, r) => a + r.royalty_12pct, 0);
  const wmaxMinted     = records.filter(r => r.minted).reduce((a, r) => a + r.royalty_12pct, 0);
  const wmaxPending    = records.filter(r => !r.minted).reduce((a, r) => a + r.royalty_12pct, 0);
  const liveValue      = wmaxMinted * tokenPrice;

  return (
    <div className="space-y-5">

      {/* ── WMAX intro banner ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-5 py-4 border flex items-start gap-3"
        style={{ background: "hsl(38 100% 52% / 0.06)", borderColor: "hsl(38 100% 52% / 0.28)" }}
      >
        <Coins size={18} style={{ color: "hsl(38 95% 60%)" }} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-foreground mb-0.5">
            Mes gains — Récompenses automatiques
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Chaque deal fermé par votre assistant IA génère automatiquement{" "}
            <span className="font-semibold" style={{ color: "hsl(38 95% 65%)" }}>12 % de gains reversés</span>{" "}
            — 7 % frais plateforme + 5 % moteur IA.
            Convertissez vos récompenses et revendez-les sur le marché secondaire.
          </p>
        </div>
      </div>

      {/* ── KPI grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Gains totaux"
          value={`${totalRoyalties.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`}
          sub={`${records.length} deal${records.length !== 1 ? "s" : ""} assistants IA`}
          color="hsl(var(--primary-glow))"
          icon={TrendingUp}
        />
        <KPICard
          label="Récompenses converties"
          value={wmaxMinted.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          sub="unités sur le marché"
          color="hsl(38 95% 60%)"
          icon={Coins}
        />
        <KPICard
          label="Valeur live"
          value={`${liveValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`}
          sub={`1 unité = ${tokenPrice.toFixed(4)} €`}
          color="hsl(152 62% 50%)"
          icon={Zap}
          pulse
        />
        <KPICard
          label="À convertir"
          value={wmaxPending.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          sub="récompenses en attente"
          color="hsl(var(--accent))"
          icon={Wallet}
        />
      </div>

      {/* ── Deal history ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <Bot size={14} style={{ color: "hsl(var(--primary-glow))" }} />
            <p className="text-sm font-bold text-foreground">Historique des deals</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 px-5">
              <Coins size={28} className="mx-auto mb-3 text-muted-foreground/35" />
              <p className="text-sm font-semibold text-foreground mb-1">
                Aucun deal fermé pour l'instant
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Vos gains apparaîtront ici dès que votre assistant IA fermera son premier deal autonome.
              </p>
            </div>
          ) : (
            records.map(record => (
              <div
                key={record.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                {/* Status icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: record.minted
                      ? "hsl(152 62% 50% / 0.12)"
                      : "hsl(38 95% 52% / 0.1)",
                  }}
                >
                  {record.minted
                    ? <CheckCircle2 size={15} style={{ color: "hsl(152 62% 50%)" }} />
                    : <Coins size={15} style={{ color: "hsl(38 95% 60%)" }} />
                  }
                </div>

                {/* Deal info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">{record.target_name}</p>
                    {record.minted && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "hsl(152 62% 50% / 0.12)", color: "hsl(152 62% 50%)" }}
                      >
                        Converti
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="text-xs text-muted-foreground">
                      Deal :{" "}
                      <span className="text-foreground font-medium">
                        {record.deal_amount.toLocaleString("fr-FR")} €
                      </span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "hsl(38 95% 65%)" }}>
                      Gains : {record.royalty_12pct.toLocaleString("fr-FR")} €
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                      (7 % plateforme={record.platform_fee_7pct.toLocaleString("fr-FR")} € · 5 % moteur={record.engine_fee_5pct.toLocaleString("fr-FR")} €)
                    </span>
                  </div>
                </div>

                {/* Date */}
                <p className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
                  {record.closed_at
                    ? new Date(record.closed_at).toLocaleDateString("fr-FR")
                    : "—"
                  }
                </p>

                {/* Action */}
                {record.minted ? (
                  record.tx_hash ? (
                    <a
                      href={`https://basescan.org/tx/${record.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "hsl(152 62% 50%)" }}
                    >
                      <ArrowUpRight size={12} />
                      <span className="hidden sm:inline">Basescan</span>
                    </a>
                  ) : (
                    <span
                      className="shrink-0 flex items-center gap-1 text-xs font-medium"
                      style={{ color: "hsl(152 62% 50%)" }}
                    >
                      <CheckCircle2 size={12} /> OK
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleMint(record)}
                    disabled={minting === record.id || record.deal_amount === 0}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                  {minting === record.id
                      ? <><Loader2 size={11} className="animate-spin" /> Conversion…</>
                      : <><Zap size={11} /> Convertir</>
                    }
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {records.length > 0 && (
          <div
            className="flex items-center justify-center gap-1.5 py-3 border-t"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <ExternalLink size={10} className="text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">
              Tokens WMAX émis sur Base L2 · Revendables sur secondary market
            </p>
          </div>
        )}
      </div>

      {/* ── Connect Bank PSD2 ───────────────────────────────────────────── */}
      {user?.id && <BankConnectPanel userId={user.id} />}
    </div>
  );
}
