/**
 * UserNav — MVP navigation by role
 * Desktop: sticky top bar
 * Mobile: fixed bottom bar (5 icons max) + slide-up overflow sheet
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Briefcase, Send, TrendingUp, Users,
  Zap, Activity, Sparkles, HelpCircle, LogOut, Menu, X,
  UserCircle, CreditCard, Tag, Shield, ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

/* ── Types ─────────────────────────────────────────── */
type AppRole = "entreprise" | "facilitateur" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface UserNavProps {
  role?: AppRole;
}

/* ── Badge counter hook ─────────────────────────────── */
function useBadges(role: AppRole, userId: string | undefined) {
  const [pendingIntros, setPendingIntros]   = useState(0);
  const [urgentActions, setUrgentActions]   = useState(0);
  const [pendingGains, setPendingGains]     = useState(0);
  const [myIntros, setMyIntros]             = useState(0);

  useEffect(() => {
    if (!userId) return;
    if (role === "entreprise") {
      // introductions en attente côté entreprise
      db.from("introductions")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setPendingIntros(count || 0));
      // actions urgentes
      db.from("lead_actions")
        .select("id", { count: "exact", head: true })
        .eq("actor_user_id", userId)
        .eq("status", "open")
        .eq("priority", "haute")
        .then(({ count }) => setUrgentActions(count || 0));
    } else if (role === "facilitateur") {
      // mes introductions en attente
      db.from("introductions")
        .select("id", { count: "exact", head: true })
        .eq("facilitateur_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setMyIntros(count || 0));
      // gains en attente
      db.from("gains")
        .select("id", { count: "exact", head: true })
        .eq("facilitateur_id", userId)
        .eq("statut", "en_attente")
        .then(({ count }) => setPendingGains(count || 0));
    }
  }, [userId, role]);

  return { pendingIntros, urgentActions, pendingGains, myIntros };
}

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

  const { pendingIntros, urgentActions, pendingGains, myIntros } = useBadges(role, user?.id);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
    setMobileOpen(false);
  };

  /* ── ADMIN nav ──────────────────────────────────────── */
  const adminNav: NavItem[] = [
    { to: "/admin",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/users",        label: "Utilisateurs",    icon: Users },
    { to: "/admin/payments",     label: "Paiements",       icon: CreditCard },
    { to: "/admin/promo-codes",  label: "Codes promo",     icon: Tag },
  ];

  /* ── ENTREPRISE nav ─────────────────────────────────── */
  const entrepriseNav: NavItem[] = [
    { to: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
    { to: "/missions",     label: "Missions",      icon: Briefcase,     badge: pendingIntros || undefined },
    { to: "/contacts",     label: "Contacts",      icon: Users },
    { to: "/actions",      label: "Actions",       icon: Zap,           badge: urgentActions || undefined },
    { to: "/facilitateurs",label: "Facilitateurs", icon: UserCircle },
    { to: "/pilotage",     label: "Pilotage",      icon: Activity },
    { to: "/assistant",    label: "Assistant",     icon: Sparkles },
  ];

  /* ── FACILITATEUR nav ───────────────────────────────── */
  const facilitateurNav: NavItem[] = [
    { to: "/dashboard",      label: "Dashboard",            icon: LayoutDashboard },
    { to: "/missions",       label: "Missions dispo",       icon: Briefcase },
    { to: "/introductions",  label: "Introductions",        icon: Send,         badge: myIntros || undefined },
    { to: "/gains",          label: "Gains",                icon: TrendingUp,   badge: pendingGains || undefined },
    { to: "/assistant",      label: "Assistant",            icon: Sparkles },
  ];

  /* ── Common bottom items ────────────────────────────── */
  const commonNav: NavItem[] = [
    { to: "/account", label: "Mon compte", icon: UserCircle },
    { to: "/help",    label: "Aide",       icon: HelpCircle },
  ];

  const primaryNav =
    role === "admin" ? adminNav :
    role === "entreprise" ? entrepriseNav :
    facilitateurNav;

  // Mobile bottom bar: first 4 primary + overflow toggle
  const bottomBarItems = primaryNav.slice(0, 4);
  const overflowItems  = [...primaryNav.slice(4), ...commonNav];

  const dashboardPath =
    role === "admin" ? "/admin" :
    role === "entreprise" ? "/dashboard" :
    "/dashboard";

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP — sticky top bar
      ═══════════════════════════════════════════ */}
      <header className="hidden md:block sticky top-0 z-50 nav-glass">
        <div className="container flex items-center justify-between h-14">

          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-electric)" }}>
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-foreground">
              WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="flex items-center gap-0.5">
            {primaryNav.map(item => (
              <DesktopNavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* Right utilities */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Role badge */}
            {role !== "admin" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background: role === "entreprise" ? "hsl(218 72% 18% / 0.08)" : "hsl(24 100% 52% / 0.1)",
                  color: role === "entreprise" ? "hsl(var(--primary))" : "hsl(24 80% 38%)",
                  borderColor: role === "entreprise" ? "hsl(218 72% 18% / 0.15)" : "hsl(24 100% 52% / 0.2)",
                }}>
                {role === "entreprise" ? "Entreprise" : "Apporteur"}
              </span>
            )}
            {role === "admin" && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                <Shield size={10} /> Admin
              </span>
            )}

            <NotificationBell />

            {/* Common links */}
            {commonNav.map(item => (
              <DesktopIconLink key={item.to} item={item} pathname={pathname} />
            ))}

            <button
              onClick={handleSignOut}
              title="Déconnexion"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE — fixed bottom bar
      ═══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border"
        style={{ background: "hsl(var(--card))", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch h-16">
          {bottomBarItems.map(item => (
            <MobileBottomItem key={item.to} item={item} pathname={pathname} onClick={() => setMobileOpen(false)} />
          ))}

          {/* More button */}
          {overflowItems.length > 0 && (
            <button
              onClick={() => setMobileOpen(v => !v)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                mobileOpen ? "text-primary" : "text-muted-foreground"
              }`}>
              {mobileOpen
                ? <X size={20} />
                : <Menu size={20} />}
              <span className="text-[10px]">Plus</span>
            </button>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          MOBILE — slide-up overflow sheet
      ═══════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="absolute bottom-16 inset-x-0 rounded-t-2xl border-t border-border animate-fade-in"
            style={{ background: "hsl(var(--card))" }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
              {/* Overflow nav items */}
              {overflowItems.map(item => (
                <MobileSheetLink
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  onClick={() => setMobileOpen(false)}
                />
              ))}

              {/* Separator + sign out */}
              <div className="border-t border-border pt-2 mt-2">
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

function DesktopNavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to + "/"));
  return (
    <Link
      to={item.to}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}>
      <item.icon size={13} />
      {item.label}
      {!!item.badge && <BadgeDot count={item.badge} />}
    </Link>
  );
}

function DesktopIconLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.to;
  return (
    <Link
      to={item.to}
      title={item.label}
      className={`relative p-2 rounded-lg transition-colors ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}>
      <item.icon size={15} />
      {!!item.badge && <BadgeDot count={item.badge} />}
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
      {!!item.badge && (
        <span className="min-w-[20px] h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center text-white"
          style={{ background: "hsl(var(--accent))" }}>
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}
