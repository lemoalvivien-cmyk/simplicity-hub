import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const links = [
    { to: "/#comment-ca-marche", label: "Comment ça marche", hash: true },
    { to: "/pricing", label: "Tarifs" },
  ];

  return (
    <header className="sticky top-0 z-50 nav-glass">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gradient-electric)" }}
          >
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            WIINUP <span style={{ color: "hsl(var(--accent))" }}>MAX</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navigation principale">
          {links.map(({ to, label }) => (
            <a
              key={to}
              href={to}
              className={`text-sm font-medium transition-colors ${
                pathname === to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </a>
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
            Lancer ma première mission →
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4 flex flex-col gap-1">
            {links.map(({ to, label }) => (
              <a
                key={to}
                href={to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="pt-3 mt-1 border-t border-border flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-muted-foreground"
              >
                Connexion
              </Link>
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="btn-cta text-sm text-center"
              >
                Lancer ma première mission →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** Compact legal footer */
export function LegalFooter() {
  return (
    <footer className="border-t border-border bg-background/50 py-6">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} VLM Consulting — SIRET 83512508900028</span>
        <nav className="flex items-center gap-4" aria-label="Liens légaux">
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
        </nav>
      </div>
    </footer>
  );
}
