import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Auth from "./pages/Auth";
import SubscriptionCheck from "./pages/SubscriptionCheck";
import ImageAnalysis from "./pages/ImageAnalysis";
import ProfessionalSignals from "./pages/ProfessionalSignals";
import News from "./pages/News";
import LiveChart from "./pages/LiveChart";
import SupplyDemandAnalyzer from "./pages/SupplyDemandAnalyzer";
import Markets from "./pages/Markets";
import Profile from "./pages/Profile";
import BinaryOptions from "./pages/BinaryOptions";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/subscription" element={<SubscriptionCheck />} />
          <Route path="/image-analysis" element={<ImageAnalysis />} />
          <Route path="/professional-signals" element={<ProfessionalSignals />} />
          <Route path="/news" element={<News />} />
          <Route path="/live-chart" element={<LiveChart />} />
          <Route path="/supply-demand" element={<SupplyDemandAnalyzer />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/binary-options" element={<BinaryOptions />} />
          <Route path="/community" element={<Community />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
