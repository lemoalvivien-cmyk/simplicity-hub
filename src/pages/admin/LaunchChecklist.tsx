/**
 * Launch Checklist — page /admin/launch-checklist
 * Checklist finale avant lancement public.
 * Protégée : admin uniquement.
 */
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Lock, Unlock, GitBranch, Shield, Zap, Globe, Mail, CreditCard,
  Rocket, PartyPopper,
} from "lucide-react";
import { CLOSED_BETA } from "@/lib/betaConfig";

interface CheckItem {
  id: string;
  category: string;
  label: string;
  detail: string;
  done: boolean;
  critical: boolean;
  icon: React.ElementType;
  actionUrl?: string;
  actionLabel?: string;
}

const INITIAL_ITEMS: CheckItem[] = [
  // Sécurité
  {
    id: "repo-private",
    category: "Sécurité",
    label: "Dépôt de code rendu 100% privé",
    detail: "GitHub → Settings → Danger Zone → Change visibility → Make private",
    done: false,
    critical: true,
    icon: Lock,
    actionUrl: "https://github.com",
    actionLabel: "Ouvrir GitHub",
  },
  {
    id: "git-purge",
    category: "Sécurité",
    label: "Historique purgé (fichiers .env supprimés)",
    detail: "git filter-repo --path .env --invert-paths --force && git push --force --all",
    done: false,
    critical: true,
    icon: GitBranch,
  },
  {
    id: "stripe-webhook",
    category: "Sécurité",
    label: "Clé de signature Stripe configurée",
    detail: "Stripe → Webhooks → Endpoint → Signing secret → Ajouter dans Lovable Cloud Vault",
    done: true,
    critical: true,
    icon: CreditCard,
    actionUrl: "https://dashboard.stripe.com/webhooks",
    actionLabel: "Ouvrir Stripe",
  },
  {
    id: "pre-commit",
    category: "Sécurité",
    label: "Vérifications automatiques actives (bloquent les clés secrètes)",
    detail: "Husky pre-commit — scan des clés Stripe + JWT avant chaque sauvegarde de code",
    done: true,
    critical: true,
    icon: Shield,
  },
  // Bêta & Lancement
  {
    id: "beta-toggle",
    category: "Bêta & Lancement",
    label: `Mode bêta : ${CLOSED_BETA ? "fermé (bêta active)" : "OUVERT AU PUBLIC ✓"}`,
    detail: "Modifier src/lib/betaConfig.ts → CLOSED_BETA = false pour ouvrir au public",
    done: !CLOSED_BETA,
    critical: true,
    icon: CLOSED_BETA ? Lock : Unlock,
  },
  {
    id: "quota-db",
    category: "Bêta & Lancement",
    label: "Nombre de places réglé à 100 en base de données",
    detail: "Vérifier la table launch_quota : total_slots doit valoir 100 avant l'ouverture",
    done: false,
    critical: true,
    icon: Zap,
  },
  {
    id: "sentry-dsn",
    category: "Bêta & Lancement",
    label: "Suivi des erreurs Sentry configuré (VITE_SENTRY_DSN)",
    detail: "sentry.io → New Project → React → copier le DSN dans les variables d'environnement Lovable",
    done: false,
    critical: false,
    icon: AlertTriangle,
    actionUrl: "https://sentry.io",
    actionLabel: "Ouvrir Sentry",
  },
  {
    id: "admin-beta",
    category: "Bêta & Lancement",
    label: "Page de gestion bêta opérationnelle (compteur + export)",
    detail: "Vérifier le chargement de la liste d'attente et l'export CSV",
    done: true,
    critical: false,
    icon: Mail,
    actionUrl: "/admin/beta",
    actionLabel: "Voir /admin/beta",
  },
  // Technique
  {
    id: "error-monitoring",
    category: "Technique",
    label: "Capture d'erreurs active (ErrorBoundary + surveillance globale)",
    detail: "Les erreurs JS non gérées sont capturées et enregistrées dans business_alerts",
    done: true,
    critical: false,
    icon: AlertTriangle,
  },
  {
    id: "analytics",
    category: "Technique",
    label: "Mesures du parcours complet (inscription → gain reçu)",
    detail: "Suivi de page actif + événements nommés dans analytics_events",
    done: true,
    critical: false,
    icon: Zap,
  },
  {
    id: "tanstack",
    category: "Technique",
    label: "Chargement des données optimisé sur tous les services",
    detail: "TanStack Query v5 — useQuery + useMutation avec mise en cache et gestion des erreurs",
    done: true,
    critical: false,
    icon: Zap,
  },
  {
    id: "e2e-tests",
    category: "Technique",
    label: "Tests automatisés prêts (inscription, paiement, mission)",
    detail: "3 scénarios Playwright dans tests/e2e/ avec 3 tentatives automatiques",
    done: true,
    critical: false,
    icon: CheckCircle2,
  },
  // Produit
  {
    id: "guarantee-badge",
    category: "Produit",
    label: "Garantie visible (tarification, paiement, accueil, pied de page)",
    detail: "Prix verrouillé à vie + Remboursé sous 30 jours affiché sur tous les boutons d'action",
    done: true,
    critical: false,
    icon: Shield,
  },
  {
    id: "onboarding-3",
    category: "Produit",
    label: "Accueil en 3 étapes (rôle → informations → première mission)",
    detail: "Checklist Première Victoire visible sur le tableau de bord + notification J1",
    done: true,
    critical: false,
    icon: CheckCircle2,
  },
  {
    id: "domain",
    category: "Produit",
    label: "Nom de domaine wiinupmax.com actif et sécurisé (HTTPS)",
    detail: "DNS A/CNAME → vérifier SSL, robots.txt et sitemap.xml",
    done: false,
    critical: false,
    icon: Globe,
    actionUrl: "https://wiinupmax.com",
    actionLabel: "Tester le site",
  },
];

const CATEGORIES = ["Sécurité", "Bêta & Lancement", "Technique", "Produit"];

export default function AdminLaunchChecklist() {
  const [items, setItems] = useState<CheckItem[]>(INITIAL_ITEMS);

  const toggle = (id: string) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const totalDone = items.filter(it => it.done).length;
  const totalCritical = items.filter(it => it.critical).length;
  const criticalDone = items.filter(it => it.critical && it.done).length;
  const pct = Math.round((totalDone / items.length) * 100);
  const isReadyToLaunch = criticalDone === totalCritical;
  const isFullyDone = totalDone === items.length;

  return (
    <AdminLayout
      title="Checklist de lancement"
      subtitle="Tous les points à valider avant d'ouvrir la plateforme au public"
    >
      <div className="max-w-2xl mx-auto space-y-6 pb-10">

        {/* 🎉 Fully done celebration banner */}
        {isFullyDone && (
          <div
            className="rounded-2xl border-2 p-6 text-center animate-fade-in"
            style={{
              background: "linear-gradient(135deg, hsl(152 62% 34% / 0.12), hsl(38 95% 50% / 0.08))",
              borderColor: "hsl(152 62% 40% / 0.4)",
            }}
          >
            <PartyPopper size={32} className="mx-auto mb-3" style={{ color: "hsl(38 95% 60%)" }} />
            <p className="font-display font-bold text-xl text-foreground mb-1">
              100% — Lancez maintenant !
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Chaque point est validé. La plateforme est prête pour accueillir vos premiers clients.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/admin/beta"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ background: "hsl(152 62% 34% / 0.2)", color: "hsl(152 62% 58%)", border: "1px solid hsl(152 62% 40% / 0.3)" }}
              >
                <Rocket size={14} /> Voir le tableau de bord bêta
              </a>
              <code
                className="px-3 py-2 rounded-lg text-xs font-mono"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
              >
                CLOSED_BETA = false → Publier
              </code>
            </div>
          </div>
        )}

        {/* Progress banner */}
        <div
          className="rounded-2xl border p-5"
          style={{
            background: isReadyToLaunch
              ? "hsl(152 62% 34% / 0.08)"
              : "hsl(38 95% 50% / 0.06)",
            borderColor: isReadyToLaunch
              ? "hsl(152 62% 34% / 0.25)"
              : "hsl(38 95% 50% / 0.25)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isReadyToLaunch
                ? <CheckCircle2 size={16} style={{ color: "hsl(152 62% 52%)" }} />
                : <Clock size={16} style={{ color: "hsl(38 95% 55%)" }} />
              }
              <span className="text-sm font-bold text-foreground">
                {isReadyToLaunch
                  ? "Tous les points critiques sont validés — Prêt à lancer !"
                  : `${totalCritical - criticalDone} point${totalCritical - criticalDone > 1 ? "s" : ""} critique${totalCritical - criticalDone > 1 ? "s" : ""} restant${totalCritical - criticalDone > 1 ? "s" : ""}`
                }
              </span>
            </div>
            <span className="text-sm font-black" style={{ color: isReadyToLaunch ? "hsl(152 62% 52%)" : "hsl(38 95% 55%)" }}>
              {totalDone}/{items.length}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isReadyToLaunch
                  ? "linear-gradient(90deg, hsl(152 62% 40%), hsl(152 62% 60%))"
                  : "linear-gradient(90deg, hsl(var(--primary-glow)), hsl(var(--accent)))",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{pct}% complété</p>
        </div>

        {/* Sections */}
        {CATEGORIES.map(cat => {
          const catItems = items.filter(it => it.category === cat);
          const catDone = catItems.filter(it => it.done).length;
          return (
            <div key={cat} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">{cat}</h2>
                <span className="text-xs text-muted-foreground font-medium">{catDone}/{catItems.length}</span>
              </div>
              <div className="divide-y divide-border">
                {catItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggle(item.id)}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                        style={{
                          background: item.done
                            ? "hsl(152 62% 34% / 0.2)"
                            : "hsl(var(--muted))",
                          border: item.done
                            ? "1px solid hsl(152 62% 40% / 0.4)"
                            : "1px solid hsl(var(--border))",
                        }}
                      >
                        {item.done
                          ? <CheckCircle2 size={12} style={{ color: "hsl(152 62% 52%)" }} />
                          : <Clock size={12} className="text-muted-foreground" />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {item.label}
                          </p>
                          {item.critical && !item.done && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "hsl(0 72% 50% / 0.12)", color: "hsl(0 72% 60%)" }}
                            >
                              CRITIQUE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono leading-relaxed">
                          {item.detail}
                        </p>
                      </div>

                      {/* Icon + external link */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Icon size={14} className="text-muted-foreground" />
                        {item.actionUrl && (
                          <a
                            href={item.actionUrl}
                            target={item.actionUrl.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title={item.actionLabel}
                          >
                            <ExternalLink size={12} className="text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Critical items done → launch CTA */}
        {isReadyToLaunch && !isFullyDone && (
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ background: "hsl(152 62% 34% / 0.08)", borderColor: "hsl(152 62% 34% / 0.25)" }}
          >
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "hsl(152 62% 52%)" }} />
            <p className="font-display font-bold text-lg text-foreground mb-1">
              Points critiques validés — Vous pouvez lancer !
            </p>
            <p className="text-sm text-muted-foreground">
              Mettez <code className="bg-muted px-1 rounded">CLOSED_BETA = false</code> dans <code className="bg-muted px-1 rounded">betaConfig.ts</code> et publiez.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
