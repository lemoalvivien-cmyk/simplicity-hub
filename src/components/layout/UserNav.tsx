/**
 * UserNav — Sidebar desktop + bottom bar mobile
 * Desktop: fixed left sidebar avec groupes visuels
 * Mobile: fixed bottom bar (4 icons) + slide-up sheet groupé
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Briefcase, Send, TrendingUp, Users,
  Zap, Activity, Sparkles, HelpCircle, LogOut, Menu, X,
  UserCircle, CreditCard, Tag, Shield, Plus, Network,
  BookOpen, Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";

/* ── Types ─────────────────────────────────────────── */
type AppRole = "entreprise" | "facilitateur" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeLabel?: string; // e.g. "Nouveau"
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface UserNavProps {
  role?: AppRole;
}

/* ── Badge counter hook ─────────────────────────────── */
function useBadges(role: AppRole, userId: string | undefined) {
  const [pendingIntros, setPendingIntros] = useState(0);
  const [urgentActions, setUrgentActions] = useState(0);
  const [pendingGains, setPendingGains]   = useState(0);
  const [myIntros, setMyIntros]           = useState(0);

  useEffect(() => {
    if (!userId) return;
    if (role === "entreprise") {
      db.from("introductions")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setPendingIntros(count || 0));
      db.from("lead_actions")
        .select("id", { count: "exact", head: true })
        .eq("actor_user_id", userId)
        .eq("status", "open")
        .eq("priority", "haute")
        .then(({ count }) => setUrgentActions(count || 0));
    } else if (role === "facilitateur") {
      db.from("introductions")
        .select("id", { count: "exact", head: true })
        .eq("facilitateur_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setMyIntros(count || 0));
      db.from("gains")
        .select("id", { count: "exact", head: true })
        .eq("facilitateur_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setPendingGains(count || 0));
    }
  }, [userId, role]);

  return { pendingIntros, urgentActions, pendingGains, myIntros };
}

/* ── Gateway readiness hook ─────────────────────────── */
function useGatewayReady(userId: string | undefined) {
  const [gatewayReady, setGatewayReady] = useState(false);
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("openclaw_config")
      .select("gateway_url, is_connected")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setGatewayReady(!!data?.gateway_url && data.is_connected === true);
      });
  }, [userId]);
  return gatewayReady;
}

/* ── Nav definitions ────────────────────────────────── */
function buildEntrepriseGroups(badges: ReturnType<typeof useBadges>, gatewayReady: boolean): NavGroup[] {
  const accueilItems: NavItem[] = [
    { to: "/dashboard/entreprise", label: "Tableau de bord", icon: LayoutDashboard },
  ];
  if (gatewayReady) {
    accueilItems.push({ to: "/pilotage", label: "Mon IA", icon: Activity, badgeLabel: badges.urgentActions > 0 ? "Nouveau" : undefined });
  }
  return [
    {
      label: "Accueil",
      items: accueilItems,
    },
    {
      label: "Mon assistant IA",
      items: [
        { to: "/ada",       label: "Mon assistant IA",    icon: Sparkles, badgeLabel: "Live" },
        { to: "/ada/model", label: "Précision IA",         icon: Activity },
      ],
    },
    {
      label: "Missions",
      items: [
        { to: "/missions",                   label: "Mes missions",         icon: Briefcase },
        { to: "/missions/nouvelle",          label: "Nouvelle mission",     icon: Plus },
        { to: "/entreprise/introductions",   label: "Introductions reçues", icon: Send, badge: badges.pendingIntros || undefined },
      ],
    },
    {
      label: "Réseau",
      items: [
        { to: "/contacts",     label: "Contacts",     icon: Users },
        { to: "/facilitateurs",label: "Facilitateurs",icon: Network },
        { to: "/gains",        label: "Mes gains",    icon: TrendingUp },
      ],
    },
    {
      label: "Mon compte",
      items: [
        { to: "/profil/entreprise", label: "Mon profil",     icon: UserCircle },
        { to: "/help",              label: "Aide",           icon: HelpCircle },
        { to: "/account",           label: "Mon abonnement", icon: Settings },
      ],
    },
  ];
}

function buildFacilitateurGroups(badges: ReturnType<typeof useBadges>): NavGroup[] {
  return [
    {
      label: "Accueil",
      items: [
        { to: "/dashboard/facilitateur", label: "Tableau de bord", icon: LayoutDashboard },
      ],
    },
    {
      label: "Opportunités",
      items: [
        { to: "/missions",      label: "Missions disponibles", icon: Briefcase },
        { to: "/introductions", label: "Mes introductions",    icon: Send, badge: badges.myIntros || undefined },
      ],
    },
    {
      label: "Mes gains",
      items: [
        { to: "/gains", label: "Suivi des gains", icon: TrendingUp, badge: badges.pendingGains || undefined },
      ],
    },
    {
      label: "Mon compte",
      items: [
        { to: "/profil/facilitateur", label: "Mon profil", icon: UserCircle },
        { to: "/help",                label: "Aide",       icon: HelpCircle },
      ],
    },
  ];
}

const adminGroups: NavGroup[] = [
  {
    label: "Admin",
    items: [
      { to: "/admin",             label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/admin/users",       label: "Utilisateurs",    icon: Users },
      { to: "/admin/payments",    label: "Paiements",       icon: CreditCard },
      { to: "/admin/promo-codes", label: "Codes promo",     icon: Tag },
    ],
  },
];

/* ── Main component ─────────────────────────────────── */
export default function UserNav({ role: roleProp }: UserNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();

  const role: AppRole =
    roleProp ??
    (profile?.role === "entreprise" ? "entreprise"
     : profile?.role === "admin"    ? "admin"
     : "facilitateur");

  const badges = useBadges(role, user?.id);
  const gatewayReady = useGatewayReady(role === "entreprise" ? user?.id : undefined);

  const groups =
    role === "admin"        ? adminGroups :
    role === "entreprise"   ? buildEntrepriseGroups(badges, gatewayReady) :
    buildFacilitateurGroups(badges);

  // Flatten for mobile bottom bar
  const allItems = groups.flatMap(g => g.items);
  const bottomBarItems = allItems.slice(0, 4);
  const overflowGroups = (() => {
    const shown = new Set(bottomBarItems.map(i => i.to));
    return groups
      .map(g => ({ ...g, items: g.items.filter(i => !shown.has(i.to)) }))
      .filter(g => g.items.length > 0);
  })();

  const dashboardPath =
    role === "admin"      ? "/admin" :
    role === "entreprise" ? "/dashboard/entreprise" :
    "/dashboard/facilitateur";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
    setMobileOpen(false);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP — fixed left sidebar
      ═══════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 z-50 border-r border-border overflow-y-auto"
        style={{ background: "hsl(var(--card))" }}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <Link to={dashboardPath} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-electric)" }}>
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-foreground">
              WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
            </span>
          </Link>

          {/* Role + notification */}
          <div className="flex items-center justify-between mt-3">
            {role !== "admin" ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background: role === "entreprise" ? "hsl(218 72% 18% / 0.08)" : "hsl(24 100% 52% / 0.1)",
                  color: role === "entreprise" ? "hsl(var(--primary))" : "hsl(24 80% 38%)",
                  borderColor: role === "entreprise" ? "hsl(218 72% 18% / 0.15)" : "hsl(24 100% 52% / 0.2)",
                }}>
                {role === "entreprise" ? "Entreprise" : "Apporteur"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                <Shield size={9} /> Admin
              </span>
            )}
            <NotificationBell />
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.to}>
                    <SidebarLink item={item} pathname={pathname} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-border shrink-0">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE — fixed bottom bar
      ═══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border"
        style={{ background: "hsl(var(--card))", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16">
          {bottomBarItems.map(item => (
            <MobileBottomItem key={item.to} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
          ))}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
              mobileOpen ? "text-primary" : "text-muted-foreground"
            }`}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="text-[10px]">Plus</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          MOBILE — slide-up sheet groupé
      ═══════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 inset-x-0 rounded-t-2xl border-t border-border animate-fade-in"
            style={{ background: "hsl(var(--card))" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-4 pb-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {overflowGroups.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 mb-1.5 mt-1">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <MobileSheetLink
                        key={item.to}
                        item={item}
                        pathname={pathname}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-border pt-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function BadgeDot({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
      style={{ background: "hsl(var(--accent))" }}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
      style={{ background: "hsl(var(--accent))" }}>
      {label}
    </span>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}>
      <item.icon size={14} className="shrink-0" />
      <span className="truncate">{item.label}</span>
      {!!item.badge && (
        <span className="ml-auto min-w-[18px] h-[18px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
          style={{ background: "hsl(var(--accent))" }}>
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
      {item.badgeLabel && !item.badge && <BadgePill label={item.badgeLabel} />}
    </Link>
  );
}

function MobileBottomItem({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick: () => void }) {
  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}>
      <div className="relative">
        <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
        {!!item.badge && <BadgeDot count={item.badge} />}
      </div>
      <span className="text-[10px] font-medium leading-none">{item.label}</span>
      {isActive && (
        <span className="absolute top-0 inset-x-2 h-0.5 rounded-full"
          style={{ background: "hsl(var(--primary))" }} />
      )}
    </Link>
  );
}

function MobileSheetLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick: () => void }) {
  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      }`}>
      <span className="flex items-center gap-3">
        <item.icon size={16} />
        {item.label}
      </span>
      <span className="flex items-center gap-1.5">
        {!!item.badge && (
          <span className="min-w-[20px] h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center text-white"
            style={{ background: "hsl(var(--accent))" }}>
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
        {item.badgeLabel && !item.badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: "hsl(var(--accent))" }}>
            {item.badgeLabel}
          </span>
        )}
      </span>
    </Link>
  );
}
