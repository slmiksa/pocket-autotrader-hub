import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Auth from "./pages/Auth";
import SubscriptionCheck from "./pages/SubscriptionCheck";
import ImageAnalysis from "./pages/ImageAnalysis";
import ProfessionalSignals from "./pages/ProfessionalSignals";

import LiveChart from "./pages/LiveChart";
import SupplyDemandAnalyzer from "./pages/SupplyDemandAnalyzer";
import Markets from "./pages/Markets";
import Profile from "./pages/Profile";
import BinaryOptions from "./pages/BinaryOptions";
import Community from "./pages/Community";
import Install from "./pages/Install";
import About from "./pages/About";
import EconomicCalendar from "./pages/EconomicCalendar";
import SmartRecoverySystem from "./pages/SmartRecoverySystem";
import GoldenPulse from "./pages/GoldenPulse";
import NotFound from "./pages/NotFound";
import { SmartSupport } from "./components/SmartSupport";
import { GlobalHeader } from "./components/GlobalHeader";
import { PriceAlertWatcher } from "./components/PriceAlertWatcher";
import { BackButton } from "./components/BackButton";
import { ScrollToTop } from "./components/ScrollToTop";
import { RealtimeAlertsProvider } from "./components/RealtimeAlertsProvider";

const queryClient = new QueryClient();

const RecoveryHashRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If the auth system redirects to the root with recovery tokens in the hash,
    // route the user to /auth so the recovery UI can be shown.
    const hash = window.location.hash || "";
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (accessToken && type === "recovery" && location.pathname !== "/auth") {
      navigate(`/auth?type=recovery${hash}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <RecoveryHashRedirect />
        <GlobalHeader />
        <BackButton />
        <SmartSupport />
        <PriceAlertWatcher />
        <RealtimeAlertsProvider />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/subscription" element={<SubscriptionCheck />} />
          <Route path="/image-analysis" element={<ImageAnalysis />} />
          <Route path="/professional-signals" element={<ProfessionalSignals />} />

          <Route path="/live-chart" element={<LiveChart />} />
          <Route path="/supply-demand" element={<SupplyDemandAnalyzer />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/binary-options" element={<BinaryOptions />} />
          <Route path="/community" element={<Community />} />
          <Route path="/install" element={<Install />} />
          <Route path="/about" element={<About />} />
          <Route path="/economic-calendar" element={<EconomicCalendar />} />
          <Route path="/smart-recovery" element={<SmartRecoverySystem />} />
          <Route path="/golden-pulse" element={<GoldenPulse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
