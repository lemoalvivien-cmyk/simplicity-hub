import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { FounderSlotsProvider } from "@/contexts/FounderSlotsContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import InstallBanner from "@/components/pwa/InstallBanner";
import RGPDConsentBanner from "@/components/landing/RGPDConsentBanner";
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
import Success from "./pages/Success";
import CGU from "./pages/CGU";
import Confidentialite from "./pages/Confidentialite";
import Legal from "./pages/Legal";
import MentionsLegales from "./pages/MentionsLegales";

// ── Lazy: dashboards ─────────────────────────────────────────────────────────
const DashboardEntreprise = lazy(() => import("./pages/DashboardEntreprise"));
const DashboardFacilitateur = lazy(() => import("./pages/DashboardFacilitateur"));
const Pilotage = lazy(() => import("./pages/Pilotage"));

// ── Lazy: contacts & actions ─────────────────────────────────────────────────
const Contacts = lazy(() => import("./pages/Contacts"));
const ContactImport = lazy(() => import("./pages/ContactImport"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
const Actions = lazy(() => import("./pages/Actions"));

// ── Lazy: missions ───────────────────────────────────────────────────────────
const Missions = lazy(() => import("./pages/Missions"));
const MissionDetail = lazy(() => import("./pages/MissionDetail"));
const MissionNouvelle = lazy(() => import("./pages/MissionNouvelle"));

// ── Lazy: introductions & gains ──────────────────────────────────────────────
const Introductions = lazy(() => import("./pages/Introductions"));
const IntroductionDetail = lazy(() => import("./pages/IntroductionDetail"));
const IntroductionsEntreprise = lazy(() => import("./pages/IntroductionsEntreprise"));
const Gains = lazy(() => import("./pages/Gains"));

// ── Lazy: profils & facilitateurs ────────────────────────────────────────────
const ProfilFacilitateur = lazy(() => import("./pages/ProfilFacilitateur"));
const ProfilEntreprise = lazy(() => import("./pages/ProfilEntreprise"));
const Facilitateurs = lazy(() => import("./pages/Facilitateurs"));
const FacilitateurDetail = lazy(() => import("./pages/FacilitateurDetail"));

// ── Lazy: public pages ───────────────────────────────────────────────────────
const APropos = lazy(() => import("./pages/APropos"));
const CreerEmploiPage = lazy(() => import("./pages/CreerEmploi"));

// ── Lazy: utils ──────────────────────────────────────────────────────────────
const Assistant = lazy(() => import("./pages/Assistant"));
const Help = lazy(() => import("./pages/Help"));
const Account = lazy(() => import("./pages/Account"));

// ── Lazy: System Status ───────────────────────────────────────────────────────
const SystemStatus = lazy(() => import("./pages/SystemStatus"));

// ── Lazy: admin ──────────────────────────────────────────────────────────────
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminPromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const AdminRevenue = lazy(() => import("./pages/admin/Revenue"));
const AdminBeta = lazy(() => import("./pages/admin/Beta"));
const AdminLaunchChecklist = lazy(() => import("./pages/admin/LaunchChecklist"));

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
  <FounderSlotsProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallBanner />
          <RGPDConsentBanner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PageTracker />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* ── Public ───────────────────────────────── */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/success" element={<Success />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/cgu" element={<CGU />} />
                <Route path="/confidentialite" element={<Confidentialite />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/a-propos" element={<APropos />} />
                <Route path="/creer-emploi" element={<CreerEmploiPage />} />

                {/* ── Onboarding ───────────────────────────── */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* ── Dashboards ───────────────────────────── */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
                <Route path="/dashboard/entreprise" element={<ProtectedRoute entrepriseOnly><DashboardEntreprise /></ProtectedRoute>} />
                <Route path="/dashboard/facilitateur" element={<ProtectedRoute facilitateurOnly><DashboardFacilitateur /></ProtectedRoute>} />
                <Route path="/pilotage" element={<ProtectedRoute><Pilotage /></ProtectedRoute>} />

                {/* ── Contacts & Actions ───────────────────── */}
                <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                <Route path="/contacts/import" element={<ProtectedRoute><ContactImport /></ProtectedRoute>} />
                <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
                <Route path="/actions" element={<ProtectedRoute><Actions /></ProtectedRoute>} />

                {/* ── Missions ─────────────────────────────── */}
                <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
                <Route path="/missions/nouvelle" element={<ProtectedRoute><MissionNouvelle /></ProtectedRoute>} />
                <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />

                {/* ── Introductions & Gains ────────────────── */}
                <Route path="/introductions" element={<ProtectedRoute><Introductions /></ProtectedRoute>} />
                <Route path="/introductions/:id" element={<ProtectedRoute><IntroductionDetail /></ProtectedRoute>} />
                <Route path="/entreprise/introductions" element={<ProtectedRoute><IntroductionsEntreprise /></ProtectedRoute>} />
                <Route path="/gains" element={<ProtectedRoute><Gains /></ProtectedRoute>} />

                {/* ── Profils & Facilitateurs ──────────────── */}
                <Route path="/profil/facilitateur" element={<ProtectedRoute><ProfilFacilitateur /></ProtectedRoute>} />
                <Route path="/profil/entreprise" element={<ProtectedRoute><ProfilEntreprise /></ProtectedRoute>} />
                <Route path="/facilitateurs" element={<ProtectedRoute><Facilitateurs /></ProtectedRoute>} />
                <Route path="/facilitateurs/:id" element={<ProtectedRoute><FacilitateurDetail /></ProtectedRoute>} />

                {/* ── Utilitaires ──────────────────────────── */}
                {/* AUDIT 16/03/2026 – BLOQUANTS LEVÉS : /assistant, /ada, /ada/model, /insights-sales désactivés */}
                {/* <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} /> */}
                {/* <Route path="/ada" element={<ProtectedRoute><ADAControlPanel /></ProtectedRoute>} /> */}
                {/* <Route path="/ada/model" element={<ProtectedRoute><ADAModelDashboard /></ProtectedRoute>} /> */}
                {/* <Route path="/insights-sales" element={<InsightsSales />} /> */}
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="/status" element={<ProtectedRoute adminOnly><SystemStatus /></ProtectedRoute>} />

                {/* ── Admin ────────────────────────────────── */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
                <Route path="/admin/promo-codes" element={<ProtectedRoute adminOnly><AdminPromoCodes /></ProtectedRoute>} />
                <Route path="/admin/revenue" element={<ProtectedRoute adminOnly><AdminRevenue /></ProtectedRoute>} />
                <Route path="/admin/beta" element={<ProtectedRoute adminOnly><AdminBeta /></ProtectedRoute>} />
                <Route path="/admin/launch-checklist" element={<ProtectedRoute adminOnly><AdminLaunchChecklist /></ProtectedRoute>} />

                {/* ── 404 ──────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
  </FounderSlotsProvider>
);

export default App;
