import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Maximize2,
  Minimize2
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
  const [chartKey, setChartKey] = useState(0);

  // Load TradingView widget
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous widget
    chartContainerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    const tfConfig = TIMEFRAMES.find(t => t.value === selectedTimeframe);

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "OANDA:XAUUSD",
      "interval": tfConfig?.tvInterval || "1",
      "timezone": "Asia/Riyadh",
      "theme": "dark",
      "style": "1",
      "locale": "ar_AE",
      "backgroundColor": "rgba(10, 10, 15, 1)",
      "gridColor": "rgba(31, 41, 55, 0.5)",
      "withdateranges": true,
      "hide_side_toolbar": false,
      "allow_symbol_change": false,
      "details": true,
      "hotlist": false,
      "calendar": false,
      "studies": [
        "STD;Pivot%1Points%1Standard",
        "STD;Support%1and%1Resistance"
      ],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
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
  }, [selectedTimeframe, chartKey]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      "min-h-screen bg-[#0a0a0f] pt-16 pb-8",
      isFullscreen && "fixed inset-0 z-50 pt-0"
    )}>
      <div className={cn(
        "container mx-auto px-4",
        isFullscreen ? "max-w-full h-full flex flex-col" : "max-w-7xl"
      )}>
        {/* Header */}
        {!isFullscreen && (
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-1">
              Golden Pulse
            </h1>
            <p className="text-gray-400 text-sm">نبض الذهب الخاطف - XAUUSD - شارت TradingView الحي</p>
          </div>
        )}

        {/* Controls Bar */}
        <Card className={cn(
          "mb-3 border-amber-500/30 bg-[#0f0f15]",
          isFullscreen && "rounded-none mb-0"
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
                        : "border-gray-700 text-gray-400 hover:text-white hover:border-amber-500/50 bg-transparent"
                    )}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Live Badge */}
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  LIVE
                </Badge>

                {/* Fullscreen Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="border-gray-700 text-gray-400 hover:text-white hover:border-amber-500/50 bg-transparent"
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
          "border-gray-800 bg-[#0a0a0f] overflow-hidden",
          isFullscreen ? "flex-1 rounded-none" : "mb-4"
        )}>
          <CardContent className="p-0 h-full">
            <div 
              ref={chartContainerRef} 
              className="w-full"
              style={{ height: isFullscreen ? '100%' : '550px' }}
            />
          </CardContent>
        </Card>

        {/* Info Cards */}
        {!isFullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Support Zones */}
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="text-sm font-semibold text-white">مناطق الدعم - CALL</h3>
                </div>
                <p className="text-xs text-gray-400">
                  عند وصول السعر لمنطقة الدعم (الخط الأخضر) وظهور شمعة انعكاسية = فرصة CALL
                </p>
                <Badge className="mt-2 bg-green-500 text-black font-bold">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  BUY / CALL
                </Badge>
              </CardContent>
            </Card>

            {/* Resistance Zones */}
            <Card className="border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-white">مناطق المقاومة - PUT</h3>
                </div>
                <p className="text-xs text-gray-400">
                  عند وصول السعر لمنطقة المقاومة (الخط الأحمر) وظهور شمعة انعكاسية = فرصة PUT
                </p>
                <Badge className="mt-2 bg-red-500 text-white font-bold">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  SELL / PUT
                </Badge>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-white">طريقة الاستخدام</h3>
                </div>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• راقب مناطق Pivot Points على الشارت</li>
                  <li>• انتظر وصول السعر للمنطقة</li>
                  <li>• تأكد من ظهور شمعة انعكاسية</li>
                  <li>• ادخل الصفقة بعد الإغلاق</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        {!isFullscreen && (
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Golden Pulse v3.0 • شارت TradingView الحي • تحديث فوري</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldenPulse;
