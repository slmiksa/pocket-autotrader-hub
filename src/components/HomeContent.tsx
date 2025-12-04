import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, Newspaper, Target, Shield, Zap, LineChart, ArrowUpRight, CheckCircle2, Star, Users, Award, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Import trading images
import heroTrading1 from "@/assets/hero-trading-1.jpg";
import heroTrading2 from "@/assets/hero-trading-2.jpg";
import heroTrading3 from "@/assets/hero-trading-3.jpg";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string | null;
  gradient_color: string;
  is_active: boolean;
  display_order: number;
}

const defaultImages = [heroTrading1, heroTrading2, heroTrading3];

const gradientMap: Record<string, string> = {
  primary: "from-primary/40 via-primary/20 to-transparent",
  blue: "from-blue-500/40 via-blue-500/20 to-transparent",
  purple: "from-purple-500/40 via-purple-500/20 to-transparent",
  emerald: "from-emerald-500/40 via-emerald-500/20 to-transparent",
  amber: "from-amber-500/40 via-amber-500/20 to-transparent",
  red: "from-red-500/40 via-red-500/20 to-transparent",
};

const iconMap: Record<string, any> = {
  "/binary-options": Target,
  "/supply-demand": BarChart3,
  "/news": Newspaper,
  "/markets": LineChart,
  "/live-chart": LineChart,
  "/professional-signals": Star,
};

export const HomeContent = () => {
  const navigate = useNavigate();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setHeroSlides(data || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [{
    icon: Target,
    title: "توصيات الخيارات الثنائية",
    description: "توصيات تداول مباشرة مع نسبة نجاح عالية",
    path: "/binary-options",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/30"
  }, {
    icon: BarChart3,
    title: "محلل العرض والطلب",
    description: "تحليل مناطق العرض والطلب بالذكاء الاصطناعي",
    path: "/supply-demand",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30"
  }, {
    icon: LineChart,
    title: "الأسواق المالية",
    description: "أسعار حية للأسهم والعملات والعملات الرقمية",
    path: "/markets",
    gradient: "from-amber-500/20 to-amber-600/5",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30"
  }, {
    icon: Newspaper,
    title: "أخبار الأسواق",
    description: "آخر الأخبار المالية والاقتصادية المؤثرة",
    path: "/news",
    gradient: "from-purple-500/20 to-purple-600/5",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/30"
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

  const tradingTips = [
    "إدارة رأس المال هي مفتاح النجاح - لا تخاطر بأكثر من 1-2% من رأس مالك في صفقة واحدة",
    "التزم بالتوصيات واتبع الخطة - لا تدخل صفقات عشوائية",
    "راقب الأخبار الاقتصادية قبل التداول - الأحداث الكبرى تؤثر على السوق",
    "تعلم من الخسائر وحلل أخطاءك - كل خسارة هي درس للمستقبل"
  ];

  return (
    <div className="space-y-8">
      {/* Hero Slider */}
      <div className="relative">
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
            direction: "rtl"
          }}
        >
          <CarouselContent>
            {(heroSlides.length > 0 ? heroSlides : []).map((slide, index) => {
              const SlideIcon = iconMap[slide.button_link] || Sparkles;
              const bgImage = slide.image_url || defaultImages[index % defaultImages.length];
              const gradient = gradientMap[slide.gradient_color] || gradientMap.primary;
              
              return (
                <CarouselItem key={slide.id}>
                  <Card className="relative overflow-hidden border-0 min-h-[300px] md:min-h-[350px]">
                    {/* Background Image */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-l ${gradient}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent" />
                    
                    <CardContent className="relative z-10 p-8 md:p-12 h-full flex items-center">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                        <div className="text-center md:text-right space-y-4 flex-1">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/30 border border-white/20 backdrop-blur-sm">
                            <SlideIcon className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">منصة احترافية</span>
                          </div>
                          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground drop-shadow-lg">
                            {slide.title}
                          </h1>
                          <p className="text-lg text-foreground/90 max-w-xl drop-shadow">
                            {slide.subtitle}
                          </p>
                          <Button 
                            size="lg" 
                            className="mt-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                            onClick={() => navigate(slide.button_link)}
                          >
                            {slide.button_text}
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Decorative Icon */}
                        <div className="hidden md:flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-28 h-28 rounded-full bg-background/30 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                              <SlideIcon className="h-14 w-14 text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
            
            {/* Fallback if no slides from DB */}
            {heroSlides.length === 0 && !loading && (
              <CarouselItem>
                <Card className="relative overflow-hidden border-0 min-h-[300px] md:min-h-[350px]">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroTrading1})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-primary/40 via-primary/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent" />
                  
                  <CardContent className="relative z-10 p-8 md:p-12 h-full flex items-center">
                    <div className="text-center md:text-right space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/30 border border-white/20 backdrop-blur-sm">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">منصة احترافية</span>
                      </div>
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground drop-shadow-lg">
                        منصة التوصيات الذكية
                      </h1>
                      <p className="text-lg text-foreground/90 max-w-xl drop-shadow">
                        احصل على توصيات تداول احترافية بالذكاء الاصطناعي
                      </p>
                      <Button 
                        size="lg" 
                        className="mt-4 gap-2"
                        onClick={() => navigate("/binary-options")}
                      >
                        ابدأ التداول
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            )}
          </CarouselContent>
          
          {/* Custom Navigation */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <CarouselPrevious className="relative inset-auto translate-y-0 bg-card/50 border-border/50 hover:bg-card backdrop-blur-sm" />
            <CarouselNext className="relative inset-auto translate-y-0 bg-card/50 border-border/50 hover:bg-card backdrop-blur-sm" />
          </div>
        </Carousel>
      </div>

      {/* Quick Access Features */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            الخدمات الرئيسية
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card 
              key={feature.path} 
              className={`group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 bg-gradient-to-br ${feature.gradient} border ${feature.borderColor} backdrop-blur-sm overflow-hidden`}
              onClick={() => navigate(feature.path)}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              </div>
              
              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl ${feature.iconBg} p-3 ring-1 ring-white/10`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <ArrowUpRight className={`h-5 w-5 ${feature.iconColor} opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300`} />
                </div>
                <h4 className="font-bold text-foreground mt-4 text-lg">{feature.title}</h4>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            مميزات المنصة
          </CardTitle>
          <CardDescription>
            لماذا نحن الخيار الأفضل للمتداولين
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature, index) => (
              <div 
                key={index} 
                className="group flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trading Tips */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            نصائح التداول الذهبية
          </CardTitle>
          <CardDescription>
            اتبع هذه النصائح لتحسين نتائج تداولك
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-3 sm:grid-cols-2">
            {tradingTips.map((tip, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-4 rounded-xl bg-background/50 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
              >
                <div className="rounded-full bg-amber-500/20 p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card 
          className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300" 
          onClick={() => navigate("/news")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/20 p-4 group-hover:bg-blue-500/30 transition-colors">
              <Newspaper className="h-7 w-7 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-lg">آخر الأخبار</h4>
              <p className="text-sm text-muted-foreground mt-1">تابع أحدث الأخبار المالية المؤثرة على الأسواق</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </CardContent>
        </Card>

        <Card 
          className="group cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 transition-all duration-300" 
          onClick={() => navigate("/live-chart")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-xl bg-primary/20 p-4 group-hover:bg-primary/30 transition-colors">
              <LineChart className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground text-lg">الشارت المباشر</h4>
              <p className="text-sm text-muted-foreground mt-1">تحليل الشارتات مع أدوات TradingView</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
