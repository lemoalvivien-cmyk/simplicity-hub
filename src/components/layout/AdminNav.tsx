import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, Tag, CreditCard, HelpCircle,
  BarChart2, Menu, X, LogOut, Shield, Zap, TrendingUp, Rocket, Activity, Brain,
} from "lucide-react";

// AUDIT 16/03/2026 – BLOQUANTS LEVÉS
// Liens morts supprimés : payout-ops, reactivation, analytics, env-check, go-live, operations, help
// Seules les 5 routes admin vérifiées et actives sont conservées.
const links = [
  { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/promo-codes", label: "Codes promo", icon: Tag },
  { to: "/admin/payments", label: "Paiements", icon: CreditCard },
  { to: "/admin/revenue", label: "Revenu réel", icon: TrendingUp },
];

export default function AdminNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-sidebar-foreground">
            WIINUP <span style={{ color: "hsl(var(--sidebar-primary))" }}>MAX</span>
          </span>
        </div>

        {/* Badge admin */}
        <div className="px-5 pt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
            <Shield size={11} /> Admin
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 pt-4 flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "sidebar-item-active"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 border-t border-sidebar-border pt-4">
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut size={17} />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-50 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Zap size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-sm text-sidebar-foreground">
              WIINUP <span style={{ color: "hsl(var(--sidebar-primary))" }}>MAX</span>
            </span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="bg-sidebar border-t border-sidebar-border animate-fade-in">
            <div className="px-3 py-3 flex flex-col gap-1">
              {links.map(({ to, label, icon: Icon }) => {
                const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "sidebar-item-active"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
