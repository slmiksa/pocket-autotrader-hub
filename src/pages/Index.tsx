import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Shield, Zap, Target, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) <= new Date()) {
        navigate("/subscription");
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              منصة التداول الذكية
            </h1>
            <p className="text-muted-foreground text-lg">
              تحليلات دقيقة وتوصيات احترافية للمتداولين
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            خروج
          </Button>
        </div>

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary rounded-lg">
                  <TrendingUp className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">تداول مباشر</CardTitle>
                  <CardDescription>توصيات فورية للأسواق العالمية</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                احصل على توصيات تداول مباشرة من خبراء الأسواق المالية مع نسبة نجاح عالية تصل إلى 89%
              </p>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate("/pocket-option-live")}
              >
                ابدأ التداول الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-success rounded-lg">
                  <BarChart3 className="h-8 w-8 text-success-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">تحليل الرسوم البيانية</CardTitle>
                  <CardDescription>تحليل ذكي بالذكاء الاصطناعي</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                قم برفع صورة للشارت واحصل على تحليل شامل للاتجاه والدعم والمقاومة مع توصيات دقيقة
              </p>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={() => navigate("/image-analysis")}
              >
                جرب التحليل المجاني
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">لماذا تختارنا؟</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">دقة عالية</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  نسبة نجاح تصل إلى 89% في التوصيات المقدمة بناءً على تحليل فني دقيق
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-success/10 rounded-full">
                    <Zap className="h-8 w-8 text-success" />
                  </div>
                </div>
                <CardTitle className="text-center">سرعة فائقة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  توصيات فورية ومباشرة لحظة ظهور الفرص في الأسواق المالية
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-warning/10 rounded-full">
                    <Shield className="h-8 w-8 text-warning" />
                  </div>
                </div>
                <CardTitle className="text-center">إدارة مخاطر</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  نصائح شاملة لإدارة رأس المال والحد من المخاطر في كل صفقة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-success/10 to-warning/10 mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center">إحصائيات المنصة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">89%</div>
                <p className="text-muted-foreground">نسبة النجاح</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">5000+</div>
                <p className="text-muted-foreground">متداول نشط</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-warning mb-2">24/7</div>
                <p className="text-muted-foreground">دعم مستمر</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-chart-green mb-2">1000+</div>
                <p className="text-muted-foreground">توصية يومية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">نصائح التداول الناجح</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <CardTitle>التزم بالتوقيت</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  تأكد من الدخول في الصفقة بالوقت المحدد في التوصية لضمان أفضل النتائج
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-success" />
                  <CardTitle>إدارة رأس المال</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  لا تخاطر بأكثر من 2-5% من رأس مالك في صفقة واحدة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-warning" />
                  <CardTitle>استراتيجية المضاعفة</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  في حال الخسارة، اتبع استراتيجية المضاعفة الآمنة حسب التعليمات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-chart-green" />
                  <CardTitle>متابعة النتائج</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  راقب أداء صفقاتك وتعلم من كل تجربة لتحسين نتائجك
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Warning Footer */}
        <div className="mt-8 p-6 bg-warning/10 border border-warning rounded-lg">
          <p className="text-center text-warning-foreground">
            ⚠️ تحذير مهم: التداول في الأسواق المالية ينطوي على مخاطر عالية وقد يؤدي إلى خسارة رأس المال بالكامل. 
            تأكد من فهم المخاطر قبل البدء وتداول فقط بأموال يمكنك تحمل خسارتها.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
