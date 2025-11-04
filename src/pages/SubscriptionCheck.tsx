import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Key, Shield, MessageCircle, Calendar, CheckCircle2, XCircle, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SubscriptionCheck = () => {
  const navigate = useNavigate();
  const [subscriptionCode, setSubscriptionCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const checkUserSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data && data.subscription_expires_at) {
        const expiresAt = new Date(data.subscription_expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          setSubscriptionExpiresAt(data.subscription_expires_at);
          setHasActiveSubscription(true);
          return true;
        }
      }

      setHasActiveSubscription(false);
      return false;
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasActiveSubscription(false);
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

  const openWhatsApp = () => {
    const phoneNumber = "966575594911"; // Saudi Arabia format
    const message = "مرحباً، أريد الاشتراك في PocketOption Auto Trader";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleActivateCode = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    if (!subscriptionCode.trim()) {
      toast.error("يرجى إدخال كود الاشتراك");
      return;
    }

    setLoading(true);
    try {
      // Validate the code
      const { data: codeData, error: codeError } = await supabase
        .from("subscription_codes")
        .select("*")
        .eq("code", subscriptionCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (codeError || !codeData) {
        toast.error("كود الاشتراك غير صحيح أو منتهي الصلاحية");
        setLoading(false);
        return;
      }

      // Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("هذا الكود منتهي الصلاحية");
        setLoading(false);
        return;
      }

      // Check if code reached max uses
      if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
        toast.error("تم استخدام هذا الكود بالكامل");
        setLoading(false);
        return;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + codeData.duration_days);

      // Create or update user profile with subscription
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          user_id: user.id,
          subscription_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      // Update code usage count
      await supabase
        .from("subscription_codes")
        .update({ current_uses: (codeData.current_uses || 0) + 1 })
        .eq("id", codeData.id);

      toast.success("تم تفعيل الاشتراك بنجاح! انتظر جاري تحويلك إلى صفحة التوصيات...");
      // حدث الحالة محلياً لتفادي أي وميض قبل الانتقال
      setHasActiveSubscription(true);
      setSubscriptionExpiresAt(expiresAt.toISOString());
      setSubscriptionCode("");

      // انتقل تلقائياً إلى صفحة التوصيات بعد لحظات قصيرة
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error: any) {
      console.error("Error activating code:", error);
      toast.error(error.message || "فشل تفعيل الكود");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserSubscription(session.user.id).then((isActive) => {
              if (isActive) {
                navigate("/");
              }
              setLoading(false);
            });
          }, 0);
        } else {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserSubscription(session.user.id).then((isActive) => {
          if (isActive) {
            navigate("/");
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has active subscription, this should not be shown
  // because useEffect will redirect to dashboard
  if (hasActiveSubscription && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">PocketOption Auto Trader</CardTitle>
            <CardDescription>يرجى تسجيل الدخول للمتابعة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/auth")} className="w-full" size="lg">
              تسجيل الدخول / التسجيل
            </Button>
            <Button
              onClick={() => navigate("/admin-login")}
              variant="outline"
              className="w-full"
            >
              <Shield className="h-4 w-4 ml-2" />
              دخول المسؤول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main subscription page (user logged in but no active subscription)
  return (
    <div className="min-h-screen bg-background dark p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PocketOption Auto Trader</h1>
              <p className="text-sm text-muted-foreground">تفعيل الاشتراك</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل خروج
          </Button>
        </div>

        {/* Subscription Status */}
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">الاشتراك غير نشط</h3>
                <p className="text-sm text-muted-foreground">
                  يجب تفعيل الاشتراك للوصول إلى التوصيات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle>باقات الاشتراك</CardTitle>
            <CardDescription>اختر الباقة المناسبة لك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 1 Month Package */}
              <div className="border rounded-lg p-6 space-y-4 hover:border-primary transition-colors">
                <div>
                  <h3 className="text-xl font-bold">شهر واحد</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-primary">200</span>
                    <span className="text-muted-foreground">ريال</span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>توصيات تداول مباشرة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>تداول آلي</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>دعم فني</span>
                  </li>
                </ul>
              </div>

              {/* 2 Months Package */}
              <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative">
                <Badge className="absolute -top-3 right-4">الأكثر شعبية</Badge>
                <div>
                  <h3 className="text-xl font-bold">شهرين</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-primary">390</span>
                    <span className="text-muted-foreground">ريال</span>
                  </div>
                  <p className="text-sm text-success mt-1">وفر 10 ريال</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>توصيات تداول مباشرة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>تداول آلي</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>دعم فني</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-right">
                  <p className="font-medium">للحصول على كود الاشتراك</p>
                  <p className="text-sm text-muted-foreground">تواصل معنا عبر الواتساب</p>
                </div>
                <Button onClick={openWhatsApp} className="gap-2" size="lg">
                  <MessageCircle className="h-5 w-5" />
                  تواصل على الواتساب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              تفعيل كود الاشتراك
            </CardTitle>
            <CardDescription>
              أدخل كود الاشتراك الذي حصلت عليه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">كود الاشتراك</Label>
              <Input
                id="code"
                value={subscriptionCode}
                onChange={(e) => setSubscriptionCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleActivateCode()}
                placeholder="XXXX-XXXX-XXXX"
                className="font-mono text-center text-lg"
                maxLength={14}
              />
            </div>
            <Button
              onClick={handleActivateCode}
              disabled={loading || !subscriptionCode.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                "تفعيل الاشتراك"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionCheck;
