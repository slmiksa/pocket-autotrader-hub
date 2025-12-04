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

const navItems = [
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

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action === "notifications") {
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
          {navItems.map((item) => (
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
            <SheetContent side="right" className="bg-[#1a1f2e] border-white/10 w-72 p-0">
              <div className="flex flex-col mt-12 px-2">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "justify-start text-white/60 hover:text-white hover:bg-white/5 gap-3 h-11 rounded-lg font-normal",
                      isActive(item.path) && "bg-white/10 text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
                
                {user && (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3 h-11 mt-4 rounded-lg font-normal"
                  >
                    <LogOut className="h-5 w-5" />
                    خروج
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
