import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Users, CheckCircle2, Save } from "lucide-react";

const secteurs = ["SaaS / Tech", "Immobilier", "Finance / Assurance", "Formation", "Commerce", "Industrie", "Conseil", "Autre"];
const zones = ["France entière", "Île-de-France", "Grand Ouest", "Grand Sud", "Grand Est", "International"];
const typeContacts = [
  "Dirigeants TPE / artisans",
  "Dirigeants PME",
  "Responsables achat",
  "Responsables RH / formation",
  "Investisseurs",
  "Entrepreneurs / startups",
  "Professions libérales",
  "Autre",
];

export default function ProfilFacilitateur() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    prenom: "Thomas",
    description: "J'ai un réseau de dirigeants TPE/PME en Île-de-France, principalement dans le commerce, l'artisanat et les services. Je connais beaucoup de personnes qui cherchent à simplifier leur gestion.",
    secteur: "Commerce",
    zone: "Île-de-France",
    contacts: ["Dirigeants TPE / artisans", "Dirigeants PME"],
    experience: "J'ai passé 10 ans dans le conseil aux TPE. Je connais bien leurs problèmes et je sais identifier les bons moments pour les approcher.",
  });

  const toggleContact = (c: string) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.includes(c)
        ? f.contacts.filter((x) => x !== c)
        : [...f.contacts, c],
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Users size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-0.5">
              Mon profil apporteur
            </h1>
            <p className="text-muted-foreground text-sm">
              Ces informations aident les entreprises à comprendre votre réseau et votre valeur.
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
          {/* Présentation */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Votre réseau en quelques mots
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Décrivez le type de personnes que vous connaissez et que vous pouvez mettre en relation.
              C'est la première chose que lira une entreprise qui cherche un apporteur.
            </p>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Type de contacts */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Qui se trouve dans votre réseau ?
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Cochez tous les profils que vous connaissez. Vous pouvez en sélectionner plusieurs.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {typeContacts.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleContact(c)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                    form.contacts.includes(c)
                      ? "border-primary bg-primary/5 font-medium text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {form.contacts.includes(c) && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                  <span className="leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secteur */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Votre domaine de prédilection
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Dans quel secteur votre réseau est-il le plus solide ?
            </p>
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
            <p className="text-xs text-muted-foreground mb-3">Où se trouve principalement votre réseau ?</p>
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

          {/* Expérience / Contexte */}
          <div className="card-surface p-5">
            <label className="block text-sm font-semibold text-foreground mb-1">
              Votre contexte (optionnel)
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Ajoutez quelques mots sur votre parcours ou sur la façon dont vous pouvez aider.
              Cela renforce la confiance des entreprises.
            </p>
            <textarea
              rows={2}
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : 10 ans dans le conseil aux TPE…"
            />
          </div>

          {/* Save */}
          <button onClick={handleSave} className="btn-cta w-full py-4">
            <Save size={16} /> Enregistrer mon profil
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
