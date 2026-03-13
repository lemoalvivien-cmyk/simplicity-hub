/**
 * Mes Royalty Futures — WMAX Token tab
 * Displays live royalty history from ADA sessions + minting UI
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mintWMAXToken } from "@/lib/wmax-token";
import { Coins, Zap, TrendingUp, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface RoyaltyRecord {
  id: string;
  deal_amount: number;
  royalty_12pct: number;
  platform_fee_7pct: number;
  engine_fee_5pct: number;
  facilitateur_net: number;
  stripe_pi: string;
  target_name: string;
  closed_at: string;
  minted: boolean;
  tx_hash?: string;
}

export default function RoyaltyFuturesTab() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState<string | null>(null);
  const [totalRoyalties, setTotalRoyalties] = useState(0);
  const [tokenPrice] = useState(1.0); // 1 WMAX = 1 € base price (live feed placeholder)

  useEffect(() => {
    if (!user?.id) return;
    fetchRoyalties();
  }, [user?.id]);

  async function fetchRoyalties() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("ada_sessions")
        .select("id, target_name, contract_amount, commission_7pct, final_closed_at, reasoning_trace")
        .eq("owner_user_id", user!.id)
        .eq("state", "closed")
        .order("final_closed_at", { ascending: false })
        .limit(50);

      if (data) {
        const mapped: RoyaltyRecord[] = data.map(s => {
          const deal = s.contract_amount ?? 0;
          const royalty12 = Math.round(deal * 0.12 * 100) / 100;
          const platform7 = Math.round(deal * 0.07 * 100) / 100;
          const engine5   = Math.round(deal * 0.05 * 100) / 100;
          const net       = Math.round((deal - royalty12) * 100) / 100;
          const trace     = (s.reasoning_trace as Record<string, unknown>[] | null) ?? [];
          const mintData  = trace.find((t: Record<string, unknown>) => t.wmax_minted);
          return {
            id: s.id,
            deal_amount: deal,
            royalty_12pct: royalty12,
            platform_fee_7pct: platform7,
            engine_fee_5pct: engine5,
            facilitateur_net: net,
            stripe_pi: "",
            target_name: s.target_name,
            closed_at: s.final_closed_at ?? "",
            minted: !!mintData,
            tx_hash: mintData ? String(mintData.tx_hash ?? "") : undefined,
          };
        });
        setRecords(mapped);
        setTotalRoyalties(mapped.reduce((acc, r) => acc + r.royalty_12pct, 0));
      }
    } catch {
      toast.error("Erreur lors du chargement des royalties.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMint(record: RoyaltyRecord) {
    if (!user?.id) return;
    setMinting(record.id);
    try {
      const result = await mintWMAXToken(user.id, record.royalty_12pct, record.id);
      if (result.success) {
        toast.success(`✅ ${record.royalty_12pct} WMAX mintés ! TX: ${result.tx_hash?.slice(0, 10)}…`);
        setRecords(prev => prev.map(r =>
          r.id === record.id ? { ...r, minted: true, tx_hash: result.tx_hash } : r
        ));
      } else {
        toast.error(result.error ?? "Erreur lors du mint.");
      }
    } catch {
      toast.error("Erreur réseau — réessayez.");
    } finally {
      setMinting(null);
    }
  }

  const wmaxBalance = records.filter(r => r.minted).reduce((acc, r) => acc + r.royalty_12pct, 0);

  return (
    <div className="space-y-5">

      {/* ── Header KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total royalties 12%",
            value: `${totalRoyalties.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
            color: "hsl(var(--primary-glow))",
            icon: TrendingUp,
          },
          {
            label: "WMAX mintés",
            value: `${wmaxBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`,
            color: "hsl(38 95% 60%)",
            icon: Coins,
          },
          {
            label: "Valeur live WMAX",
            value: `${(wmaxBalance * tokenPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
            color: "hsl(152 62% 50%)",
            icon: Zap,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border"
            style={{
              background: "hsl(var(--card))",
              borderColor: `${color.replace(")", " / 0.25)")}`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} style={{ color }} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
            <p className="font-display font-bold text-lg leading-none" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── WMAX badge ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 border"
        style={{
          background: "hsl(38 100% 52% / 0.06)",
          borderColor: "hsl(38 100% 52% / 0.25)",
        }}
      >
        <Coins size={15} style={{ color: "hsl(38 95% 60%)" }} className="shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">12% royalty tokenisée WMAX</span>
          {" "}— 7% platform fee + 5% engine fee (swarm autonome · live cash flow · secondary market Base L2).
          {" "}<span style={{ color: "hsl(38 95% 65%)" }}>Chaque deal ADA génère des tokens revendables.</span>
        </p>
      </div>

      {/* ── Royalty history table ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 px-5 rounded-2xl border border-dashed border-border">
          <Coins size={28} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground mb-1">Aucun deal ADA fermé pour l'instant</p>
          <p className="text-xs text-muted-foreground">Vos royalties WMAX apparaîtront ici dès qu'ADA fermera son premier deal autonome.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <div
              key={record.id}
              className="rounded-2xl border p-4 flex items-center gap-4 transition-all hover:border-primary/30"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            >
              {/* Status icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: record.minted
                    ? "hsl(152 62% 50% / 0.15)"
                    : "hsl(38 95% 52% / 0.12)",
                }}
              >
                {record.minted
                  ? <CheckCircle2 size={16} style={{ color: "hsl(152 62% 50%)" }} />
                  : <Coins size={16} style={{ color: "hsl(38 95% 60%)" }} />
                }
              </div>

              {/* Deal info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{record.target_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    Deal : <span className="text-foreground font-medium">{record.deal_amount.toLocaleString("fr-FR")} €</span>
                  </span>
                  <span className="text-xs" style={{ color: "hsl(38 95% 65%)" }}>
                    Royalty : <strong>{record.royalty_12pct.toLocaleString("fr-FR")} WMAX</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/60">
                    7% plateforme ({record.platform_fee_7pct.toLocaleString("fr-FR")} €) + 5% engine ({record.engine_fee_5pct.toLocaleString("fr-FR")} €)
                  </span>
                </div>
              </div>

              {/* Date */}
              <p className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
                {record.closed_at ? new Date(record.closed_at).toLocaleDateString("fr-FR") : "—"}
              </p>

              {/* Action */}
              {record.minted ? (
                record.tx_hash ? (
                  <a
                    href={`https://basescan.org/tx/${record.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs font-medium"
                    style={{ color: "hsl(152 62% 50%)" }}
                  >
                    <CheckCircle2 size={12} /> Minté <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(152 62% 50%)" }}>
                    <CheckCircle2 size={12} /> Minté
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
                    ? <><Loader2 size={11} className="animate-spin" /> Mint…</>
                    : <><Zap size={11} /> Minter</>
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {records.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Les tokens WMAX sont émis sur Base L2 · Revendables sur secondary market
        </p>
      )}
    </div>
  );
}
