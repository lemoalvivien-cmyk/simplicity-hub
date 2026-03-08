/**
 * Sources — réel depuis Supabase.
 * Compte les contacts par `origine` depuis la table `contacts`.
 * Honnêteté : les compteurs sont réels, pas simulés.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "@/components/layout/UserLayout";
import {
  Upload, UserPlus, Play, Send, Phone, MoreHorizontal,
  ChevronRight, CheckCircle2, Clock, ArrowRight, Sparkles, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SourceStats {
  import: number;
  manuel: number;
  introduction: number;
  campagne: number;
  telephone: number;
  autre: number;
  total: number;
}

const EMPTY: SourceStats = { import: 0, manuel: 0, introduction: 0, campagne: 0, telephone: 0, autre: 0, total: 0 };

export default function Sources() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SourceStats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("contacts")
        .select("origine")
        .eq("owner_user_id", user.id);

      const s = { ...EMPTY };
      (data || []).forEach((c: { origine: string | null }) => {
        const o = (c.origine || "autre") as keyof Omit<SourceStats, "total">;
        if (o in s) (s[o] as number)++;
        else s.autre++;
        s.total++;
      });
      setStats(s);
      setLoading(false);
    };
    load();
  }, [user]);

  const sources = [
    {
      id: "import",
      icon: Upload,
      label: "Import fichier",
      desc: "Contacts importés depuis un fichier CSV",
      comptes: stats.import,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--secondary))",
      action: "Importer un fichier",
      actionTo: "/contacts/import",
    },
    {
      id: "manuel",
      icon: UserPlus,
      label: "Ajout manuel",
      desc: "Contacts ajoutés un par un directement dans la plateforme",
      comptes: stats.manuel,
      color: "hsl(var(--success))",
      bg: "hsl(var(--success-light))",
      action: "Ajouter un contact",
      actionTo: "/contacts",
    },
    {
      id: "introduction",
      icon: Send,
      label: "Introduction",
      desc: "Personnes présentées via un apporteur d'affaires",
      comptes: stats.introduction,
      color: "hsl(220 80% 45%)",
      bg: "hsl(220 80% 95%)",
      action: "Voir les introductions",
      actionTo: "/introductions",
    },
    {
      id: "campagne",
      icon: Play,
      label: "Campagne",
      desc: "Contacts générés depuis une campagne de prospection",
      comptes: stats.campagne,
      color: "hsl(38 80% 30%)",
      bg: "hsl(var(--accent-light))",
      action: "Voir les campagnes",
      actionTo: "/campagnes",
    },
    {
      id: "telephone",
      icon: Phone,
      label: "Téléphone",
      desc: "Contacts issus de prospection téléphonique",
      comptes: stats.telephone,
      color: "hsl(280 60% 45%)",
      bg: "hsl(280 60% 95%)",
      action: "Importer des contacts",
      actionTo: "/contacts/import",
    },
    {
      id: "autre",
      icon: MoreHorizontal,
      label: "Autre source",
      desc: "Recommandation, réseau, salon, autre canal",
      comptes: stats.autre,
      color: "hsl(var(--muted-foreground))",
      bg: "hsl(var(--muted))",
    },
  ];

  const aTraiter = stats.total; // compteur honnête visible

  return (
    <UserLayout jarvisContext="contacts">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">D'où viennent vos contacts ?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chaque contact a une origine. Comprendre cette origine vous aide à mieux organiser votre prospection.
          </p>
        </div>

        {/* Stats globales — réelles */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Total contacts", value: stats.total,  color: "hsl(var(--foreground))", bg: "hsl(var(--muted))" },
                { label: "Import",         value: stats.import, color: "hsl(var(--primary))",    bg: "hsl(var(--secondary))" },
                { label: "Manuel",         value: stats.manuel, color: "hsl(38 80% 30%)",        bg: "hsl(var(--accent-light))" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                  <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="card-surface p-4 mb-5">
              <p className="text-sm font-semibold text-foreground mb-2">Pourquoi c'est important ?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En sachant d'où vient chaque contact, vous évitez les doublons, vous envoyez le bon message au bon moment et vous comprenez quelles sources vous rapportent le plus.
              </p>
            </div>

            {/* Sources */}
            <h2 className="font-display font-bold text-foreground text-base mb-3">Vos sources actuelles</h2>
            <div className="space-y-3 mb-6">
              {sources.map(s => {
                const hasContacts = s.comptes > 0;
                return (
                  <div key={s.id} className="card-surface p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                        <s.icon size={16} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground text-sm">{s.label}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                            style={{
                              background: hasContacts ? "hsl(var(--success-light))" : "hsl(var(--muted))",
                              color: hasContacts ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                            }}>
                            {hasContacts ? <><CheckCircle2 size={10} /> {s.comptes} contact{s.comptes > 1 ? "s" : ""}</> : <><Clock size={10} /> Vide</>}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{s.desc}</p>
                        {s.action && s.actionTo && (
                          <Link to={s.actionTo} className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors" style={{ color: s.color }}>
                            {s.action} <ChevronRight size={11} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action principale */}
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
                <p className="font-semibold text-foreground text-sm">Prochaine étape</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {aTraiter > 0
                  ? <>Vous avez <strong className="text-foreground">{aTraiter} contact{aTraiter > 1 ? "s" : ""}</strong>. Organisez-les en listes et lancez une campagne.</>
                  : "Importez vos premiers contacts pour démarrer."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to="/contacts" className="btn-cta text-sm py-2.5 px-4 flex-1 flex items-center justify-center gap-2">
                  <ArrowRight size={14} /> Voir mes contacts
                </Link>
                <Link to="/campagnes/nouvelle"
                  className="text-sm py-2.5 px-4 rounded-xl border border-border text-foreground hover:bg-muted transition-colors flex-1 text-center font-medium">
                  Créer une campagne
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
}
