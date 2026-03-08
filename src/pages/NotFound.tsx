import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Silent — no console pollution in production
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--gradient-electric)" }}
        >
          <span className="font-display font-bold text-2xl text-white">?</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Page introuvable
        </h1>
        <p className="text-muted-foreground text-sm mb-7">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary text-sm px-6 py-3 gap-2">
            <Home size={15} /> Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={15} /> Retour
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
