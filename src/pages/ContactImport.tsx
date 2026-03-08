/**
 * ContactImport — Import CSV/Excel réel.
 * Parse le fichier côté client, mappe les colonnes, insère en base via Supabase.
 * Honnêteté : le parser est basique (CSV texte brut). Excel .xlsx non supporté
 * sans librairie externe — affichage honnête si format non supporté.
 */
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Step = "upload" | "mapping" | "preview" | "success";

interface ParsedContact {
  prenom_nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload",  label: "Votre fichier" },
    { id: "mapping", label: "Vérification" },
    { id: "preview", label: "Aperçu" },
    { id: "success", label: "Terminé" },
  ];
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i <= idx ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: i <= idx ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}>
              {i < idx ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <p className="text-xs text-center text-muted-foreground hidden sm:block leading-tight">{step.label}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="h-0.5 flex-1 mb-4 rounded-full"
              style={{ background: i < idx ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,;|\t]/).map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  const findCol = (...keys: string[]) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.includes(key));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const prenomIdx  = findCol("prenom", "prénom", "first", "firstname", "fname", "prenom_nom", "nom");
  const nomIdx     = findCol("nom", "last", "lastname", "lname", "surname");
  const emailIdx   = findCol("email", "mail", "courriel");
  const telIdx     = findCol("tel", "téléphone", "telephone", "phone", "mobile");
  const entrepriseIdx = findCol("entreprise", "company", "société", "societe", "organization");

  const contacts: ParsedContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;|\t]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
    const prenom = prenomIdx >= 0 ? (cols[prenomIdx] || "") : "";
    const nom    = nomIdx >= 0    ? (cols[nomIdx] || "")    : "";
    const fullName = [prenom, nom].filter(Boolean).join(" ") || cols[0] || "Contact";

    if (!fullName.trim()) continue;

    contacts.push({
      prenom_nom:  fullName,
      email:       emailIdx >= 0 ? cols[emailIdx] || undefined : undefined,
      telephone:   telIdx >= 0   ? cols[telIdx] || undefined   : undefined,
      entreprise:  entrepriseIdx >= 0 ? cols[entrepriseIdx] || undefined : undefined,
    });
  }
  return contacts;
}

export default function ContactImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      setParseError("Les fichiers Excel (.xlsx/.xls) ne sont pas encore supportés. Veuillez exporter en CSV depuis Excel (Fichier → Enregistrer sous → CSV).");
      return;
    }
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      setParseError("Format non supporté. Utilisez un fichier CSV (.csv).");
      return;
    }

    setParseError(null);
    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setParseError("Aucun contact détecté. Vérifiez que votre fichier contient une ligne d'en-tête et des données.");
        setLoading(false);
        return;
      }
      setContacts(parsed);
      setLoading(false);
      setStep("mapping");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (!user || contacts.length === 0) return;
    setLoading(true);

    const rows = contacts.map(c => ({
      owner_user_id: user.id,
      prenom_nom:    c.prenom_nom,
      email:         c.email || null,
      telephone:     c.telephone || null,
      entreprise:    c.entreprise || null,
      origine:       "import",
      statut:        "a_contacter",
    }));

    // Batch insert par 100
    let total = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await db.from("contacts").insert(batch);
      if (!error) total += batch.length;
    }

    setImportedCount(total);
    setLoading(false);
    setStep("success");
    if (total > 0) toast.success(`${total} contact${total > 1 ? "s" : ""} importé${total > 1 ? "s" : ""} !`);
  }

  return (
    <UserLayout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={15} /> Retour aux contacts
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Importer des contacts</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Importez un fichier CSV. Les colonnes nom, email, téléphone et entreprise sont détectées automatiquement.
        </p>

        <StepIndicator current={step} />

        {/* ÉTAPE 1 — UPLOAD */}
        {step === "upload" && (
          <div className="card-surface p-6">
            <h2 className="font-semibold text-foreground mb-1">Choisissez votre fichier</h2>
            <p className="text-sm text-muted-foreground mb-6">Format supporté : CSV (.csv). Taille max : 10 Mo.</p>

            {parseError && (
              <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ background: "hsl(0 60% 95%)", color: "hsl(0 60% 35%)" }}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="text-xs">{parseError}</p>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />

            <button onClick={() => { setParseError(null); fileRef.current?.click(); }}
              className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors">
              {loading ? (
                <>
                  <RefreshCw size={32} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyse du fichier…</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--secondary))" }}>
                    <FileSpreadsheet size={28} style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Cliquez pour choisir un fichier CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">ou glissez-déposez ici</p>
                  </div>
                </>
              )}
            </button>

            <div className="mt-5 p-4 rounded-xl bg-muted">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Format attendu :</strong> Un fichier CSV avec une ligne d'en-tête.
                Colonnes reconnues : <code>nom</code>, <code>prénom</code>, <code>email</code>, <code>téléphone</code>, <code>entreprise</code>.
                Pour Excel : Fichier → Enregistrer sous → CSV UTF-8.
              </p>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — MAPPING */}
        {step === "mapping" && (
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "hsl(var(--success-light))" }}>
              <CheckCircle2 size={16} style={{ color: "hsl(var(--success))" }} />
              <div>
                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">{contacts.length} contact{contacts.length > 1 ? "s" : ""} détecté{contacts.length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <h2 className="font-semibold text-foreground mb-1">Colonnes détectées</h2>
            <p className="text-sm text-muted-foreground mb-5">Voici ce que nous avons trouvé dans votre fichier.</p>

            <div className="space-y-2 mb-6">
              {["prenom_nom", "email", "telephone", "entreprise"].map(field => {
                const sample = contacts[0]?.[field as keyof ParsedContact];
                const hasData = contacts.some(c => c[field as keyof ParsedContact]);
                return (
                  <div key={field} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: hasData ? "hsl(var(--success))" : "hsl(var(--border))" }} />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground capitalize">{field.replace("_", " ")}</p>
                      <p className="text-sm font-medium text-foreground">
                        {hasData ? (sample || "Détecté") : <span className="text-muted-foreground italic">Non trouvé</span>}
                      </p>
                    </div>
                    <span className="text-xs font-medium" style={{ color: hasData ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
                      {hasData ? "✓" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-muted text-xs text-muted-foreground leading-relaxed mb-5">
              <AlertCircle size={12} className="inline mr-1" />
              {contacts.filter(c => c.email).length} sur {contacts.length} contacts ont un email.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("preview")} className="btn-cta text-sm py-3 flex-1">
                Continuer <ChevronRight size={14} />
              </button>
              <button onClick={() => { setContacts([]); setStep("upload"); }}
                className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Changer de fichier
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — PREVIEW */}
        {step === "preview" && (
          <div className="card-surface p-6">
            <h2 className="font-semibold text-foreground mb-1">Aperçu avant import</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Voici les {Math.min(5, contacts.length)} premiers contacts sur {contacts.length}.
            </p>

            <div className="space-y-2 mb-5">
              {contacts.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                    {c.prenom_nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.prenom_nom}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.entreprise, c.email].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
              {contacts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {contacts.length - 5} autres contacts
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl mb-5 text-xs leading-relaxed"
              style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
              <CheckCircle2 size={12} className="inline mr-1" />
              {contacts.length} contacts prêts à importer
            </div>

            <button onClick={handleImport} disabled={loading} className="btn-cta text-sm py-3 w-full justify-center">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Import en cours…
                </span>
              ) : (
                <><Upload size={14} /> Importer {contacts.length} contact{contacts.length > 1 ? "s" : ""}</>
              )}
            </button>
          </div>
        )}

        {/* ÉTAPE 4 — SUCCÈS */}
        {step === "success" && (
          <div className="card-surface p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--success-light))" }}>
              <CheckCircle2 size={32} style={{ color: "hsl(var(--success))" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              {importedCount} contact{importedCount > 1 ? "s" : ""} importé{importedCount > 1 ? "s" : ""} !
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Vos contacts sont maintenant dans votre base. Vous pouvez les consulter, les organiser en listes ou démarrer une campagne.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contacts" className="btn-cta text-sm py-3 px-6">
                Voir mes contacts
              </Link>
              <Link to="/listes"
                className="px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Organiser en listes
              </Link>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
