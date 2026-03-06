import UserLayout from "@/components/layout/UserLayout";
import {
  User, CreditCard, Bell, Shield, ChevronRight, LogOut,
  CheckCircle2, Clock, AlertCircle, XCircle, Tag, Loader2, ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; badge: string; icon: typeof CheckCircle2; description: string }> = {
  active: { label: "Actif", badge: "badge-success", icon: CheckCircle2, description: "Votre abonnement est en cours." },
  trialing: { label: "Essai", badge: "badge-info", icon: Clock, description: "Vous êtes en période d'essai." },
  promo_active: { label: "Accès invitation", badge: "badge-success", icon: Tag, description: "Votre accès via code d'invitation est actif." },
  promo_expired: { label: "Invitation expirée", badge: "badge-muted", icon: Clock, description: "Votre accès via invitation a expiré." },
  past_due: { label: "Paiement en attente", badge: "badge-warning", icon: AlertCircle, description: "Un paiement est en attente. Vérifiez votre moyen de paiement." },
  canceled: { label: "Annulé", badge: "badge-muted", icon: XCircle, description: "Votre abonnement a été annulé." },
  none: { label: "Aucun abonnement", badge: "badge-muted", icon: XCircle, description: "Vous n'avez pas encore d'abonnement actif." },
  free: { label: "Gratuit", badge: "badge-success", icon: CheckCircle2, description: "Votre accès est gratuit en tant qu'apporteur d'affaires." },
};

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const { status, subscriptionEnd, cancelAtPeriodEnd, accessType, loading, openBillingPortal, startCheckout } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const initials = profile?.prenom
    ? profile.prenom.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  const displayName = profile?.prenom || user?.email?.split("@")[0] || "Utilisateur";
  const displayEmail = user?.email || "";
  const roleLabel = profile?.role === "entreprise" ? "Entreprise" : profile?.role === "admin" ? "Admin" : "Apporteur d'affaires";

  const statusInfo = STATUS_LABELS[accessType === "free" ? "free" : status] || STATUS_LABELS["none"];
  const StatusIcon = statusInfo.icon;

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

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
              <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${isAccessActive(status) ? "bg-success-light" : "bg-muted/50"}`}>
                <StatusIcon size={16} className={`mt-0.5 shrink-0 ${isAccessActive(status) ? "text-success" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm text-foreground">{statusInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{statusInfo.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {accessType === "stripe" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tarif</span>
                    <span className="font-medium text-foreground">29€ TTC / mois</span>
                  </div>
                )}
                {subscriptionEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {cancelAtPeriodEnd ? "Accès jusqu'au" :
                       accessType === "promo" ? "Invitation valide jusqu'au" :
                       "Prochaine échéance"}
                    </span>
                    <span className="font-medium text-foreground">{formatDate(subscriptionEnd)}</span>
                  </div>
                )}
                {accessType === "free" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coût</span>
                    <span className="font-medium text-success">Gratuit</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* Active subscription: show portal */}
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
                {/* No subscription / expired: CTA to subscribe */}
                {(status === "none" || status === "canceled" || status === "promo_expired") && profile?.role === "entreprise" && (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="btn-cta text-sm flex items-center justify-center gap-2"
                  >
                    {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    Activer mon abonnement — 29€ / mois
                  </button>
                )}
                {/* Past due: go to portal */}
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
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prénom</span>
              <span className="font-medium text-foreground">{profile?.prenom || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">E-mail</span>
              <span className="font-medium text-foreground">{displayEmail}</span>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="card-surface p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Sécurité</h2>
          </div>
          <button className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Modifier le mot de passe
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
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
