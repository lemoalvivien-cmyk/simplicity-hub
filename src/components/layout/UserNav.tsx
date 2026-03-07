import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Briefcase, Send, TrendingUp,
  HelpCircle, Menu, X, LogOut, Building2, Users,
  Zap, Activity, Layers, Brain, AlertTriangle,
  MessageSquare, Smartphone, SlidersHorizontal, Radar, Flag, Network,
  Moon, Share2, Upload, ChevronDown, Lock
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type UserRole = "entreprise" | "facilitateur";

interface UserNavProps {
  role?: UserRole;
  /** nombre d'introductions créées/reçues — déverrouille les briques avancées */
  introCount?: number;
}

/**
 * PROGRESSIVE DISCLOSURE
 * Niveau 0 (introCount < 1) : essentiel uniquement
 * Niveau 1 (introCount >= 1) : + Radar, Passive, OpenClaw disponibles
 * Les autres briques restent dans le menu mobile "Outils avancés"
 */
function useProgressLevel(introCount: number) {
  return introCount >= 1 ? 1 : 0;
}

export default function UserNav({ role = "facilitateur", introCount = 0 }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { pathname } = useLocation();
  const level = useProgressLevel(introCount);

  const dashboardPath = role === "entreprise" ? "/dashboard/entreprise" : "/dashboard/facilitateur";

  // ── NAVIGATION ESSENTIELLE (visible dès le départ) ──────
  const coreNavEntreprise = [
    { to: dashboardPath, label: "Accueil", icon: LayoutDashboard },
    { to: "/missions", label: "Missions", icon: Briefcase },
    { to: "/entreprise/introductions", label: "Introductions", icon: Send },
    { to: "/contacts", label: "Contacts", icon: Users },
  ];

  const coreNavFacilitateur = [
    { to: dashboardPath, label: "Accueil", icon: LayoutDashboard },
    { to: "/missions", label: "Missions", icon: Briefcase },
    { to: "/introductions", label: "Introductions", icon: Send },
    { to: "/gains", label: "Gains", icon: TrendingUp },
  ];

  const coreNav = role === "entreprise" ? coreNavEntreprise : coreNavFacilitateur;

  // ── NAVIGATION AVANCÉE (déverrouillée progressivement) ──
  const advancedNavEntreprise = [
    { to: "/pilotage", label: "Pilotage", icon: Activity },
    { to: "/studio", label: "Studio", icon: Layers },
    { to: "/campagnes", label: "Campagnes", icon: Layers },
    { to: "/actions", label: "À faire", icon: Zap },
    { to: "/radar", label: "Deal Radar", icon: Radar },
    { to: "/agents", label: "OpenClaw", icon: Brain },
    { to: "/validations", label: "Validations", icon: AlertTriangle },
    { to: "/reseau", label: "Réseau", icon: Network },
    { to: "/facilitateurs", label: "Facilitateurs", icon: Users },
    { to: "/trust", label: "Confiance", icon: AlertTriangle },
    { to: "/chaud", label: "Ce qui chauffe", icon: Zap },
    { to: "/offres/entreprise", label: "Mes offres", icon: Share2 },
    { to: "/canaux", label: "Canaux", icon: MessageSquare },
    { to: "/install", label: "App mobile", icon: Smartphone },
  ];

  const advancedNavFacilitateur = [
    { to: "/pilotage", label: "Pilotage", icon: Activity },
    { to: "/studio", label: "Studio", icon: Layers },
    { to: "/contacts", label: "Contacts", icon: Users },
    { to: "/campagnes", label: "Campagnes", icon: Layers },
    { to: "/actions", label: "À faire", icon: Zap },
    { to: "/passive", label: "Mode passif", icon: Moon },
    { to: "/offres", label: "Offres à partager", icon: Share2 },
    { to: "/chaud", label: "Ce qui chauffe", icon: Zap },
    { to: "/agents", label: "OpenClaw", icon: Brain },
    { to: "/trust", label: "Confiance", icon: AlertTriangle },
    { to: "/reseau", label: "Réseau", icon: Network },
    { to: "/import-reseau", label: "Importer réseau", icon: Upload },
    { to: "/canaux", label: "Canaux", icon: MessageSquare },
    { to: "/install", label: "App mobile", icon: Smartphone },
  ];

  const advancedNav = role === "entreprise" ? advancedNavEntreprise : advancedNavFacilitateur;

  return (
    <header className="sticky top-0 z-50 nav-glass">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to={dashboardPath} className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-electric)" }}>
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm tracking-tight hidden sm:block" style={{ color: "hsl(var(--foreground))" }}>
            WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
          </span>
        </Link>

        {/* Desktop nav — core items */}
        <nav className="hidden md:flex items-center gap-0.5">
          {coreNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} label={label} icon={Icon} pathname={pathname} />
          ))}

          <div className="w-px h-5 mx-1.5" style={{ background: "hsl(var(--border))" }} />

          {/* Pilotage dispo niveau 0 uniquement pour entreprise après première mission */}
          {role === "entreprise" && (
            <NavLink to="/pilotage" label="Pilotage" icon={Activity} pathname={pathname} />
          )}

          {/* Briques avancées visibles après niveau 1 */}
          {level >= 1 && (
            <>
              <NavLink to="/radar" label="Radar" icon={Radar} pathname={pathname} highlight />
              {role === "facilitateur" && (
                <NavLink to="/passive" label="Passif" icon={Moon} pathname={pathname} highlight />
              )}
              <NavLink to="/agents" label="OpenClaw" icon={Brain} pathname={pathname} openclaw />
            </>
          )}
        </nav>

        {/* Badge rôle + actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{
            background: role === "entreprise" ? "hsl(218 72% 18% / 0.08)" : "hsl(24 100% 52% / 0.1)",
            color: role === "entreprise" ? "hsl(var(--primary))" : "hsl(24 80% 38%)",
            borderColor: role === "entreprise" ? "hsl(218 72% 18% / 0.15)" : "hsl(24 100% 52% / 0.2)",
          }}>
            {role === "entreprise" ? "Entreprise" : "Apporteur"}
          </span>
          <LanguageSwitcher compact />
          <Link to="/help" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <HelpCircle size={15} />
          </Link>
          <Link to="/login" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <LogOut size={15} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">

            {/* Core nav */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
              Essentiel
            </p>
            {coreNav.map(({ to, label, icon: Icon }) => (
              <MobileLink key={to} to={to} label={label} icon={Icon} pathname={pathname} setOpen={setOpen} />
            ))}
            {role === "entreprise" && (
              <MobileLink to="/pilotage" label="Pilotage" icon={Activity} pathname={pathname} setOpen={setOpen} />
            )}

            {/* Séparateur */}
            <div className="border-t border-border my-1" />

            {/* Outils avancés — accordion */}
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2">
                {level === 0 ? <Lock size={14} /> : <Zap size={14} />}
                Outils avancés {level === 0 && <span className="text-xs opacity-60">— après votre première intro</span>}
              </span>
              <ChevronDown size={15} className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>

            {advancedOpen && (
              <div className={`space-y-0.5 ${level === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                {advancedNav.map(({ to, label, icon: Icon }) => (
                  <MobileLink key={to} to={to} label={label} icon={Icon} pathname={pathname} setOpen={setOpen} />
                ))}
              </div>
            )}

            {/* Compte */}
            <div className="border-t border-border pt-2">
              <MobileLink to="/help" label="Aide" icon={HelpCircle} pathname={pathname} setOpen={setOpen} />
              <MobileLink to="/signalement" label="Signaler" icon={Flag} pathname={pathname} setOpen={setOpen} />
              {role === "entreprise" ? (
                <MobileLink to="/profil/entreprise" label="Mon profil" icon={Building2} pathname={pathname} setOpen={setOpen} />
              ) : (
                <MobileLink to="/profil/facilitateur" label="Mon profil" icon={Users} pathname={pathname} setOpen={setOpen} />
              )}
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

// ── Sub-components ────────────────────────────────────────

function MobileLink({ to, label, icon: Icon, pathname, setOpen }: {
  to: string; label: string; icon: React.ElementType;
  pathname: string; setOpen: (v: boolean) => void;
}) {
  const isActive = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon size={16} /> {label}
    </Link>
  );
}

function NavLink({
  to, label, icon: Icon, pathname, highlight, openclaw,
}: { to: string; label: string; icon: React.ElementType; pathname: string; highlight?: boolean; openclaw?: boolean }) {
  const isActive = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? openclaw ? "shadow-sm text-white" : "bg-primary text-primary-foreground shadow-sm"
          : highlight ? "text-primary bg-secondary hover:bg-primary hover:text-primary-foreground"
          : openclaw ? "hover:opacity-80"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      style={openclaw ? {
        background: isActive ? "var(--gradient-primary)" : "hsl(var(--secondary))",
        color: isActive ? "white" : "hsl(var(--primary))",
      } : undefined}
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}
