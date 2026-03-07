/**
 * Autonomie — Page de configuration centralisée
 * OpenClaw · Voix · Canaux · Niveau d'autonomie · Kill switch
 * Zéro jargon technique, UX premium
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Brain, Volume2, VolumeX, Wifi, WifiOff, Shield, Zap,
  ChevronRight, CheckCircle2, AlertTriangle, Smartphone,
  MessageSquare, Settings2, Bot, Play, Pause, Info,
  Sun, Moon, Mic, MicOff, RefreshCw, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { toast } from "sonner";

// ── Niveaux d'autonomie ───────────────────────────────────────────────────────
const AUTONOMIE_OPTIONS = [
  {
    value: "lecture",
    label: "Observation",
    emoji: "👁",
    desc: "Les agents observent. Ils ne font rien sans votre accord.",
  },
  {
    value: "preparation",
    label: "Préparation",
    emoji: "✍️",
    desc: "Ils préparent et suggèrent. Vous décidez avant chaque action.",
  },
  {
    value: "assiste",
    label: "Assisté",
    emoji: "🤝",
    desc: "Actions simples automatiques, actions importantes = votre accord.",
  },
  {
    value: "semi-auto",
    label: "Semi-autonome",
    emoji: "⚡",
    desc: "Les agents avancent seuls sauf pour les décisions critiques.",
  },
  {
    value: "etendu",
    label: "Autonomie étendue",
    emoji: "🚀",
    desc: "Liberté totale sauf actions irréversibles.",
  },
];

type VoicePreference = "premium" | "browser" | "off";

export default function Autonomie() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config OpenClaw
  const [autonomieLevel, setAutonomieLevel] = useState("preparation");
  const [killSwitch, setKillSwitch] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [validationRequired, setValidationRequired] = useState(true);
  const [agentsActifs, setAgentsActifs] = useState(0);
  const [pendingValidations, setPendingValidations] = useState(0);

  // Voix
  const [voicePreference, setVoicePreference] = useState<VoicePreference>("browser");
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [configRes, dossierRes, agentsRes, validRes] = await Promise.all([
        db.from("openclaw_config").select("*").eq("user_id", user.id).maybeSingle(),
        db.from("openclaw_dossier").select("validation_humaine_requise").eq("user_id", user.id).maybeSingle(),
        db.from("openclaw_agents").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "actif"),
        db.from("openclaw_validations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("statut", "en_attente"),
      ]);

      if (configRes.data) {
        setAutonomieLevel(configRes.data.autonomie_level || "preparation");
        setKillSwitch(configRes.data.kill_switch_global || false);
        setIsConnected(configRes.data.is_connected || false);
      }
      if (dossierRes.data) {
        setValidationRequired(dossierRes.data.validation_humaine_requise ?? true);
      }
      setAgentsActifs(agentsRes.count || 0);
      setPendingValidations(validRes.count || 0);

      // Charge la préférence voix depuis localStorage sécurisé (préférence UI uniquement, pas de token)
      const savedVoice = localStorage.getItem("wiinup_voice_preference") as VoicePreference | null;
      if (savedVoice) setVoicePreference(savedVoice);
      else if ("speechSynthesis" in window) setVoicePreference("browser");
      else setVoicePreference("off");

      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveAutonomie = async (level: string) => {
    if (!user) return;
    setSaving(true);
    setAutonomieLevel(level);
    await db.from("openclaw_config").upsert(
      { user_id: user.id, autonomie_level: level },
      { onConflict: "user_id" }
    );
    setSaving(false);
    toast.success("Niveau d'autonomie mis à jour.");
  };

  const handleToggleKillSwitch = async () => {
    if (!user) return;
    const next = !killSwitch;
    setKillSwitch(next);
    await db.from("openclaw_config").upsert(
      { user_id: user.id, kill_switch_global: next },
      { onConflict: "user_id" }
    );
    toast.success(next ? "Kill Switch activé — tous les agents sont stoppés." : "Agents réactivés.");
  };

  const handleVoiceChange = (pref: VoicePreference) => {
    setVoicePreference(pref);
    localStorage.setItem("wiinup_voice_preference", pref);
    toast.success("Préférence vocale enregistrée.");
  };

  const handleTestVoice = () => {
    if (!("speechSynthesis" in window)) return;
    setTestingVoice(true);
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance("Bonjour. JARVIS est prêt. Vos agents travaillent pour vous.");
    utter.lang = "fr-FR";
    utter.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith("fr")) || undefined;
    if (frVoice) utter.voice = frVoice;
    utter.onend = () => setTestingVoice(false);
    utter.onerror = () => setTestingVoice(false);
    window.speechSynthesis.speak(utter);
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
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Autonomie & Voix
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurez le cerveau, la voix et les canaux de WIINUP MAX.
          </p>
        </div>

        {/* ── OpenClaw — Statut ─────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">OpenClaw — Cerveau IA</h2>
          </div>

          <div className="space-y-3">
            {/* Statut connexion */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">État du cerveau</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{
                  background: isConnected ? "hsl(var(--success-light))" : "hsl(var(--muted))",
                  color: isConnected ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                }}
              >
                {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {isConnected ? "Connecté" : "Déconnecté"}
              </span>
            </div>

            {/* Agents actifs */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Agents actifs</span>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Bot size={13} className="text-primary" />
                {agentsActifs} agent{agentsActifs !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Validations en attente */}
            {pendingValidations > 0 && (
              <Link
                to="/validations"
                className="flex items-center justify-between p-3 rounded-xl transition-colors hover:opacity-90"
                style={{ background: "hsl(38 80% 92%)", border: "1px solid hsl(38 80% 75%)" }}
              >
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "hsl(38 80% 30%)" }}>
                  <AlertTriangle size={12} />
                  {pendingValidations} validation{pendingValidations > 1 ? "s" : ""} en attente
                </span>
                <ChevronRight size={13} style={{ color: "hsl(38 80% 30%)" }} />
              </Link>
            )}

            {/* Kill switch global */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-medium text-foreground">Kill Switch global</p>
                <p className="text-xs text-muted-foreground">
                  {killSwitch ? "Tous les agents sont stoppés." : "Les agents peuvent agir."}
                </p>
              </div>
              <button
                onClick={handleToggleKillSwitch}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                style={{
                  background: killSwitch ? "hsl(0 65% 40%)" : "hsl(var(--muted))",
                  color: killSwitch ? "white" : "hsl(var(--foreground))",
                }}
              >
                {killSwitch ? <Play size={12} /> : <Pause size={12} />}
                {killSwitch ? "Réactiver" : "Stopper tout"}
              </button>
            </div>
          </div>

          <Link to="/agents" className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-secondary transition-colors">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <Settings2 size={14} className="text-primary" />
              Gérer les agents en détail
            </span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </Link>
        </div>

        {/* ── Niveau d'autonomie ──────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Niveau d'autonomie</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            À quel point laissez-vous les agents agir sans vous ?
          </p>

          <div className="space-y-2">
            {AUTONOMIE_OPTIONS.map((opt) => {
              const isActive = autonomieLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSaveAutonomie(opt.value)}
                  disabled={saving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                    border: `1px solid ${isActive ? "hsl(var(--primary) / 0.4)" : "transparent"}`,
                  }}
                >
                  <span className="text-xl shrink-0">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {isActive && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Voix ──────────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Voix d'accueil</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            JARVIS peut vous accueillir vocalement sur chaque vue clé.
          </p>

          <div className="space-y-2 mb-4">
            {[
              {
                value: "premium" as VoicePreference,
                icon: Mic,
                label: "Voix premium",
                desc: "ElevenLabs — voix naturelle et expressive (requiert configuration admin).",
              },
              {
                value: "browser" as VoicePreference,
                icon: Volume2,
                label: "Voix navigateur",
                desc: "Synthèse vocale intégrée — gratuite, disponible partout.",
              },
              {
                value: "off" as VoicePreference,
                icon: VolumeX,
                label: "Silencieux",
                desc: "Pas de voix. Expérience textuelle uniquement.",
              },
            ].map((opt) => {
              const isActive = voicePreference === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleVoiceChange(opt.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? "hsl(var(--secondary))" : "hsl(var(--muted))",
                    border: `1px solid ${isActive ? "hsl(var(--primary) / 0.4)" : "transparent"}`,
                  }}
                >
                  <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {isActive && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {voicePreference === "browser" && (
            <button
              onClick={handleTestVoice}
              disabled={testingVoice}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              {testingVoice ? <RefreshCw size={14} className="animate-spin" /> : <Volume2 size={14} />}
              {testingVoice ? "Lecture en cours…" : "Tester la voix navigateur"}
            </button>
          )}

          {voicePreference === "premium" && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
            >
              <Info size={13} className="shrink-0 mt-0.5" />
              <p>
                La voix premium utilise ElevenLabs. Un administrateur doit configurer l'agent vocal
                depuis la page <strong>/agents → Connexion</strong>. En attendant, la voix navigateur est utilisée.
              </p>
            </div>
          )}
        </div>

        {/* ── Canaux connectés ───────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Canaux connectés</h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground flex items-center gap-2">
                <Zap size={13} className="text-primary" />
                Email
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "hsl(var(--success-light))", color: "hsl(var(--success))" }}>
                <CheckCircle2 size={10} className="inline mr-1" />
                Actif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground flex items-center gap-2">
                <MessageSquare size={13} className="text-muted-foreground" />
                WhatsApp Business
              </span>
              <Link to="/canaux" className="text-xs font-semibold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                Configurer
              </Link>
            </div>
          </div>
        </div>

        {/* ── App mobile ─────────────────────────────────────── */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}>
                <Smartphone size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Installer l'app mobile</p>
                <p className="text-xs text-muted-foreground">iOS & Android — accès natif</p>
              </div>
            </div>
            <Link to="/install" className="text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              style={{ background: "hsl(var(--secondary))", color: "hsl(var(--primary))" }}>
              Installer <ChevronRight size={11} />
            </Link>
          </div>
        </div>

        {/* ── Doctrine open source ────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, hsl(218 65% 10%), hsl(218 60% 13%))",
            border: "1px solid hsl(218 40% 25% / 0.5)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun size={15} className="text-yellow-400" />
            <p className="text-white/80 text-sm font-semibold">Architecture Open Source First</p>
          </div>
          <p className="text-white/50 text-xs leading-relaxed">
            OpenClaw est auto-hébergé et constitue le cerveau central de WIINUP MAX.
            Les services externes (ElevenLabs, etc.) ne sont que des options complémentaires.
            Le produit fonctionne intégralement sans eux.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Moon size={11} className="text-white/30" />
            <p className="text-white/30 text-xs italic">
              « Va te coucher, je prospecte pendant que tu dors. »
            </p>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
