import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { TradeHistory } from "@/components/trading/TradeHistory";
import { SettingsPanel } from "@/components/trading/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Settings, History, TrendingUp, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const generateDeviceId = () => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  const checkSubscription = async () => {
    const deviceId = generateDeviceId();

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("device_id", deviceId)
        .order("expires_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const subscription = data[0];
        const expiresAt = new Date(subscription.expires_at);
        const now = new Date();

        if (expiresAt > now) {
          setHasSubscription(true);
          setLoading(false);
          return;
        }
      }

      // No valid subscription found
      setHasSubscription(false);
      setLoading(false);
      navigate("/subscription");
    } catch (error) {
      console.error("Error checking subscription:", error);
      setLoading(false);
      navigate("/subscription");
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSubscription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-lg bg-primary p-1.5 sm:p-2 shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">PocketOption Auto Trader</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  توصيات تداول مباشرة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">متصل</span>
              <Button onClick={() => navigate("/admin")} variant="outline" size="sm" className="ml-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">المسؤول</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BarChart3 className="h-4 w-4" />
              <span>لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <History className="h-4 w-4" />
              <span>السجل</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Settings className="h-4 w-4" />
              <span>الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <TradingDashboard />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6">
            <TradeHistory />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>تطوير: Salem Alquzi | تحذير: التداول يحمل مخاطر عالية. استخدم على مسؤوليتك الخاصة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
