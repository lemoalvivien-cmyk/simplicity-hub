import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Briefcase, Send, TrendingUp,
  HelpCircle, Menu, X, LogOut, Building2, Users,
  Play, Zap, Activity, Layers, Target
} from "lucide-react";

type UserRole = "entreprise" | "facilitateur";

interface UserNavProps {
  role?: UserRole;
}

export default function UserNav({ role = "facilitateur" }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const dashboardPath = role === "entreprise" ? "/dashboard/entreprise" : "/dashboard/facilitateur";

  const mobileGroups =
    role === "entreprise"
      ? [
          {
            label: "Pilotage",
            items: [
              { to: "/pilotage", label: "Pilotage", icon: Activity },
              { to: "/opportunites", label: "Opportunités", icon: Target },
            ],
          },
          {
            label: "Studio",
            items: [
              { to: "/studio", label: "Studio", icon: Layers },
              { to: "/campagnes", label: "Campagnes", icon: Play },
              { to: "/contacts", label: "Contacts", icon: Users },
              { to: "/actions", label: "À faire", icon: Zap },
            ],
          },
          {
            label: "Apport d'affaires",
            items: [
              { to: "/missions", label: "Missions", icon: Briefcase },
              { to: "/entreprise/introductions", label: "Introductions", icon: Send },
            ],
          },
          {
            label: "Compte",
            items: [
              { to: "/help", label: "Aide", icon: HelpCircle },
              { to: "/profil/entreprise", label: "Mon profil", icon: Building2 },
            ],
          },
        ]
      : [
          {
            label: "Pilotage",
            items: [
              { to: "/pilotage", label: "Pilotage", icon: Activity },
              { to: "/opportunites", label: "Opportunités", icon: Target },
            ],
          },
          {
            label: "Studio",
            items: [
              { to: "/studio", label: "Studio", icon: Layers },
              { to: "/campagnes", label: "Campagnes", icon: Play },
              { to: "/contacts", label: "Contacts", icon: Users },
              { to: "/actions", label: "À faire", icon: Zap },
            ],
          },
          {
            label: "Apport d'affaires",
            items: [
              { to: "/missions", label: "Missions", icon: Briefcase },
              { to: "/introductions", label: "Introductions", icon: Send },
              { to: "/gains", label: "Mes gains", icon: TrendingUp },
            ],
          },
          {
            label: "Compte",
            items: [{ to: "/help", label: "Aide", icon: HelpCircle }],
          },
        ];

  return (
    <header className="sticky top-0 z-50 nav-glass">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-electric)" }}
          >
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm tracking-tight hidden sm:block" style={{ color: "hsl(var(--foreground))" }}>
            WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <NavLink to={dashboardPath} label="Accueil" icon={LayoutDashboard} pathname={pathname} />
          <NavLink to="/pilotage" label="Pilotage" icon={Activity} pathname={pathname} highlight />
          <NavLink to="/studio" label="Studio" icon={Layers} pathname={pathname} />

          <div className="w-px h-5 mx-1.5" style={{ background: "hsl(var(--border))" }} />

          {role === "entreprise" && (
            <>
              <NavLink to="/contacts" label="Contacts" icon={Users} pathname={pathname} />
              <NavLink to="/campagnes" label="Campagnes" icon={Play} pathname={pathname} />
              <NavLink to="/actions" label="À faire" icon={Zap} pathname={pathname} />
              <div className="w-px h-5 mx-1.5" style={{ background: "hsl(var(--border))" }} />
              <NavLink to="/missions" label="Missions" icon={Briefcase} pathname={pathname} />
              <NavLink to="/entreprise/introductions" label="Introductions" icon={Send} pathname={pathname} />
            </>
          )}
          {role === "facilitateur" && (
            <>
              <NavLink to="/missions" label="Missions" icon={Briefcase} pathname={pathname} />
              <NavLink to="/introductions" label="Introductions" icon={Send} pathname={pathname} />
              <NavLink to="/gains" label="Gains" icon={TrendingUp} pathname={pathname} />
              <div className="w-px h-5 mx-1.5" style={{ background: "hsl(var(--border))" }} />
              <NavLink to="/contacts" label="Contacts" icon={Users} pathname={pathname} />
              <NavLink to="/campagnes" label="Campagnes" icon={Play} pathname={pathname} />
              <NavLink to="/actions" label="À faire" icon={Zap} pathname={pathname} />
            </>
          )}
        </nav>

        {/* Badge rôle + actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{
              background: role === "entreprise" ? "hsl(218 72% 18% / 0.08)" : "hsl(24 100% 52% / 0.1)",
              color: role === "entreprise" ? "hsl(var(--primary))" : "hsl(24 80% 38%)",
              borderColor: role === "entreprise" ? "hsl(218 72% 18% / 0.15)" : "hsl(24 100% 52% / 0.2)",
            }}
          >
            {role === "entreprise" ? "Entreprise" : "Apporteur"}
          </span>
          <Link to="/help" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <HelpCircle size={15} />
          </Link>
          <Link to="/login" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
          <div className="container py-4 flex flex-col gap-3">
            <Link
              to={dashboardPath}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === dashboardPath
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <LayoutDashboard size={16} /> Accueil
            </Link>

            {mobileGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon }) => (
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
                      <Icon size={16} /> {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-border pt-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut size={16} /> Déconnexion
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  to, label, icon: Icon, pathname, highlight,
}: { to: string; label: string; icon: React.ElementType; pathname: string; highlight?: boolean }) {
  const isActive = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : highlight
          ? "text-primary bg-secondary hover:bg-primary hover:text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}
