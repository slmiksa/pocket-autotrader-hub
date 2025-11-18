import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { LivePriceCards } from "@/components/LivePriceCards";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const PocketOptionLive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [imageAnalysisEnabled, setImageAnalysisEnabled] = useState(false);
  const {
    requestPermission,
    isSupported,
    permission
  } = useNotifications();

  const checkSubscription = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("subscription_expires_at, image_analysis_enabled").eq("user_id", userId).single();
      
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
          setSubscriptionExpiresAt(data.subscription_expires_at);
          setImageAnalysisEnabled(data.image_analysis_enabled || false);
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
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
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

    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
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

  const handleNotificationToggle = async () => {
    const granted = await requestPermission(false);
    if (!granted && permission === 'denied') {
      toast.error('يرجى السماح بالإشعارات من إعدادات المتصفح');
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          const newData = payload.new as any;
          if (newData.image_analysis_enabled !== undefined) {
            setImageAnalysisEnabled(newData.image_analysis_enabled);
            console.log('✅ Image analysis enabled updated to:', newData.image_analysis_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatSubscriptionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              POCKET OPTION LIVE
            </h1>
            {subscriptionExpiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                الاشتراك ساري حتى: {formatSubscriptionDate(subscriptionExpiresAt)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSupported && (
              <Button
                variant={permission === 'granted' ? 'default' : 'outline'}
                size="sm"
                onClick={handleNotificationToggle}
                className="gap-2"
              >
                {permission === 'granted' ? (
                  <>
                    <Bell className="h-4 w-4" />
                    الإشعارات مفعلة
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4" />
                    تفعيل الإشعارات
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <AnnouncementBanner />
        <LivePriceCards />
        <TradingDashboard />

        <div className="mt-8 p-4 bg-warning/10 border border-warning rounded-lg">
          <p className="text-sm text-warning-foreground text-center">
            ⚠️ تحذير: التداول ينطوي على مخاطر عالية وقد يؤدي إلى خسارة رأس المال بالكامل
          </p>
        </div>
      </div>
    </div>
  );
};

export default PocketOptionLive;
