import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, Newspaper, Target, Shield, Zap, LineChart, ArrowUpRight, CheckCircle2, Star, Users, Award } from "lucide-react";
export const HomeContent = () => {
  const navigate = useNavigate();
  const features = [{
    icon: Target,
    title: "توصيات الخيارات الثنائية",
    description: "توصيات تداول مباشرة مع نسبة نجاح عالية",
    path: "/binary-options",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30"
  }, {
    icon: BarChart3,
    title: "محلل العرض والطلب",
    description: "تحليل مناطق العرض والطلب بالذكاء الاصطناعي",
    path: "/supply-demand",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30"
  }, {
    icon: LineChart,
    title: "الأسواق المالية",
    description: "أسعار حية للأسهم والعملات والعملات الرقمية",
    path: "/markets",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30"
  }, {
    icon: Newspaper,
    title: "أخبار الأسواق",
    description: "آخر الأخبار المالية والاقتصادية المؤثرة",
    path: "/news",
    color: "text-info",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  }];
  const platformFeatures = [{
    icon: Zap,
    title: "توصيات فورية",
    description: "احصل على توصيات تداول في الوقت الحقيقي"
  }, {
    icon: Shield,
    title: "دقة عالية",
    description: "نسبة نجاح تتجاوز 85% في التوصيات"
  }, {
    icon: BarChart3,
    title: "تحليل متقدم",
    description: "تحليلات بالذكاء الاصطناعي للشارتات"
  }, {
    icon: Users,
    title: "دعم متواصل",
    description: "فريق دعم فني على مدار الساعة"
  }];
  const tradingTips = ["إدارة رأس المال هي مفتاح النجاح - لا تخاطر بأكثر من 1-2% من رأس مالك في صفقة واحدة", "التزم بالتوصيات واتبع الخطة - لا تدخل صفقات عشوائية", "راقب الأخبار الاقتصادية قبل التداول - الأحداث الكبرى تؤثر على السوق", "تعلم من الخسائر وحلل أخطاءك - كل خسارة هي درس للمستقبل"];
  return <div className="space-y-8">
      {/* Hero Section - About Platform */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-success/5 overflow-hidden">
        
      </Card>

      {/* Quick Access Features */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">الخدمات الرئيسية</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(feature => <Card key={feature.path} className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${feature.borderColor} ${feature.bgColor}`} onClick={() => navigate(feature.path)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg ${feature.bgColor} p-2`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <ArrowUpRight className={`h-4 w-4 ${feature.color}`} />
                </div>
                <h4 className="font-semibold text-foreground mt-3">{feature.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
              </CardContent>
            </Card>)}
        </div>
      </div>

      {/* Platform Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            مميزات المنصة
          </CardTitle>
          <CardDescription>
            لماذا نحن الخيار الأفضل للمتداولين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="rounded-full bg-primary/10 p-2">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Trading Tips */}
      <Card className="border-warning/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-warning" />
            نصائح التداول الذهبية
          </CardTitle>
          <CardDescription>
            اتبع هذه النصائح لتحسين نتائج تداولك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {tradingTips.map((tip, index) => <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <CheckCircle2 className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{tip}</p>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/news")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Newspaper className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">آخر الأخبار</h4>
              <p className="text-xs text-muted-foreground">تابع أحدث الأخبار المالية المؤثرة على الأسواق</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/live-chart")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <LineChart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">الشارت المباشر</h4>
              <p className="text-xs text-muted-foreground">تحليل الشارتات مع أدوات TradingView</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>;
};