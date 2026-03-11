import { useState, useEffect, useRef } from "react";
import UserLayout from "@/components/layout/UserLayout";
import { Users, CheckCircle2, Save, Loader2, AlertCircle } from "lucide-react";
import CopilotPanel from "@/components/ai/CopilotPanel";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const savingRef               = useRef(false);

  const [form, setForm] = useState({
    description: "",
    secteur: "",
    zone: "",
    contacts: [] as string[],
    experience: "",
  });

  // Load existing profile
  useEffect(() => {
    if (!user) return;
    db.from("facilitateur_profiles")
      .select("description_reseau, secteur, zone, types_contacts")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          let contacts: string[] = [];
          try {
            contacts = data.types_contacts
              ? (typeof data.types_contacts === "string"
                  ? JSON.parse(data.types_contacts)
                  : (data.types_contacts as string[]))
              : [];
          } catch { contacts = []; }
          setForm({
            description: data.description_reseau || "",
            secteur: data.secteur || "",
            zone: data.zone || "",
            contacts: Array.isArray(contacts) ? contacts : [],
            experience: "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const toggleContact = (c: string) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.includes(c)
        ? f.contacts.filter((x) => x !== c)
        : [...f.contacts, c],
    }));
  };

  const handleSave = async () => {
    if (!user || saving || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const { error: dbErr } = await db.from("facilitateur_profiles").upsert({
        user_id: user.id,
        description_reseau: form.description.trim() || null,
        secteur: form.secteur || null,
        zone: form.zone || null,
        types_contacts: JSON.stringify(form.contacts),
      }, { onConflict: "user_id" });

      if (dbErr) throw dbErr;
      setSaved(true);
      toast.success("Profil enregistré !");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Impossible d'enregistrer votre profil. Réessayez.");
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      </UserLayout>
    );
  }

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

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle size={16} /> {error}
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
              maxLength={1500}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : J'ai un réseau de dirigeants PME dans le commerce et l'industrie..."
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
              maxLength={500}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              placeholder="ex : 10 ans dans le conseil aux TPE…"
            />
          </div>

          {/* Copilot IA */}
          {form.description.length > 20 && (
            <CopilotPanel
              context="profil_facilitateur"
              textToImprove={form.description}
              userRole="facilitateur"
            />
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-cta w-full py-4 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving
              ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
              : <><Save size={16} /> Enregistrer mon profil</>
            }
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
