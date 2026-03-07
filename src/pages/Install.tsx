/**
 * Install — Page d'installation PWA premium
 * Mobile-first, native-feel, zéro bricolage
 */
import { useState, useEffect } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Smartphone, Download, Share, Plus, Chrome, Apple, CheckCircle2, Zap, Bell, WifiOff, Star } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Détecte si déjà installé
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|Edg/i.test(navigator.userAgent);

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Hero */}
        <div className="text-center py-6">
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-2xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Zap size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Installer WIINUP MAX
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Accédez à vos agents depuis votre écran d'accueil, comme une vraie app premium.
          </p>
        </div>

        {/* CTA Android direct (si API disponible) */}
        {deferredPrompt && !installed && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--gradient-primary)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Download size={22} className="text-white" />
              <div>
                <p className="font-semibold text-white">Installation en un clic</p>
                <p className="text-white/70 text-xs">Votre navigateur est prêt</p>
              </div>
            </div>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "white", color: "hsl(var(--primary))" }}
            >
              {installing ? "Installation…" : "Installer WIINUP MAX"}
            </button>
          </div>
        )}

        {/* Déjà installé */}
        {installed && (
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "hsl(var(--success-light))", border: "1px solid hsl(var(--success) / 0.3)" }}
          >
            <CheckCircle2 size={24} style={{ color: "hsl(var(--success))" }} />
            <div>
              <p className="font-semibold text-foreground">Application installée ✓</p>
              <p className="text-sm text-muted-foreground">WIINUP MAX est sur votre écran d'accueil.</p>
            </div>
          </div>
        )}

        {/* Instructions iOS */}
        {(isIOS || (!isAndroid && !deferredPrompt)) && (
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--muted))" }}>
                <Apple size={22} className="text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Sur iPhone (Safari)</h2>
                <p className="text-xs text-muted-foreground">iOS 16.4+ requis</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { n: "1", icon: Share, text: "Appuyez sur le bouton Partager en bas de Safari" },
                { n: "2", icon: Plus, text: 'Faites défiler et appuyez sur « Sur l\'écran d\'accueil »' },
                { n: "3", icon: Smartphone, text: '« Ajouter » — et voilà !' },
              ].map(({ n, icon: Icon, text }) => (
                <div key={n} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                    {n}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Icon size={14} className="text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Android / Chrome */}
        {(isAndroid || isChrome) && !deferredPrompt && (
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--muted))" }}>
                <Chrome size={22} className="text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Sur Android (Chrome)</h2>
                <p className="text-xs text-muted-foreground">Android 8+ recommandé</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { n: "1", text: "Ouvrez le menu ⋮ en haut à droite de Chrome" },
                { n: "2", text: '« Ajouter à l\'écran d\'accueil »' },
                { n: "3", text: '« Ajouter » — installation instantanée !' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                    {n}
                  </div>
                  <p className="text-sm text-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avantages */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-yellow-400" />
            <h3 className="font-semibold text-white">Pourquoi installer l'app ?</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: Zap, text: "Accès instantané depuis votre écran d'accueil" },
              { icon: Bell, text: "Notifications push pour vos validations urgentes" },
              { icon: WifiOff, text: "Fonctionne hors connexion pour la lecture" },
              { icon: Smartphone, text: "Expérience native — vos agents à portée de main" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.2)" }}
                >
                  <Icon size={14} className="text-white/70" />
                </div>
                <p className="text-white/65 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
