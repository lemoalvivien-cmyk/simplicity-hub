/**
 * RGPDConsentBanner — Bandeau de consentement cookies conforme RGPD art. 6.1.a
 * Stocke le choix dans localStorage. N'utilise aucune dépendance externe.
 * Bloque trackEvent() tant que le consentement n'est pas accordé.
 */
import { useState, useEffect } from "react";
import { Shield, X, Check } from "lucide-react";

const CONSENT_KEY = "wiinupmax_cookie_consent";
const CONSENT_VERSION = "v1";

export type ConsentState = "accepted" | "refused" | null;

/** Lit le consentement depuis localStorage */
export function getConsentState(): ConsentState {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.state as ConsentState;
  } catch {
    return null;
  }
}

/** Vérifie si l'analytics est autorisé */
export function isAnalyticsAllowed(): boolean {
  return getConsentState() === "accepted";
}

/** Sauvegarde le consentement */
function saveConsent(state: "accepted" | "refused") {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ state, version: CONSENT_VERSION, ts: new Date().toISOString() })
    );
  } catch {
    // localStorage indisponible — fail silent
  }
}

export default function RGPDConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Afficher seulement si pas encore de choix
    const consent = getConsentState();
    if (!consent) {
      // Petit délai pour ne pas bloquer le LCP
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    saveConsent("accepted");
    setVisible(false);
    // Déclencher un event custom pour les modules analytics
    window.dispatchEvent(new CustomEvent("wiinup:consent", { detail: { state: "accepted" } }));
  };

  const handleRefuse = () => {
    saveConsent("refused");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("wiinup:consent", { detail: { state: "refused" } }));
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-[9999] md:bottom-4 md:left-4 md:right-auto md:max-w-sm animate-in slide-in-from-bottom-4 duration-300"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="rounded-t-2xl md:rounded-2xl border border-border p-5 shadow-2xl"
        style={{
          background: "hsl(var(--card))",
          boxShadow: "0 -4px 40px hsl(var(--primary) / 0.08), 0 20px 50px hsl(218 72% 5% / 0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              <Shield size={14} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <p className="text-sm font-bold text-foreground">Cookies & Confidentialité</p>
          </div>
          <button
            onClick={handleRefuse}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Fermer (refuser)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Copy */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-1">
          Nous utilisons des cookies d'analyse (Supabase Analytics) pour mesurer l'audience et améliorer
          notre service. Aucun cookie publicitaire. Vos données restent hébergées en France.
        </p>

        {/* Expandable details */}
        {expanded && (
          <div className="mt-2 mb-3 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p><strong className="text-foreground">Cookies essentiels</strong> — Authentification, session Stripe, CSRF. Toujours actifs.</p>
            <p><strong className="text-foreground">Cookies d'analyse</strong> — Suivi anonymisé des pages visitées et des clics CTA. Activés uniquement avec votre accord.</p>
            <p>
              Responsable : VLM Consulting · SIRET 835 125 089 000 28 ·{" "}
              <a href="/confidentialite" className="underline hover:text-foreground transition-colors">Politique de confidentialité</a>
            </p>
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors mb-3 block"
        >
          {expanded ? "Masquer les détails" : "En savoir plus"}
        </button>

        {/* CTA buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRefuse}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <Check size={12} />
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
