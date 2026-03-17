import UserLayout from "@/components/layout/UserLayout";
import {
  User, CreditCard, Shield, ChevronRight, LogOut,
  CheckCircle2, Clock, AlertCircle, XCircle, Loader2,
  ExternalLink, Zap, Gift, Calendar, Timer, ShieldCheck,
  Download, Trash2, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, isAccessActive, getOfferLabel } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ── RGPD: Export my data ────────────────────────────── */
function RGPDExportButton({ userId }: { userId: string | undefined }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [{ data: profile }, { data: intros }, { data: gains }, { data: contacts }] =
        await Promise.all([
          supabase.from("profiles").select("id, email, prenom, role, onboarding_done, created_at").eq("id", userId).single(),
          (supabase.from("introductions") as any).select("id, contact_nom, statut, created_at").eq("facilitateur_id", userId).limit(500),
          (supabase.from("gains") as any).select("id, montant, statut, source, created_at").eq("facilitateur_id", userId).limit(500),
          (supabase.from("contacts") as any).select("id, prenom_nom, email, entreprise, created_at").eq("owner_user_id", userId).limit(500),
        ]);

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: userId,
        profile: profile ?? null,
        introductions: intros ?? [],
        gains: gains ?? [],
        contacts: contacts ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wiinupmax-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé ✓");
    } catch (err) {
      toast.error("Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading || !userId}
      className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
    >
      <span className="flex items-center gap-2">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Exporter mes données (JSON)
      </span>
      <ChevronRight size={15} className="text-muted-foreground" />
    </button>
  );
}

/* ── RGPD: Delete account ────────────────────────────── */
function RGPDDeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Soft-delete: mark profile as deleted. Hard-delete via cron after 30 days.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      await (supabase.from("profiles") as any).update({
        deletion_requested_at: new Date().toISOString(),
      }).eq("id", user.id);
      toast.success("Demande de suppression enregistrée. Votre compte sera supprimé sous 30 jours.");
      await onConfirm();
    } catch (err) {
      toast.error("Erreur — veuillez contacter notifications@wiinupmax.com");
      setLoading(false);
      setStep("idle");
    }
  };

  if (step === "confirm") {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3">
        <p className="text-xs font-semibold text-destructive">
          ⚠️ Cette action est irréversible. Votre compte et toutes vos données seront supprimés définitivement dans 30 jours.
        </p>
        <div className="flex gap-2">
          <button onClick={() => setStep("idle")} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Confirmer la suppression
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
    >
      <span className="flex items-center gap-2">
        <Trash2 size={14} />
        Supprimer mon compte (RGPD art. 17)
      </span>
      <ChevronRight size={15} className="opacity-60" />
    </button>
  );
}

/* ── Refund Request Button ───────────────────────────────── */
function RefundRequestButton({ userId }: { userId: string | undefined }) {
  const [step, setStep] = useState<"idle" | "form" | "loading" | "done">("idle");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!userId) return;
    setStep("loading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("request-refund", {
        body: { reason },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (res.error) throw res.error;
      const result = res.data as { eligible: boolean; message: string };
      if (result.eligible) {
        toast.success(result.message);
        setStep("done");
      } else {
        toast.error(result.message);
        setStep("idle");
      }
    } catch {
      toast.error("Erreur lors de l'envoi. Contactez contact@wiinupmax.com");
      setStep("idle");
    }
  };

  if (step === "done") {
    return (
      <p className="text-xs text-muted-foreground text-center py-1">
        ✓ Demande enregistrée — réponse sous 48h.
      </p>
    );
  }

  if (step === "form" || step === "loading") {
    return (
      <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
        <p className="text-xs font-semibold text-foreground">Motif du remboursement (optionnel)</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Expliquez brièvement votre demande…"
          rows={2}
          className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2">
          <button onClick={() => setStep("idle")}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={step === "loading"}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5">
            {step === "loading" ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
            Envoyer la demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("form")}
      className="flex items-center justify-between w-full px-4 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      <span className="flex items-center gap-2">
        <RotateCcw size={12} />
        Demander un remboursement (garantie 30 jours)
      </span>
      <ChevronRight size={13} className="opacity-50" />
    </button>
  );
}

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
                {isStripe && isActive && (
                  <RefundRequestButton userId={user?.id} />
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

        {/* Paramètres avancés */}
        <div className="card-surface p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Paramètres avancés</h2>
          </div>
          <Link
            to="/pilotage"
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Configurer mes canaux et notifications
            <ChevronRight size={15} className="text-muted-foreground" />
          </Link>
        </div>

        {/* Données personnelles — RGPD */}
        <div className="card-surface p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={17} className="text-primary" />
            <h2 className="font-semibold text-foreground">Mes données personnelles</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Conformément au RGPD (art. 20 — portabilité, art. 17 — droit à l'effacement), vous pouvez exporter vos données ou supprimer votre compte. La suppression est définitive après 30 jours.
          </p>
          <div className="flex flex-col gap-2">
            <RGPDExportButton userId={user?.id} />
            <RGPDDeleteButton onConfirm={async () => {
              await signOut();
              navigate("/login", { replace: true });
            }} />
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-border pt-5">
          <button
            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
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
