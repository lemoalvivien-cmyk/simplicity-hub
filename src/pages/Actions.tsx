import { useState } from "react";
import UserLayout from "@/components/layout/UserLayout";
import {
  Phone, Mail, Send, CheckCircle2, Clock, AlertCircle,
  Zap, Filter, Plus, Search, RefreshCw, BarChart3,
  X, Loader2,
} from "lucide-react";
import {
  useUserActions, useMarkActionDone, useCreateUserAction,
  UserAction, UserActionType, UserActionPriority, UserActionStatus,
  CreateUserActionInput,
} from "@/hooks/useUserActions";

/* ─── TYPE CONFIG ──────────────────────────────────────────────── */
const typeConfig: Record<UserActionType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  appeler:  { label: "Appeler",   color: "hsl(var(--primary))",         bg: "hsl(var(--secondary))",      icon: <Phone      size={12} /> },
  envoyer:  { label: "Contacter", color: "hsl(var(--success))",         bg: "hsl(var(--success-light))",  icon: <Mail       size={12} /> },
  relancer: { label: "Relancer",  color: "hsl(var(--accent))",          bg: "hsl(var(--accent-light))",   icon: <Send       size={12} /> },
  valider:  { label: "Valider",   color: "hsl(var(--electric))",        bg: "hsl(var(--electric-light))", icon: <CheckCircle2 size={12} /> },
  verifier: { label: "Vérifier",  color: "hsl(var(--muted-foreground))",bg: "hsl(var(--muted))",          icon: <AlertCircle  size={12} /> },
  analyser: { label: "Analyser",  color: "hsl(var(--primary-glow))",    bg: "hsl(var(--secondary))",      icon: <BarChart3   size={12} /> },
};

const priorityConfig: Record<UserActionPriority, { label: string; dotStyle: React.CSSProperties; sectionIcon: React.ReactNode; borderStyle?: React.CSSProperties }> = {
  urgente: { label: "Urgentes",       dotStyle: { background: "hsl(var(--destructive))" },     sectionIcon: <Zap size={14} style={{ color: "hsl(var(--destructive))" }} />,        borderStyle: { borderLeft: "3px solid hsl(var(--destructive))" } },
  haute:   { label: "Priorité haute", dotStyle: { background: "hsl(var(--accent))" },          sectionIcon: <Zap size={14} style={{ color: "hsl(var(--accent))" }} />,             borderStyle: { borderLeft: "3px solid hsl(var(--accent))" } },
  normale: { label: "Aujourd'hui",    dotStyle: { background: "hsl(var(--primary))" },         sectionIcon: <Clock size={14} className="text-muted-foreground" />,                 borderStyle: undefined },
  basse:   { label: "Cette semaine",  dotStyle: { background: "hsl(var(--muted-foreground))" },sectionIcon: <Clock size={14} className="text-muted-foreground" />,                 borderStyle: undefined },
};

const PRIORITY_ORDER: UserActionPriority[] = ["urgente", "haute", "normale", "basse"];

/* ─── NEW ACTION FORM ──────────────────────────────────────────── */
function NewActionModal({ onClose }: { onClose: () => void }) {
  const createAction = useCreateUserAction();
  const [form, setForm] = useState<CreateUserActionInput>({
    type: "envoyer",
    title: "",
    description: "",
    priority: "normale",
    source: "manual",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createAction.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-foreground">Nouvelle action</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Titre *</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ex: Appeler Jean Martin"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as UserActionType }))}
              >
                {(Object.keys(typeConfig) as UserActionType[]).map(t => (
                  <option key={t} value={t}>{typeConfig[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Priorité</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as UserActionPriority }))}
              >
                <option value="urgente">🔴 Urgente</option>
                <option value="haute">🟠 Haute</option>
                <option value="normale">🔵 Normale</option>
                <option value="basse">⚪ Basse</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Contexte, notes…"
              value={form.description ?? ""}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={createAction.isPending || !form.title.trim()}
            className="btn-cta w-full py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createAction.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer l'action
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── ACTION CARD ──────────────────────────────────────────────── */
function ActionCard({ action, onDone }: { action: UserAction; onDone: () => void }) {
  const cfg = typeConfig[action.type];
  const pCfg = priorityConfig[action.priority];

  return (
    <div
      className="card-surface p-4 group"
      style={pCfg.borderStyle}
    >
      {/* Top badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.icon} {cfg.label}
        </span>
        {action.source === "openclaw" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: "hsl(var(--electric))", background: "hsl(var(--electric-light))" }}>
            <Zap size={10} /> OpenClaw
          </span>
        )}
        {action.source === "ai_recommendation" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: "hsl(var(--primary-glow))", background: "hsl(var(--secondary))" }}>
            <BarChart3 size={10} /> IA
          </span>
        )}
      </div>

      {/* Title + contact */}
      <p className="text-sm font-semibold text-foreground mb-0.5 leading-snug">{action.title}</p>
      {action.contact_name && (
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Phone size={10} /> {action.contact_name}
        </p>
      )}

      {/* Description */}
      {action.description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{action.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3">
        {action.status !== "terminee" && (
          <button
            onClick={onDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <CheckCircle2 size={12} /> Marquer terminé
          </button>
        )}
        {action.due_date && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock size={10} />
            {new Date(action.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── SECTION ──────────────────────────────────────────────────── */
function PrioritySection({ priority, actions, onDone }: {
  priority: UserActionPriority;
  actions: UserAction[];
  onDone: (id: string) => void;
}) {
  const { label, sectionIcon } = priorityConfig[priority];
  if (actions.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        {sectionIcon}
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{actions.length}</span>
      </div>
      <div className="space-y-3">
        {actions.map(a => <ActionCard key={a.id} action={a} onDone={() => onDone(a.id)} />)}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────────────── */
export default function Actions() {
  const [statusFilter, setStatusFilter] = useState<UserActionStatus[]>(["a_faire", "en_cours"]);
  const [typeFilter, setTypeFilter] = useState<UserActionType | "tous">("tous");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const { data: actions = [], isLoading, refetch } = useUserActions(statusFilter);
  const markDone = useMarkActionDone();

  const filtered = actions.filter(a => {
    if (typeFilter !== "tous" && a.type !== typeFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = PRIORITY_ORDER.reduce((acc, p) => {
    acc[p] = filtered.filter(a => a.priority === p);
    return acc;
  }, {} as Record<UserActionPriority, UserAction[]>);

  const totalRestantes = filtered.length;
  const urgentes = grouped["urgente"].length;

  const summaryStats = [
    { label: "Urgentes",      value: grouped["urgente"].length, dotColor: "hsl(var(--destructive))" },
    { label: "Priorité haute",value: grouped["haute"].length,   dotColor: "hsl(var(--accent))" },
    { label: "Normales",      value: grouped["normale"].length, dotColor: "hsl(var(--primary))" },
    { label: "Basses",        value: grouped["basse"].length,   dotColor: "hsl(var(--muted-foreground))" },
  ];

  return (
    <UserLayout jarvisContext="contact">
      {showNewModal && <NewActionModal onClose={() => setShowNewModal(false)} />}

      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">À faire</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Chargement…"
                : totalRestantes === 0
                  ? "Tout est traité. Bravo !"
                  : `${totalRestantes} action${totalRestantes > 1 ? "s" : ""}${urgentes > 0 ? `, dont ${urgentes} urgente${urgentes > 1 ? "s" : ""}` : ""}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn-cta text-sm py-2 px-4 flex items-center gap-1.5"
            >
              <Plus size={14} /> Nouvelle action
            </button>
          </div>
        </div>

        {/* Summary chips */}
        {!isLoading && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {summaryStats.map(({ label, value, dotColor }) => (
              <div key={label} className="card-surface p-2.5 text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: dotColor }} />
                <p className="font-display text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {([
            { label: "À faire", filter: ["a_faire", "en_cours"] as UserActionStatus[] },
            { label: "Terminées", filter: ["terminee"] as UserActionStatus[] },
            { label: "Toutes",  filter: ["a_faire", "en_cours", "terminee", "annulee"] as UserActionStatus[] },
          ]).map(({ label, filter }) => {
            const active = filter.join() === statusFilter.join();
            return (
              <button
                key={label}
                onClick={() => setStatusFilter(filter)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
                style={{
                  borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background:  active ? "hsl(var(--primary))" : "transparent",
                  color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            {(["tous", ...Object.keys(typeConfig)] as Array<UserActionType | "tous">).map(t => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className="text-xs font-medium px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background:  active ? "hsl(var(--primary))" : "transparent",
                    color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {t === "tous" ? "Tous" : typeConfig[t].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Chargement des actions…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && totalRestantes === 0 && (
          <div className="card-surface p-10 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "hsl(var(--success-light))" }}>
              <CheckCircle2 size={28} style={{ color: "hsl(var(--success))" }} />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              {search || typeFilter !== "tous" ? "Aucun résultat" : "Rien à faire !"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
              {search || typeFilter !== "tous"
                ? "Essayez d'autres filtres."
                : "Toutes vos actions sont à jour. Créez-en une ou laissez OpenClaw en suggérer."}
            </p>
            <button onClick={() => setShowNewModal(true)} className="btn-cta text-sm py-2.5 px-5 flex items-center gap-2 mx-auto">
              <Plus size={14} /> Nouvelle action
            </button>
          </div>
        )}

        {/* Grouped sections */}
        {!isLoading && PRIORITY_ORDER.map(p => (
          <PrioritySection
            key={p}
            priority={p}
            actions={grouped[p]}
            onDone={(id) => markDone.mutate(id)}
          />
        ))}
      </div>
    </UserLayout>
  );
}
