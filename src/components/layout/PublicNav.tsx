import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Accueil" },
    { to: "/pricing", label: "Tarifs" },
  ];

  return (
    <header className="sticky top-0 z-50 nav-glass">
      <div className="container flex items-center justify-between h-16">
        {/* Logo WIINUP MAX */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-electric)" }}
          >
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-base tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors ${
                pathname === to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Connexion
          </Link>
          <Link to="/pricing" className="btn-cta text-sm px-4 py-2">
            Démarrer gratuitement →
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
          <div className="container py-4 flex flex-col gap-2">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-foreground"
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-muted-foreground"
              >
                Connexion
              </Link>
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="btn-cta text-sm text-center"
              >
                Démarrer gratuitement →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
