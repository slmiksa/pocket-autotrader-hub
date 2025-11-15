import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, MessageCircle, Lock, TrendingUp, Target, Activity, ArrowUp, ArrowDown, Shield, DollarSign, Image as ImageIcon } from "lucide-react";
import { AnalysisResult } from "@/components/AnalysisResult";

const FOREX_PAIRS = [
  // Major Pairs
  { value: "EURUSD", label: "EUR/USD - Euro/US Dollar" },
  { value: "GBPUSD", label: "GBP/USD - British Pound/US Dollar" },
  { value: "USDJPY", label: "USD/JPY - US Dollar/Japanese Yen" },
  { value: "USDCHF", label: "USD/CHF - US Dollar/Swiss Franc" },
  { value: "AUDUSD", label: "AUD/USD - Australian Dollar/US Dollar" },
  { value: "USDCAD", label: "USD/CAD - US Dollar/Canadian Dollar" },
  { value: "NZDUSD", label: "NZD/USD - New Zealand Dollar/US Dollar" },
  
  // Cross Pairs
  { value: "EURGBP", label: "EUR/GBP - Euro/British Pound" },
  { value: "EURJPY", label: "EUR/JPY - Euro/Japanese Yen" },
  { value: "GBPJPY", label: "GBP/JPY - British Pound/Japanese Yen" },
  { value: "EURCHF", label: "EUR/CHF - Euro/Swiss Franc" },
  { value: "EURAUD", label: "EUR/AUD - Euro/Australian Dollar" },
  { value: "EURCAD", label: "EUR/CAD - Euro/Canadian Dollar" },
  { value: "EURNZD", label: "EUR/NZD - Euro/New Zealand Dollar" },
  { value: "GBPCHF", label: "GBP/CHF - British Pound/Swiss Franc" },
  { value: "GBPAUD", label: "GBP/AUD - British Pound/Australian Dollar" },
  { value: "GBPCAD", label: "GBP/CAD - British Pound/Canadian Dollar" },
  { value: "GBPNZD", label: "GBP/NZD - British Pound/New Zealand Dollar" },
  { value: "AUDCAD", label: "AUD/CAD - Australian Dollar/Canadian Dollar" },
  { value: "AUDJPY", label: "AUD/JPY - Australian Dollar/Japanese Yen" },
  { value: "AUDNZD", label: "AUD/NZD - Australian Dollar/New Zealand Dollar" },
  { value: "AUDCHF", label: "AUD/CHF - Australian Dollar/Swiss Franc" },
  { value: "CADJPY", label: "CAD/JPY - Canadian Dollar/Japanese Yen" },
  { value: "CHFJPY", label: "CHF/JPY - Swiss Franc/Japanese Yen" },
  { value: "NZDJPY", label: "NZD/JPY - New Zealand Dollar/Japanese Yen" },
  { value: "NZDCAD", label: "NZD/CAD - New Zealand Dollar/Canadian Dollar" },
  { value: "NZDCHF", label: "NZD/CHF - New Zealand Dollar/Swiss Franc" },
  
  // Exotic Pairs
  { value: "USDTRY", label: "USD/TRY - US Dollar/Turkish Lira" },
  { value: "USDZAR", label: "USD/ZAR - US Dollar/South African Rand" },
  { value: "USDMXN", label: "USD/MXN - US Dollar/Mexican Peso" },
  { value: "USDBRL", label: "USD/BRL - US Dollar/Brazilian Real" },
  { value: "USDSGD", label: "USD/SGD - US Dollar/Singapore Dollar" },
  { value: "USDHKD", label: "USD/HKD - US Dollar/Hong Kong Dollar" },
  { value: "USDSEK", label: "USD/SEK - US Dollar/Swedish Krona" },
  { value: "USDNOK", label: "USD/NOK - US Dollar/Norwegian Krone" },
  { value: "USDDKK", label: "USD/DKK - US Dollar/Danish Krone" },
  { value: "USDPLN", label: "USD/PLN - US Dollar/Polish Zloty" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1 دقيقة" },
  { value: "5m", label: "5 دقائق" },
  { value: "15m", label: "15 دقيقة" },
  { value: "30m", label: "30 دقيقة" },
  { value: "1h", label: "ساعة واحدة" },
  { value: "3h", label: "3 ساعات" },
  { value: "4h", label: "4 ساعات" },
  { value: "1d", label: "يوم واحد" },
  { value: "1w", label: "أسبوع واحد" },
  { value: "1M", label: "شهر واحد" },
];

const US_STOCKS = [
  // Technology
  { value: "AAPL", label: "Apple Inc. (AAPL)" },
  { value: "MSFT", label: "Microsoft Corporation (MSFT)" },
  { value: "GOOGL", label: "Alphabet Inc. (GOOGL)" },
  { value: "AMZN", label: "Amazon.com Inc. (AMZN)" },
  { value: "META", label: "Meta Platforms Inc. (META)" },
  { value: "NVDA", label: "NVIDIA Corporation (NVDA)" },
  { value: "TSLA", label: "Tesla Inc. (TSLA)" },
  { value: "NFLX", label: "Netflix Inc. (NFLX)" },
  { value: "ADBE", label: "Adobe Inc. (ADBE)" },
  { value: "CRM", label: "Salesforce Inc. (CRM)" },
  { value: "ORCL", label: "Oracle Corporation (ORCL)" },
  { value: "CSCO", label: "Cisco Systems Inc. (CSCO)" },
  { value: "INTC", label: "Intel Corporation (INTC)" },
  { value: "AMD", label: "Advanced Micro Devices (AMD)" },
  { value: "QCOM", label: "QUALCOMM Inc. (QCOM)" },
  
  // Finance
  { value: "JPM", label: "JPMorgan Chase & Co. (JPM)" },
  { value: "BAC", label: "Bank of America Corp. (BAC)" },
  { value: "WFC", label: "Wells Fargo & Co. (WFC)" },
  { value: "GS", label: "Goldman Sachs Group Inc. (GS)" },
  { value: "MS", label: "Morgan Stanley (MS)" },
  { value: "V", label: "Visa Inc. (V)" },
  { value: "MA", label: "Mastercard Inc. (MA)" },
  { value: "AXP", label: "American Express Co. (AXP)" },
  { value: "BLK", label: "BlackRock Inc. (BLK)" },
  
  // Healthcare
  { value: "JNJ", label: "Johnson & Johnson (JNJ)" },
  { value: "UNH", label: "UnitedHealth Group Inc. (UNH)" },
  { value: "PFE", label: "Pfizer Inc. (PFE)" },
  { value: "ABBV", label: "AbbVie Inc. (ABBV)" },
  { value: "TMO", label: "Thermo Fisher Scientific (TMO)" },
  { value: "MRK", label: "Merck & Co. Inc. (MRK)" },
  { value: "LLY", label: "Eli Lilly and Co. (LLY)" },
  { value: "ABT", label: "Abbott Laboratories (ABT)" },
  
  // Consumer
  { value: "WMT", label: "Walmart Inc. (WMT)" },
  { value: "PG", label: "Procter & Gamble Co. (PG)" },
  { value: "KO", label: "Coca-Cola Co. (KO)" },
  { value: "PEP", label: "PepsiCo Inc. (PEP)" },
  { value: "COST", label: "Costco Wholesale Corp. (COST)" },
  { value: "NKE", label: "Nike Inc. (NKE)" },
  { value: "MCD", label: "McDonald's Corp. (MCD)" },
  { value: "SBUX", label: "Starbucks Corp. (SBUX)" },
  { value: "TGT", label: "Target Corp. (TGT)" },
  { value: "HD", label: "Home Depot Inc. (HD)" },
  { value: "LOW", label: "Lowe's Companies Inc. (LOW)" },
  
  // Energy
  { value: "XOM", label: "Exxon Mobil Corp. (XOM)" },
  { value: "CVX", label: "Chevron Corp. (CVX)" },
  { value: "COP", label: "ConocoPhillips (COP)" },
  { value: "SLB", label: "Schlumberger NV (SLB)" },
  
  // Industrial
  { value: "BA", label: "Boeing Co. (BA)" },
  { value: "CAT", label: "Caterpillar Inc. (CAT)" },
  { value: "GE", label: "General Electric Co. (GE)" },
  { value: "MMM", label: "3M Co. (MMM)" },
  { value: "UPS", label: "United Parcel Service (UPS)" },
  { value: "HON", label: "Honeywell International (HON)" },
  
  // Telecom & Media
  { value: "T", label: "AT&T Inc. (T)" },
  { value: "VZ", label: "Verizon Communications (VZ)" },
  { value: "DIS", label: "Walt Disney Co. (DIS)" },
  { value: "CMCSA", label: "Comcast Corp. (CMCSA)" },
];

const ANALYSIS_TYPES = [
  { value: "trading", label: "مضاربة قصيرة الأجل" },
  { value: "investment", label: "استثمار طويل الأجل" },
];
const ImageAnalysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<"recommendation" | "support-resistance">("recommendation");
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedForexPair, setSelectedForexPair] = useState<string>("");
  const [forexTimeframe, setForexTimeframe] = useState<string>("5m");
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [stockTimeframe, setStockTimeframe] = useState<string>("1d");
  const [stockAnalysisType, setStockAnalysisType] = useState<string>("trading");
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("يجب تسجيل الدخول أولاً");
          navigate("/auth");
          return;
        }
        const {
          data,
          error
        } = await supabase.from("profiles").select("image_analysis_enabled").eq("user_id", user.id).single();
        if (error) {
          console.error("Error checking access:", error);
          setHasAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(data?.image_analysis_enabled || false);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setHasAccess(false);
        setLoading(false);
      }
    };
    checkAccess();
  }, [navigate]);
  const processImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('تم تحميل الصورة بنجاح');
    } else {
      toast.error('يرجى اختيار ملف صورة صحيح');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processImageFile(file);
            }
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  const openWhatsApp = () => {
    const phoneNumber = "966575594911";
    const message = "مرحباً، أريد ترقية الباقة للحصول على ميزة تحليل الصور";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("يرجى اختيار صورة صالحة");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAnalyzeForex = async () => {
    if (!selectedForexPair) {
      toast.error("الرجاء اختيار زوج العملات");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: selectedForexPair,
          timeframe: forexTimeframe,
          assetType: 'forex'
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(JSON.stringify(data.analysis));
        toast.success("تم التحليل بنجاح");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل زوج العملات");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeStock = async () => {
    if (!selectedStock) {
      toast.error("الرجاء اختيار السهم");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: selectedStock,
          timeframe: stockTimeframe,
          assetType: 'stock',
          analysisType: stockAnalysisType
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(JSON.stringify(data.analysis));
        toast.success("تم التحليل بنجاح");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل السهم");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !timeframe) {
      toast.error("يرجى رفع صورة واختيار فترة الشمعة");
      return;
    }
    setAnalyzing(true);
    setAnalysis("");
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const {
          data,
          error
        } = await supabase.functions.invoke('analyze-chart-image', {
          body: {
            image: base64Image,
            timeframe: timeframe,
            analysisType: analysisType
          }
        });
        if (error) throw error;
        setAnalysis(JSON.stringify(data.analysis));
        toast.success("تم تحليل الصورة بنجاح");
      };
      reader.readAsDataURL(image);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "حدث خطأ أثناء تحليل الصورة");
    } finally {
      setAnalyzing(false);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (!hasAccess) {
    return <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="ml-2 h-4 w-4" />
            رجوع
          </Button>

          <Card className="border-amber-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl">ميزة غير متاحة</CardTitle>
              <CardDescription>
                اشتراكك الحالي لا يسمح بالوصول إلى ميزة تحليل الصور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">للحصول على هذه الميزة:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>تحليل الشارت من الصور مباشرة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>توصيات CALL أو PUT دقيقة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>تحديد أفضل وقت للدخول</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>تحليل فني شامل</span>
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  تواصل معنا لترقية باقتك والحصول على هذه الميزة المتقدمة
                </p>
                <Button onClick={openWhatsApp} className="w-full gap-2" size="lg">
                  <MessageCircle className="h-5 w-5" />
                  تواصل معنا لترقية الباقة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="ml-2 h-4 w-4" />
          رجوع
        </Button>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="image" className="gap-2">
              <Upload className="h-4 w-4" />
              تحليل صورة
            </TabsTrigger>
            <TabsTrigger value="forex" className="gap-2">
              <Activity className="h-4 w-4" />
              الفوريكس
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              الأسهم
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">تحليل الشارت بالصورة</CardTitle>
                <CardDescription>
                  اختر نوع التحليل المطلوب ثم قم برفع صورة الشارت
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analysis Type Selection */}
                <div className="space-y-2">
                  <Label>نوع التحليل</Label>
                  <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as "recommendation" | "support-resistance")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="recommendation" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>توصية مباشرة</span>
                      </TabsTrigger>
                      <TabsTrigger value="support-resistance" className="gap-2">
                        <Target className="h-4 w-4" />
                        <span>الدعوم والارتدادات</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
              
              {analysisType === "recommendation" ? (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-2">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">التوصية المباشرة:</span> ستحصل على توصية CALL أو PUT محددة مع وقت الدخول المثالي
                  </p>
                </div>
              ) : (
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 mt-2">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">الدعوم والارتدادات:</span> ستحصل على أرقام دقيقة لمستويات الدعم والمقاومة لتدخل بنفسك عند ارتداد السعر
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe">فترة الشمعة</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة الشمعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 دقيقة</SelectItem>
                  <SelectItem value="5m">5 دقائق</SelectItem>
                  <SelectItem value="15m">15 دقيقة</SelectItem>
                  <SelectItem value="30m">30 دقيقة</SelectItem>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="4h">4 ساعات</SelectItem>
                  <SelectItem value="1d">يوم واحد</SelectItem>
                </SelectContent>
              </Select>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-lg">💡</div>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">توصية:</span> يُنصح باختيار فترة الشمعة 5 دقائق ومدة الصفقة 5 دقائق للحصول على أفضل النتائج
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة الشارت</Label>
              <div className="flex items-center gap-4">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-2">
                <p className="text-xs text-foreground">
                  💡 <span className="font-semibold">نصيحة:</span> يمكنك لصق الصورة مباشرة من الحافظة باستخدام Ctrl+V أو Cmd+V
                </p>
              </div>
            </div>

            {imagePreview && <div className="space-y-2">
                <Label>معاينة الصورة</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img src={imagePreview} alt="Chart preview" className="max-w-full h-auto rounded" />
                </div>
              </div>}

            <Button onClick={handleAnalyze} disabled={!image || !timeframe || analyzing} className="w-full" size="lg">
              {analyzing ? <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </> : "تحليل الشارت"}
            </Button>

            {analysis && (
              <div className="space-y-2">
                <Label>نتيجة التحليل</Label>
                <AnalysisResult analysis={analysis} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mt5">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تحليل من MT5 و TradingView</CardTitle>
            <CardDescription>
              ارفع صورة الشارت من منصة MT5 أو TradingView مباشرة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timeframe">فترة الشمعة</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة الشمعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 دقيقة</SelectItem>
                  <SelectItem value="5m">5 دقائق</SelectItem>
                  <SelectItem value="15m">15 دقيقة</SelectItem>
                  <SelectItem value="30m">30 دقيقة</SelectItem>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="3h">3 ساعات</SelectItem>
                  <SelectItem value="4h">4 ساعات</SelectItem>
                  <SelectItem value="1d">يوم واحد</SelectItem>
                  <SelectItem value="1w">أسبوع واحد</SelectItem>
                  <SelectItem value="1M">شهر واحد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">اسحب وأفلت الصورة هنا</p>
              <p className="text-xs text-muted-foreground mb-4">أو</p>
              <Input 
                id="mt5-image" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="cursor-pointer max-w-sm mx-auto" 
              />
              <p className="text-xs text-muted-foreground mt-4">
                💡 يمكنك لصق الصورة مباشرة من الحافظة باستخدام Ctrl+V
              </p>
            </div>

            {imagePreview && (
              <div className="space-y-2">
                <Label>معاينة الصورة</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img src={imagePreview} alt="Chart preview" className="max-w-full h-auto rounded" />
                </div>
              </div>
            )}

            <Button 
              onClick={handleAnalyze} 
              disabled={!image || !timeframe || analyzing} 
              className="w-full" 
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-2">
                <Label>نتيجة التحليل</Label>
                <AnalysisResult analysis={analysis} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="forex">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تحليل الفوريكس</CardTitle>
            <CardDescription>
              اختر زوج العملات والإطار الزمني للحصول على تحليل شامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>اختر زوج العملات</Label>
              <Select value={selectedForexPair} onValueChange={setSelectedForexPair}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر زوج العملات" />
                </SelectTrigger>
                <SelectContent>
                  {FOREX_PAIRS.map((pair) => (
                    <SelectItem key={pair.value} value={pair.value}>
                      {pair.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={forexTimeframe} onValueChange={setForexTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeForex}
              disabled={!selectedForexPair || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-2">
                <Label>نتيجة التحليل</Label>
                <AnalysisResult analysis={analysis} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stocks">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تحليل الأسهم الأمريكية</CardTitle>
            <CardDescription>
              اختر السهم والإطار الزمني ونوع التحليل للحصول على تحليل شامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>اختر سهم</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سهم" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {US_STOCKS.map((stock) => (
                    <SelectItem key={stock.value} value={stock.value}>
                      {stock.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع التحليل</Label>
              <Select value={stockAnalysisType} onValueChange={setStockAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANALYSIS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={stockTimeframe} onValueChange={setStockTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeStock}
              disabled={!selectedStock || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-2">
                <Label>نتيجة التحليل</Label>
                <AnalysisResult analysis={analysis} />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      {analyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <p className="text-2xl font-bold text-foreground">جاري التحليل...</p>
          </div>
        </div>
      )}
      </div>
    </div>;
};
export default ImageAnalysis;