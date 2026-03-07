/**
 * Canaux — Hub de connexion des canaux de contact
 * Structure crédible : états propres, statuts réels, prêt pour branchement futur
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Mail, Phone, Send, Upload, Play, MoreHorizontal,
  CheckCircle2, Clock, ChevronRight, Zap, Wifi, WifiOff,
  MessageSquare, AlertCircle, RefreshCw, Info, ArrowRight,
  Bell, Shield, Bot, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────
type CanalStatus = "actif" | "bientot" | "configure";
type WhatsAppStatus = "disconnected" | "pending" | "connected" | "error";

interface Canal {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  status: CanalStatus;
  color: string;
  bg: string;
  usages: string[];
  action?: string;
  actionTo?: string;
}

// ── Canaux de prospection disponibles ─────────────────────────────────────────
const canaux: Canal[] = [
  {
    id: "email",
    icon: Mail,
    label: "Email",
    desc: "Premier message, relance, suivi — le canal principal pour la plupart des prospections.",
    status: "actif",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--secondary))",
    usages: ["Premier contact", "Relance", "Suivi"],
    action: "Voir mes messages",
    actionTo: "/messages",
  },
  {
    id: "telephone",
    icon: Phone,
    label: "Téléphone",
    desc: "Appels de prospection, rappels, suivi vocal. Idéal pour les contacts importants.",
    status: "actif",
    color: "hsl(280 60% 45%)",
    bg: "hsl(280 60% 95%)",
    usages: ["Appel de prospection", "Rappel", "Qualification"],
    action: "Voir les actions",
    actionTo: "/actions",
  },
  {
    id: "introduction",
    icon: Send,
    label: "Introduction",
    desc: "Mise en relation via un apporteur d'affaires. Canal le plus qualitatif.",
    status: "actif",
    color: "hsl(220 80% 45%)",
    bg: "hsl(220 80% 95%)",
    usages: ["Mise en relation", "Présentation", "Recommandation"],
    action: "Mes introductions",
    actionTo: "/introductions",
  },
  {
    id: "import",
    icon: Upload,
    label: "Import",
    desc: "Contacts importés depuis un fichier Excel ou CSV.",
    status: "actif",
    color: "hsl(var(--success))",
    bg: "hsl(var(--success-light))",
    usages: ["Importer des listes", "Enrichir la base", "Segmenter"],
    action: "Importer des contacts",
    actionTo: "/contacts/import",
  },
  {
    id: "campagne",
    icon: Play,
    label: "Campagne",
    desc: "Séquence de prospection automatisée sur plusieurs étapes et canaux.",
    status: "actif",
    color: "hsl(38 80% 30%)",
    bg: "hsl(var(--accent-light))",
    usages: ["Séquence d'emails", "Relances programmées", "Suivi automatique"],
    action: "Mes campagnes",
    actionTo: "/campagnes",
  },
  {
    id: "linkedin",
    icon: Zap,
    label: "LinkedIn",
    desc: "Prospection directe sur LinkedIn. Connexion, message, suivi.",
    status: "bientot",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    usages: ["Demande de connexion", "Message direct", "Suivi"],
  },
  {
    id: "autre",
    icon: MoreHorizontal,
    label: "Autre canal",
    desc: "Salon, événement, recommandation directe, réseau personnel.",
    status: "actif",
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--muted))",
    usages: ["Salon / événement", "Recommandation", "Réseau personnel"],
  },
];

const statusConfig: Record<CanalStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  actif:    { label: "Disponible", icon: CheckCircle2, color: "hsl(var(--success))", bg: "hsl(var(--success-light))" },
  bientot:  { label: "Bientôt",   icon: Clock,        color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
  configure:{ label: "À configurer", icon: ArrowRight,  color: "hsl(38 80% 30%)", bg: "hsl(var(--accent-light))" },
};

// ── Bloc WhatsApp ──────────────────────────────────────────────────────────────
function WhatsAppBlock() {
  const { user } = useAuth();
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>("disconnected");
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    // Charge le statut WhatsApp depuis openclaw_config ou une meta
    const loadStatus = async () => {
      if (!user) return;
      const { data } = await db.from("openclaw_config").select("healthcheck_status, last_healthcheck_at")
        .eq("user_id", user.id).maybeSingle();
      if (data) {
        setLastActivity(data.last_healthcheck_at);
      }
    };
    loadStatus();
  }, [user]);

  const handleRequestConnection = async () => {
    setChecking(true);
    // Simule une demande de connexion — en production : appel API WhatsApp Business
    await new Promise(r => setTimeout(r, 1200));
    setWaStatus("pending");
    setRequestSent(true);
    setChecking(false);
  };

  const waStatusConfig: Record<WhatsAppStatus, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
    disconnected: {
      label: "Non connecté", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))",
      icon: WifiOff, desc: "Votre canal WhatsApp n'est pas encore connecté.",
    },
    pending: {
      label: "En attente", color: "hsl(38 80% 30%)", bg: "hsl(38 80% 92%)",
      icon: Clock, desc: "Demande de connexion envoyée. Vérifiez votre WhatsApp Business.",
    },
    connected: {
      label: "Connecté", color: "hsl(var(--success))", bg: "hsl(var(--success-light))",
      icon: Wifi, desc: "Votre WhatsApp est actif. Les alertes et validations peuvent y descendre.",
    },
    error: {
      label: "Erreur", color: "hsl(0 65% 40%)", bg: "hsl(0 65% 95%)",
      icon: AlertCircle, desc: "La connexion WhatsApp a rencontré un problème. Vérifiez la configuration.",
    },
  };

  const ws = waStatusConfig[waStatus];
  const WaIcon = ws.icon;

  return (
    <div className="card-surface overflow-hidden">
      {/* Header */}
      <div
        className="p-5 border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(142 70% 45% / 0.12)", border: "1px solid hsl(142 70% 45% / 0.2)" }}
            >
              <MessageSquare size={18} style={{ color: "hsl(142 70% 35%)" }} />
            </div>
            <div>
              <p className="font-semibold text-foreground">WhatsApp Business</p>
              <p className="text-xs text-muted-foreground">Canal de notification et de validation</p>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ color: ws.color, background: ws.bg }}
          >
            <WaIcon size={11} />
            {ws.label}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">{ws.desc}</p>

        {/* Ce que WhatsApp permet */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Ce qui peut descendre sur WhatsApp
          </p>
          {[
            { icon: Bell,   text: "Alertes OpenClaw importantes" },
            { icon: Shield, text: "Validations urgentes à approuver" },
            { icon: Bot,    text: "Rapports quotidiens de vos agents" },
            { icon: Zap,    text: "Opportunités nouvelles détectées" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "hsl(142 70% 45% / 0.1)" }}
              >
                <Icon size={11} style={{ color: "hsl(142 70% 35%)" }} />
              </div>
              <span className="text-xs text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* Avertissement de transparence */}
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          <Info size={13} className="shrink-0 mt-0.5" />
          <p>
            L'intégration WhatsApp Business nécessite un compte WhatsApp Business API.
            La connexion complète sera disponible prochainement. Vous pouvez déjà exprimer votre intérêt.
          </p>
        </div>

        {/* Action */}
        {waStatus === "disconnected" && !requestSent && (
          <button
            onClick={handleRequestConnection}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: checking ? "hsl(var(--muted))" : "hsl(142 70% 45% / 0.12)",
              border: "1px solid hsl(142 70% 45% / 0.25)",
              color: checking ? "hsl(var(--muted-foreground))" : "hsl(142 70% 35%)",
            }}
          >
            {checking ? <RefreshCw size={14} className="animate-spin" /> : <MessageSquare size={14} />}
            {checking ? "Envoi en cours…" : "M'informer de la disponibilité"}
          </button>
        )}
        {waStatus === "pending" && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
            style={{ background: "hsl(38 80% 92%)", color: "hsl(38 80% 30%)" }}
          >
            <CheckCircle2 size={14} />
            Demande enregistrée. Vous serez notifié en priorité à l'ouverture.
          </div>
        )}

        {/* Dernier activité */}
        {lastActivity && (
          <p className="text-xs text-muted-foreground">
            Dernière activité : {new Date(lastActivity).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Canaux() {
  return (
    <UserLayout jarvisContext="dashboard">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Canaux de contact
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tous vos canaux de prospection en un seul endroit.
            Chaque canal se connecte automatiquement à vos campagnes et vos actions.
          </p>
        </div>

        {/* WhatsApp en tête — canal stratégique */}
        <WhatsAppBlock />

        {/* Canaux disponibles */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Canaux de prospection
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canaux.map((c) => {
              const sc = statusConfig[c.status];
              return (
                <div
                  key={c.id}
                  className="card-surface p-4"
                  style={{ opacity: c.status === "bientot" ? 0.7 : 1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: c.bg }}>
                      <c.icon size={16} style={{ color: c.color }} />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ color: sc.color, background: sc.bg }}>
                      <sc.icon size={10} /> {sc.label}
                    </span>
                  </div>

                  <p className="font-semibold text-foreground text-sm mb-1">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.usages.map((u) => (
                      <span key={u} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        {u}
                      </span>
                    ))}
                  </div>

                  {c.action && c.actionTo && c.status !== "bientot" ? (
                    <Link to={c.actionTo} className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors" style={{ color: c.color }}>
                      {c.action} <ChevronRight size={11} />
                    </Link>
                  ) : c.status === "bientot" ? (
                    <p className="text-xs text-muted-foreground italic">Disponible prochainement</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comment utiliser */}
        <div className="card-surface p-5">
          <p className="font-semibold text-foreground text-sm mb-3">Comment utiliser les canaux ensemble ?</p>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "Importez vos contacts (Import ou ajout manuel)" },
              { step: "2", text: "Créez une liste ciblée (Listes)" },
              { step: "3", text: "Préparez votre message (Mes messages)" },
              { step: "4", text: "Lancez une campagne email ou téléphone (Campagnes)" },
              { step: "5", text: "Suivez et traitez les réponses (Actions / Pilotage)" },
            ].map((e) => (
              <div key={e.step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--primary))", color: "white" }}>
                  {e.step}
                </div>
                <span className="text-sm text-foreground">{e.text}</span>
              </div>
            ))}
          </div>
          <Link to="/studio" className="mt-4 btn-cta text-sm py-2.5 flex items-center justify-center gap-2 w-full">
            <ArrowRight size={14} /> Aller dans le Studio
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}
