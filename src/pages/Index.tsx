import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { LivePriceCards } from "@/components/LivePriceCards";
import { HomeContent } from "@/components/HomeContent";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Loader2 } from "lucide-react";
import { initAudioContext } from "@/utils/soundNotification";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const checkSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
        navigate("/subscription");
        return false;
      }

      if (data && data.subscription_expires_at) {
        const expiresAt = new Date(data.subscription_expires_at);
        const now = new Date();
        if (expiresAt > now) {
          setLoading(false);
          return true;
        }
      }

      setLoading(false);
      navigate("/subscription");
      return false;
    } catch (error) {
      console.error("Error checking subscription:", error);
      setLoading(false);
      navigate("/subscription");
      return false;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkSubscription(session.user.id);
        }, 0);
      } else {
        setLoading(false);
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSubscription(session.user.id);
      } else {
        setLoading(false);
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !session) {
    return null;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-[#0f1219] dark pt-[calc(env(safe-area-inset-top)+48px)]">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Live Price Cards */}
      <LivePriceCards />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <HomeContent />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            
          </div>
        </div>
      </footer>
    </PullToRefresh>
  );
};

export default Index;