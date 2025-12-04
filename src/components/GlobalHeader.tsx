import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Bell, 
  Image, 
  Target, 
  BarChart3, 
  Newspaper, 
  Users, 
  User, 
  LogOut,
  Menu,
  Binary,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Navigation items for mobile sidebar
const navItems = [
  { label: "تفعيل الإشعارات", icon: Bell, path: null, action: "notifications", color: "default" },
  { label: "اختيار صوت التنبيه", icon: Bell, path: null, action: "sound", color: "default" },
  { label: "تحليل الأسواق", icon: Image, path: "/image-analysis", color: "default" },
  { label: "توصيات المحترفين", icon: Target, path: "/professional-signals", color: "default" },
  { label: "محلل العرض والطلب", icon: TrendingUp, path: "/supply-demand", color: "default" },
  { label: "الأسواق", icon: BarChart3, path: "/markets", color: "default" },
  { label: "الأخبار", icon: Newspaper, path: "/news", color: "default" },
  { label: "المجتمع", icon: Users, path: "/community", color: "default" },
  { label: "حسابي والمفضلة", icon: User, path: "/profile", color: "default" },
  { label: "دعم فني", icon: Target, path: null, action: "support", color: "default" },
  { label: "تحميل كتطبيق", icon: Menu, path: "/install", color: "default" },
];

// Header navigation items (fewer items)
const headerNavItems = [
  { label: "تفعيل الإشعارات", icon: Bell, path: null, action: "notifications" },
  { label: "تحليل الأسواق", icon: Image, path: "/image-analysis" },
  { label: "توصيات المحترفين", icon: Target, path: "/professional-signals" },
  { label: "محلل العرض والطلب", icon: TrendingUp, path: "/supply-demand" },
  { label: "الأسواق", icon: BarChart3, path: "/markets" },
  { label: "الخيارات الثنائية", icon: Binary, path: "/binary-options" },
  { label: "الأخبار", icon: Newspaper, path: "/news" },
  { label: "المجتمع", icon: Users, path: "/community" },
  { label: "حسابي", icon: User, path: "/profile" },
];

export const GlobalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide header only on admin routes
  const hiddenRoutes = ["/admin", "/admin-login"];
  const shouldHide = hiddenRoutes.includes(location.pathname);

  useEffect(() => {
    if (shouldHide) return;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_expires_at")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.subscription_expires_at) {
          const expiresAt = new Date(profile.subscription_expires_at);
          const now = new Date();
          const diffTime = expiresAt.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysRemaining(diffDays > 0 ? diffDays : 0);
        }
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [shouldHide]);

  if (shouldHide) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavClick = (item: any) => {
    if (item.action === "notifications" || item.action === "sound" || item.action === "support") {
      return;
    }
    if (item.path) {
      navigate(item.path);
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const getItemColor = (color: string, isItemActive: boolean) => {
    if (isItemActive) {
      switch (color) {
        case "purple": return "bg-purple-600 text-white border-purple-500";
        case "amber": return "bg-amber-600 text-white border-amber-500";
        case "green": return "bg-green-600 text-white border-green-500";
        default: return "bg-white/10 text-white border-white/20";
      }
    }
    switch (color) {
      case "purple": return "bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30";
      case "amber": return "bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30";
      case "green": return "bg-green-600/20 text-green-300 border-green-500/30 hover:bg-green-600/30";
      default: return "bg-[#252b3b] text-white/70 border-white/10 hover:bg-[#2d3548] hover:text-white";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1a1f2e] border-b border-white/5">
      <div className="flex items-center justify-between px-3 h-12">
        {/* Logo / Brand - Right Side */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {daysRemaining !== null && (
            <Badge className="bg-[#252b3b] text-white/80 border-0 text-xs font-normal px-2">
              {daysRemaining} يوم
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center" dir="rtl">
          {headerNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick(item)}
              className={cn(
                "text-white/60 hover:text-white hover:bg-white/5 gap-1.5 text-[13px] px-3 h-9 rounded-md font-normal",
                isActive(item.path) && "bg-white/10 text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Left Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-white/5 gap-1.5 text-[13px] h-9 font-normal hidden sm:flex"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-white/60 hover:text-white hover:bg-white/5 gap-1.5 text-[13px] h-9 font-normal"
            >
              <User className="h-4 w-4" />
              تسجيل الدخول
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white/60 hover:text-white hover:bg-white/5 h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0f1219] border-white/10 w-[280px] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="text-center py-6 border-b border-white/10">
                  <h2 className="text-white text-lg font-semibold">القائمة</h2>
                </div>
                
                {/* Menu Items */}
                <div className="flex flex-col gap-2 p-4 flex-1 overflow-auto" dir="rtl">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-full border transition-all text-sm font-medium",
                        getItemColor(item.color, isActive(item.path))
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
                
                {/* Footer - Logout */}
                {user && (
                  <div className="p-4 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full text-red-400 hover:text-red-300 py-3 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
