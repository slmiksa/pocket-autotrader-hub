import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Target, Upload, Image, Info, Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface Zone {
  type: "supply" | "demand";
  upper_price: number;
  lower_price: number;
  strength_score: number;
  candle_index: number;
}
interface TradeSetup {
  type: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  reason: string;
}
const SupplyDemandAnalyzer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [market, setMarket] = useState<string>("forex");
  const [symbol, setSymbol] = useState<string>("EURUSD");
  const [timeframe, setTimeframe] = useState<string>("1H");
  const [zoneDistance, setZoneDistance] = useState<string>("near");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [supplyZones, setSupplyZones] = useState<Zone[]>([]);
  const [demandZones, setDemandZones] = useState<Zone[]>([]);
  const [trend, setTrend] = useState<string>("");
  const [tradeSetup, setTradeSetup] = useState<TradeSetup | null>(null);
  const [signalStatus, setSignalStatus] = useState<"READY" | "WAITING" | "NOT_VALID">("WAITING");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [analysisMode, setAnalysisMode] = useState<"auto" | "image">("image");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  const marketOptions = [{
    value: "forex",
    label: "فوريكس - Forex"
  }, {
    value: "crypto",
    label: "عملات رقمية - Crypto"
  }, {
    value: "stocks",
    label: "أسهم - Stocks"
  }, {
    value: "metals",
    label: "معادن - Metals"
  }];
  const forexSymbols = [
  // Major Pairs
  {
    value: "EURUSD",
    label: "EUR/USD - يورو/دولار"
  }, {
    value: "GBPUSD",
    label: "GBP/USD - جنيه/دولار"
  }, {
    value: "USDJPY",
    label: "USD/JPY - دولار/ين"
  }, {
    value: "USDCHF",
    label: "USD/CHF - دولار/فرنك"
  }, {
    value: "AUDUSD",
    label: "AUD/USD - دولار أسترالي/دولار"
  }, {
    value: "USDCAD",
    label: "USD/CAD - دولار/دولار كندي"
  }, {
    value: "NZDUSD",
    label: "NZD/USD - دولار نيوزيلندي/دولار"
  },
  // Cross Pairs
  {
    value: "EURJPY",
    label: "EUR/JPY - يورو/ين"
  }, {
    value: "GBPJPY",
    label: "GBP/JPY - جنيه/ين"
  }, {
    value: "EURGBP",
    label: "EUR/GBP - يورو/جنيه"
  }, {
    value: "EURAUD",
    label: "EUR/AUD - يورو/دولار أسترالي"
  }, {
    value: "EURCAD",
    label: "EUR/CAD - يورو/دولار كندي"
  }, {
    value: "EURCHF",
    label: "EUR/CHF - يورو/فرنك"
  }, {
    value: "AUDCAD",
    label: "AUD/CAD - دولار أسترالي/كندي"
  }, {
    value: "AUDCHF",
    label: "AUD/CHF - دولار أسترالي/فرنك"
  }, {
    value: "AUDJPY",
    label: "AUD/JPY - دولار أسترالي/ين"
  }, {
    value: "AUDNZD",
    label: "AUD/NZD - دولار أسترالي/نيوزيلندي"
  }, {
    value: "CADJPY",
    label: "CAD/JPY - دولار كندي/ين"
  }, {
    value: "CHFJPY",
    label: "CHF/JPY - فرنك/ين"
  }, {
    value: "GBPAUD",
    label: "GBP/AUD - جنيه/دولار أسترالي"
  }, {
    value: "GBPCAD",
    label: "GBP/CAD - جنيه/دولار كندي"
  }, {
    value: "GBPCHF",
    label: "GBP/CHF - جنيه/فرنك"
  }, {
    value: "GBPNZD",
    label: "GBP/NZD - جنيه/دولار نيوزيلندي"
  }, {
    value: "NZDCAD",
    label: "NZD/CAD - دولار نيوزيلندي/كندي"
  }, {
    value: "NZDCHF",
    label: "NZD/CHF - دولار نيوزيلندي/فرنك"
  }, {
    value: "NZDJPY",
    label: "NZD/JPY - دولار نيوزيلندي/ين"
  }];
  const cryptoSymbols = [{
    value: "BTCUSD",
    label: "BTC/USD - بيتكوين"
  }, {
    value: "ETHUSD",
    label: "ETH/USD - إيثريوم"
  }, {
    value: "BNBUSD",
    label: "BNB/USD - بينانس كوين"
  }, {
    value: "XRPUSD",
    label: "XRP/USD - ريبل"
  }, {
    value: "ADAUSD",
    label: "ADA/USD - كاردانو"
  }, {
    value: "SOLUSD",
    label: "SOL/USD - سولانا"
  }, {
    value: "DOTUSD",
    label: "DOT/USD - بولكادوت"
  }, {
    value: "DOGEUSD",
    label: "DOGE/USD - دوجكوين"
  }, {
    value: "MATICUSD",
    label: "MATIC/USD - بوليجون"
  }, {
    value: "SHIBUSD",
    label: "SHIB/USD - شيبا إينو"
  }, {
    value: "AVAXUSD",
    label: "AVAX/USD - أفالانش"
  }, {
    value: "LINKUSD",
    label: "LINK/USD - تشين لينك"
  }, {
    value: "UNIUSD",
    label: "UNI/USD - يونيسواب"
  }, {
    value: "LTCUSD",
    label: "LTC/USD - لايتكوين"
  }, {
    value: "BCHUSD",
    label: "BCH/USD - بيتكوين كاش"
  }, {
    value: "ATOMUSD",
    label: "ATOM/USD - كوزموس"
  }, {
    value: "FTMUSD",
    label: "FTM/USD - فانتوم"
  }, {
    value: "AAVEUSD",
    label: "AAVE/USD - آفي"
  }, {
    value: "ALGOUSD",
    label: "ALGO/USD - ألجوراند"
  }, {
    value: "APTUSD",
    label: "APT/USD - أبتوس"
  }];
  const stockSymbols = [
  // Tech Giants
  {
    value: "AAPL",
    label: "AAPL - أبل"
  }, {
    value: "MSFT",
    label: "MSFT - مايكروسوفت"
  }, {
    value: "GOOGL",
    label: "GOOGL - جوجل"
  }, {
    value: "AMZN",
    label: "AMZN - أمازون"
  }, {
    value: "META",
    label: "META - ميتا"
  }, {
    value: "TSLA",
    label: "TSLA - تسلا"
  }, {
    value: "NVDA",
    label: "NVDA - إنفيديا"
  }, {
    value: "NFLX",
    label: "NFLX - نيتفليكس"
  },
  // Financial
  {
    value: "JPM",
    label: "JPM - جي بي مورجان"
  }, {
    value: "BAC",
    label: "BAC - بنك أوف أمريكا"
  }, {
    value: "WFC",
    label: "WFC - ويلز فارجو"
  }, {
    value: "GS",
    label: "GS - جولدمان ساكس"
  }, {
    value: "V",
    label: "V - فيزا"
  }, {
    value: "MA",
    label: "MA - ماستركارد"
  },
  // Healthcare
  {
    value: "JNJ",
    label: "JNJ - جونسون آند جونسون"
  }, {
    value: "PFE",
    label: "PFE - فايزر"
  }, {
    value: "UNH",
    label: "UNH - يونايتد هيلث"
  },
  // Consumer
  {
    value: "KO",
    label: "KO - كوكاكولا"
  }, {
    value: "PEP",
    label: "PEP - بيبسي"
  }, {
    value: "WMT",
    label: "WMT - وول مارت"
  }, {
    value: "MCD",
    label: "MCD - ماكدونالدز"
  }, {
    value: "NKE",
    label: "NKE - نايكي"
  },
  // Industrial
  {
    value: "BA",
    label: "BA - بوينج"
  }, {
    value: "CAT",
    label: "CAT - كاتربيلر"
  }, {
    value: "MMM",
    label: "MMM - 3M"
  },
  // Energy
  {
    value: "XOM",
    label: "XOM - إكسون موبيل"
  }, {
    value: "CVX",
    label: "CVX - شيفرون"
  }];
  const metalSymbols = [{
    value: "XAUUSD",
    label: "XAU/USD - الذهب"
  }, {
    value: "XAGUSD",
    label: "XAG/USD - الفضة"
  }, {
    value: "XPTUSD",
    label: "XPT/USD - البلاتين"
  }, {
    value: "XPDUSD",
    label: "XPD/USD - البلاديوم"
  }, {
    value: "XCUUSD",
    label: "XCU/USD - النحاس"
  }];
  const getSymbolsForMarket = () => {
    switch (market) {
      case "forex":
        return forexSymbols;
      case "crypto":
        return cryptoSymbols;
      case "stocks":
        return stockSymbols;
      case "metals":
        return metalSymbols;
      default:
        return forexSymbols;
    }
  };

  // Check access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "خطأ",
            description: "يجب تسجيل الدخول أولاً",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("supply_demand_enabled")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking access:", error);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setHasAccess(data?.supply_demand_enabled || false);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setHasAccess(false);
        setLoading(false);
      }
    };

    checkAccess();
  }, [navigate]);

  // Update symbol when market changes
  useEffect(() => {
    const symbols = getSymbolsForMarket();
    if (symbols.length > 0) {
      setSymbol(symbols[0].value);
    }
  }, [market]);
  const timeframeOptions = [{
    value: "1m",
    label: "1 دقيقة"
  }, {
    value: "5m",
    label: "5 دقائق"
  }, {
    value: "15m",
    label: "15 دقيقة"
  }, {
    value: "30m",
    label: "30 دقيقة"
  }, {
    value: "1H",
    label: "1 ساعة"
  }, {
    value: "4H",
    label: "4 ساعات"
  }, {
    value: "1D",
    label: "يوم واحد"
  }];

  const zoneDistanceOptions = [{
    value: "near",
    label: "قريبة (0.5% - 2%)"
  }, {
    value: "far",
    label: "بعيدة (2% - 5%)"
  }];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة كبير جداً. الحد الأقصى 10 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setAnalysisComplete(false);
        setImageAnalysis("");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setAnalysisComplete(false);
    setImageAnalysis("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageAnalysis = async () => {
    if (!uploadedImage) {
      toast({
        title: "خطأ",
        description: "الرجاء رفع صورة الرسم البياني أولاً",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-supply-demand-image', {
        body: {
          image: uploadedImage,
          market,
          symbol,
          timeframe,
          zoneDistance
        }
      });

      if (error) throw error;

      if (data.success !== false) {
        setSupplyZones(data.supplyZones || []);
        setDemandZones(data.demandZones || []);
        setTrend(data.trend || "");
        setTradeSetup(data.tradeSetup || null);
        setSignalStatus(data.signalStatus || "WAITING");
        setCurrentPrice(data.currentPrice || 0);
        setImageAnalysis(data.analysis || "");
        setAnalysisComplete(true);
        
        toast({
          title: "✅ تم التحليل بنجاح",
          description: "تم تحليل الصورة وتحديد مناطق العرض والطلب"
        });
      } else {
        throw new Error(data.error || "فشل التحليل");
      }
    } catch (error: any) {
      console.error("Image analysis error:", error);
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء تحليل الصورة",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!symbol.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال رمز السوق",
        variant: "destructive"
      });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-supply-demand', {
        body: {
          market,
          symbol: symbol.toUpperCase(),
          timeframe,
          zoneDistance
        }
      });
      if (error) throw error;
      if (data.success) {
        setSupplyZones(data.supplyZones || []);
        setDemandZones(data.demandZones || []);
        setTrend(data.trend || "");
        setTradeSetup(data.tradeSetup || null);
        setSignalStatus(data.signalStatus || "WAITING");
        setCurrentPrice(data.currentPrice || 0);
        setAnalysisComplete(true);
        toast({
          title: "✅ تم التحليل بنجاح",
          description: `تم تحليل ${symbol} على إطار ${timeframe}`
        });
      } else {
        throw new Error(data.message || "فشل التحليل");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء التحليل",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  const getTrendIcon = () => {
    if (trend === "Uptrend") return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === "Downtrend") return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-yellow-500" />;
  };
  const getTrendColor = () => {
    if (trend === "Uptrend") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (trend === "Downtrend") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  };
  const getSignalStatusColor = () => {
    if (signalStatus === "READY") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (signalStatus === "WAITING") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                محلل العرض والطلب
              </h1>
              <p className="text-muted-foreground">Supply & Demand + Price Action Analysis</p>
            </div>
          </div>

          {/* Access Denied Card */}
          <Card className="p-8 text-center space-y-6 border-muted-foreground/20">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted/20 p-4">
                <Info className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">الميزة غير مفعلة</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                محلل العرض والطلب غير متاح حالياً لحسابك. يرجى التواصل مع الإدارة لتفعيل هذه الميزة.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/")} variant="outline" size="lg">
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
              <Button
                onClick={() => window.open("https://wa.me/966575594911?text=مرحباً، أريد تفعيل محلل العرض والطلب", "_blank")}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                تواصل عبر واتساب
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              محلل العرض والطلب
            </h1>
            <p className="text-muted-foreground">Supply & Demand + Price Action Analysis</p>
          </div>
        </div>

        {/* Input Panel with Tabs */}
        <Tabs value={analysisMode} onValueChange={(v) => setAnalysisMode(v as "auto" | "image")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              تحليل بالصورة
            </TabsTrigger>
            <TabsTrigger value="auto" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              تحليل تلقائي
            </TabsTrigger>
          </TabsList>

          {/* Image Analysis Tab */}
          <TabsContent value="image" className="space-y-4">
            {/* Screenshot Tips */}
            <Card className="p-4 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-400">نصائح لالتقاط صورة مثالية</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>📊 استخدم شارت نظيف بدون مؤشرات كثيرة</li>
                    <li>🔍 تأكد من وضوح الأسعار على المحور الأيمن</li>
                    <li>📏 أظهر ما لا يقل عن 50-100 شمعة</li>
                    <li>🖼️ التقط الشاشة كاملة للرسم البياني</li>
                    <li>⏰ تأكد من ظهور الإطار الزمني في الصورة</li>
                    <li>💡 يفضل استخدام خلفية داكنة للوضوح</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Image Upload Section */}
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
              <div className="space-y-4">
                {/* Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>نوع السوق</Label>
                    <Select value={market} onValueChange={setMarket}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {marketOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>رمز السوق</Label>
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getSymbolsForMarket().map(sym => <SelectItem key={sym.value} value={sym.value}>
                          {sym.label}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الإطار الزمني</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>مسافة المناطق</Label>
                    <Select value={zoneDistance} onValueChange={setZoneDistance}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneDistanceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {!uploadedImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Camera className="w-12 h-12 mx-auto text-primary/50 mb-4" />
                      <p className="text-lg font-medium">اضغط لرفع صورة الرسم البياني</p>
                      <p className="text-sm text-muted-foreground mt-2">PNG, JPG, WEBP - حد أقصى 10 ميجابايت</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Uploaded chart"
                        className="w-full max-h-[400px] object-contain rounded-xl border border-primary/20"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleImageAnalysis}
                  disabled={isAnalyzing || !uploadedImage}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      جاري تحليل الصورة...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      تحليل مناطق العرض والطلب
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Auto Analysis Tab */}
          <TabsContent value="auto">
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label>نوع السوق</Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {marketOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>رمز السوق</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getSymbolsForMarket().map(sym => <SelectItem key={sym.value} value={sym.value}>
                        {sym.label}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الإطار الزمني</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>مسافة المناطق</Label>
                  <Select value={zoneDistance} onValueChange={setZoneDistance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneDistanceOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleStartAnalysis} disabled={isAnalyzing} className="bg-primary hover:bg-primary/90" size="lg">
                  {isAnalyzing ? "جاري التحليل..." : "بدء التحليل"}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Section */}
        {analysisComplete && <>
            {/* Image Analysis Text */}
            {imageAnalysis && analysisMode === "image" && (
              <Card className="p-6 border-primary/20 bg-gradient-to-br from-card/80 to-blue-500/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  تحليل الذكاء الاصطناعي
                </h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{imageAnalysis}</p>
              </Card>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الاتجاه</p>
                    <p className="text-lg font-bold">{trend || "غير محدد"}</p>
                  </div>
                  {getTrendIcon()}
                </div>
              </Card>

              <Card className="p-4 border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground">السعر الحالي</p>
                  <p className="text-lg font-bold text-primary">{currentPrice > 0 ? currentPrice.toFixed(5) : "---"}</p>
                </div>
              </Card>

              <Card className="p-4 border-primary/20">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مناطق العرض</p>
                    <p className="text-lg font-bold text-red-400">{supplyZones.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مناطق الطلب</p>
                    <p className="text-lg font-bold text-green-400">{demandZones.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">حالة الإشارة</p>
                    <Badge className={getSignalStatusColor()}>
                      {signalStatus}
                    </Badge>
                  </div>
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </Card>
            </div>

            {/* Trade Setup */}
            {tradeSetup && <Card className="p-6 border-primary/20 bg-gradient-to-br from-card/80 to-primary/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  إعداد الصفقة المقترح
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">نوع الصفقة</span>
                      <Badge className={tradeSetup.type === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {tradeSetup.type === "BUY" ? "شراء" : "بيع"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">نقطة الدخول</span>
                      <span className="font-bold">{tradeSetup.entry.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">وقف الخسارة</span>
                      <span className="font-bold text-red-400">{tradeSetup.stopLoss.toFixed(5)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">الهدف الأول</span>
                      <span className="font-bold text-green-400">{tradeSetup.takeProfit1.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                      <span className="text-muted-foreground">الهدف الثاني</span>
                      <span className="font-bold text-green-400">{tradeSetup.takeProfit2.toFixed(5)}</span>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">السبب</p>
                      <p className="text-sm">{tradeSetup.reason}</p>
                    </div>
                  </div>
                </div>
              </Card>}

            {/* Zones Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supply Zones */}
              <Card className="p-6 border-red-500/20">
                <h3 className="text-xl font-bold mb-4 text-red-400">مناطق العرض (البيع)</h3>
                <div className="space-y-3">
                  {supplyZones.length === 0 ? <p className="text-muted-foreground text-center py-4">لم يتم العثور على مناطق عرض</p> : supplyZones.map((zone, idx) => <div key={idx} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">منطقة {idx + 1}</span>
                          <Badge className="bg-red-500/20 text-red-400">
                            قوة: {zone.strength_score.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحد العلوي</span>
                            <span className="font-mono">{zone.upper_price.toFixed(5)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحد السفلي</span>
                            <span className="font-mono">{zone.lower_price.toFixed(5)}</span>
                          </div>
                        </div>
                      </div>)}
                </div>
              </Card>

              {/* Demand Zones */}
              <Card className="p-6 border-green-500/20">
                <h3 className="text-xl font-bold mb-4 text-green-400">مناطق الطلب (الشراء)</h3>
                <div className="space-y-3">
                  {demandZones.length === 0 ? <p className="text-muted-foreground text-center py-4">لم يتم العثور على مناطق طلب</p> : demandZones.map((zone, idx) => <div key={idx} className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">منطقة {idx + 1}</span>
                          <Badge className="bg-green-500/20 text-green-400">
                            قوة: {zone.strength_score.toFixed(1)}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحد العلوي</span>
                            <span className="font-mono">{zone.upper_price.toFixed(5)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحد السفلي</span>
                            <span className="font-mono">{zone.lower_price.toFixed(5)}</span>
                          </div>
                        </div>
                      </div>)}
                </div>
              </Card>
            </div>

            {/* Chart Section */}
            
          </>}

        {/* Initial State */}
        {!analysisComplete && !isAnalyzing && <Card className="p-12 border-primary/20 bg-card/50 backdrop-blur">
            <div className="text-center space-y-4">
              <Activity className="w-16 h-16 mx-auto text-primary opacity-50" />
              <h3 className="text-2xl font-bold">ابدأ التحليل الآن</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                اختر نوع السوق والرمز والإطار الزمني، ثم اضغط على "بدء التحليل" لاكتشاف مناطق العرض والطلب تلقائياً
              </p>
            </div>
          </Card>}
      </div>
    </div>;
};
export default SupplyDemandAnalyzer;