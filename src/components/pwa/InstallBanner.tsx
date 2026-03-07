import { useState, useEffect } from "react";
import { Smartphone, X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa_install_dismissed")) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    if (ios) {
      setTimeout(() => setVisible(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs z-50 animate-fade-in">
      <div
        className="rounded-2xl p-4 shadow-2xl border"
        style={{
          background: "hsl(218 72% 10% / 0.97)",
          border: "1px solid hsl(218 40% 30% / 0.4)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Smartphone size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold mb-0.5">Installer WIINUP MAX</p>
            <p className="text-white/50 text-xs leading-relaxed">
              {isIOS
                ? "Appuyez sur Partager → Sur l'écran d'accueil"
                : "Ajoutez l'app sur votre écran d'accueil"}
            </p>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Download size={12} />
                Installer l'app
              </button>
            )}
          </div>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white/70 transition-colors shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
