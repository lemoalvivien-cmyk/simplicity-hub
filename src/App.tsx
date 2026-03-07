import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import InstallBanner from "@/components/pwa/InstallBanner";

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
import MissionNouvelle from "./pages/MissionNouvelle";
import Introductions from "./pages/Introductions";
import IntroductionDetail from "./pages/IntroductionDetail";
import Gains from "./pages/Gains";
import ProfilFacilitateur from "./pages/ProfilFacilitateur";

// Apport d'affaires — entreprise
import IntroductionsEntreprise from "./pages/IntroductionsEntreprise";
import ProfilEntreprise from "./pages/ProfilEntreprise";

// OpenClaw — Cerveau central agentique
import Agents from "./pages/Agents";
import Dossier from "./pages/Dossier";
import Validations from "./pages/Validations";
import Operations from "./pages/Operations";
import WarRoom from "./pages/WarRoom";

// Deal Radar
import Radar from "./pages/Radar";

// Mobile / PWA
import Install from "./pages/Install";
import Autonomie from "./pages/Autonomie";

// Facilitateurs & Signalement
import Facilitateurs from "./pages/Facilitateurs";
import FacilitateurDetail from "./pages/FacilitateurDetail";
import Signalement from "./pages/Signalement";

// Réseau intelligent — Graph, Proof Ledger, Corridors
import Reseau from "./pages/Reseau";

// Passive Facilitator OS
import PassiveOS from "./pages/PassiveOS";
import ImportReseau from "./pages/ImportReseau";
import Offres from "./pages/Offres";
import Chaud from "./pages/Chaud";
import OffresEntreprise from "./pages/OffresEntreprise";

// Trust Engine
import Trust from "./pages/Trust";

// System Proof
import SystemProof from "./pages/SystemProof";

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
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallBanner />
          <BrowserRouter>
            <Routes>
              {/* ── Public ───────────────────────────────── */}
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* ── Onboarding ───────────────────────────── */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />

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

              {/* ── Dashboards ───────────────────────────── */}
              <Route path="/dashboard/entreprise" element={<ProtectedRoute><DashboardEntreprise /></ProtectedRoute>} />
              <Route path="/dashboard/facilitateur" element={<ProtectedRoute><DashboardFacilitateur /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardFacilitateur /></ProtectedRoute>} />

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

              {/* ── Réseau intelligent — Graph + Proof Ledger ── */}
              <Route path="/reseau" element={<ProtectedRoute><Reseau /></ProtectedRoute>} />

              {/* ── Passive Facilitator OS ────────────────────── */}
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

              {/* ── Admin ────────────────────────────────── */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/promo-codes" element={<ProtectedRoute adminOnly><AdminPromoCodes /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/help" element={<ProtectedRoute adminOnly><AdminHelpContent /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />

              {/* ── 404 ──────────────────────────────────── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
