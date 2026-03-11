import UserLayout from "@/components/layout/UserLayout";
import {
  User, CreditCard, Shield, ChevronRight, LogOut,
  CheckCircle2, Clock, AlertCircle, XCircle, Loader2,
  ExternalLink, Zap, Gift, Calendar, Timer, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive, getOfferLabel } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Account() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    status, subscriptionEnd, cancelAtPeriodEnd, accessType, offerType,
    launchAvailable, launchSlotsRemaining, loading, openBillingPortal, startCheckout
  } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const initials = profile?.prenom
    ? profile.prenom.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  const displayName = profile?.prenom || user?.email?.split("@")[0] || "Utilisateur";
  const displayEmail = user?.email || "";
  const roleLabel = profile?.role === "entreprise" ? "Entreprise" : profile?.role === "admin" ? "Admin" : "Apporteur d'affaires";

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

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;

  const daysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // ── Access block config ────────────────────────────────────────────────────
  const isPromo = accessType === "promo";
  const isFree = accessType === "free";
  const isStripe = accessType === "stripe";
  const isActive = isAccessActive(status);
  const endDate = formatDate(subscriptionEnd);
  const daysLeft = daysRemaining(subscriptionEnd);

  return (
    <UserLayout>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Mon compte</h1>
          <p className="text-muted-foreground text-sm">Vos informations et votre accès.</p>
        </div>

        {/* Avatar & identity */}
        <div className="flex items-center gap-4 card-surface p-5 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1 inline-block">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* ── ACCESS BLOCK ─────────────────────────────────────────────── */}
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
              {/* ── FREE (facilitateur) ── */}
              {isFree && (
                <div className="p-4 rounded-xl bg-success-light border border-success/20 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-success" />
                    <p className="font-semibold text-sm text-foreground">Accès gratuit permanent</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En tant qu'apporteur d'affaires, votre accès est toujours gratuit. Aucun abonnement nécessaire.
                  </p>
                </div>
              )}

              {/* ── PROMO ACTIVE ── */}
              {isPromo && isActive && (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/25 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={16} className="text-accent" />
                    <p className="font-semibold text-sm text-foreground">Accès gratuit de 12 mois actif</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Votre accès a été activé par code d'invitation. Aucun paiement n'est nécessaire.
                  </p>
                  {endDate && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar size={11} />
                          Valable jusqu'au
                        </span>
                        <span className="font-semibold text-foreground">{endDate}</span>
                      </div>
                      {daysLeft !== null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Timer size={11} />
                            Temps restant
                          </span>
                          <span className={`font-semibold ${daysLeft < 30 ? "text-destructive" : daysLeft < 90 ? "text-accent" : "text-success"}`}>
                            {daysLeft} jour{daysLeft > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STRIPE ACTIVE ── */}
              {isStripe && isActive && (
                <div className="p-4 rounded-xl bg-success-light border border-success/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-success" />
                    <p className="font-semibold text-sm text-foreground">
                      Abonnement actif — 99 € TTC / an
                    </p>
                  </div>
                  {endDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {cancelAtPeriodEnd ? "Accès jusqu'au" : "Prochain renouvellement"}
                      </span>
                      <span className="font-semibold text-foreground">{endDate}</span>
                    </div>
                  )}
                  {offerType === "launch" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-accent font-medium">
                      <Zap size={11} />
                      Offre de lancement — tarif bloqué à vie
                    </div>
                  )}
                </div>
              )}

              {/* ── NO ACCESS / EXPIRED ── */}
              {!isFree && !isActive && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle size={16} className="text-muted-foreground" />
                    <p className="font-semibold text-sm text-foreground">
                      {status === "promo_expired" ? "Accès invitation expiré" :
                       status === "canceled" ? "Abonnement annulé" :
                       "Aucun accès actif"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {status === "promo_expired"
                      ? "Votre accès gratuit de 12 mois est arrivé à expiration."
                      : "Vous n'avez pas encore d'accès actif à WIINUP MAX."}
                  </p>
                </div>
              )}

              {/* ── past_due ── */}
              {status === "past_due" && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-destructive" />
                    <p className="text-xs font-medium text-destructive">Un paiement est en attente — mettez à jour votre moyen de paiement.</p>
                  </div>
                </div>
              )}

              {/* ── CTA buttons ── */}
              <div className="flex flex-col gap-2">
                {isStripe && isActive && (
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
                {status === "past_due" && (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                  >
                    {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                    Mettre à jour mon paiement
                  </button>
                )}
                {!isFree && !isActive && profile?.role === "entreprise" && (
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="btn-cta w-full text-sm flex items-center justify-center gap-2"
                    >
                      {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      Activer mon accès — 99 € TTC / an
                    </button>
                  </div>
                )}
                {isPromo && isActive && daysLeft !== null && daysLeft < 60 && (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Renouveler avec un abonnement payant
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
              <span className="font-medium text-foreground truncate ml-4">{displayEmail}</span>
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
          <a
            href="/forgot-password"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Modifier le mot de passe
            <ChevronRight size={15} className="text-muted-foreground" />
          </a>
        </div>

        {/* Autonomie & IA */}
        <div className="card-surface p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Autonomie & OpenClaw</h2>
          </div>
          <Link
            to="/pilotage"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Configurer OpenClaw, la voix et les canaux
            <ChevronRight size={15} className="text-muted-foreground" />
          </Link>
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
