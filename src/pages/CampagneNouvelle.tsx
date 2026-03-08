/**
 * CampagneNouvelle — câblé à Supabase.
 * Lit les vraies listes depuis la table `listes`.
 * Crée une vraie campagne dans la table `campagnes` au lancement.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  ChevronRight, ChevronLeft, Check, Sparkles, Users, Mail,
  Phone, Play, Shield, Zap, Target, X, Loader2, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Etape = "nom" | "contacts" | "mode" | "canaux" | "lancement";

const ETAPES: { id: Etape; label: string }[] = [
  { id: "nom",       label: "Nom" },
  { id: "contacts",  label: "Contacts" },
  { id: "mode",      label: "Mode" },
  { id: "canaux",    label: "Canaux" },
  { id: "lancement", label: "Lancer" },
];

interface Liste {
  id: string;
  nom: string;
  // nombre de contacts récupéré via count
  nb?: number;
}

const CANAUX = [
  { id: "email",        label: "Email",        desc: "Premier contact ou relance par email",    icon: Mail,  dispo: true },
  { id: "telephone",    label: "Téléphone",     desc: "Appel ou rappel téléphonique",            icon: Phone, dispo: true },
  { id: "introduction", label: "Introduction",  desc: "Via un apporteur d'affaires",             icon: Users, dispo: false },
];

const MODES = [
  {
    id: "manuel",
    icon: Target,
    label: "Je gère tout moi-même",
    desc: "Vous voyez chaque action avant qu'elle se passe. Contrôle total.",
    badge: "Recommandé pour débuter",
    disabled: false,
  },
  {
    id: "assiste",
    icon: Sparkles,
    label: "Aidé par l'IA",
    desc: "L'IA vous suggère les prochaines actions. Vous validez avant chaque étape.",
    badge: null,
    disabled: false,
  },
  {
    id: "semi_auto",
    icon: Zap,
    label: "Semi-automatique",
    desc: "Les étapes simples se lancent automatiquement. Décisions importantes : vous seul.",
    badge: "Bientôt disponible",
    disabled: true,
  },
];

export default function CampagneNouvelle() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [etapeIdx, setEtapeIdx] = useState(0);
  const [nom, setNom] = useState("");
  const [objectif, setObjectif] = useState("");
  const [listeId, setListeId] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("manuel");
  const [canauxChoisis, setCanauxChoisis] = useState<string[]>(["email"]);

  const [listes, setListes] = useState<Liste[]>([]);
  const [loadingListes, setLoadingListes] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingListes(true);
      const { data } = await supabase
        .from("listes")
        .select("id, nom")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });
      setListes((data as Liste[] | null) || []);
      setLoadingListes(false);
    };
    load();
  }, [user]);

  const etape = ETAPES[etapeIdx].id;
  const isFirst = etapeIdx === 0;
  const isLast = etapeIdx === ETAPES.length - 1;

  const canNext = () => {
    if (etape === "nom")      return nom.trim().length > 0;
    if (etape === "contacts") return listeId !== null;
    if (etape === "canaux")   return canauxChoisis.length > 0;
    return true;
  };

  const toggleCanal = (id: string) => {
    setCanauxChoisis(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const listeChoisie = listes.find(l => l.id === listeId);

  const handleLancer = async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("campagnes").insert({
      owner_user_id: user.id,
      nom: nom.trim(),
      objectif: objectif.trim() || null,
      canal_principal: canauxChoisis[0] || "email",
      mode_action: mode,
      liste_id: listeId,
      statut: "brouillon",
    }).select("id").single();

    if (error || !data) {
      toast.error("Impossible de créer la campagne. Réessayez.");
      setSaving(false);
      return;
    }
    toast.success("Campagne créée !");
    navigate(`/campagnes/${data.id}`);
  };

  return (
    <UserLayout jarvisContext="campaign">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Nouvelle campagne</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Étape {etapeIdx + 1} sur {ETAPES.length}</p>
          </div>
          <button onClick={() => navigate("/campagnes")} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-1 mb-8">
          {ETAPES.map((e, i) => (
            <div key={e.id} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i < etapeIdx ? "hsl(var(--primary))" : i === etapeIdx ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted))" }} />
          ))}
        </div>

        {/* ── Étape 1 : Nom ── */}
        {etape === "nom" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Comment s'appelle cette campagne ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Choisissez un nom simple pour vous souvenir de l'objectif.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nom de la campagne</label>
                <input autoFocus type="text" placeholder="Ex : Prospection PME Novembre" value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Objectif (optionnel)</label>
                <input type="text" placeholder="Ex : Prendre des rendez-vous avec des DSI" value={objectif}
                  onChange={e => setObjectif(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Contacts ── */}
        {etape === "contacts" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Qui souhaitez-vous contacter ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Choisissez une liste existante ou importez de nouveaux contacts.</p>

            {loadingListes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : listes.length === 0 ? (
              <div className="p-5 rounded-xl bg-muted text-center">
                <AlertCircle size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Aucune liste disponible</p>
                <p className="text-xs text-muted-foreground mb-3">Créez d'abord une liste depuis la section Contacts → Listes.</p>
                <button onClick={() => navigate("/listes")}
                  className="text-xs font-semibold text-primary hover:underline">
                  Créer une liste →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                {listes.map(l => (
                  <button key={l.id} onClick={() => setListeId(l.id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: listeId === l.id ? "hsl(var(--secondary))" : "hsl(var(--card))",
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: listeId === l.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                        <Users size={14} style={{ color: listeId === l.id ? "white" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-left">{l.nom}</p>
                    </div>
                    {listeId === l.id && <Check size={16} style={{ color: "hsl(var(--primary))" }} />}
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => navigate("/contacts/import")}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
              Importer de nouveaux contacts d'abord
            </button>
          </div>
        )}

        {/* ── Étape 3 : Mode ── */}
        {etape === "mode" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Comment voulez-vous travailler ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Choisissez votre niveau de contrôle. Vous pouvez changer plus tard.</p>
            <div className="space-y-3">
              {MODES.map(m => (
                <button key={m.id} onClick={() => !m.disabled && setMode(m.id)} disabled={m.disabled}
                  className="w-full text-left p-4 rounded-xl border transition-all"
                  style={{
                    borderColor: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background: mode === m.id ? "hsl(var(--secondary))" : m.disabled ? "hsl(var(--muted)/0.4)" : "hsl(var(--card))",
                    opacity: m.disabled ? 0.6 : 1,
                    cursor: m.disabled ? "not-allowed" : "pointer",
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: mode === m.id ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                      <m.icon size={14} style={{ color: mode === m.id ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{m.label}</p>
                        {m.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: m.disabled ? "hsl(var(--muted))" : "hsl(var(--accent-light))", color: m.disabled ? "hsl(var(--muted-foreground))" : "hsl(38 80% 30%)" }}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    {mode === m.id && !m.disabled && <Check size={16} style={{ color: "hsl(var(--primary))" }} className="shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 4 : Canaux ── */}
        {etape === "canaux" && (
          <div>
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Par quel canal voulez-vous contacter ?</h2>
            <p className="text-sm text-muted-foreground mb-5">Vous pouvez en choisir plusieurs. On recommande de commencer par un seul.</p>
            <div className="space-y-3">
              {CANAUX.map(c => {
                const selected = canauxChoisis.includes(c.id);
                return (
                  <button key={c.id} onClick={() => c.dispo && toggleCanal(c.id)} disabled={!c.dispo}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: selected ? "hsl(var(--secondary))" : !c.dispo ? "hsl(var(--muted)/0.3)" : "hsl(var(--card))",
                      opacity: !c.dispo ? 0.6 : 1,
                      cursor: !c.dispo ? "not-allowed" : "pointer",
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: selected ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
                        <c.icon size={14} style={{ color: selected ? "white" : "hsl(var(--muted-foreground))" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.label}</p>
                          {!c.dispo && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Bientôt</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      {selected && <Check size={16} style={{ color: "hsl(var(--primary))" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Étape 5 : Lancement ── */}
        {etape === "lancement" && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "hsl(var(--secondary))" }}>
                <Play size={28} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">Tout est prêt.</h2>
              <p className="text-sm text-muted-foreground">Vérifiez les informations avant de créer la campagne.</p>
            </div>

            <div className="card-surface p-4 mb-4 space-y-3">
              {[
                { label: "Campagne",  value: nom || "Sans titre" },
                { label: "Liste",     value: listeChoisie ? listeChoisie.nom : "—" },
                { label: "Mode",      value: MODES.find(m => m.id === mode)?.label || "—" },
                { label: "Canaux",    value: canauxChoisis.join(", ") || "—" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-semibold text-foreground text-right">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl text-xs text-muted-foreground mb-5" style={{ background: "hsl(var(--muted))" }}>
              <Shield size={12} className="inline mr-1" style={{ color: "hsl(var(--success))" }} />
              La campagne sera créée en statut "Brouillon". Vous pourrez la lancer depuis son détail.
            </div>

            <button
              onClick={handleLancer}
              disabled={saving}
              className="w-full btn-cta py-3 text-sm flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Play size={15} />}
              {saving ? "Création en cours…" : "Créer la campagne"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={() => setEtapeIdx(i => Math.max(0, i - 1))}
            disabled={isFirst}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={16} /> Retour
          </button>
          {!isLast ? (
            <button
              onClick={() => setEtapeIdx(i => Math.min(ETAPES.length - 1, i + 1))}
              disabled={!canNext()}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40"
              style={{ background: "hsl(var(--primary))", color: "white" }}
            >
              Continuer <ChevronRight size={16} />
            </button>
          ) : null}
        </div>

      </div>
    </UserLayout>
  );
}
