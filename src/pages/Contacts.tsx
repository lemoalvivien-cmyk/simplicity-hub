import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { Search, Plus, Upload, ChevronRight, Phone, Mail, User, Clock, CheckCircle2, AlertCircle, Filter, Loader2, Zap, Flame, ArrowUpDown } from "lucide-react";
import { db } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ContactStatus = "a_contacter" | "contacte" | "en_discussion" | "converti" | "pas_interesse";
type ContactSource = "import" | "manuel" | "introduction" | "prospection" | "telephone";

interface Contact {
  id: string;
  prenom: string;
  nom: string;
  entreprise: string;
  poste: string;
  email: string;
  telephone: string;
  statut: ContactStatus;
  origine: ContactSource;
  prochaine_action: string;
  created_at: string;
}

interface ContactSequenceInfo {
  contact_id: string;
  sequence_name: string;
  current_step: number;
  total_steps: number;
  status: string;
}

const statusConfig: Record<ContactStatus, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  a_contacter:   { label: "À contacter",  color: "hsl(var(--primary))",          bg: "hsl(var(--secondary))",    icon: <User size={11} /> },
  contacte:      { label: "Contacté",     color: "hsl(38 80% 30%)",              bg: "hsl(var(--accent-light))", icon: <Clock size={11} /> },
  en_discussion: { label: "En discussion",color: "hsl(220 80% 45%)",             bg: "hsl(220 80% 95%)",         icon: <Clock size={11} /> },
  converti:      { label: "Converti ✓",   color: "hsl(var(--success))",          bg: "hsl(var(--success-light))",icon: <CheckCircle2 size={11} /> },
  pas_interesse: { label: "Pas intéressé",color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",        icon: <AlertCircle size={11} /> },
};

const sourceConfig: Record<ContactSource, { label: string; color: string }> = {
  import:      { label: "Import",       color: "hsl(var(--muted-foreground))" },
  manuel:      { label: "Manuel",       color: "hsl(var(--muted-foreground))" },
  introduction:{ label: "Introduction", color: "hsl(var(--primary))"          },
  prospection: { label: "Prospection",  color: "hsl(38 80% 30%)"              },
  telephone:   { label: "Téléphone",    color: "hsl(220 80% 45%)"             },
};

const seqStatusColors: Record<string, string> = {
  en_cours: "hsl(218 72% 55%)",
  termine:  "hsl(var(--muted-foreground))",
  repondu:  "hsl(var(--success))",
  annule:   "hsl(0 65% 45%)",
};

export default function Contacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "tous">("tous");
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ prenom: "", nom: "", entreprise: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [seqMap, setSeqMap] = useState<Record<string, ContactSequenceInfo>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from("contacts").select("*").eq("owner_user_id", user.id).order("created_at", { ascending: false });
    setContacts(data || []);
    setLoading(false);

    // Load sequence info for contacts
    if (data && data.length > 0) {
      const contactIds = data.map((c: Contact) => c.id);
      const { data: execs } = await supabase
        .from("prospection_executions")
        .select("contact_id, status, current_step, sequence_id")
        .in("contact_id", contactIds)
        .in("status", ["en_cours", "repondu"]);

      if (execs && execs.length > 0) {
        const seqIds = [...new Set((execs as { sequence_id: string }[]).map(e => e.sequence_id))];
        const { data: seqs } = await supabase
          .from("prospection_sequences")
          .select("id, name, steps")
          .in("id", seqIds);

        const seqById = Object.fromEntries((seqs ?? []).map((s: { id: string; name: string; steps: unknown }) => [s.id, s]));
        const newMap: Record<string, ContactSequenceInfo> = {};

        for (const ex of execs as { contact_id: string; status: string; current_step: number; sequence_id: string }[]) {
          const seq = seqById[ex.sequence_id];
          if (seq) {
            newMap[ex.contact_id] = {
              contact_id: ex.contact_id,
              sequence_name: seq.name,
              current_step: ex.current_step,
              total_steps: Array.isArray(seq.steps) ? (seq.steps as unknown[]).length : 0,
              status: ex.status,
            };
          }
        }
        setSeqMap(newMap);
      }
    }
  };

  useEffect(() => { load(); }, [user]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.prenom || "").toLowerCase().includes(q) ||
      (c.nom || "").toLowerCase().includes(q) ||
      (c.entreprise || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "tous" || c.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const aContacter = contacts.filter(c => c.statut === "a_contacter").length;
  const inSequence = Object.keys(seqMap).length;

  const handleAddContact = async () => {
    if (!user || !newContact.prenom.trim()) return;
    setSaving(true);
    const { error } = await db.from("contacts").insert({
      owner_user_id: user.id,
      prenom: newContact.prenom,
      nom: newContact.nom,
      entreprise: newContact.entreprise,
      email: newContact.email,
      origine: "manuel",
      statut: "a_contacter",
    });
    setSaving(false);
    if (error) { toast.error("Impossible d'ajouter ce contact."); return; }
    toast.success("Contact ajouté !");
    setShowAdd(false);
    setNewContact({ prenom: "", nom: "", entreprise: "", email: "" });
    load();
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes contacts</h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length} personne{contacts.length > 1 ? "s" : ""} dans votre base.
              {aContacter > 0 && <span style={{ color: "hsl(var(--primary))" }} className="font-medium ml-1">{aContacter} à contacter.</span>}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/contacts/import" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Upload size={14} /> Importer
            </Link>
            <button onClick={() => setShowAdd(true)} className="btn-cta text-sm py-2.5 px-4">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        {/* Formulaire ajout */}
        {showAdd && (
          <div className="card-surface p-5 mb-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <h2 className="font-semibold text-foreground mb-3">Ajouter un contact</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="Prénom *" value={newContact.prenom} onChange={e => setNewContact(p => ({ ...p, prenom: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              <input type="text" placeholder="Nom" value={newContact.nom} onChange={e => setNewContact(p => ({ ...p, nom: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              <input type="text" placeholder="Entreprise" value={newContact.entreprise} onChange={e => setNewContact(p => ({ ...p, entreprise: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
              <input type="email" placeholder="Email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddContact} disabled={saving || !newContact.prenom.trim()} className="btn-cta text-sm py-2.5 px-5 disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Ajout…</> : "Ajouter le contact"}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">Annuler</button>
            </div>
          </div>
        )}

        {/* Résumé rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {[
            { label: "À contacter",  value: contacts.filter(c => c.statut === "a_contacter").length,   color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
            { label: "En discussion",value: contacts.filter(c => c.statut === "en_discussion").length, color: "hsl(220 80% 45%)",       bg: "hsl(220 80% 95%)" },
            { label: "Convertis",    value: contacts.filter(c => c.statut === "converti").length,       color: "hsl(var(--success))",    bg: "hsl(var(--success-light))" },
            { label: "En séquence",  value: inSequence,                                                  color: "hsl(218 72% 55%)",       bg: "hsl(218 72% 95%)" },
            { label: "Total",        value: contacts.length,                                             color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Recherche + filtre */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un nom, une entreprise, un email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ContactStatus | "tous")}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
              <option value="tous">Tous</option>
              <option value="a_contacter">À contacter</option>
              <option value="contacte">Contactés</option>
              <option value="en_discussion">En discussion</option>
              <option value="converti">Convertis</option>
              <option value="pas_interesse">Pas intéressés</option>
            </select>
            <Filter size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <User size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucun contact trouvé</p>
            <p className="text-sm text-muted-foreground mb-4">Importez un fichier ou ajoutez un contact manuellement.</p>
            <Link to="/contacts/import" className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Upload size={14} /> Importer des contacts
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const cfg = statusConfig[c.statut];
              const src = sourceConfig[c.origine];
              const seqInfo = seqMap[c.id];
              return (
                <Link key={c.id} to={`/contacts/${c.id}`}
                  className="card-surface p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
                    {(c.prenom || "?").charAt(0)}{(c.nom || "").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{c.prenom} {c.nom}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {/* Sequence badge */}
                      {seqInfo && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: seqStatusColors[seqInfo.status] ?? "hsl(218 72% 55%)", background: `${seqStatusColors[seqInfo.status] ?? "hsl(218 72% 55%)"}18` }}>
                          <Zap size={9} />
                          Étape {seqInfo.current_step}/{seqInfo.total_steps}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.entreprise}{c.poste && ` · ${c.poste}`}
                    </p>
                    {seqInfo && (
                      <p className="text-xs mt-0.5 truncate text-muted-foreground">
                        📬 {seqInfo.sequence_name}
                      </p>
                    )}
                    {c.prochaine_action && !seqInfo && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--primary))" }}>→ {c.prochaine_action}</p>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-medium" style={{ color: src.color }}>{src.label}</span>
                    <div className="flex items-center gap-2">
                      {c.email && <Mail size={12} className="text-muted-foreground" />}
                      {c.telephone && <Phone size={12} className="text-muted-foreground" />}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link to="/contacts/import" className="btn-primary w-full py-3 justify-center">
            <Upload size={14} /> Importer des contacts
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
