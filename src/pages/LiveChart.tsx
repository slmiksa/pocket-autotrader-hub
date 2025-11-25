import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LiveChartData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  isPositive: boolean;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  
  const [chartData, setChartData] = useState<LiveChartData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get TradingView symbol
  const getTradingViewSymbol = () => {
    if (symbol === "gold") {
      return "OANDA:XAUUSD";
    } else if (symbol === "bitcoin") {
      return "BINANCE:BTCUSDT";
    }
    return "BINANCE:BTCUSDT";
  };

  // Fetch current price data
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        const coinGeckoId = symbol === "gold" ? "pax-gold" : "bitcoin";
        const displayName = symbol === "gold" ? "الذهب (أونصة)" : "بيتكوين (BTC)";
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        
        if (data[coinGeckoId]) {
          setChartData({
            symbol: symbol,
            name: displayName,
            currentPrice: data[coinGeckoId].usd,
            change24h: data[coinGeckoId].usd_24h_change || 0,
            isPositive: (data[coinGeckoId].usd_24h_change || 0) > 0
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching price data:", error);
        toast.error("حدث خطأ في تحميل البيانات");
        setLoading(false);
      }
    };

    fetchPriceData();

    // Update price every 30 seconds
    const interval = setInterval(fetchPriceData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Load TradingView widget
  useEffect(() => {
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: getTradingViewSymbol(),
          interval: "D",
          timezone: "Asia/Riyadh",
          theme: "dark",
          style: "1",
          locale: "ar_AE",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: "tradingview_chart",
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          hide_side_toolbar: false,
          withdateranges: true,
          hide_top_toolbar: false,
          save_image: false,
        });
        toast.success("تم تحميل الشارت بنجاح");
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

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
            {chartData && !loading && (
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">{chartData.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-2xl font-bold text-foreground">
                    ${chartData.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center gap-1 ${chartData.isPositive ? 'text-success' : 'text-danger'}`}>
                    {chartData.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold">
                      {chartData.isPositive ? '+' : ''}{chartData.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
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
                <p className="text-muted-foreground">جاري تحميل البيانات...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  الشارت المباشر - TradingView
                </h2>
                <p className="text-sm text-muted-foreground">
                  بيانات لايف مع الشموع اليابانية والمؤشرات الفنية
                </p>
              </div>
              
              {/* TradingView Chart */}
              <div id="tradingview_chart" className="w-full h-[600px] rounded-lg overflow-hidden" />
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
                  <p className="text-lg font-bold text-foreground">
                    ${chartData?.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">التغير 24 ساعة</p>
                  <p className={`text-lg font-bold ${chartData?.isPositive ? 'text-success' : 'text-danger'}`}>
                    {chartData?.isPositive ? '+' : ''}{chartData?.change24h.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">نوع السوق</p>
                  <p className="text-lg font-bold text-foreground">
                    {symbol === "gold" ? "معدن ثمين" : "عملة رقمية"}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">التحديث</p>
                  <p className="text-lg font-bold text-foreground">مباشر</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}