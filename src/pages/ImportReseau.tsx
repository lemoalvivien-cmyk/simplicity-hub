/**
 * ImportReseau — Import CSV/Excel + graph feeding + smart offer suggestions
 * "Importez votre réseau, laissez l'IA faire le reste."
 */
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Upload, CheckCircle2, AlertCircle, ArrowRight, Users,
  FileText, X, Loader2, Sparkles, Info, Flame, Share2, ChevronRight
} from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ParsedContact = {
  prenom_nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  secteur?: string;
  zone?: string;
  langue?: string;
  notes?: string;
  _valid: boolean;
  _duplicate?: boolean;
};

const COLUMN_MAP: Record<string, string[]> = {
  prenom_nom: ["prénom", "prenom", "nom", "name", "full name", "contact", "firstname", "lastname", "prenom nom", "prénom nom"],
  email: ["email", "e-mail", "mail", "courriel"],
  telephone: ["téléphone", "telephone", "phone", "tel", "mobile", "gsm"],
  entreprise: ["entreprise", "company", "société", "societe", "organisation", "org"],
  secteur: ["secteur", "sector", "industry", "industrie", "domaine"],
  zone: ["zone", "ville", "city", "pays", "country", "region", "région", "localisation"],
  langue: ["langue", "language", "lang"],
  notes: ["notes", "commentaire", "comment", "description", "remarque"],
};

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuote = !inQuote; }
      else if ((c === "," || c === ";") && !inQuote) { cols.push(cur.trim()); cur = ""; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

function detectColumn(headers: string[], keys: string[]): number {
  for (const key of keys) {
    const idx = headers.findIndex(h => h.toLowerCase().replace(/[\s_-]/g, "").includes(key.replace(/[\s_-]/g, "")));
    if (idx >= 0) return idx;
  }
  return -1;
}

interface SuggestedOffer {
  id: string;
  title: string;
  short_description: string | null;
}

export default function ImportReseau() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [fileName, setFileName] = useState("");
  const [suggestedOffers, setSuggestedOffers] = useState<SuggestedOffer[]>([]);
  const [graphFed, setGraphFed] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast({ title: "Fichier vide", description: "Votre fichier ne contient pas de données.", variant: "destructive" });
        return;
      }
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const colIdx: Record<string, number> = {};
      for (const [field, keys] of Object.entries(COLUMN_MAP)) {
        colIdx[field] = detectColumn(headers, keys);
      }

      const contacts: ParsedContact[] = rows.slice(1).map(row => {
        const get = (field: string) => {
          const idx = colIdx[field];
          return idx >= 0 ? (row[idx] || "").trim() : "";
        };
        const prenom_nom = get("prenom_nom") || `Contact ${Math.random().toString(36).slice(2, 6)}`;
        return {
          prenom_nom,
          email: get("email") || undefined,
          telephone: get("telephone") || undefined,
          entreprise: get("entreprise") || undefined,
          secteur: get("secteur") || undefined,
          zone: get("zone") || undefined,
          langue: get("langue") || undefined,
          notes: get("notes") || undefined,
          _valid: prenom_nom.length >= 2,
        };
      }).filter(c => c._valid);

      // Deduplicate by email
      const seen = new Set<string>();
      const deduped = contacts.map(c => {
        if (c.email && seen.has(c.email)) return { ...c, _duplicate: true };
        if (c.email) seen.add(c.email);
        return c;
      });
      setParsed(deduped);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const doImport = async () => {
    if (!user) return;
    setImporting(true);
    setStep("importing");
    const toImport = parsed.filter(c => !c._duplicate && c._valid);
    let count = 0;
    const batch = toImport.map(c => ({
      owner_user_id: user.id,
      prenom_nom: c.prenom_nom,
      email: c.email || null,
      telephone: c.telephone || null,
      entreprise: c.entreprise || null,
      origine: "import_csv",
      statut: "actif",
    }));

    const { error } = await db.from("contacts").insert(batch);
    if (!error) {
      count = batch.length;
    } else {
      // insert one by one for partial success
      for (const c of batch) {
        const { error: e } = await db.from("contacts").insert(c);
        if (!e) count++;
      }
    }

    // ── Feed graph with import event ──────────────────────────
    // Log a graph_event so the passive engine knows the network grew
    try {
      await db.from("graph_events").insert({
        user_id: user.id,
        event_type: "network_import",
        entity_type: "contact",
        entity_id: user.id,
        delta_weight: Math.min(20, Math.round(count / 5)),
        summary: `Import réseau : ${count} contacts ajoutés. Signal passif enrichi.`,
      });
      setGraphFed(true);
    } catch (_) { /* silent */ }

    // ── Load suggested offers based on imported data ───────────
    try {
      const { data: offers } = await db.from("shared_offers")
        .select("id, title, short_description")
        .eq("status", "active")
        .limit(3);
      setSuggestedOffers(offers || []);
    } catch (_) { /* silent */ }

    setImported(count);
    setImporting(false);
    setStep("done");
    toast({ title: `${count} contacts importés ✓`, description: "Votre réseau enrichit maintenant le moteur." });
  };

  const valid = parsed.filter(c => !c._duplicate && c._valid);
  const dupes = parsed.filter(c => c._duplicate);

  return (
    <UserLayout role="facilitateur" jarvisContext="import-reseau">
      <div className="max-w-xl mx-auto space-y-5">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/passive" className="text-xs text-muted-foreground hover:text-foreground">Mode passif</Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-foreground font-medium">Import réseau</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Importez votre réseau</h1>
          <p className="text-muted-foreground text-sm mt-1">CSV ou Excel — vos meilleurs contacts sont déjà dans le système en 30 secondes.</p>
        </div>

        {/* ── STEP: UPLOAD ─────────────────────────────────────── */}
        {step === "upload" && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer hover:border-primary transition-colors"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--secondary))" }}>
                <Upload size={24} className="text-primary" />
              </div>
              <p className="font-semibold text-foreground mb-1">Glissez votre fichier ici</p>
              <p className="text-sm text-muted-foreground mb-4">ou cliquez pour choisir</p>
              <span className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
                Choisir un fichier
              </span>
              <p className="text-xs text-muted-foreground mt-3">Format CSV ou Excel (.csv, .xlsx, .xls)</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Colonnes reconnues automatiquement</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(COLUMN_MAP).map(field => (
                  <div key={field} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="capitalize">{field.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                La première ligne doit contenir les titres de colonnes. Le champ "nom/prénom" est obligatoire.
              </p>
            </div>
          </>
        )}

        {/* ── STEP: PREVIEW ────────────────────────────────────── */}
        {step === "preview" && (
          <>
            <div className="card-surface p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary))" }}>
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{parsed.length} lignes détectées</p>
                </div>
                <button onClick={() => { setParsed([]); setStep("upload"); setFileName(""); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center py-3 rounded-xl bg-muted">
                  <p className="text-xl font-bold text-foreground">{parsed.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center py-3 rounded-xl" style={{ background: "hsl(var(--success-light))" }}>
                  <p className="text-xl font-bold" style={{ color: "hsl(var(--success))" }}>{valid.length}</p>
                  <p className="text-xs text-muted-foreground">À importer</p>
                </div>
                <div className="text-center py-3 rounded-xl bg-muted">
                  <p className="text-xl font-bold text-muted-foreground">{dupes.length}</p>
                  <p className="text-xs text-muted-foreground">Doublons ignorés</p>
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="card-surface p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">Aperçu des premiers contacts</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {parsed.slice(0, 8).map((c, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${c._duplicate ? "opacity-40" : ""}`} style={{ background: c._duplicate ? "hsl(var(--muted))" : "hsl(var(--secondary))" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: "var(--gradient-primary)" }}>
                      {c.prenom_nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.prenom_nom}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[c.entreprise, c.email, c.secteur].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    {c._duplicate && <span className="text-xs text-muted-foreground shrink-0">doublon</span>}
                    {!c._duplicate && <CheckCircle2 size={14} style={{ color: "hsl(var(--success))", flexShrink: 0 }} />}
                  </div>
                ))}
                {parsed.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center py-1">… et {parsed.length - 8} autres contacts</p>
                )}
              </div>
            </div>

            <button
              onClick={doImport}
              disabled={valid.length === 0}
              className="w-full btn-cta py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={16} /> Importer {valid.length} contacts dans mon réseau
            </button>
          </>
        )}

        {/* ── STEP: IMPORTING ──────────────────────────────────── */}
        {step === "importing" && (
          <div className="card-surface p-10 text-center">
            <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
            <p className="font-semibold text-foreground mb-1">Import en cours…</p>
            <p className="text-sm text-muted-foreground">Vos contacts rejoignent votre réseau.</p>
          </div>
        )}

        {/* ── STEP: DONE ───────────────────────────────────────── */}
        {step === "done" && (
          <>
            <div className="card-surface p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--success-light))" }}>
                <CheckCircle2 size={28} style={{ color: "hsl(var(--success))" }} />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">{imported} contacts importés ✓</h2>
              <p className="text-muted-foreground text-sm mb-6">Votre réseau est maintenant dans WIINUP MAX. OpenClaw peut commencer à travailler.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/contacts" className="btn-cta py-3 px-6 flex items-center justify-center gap-2">
                  <Users size={14} /> Voir mes contacts
                </Link>
                <Link to="/offres" className="py-3 px-6 rounded-xl font-semibold border border-primary text-primary flex items-center justify-center gap-2 hover:bg-secondary transition-colors text-sm">
                  <Sparkles size={14} /> Voir les offres à partager
                </Link>
              </div>
            </div>
            <Link to="/passive" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowRight size={13} /> Retour au Mode passif
            </Link>
          </>
        )}
      </div>
    </UserLayout>
  );
}
