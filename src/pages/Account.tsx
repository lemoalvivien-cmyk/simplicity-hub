import UserLayout from "@/components/layout/UserLayout";
import {
  User, CreditCard, Bell, Shield, ChevronRight, LogOut,
  CheckCircle2, Clock, AlertCircle, XCircle, Tag, Loader2, ExternalLink, Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive, getOfferLabel } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; icon: typeof CheckCircle2; description: string; bg: string; iconColor: string }> = {
  active: { label: "Actif", icon: CheckCircle2, description: "Votre abonnement est en cours.", bg: "bg-success-light", iconColor: "text-success" },
  trialing: { label: "Essai", icon: Clock, description: "Vous êtes en période d'essai.", bg: "bg-primary/10", iconColor: "text-primary" },
  promo_active: { label: "Accès invitation", icon: Tag, description: "Votre accès via code d'invitation est actif.", bg: "bg-success-light", iconColor: "text-success" },
  promo_expired: { label: "Invitation expirée", icon: Clock, description: "Votre accès via invitation a expiré.", bg: "bg-muted/50", iconColor: "text-muted-foreground" },
  past_due: { label: "Paiement en attente", icon: AlertCircle, description: "Un paiement est en attente. Vérifiez votre moyen de paiement.", bg: "bg-warning/10", iconColor: "text-warning" },
  canceled: { label: "Annulé", icon: XCircle, description: "Votre abonnement a été annulé.", bg: "bg-muted/50", iconColor: "text-muted-foreground" },
  none: { label: "Aucun abonnement", icon: XCircle, description: "Vous n'avez pas encore d'accès actif.", bg: "bg-muted/50", iconColor: "text-muted-foreground" },
  free: { label: "Gratuit", icon: CheckCircle2, description: "Votre accès est gratuit en tant qu'apporteur d'affaires.", bg: "bg-success-light", iconColor: "text-success" },
};

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const { status, subscriptionEnd, cancelAtPeriodEnd, accessType, offerType, launchAvailable, launchSlotsRemaining, loading, openBillingPortal, startCheckout } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const initials = profile?.prenom
    ? profile.prenom.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  const displayName = profile?.prenom || user?.email?.split("@")[0] || "Utilisateur";
  const displayEmail = user?.email || "";
  const roleLabel = profile?.role === "entreprise" ? "Entreprise" : profile?.role === "admin" ? "Admin" : "Apporteur d'affaires";

  const statusKey = accessType === "free" ? "free" : status;
  const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS["none"];
  const StatusIcon = statusInfo.icon;

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const offerDisplay = getOfferLabel(offerType ?? null, accessType);

  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mon compte</h1>
          <p className="text-muted-foreground text-sm">Gérez vos informations et votre abonnement.</p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 card-surface p-5 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{displayEmail}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1 inline-block">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Abonnement */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Accès & abonnement</h2>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
              <Loader2 size={14} className="animate-spin" />
              Vérification en cours…
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${statusInfo.bg}`}>
                <StatusIcon size={16} className={`mt-0.5 shrink-0 ${statusInfo.iconColor}`} />
                <div>
                  <p className="font-medium text-sm text-foreground">{statusInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{statusInfo.description}</p>
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                {/* Offer type */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type d'accès</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    {offerType === "launch" && <Zap size={12} className="text-accent" />}
                    {offerDisplay}
                  </span>
                </div>

                {subscriptionEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {cancelAtPeriodEnd ? "Accès jusqu'au" :
                       accessType === "promo" ? "Invitation valide jusqu'au" :
                       "Prochain renouvellement"}
                    </span>
                    <span className="font-medium text-foreground">{formatDate(subscriptionEnd)}</span>
                  </div>
                )}

                {accessType === "free" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coût</span>
                    <span className="font-medium text-success">Gratuit — toujours</span>
                  </div>
                )}

                {/* Launch slots remaining for new subscribers */}
                {!isAccessActive(status) && profile?.role === "entreprise" && launchAvailable && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/10 text-xs text-accent font-medium">
                    <Zap size={12} />
                    Plus que {launchSlotsRemaining} places à l'offre de lancement à 99 €
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {accessType === "stripe" && isAccessActive(status) && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      Gérer mon abonnement
                    </span>
                    <ChevronRight size={15} className="text-muted-foreground" />
                  </button>
                )}
                {(status === "none" || status === "canceled" || status === "promo_expired") && profile?.role === "entreprise" && (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="btn-cta text-sm flex items-center justify-center gap-2"
                  >
                    {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {launchAvailable ? "Activer — Offre lancement 99 € / an" : "Activer mon abonnement — 490 € / an"}
                  </button>
                )}
                {status === "past_due" && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full px-4 py-2.5 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                    Mettre à jour mon moyen de paiement
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profil */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Mon profil</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prénom</span>
              <span className="font-medium text-foreground">{profile?.prenom || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium text-foreground">{displayEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rôle</span>
              <span className="font-medium text-foreground">{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Sécurité</h2>
          </div>
          <button className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Modifier le mot de passe
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
        </div>

        {/* Autonomie & IA */}
        <div className="card-surface p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Autonomie & Voix</h2>
          </div>
          <a href="/autonomie" className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Configurer OpenClaw, la voix et les canaux
            <ChevronRight size={15} className="text-muted-foreground" />
          </a>
        </div>

        {/* Logout */}
        <div className="border-t border-border pt-5">
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
