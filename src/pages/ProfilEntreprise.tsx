import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Building2, CheckCircle2, Save, Sparkles } from "lucide-react";
import CopilotPanel from "@/components/ai/CopilotPanel";

const secteurs = ["SaaS / Tech", "Immobilier", "Finance / Assurance", "Formation", "Commerce", "Industrie", "Autre"];
const tailles = ["Indépendant", "2–10 personnes", "10–50 personnes", "50–200 personnes", "Plus de 200 personnes"];
const zones = ["France entière", "Île-de-France", "Grand Ouest", "Grand Sud", "Grand Est", "International"];

export default function ProfilEntreprise() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nom: "Acme SaaS",
    description: "Nous proposons un logiciel de facturation simple pour les TPE. Notre outil s'adresse aux artisans, commerçants et prestataires qui veulent arrêter de gérer leur facturation sur Excel.",
    cible: "Artisans, commerçants, prestataires de service, TPE jusqu'à 10 salariés.",
    secteur: "SaaS / Tech",
    taille: "2–10 personnes",
    zone: "France entière",
    gain: "300 € par client signé et actif depuis 30 jours",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const enterpriseProfileForMatching = {
    sector: form.secteur,
    offer_description: form.description,
    needs: form.cible,
    zone: form.zone,
    target: form.cible,
  };

  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Building2 size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
              Profil entreprise
            </h1>
            <p className="text-muted-foreground text-sm">
              Ces informations sont visibles par les apporteurs d'affaires. Soyez clairs et précis.
            </p>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm font-medium"
            style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
            <CheckCircle2 size={16} /> Vos informations ont bien été enregistrées.
          </div>
        )}

        <div className="space-y-5">
          {/* Nom */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Nom de votre entreprise
            </label>
            <p className="text-xs text-muted-foreground mb-3">C'est le nom affiché sur vos missions.</p>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Description */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Ce que vous proposez
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Expliquez simplement votre offre. Les apporteurs lisent cela pour décider s'ils peuvent vous aider.
            </p>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Cible */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Qui cherchez-vous comme clients ?
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Décrivez précisément le profil de vos clients idéaux. Plus c'est clair, meilleures sont les introductions.
            </p>
            <textarea
              rows={2}
              value={form.cible}
              onChange={(e) => setForm((f) => ({ ...f, cible: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Secteur */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">Votre secteur</label>
            <p className="text-xs text-muted-foreground mb-3">Sert à vous mettre en contact avec les bons apporteurs.</p>
            <div className="grid grid-cols-2 gap-2">
              {secteurs.map((s) => (
                <button
                  key={s}
                  onClick={() => setForm((f) => ({ ...f, secteur: s }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.secteur === s
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Zone */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">Zone géographique</label>
            <p className="text-xs text-muted-foreground mb-3">Où cherchez-vous des clients ?</p>
            <div className="grid grid-cols-2 gap-2">
              {zones.map((z) => (
                <button
                  key={z}
                  onClick={() => setForm((f) => ({ ...f, zone: z }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.zone === z
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Récompense */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Récompense proposée aux apporteurs
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Indiquez clairement ce qu'un apporteur gagne s'il vous amène un client validé.
            </p>
            <input
              type="text"
              value={form.gain}
              onChange={(e) => setForm((f) => ({ ...f, gain: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : 300 € par client signé et actif 30 jours"
            />
          </div>

          {/* Trouver des apporteurs */}
          <div className="w-full py-4 rounded-xl border border-border bg-muted/50 flex items-center justify-center gap-2 font-semibold text-muted-foreground text-sm">
            <Sparkles size={16} />
            Apporteurs disponibles dans Facilitateurs
          </div>

          {/* Copilot IA */}
          <CopilotPanel
            context="profil_entreprise"
            textToImprove={form.description}
            userRole="entreprise"
          />

          {/* Save */}
          <button onClick={handleSave} className="btn-cta w-full py-4">
            <Save size={16} /> Enregistrer mon profil
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
