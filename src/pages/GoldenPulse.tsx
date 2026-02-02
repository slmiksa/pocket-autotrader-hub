import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";

interface SupportResistanceZone {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
  signal: 'CALL' | 'PUT' | 'NEUTRAL';
  label: string;
}

interface ChartAnalysis {
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: string;
  timeframe: string;
  candles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }[];
  zones: SupportResistanceZone[];
  dataSource: string;
  isLive: boolean;
}

const TIMEFRAMES = [
  { value: '1', label: '1m', labelAr: '1 دقيقة' },
  { value: '5', label: '5m', labelAr: '5 دقائق' },
  { value: '15', label: '15m', labelAr: '15 دقيقة' },
  { value: '30', label: '30m', labelAr: '30 دقيقة' },
  { value: '60', label: '1H', labelAr: 'ساعة' },
  { value: '240', label: '4H', labelAr: '4 ساعات' },
  { value: 'D', label: '1D', labelAr: 'يوم' },
];

const GoldenPulse = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineRefs = useRef<any[]>([]);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('1');
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const isFetchingRef = useRef(false);

  const fetchAnalysis = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (!analysis) setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-golden-pulse?timeframe=${selectedTimeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysis(result);
      setLastUpdate(new Date());
      updateChart(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ في تحميل البيانات';
      setError(message);
      console.error('Golden Pulse fetch error:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [selectedTimeframe, analysis]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#f59e0b',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#f59e0b',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#374151',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    // v5 API: use addSeries with CandlestickSeries
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart with new data
  const updateChart = useCallback((data: ChartAnalysis) => {
    if (!candleSeriesRef.current || !chartRef.current) return;

    // Convert candles to lightweight-charts format
    const chartData: CandlestickData<Time>[] = data.candles.map(candle => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candleSeriesRef.current.setData(chartData);

    // Remove old price lines
    priceLineRefs.current.forEach(line => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (e) {}
    });
    priceLineRefs.current = [];

    // Add support/resistance zones as price lines
    data.zones.forEach(zone => {
      const isSupport = zone.type === 'support';
      const color = isSupport ? '#22c55e' : '#ef4444';
      
      const priceLine = candleSeriesRef.current?.createPriceLine({
        price: zone.price,
        color: color,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: zone.signal !== 'NEUTRAL' ? (zone.signal === 'CALL' ? '📈 CALL' : '📉 PUT') : '',
      });

      if (priceLine) {
        priceLineRefs.current.push(priceLine);
      }
    });

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, []);

  // Fetch data on mount and interval
  useEffect(() => {
    fetchAnalysis();
    
    const interval = setInterval(fetchAnalysis, 1000);
    
    return () => clearInterval(interval);
  }, [fetchAnalysis]);

  // Refetch when timeframe changes
  useEffect(() => {
    setAnalysis(null);
    fetchAnalysis();
  }, [selectedTimeframe]);

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-warning to-primary bg-clip-text text-transparent mb-1">
            Golden Pulse
          </h1>
          <p className="text-muted-foreground text-sm">نبض الذهب الخاطف - XAUUSD</p>
        </div>

        {/* Price Header */}
        <Card className="mb-4 border-primary/30 bg-gradient-to-r from-card to-card/80">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">GOLD / USD</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-bold font-mono text-foreground">
                      {analysis?.currentPrice.toFixed(2) || '----.--'}
                    </span>
                    {analysis && (
                      <Badge className={cn(
                        "text-xs",
                        analysis.priceChange >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      )}>
                        {analysis.priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {analysis.priceChange >= 0 ? '+' : ''}{analysis.priceChange.toFixed(2)} ({analysis.priceChangePercent.toFixed(3)}%)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Live Status */}
                <Badge variant="outline" className={cn(
                  "text-xs",
                  analysis?.isLive ? "border-success/50 text-success" : "border-warning/50 text-warning"
                )}>
                  {analysis?.isLive ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {analysis?.isLive ? 'LIVE' : 'SIMULATED'}
                </Badge>
                
                {/* Data Source */}
                <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                  {analysis?.dataSource || '---'}
                </Badge>
                
                {/* Last Update */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastUpdate?.toLocaleTimeString('ar-SA') || '--:--:--'}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fetchAnalysis()}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeframe Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {TIMEFRAMES.map(tf => (
            <Button
              key={tf.value}
              variant={selectedTimeframe === tf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(tf.value)}
              className={cn(
                "min-w-[50px] text-sm",
                selectedTimeframe === tf.value 
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                  : "border-muted text-muted-foreground hover:text-foreground hover:border-primary/50"
              )}
            >
              {tf.label}
            </Button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/10">
            <CardContent className="py-3 flex items-center gap-2 text-destructive text-sm">
              <Activity className="h-4 w-4" />
              {error}
            </CardContent>
          </Card>
        )}

        {/* Chart Container */}
        <Card className="mb-4 border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            <div 
              ref={chartContainerRef} 
              className="w-full" 
              style={{ height: '400px' }}
            />
          </CardContent>
        </Card>

        {/* Support/Resistance Zones Legend */}
        {analysis && analysis.zones.length > 0 && (
          <Card className="mb-4 border-border bg-card">
            <CardContent className="py-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                مناطق الدعم والمقاومة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.zones.map((zone, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      zone.type === 'support' 
                        ? "border-success/30 bg-success/5" 
                        : "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        zone.type === 'support' ? "bg-success" : "bg-destructive"
                      )} />
                      <div>
                        <p className="text-sm font-mono font-medium text-foreground">
                          {zone.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {zone.type === 'support' ? 'دعم' : 'مقاومة'} • {zone.touches} لمسة
                        </p>
                      </div>
                    </div>
                    
                    {zone.signal !== 'NEUTRAL' && (
                      <Badge className={cn(
                        "text-sm font-bold",
                        zone.signal === 'CALL' 
                          ? "bg-success text-success-foreground" 
                          : "bg-destructive text-destructive-foreground"
                      )}>
                        {zone.signal === 'CALL' ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            CALL
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            PUT
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Overlay */}
        {loading && !analysis && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl flex flex-col items-center gap-4 border border-border">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-foreground">جاري تحميل بيانات الذهب...</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          <p>Golden Pulse v2.0 • تحديث كل ثانية</p>
        </div>
      </div>
    </div>
  );
};

export default GoldenPulse;
