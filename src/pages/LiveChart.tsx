import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  const [isLoading, setIsLoading] = useState(true);

  // Get TradingView symbol and display name
  const getSymbolInfo = () => {
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
      bitcoin: { tvSymbol: "BINANCE:BTCUSDT", displayName: "بيتكوين (BTC/USD)" },
      ethereum: { tvSymbol: "BINANCE:ETHUSDT", displayName: "إيثريوم (ETH/USD)" },
      bnb: { tvSymbol: "BINANCE:BNBUSDT", displayName: "بي إن بي (BNB/USD)" },
      solana: { tvSymbol: "BINANCE:SOLUSDT", displayName: "سولانا (SOL/USD)" },
      xrp: { tvSymbol: "BINANCE:XRPUSDT", displayName: "ريبل (XRP/USD)" },
      cardano: { tvSymbol: "BINANCE:ADAUSDT", displayName: "كاردانو (ADA/USD)" },
      dogecoin: { tvSymbol: "BINANCE:DOGEUSDT", displayName: "دوجكوين (DOGE/USD)" },
      litecoin: { tvSymbol: "BINANCE:LTCUSDT", displayName: "لايتكوين (LTC/USD)" },
      avalanche: { tvSymbol: "BINANCE:AVAXUSDT", displayName: "أفالانش (AVAX/USD)" },
      polkadot: { tvSymbol: "BINANCE:DOTUSDT", displayName: "بولكادوت (DOT/USD)" },
      chainlink: { tvSymbol: "BINANCE:LINKUSDT", displayName: "تشين لينك (LINK/USD)" },
      polygon: { tvSymbol: "BINANCE:MATICUSDT", displayName: "بوليجون (MATIC/USD)" },
      shiba: { tvSymbol: "BINANCE:SHIBUSDT", displayName: "شيبا إينو (SHIB/USD)" },
      tron: { tvSymbol: "BINANCE:TRXUSDT", displayName: "ترون (TRX/USD)" },
      uniswap: { tvSymbol: "BINANCE:UNIUSDT", displayName: "يونيسواب (UNI/USD)" },
      
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

    return symbolMap[symbol] || { tvSymbol: "BINANCE:BTCUSDT", displayName: "بيتكوين (BTC/USD)" };
  };

  const symbolInfo = getSymbolInfo();

  const initWidget = () => {
    if (typeof window.TradingView !== 'undefined') {
      const container = document.getElementById('tradingview_widget');
      if (container) {
        container.innerHTML = '';
        
        new window.TradingView.widget({
          autosize: true,
          symbol: symbolInfo.tvSymbol,
          interval: "D",
          timezone: "Asia/Riyadh",
          theme: "dark",
          style: "1",
          locale: "ar_AE",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: "tradingview_widget",
          hide_side_toolbar: false,
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          withdateranges: true,
          hide_top_toolbar: false,
          save_image: true,
          backgroundColor: "#1e293b",
          gridColor: "rgba(255, 255, 255, 0.05)",
        });
        
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // Script already loaded
      initWidget();
      return;
    }

    // Load script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // Wait a bit for TradingView to initialize
      setTimeout(initWidget, 500);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const container = document.getElementById('tradingview_widget');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  const handleRefresh = () => {
    setIsLoading(true);
    const container = document.getElementById('tradingview_widget');
    if (container) {
      container.innerHTML = '';
    }
    setTimeout(initWidget, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
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
              <div>
                <h1 className="text-xl font-bold text-foreground">{symbolInfo.displayName}</h1>
                <p className="text-sm text-muted-foreground">شارت حقيقي مباشر من TradingView</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </header>

      {/* Chart Container */}
      <main className="container mx-auto px-4 py-6">
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              الشارت المباشر - TradingView
            </h2>
            <p className="text-sm text-muted-foreground">
              بيانات حقيقية ومباشرة مع الشموع اليابانية والمؤشرات الفنية
            </p>
          </div>
          
          {/* TradingView Chart Widget */}
          <div className="tradingview-widget-container w-full">
            <div 
              id="tradingview_widget" 
              className="w-full h-[600px] rounded-lg overflow-hidden bg-card"
              style={{ minHeight: '600px' }}
            />
          </div>
          
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
        </Card>
      </main>
    </div>
  );
}
