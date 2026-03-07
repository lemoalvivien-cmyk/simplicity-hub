import UserLayout from "@/components/layout/UserLayout";
import { Smartphone, Download, Share, Plus, Chrome, Apple } from "lucide-react";

export default function Install() {
  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center py-6">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl shadow-2xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            🚀
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Installer WIINUP MAX
          </h1>
          <p className="text-muted-foreground">
            Accédez à vos agents depuis votre écran d'accueil, comme une vraie app.
          </p>
        </div>

        {/* iPhone */}
        <div className="card-surface p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl" style={{ background: "hsl(var(--muted))" }}>
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
              { n: "2", icon: Plus, text: "Faites défiler et appuyez sur « Sur l'écran d'accueil »" },
              { n: "3", icon: Smartphone, text: "Confirmez en appuyant sur « Ajouter »" },
            ].map(({ n, icon: Icon, text }) => (
              <div key={n} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
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

        {/* Android */}
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
              { n: "2", text: "Appuyez sur « Ajouter à l'écran d'accueil »" },
              { n: "3", text: "Confirmez en appuyant sur « Ajouter »" },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                  {n}
                </div>
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Avantages */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)",
          }}
        >
          <h3 className="font-semibold text-white mb-4">Pourquoi installer l'app ?</h3>
          <div className="space-y-2.5">
            {[
              "⚡ Accès instantané depuis votre écran d'accueil",
              "🔔 Notifications push pour vos validations urgentes",
              "📵 Fonctionne hors connexion pour la lecture",
              "🤖 Vos agents sont toujours à portée de main",
            ].map((item) => (
              <p key={item} className="text-white/65 text-sm">{item}</p>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
