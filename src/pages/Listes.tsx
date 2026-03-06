import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import { ListOrdered, Plus, Users, Search, Trash2, Loader2 } from "lucide-react";
import { db } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Liste {
  id: string;
  nom: string;
  description: string;
  created_at: string;
}

interface ListeWithCount extends Liste {
  contact_count: number;
}

export default function Listes() {
  const { user } = useAuth();
  const [listes, setListes] = useState<ListeWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db
      .from("listes")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    // Get contact counts for each list
    const listesWithCounts: ListeWithCount[] = await Promise.all(
      (data || []).map(async (l: Liste) => {
        const { count } = await db
          .from("liste_contacts")
          .select("contact_id", { count: "exact", head: true })
          .eq("liste_id", l.id);
        return { ...l, contact_count: count || 0 };
      })
    );
    setListes(listesWithCounts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = listes.filter(l => l.nom.toLowerCase().includes(search.toLowerCase()));
  const totalContacts = listes.reduce((s, l) => s + l.contact_count, 0);

  const handleCreate = async () => {
    if (!user || newName.trim().length < 2) return;
    setSaving(true);
    const { error } = await db.from("listes").insert({
      owner_user_id: user.id,
      nom: newName.trim(),
      description: newDesc.trim(),
    });
    setSaving(false);
    if (error) { toast.error("Impossible de créer cette liste."); return; }
    toast.success("Liste créée !");
    setShowNew(false);
    setNewName(""); setNewDesc("");
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await db.from("listes").delete().eq("id", id);
    if (error) { toast.error("Impossible de supprimer cette liste."); return; }
    toast.success("Liste supprimée.");
    load();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mes listes</h1>
            <p className="text-sm text-muted-foreground">
              Organisez vos contacts en groupes pour mieux travailler.
              {listes.length > 0 && ` ${totalContacts} contacts répartis dans ${listes.length} liste${listes.length > 1 ? "s" : ""}.`}
            </p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-cta text-sm py-2.5 px-4 shrink-0">
            <Plus size={14} /> Nouvelle liste
          </button>
        </div>

        {/* Formulaire nouvelle liste */}
        {showNew && (
          <div className="card-surface p-5 mb-5 border-2" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <h2 className="font-semibold text-foreground mb-3">Créer une nouvelle liste</h2>
            <input type="text" placeholder="Nom de la liste *" value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-3"
              autoFocus />
            <input type="text" placeholder="Description (optionnel)" value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition mb-3" />
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={saving || newName.trim().length < 2}
                className="btn-cta text-sm py-2.5 px-5 disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Création…</> : "Créer la liste"}
              </button>
              <button onClick={() => { setShowNew(false); setNewName(""); setNewDesc(""); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Explication */}
        <div className="p-4 rounded-xl bg-muted mb-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">À quoi sert une liste ?</strong>
          {" "}Une liste vous permet de regrouper des contacts selon un objectif commun :
          une mission, une campagne, un import, ou un critère que vous choisissez.
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Rechercher une liste…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <ListOrdered size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium mb-1">Aucune liste trouvée</p>
            <p className="text-sm text-muted-foreground mb-4">Créez votre première liste pour organiser vos contacts.</p>
            <button onClick={() => setShowNew(true)} className="btn-cta text-sm py-2.5 px-5 inline-flex">
              <Plus size={14} /> Créer une liste
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((liste) => (
              <div key={liste.id} className="card-surface p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--muted))" }}>
                      <ListOrdered size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{liste.nom}</p>
                      {liste.description && <p className="text-xs text-muted-foreground">{liste.description}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {liste.contact_count} contact{liste.contact_count !== 1 ? "s" : ""}
                    </span>
                    <span>· {formatDate(liste.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/campagnes" className="text-xs font-medium px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      Lancer une campagne
                    </Link>
                    <button
                      onClick={() => handleDelete(liste.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
