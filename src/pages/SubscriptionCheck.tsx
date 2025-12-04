import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Key, Shield, MessageCircle, CheckCircle2, XCircle, LogOut, Loader2, BarChart3, LineChart, Sparkles, Crown, Star } from "lucide-react";
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
      const {
        data,
        error
      } = await supabase.from("profiles").select("subscription_expires_at").eq("user_id", userId).single();
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
      navigate("/auth");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("فشل تسجيل الخروج");
    }
  };
  const openWhatsApp = () => {
    const phoneNumber = "966575594911";
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
      const {
        data: codeData,
        error: codeError
      } = await supabase.from("subscription_codes").select("*").eq("code", subscriptionCode.toUpperCase()).eq("is_active", true).single();
      if (codeError || !codeData) {
        toast.error("كود الاشتراك غير صحيح أو منتهي الصلاحية");
        setLoading(false);
        return;
      }
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast.error("هذا الكود منتهي الصلاحية");
        setLoading(false);
        return;
      }
      if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
        toast.error("تم استخدام هذا الكود بالكامل");
        setLoading(false);
        return;
      }
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + codeData.duration_days);
      const {
        error: profileError
      } = await supabase.from("profiles").upsert({
        user_id: user.id,
        email: user.email,
        subscription_expires_at: expiresAt.toISOString(),
        activated_code: subscriptionCode.toUpperCase(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });
      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }
      await supabase.from("subscription_codes").update({
        current_uses: (codeData.current_uses || 0) + 1
      }).eq("id", codeData.id);
      toast.success("تم تفعيل الاشتراك بنجاح! انتظر جاري تحويلك إلى صفحة التوصيات...");
      setHasActiveSubscription(true);
      setSubscriptionExpiresAt(expiresAt.toISOString());
      setSubscriptionCode("");
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
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkUserSubscription(session.user.id).then(isActive => {
            if (isActive) {
              navigate("/");
            }
            setLoading(false);
          });
        }, 0);
      } else {
        setLoading(false);
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
        checkUserSubscription(session.user.id).then(isActive => {
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
    return <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-slate-400">جاري التحقق...</p>
        </div>
      </div>;
  }
  if (hasActiveSubscription && user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>;
  }
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">PocketOption Auto Trader</CardTitle>
            <CardDescription className="text-slate-400">يرجى تسجيل الدخول للمتابعة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/auth")} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0" size="lg">
              تسجيل الدخول / التسجيل
            </Button>
            <Button onClick={() => navigate("/admin-login")} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
              <Shield className="h-4 w-4 ml-2" />
              دخول المسؤول
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-6xl space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 shadow-lg shadow-amber-500/20 bg-transparent border-none">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">PocketOption Auto Trader</h1>
              <p className="text-sm text-slate-400">منصة التداول الذكي</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="h-4 w-4 ml-2" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>

        {/* Subscription Status */}
        <Card className="bg-gradient-to-r from-red-950/40 to-red-900/20 border-red-500/30 backdrop-blur-xl">
          <CardContent className="py-5">
            <div className="items-center gap-4 flex flex-row">
              <div className="rounded-full bg-red-500/20 p-3">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">الاشتراك غير نشط</h3>
                <p className="text-sm my-[3px] px-[11px] bg-secondary-foreground text-primary-foreground">
                  يجب تفعيل الاشتراك للوصول إلى جميع المميزات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section Title */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">باقات الاشتراك</h2>
          <p className="text-slate-400">اختر الباقة المناسبة لاحتياجاتك</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* VIP 1 Day Package - 25 SAR */}
          <Card className="bg-gradient-to-b from-amber-950/40 to-slate-900/80 border-amber-500/50 backdrop-blur-xl relative overflow-hidden group hover:border-amber-400 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg shadow-amber-500/20">
                  <Crown className="h-3 w-3 ml-1" />
                  باقة VIP
                </Badge>
              </div>
              <CardTitle className="text-xl text-white mt-3">يوم واحد</CardTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">25</span>
                <span className="text-slate-300">ريال</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 relative">
              {/* Basic Features */}
              <div className="space-y-3">
                <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">الميزات الأساسية</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>توصيات تداول مباشرة</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>سجل خاص لإحصاء صفقاتك</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>دعم فني</span>
                  </li>
                </ul>
              </div>

              {/* Supply & Demand Analyzer */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">محلل العرض والطلب</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحديد مناطق العرض والطلب</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>إعداد صفقات مقترحة آلياً</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحليل قوة المناطق</span>
                  </li>
                </ul>
              </div>

              {/* Chart Analysis */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-amber-400" />
                  <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">تحليل الشارت المباشر</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>شارت TradingView مباشر</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحليل بالذكاء الاصطناعي</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>توصيات CALL/PUT من الشارت</span>
                  </li>
                </ul>
              </div>

              {/* Supported Markets */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">الأسواق المدعومة</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">الفوركس</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">الأسهم</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">العملات الرقمية</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">المعادن</Badge>
                </div>
              </div>

              {/* Pro Signals */}
              <div className="bg-amber-500/15 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-semibold">+ توصيات المحترفين الحصرية</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VIP 1 Month Package - 200 SAR - Most Popular */}
          <Card className="bg-gradient-to-b from-amber-950/50 to-slate-900/80 border-amber-400 backdrop-blur-xl relative overflow-hidden group hover:border-amber-300 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 ring-2 ring-amber-500/20">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-400"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl"></div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center justify-between gap-2">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg shadow-amber-500/20">
                  <Crown className="h-3 w-3 ml-1" />
                  باقة VIP
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <Star className="h-3 w-3 ml-1" />
                  الأكثر شعبية
                </Badge>
              </div>
              <CardTitle className="text-xl text-white mt-3">شهر واحد</CardTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">200</span>
                <span className="text-slate-300">ريال</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 relative">
              {/* Basic Features */}
              <div className="space-y-3">
                <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">الميزات الأساسية</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>توصيات تداول مباشرة</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>سجل خاص لإحصاء صفقاتك</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>دعم فني</span>
                  </li>
                </ul>
              </div>

              {/* Supply & Demand Analyzer */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">محلل العرض والطلب</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحديد مناطق العرض والطلب</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>إعداد صفقات مقترحة آلياً</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحليل قوة المناطق</span>
                  </li>
                </ul>
              </div>

              {/* Chart Analysis */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-amber-400" />
                  <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">تحليل الشارت المباشر</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>شارت TradingView مباشر</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>تحليل بالذكاء الاصطناعي</span>
                  </li>
                  <li className="flex items-center gap-3 text-amber-100">
                    <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span>توصيات CALL/PUT من الشارت</span>
                  </li>
                </ul>
              </div>

              {/* Supported Markets */}
              <div className="space-y-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">الأسواق المدعومة</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">الفوركس</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">الأسهم</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">العملات الرقمية</Badge>
                  <Badge variant="outline" className="border-amber-400/50 text-amber-200 text-xs">المعادن</Badge>
                </div>
              </div>

              {/* Pro Signals */}
              <div className="bg-amber-500/15 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-semibold">+ توصيات المحترفين الحصرية</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Contact */}
        <Card className="bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border-emerald-500/30 backdrop-blur-xl">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-right">
                <p className="font-semibold text-white text-lg">للحصول على كود الاشتراك</p>
                <p className="text-sm text-primary-foreground bg-secondary-foreground">تواصل معنا عبر الواتساب للحصول على الكود</p>
              </div>
              <Button onClick={openWhatsApp} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" size="lg">
                <MessageCircle className="h-5 w-5" />
                تواصل على الواتساب
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activation Form */}
        <Card className="bg-slate-900/60 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="h-5 w-5 text-amber-500" />
              تفعيل كود الاشتراك
            </CardTitle>
            <CardDescription className="text-slate-400">
              أدخل كود الاشتراك الذي حصلت عليه
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-slate-300">كود الاشتراك</Label>
              <Input id="code" value={subscriptionCode} onChange={e => setSubscriptionCode(e.target.value.toUpperCase())} onKeyPress={e => e.key === "Enter" && handleActivateCode()} placeholder="XXXX-XXXX-XXXX" className="font-mono text-center text-lg bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" maxLength={14} />
            </div>
            <Button onClick={handleActivateCode} disabled={loading || !subscriptionCode.trim()} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0" size="lg">
              {loading ? <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التفعيل...
                </> : "تفعيل الاشتراك"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default SubscriptionCheck;