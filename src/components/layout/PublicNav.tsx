import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";

/**
 * Hash active state: uses IntersectionObserver to detect when
 * #comment-ca-marche is in viewport. Falls back to URL hash.
 * Pathname-based active state remains for /pricing and other routes.
 */
function useHashActive(sectionId: string): boolean {
  const { hash } = useLocation();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Sync with explicit URL hash on navigation
    if (hash === `#${sectionId}`) {
      setInView(true);
    } else if (hash && hash !== `#${sectionId}`) {
      setInView(false);
    }
  }, [hash, sectionId]);

  useEffect(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      // section is "active" when ≥30% visible
      { threshold: 0.3, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId]);

  return inView;
}

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const howItWorksActive = useHashActive("comment-ca-marche");

  const isActive = (to: string, isHash?: boolean): boolean => {
    if (isHash) return howItWorksActive;
    return pathname === to;
  };

  const links: { to: string; label: string; isHash?: boolean }[] = [
    { to: "/#comment-ca-marche", label: "Comment ça marche", isHash: true },
    { to: "/pricing", label: "Tarifs" },
    { to: "/a-propos", label: "À propos" },
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
          {links.map(({ to, label, isHash }) => (
            <a
              key={to}
              href={to}
              className={`text-sm font-medium transition-colors ${
                isActive(to, isHash)
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
          <Link to="/signup" className="btn-cta text-sm px-4 py-2">
            Commencer →
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
            {links.map(({ to, label, isHash }) => (
              <a
                key={to}
                href={to}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-sm font-medium transition-colors ${
                  isActive(to, isHash)
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                }`}
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
                to="/signup"
                onClick={() => setOpen(false)}
                className="btn-cta text-sm text-center"
              >
                Commencer →
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
      {/* pb-20 on mobile clears the sticky CTA bottom bar (~64px) */}
      <div className="pb-20 md:pb-0">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} VLM Consulting — SIRET 83512508900028</span>
          <nav className="flex items-center gap-4" aria-label="Liens légaux">
            <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">Confidentialité</Link>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">Mentions légales</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
