import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, TrendingUp } from "lucide-react";

const BinaryOptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      // Check subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) < new Date()) {
        navigate("/subscription");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background dark">
      {/* Safe Area Background */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-card z-[60]" />
      
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1"
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden sm:inline">الرئيسية</span>
              </Button>
              <div className="rounded-lg bg-primary p-1.5 sm:p-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  الخيارات الثنائية
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  توصيات تداول مباشرة
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <TradingDashboard />
      </main>
    </PullToRefresh>
  );
};

export default BinaryOptions;
