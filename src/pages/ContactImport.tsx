import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";

type Step = "upload" | "mapping" | "preview" | "success";

// Données simulées pour la démo
const colonnesMock = ["Prénom", "Nom", "Entreprise", "Email", "Téléphone", "Poste"];
const previewMock = [
  { Prénom: "Sophie", Nom: "Lemaire", Entreprise: "Café du Marché", Email: "s.lemaire@cafe.fr", Téléphone: "06 11 22 33 44", Poste: "Gérante" },
  { Prénom: "Bruno", Nom: "Tessier", Entreprise: "Imprimerie Tessier", Email: "btessier@imprimerie.fr", Téléphone: "", Poste: "Directeur" },
  { Prénom: "Laure", Nom: "Vidal", Entreprise: "Cabinet Vidal", Email: "laure.vidal@cabinet.fr", Téléphone: "07 88 99 00 11", Poste: "Associée" },
  { Prénom: "Malik", Nom: "Diouf", Entreprise: "Diouf Transport", Email: "", Téléphone: "06 55 44 33 22", Poste: "Gérant" },
  { Prénom: "Claire", Nom: "Moreau", Entreprise: "Studio CM", Email: "claire@studiocm.fr", Téléphone: "06 77 66 55 44", Poste: "Fondatrice" },
];

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Votre fichier" },
    { id: "mapping", label: "Vérification" },
    { id: "preview", label: "Aperçu" },
    { id: "success", label: "Terminé" },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i <= idx ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: i <= idx ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {i < idx ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <p className="text-xs text-center text-muted-foreground hidden sm:block leading-tight">
              {step.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-0.5 flex-1 mb-4 rounded-full"
              style={{ background: i < idx ? "hsl(var(--primary))" : "hsl(var(--border))" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ContactImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setLoading(true);
      setTimeout(() => { setLoading(false); setStep("mapping"); }, 1200);
    }
  }

  function handleConfirmMapping() {
    setStep("preview");
  }

  function handleImport() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("success"); }, 1500);
  }

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Retour aux contacts
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Importer des contacts
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Importez un fichier Excel ou CSV. On s'occupe du reste — c'est simple et rapide.
        </p>

        <StepIndicator current={step} />

        {/* ÉTAPE 1 — UPLOAD */}
        {step === "upload" && (
          <div className="card-surface p-6">
            <h2 className="font-semibold text-foreground mb-1">Choisissez votre fichier</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Formats acceptés : Excel (.xlsx) ou CSV (.csv). Taille max : 10 Mo.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw size={32} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyse du fichier…</p>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(var(--secondary))" }}
                  >
                    <FileSpreadsheet size={28} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Cliquez pour choisir un fichier
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou glissez-déposez ici
                    </p>
                  </div>
                </>
              )}
            </button>

            <div className="mt-5 p-4 rounded-xl bg-muted">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Conseil :</strong> Votre fichier doit avoir au moins une colonne "Nom" ou "Email".
                Si vos colonnes ont des noms différents, vous pourrez les ajuster à l'étape suivante.
              </p>
            </div>

            {/* Démo rapide */}
            <button
              onClick={() => { setFileName("contacts_demo.xlsx"); setStep("mapping"); }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              Utiliser un fichier de démonstration
            </button>
          </div>
        )}

        {/* ÉTAPE 2 — MAPPING */}
        {step === "mapping" && (
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "hsl(var(--success-light))" }}>
              <CheckCircle2 size={16} style={{ color: "hsl(var(--success))" }} />
              <div>
                <p className="text-sm font-semibold text-foreground">{fileName || "contacts_demo.xlsx"}</p>
                <p className="text-xs text-muted-foreground">{colonnesMock.length} colonnes détectées · {previewMock.length} contacts trouvés</p>
              </div>
            </div>

            <h2 className="font-semibold text-foreground mb-1">Vérifiez les colonnes</h2>
            <p className="text-sm text-muted-foreground mb-5">
              On a détecté ces colonnes dans votre fichier. Vérifiez que tout est correct.
            </p>

            <div className="space-y-2 mb-6">
              {[
                { col: "Prénom", champ: "Prénom du contact" },
                { col: "Nom", champ: "Nom de famille" },
                { col: "Entreprise", champ: "Nom de l'entreprise" },
                { col: "Email", champ: "Adresse email" },
                { col: "Téléphone", champ: "Numéro de téléphone" },
                { col: "Poste", champ: "Poste / Fonction" },
              ].map(({ col, champ }) => (
                <div key={col} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "hsl(var(--success))" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Colonne dans votre fichier</p>
                    <p className="text-sm font-medium text-foreground">{col}</p>
                  </div>
                  <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Correspond à</p>
                    <p className="text-sm font-medium text-foreground">{champ}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted text-xs text-muted-foreground leading-relaxed mb-5">
              <AlertCircle size={12} className="inline mr-1" />
              4 contacts sur 5 ont un email valide. 1 contact n'a pas d'email — il sera quand même importé.
            </div>

            <div className="flex gap-3">
              <button onClick={handleConfirmMapping} className="btn-cta text-sm py-3 flex-1">
                C'est correct, continuer <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setStep("upload")}
                className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Changer de fichier
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — PREVIEW */}
        {step === "preview" && (
          <div className="card-surface p-6">
            <h2 className="font-semibold text-foreground mb-1">
              Aperçu avant import
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Voici les {previewMock.length} premiers contacts que vous allez importer. Tout semble bon ?
            </p>

            <div className="space-y-2 mb-5">
              {previewMock.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}
                  >
                    {c.Prénom.charAt(0)}{c.Nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {c.Prénom} {c.Nom}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.Entreprise}
                      {c.Poste && ` · ${c.Poste}`}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    {c.Email && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{c.Email}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-3 rounded-xl mb-5 text-xs leading-relaxed"
              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}
            >
              <CheckCircle2 size={12} className="inline mr-1" />
              {previewMock.length} contacts prêts à importer · 0 doublon détecté
            </div>

            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-cta text-sm py-3 w-full justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Import en cours…
                </span>
              ) : (
                <>
                  <Upload size={14} /> Importer {previewMock.length} contacts
                </>
              )}
            </button>
          </div>
        )}

        {/* ÉTAPE 4 — SUCCÈS */}
        {step === "success" && (
          <div className="card-surface p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--success-light))" }}
            >
              <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              {previewMock.length} contacts importés !
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Vos contacts sont maintenant disponibles dans votre base. Vous pouvez les consulter, les organiser en listes ou démarrer une campagne.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contacts" className="btn-primary text-sm py-3 px-6">
                Voir mes contacts
              </Link>
              <Link
                to="/listes"
                className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Organiser en listes
              </Link>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
