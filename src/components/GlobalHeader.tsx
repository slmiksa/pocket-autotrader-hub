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
  { label: "الخيارات الثنائية", icon: TrendingUp, path: "/binary-options" },
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

  // Hide header on these routes
  const hiddenRoutes = ["/auth", "/admin", "/admin-login"];
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

  // Early return AFTER all hooks
  if (shouldHide) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action === "notifications") {
      // Toggle notifications
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
    <header className="sticky top-0 z-50 w-full bg-[#0f172a] border-b border-white/10">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <TrendingUp className="h-6 w-6 text-cyan-400" />
          {daysRemaining !== null && (
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
              {daysRemaining} يوم
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick(item)}
              className={cn(
                "text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs px-3",
                isActive(item.path) && "bg-white/10 text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden xl:inline">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs hidden sm:flex"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">خروج</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
            >
              <User className="h-4 w-4" />
              <span>تسجيل الدخول</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0f172a] border-white/10 w-72">
              <div className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => handleNavClick(item)}
                    className={cn(
                      "justify-start text-white/70 hover:text-white hover:bg-white/10 gap-3",
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
                    className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3 mt-4"
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
