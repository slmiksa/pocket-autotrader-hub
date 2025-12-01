import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  const containerRef = useRef<HTMLDivElement>(null);

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

    // Create TradingView Advanced Chart Widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbolInfo.tvSymbol,
      interval: "D",
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
  }, [symbol, symbolInfo.tvSymbol]);

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
      </main>
    </div>
  );
}
