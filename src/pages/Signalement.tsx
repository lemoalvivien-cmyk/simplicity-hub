import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Flag, Shield, CheckCircle2, AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { value: "spam", label: "Spam / Messages non sollicités", icon: "📨", desc: "Envoi répété de messages non désirés" },
  { value: "mauvaise_introduction", label: "Introduction de mauvaise qualité", icon: "❌", desc: "Contact hors cible ou mal qualifié" },
  { value: "comportement_abusif", label: "Comportement abusif", icon: "⚠️", desc: "Harcèlement, pression excessive" },
  { value: "contournement", label: "Tentative de contournement", icon: "🔒", desc: "Essai de contourner les règles de la plateforme" },
  { value: "faux_profil", label: "Faux profil ou usurpation", icon: "👤", desc: "Informations fausses ou identité usurpée" },
  { value: "qualite", label: "Problème de qualité", icon: "📉", desc: "Contenu ou service en dessous des standards" },
  { value: "autre", label: "Autre problème", icon: "💬", desc: "Tout autre comportement problématique" },
];

export default function Signalement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [entityType, setEntityType] = useState("facilitateur");
  const [entityId, setEntityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !type || !description.trim()) return;
    setLoading(true);
    try {
      // On log dans openclaw_logs (table de logs agnostiques)
      await db.from("openclaw_logs").insert({
        user_id: user.id,
        event_type: "signalement",
        summary: `Signalement ${type} : ${description.substring(0, 100)}`,
        risque: type === "faux_profil" || type === "contournement" ? "eleve" : "moyen",
        details: {
          type_signalement: type,
          description,
          entity_type: entityType,
          entity_id: entityId || null,
        },
      });
      setDone(true);
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer le signalement.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <UserLayout jarvisContext="dashboard">
        <div className="max-w-lg mx-auto pt-8">
          <div className="card-surface p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "hsl(152 62% 45% / 0.12)" }}>
              <CheckCircle2 size={32} style={{ color: "hsl(152 62% 45%)" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">Signalement reçu</h2>
            <p className="text-muted-foreground text-sm mb-2 leading-relaxed">
              Votre signalement a bien été enregistré. Notre équipe va l'examiner dans les plus brefs délais.
            </p>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Si le problème nécessite une action urgente, vous serez contacté directement.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate(-1)} className="btn-primary py-2.5 text-sm">
                Retour
              </button>
              <button onClick={() => { setDone(false); setType(""); setDescription(""); setEntityId(""); }} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Faire un autre signalement
              </button>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Signaler un problème</h1>
            <p className="text-muted-foreground text-xs">Votre signalement est traité en toute confidentialité</p>
          </div>
        </div>

        {/* Confiance */}
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
          <Shield size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Plateforme sécurisée</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chaque signalement est analysé par notre système de détection IA, puis examiné par notre équipe. Votre identité est protégée.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Type de signalement */}
          <div className="card-surface p-5">
            <p className="text-sm font-semibold text-foreground mb-4">Quel est le problème ?</p>
            <div className="grid gap-2">
              {TYPES.map(({ value, label, icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    type === value
                      ? "border-primary bg-secondary"
                      : "border-border hover:border-primary/30 hover:bg-muted"
                  }`}
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${type === value ? "text-primary" : "text-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  {type === value && <CheckCircle2 size={16} className="ml-auto shrink-0 text-primary mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Concerne */}
          <div className="card-surface p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Cela concerne :</p>
            <div className="flex gap-2 mb-3">
              {["facilitateur", "entreprise", "message", "autre"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setEntityType(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    entityType === v ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Identifiant ou nom si connu (optionnel)"
              value={entityId}
              onChange={e => setEntityId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Description */}
          <div className="card-surface p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Décrivez le problème <span className="text-destructive">*</span></p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez précisément ce qui s'est passé. Plus vous êtes précis, plus vite nous pouvons agir."
              rows={5}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">{description.length}/1000 caractères</p>
          </div>

          {/* Avertissement */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: "hsl(38 80% 55% / 0.08)", border: "1px solid hsl(38 80% 55% / 0.2)" }}>
            <AlertTriangle size={14} style={{ color: "hsl(38 80% 45%)" }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "hsl(38 70% 35%)" }}>
              Les signalements abusifs ou de mauvaise foi peuvent entraîner une restriction de votre compte.
            </p>
          </div>

          <button
            type="submit"
            disabled={!type || !description.trim() || loading}
            className="btn-cta w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
            ) : (
              <><Flag size={16} /> Envoyer le signalement</>
            )}
          </button>
        </form>

      </div>
    </UserLayout>
  );
}
