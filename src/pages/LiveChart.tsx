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
    if (symbol === "gold") {
      return {
        tvSymbol: "OANDA:XAUUSD",
        displayName: "الذهب (XAU/USD)"
      };
    } else if (symbol === "bitcoin") {
      return {
        tvSymbol: "CRYPTO:BTCUSD",
        displayName: "بيتكوين (BTC/USD)"
      };
    }
    return {
      tvSymbol: "CRYPTO:BTCUSD",
      displayName: "بيتكوين (BTC/USD)"
    };
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
