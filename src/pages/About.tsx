import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Target, Users, Award, TrendingUp, Shield, Zap, Globe, MessageCircle, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
const About = () => {
  const navigate = useNavigate();
  const stats = [{
    value: "50,000+",
    label: "متداول نشط",
    icon: Users
  }, {
    value: "85%+",
    label: "نسبة النجاح",
    icon: TrendingUp
  }, {
    value: "24/7",
    label: "دعم متواصل",
    icon: MessageCircle
  }, {
    value: "100+",
    label: "توصية يومياً",
    icon: Target
  }];
  const features = [{
    icon: Zap,
    title: "توصيات فورية",
    description: "نقدم توصيات تداول احترافية في الوقت الحقيقي مع تحليل دقيق للسوق"
  }, {
    icon: Shield,
    title: "موثوقية عالية",
    description: "فريق من المحللين المحترفين يعملون على مدار الساعة لتقديم أفضل التوصيات"
  }, {
    icon: Globe,
    title: "تغطية شاملة",
    description: "نغطي جميع الأسواق المالية: العملات، الأسهم، العملات الرقمية، والسلع"
  }, {
    icon: Award,
    title: "خبرة واسعة",
    description: "سنوات من الخبرة في أسواق المال مع سجل حافل بالنجاحات"
  }];
  const values = ["الشفافية والمصداقية في جميع توصياتنا", "التعليم المستمر لتطوير مهارات المتداولين", "الدعم الفني السريع والفعال", "التحديث المستمر لاستراتيجيات التداول", "حماية رأس المال كأولوية قصوى"];
  return <div className="min-h-screen bg-background pt-[calc(env(safe-area-inset-top,0px)+88px)]">
      <div className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">منصة احترافية للتداول</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            من نحن
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tifue Trader - أقوى منصة توصيات وتحليل في الشرق الأوسط لجميع أسواق المال
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
              <CardContent className="p-6">
                <div className="flex justify-center mb-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>)}
        </div>

        {/* About Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl">قصتنا</CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4 text-muted-foreground leading-relaxed">
            <p>
              تأسست منصة <strong className="text-foreground">Tifue Trader</strong> بهدف تقديم خدمات تداول احترافية للمتداولين في منطقة الشرق الأوسط والعالم العربي. نحن فريق من المحللين والخبراء الماليين الذين يمتلكون خبرة واسعة في أسواق المال العالمية.
            </p>
            <p>
              نؤمن بأن كل متداول يستحق الوصول إلى تحليلات وتوصيات عالية الجودة، ولذلك نعمل على توفير أدوات وخدمات متطورة تساعد المتداولين على اتخاذ قرارات استثمارية مدروسة.
            </p>
            <p>
              مهمتنا هي تمكين المتداولين من تحقيق أهدافهم المالية من خلال توفير توصيات دقيقة، تحليلات معمقة، وتعليم مستمر في مجال التداول.
            </p>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">لماذا تختار Tifue Trader؟</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Values Section */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Award className="h-5 w-5 text-primary" />
              </div>
              قيمنا ومبادئنا
            </CardTitle>
            <CardDescription>
              المبادئ التي نلتزم بها في تقديم خدماتنا
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-3">
              {values.map((value, index) => <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-primary/20">
                  <div className="rounded-full bg-primary/20 p-2 shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{value}</p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">ابدأ رحلتك في التداول معنا</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              انضم إلى آلاف المتداولين الناجحين واستفد من توصياتنا وتحليلاتنا الاحترافية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
                العودة للرئيسية
              </Button>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default About;