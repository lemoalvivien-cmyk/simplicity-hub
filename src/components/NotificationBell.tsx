/**
 * NotificationBell — Real-time OpenClaw activity feed
 * Badge rouge · Dropdown · Realtime · Son discret · Tout marquer comme lu
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Check, CheckCheck,
  Brain, Zap, Users, Star, Target, AlertTriangle,
  Sparkles, Send, TrendingUp, Shield, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ── Types ─────────────────────────────────────────── */
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

/* ── Type → icon/color config ───────────────────────── */
const TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
}> = {
  // Specified types
  brief_disponible:   { icon: Brain,         color: "hsl(218 72% 50%)",    bg: "hsl(218 72% 96%)" },
  action_requise:     { icon: Zap,           color: "hsl(24 100% 48%)",    bg: "hsl(24 100% 95%)" },
  introduction_recue: { icon: Users,         color: "hsl(152 62% 35%)",    bg: "hsl(152 62% 95%)" },
  gain_valide:        { icon: Star,          color: "hsl(43 96% 40%)",     bg: "hsl(43 96% 95%)" },
  mission_matchee:    { icon: Target,        color: "hsl(270 60% 50%)",    bg: "hsl(270 60% 96%)" },
  alerte_pipeline:    { icon: AlertTriangle, color: "hsl(0 72% 48%)",      bg: "hsl(0 72% 96%)" },
  // Legacy / openclaw internal aliases
  match_suggere:      { icon: Sparkles,      color: "hsl(270 60% 50%)",    bg: "hsl(270 60% 96%)" },
  intro_recue:        { icon: Send,          color: "hsl(152 62% 35%)",    bg: "hsl(152 62% 95%)" },
  openclaw_alert:     { icon: AlertTriangle, color: "hsl(0 72% 48%)",      bg: "hsl(0 72% 96%)" },
  radar_signal:       { icon: Activity,      color: "hsl(218 72% 50%)",    bg: "hsl(218 72% 96%)" },
  trust_update:       { icon: Shield,        color: "hsl(152 62% 35%)",    bg: "hsl(152 62% 95%)" },
  next_best_action:   { icon: Zap,           color: "hsl(24 100% 48%)",    bg: "hsl(24 100% 95%)" },
  facilitateur_match: { icon: Target,        color: "hsl(270 60% 50%)",    bg: "hsl(270 60% 96%)" },
};

const FALLBACK_CONFIG = { icon: Bell, color: "hsl(218 15% 50%)", bg: "hsl(218 15% 95%)" };

/* ── Relative time ─────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

/* ── Subtle click sound ─────────────────────────────── */
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // AudioContext may be blocked — silent fail
  }
}

/* ── Main component ─────────────────────────────────── */
export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]                   = useState(false);
  const panelRef                          = useRef<HTMLDivElement>(null);
  const isFirstLoad                       = useRef(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, href, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
  }, [user]);

  /* Initial load */
  useEffect(() => {
    load();
  }, [load]);

  /* Realtime subscription */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-bell-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as Notification;
        // Prepend and keep only 10
        setNotifications(prev => [newNotif, ...prev].slice(0, 10));
        // Don't play sound on initial page load flush
        if (!isFirstLoad.current) {
          playNotifSound();
        }
        isFirstLoad.current = false;
      })
      .subscribe();

    // After a brief delay, mark first-load as done
    const timer = setTimeout(() => { isFirstLoad.current = false; }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timer);
    };
  }, [user]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell button ──────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}>
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-in fade-in zoom-in-50 duration-200"
            style={{ background: "hsl(var(--destructive))" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ───────────────────────────── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl border border-border bg-card z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ boxShadow: "0 20px 50px -10px hsl(var(--primary) / 0.15)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: "hsl(var(--destructive))" }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <CheckCheck size={12} /> Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-muted">
                  <Bell size={18} className="text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Tout est calme</p>
                <p className="text-xs text-muted-foreground">
                  Les activités d'OpenClaw apparaîtront ici
                </p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
                const Icon = cfg.icon;
                const content = (
                  <>
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.bg, opacity: n.read ? 0.6 : 1 }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 pr-5">
                      <p className={`text-xs font-semibold truncate ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </>
                );

                return (
                  <div
                    key={n.id}
                    className={`relative ${!n.read ? "bg-primary/[0.04]" : ""}`}>
                    {n.href ? (
                      <Link
                        to={n.href}
                        onClick={() => { markRead(n.id); setOpen(false); }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors">
                        {content}
                      </Link>
                    ) : (
                      <div
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => markRead(n.id)}>
                        {content}
                      </div>
                    )}

                    {/* Mark read button */}
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Marquer comme lu">
                        <Check size={11} />
                      </button>
                    )}

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <span
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ background: cfg.color }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Activité OpenClaw en temps réel
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
