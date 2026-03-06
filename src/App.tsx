import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Pilotage from "./pages/Pilotage";

// Studio & Builder
import Studio from "./pages/Studio";
import CampagneNouvelle from "./pages/CampagneNouvelle";
import Sources from "./pages/Sources";
import Messages from "./pages/Messages";
import Regles from "./pages/Regles";
import Canaux from "./pages/Canaux";
import Opportunites from "./pages/Opportunites";

// Public pages
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// User pages
import Onboarding from "./pages/Onboarding";
import DashboardEntreprise from "./pages/DashboardEntreprise";
import DashboardFacilitateur from "./pages/DashboardFacilitateur";
import Assistant from "./pages/Assistant";
import Help from "./pages/Help";
import Account from "./pages/Account";

// Prospection
import Contacts from "./pages/Contacts";
import ContactImport from "./pages/ContactImport";
import ContactDetail from "./pages/ContactDetail";
import Listes from "./pages/Listes";
import Campagnes from "./pages/Campagnes";
import CampagneDetail from "./pages/CampagneDetail";
import Actions from "./pages/Actions";

// Apport d'affaires — facilitateur
import Missions from "./pages/Missions";
import MissionDetail from "./pages/MissionDetail";
import Introductions from "./pages/Introductions";
import IntroductionDetail from "./pages/IntroductionDetail";
import Gains from "./pages/Gains";
import ProfilFacilitateur from "./pages/ProfilFacilitateur";

// Apport d'affaires — entreprise
import IntroductionsEntreprise from "./pages/IntroductionsEntreprise";
import ProfilEntreprise from "./pages/ProfilEntreprise";

// Admin pages
import AdminOverview from "./pages/admin/Overview";
import AdminUsers from "./pages/admin/Users";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import AdminPayments from "./pages/admin/Payments";
import AdminHelpContent from "./pages/admin/HelpContent";
import AdminAnalytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ── Public ───────────────────────────────── */}
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Pilotage ─────────────────────────────── */}
          <Route path="/pilotage" element={<Pilotage />} />

          {/* ── Studio & Builder ─────────────────────── */}
          <Route path="/studio" element={<Studio />} />
          <Route path="/campagnes/nouvelle" element={<CampagneNouvelle />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/regles" element={<Regles />} />
          <Route path="/canaux" element={<Canaux />} />
          <Route path="/opportunites" element={<Opportunites />} />

          {/* ── Onboarding ───────────────────────────── */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* ── Dashboards ───────────────────────────── */}
          <Route path="/dashboard/entreprise" element={<DashboardEntreprise />} />
          <Route path="/dashboard/facilitateur" element={<DashboardFacilitateur />} />
          <Route path="/dashboard" element={<DashboardFacilitateur />} />

          {/* ── Prospection ──────────────────────────── */}
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/import" element={<ContactImport />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/listes" element={<Listes />} />
          <Route path="/campagnes" element={<Campagnes />} />
          <Route path="/campagnes/:id" element={<CampagneDetail />} />
          <Route path="/actions" element={<Actions />} />

          {/* ── Apport d'affaires — facilitateur ─────── */}
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/:id" element={<MissionDetail />} />
          <Route path="/introductions" element={<Introductions />} />
          <Route path="/introductions/:id" element={<IntroductionDetail />} />
          <Route path="/gains" element={<Gains />} />
          <Route path="/profil/facilitateur" element={<ProfilFacilitateur />} />

          {/* ── Apport d'affaires — entreprise ───────── */}
          <Route path="/entreprise/introductions" element={<IntroductionsEntreprise />} />
          <Route path="/profil/entreprise" element={<ProfilEntreprise />} />

          {/* ── Utilitaires ──────────────────────────── */}
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/help" element={<Help />} />
          <Route path="/account" element={<Account />} />

          {/* ── Admin ────────────────────────────────── */}
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/help" element={<AdminHelpContent />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />

          {/* ── 404 ──────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
