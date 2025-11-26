import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { LivePriceCards } from "@/components/LivePriceCards";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrendingUp, Loader2, LogOut, Calendar, MessageCircle, Image, Bell, BellOff, LineChart, Newspaper, Shield, Menu } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [imageAnalysisEnabled, setImageAnalysisEnabled] = useState(false);
  const [professionalSignalsEnabled, setProfessionalSignalsEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      } = await supabase.from("profiles").select("subscription_expires_at, image_analysis_enabled, professional_signals_enabled").eq("user_id", userId).single();
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
          setProfessionalSignalsEnabled(data.professional_signals_enabled || false);
          console.log("✅ Image analysis enabled:", data.image_analysis_enabled);
          console.log("✅ Professional signals enabled:", data.professional_signals_enabled);
          setLoading(false);
          return true;
        }
      }

      // No valid subscription
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
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("تم تسجيل الخروج بنجاح");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("فشل تسجيل الخروج");
    }
  };
  useEffect(() => {
    // Set up auth state listener
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

    // Check for existing session
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

  // Realtime subscription for profile changes
  useEffect(() => {
    if (!user?.id) return;
    console.log("🔔 Setting up realtime subscription for profile changes");
    const channel = supabase.channel('profile-changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      console.log("🔔 Profile updated:", payload);
      const newData = payload.new as any;
      if (newData.image_analysis_enabled !== undefined) {
        setImageAnalysisEnabled(newData.image_analysis_enabled);
        console.log("✅ Image analysis updated to:", newData.image_analysis_enabled);
      }
      if (newData.professional_signals_enabled !== undefined) {
        setProfessionalSignalsEnabled(newData.professional_signals_enabled);
        console.log("✅ Professional signals updated to:", newData.professional_signals_enabled);
      }
    }).subscribe();
    return () => {
      console.log("🔕 Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!user || !session) {
    return null;
  }
  return <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-lg bg-primary p-1.5 sm:p-2 shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">هوامير التوصيات                   </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  توصيات تداول مباشرة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Days Left Badge - Always Visible */}
              {subscriptionExpiresAt && (() => {
                const expiresAt = new Date(subscriptionExpiresAt);
                const now = new Date();
                const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="font-semibold text-primary">
                      {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}
                    </span>
                  </div>
                );
              })()}

              {/* Desktop Menu - Hidden on Mobile */}
              <div className="hidden lg:flex items-center gap-2">
                {isSupported && (
                  <Button
                    onClick={handleNotificationToggle}
                    variant={permission === 'granted' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                  >
                    {permission === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    <span>{permission === 'granted' ? 'مفعّلة' : 'تفعيل الإشعارات'}</span>
                  </Button>
                )}
                {imageAnalysisEnabled && (
                  <Button onClick={() => navigate('/image-analysis')} variant="outline" size="sm" className="gap-1.5">
                    <Image className="h-4 w-4" />
                    <span>تحليل الأسواق</span>
                  </Button>
                )}
                {professionalSignalsEnabled && (
                  <Button onClick={() => navigate('/professional-signals')} variant="outline" size="sm" className="gap-1.5">
                    <Shield className="h-4 w-4" />
                    <span>توصيات المحترفين</span>
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/supply-demand')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/20"
                >
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>محلل العرض والطلب</span>
                </Button>
                <Button onClick={() => navigate('/news')} variant="outline" size="sm" className="gap-1.5">
                  <Newspaper className="h-4 w-4" />
                  <span>الأخبار</span>
                </Button>
                <Button
                  onClick={() => window.open('https://wa.me/966575594911?text=tadawolpocket', '_blank')}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>دعم فني</span>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-1.5">
                  <LogOut className="h-4 w-4" />
                  <span>خروج</span>
                </Button>
              </div>

              {/* Mobile Menu - Visible on Mobile Only */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-card">
                  <SheetHeader>
                    <SheetTitle className="text-right">القائمة</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 mt-6">
                    {isSupported && (
                      <Button
                        onClick={() => {
                          handleNotificationToggle();
                          setMobileMenuOpen(false);
                        }}
                        variant={permission === 'granted' ? 'default' : 'outline'}
                        className="w-full justify-start gap-2"
                      >
                        {permission === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        <span>{permission === 'granted' ? 'الإشعارات مفعّلة' : 'تفعيل الإشعارات'}</span>
                      </Button>
                    )}
                    {imageAnalysisEnabled && (
                      <Button
                        onClick={() => {
                          navigate('/image-analysis');
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2"
                      >
                        <Image className="h-4 w-4" />
                        <span>تحليل الأسواق</span>
                      </Button>
                    )}
                    {professionalSignalsEnabled && (
                      <Button
                        onClick={() => {
                          navigate('/professional-signals');
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        <span>توصيات المحترفين</span>
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        navigate('/supply-demand');
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
                    >
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>محلل العرض والطلب</span>
                    </Button>
                    <Button
                      onClick={() => {
                        navigate('/news');
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Newspaper className="h-4 w-4" />
                      <span>الأخبار</span>
                    </Button>
                    <Button
                      onClick={() => {
                        window.open('https://wa.me/966575594911?text=tadawolpocket', '_blank');
                        setMobileMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>دعم فني</span>
                    </Button>
                    <Button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Live Price Cards */}
      <LivePriceCards />

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <TradingDashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8 sm:mt-12">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;