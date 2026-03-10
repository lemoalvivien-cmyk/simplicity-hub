import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import InstallBanner from "@/components/pwa/InstallBanner";
import { usePageTracking } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";

// ── Eager imports (core) ────────────────────────────────────────────────────
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import CGU from "./pages/CGU";
import Confidentialite from "./pages/Confidentialite";
import MentionsLegales from "./pages/MentionsLegales";

// ── Lazy: dashboards ─────────────────────────────────────────────────────────
const DashboardEntreprise = lazy(() => import("./pages/DashboardEntreprise"));
const DashboardFacilitateur = lazy(() => import("./pages/DashboardFacilitateur"));
const Pilotage = lazy(() => import("./pages/Pilotage"));

// ── Lazy: prospection ───────────────────────────────────────────────────────
const Contacts = lazy(() => import("./pages/Contacts"));
const ContactImport = lazy(() => import("./pages/ContactImport"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
const Listes = lazy(() => import("./pages/Listes"));
const Campagnes = lazy(() => import("./pages/Campagnes"));
const CampagneDetail = lazy(() => import("./pages/CampagneDetail"));
const CampagneNouvelle = lazy(() => import("./pages/CampagneNouvelle"));
const Actions = lazy(() => import("./pages/Actions"));
const Sources = lazy(() => import("./pages/Sources"));
const Messages = lazy(() => import("./pages/Messages"));
const Regles = lazy(() => import("./pages/Regles"));
const Canaux = lazy(() => import("./pages/Canaux"));
const Opportunites = lazy(() => import("./pages/Opportunites"));
const OpportuniteNouvelle = lazy(() => import("./pages/OpportuniteNouvelle"));

// ── Lazy: apport d'affaires ─────────────────────────────────────────────────
const Missions = lazy(() => import("./pages/Missions"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const MissionNouvelle = lazy(() => import("./pages/MissionNouvelle"));
const Introductions = lazy(() => import("./pages/Introductions"));
const IntroductionDetail = lazy(() => import("./pages/IntroductionDetail"));
const Gains = lazy(() => import("./pages/Gains"));
const ProfilFacilitateur = lazy(() => import("./pages/ProfilFacilitateur"));
const IntroductionsEntreprise = lazy(() => import("./pages/IntroductionsEntreprise"));
const ProfilEntreprise = lazy(() => import("./pages/ProfilEntreprise"));
const Facilitateurs = lazy(() => import("./pages/Facilitateurs"));
const FacilitateurDetail = lazy(() => import("./pages/FacilitateurDetail"));
const Signalement = lazy(() => import("./pages/Signalement"));

// ── Lazy: OpenClaw / agents ─────────────────────────────────────────────────
const Agents = lazy(() => import("./pages/Agents"));
const Dossier = lazy(() => import("./pages/Dossier"));
const Validations = lazy(() => import("./pages/Validations"));
const Operations = lazy(() => import("./pages/Operations"));
const WarRoom = lazy(() => import("./pages/WarRoom"));
const Studio = lazy(() => import("./pages/Studio"));
const Radar = lazy(() => import("./pages/Radar"));

// ── Lazy: passive / réseau ──────────────────────────────────────────────────
const PassiveOS = lazy(() => import("./pages/PassiveOS"));
const ImportReseau = lazy(() => import("./pages/ImportReseau"));
const Offres = lazy(() => import("./pages/Offres"));
const Chaud = lazy(() => import("./pages/Chaud"));
const OffresEntreprise = lazy(() => import("./pages/OffresEntreprise"));
const Reseau = lazy(() => import("./pages/Reseau"));
const Trust = lazy(() => import("./pages/Trust"));

// ── Lazy: utils ─────────────────────────────────────────────────────────────
const Assistant = lazy(() => import("./pages/Assistant"));
const Help = lazy(() => import("./pages/Help"));
const Account = lazy(() => import("./pages/Account"));
const Install = lazy(() => import("./pages/Install"));
const Autonomie = lazy(() => import("./pages/Autonomie"));
const SystemProof = lazy(() => import("./pages/SystemProof"));
const ROIDashboard = lazy(() => import("./pages/ROIDashboard"));

// ── Lazy: admin ─────────────────────────────────────────────────────────────
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminHelpContent = lazy(() => import("./pages/admin/HelpContent"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminRevenue = lazy(() => import("./pages/admin/Revenue"));
const AdminGoLive = lazy(() => import("./pages/admin/GoLive"));
const AdminSystemHealth = lazy(() => import("./pages/admin/SystemHealth"));
const AdminPayoutOps = lazy(() => import("./pages/admin/PayoutOps"));
const AdminReactivation = lazy(() => import("./pages/admin/Reactivation"));
const AdminEnvCheck = lazy(() => import("./pages/admin/EnvCheck"));

// ── Skeleton fallback ────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const queryClient = new QueryClient();

function DashboardRouter() {
  const { role } = useAuth();
  if (role === "entreprise") return <DashboardEntreprise />;
  return <DashboardFacilitateur />;
}

function PageTracker() {
  usePageTracking();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallBanner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PageTracker />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* ── Public ───────────────────────────────── */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/cgu" element={<CGU />} />
                <Route path="/confidentialite" element={<Confidentialite />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />

                {/* ── Onboarding ───────────────────────────── */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* ── Pilotage ─────────────────────────────── */}
                <Route path="/pilotage" element={<ProtectedRoute><Pilotage /></ProtectedRoute>} />

                {/* ── Studio & Builder ─────────────────────── */}
                <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/campagnes/nouvelle" element={<ProtectedRoute><CampagneNouvelle /></ProtectedRoute>} />
                <Route path="/sources" element={<ProtectedRoute><Sources /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/regles" element={<ProtectedRoute><Regles /></ProtectedRoute>} />
                <Route path="/canaux" element={<ProtectedRoute><Canaux /></ProtectedRoute>} />
                <Route path="/opportunites" element={<ProtectedRoute><Opportunites /></ProtectedRoute>} />
                <Route path="/opportunites/nouvelle" element={<ProtectedRoute><OpportuniteNouvelle /></ProtectedRoute>} />

                {/* ── Dashboards ───────────────────────────── */}
                <Route path="/dashboard/entreprise" element={<ProtectedRoute><DashboardEntreprise /></ProtectedRoute>} />
                <Route path="/dashboard/facilitateur" element={<ProtectedRoute><DashboardFacilitateur /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

                {/* ── Prospection ──────────────────────────── */}
                <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                <Route path="/contacts/import" element={<ProtectedRoute><ContactImport /></ProtectedRoute>} />
                <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
                <Route path="/listes" element={<ProtectedRoute><Listes /></ProtectedRoute>} />
                <Route path="/campagnes" element={<ProtectedRoute><Campagnes /></ProtectedRoute>} />
                <Route path="/campagnes/:id" element={<ProtectedRoute><CampagneDetail /></ProtectedRoute>} />
                <Route path="/actions" element={<ProtectedRoute><Actions /></ProtectedRoute>} />

                {/* ── Apport d'affaires — facilitateur ─────── */}
                <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
                <Route path="/missions/nouvelle" element={<ProtectedRoute><MissionNouvelle /></ProtectedRoute>} />
                <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />
                <Route path="/introductions" element={<ProtectedRoute><Introductions /></ProtectedRoute>} />
                <Route path="/introductions/:id" element={<ProtectedRoute><IntroductionDetail /></ProtectedRoute>} />
                <Route path="/gains" element={<ProtectedRoute><Gains /></ProtectedRoute>} />
                <Route path="/profil/facilitateur" element={<ProtectedRoute><ProfilFacilitateur /></ProtectedRoute>} />

                {/* ── Apport d'affaires — entreprise ───────── */}
                <Route path="/entreprise/introductions" element={<ProtectedRoute><IntroductionsEntreprise /></ProtectedRoute>} />
                <Route path="/profil/entreprise" element={<ProtectedRoute><ProfilEntreprise /></ProtectedRoute>} />

                {/* ── OpenClaw — Cerveau agentique ─────────── */}
                <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
                <Route path="/dossier" element={<ProtectedRoute><Dossier /></ProtectedRoute>} />
                <Route path="/validations" element={<ProtectedRoute><Validations /></ProtectedRoute>} />
                <Route path="/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
                <Route path="/war-room" element={<ProtectedRoute><WarRoom /></ProtectedRoute>} />

                {/* ── Deal Radar ───────────────────────────── */}
                <Route path="/radar" element={<ProtectedRoute><Radar /></ProtectedRoute>} />

                {/* ── Facilitateurs & Signalement ──────────── */}
                <Route path="/facilitateurs" element={<ProtectedRoute><Facilitateurs /></ProtectedRoute>} />
                <Route path="/facilitateurs/:id" element={<ProtectedRoute><FacilitateurDetail /></ProtectedRoute>} />
                <Route path="/signalement" element={<ProtectedRoute><Signalement /></ProtectedRoute>} />

                {/* ── Réseau intelligent ─────────────────────── */}
                <Route path="/reseau" element={<ProtectedRoute><Reseau /></ProtectedRoute>} />

                {/* ── Passive Facilitator OS ─────────────────── */}
                <Route path="/passive" element={<ProtectedRoute><PassiveOS /></ProtectedRoute>} />
                <Route path="/import-reseau" element={<ProtectedRoute><ImportReseau /></ProtectedRoute>} />
                <Route path="/offres" element={<ProtectedRoute><Offres /></ProtectedRoute>} />
                <Route path="/offres/entreprise" element={<ProtectedRoute><OffresEntreprise /></ProtectedRoute>} />
                <Route path="/chaud" element={<ProtectedRoute><Chaud /></ProtectedRoute>} />
                <Route path="/trust" element={<ProtectedRoute><Trust /></ProtectedRoute>} />

                {/* ── Utilitaires ──────────────────────────── */}
                <Route path="/system-proof" element={<ProtectedRoute><SystemProof /></ProtectedRoute>} />
                <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="/install" element={<ProtectedRoute><Install /></ProtectedRoute>} />
                <Route path="/autonomie" element={<ProtectedRoute><Autonomie /></ProtectedRoute>} />

                {/* ── ROI Dashboard ─────────────────────────── */}
                <Route path="/roi" element={<ProtectedRoute><ROIDashboard /></ProtectedRoute>} />

                {/* ── Admin ────────────────────────────────── */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/promo-codes" element={<ProtectedRoute adminOnly><AdminPromoCodes /></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
                <Route path="/admin/payout-ops" element={<ProtectedRoute adminOnly><AdminPayoutOps /></ProtectedRoute>} />
                <Route path="/admin/reactivation" element={<ProtectedRoute adminOnly><AdminReactivation /></ProtectedRoute>} />
                <Route path="/admin/env-check" element={<ProtectedRoute adminOnly><AdminEnvCheck /></ProtectedRoute>} />
                <Route path="/admin/help" element={<ProtectedRoute adminOnly><AdminHelpContent /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/admin/revenue" element={<ProtectedRoute adminOnly><AdminRevenue /></ProtectedRoute>} />
                <Route path="/admin/go-live" element={<ProtectedRoute adminOnly><AdminGoLive /></ProtectedRoute>} />
                <Route path="/admin/system-health" element={<ProtectedRoute adminOnly><AdminSystemHealth /></ProtectedRoute>} />

                {/* ── 404 ──────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
