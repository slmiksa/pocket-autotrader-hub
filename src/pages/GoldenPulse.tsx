import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2, RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import GoldenPulseChart from "@/components/golden-pulse/GoldenPulseChart";
import LevelsPanel from "@/components/golden-pulse/LevelsPanel";
import { useGoldenPulseData } from "@/hooks/useGoldenPulseData";
const TIMEFRAMES = [{
  value: '1',
  label: '1m'
}, {
  value: '5',
  label: '5m'
}, {
  value: '15',
  label: '15m'
}, {
  value: '30',
  label: '30m'
}, {
  value: '60',
  label: '1H'
}, {
  value: '240',
  label: '4H'
}, {
  value: 'D',
  label: '1D'
}];
const GoldenPulse = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('5');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    data,
    loading,
    error,
    refetch
  } = useGoldenPulseData({
    timeframe: selectedTimeframe,
    refreshInterval: 30000 // Refresh every 30 seconds for stable data
  });
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  return <div className={cn(
    "min-h-screen bg-background",
    isFullscreen ? "fixed inset-0 z-50 flex flex-col" : "pt-16 pb-8"
  )}>
      <div className={cn(
        isFullscreen ? "flex-1 flex flex-col w-full h-full" : "container mx-auto px-4 max-w-7xl"
      )}>
        {/* Header */}
        {!isFullscreen && <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-1">
              Golden Pulse
            </h1>
            <p className="text-muted-foreground text-sm">
              نبض الذهب الخاطف - XAUUSD - شارت حي مع مستويات التداول التلقائية
            </p>
          </div>}

        {/* Controls Bar */}
        <Card className={cn("mb-3 border-amber-500/30 bg-card", isFullscreen && "rounded-none mb-0 border-x-0 border-t-0")}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Timeframe Selector */}
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAMES.map(tf => <Button key={tf.value} variant={selectedTimeframe === tf.value ? "default" : "outline"} size="sm" onClick={() => setSelectedTimeframe(tf.value)} className={cn("min-w-[45px] text-xs font-medium", selectedTimeframe === tf.value ? "bg-amber-500 hover:bg-amber-600 text-black" : "border-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 bg-transparent")}>
                    {tf.label}
                  </Button>)}
              </div>

              <div className="flex items-center gap-2">
                {/* Data Source Badge */}
                {data && <Badge className={cn("text-xs", data.isLive ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50")}>
                    {data.isLive ? <>
                        <Wifi className="w-3 h-3 mr-1" />
                        LIVE
                      </> : <>
                        <WifiOff className="w-3 h-3 mr-1" />
                        SIMULATED
                      </>}
                  </Badge>}

                {/* Price Change Badge */}
                {data && <Badge className={cn("text-xs font-mono", data.priceChange >= 0 ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50")}>
                    {data.priceChange >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}%
                  </Badge>}

                {/* Refresh Button */}
                <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="border-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 bg-transparent">
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>

                {/* Fullscreen Toggle */}
                <Button variant="outline" size="sm" onClick={toggleFullscreen} className="border-border text-muted-foreground hover:text-foreground hover:border-amber-500/50 bg-transparent">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className={cn("grid gap-4", isFullscreen ? "grid-cols-1 flex-1 h-full" : "grid-cols-1 lg:grid-cols-4")}>
          {/* Chart Container */}
          <Card className={cn("border-border bg-card overflow-hidden", isFullscreen ? "flex-1 rounded-none border-0 h-full" : "lg:col-span-3")}>
            <CardContent className="p-0 h-full">
              {error ? <div className="flex flex-col items-center justify-center h-[550px] text-center px-4">
                   <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                   <p className="text-red-400 text-lg mb-2">خطأ في جلب البيانات</p>
                   <p className="text-muted-foreground text-sm mb-4">{error}</p>
                   <Button variant="outline" onClick={refetch} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
                     <RefreshCw className="h-4 w-4 mr-2" />
                     إعادة المحاولة
                   </Button>
                </div> : loading && !data ? <div className="flex items-center justify-center h-[550px]">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                </div> : data ? <GoldenPulseChart candles={data.candles} levels={data.levels} currentPrice={data.currentPrice} isFullscreen={isFullscreen} /> : null}
            </CardContent>
          </Card>

          {/* Levels Panel */}
          {!isFullscreen && data && <div className="lg:col-span-1">
              <LevelsPanel levels={data.levels} currentPrice={data.currentPrice} />
            </div>}
        </div>

        {/* Footer */}
        {!isFullscreen && <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Golden Pulse v4.0 • شارت حي مع مستويات دخول CALL/PUT + أهداف تلقائية</p>
            {data && <p className="mt-1">آخر تحديث: {new Date(data.timestamp).toLocaleTimeString('ar-EG')} • المصدر: {data.dataSource}</p>}
          </div>}
      </div>
    </div>;
};
export default GoldenPulse;