import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, Sparkles, Zap, TrendingUp, Send, AlertCircle, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  match_suggere:    { icon: Sparkles,    color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))" },
  action_requise:   { icon: Zap,         color: "hsl(38 80% 40%)",              bg: "hsl(38 80% 96%)" },
  intro_recue:      { icon: Send,        color: "hsl(var(--success))",          bg: "hsl(var(--success-light))" },
  gain_valide:      { icon: TrendingUp,  color: "hsl(142 71% 32%)",             bg: "hsl(142 71% 95%)" },
  brief_disponible: { icon: Brain,       color: "hsl(258 72% 55%)",             bg: "hsl(258 72% 96%)" },
  openclaw_alert:   { icon: AlertCircle, color: "hsl(var(--destructive))",      bg: "hsl(0 72% 97%)" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
  };

  useEffect(() => {
    load();
    // Real-time subscription
    if (!user) return;
    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close on outside click
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
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: "hsl(var(--destructive))" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl border border-border bg-card z-50 overflow-hidden"
          style={{ boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck size={12} /> Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = typeConfig[n.type] ?? typeConfig.action_requise;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className={`relative ${!n.read ? "bg-primary/5" : ""}`}>
                    {n.href ? (
                      <Link
                        to={n.href}
                        onClick={() => { markRead(n.id); setOpen(false); }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
                      >
                        <NotifIcon Icon={Icon} cfg={cfg} read={n.read} />
                        <NotifBody n={n} />
                      </Link>
                    ) : (
                      <div
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => markRead(n.id)}
                      >
                        <NotifIcon Icon={Icon} cfg={cfg} read={n.read} />
                        <NotifBody n={n} />
                      </div>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="absolute top-3 right-3 p-1 rounded text-muted-foreground hover:text-foreground"
                        title="Marquer comme lu"
                      >
                        <Check size={11} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifIcon({ Icon, cfg, read }: { Icon: React.ElementType; cfg: { color: string; bg: string }; read: boolean }) {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
      style={{ background: cfg.bg, opacity: read ? 0.6 : 1 }}
    >
      <Icon size={14} style={{ color: cfg.color }} />
    </div>
  );
}

function NotifBody({ n }: { n: Notification }) {
  return (
    <div className="flex-1 min-w-0 pr-4">
      <p className={`text-xs font-semibold truncate ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
        {n.title}
      </p>
      {n.body && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-1 opacity-60">{timeAgo(n.created_at)}</p>
    </div>
  );
}
