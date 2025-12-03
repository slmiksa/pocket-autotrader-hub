import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Upload, Loader2, Info, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [selectedInterval, setSelectedInterval] = useState("يومي");
  const [showInstructions, setShowInstructions] = useState(false);
  const [chartAnalysisEnabled, setChartAnalysisEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { saveAnalysis } = useSavedAnalyses();

  // Check if chart analysis is enabled for the user
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('image_analysis_enabled')
          .eq('user_id', user.id)
          .single();

        setChartAnalysisEnabled(profile?.image_analysis_enabled || false);
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Get TradingView symbol and display name
  const getSymbolInfo = () => {
    // Saudi market stock names map
    const saudiStockNames: Record<string, string> = {
      '2222': 'أرامكو السعودية',
      '1211': 'معادن',
      '2010': 'سابك',
      '1010': 'الرياض',
      '1180': 'الأهلي',
      '1120': 'الراجحي',
      '2380': 'بترورابغ',
      '2310': 'سبكيم',
      '2350': 'كيان',
      '2330': 'المتقدمة',
      '2250': 'المراعي',
      '4030': 'البحري',
      '4200': 'الدريس',
      '4001': 'أسمنت الجنوب',
      '3010': 'أسمنت العربية',
      '3020': 'أسمنت اليمامة',
      '3030': 'أسمنت السعودية',
      '3040': 'أسمنت القصيم',
      '3050': 'أسمنت الجنوبية',
      '3060': 'أسمنت ينبع',
      '3080': 'أسمنت الشرقية',
      '3090': 'أسمنت تبوك',
      '3091': 'أسمنت الجوف',
      '3007': 'زجاج',
      '2020': 'سافكو',
      '2060': 'التصنيع',
      '2070': 'الغاز',
      '2090': 'الدوائية',
      '2150': 'زين السعودية',
      '7010': 'الاتصالات',
      '7020': 'موبايلي',
      '2001': 'كيمانول',
      '2290': 'ينساب',
      '2170': 'اللجين',
      '2180': 'فيبكو',
      '2200': 'أنابيب',
      '2210': 'نماء للكيماويات',
      '2220': 'معدنية',
      '2230': 'الكيميائية',
      '2240': 'الزامل',
      '4003': 'إكسترا',
      '4190': 'جرير',
      '4002': 'المواساة',
      '4004': 'دله الصحية',
      '4005': 'رعاية',
      '4007': 'الحمادي',
    };
    
    // If symbol contains "TADAWUL:" - Saudi market stock
    if (symbol.includes('TADAWUL:')) {
      const ticker = symbol.split(':')[1];
      const displayName = saudiStockNames[ticker] 
        ? `${saudiStockNames[ticker]} (${ticker})`
        : `تداول (${ticker})`;
      
      // TradingView uses TADAWUL:XXXX format for Saudi stocks
      return { tvSymbol: `TADAWUL:${ticker}`, displayName };
    }
    
    // For other symbols with ":" (like FX:EURUSD), use as-is
    if (symbol.includes(':')) {
      return { tvSymbol: symbol, displayName: symbol };
    }

    const symbolMap: Record<string, { tvSymbol: string; displayName: string }> = {
      // Forex
      eurusd: { tvSymbol: "FX:EURUSD", displayName: "يورو/دولار (EUR/USD)" },
      gbpusd: { tvSymbol: "FX:GBPUSD", displayName: "جنيه/دولار (GBP/USD)" },
      usdjpy: { tvSymbol: "FX:USDJPY", displayName: "دولار/ين (USD/JPY)" },
      usdchf: { tvSymbol: "FX:USDCHF", displayName: "دولار/فرنك (USD/CHF)" },
      audusd: { tvSymbol: "FX:AUDUSD", displayName: "أسترالي/دولار (AUD/USD)" },
      usdcad: { tvSymbol: "FX:USDCAD", displayName: "دولار/كندي (USD/CAD)" },
      nzdusd: { tvSymbol: "FX:NZDUSD", displayName: "نيوزيلندي/دولار (NZD/USD)" },
      eurgbp: { tvSymbol: "FX:EURGBP", displayName: "يورو/جنيه (EUR/GBP)" },
      eurjpy: { tvSymbol: "FX:EURJPY", displayName: "يورو/ين (EUR/JPY)" },
      gbpjpy: { tvSymbol: "FX:GBPJPY", displayName: "جنيه/ين (GBP/JPY)" },
      
      // Crypto
      bitcoin: { tvSymbol: "BITSTAMP:BTCUSD", displayName: "بيتكوين (BTC/USD)" },
      ethereum: { tvSymbol: "BITSTAMP:ETHUSD", displayName: "إيثريوم (ETH/USD)" },
      bnb: { tvSymbol: "BINANCE:BNBUSDT", displayName: "بي إن بي (BNB/USD)" },
      solana: { tvSymbol: "COINBASE:SOLUSD", displayName: "سولانا (SOL/USD)" },
      xrp: { tvSymbol: "BITSTAMP:XRPUSD", displayName: "ريبل (XRP/USD)" },
      cardano: { tvSymbol: "COINBASE:ADAUSD", displayName: "كاردانو (ADA/USD)" },
      dogecoin: { tvSymbol: "BINANCE:DOGEUSDT", displayName: "دوجكوين (DOGE/USD)" },
      litecoin: { tvSymbol: "COINBASE:LTCUSD", displayName: "لايتكوين (LTC/USD)" },
      avalanche: { tvSymbol: "COINBASE:AVAXUSD", displayName: "أفالانش (AVAX/USD)" },
      polkadot: { tvSymbol: "COINBASE:DOTUSD", displayName: "بولكادوت (DOT/USD)" },
      chainlink: { tvSymbol: "COINBASE:LINKUSD", displayName: "تشين لينك (LINK/USD)" },
      polygon: { tvSymbol: "COINBASE:MATICUSD", displayName: "بوليجون (MATIC/USD)" },
      shiba: { tvSymbol: "BINANCE:SHIBUSDT", displayName: "شيبا إينو (SHIB/USD)" },
      tron: { tvSymbol: "BINANCE:TRXUSDT", displayName: "ترون (TRX/USD)" },
      uniswap: { tvSymbol: "COINBASE:UNIUSD", displayName: "يونيسواب (UNI/USD)" },
      
      // Commodities
      gold: { tvSymbol: "OANDA:XAUUSD", displayName: "الذهب (XAU/USD)" },
      silver: { tvSymbol: "OANDA:XAGUSD", displayName: "الفضة (XAG/USD)" },
      oil: { tvSymbol: "TVC:USOIL", displayName: "النفط الخام (WTI)" },
      naturalgas: { tvSymbol: "TVC:NATURALGAS", displayName: "الغاز الطبيعي" },
      platinum: { tvSymbol: "TVC:PLATINUM", displayName: "البلاتين" },
      copper: { tvSymbol: "TVC:COPPER", displayName: "النحاس" },
      
      // Indices
      sp500: { tvSymbol: "FOREXCOM:SPXUSD", displayName: "إس آند بي 500 (S&P 500)" },
      dowjones: { tvSymbol: "TVC:DJI", displayName: "داو جونز (Dow Jones)" },
      nasdaq: { tvSymbol: "NASDAQ:NDX", displayName: "ناسداك (NASDAQ)" },
      dax: { tvSymbol: "XETR:DAX", displayName: "داكس الألماني (DAX)" },
      ftse100: { tvSymbol: "TVC:UKX", displayName: "فوتسي 100 (FTSE 100)" },
      nikkei: { tvSymbol: "TVC:NI225", displayName: "نيكاي 225 (Nikkei)" },
      cac40: { tvSymbol: "TVC:CAC40", displayName: "كاك 40 (CAC 40)" },
      
      // Stocks
      apple: { tvSymbol: "NASDAQ:AAPL", displayName: "أبل (Apple)" },
      tesla: { tvSymbol: "NASDAQ:TSLA", displayName: "تسلا (Tesla)" },
      amazon: { tvSymbol: "NASDAQ:AMZN", displayName: "أمازون (Amazon)" },
      google: { tvSymbol: "NASDAQ:GOOGL", displayName: "جوجل (Google)" },
      microsoft: { tvSymbol: "NASDAQ:MSFT", displayName: "مايكروسوفت (Microsoft)" },
      meta: { tvSymbol: "NASDAQ:META", displayName: "ميتا (Meta)" },
      nvidia: { tvSymbol: "NASDAQ:NVDA", displayName: "إنفيديا (NVIDIA)" },
      netflix: { tvSymbol: "NASDAQ:NFLX", displayName: "نتفليكس (Netflix)" },
      amd: { tvSymbol: "NASDAQ:AMD", displayName: "إيه إم دي (AMD)" },
      intel: { tvSymbol: "NASDAQ:INTC", displayName: "إنتل (Intel)" },
      disney: { tvSymbol: "NYSE:DIS", displayName: "ديزني (Disney)" },
      cocacola: { tvSymbol: "NYSE:KO", displayName: "كوكا كولا (Coca-Cola)" },
    };

    return symbolMap[symbol] || { tvSymbol: "BITSTAMP:BTCUSD", displayName: "بيتكوين (BTC/USD)" };
  };

  const symbolInfo = getSymbolInfo();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Use advanced chart widget for all symbols
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbolInfo.tvSymbol,
      interval: selectedTimeframe,
      timezone: "Asia/Riyadh",
      theme: "dark",
      style: "1",
      locale: "ar_AE",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: false,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
    });

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetInner.style.height = 'calc(100% - 32px)';
    widgetInner.style.width = '100%';

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);

    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, symbolInfo.tvSymbol, selectedTimeframe]);

  const handleRefresh = () => {
    if (containerRef.current) {
      const currentContent = containerRef.current.innerHTML;
      containerRef.current.innerHTML = '';
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML = currentContent;
        }
      }, 100);
    }
    window.location.reload();
  };

  const handleAnalyzeChart = async (imageFile?: File) => {
    if (!chartAnalysisEnabled) {
      toast.error("ميزة تحليل الشارت غير مفعلة لحسابك");
      return;
    }

    if (!imageFile) {
      setShowInstructions(true);
      return;
    }

    setIsAnalyzing(true);
    toast.info("جاري تحليل الشارت والرسم عليه...");

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Send to AI for analysis and drawing
        const { data, error } = await supabase.functions.invoke('analyze-chart-with-drawing', {
          body: {
            image: base64Image,
            symbol: symbolInfo.displayName,
            timeframe: selectedInterval
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          toast.error("حدث خطأ أثناء الاتصال بالخادم");
          setIsAnalyzing(false);
          return;
        }

        if (data?.success) {
          setAnalysisResult(data);
          setShowAnalysis(true);
          toast.success("تم التحليل والرسم بنجاح!");
        } else {
          toast.error(data?.error || 'فشل التحليل');
        }
        
        setIsAnalyzing(false);
      };

      reader.onerror = () => {
        toast.error("فشل قراءة الصورة");
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(imageFile);

    } catch (error: any) {
      console.error('Error analyzing chart:', error);
      toast.error(error.message || "حدث خطأ أثناء التحليل");
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || !analysisResult.analysis) {
      toast.error('لا يوجد تحليل لحفظه');
      return;
    }

    const analysisText = JSON.stringify(analysisResult.analysis);
    const imageUrl = analysisResult.annotatedImage || '';
    
    await saveAnalysis(symbolInfo.displayName, analysisText, imageUrl);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleAnalyzeChart(file);
      } else {
        toast.error("يرجى اختيار صورة فقط");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                رجوع
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{symbolInfo.displayName}</h1>
                <p className="text-sm text-white/50">شارت حقيقي مباشر من TradingView</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedTimeframe} onValueChange={(val) => {
                setSelectedTimeframe(val);
                const intervalMap: Record<string, string> = {
                  "1": "دقيقة",
                  "5": "5 دقائق",
                  "15": "15 دقيقة",
                  "30": "30 دقيقة",
                  "60": "ساعة",
                  "240": "4 ساعات",
                  "D": "يومي",
                  "W": "أسبوعي",
                };
                setSelectedInterval(intervalMap[val] || "يومي");
              }}>
                <SelectTrigger className="w-[120px] bg-background/50 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 دقيقة</SelectItem>
                  <SelectItem value="5">5 دقائق</SelectItem>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة</SelectItem>
                  <SelectItem value="240">4 ساعات</SelectItem>
                  <SelectItem value="D">يومي</SelectItem>
                  <SelectItem value="W">أسبوعي</SelectItem>
                </SelectContent>
              </Select>

              {chartAnalysisEnabled && (
                <>
                  <Button
                    onClick={() => setShowInstructions(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Info className="h-4 w-4" />
                    كيفية التحليل
                  </Button>
                  
                  <label htmlFor="chart-upload">
                    <Button
                      type="button"
                      disabled={isAnalyzing || !chartAnalysisEnabled}
                      className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      size="sm"
                      onClick={() => document.getElementById('chart-upload')?.click()}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          جاري التحليل...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          رفع صورة الشارت
                        </>
                      )}
                    </Button>
                  </label>
                  <Input
                    id="chart-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isAnalyzing || !chartAnalysisEnabled}
                  />
                </>
              )}
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chart Container */}
      <main className="container mx-auto px-4 py-6">
        <Card className="p-4 bg-[#12121a] border-white/10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              الشارت المباشر - TradingView
            </h2>
            <p className="text-sm text-white/50">
              بيانات حقيقية ومباشرة مع الشموع اليابانية والمؤشرات الفنية
            </p>
          </div>
          
          {/* TradingView Chart Widget */}
          <div 
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '600px' }}
          />
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/5">
              <p className="text-sm text-white/50 mb-1">المصدر</p>
              <p className="text-lg font-bold text-white">TradingView</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5">
              <p className="text-sm text-white/50 mb-1">نوع البيانات</p>
              <p className="text-lg font-bold text-emerald-400">حقيقية ومباشرة</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5">
              <p className="text-sm text-white/50 mb-1">التحديث</p>
              <p className="text-lg font-bold text-white">لحظي</p>
            </div>
          </div>
        </Card>

        {/* Analysis Results */}
        {showAnalysis && analysisResult && (
          <Card className="mt-6 p-6 bg-[#12121a] border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                نتيجة التحليل
              </h2>
              <Button
                onClick={() => setShowAnalysis(false)}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                إغلاق
              </Button>
            </div>

            {/* Annotated Chart Image */}
            {analysisResult.annotatedImage && (
              <div className="mb-6 rounded-lg overflow-hidden border border-white/10">
                <img 
                  src={analysisResult.annotatedImage} 
                  alt="الشارت المحلل"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Analysis Details */}
            {analysisResult.analysis && (
              <div className="space-y-4">
                {/* Current Price & Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-white/50 mb-1">السعر الحالي</p>
                    <p className="text-2xl font-bold text-white">
                      {analysisResult.analysis.currentPrice}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-white/50 mb-1">الاتجاه</p>
                    <p className="text-2xl font-bold text-primary">
                      {analysisResult.analysis.trend}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                {analysisResult.analysis.recommendation && (
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <h3 className="text-lg font-bold text-white mb-4">التوصية</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-white/50 mb-1">العملية</p>
                        <p className="text-lg font-bold text-primary">
                          {analysisResult.analysis.recommendation.action}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">الدخول</p>
                        <p className="text-lg font-bold text-white">
                          {analysisResult.analysis.recommendation.entry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">وقف الخسارة</p>
                        <p className="text-lg font-bold text-destructive">
                          {analysisResult.analysis.recommendation.stopLoss}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">الهدف</p>
                        <p className="text-lg font-bold text-success">
                          {analysisResult.analysis.recommendation.target1}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">السبب: </span>
                        {analysisResult.analysis.recommendation.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Support & Resistance Levels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Support Levels */}
                  {analysisResult.analysis.supportLevels && analysisResult.analysis.supportLevels.length > 0 && (
                    <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="text-sm font-semibold text-success mb-3">مستويات الدعم</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.supportLevels.map((level: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{level.price}</span>
                            <span className="text-success text-xs">{level.strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resistance Levels */}
                  {analysisResult.analysis.resistanceLevels && analysisResult.analysis.resistanceLevels.length > 0 && (
                    <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="text-sm font-semibold text-destructive mb-3">مستويات المقاومة</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.resistanceLevels.map((level: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{level.price}</span>
                            <span className="text-destructive text-xs">{level.strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Analysis */}
                {analysisResult.analysis.analysis && (
                  <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="text-sm font-semibold text-white mb-2">تحليل مفصل</h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {analysisResult.analysis.analysis}
                    </p>
                  </div>
                )}

                {/* Save Analysis Button */}
                <div className="flex justify-center mt-6 pt-6 border-t border-white/10">
                  <Button
                    onClick={handleSaveAnalysis}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    <Save className="h-5 w-5" />
                    هل تريد حفظ التحليل في قائمة تحليلاتي؟
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">كيفية تحليل الشارت</DialogTitle>
              <DialogDescription className="text-white/70">
                اتبع الخطوات التالية للحصول على تحليل دقيق
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">1</span>
                  اختر الإطار الزمني
                </h3>
                <p className="text-white/70 text-sm">
                  حدد الإطار الزمني المناسب للشارت (دقيقة، 5 دقائق، ساعة، يومي، إلخ)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">2</span>
                  التقط صورة الشارت
                </h3>
                <p className="text-white/70 text-sm mb-2">
                  استخدم أحد الطرق التالية:
                </p>
                <ul className="list-disc list-inside text-white/60 text-sm space-y-1 mr-4">
                  <li><strong className="text-white/80">Windows:</strong> اضغط Print Screen أو Windows + Shift + S</li>
                  <li><strong className="text-white/80">Mac:</strong> اضغط Command + Shift + 4</li>
                  <li><strong className="text-white/80">الهاتف:</strong> استخدم خاصية Screenshot في جهازك</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">3</span>
                  ارفع الصورة
                </h3>
                <p className="text-white/70 text-sm">
                  اضغط على زر "رفع صورة الشارت" واختر الصورة التي التقطتها
                </p>
              </div>

              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h3 className="font-bold text-success mb-2">💡 نصيحة</h3>
                <p className="text-white/70 text-sm">
                  تأكد أن الصورة واضحة وتحتوي على الشارت بالكامل مع المؤشرات الفنية لأفضل نتائج تحليل
                </p>
              </div>

              <Button
                onClick={() => {
                  setShowInstructions(false);
                  document.getElementById('chart-upload')?.click();
                }}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                <Upload className="h-4 w-4 ml-2" />
                رفع صورة الشارت الآن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
