import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  // Get TradingView symbol and display name
  const getSymbolInfo = () => {
    if (symbol === "gold") {
      return {
        tvSymbol: "OANDA:XAUUSD",
        displayName: "الذهب (XAU/USD)"
      };
    } else if (symbol === "bitcoin") {
      return {
        tvSymbol: "BINANCE:BTCUSDT",
        displayName: "بيتكوين (BTC/USDT)"
      };
    }
    return {
      tvSymbol: "BINANCE:BTCUSDT",
      displayName: "بيتكوين (BTC/USDT)"
    };
  };

  const symbolInfo = getSymbolInfo();

  // Load TradingView widget with retry logic
  const loadTradingViewWidget = (retryCount = 0) => {
    const maxRetries = 3;
    
    const initWidget = () => {
      if (window.TradingView && chartContainerRef.current) {
        try {
          // Clear previous widget
          if (chartContainerRef.current) {
            chartContainerRef.current.innerHTML = '';
          }

          widgetRef.current = new window.TradingView.widget({
            autosize: true,
            symbol: symbolInfo.tvSymbol,
            interval: "D",
            timezone: "Asia/Riyadh",
            theme: "dark",
            style: "1",
            locale: "ar_AE",
            toolbar_bg: "#0f172a",
            enable_publishing: false,
            allow_symbol_change: false,
            container_id: "tradingview_chart",
            studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
            hide_side_toolbar: false,
            withdateranges: true,
            hide_top_toolbar: false,
            save_image: false,
            loading_screen: { backgroundColor: "#0f172a", foregroundColor: "#3b82f6" }
          });
          
          setLoading(false);
          setChartError(false);
          toast.success("تم تحميل الشارت الحقيقي من TradingView");
        } catch (error) {
          console.error("Error initializing TradingView widget:", error);
          if (retryCount < maxRetries) {
            setTimeout(() => loadTradingViewWidget(retryCount + 1), 2000);
          } else {
            setChartError(true);
            setLoading(false);
            toast.error("فشل تحميل الشارت. حاول التحديث.");
          }
        }
      } else {
        if (retryCount < maxRetries) {
          setTimeout(() => loadTradingViewWidget(retryCount + 1), 1000);
        } else {
          setChartError(true);
          setLoading(false);
          toast.error("فشل تحميل مكتبة TradingView");
        }
      }
    };

    initWidget();
  };

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    
    if (existingScript) {
      loadTradingViewWidget();
      return;
    }

    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      loadTradingViewWidget();
    };
    script.onerror = () => {
      setChartError(true);
      setLoading(false);
      toast.error("فشل تحميل سكريبت TradingView");
    };
    document.head.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current = null;
      }
    };
  }, [symbol]);

  const handleRetry = () => {
    setLoading(true);
    setChartError(false);
    loadTradingViewWidget();
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{symbolInfo.displayName}</h1>
              <p className="text-sm text-muted-foreground">شارت حقيقي مباشر من TradingView</p>
            </div>
            {chartError && (
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Chart Container */}
      <main className="container mx-auto px-4 py-6">
        <Card className="p-6">
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحميل الشارت الحقيقي من TradingView...</p>
              </div>
            </div>
          ) : chartError ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-destructive mb-4">فشل تحميل الشارت</p>
                <Button onClick={handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  الشارت المباشر - TradingView
                </h2>
                <p className="text-sm text-muted-foreground">
                  بيانات حقيقية مباشرة مع الشموع اليابانية والمؤشرات الفنية
                </p>
              </div>
              
              {/* TradingView Chart */}
              <div 
                ref={chartContainerRef}
                id="tradingview_chart" 
                className="w-full h-[600px] rounded-lg overflow-hidden" 
              />
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">المصدر</p>
                  <p className="text-lg font-bold text-foreground">
                    TradingView
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">نوع البيانات</p>
                  <p className="text-lg font-bold text-success">
                    حقيقية ومباشرة
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">التحديث</p>
                  <p className="text-lg font-bold text-foreground">لحظي</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
