/**
 * NotFound — 404 page with clean design and back-to-dashboard CTA
 */
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 — Page introuvable — WiinupMax";
    return () => { document.title = "WiinupMax"; };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {/* Illustration */}
        <div className="relative inline-block mb-8">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 55% 14%))", border: "1px solid hsl(218 40% 22% / 0.6)" }}
          >
            <SearchX size={36} className="text-primary/60" />
          </div>
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            404
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Page introuvable
        </h1>
        <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <p className="text-xs text-muted-foreground/60 font-mono mb-8">
          {location.pathname}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-cta text-sm px-6 py-3 flex items-center gap-2 justify-center">
            <Home size={14} /> Mon dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>

        <Link to="/" className="block mt-5 text-xs text-muted-foreground hover:text-primary transition-colors">
          Retour à l'accueil →
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
