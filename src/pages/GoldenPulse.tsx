import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Maximize2,
  Minimize2,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

// TradingView timeframes mapping
const TIMEFRAMES = [
  { value: '1', label: '1m', tvInterval: '1' },
  { value: '5', label: '5m', tvInterval: '5' },
  { value: '15', label: '15m', tvInterval: '15' },
  { value: '30', label: '30m', tvInterval: '30' },
  { value: '60', label: '1H', tvInterval: '60' },
  { value: '240', label: '4H', tvInterval: '240' },
  { value: 'D', label: '1D', tvInterval: 'D' },
];

const GoldenPulse = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load TradingView widget with Support/Resistance indicators
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous widget
    chartContainerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const tfConfig = TIMEFRAMES.find(t => t.value === selectedTimeframe);

    // Widget configuration with clear Pivot Points S/R
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": tfConfig?.tvInterval || "1",
      "timezone": "Asia/Riyadh",
      "theme": "dark",
      "style": "1",
      "locale": "ar_AE",
      "backgroundColor": "rgba(10, 10, 15, 1)",
      "gridColor": "rgba(31, 41, 55, 0.3)",
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": false,
      "save_image": true,
      "details": true,
      "hotlist": false,
      "calendar": false,
      "studies": [
        // Pivot Points Standard - خطوط S1,S2,S3 و R1,R2,R3 واضحة
        "PivotPointsStandard@tv-basicstudies"
      ],
      "show_popup_button": true,
      "popup_width": "1200",
      "popup_height": "700",
      "support_host": "https://www.tradingview.com"
    });

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = '100%';
    container.style.width = '100%';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = 'calc(100% - 32px)';
    widgetContainer.style.width = '100%';

    container.appendChild(widgetContainer);
    container.appendChild(script);
    chartContainerRef.current.appendChild(container);

    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, [selectedTimeframe]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      "min-h-screen bg-background pt-16 pb-8",
      isFullscreen && "fixed inset-0 z-50 pt-0 bg-background"
    )}>
      <div className={cn(
        "container mx-auto px-4",
        isFullscreen ? "max-w-full h-full flex flex-col p-0" : "max-w-7xl"
      )}>
        {/* Header */}
        {!isFullscreen && (
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-1">
              Golden Pulse
            </h1>
            <p className="text-muted-foreground text-sm">نبض الذهب الخاطف - XAUUSD - شارت TradingView الحي مع مناطق الدعم والمقاومة</p>
          </div>
        )}

        {/* Controls Bar */}
        <Card className={cn(
          "mb-3 border-amber-500/30 bg-card",
          isFullscreen && "rounded-none mb-0 border-x-0 border-t-0"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Timeframe Selector */}
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map(tf => (
                  <Button
                    key={tf.value}
                    variant={selectedTimeframe === tf.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={cn(
                      "min-w-[45px] text-xs font-medium",
                      selectedTimeframe === tf.value 
                        ? "bg-amber-500 hover:bg-amber-600 text-black" 
                        : "border-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 bg-transparent"
                    )}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Live Badge */}
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  LIVE
                </Badge>

                {/* Fullscreen Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="border-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 bg-transparent"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TradingView Chart Container */}
        <Card className={cn(
          "border-border bg-card overflow-hidden",
          isFullscreen ? "flex-1 rounded-none border-0" : "mb-4"
        )}>
          <CardContent className="p-0 h-full">
            <div 
              ref={chartContainerRef} 
              className="w-full"
              style={{ height: isFullscreen ? '100%' : '550px' }}
            />
          </CardContent>
        </Card>

        {/* Trading Guide Cards */}
        {!isFullscreen && (
          <>
            {/* Indicator Legend */}
            <Card className="mb-4 border-border bg-card">
              <CardContent className="py-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  خطوط Pivot Points على الشارت
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Pivot Point */}
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-center">
                    <div className="w-full h-1 bg-amber-500 rounded mb-2" />
                    <p className="text-sm font-bold text-amber-400">P (Pivot)</p>
                    <p className="text-xs text-muted-foreground">نقطة المحور</p>
                  </div>
                  
                  {/* Support Levels */}
                  <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 text-center">
                    <div className="w-full h-1 bg-green-500 rounded mb-2" />
                    <p className="text-sm font-bold text-green-400">S1, S2, S3</p>
                    <p className="text-xs text-muted-foreground">مستويات الدعم</p>
                  </div>
                  
                  {/* Resistance Levels */}
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-center">
                    <div className="w-full h-1 bg-red-500 rounded mb-2" />
                    <p className="text-sm font-bold text-red-400">R1, R2, R3</p>
                    <p className="text-xs text-muted-foreground">مستويات المقاومة</p>
                  </div>
                  
                  {/* How to use */}
                  <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-center">
                    <div className="w-full h-1 bg-blue-500 rounded mb-2" />
                    <p className="text-sm font-bold text-blue-400">الاستخدام</p>
                    <p className="text-xs text-muted-foreground">ارتداد من S = CALL</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Signals Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* CALL Signal */}
              <Card className="border-green-500/40 bg-gradient-to-br from-green-500/10 to-green-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-green-500" />
                      <h3 className="text-lg font-bold text-green-400">إشارة CALL (شراء)</h3>
                    </div>
                    <Badge className="bg-green-500 text-black font-bold text-sm px-3">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      BUY
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      السعر يلامس الخط السفلي (دعم)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      ظهور شمعة انعكاسية صاعدة
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      السعر أعلى من VWAP = تأكيد إضافي
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* PUT Signal */}
              <Card className="border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-500/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-6 w-6 text-red-500" />
                      <h3 className="text-lg font-bold text-red-400">إشارة PUT (بيع)</h3>
                    </div>
                    <Badge className="bg-red-500 text-white font-bold text-sm px-3">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      SELL
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      السعر يلامس الخط العلوي (مقاومة)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      ظهور شمعة انعكاسية هابطة
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      السعر أسفل من VWAP = تأكيد إضافي
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-foreground">خطوات التداول</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                    <p className="text-xs text-muted-foreground">راقب وصول السعر للخط العلوي أو السفلي</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                    <p className="text-xs text-muted-foreground">انتظر ظهور شمعة انعكاسية واضحة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                    <p className="text-xs text-muted-foreground">تحقق من موقع السعر نسبة لـ VWAP</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                    <p className="text-xs text-muted-foreground">ادخل الصفقة بعد إغلاق الشمعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        {!isFullscreen && (
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Golden Pulse v3.0 • شارت TradingView الحي • Pivot Points + Donchian Channels + VWAP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldenPulse;
