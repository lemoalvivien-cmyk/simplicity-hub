import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  published: boolean;
}

const INITIAL_ITEMS: FaqItem[] = [
  { id: 1, question: "Comment modifier mon mot de passe ?", answer: "Allez dans Mon compte, puis cliquez sur Modifier le mot de passe.", category: "Compte", published: true },
  { id: 2, question: "Qu'est-ce qu'un code d'invitation ?", answer: "Un code unique donnant 12 mois d'accès gratuit.", category: "Codes promo", published: true },
  { id: 3, question: "Comment annuler mon abonnement ?", answer: "Dans Mon compte → Abonnement, cliquez sur Annuler.", category: "Abonnement", published: true },
  { id: 4, question: "Mes données sont-elles sécurisées ?", answer: "Oui. Données hébergées en Europe, chiffrées.", category: "Sécurité", published: false },
];

export default function AdminHelpContent() {
  const [items, setItems] = useState<FaqItem[]>(INITIAL_ITEMS);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newCat, setNewCat] = useState("Compte");

  const togglePublish = (id: number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, published: !item.published } : item));
  };

  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const createItem = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setItems((prev) => [...prev, {
      id: Date.now(),
      question: newQ,
      answer: newA,
      category: newCat,
      published: false,
    }]);
    setNewQ(""); setNewA(""); setShowCreate(false);
  };

  return (
    <AdminLayout title="Base d'aide" subtitle="Gérez les questions fréquentes affichées aux utilisateurs.">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card text-center">
          <p className="font-display text-2xl font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground">Articles total</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-display text-2xl font-bold text-success">{items.filter(i => i.published).length}</p>
          <p className="text-xs text-muted-foreground">Publiés</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-display text-2xl font-bold text-muted-foreground">{items.filter(i => !i.published).length}</p>
          <p className="text-xs text-muted-foreground">Brouillons</p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="btn-cta text-sm px-4 py-2 flex items-center gap-2"
        >
          <Plus size={15} />
          Ajouter une question
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-surface p-5 mb-4 border-2 border-accent/30 animate-fade-in space-y-3">
          <p className="font-semibold text-foreground text-sm">Nouvelle question</p>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Catégorie</label>
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {["Compte", "Codes promo", "Abonnement", "Paiement", "Sécurité", "Utilisation"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Question</label>
            <input type="text" value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Comment...?" className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Réponse</label>
            <textarea value={newA} onChange={(e) => setNewA(e.target.value)} rows={3} placeholder="La réponse claire et simple..." className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={createItem} className="btn-primary text-sm px-4 py-2">Sauvegarder</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted">Annuler</button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="card-surface overflow-hidden">
        {items.map((item, i) => (
          <div key={item.id} className={`border-b border-border last:border-0 ${!item.published ? "opacity-60" : ""}`}>
            <div
              className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge-muted">{item.category}</span>
                  {!item.published && <span className="badge-warning">Brouillon</span>}
                </div>
                <p className="font-medium text-foreground text-sm">{item.question}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePublish(item.id); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${item.published ? "bg-success-light text-success" : "bg-muted text-muted-foreground hover:bg-muted"}`}
                >
                  {item.published ? "Publié" : "Publier"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                {expanded === item.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </div>
            {expanded === item.id && (
              <div className="px-5 pb-4 animate-fade-in">
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
