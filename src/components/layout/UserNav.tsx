import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Briefcase, Send, TrendingUp, User,
  HelpCircle, Menu, X, LogOut, Building2, Users
} from "lucide-react";

type UserRole = "entreprise" | "facilitateur";

interface UserNavProps {
  role?: UserRole;
}

export default function UserNav({ role = "facilitateur" }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const dashboardPath = role === "entreprise" ? "/dashboard/entreprise" : "/dashboard/facilitateur";

  const linksEntreprise = [
    { to: dashboardPath, label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/missions", label: "Mes missions", icon: Briefcase },
    { to: "/introductions", label: "Introductions", icon: Send },
    { to: "/profil/entreprise", label: "Mon profil", icon: Building2 },
    { to: "/help", label: "Aide", icon: HelpCircle },
  ];

  const linksFacilitateur = [
    { to: dashboardPath, label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/missions", label: "Missions", icon: Briefcase },
    { to: "/introductions", label: "Mes introductions", icon: Send },
    { to: "/gains", label: "Mes gains", icon: TrendingUp },
    { to: "/profil/facilitateur", label: "Mon profil", icon: Users },
    { to: "/help", label: "Aide", icon: HelpCircle },
  ];

  const links = role === "entreprise" ? linksEntreprise : linksFacilitateur;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">W</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground">Wiinup</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop — role badge + logout */}
        <div className="hidden md:flex items-center gap-2">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: role === "entreprise" ? "hsl(var(--secondary))" : "hsl(var(--accent-light))",
              color: role === "entreprise" ? "hsl(var(--primary))" : "hsl(38 80% 30%)",
            }}
          >
            {role === "entreprise" ? "Entreprise" : "Apporteur"}
          </span>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
          >
            <LogOut size={15} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut size={16} />
                Déconnexion
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
