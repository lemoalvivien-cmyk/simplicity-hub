import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

// Métier
import Missions from "./pages/Missions";
import Introductions from "./pages/Introductions";
import Gains from "./pages/Gains";
import ProfilEntreprise from "./pages/ProfilEntreprise";
import ProfilFacilitateur from "./pages/ProfilFacilitateur";

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
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Dashboards par rôle */}
          <Route path="/dashboard/entreprise" element={<DashboardEntreprise />} />
          <Route path="/dashboard/facilitateur" element={<DashboardFacilitateur />} />
          {/* Alias legacy */}
          <Route path="/dashboard" element={<DashboardFacilitateur />} />

          {/* Pages métier */}
          <Route path="/missions" element={<Missions />} />
          <Route path="/introductions" element={<Introductions />} />
          <Route path="/gains" element={<Gains />} />
          <Route path="/profil/entreprise" element={<ProfilEntreprise />} />
          <Route path="/profil/facilitateur" element={<ProfilFacilitateur />} />

          {/* Pages utilitaires utilisateur */}
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/help" element={<Help />} />
          <Route path="/account" element={<Account />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/help" element={<AdminHelpContent />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
