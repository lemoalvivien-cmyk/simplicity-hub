/**
 * ADA Control Panel — Autonomous Deal Agents Dashboard
 * Live state machine + transcriptions + human oversight CTAs
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Phone, PhoneOff, Shield, CheckCircle2, XCircle,
  Zap, TrendingUp, Clock, FileText, Mic, AlertTriangle,
  ChevronRight, Eye, DollarSign, Activity, Loader2,
  CircleCheck, Target, MessageSquare, Volume2, X,
} from "lucide-react";
import { useADASessions, ADASession, ADATranscription, ADAState } from "@/hooks/useADASessions";
import UserLayout from "@/components/layout/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ── State colors & labels ──────────────────────────────────────────────────

const STATE_META: Record<ADAState, { label: string; color: string; icon: React.ElementType; pulse?: boolean }> = {
  idle:                    { label: "Inactif",            color: "hsl(var(--muted-foreground))", icon: Clock },
  scanning:                { label: "Scan ETG…",          color: "hsl(210 88% 68%)",             icon: Activity,    pulse: true },
  preparing_script:        { label: "Script adaptatif…",  color: "hsl(210 88% 68%)",             icon: FileText,    pulse: true },
  awaiting_consent:        { label: "Attente consentement", color: "hsl(38 95% 52%)",             icon: Shield },
  calling:                 { label: "Appel en cours",     color: "hsl(152 62% 52%)",             icon: Phone,       pulse: true },
  negotiating:             { label: "Négociation live",   color: "hsl(152 62% 52%)",             icon: MessageSquare, pulse: true },
  awaiting_human_validation: { label: "⚠ Valider l'appel", color: "hsl(38 95% 52%)",             icon: Eye },
  generating_contract:     { label: "Contrat Stripe…",   color: "hsl(210 88% 68%)",             icon: FileText,    pulse: true },
  awaiting_final_closing:  { label: "⚡ Confirmer closing", color: "hsl(var(--accent))",          icon: Zap },
  closed:                  { label: "Deal closé ✓",       color: "hsl(152 62% 52%)",             icon: CheckCircle2 },
  abandoned:               { label: "Abandonné",          color: "hsl(0 65% 55%)",               icon: XCircle },
  error:                   { label: "Erreur",             color: "hsl(0 65% 55%)",               icon: AlertTriangle },
};

const ACTIVE_STATES: ADAState[] = ["scanning", "preparing_script", "awaiting_consent", "calling", "negotiating", "awaiting_human_validation", "generating_contract", "awaiting_final_closing"];

// ── New Session Form ───────────────────────────────────────────────────────

function NewSessionForm({ onStart }: { onStart: (p: { target_name: string; target_phone?: string; target_email?: string }) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Nom de la cible requis"); return; }
    onStart({ target_name: name.trim(), target_phone: phone || undefined, target_email: email || undefined });
    setName(""); setPhone(""); setEmail(""); setOpen(false);
  };

  return (
    <div>
      {!open ? (
        <motion.button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 64%))" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Zap size={15} /> Lancer ADA
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "hsl(218 65% 8% / 0.97)", border: "1px solid hsl(218 45% 20% / 0.6)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-white text-sm">Nouvelle session IA</p>
            <button onClick={() => setOpen(false)}><X size={14} style={{ color: "hsl(var(--muted-foreground))" }} /></button>
          </div>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du prospect *" className="h-9 text-sm" />
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 XX XX XX XX" className="h-9 text-sm" />
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@prospect.com" className="h-9 text-sm" type="email" />
          <Button onClick={handleSubmit} size="sm" className="w-full font-bold">
            <Bot size={14} /> Lancer mon assistant
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ── Session Card ───────────────────────────────────────────────────────────

function SessionCard({
  session,
  isActive,
  onSelect,
}: {
  session: ADASession;
  isActive: boolean;
  onSelect: () => void;
}) {
  const meta = STATE_META[session.state];
  const Icon = meta.icon;
  const isHot = ACTIVE_STATES.includes(session.state);

  return (
    <motion.div
      onClick={onSelect}
      className="relative cursor-pointer rounded-xl p-4 transition-all"
      style={{
        background: isActive ? "hsl(var(--accent) / 0.08)" : "hsl(218 65% 7% / 0.8)",
        border: `1px solid ${isActive ? "hsl(var(--accent) / 0.4)" : "hsl(218 45% 18% / 0.5)"}`,
      }}
      whileHover={{ scale: 1.01 }}
      layout
    >
      {isHot && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: meta.color }} />
      )}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${meta.color.replace(")", " / 0.12)")}`, border: `1px solid ${meta.color.replace(")", " / 0.3)")}` }}
        >
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{session.target_name}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
          {session.contract_amount && (
            <p className="text-[10px] mt-1" style={{ color: "hsl(152 62% 52%)" }}>
              {session.contract_amount.toLocaleString("fr-FR")}€ · Commission: {((session.contract_amount ?? 0) * 0.07).toFixed(0)}€
            </p>
          )}
          <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {new Date(session.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <ChevronRight size={12} style={{ color: "hsl(var(--muted-foreground))", marginTop: 4 }} />
      </div>
    </motion.div>
  );
}

// ── Transcription Feed ─────────────────────────────────────────────────────

function TranscriptionFeed({ transcriptions }: { transcriptions: ADATranscription[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [transcriptions.length]);

  const speakerColors: Record<string, string> = {
    agent:   "hsl(210 88% 68%)",
    prospect: "hsl(152 62% 52%)",
    system:  "hsl(var(--muted-foreground))",
  };

  if (!transcriptions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <MessageSquare size={28} style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
        <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Transcriptions live apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
      {transcriptions.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: t.speaker === "agent" ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className={`flex gap-2.5 ${t.speaker === "system" ? "justify-center" : t.speaker === "agent" ? "justify-start" : "justify-end"}`}
        >
          {t.speaker === "system" ? (
            <span className="text-[9px] px-3 py-1 rounded-full"
              style={{ background: "hsl(218 45% 18% / 0.8)", color: "hsl(var(--muted-foreground))" }}>
              {t.text}
            </span>
          ) : (
            <div
              className="max-w-[80%] px-3 py-2 rounded-xl"
              style={{
                background: t.speaker === "agent" ? "hsl(210 88% 68% / 0.1)" : "hsl(152 62% 52% / 0.1)",
                border: `1px solid ${speakerColors[t.speaker].replace(")", " / 0.2)")}`,
              }}
            >
              <p className="text-[9px] font-bold mb-0.5" style={{ color: speakerColors[t.speaker] }}>
                {t.speaker === "agent" ? "🤖 Agent ADA" : "👤 Prospect"}
                {t.is_key_moment && t.key_moment_type && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[8px]"
                    style={{ background: "hsl(38 95% 52% / 0.15)", color: "hsl(38 95% 52%)" }}>
                    {t.key_moment_type.replace("_", " ")}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-white/85 leading-relaxed">{t.text}</p>
            </div>
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ── Human Oversight Panel ─────────────────────────────────────────────────

function HumanOversightPanel({
  session,
  onValidate,
  onClose,
  loading,
}: {
  session: ADASession;
  onValidate: (amount: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(session.contract_amount?.toString() ?? "");

  if (session.state === "awaiting_human_validation") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 space-y-3"
        style={{ background: "hsl(38 95% 52% / 0.08)", border: "1px solid hsl(38 95% 52% / 0.35)" }}
      >
        <div className="flex items-center gap-2">
          <Eye size={16} style={{ color: "hsl(38 95% 52%)" }} />
          <p className="font-bold text-sm" style={{ color: "hsl(38 95% 52%)" }}>Oversight humain requis — Valider l'appel</p>
        </div>
        <p className="text-[11px] text-white/60">Signal d'achat détecté. Confirmez le montant et validez pour générer le contrat Stripe.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
            <Input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Montant en €"
              className="pl-8 h-9 text-sm"
              type="number"
            />
          </div>
          <Button
            onClick={() => onValidate(parseFloat(amount) || 0)}
            disabled={loading || !amount}
            size="sm"
            className="font-bold px-5"
            style={{ background: "hsl(38 95% 52%)", color: "hsl(0 0% 0%)" }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Valider l'appel
          </Button>
        </div>
      </motion.div>
    );
  }

  if (session.state === "awaiting_final_closing") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 space-y-3"
        style={{ background: "hsl(var(--accent) / 0.08)", border: "1px solid hsl(var(--accent) / 0.4)" }}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: "hsl(var(--accent))" }} />
          <p className="font-bold text-sm" style={{ color: "hsl(var(--accent))" }}>Confirmer le closing final</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-3" style={{ background: "hsl(218 65% 10% / 0.8)" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Montant deal</p>
            <p className="font-bold text-white text-sm mt-0.5">{(session.contract_amount ?? 0).toLocaleString("fr-FR")}€</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "hsl(152 62% 48% / 0.1)" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(152 62% 52%)" }}>Commission 7%</p>
            <p className="font-bold text-sm mt-0.5" style={{ color: "hsl(152 62% 52%)" }}>
              {((session.contract_amount ?? 0) * 0.07).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
            </p>
          </div>
        </div>
        {session.stripe_payment_link && (
          <a
            href={session.stripe_payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg"
            style={{ background: "hsl(218 65% 12%)", color: "hsl(210 88% 68%)" }}
          >
            <FileText size={12} /> Voir contrat Stripe <ChevronRight size={11} />
          </a>
        )}
        <Button
          onClick={onClose}
          disabled={loading}
          className="w-full font-bold"
          style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(38 100% 64%))", color: "hsl(0 0% 0%)" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CircleCheck size={14} />}
          Confirmer le closing
        </Button>
      </motion.div>
    );
  }

  return null;
}

// ── Pipeline Stats ─────────────────────────────────────────────────────────

function PipelineStats({ sessions }: { sessions: ADASession[] }) {
  const active  = sessions.filter(s => ACTIVE_STATES.includes(s.state)).length;
  const closed  = sessions.filter(s => s.state === "closed").length;
  const revenue = sessions.filter(s => s.state === "closed").reduce((acc, s) => acc + (s.contract_amount ?? 0), 0);
  const commission = revenue * 0.07;

  const stats = [
    { label: "Sessions actives", value: active, color: "hsl(38 95% 52%)", icon: Activity },
    { label: "Deals closés",     value: closed, color: "hsl(152 62% 52%)", icon: Target },
    { label: "Revenue total",    value: `${revenue.toLocaleString("fr-FR")}€`, color: "hsl(210 88% 68%)", icon: TrendingUp },
    { label: "Commission 7%",    value: `${commission.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€`, color: "hsl(var(--accent))", icon: DollarSign },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: "hsl(218 65% 7% / 0.9)", border: "1px solid hsl(218 45% 18% / 0.5)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: s.color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
            </div>
            <p className="font-bold text-white text-xl">{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ADAControlPanel() {
  const {
    sessions, activeSession, transcriptions, nodeEvents,
    loading, actionLoading, startSession, giveConsent,
    validateCall, confirmClosing, abandonSession, synthesizeVoice,
    fetchSessionDetail, setActiveSession,
  } = useADASessions();

  const [prospectInput, setProspectInput] = useState("");
  const [convoHistory, setConvoHistory] = useState<{ role: string; content: string }[]>([]);

  const handleStart = async (params: { target_name: string; target_phone?: string; target_email?: string }) => {
    const result = await startSession(params);
    if (result?.session_id) {
      // Auto-synthesize RGPD preamble
      setTimeout(() => synthesizeVoice(result.session_id, "", true), 500);
    }
  };

  const meta = activeSession ? STATE_META[activeSession.state] : null;

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--accent) / 0.12)", border: "1px solid hsl(var(--accent) / 0.3)" }}
              >
                <Bot size={18} style={{ color: "hsl(var(--accent))" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-none">ADA Control Panel</h1>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] mt-0.5" style={{ color: "hsl(var(--accent))" }}>
                  Autonomous Deal Agents · 95% Autonome
                </p>
              </div>
            </div>
            <p className="text-[12px] mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              ETG Scan → Script adaptatif → ElevenLabs Voice → Négociation IA → Contrat Stripe
            </p>
          </div>
          <NewSessionForm onStart={handleStart} />
        </div>

        {/* Stats */}
        <PipelineStats sessions={sessions} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sessions list */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Sessions ({sessions.length})
            </p>
            {loading && !sessions.length ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin" style={{ color: "hsl(var(--accent))" }} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 rounded-xl"
                style={{ background: "hsl(218 65% 7% / 0.5)", border: "1px dashed hsl(218 45% 20% / 0.5)" }}>
                <Bot size={24} style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
                <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>Lance ta première session ADA</p>
              </div>
            ) : (
              sessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  isActive={activeSession?.id === s.id}
                  onSelect={() => { setActiveSession(s); fetchSessionDetail(s.id); }}
                />
              ))
            )}
          </div>

          {/* Active session detail */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {activeSession ? (
                <motion.div
                  key={activeSession.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  {/* Session header */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "hsl(218 65% 8% / 0.97)", border: "1px solid hsl(218 45% 20% / 0.55)" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          {meta && (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: `${meta.color.replace(")", " / 0.12)")}`, border: `1px solid ${meta.color.replace(")", " / 0.3)")}` }}>
                              <meta.icon size={13} style={{ color: meta.color }} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{activeSession.target_name}</p>
                            {meta && <p className="text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</p>}
                          </div>
                        </div>
                        {activeSession.target_phone && (
                          <p className="text-[11px] mt-1 ml-9" style={{ color: "hsl(var(--muted-foreground))" }}>
                            📞 {activeSession.target_phone}
                            {activeSession.target_email && ` · ✉ ${activeSession.target_email}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {activeSession.state !== "closed" && activeSession.state !== "abandoned" && (
                          <button
                            onClick={() => synthesizeVoice(activeSession.id, activeSession.adaptive_script ? JSON.parse(activeSession.adaptive_script).script?.slice(0, 300) ?? "" : "")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={{ background: "hsl(210 88% 68% / 0.12)", color: "hsl(210 88% 68%)", border: "1px solid hsl(210 88% 68% / 0.25)" }}
                          >
                            <Volume2 size={11} /> Script
                          </button>
                        )}
                        {activeSession.state !== "closed" && activeSession.state !== "abandoned" && (
                          <button
                            onClick={() => abandonSession(activeSession.id, "abandoned_by_user")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                            style={{ background: "hsl(0 65% 55% / 0.12)", color: "hsl(0 65% 55%)", border: "1px solid hsl(0 65% 55% / 0.25)" }}
                          >
                            <PhoneOff size={11} /> Abandonner
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Consent gate */}
                    {activeSession.state === "awaiting_consent" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl p-4 mb-4 space-y-3"
                        style={{ background: "hsl(38 95% 52% / 0.06)", border: "1px solid hsl(38 95% 52% / 0.3)" }}
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={15} style={{ color: "hsl(38 95% 52%)" }} />
                          <p className="font-bold text-sm" style={{ color: "hsl(38 95% 52%)" }}>Consentement RGPD + Bloctel requis</p>
                        </div>
                        <p className="text-[11px] text-white/60">Le prospect a-t-il accepté d'être contacté et enregistré ?</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => giveConsent(activeSession.id, true)}
                            disabled={actionLoading === "consent"}
                            size="sm"
                            className="flex-1"
                            style={{ background: "hsl(152 62% 48%)", color: "white" }}
                          >
                            {actionLoading === "consent" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            Oui — Consentement accordé
                          </Button>
                          <Button
                            onClick={() => giveConsent(activeSession.id, false)}
                            disabled={actionLoading === "consent"}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle size={12} /> Non — Refus
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Human oversight */}
                    <HumanOversightPanel
                      session={activeSession}
                      onValidate={(amount) => validateCall(activeSession.id, amount)}
                      onClose={() => confirmClosing(activeSession.id)}
                      loading={actionLoading === "validate" || actionLoading === "close"}
                    />

                    {/* Node pipeline */}
                    {nodeEvents.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>Pipeline LangGraph</p>
                        <div className="flex flex-wrap gap-1.5">
                          {nodeEvents.map((n, i) => (
                            <span
                              key={n.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold"
                              style={{
                                background: n.success ? "hsl(152 62% 48% / 0.1)" : "hsl(0 65% 55% / 0.1)",
                                color: n.success ? "hsl(152 62% 52%)" : "hsl(0 65% 55%)",
                                border: `1px solid ${n.success ? "hsl(152 62% 48% / 0.2)" : "hsl(0 65% 55% / 0.2)"}`,
                              }}
                            >
                              {n.success ? "✓" : "✗"} {n.node_name.replace("_", " ")}
                              {n.duration_ms && <span className="opacity-60">· {n.duration_ms}ms</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transcriptions */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "hsl(218 65% 8% / 0.97)", border: "1px solid hsl(218 45% 20% / 0.55)" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Mic size={13} style={{ color: "hsl(var(--accent))" }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--accent))" }}>
                        Transcriptions live · {transcriptions.length} segments
                      </p>
                    </div>
                    <TranscriptionFeed transcriptions={transcriptions} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 rounded-2xl gap-4"
                  style={{ background: "hsl(218 65% 7% / 0.5)", border: "1px dashed hsl(218 45% 20% / 0.5)" }}
                >
                  <Bot size={40} style={{ color: "hsl(var(--muted-foreground) / 0.25)" }} />
                  <div className="text-center">
                    <p className="font-bold text-white/50 text-sm">Aucune session sélectionnée</p>
                    <p className="text-[11px] mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Lance une session ou sélectionne-en une existante
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
