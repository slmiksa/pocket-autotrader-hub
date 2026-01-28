import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Shield,
  Timer,
  RefreshCw
} from "lucide-react";
import { useGoldenPulse } from "@/hooks/useGoldenPulse";
import { cn } from "@/lib/utils";

const GoldenPulse = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [screenFlash, setScreenFlash] = useState<'green' | 'red' | null>(null);
  const lastAlertRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    analysis,
    loading,
    error,
    tradeSession,
    cooldown,
    refetch,
    lastSignal,
    enterTrade,
    exitTrade,
  } = useGoldenPulse({
    autoRefresh: true,
    refreshInterval: 3000, // تحديث كل 3 ثوان لاستقرار أكبر
    maxTradeDuration: 90,
    cooldownPeriod: 120,
  });

  // حالة ثابتة للإشارة (لا تتغير إلا عند تأكيد قوي)
  const [stableSignal, setStableSignal] = useState<{
    action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
    confidence: number;
    reasons: string[];
    entryZone: string | null;
    lockedAt: Date | null;
  }>({
    action: 'HOLD',
    confidence: 0,
    reasons: [],
    entryZone: null,
    lockedAt: null
  });

  // تثبيت الإشارة - لا تتغير إلا بثقة عالية ومنطقة ارتداد
  useEffect(() => {
    if (!analysis) return;
    
    const { signal, reactionZones } = analysis;
    
    // إذا كنا في صفقة، نبحث عن إشارة خروج فقط
    if (tradeSession.isActive) {
      if (analysis.exitConditions.shouldExit || signal.action === 'EXIT') {
        setStableSignal({
          action: 'EXIT',
          confidence: 90,
          reasons: analysis.exitConditions.reason ? [analysis.exitConditions.reason] : ['حان وقت الخروج'],
          entryZone: null,
          lockedAt: new Date()
        });
      }
      return;
    }
    
    // للدخول: نحتاج ثقة >= 75 ومنطقة ارتداد واضحة
    const hasReactionZone = reactionZones.nearZone && 
      (reactionZones.zoneType === 'support' || reactionZones.zoneType === 'resistance');
    
    if (signal.confidence >= 75 && hasReactionZone) {
      // تأكد أن الإشارة مختلفة عن الحالية
      if (signal.action !== stableSignal.action || 
          (Date.now() - (stableSignal.lockedAt?.getTime() || 0)) > 30000) {
        setStableSignal({
          action: signal.action,
          confidence: signal.confidence,
          reasons: signal.reasons,
          entryZone: reactionZones.zoneType === 'support' ? 'دعم' : 'مقاومة',
          lockedAt: new Date()
        });
      }
    } else if (stableSignal.action !== 'HOLD' && !stableSignal.lockedAt) {
      // إعادة للانتظار إذا لم تكن هناك إشارة قوية
      setStableSignal({
        action: 'HOLD',
        confidence: 0,
        reasons: ['انتظار منطقة ارتداد واضحة'],
        entryZone: null,
        lockedAt: null
      });
    }
  }, [analysis, tradeSession.isActive, stableSignal.action, stableSignal.lockedAt]);

  // Play alert sound
  const playSound = useCallback((type: 'buy' | 'sell' | 'exit') => {
    if (!soundEnabled) return;
    
    try {
      const frequencies = {
        buy: [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
        sell: [493.88, 587.33, 698.46], // B4, D5, F5
        exit: [440, 349.23, 293.66], // A4, F4, D4 (descending)
      };
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const freqs = frequencies[type];
      
      freqs.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
        
        oscillator.start(audioContext.currentTime + i * 0.1);
        oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      console.log('Audio not available');
    }
  }, [soundEnabled]);

  // Flash screen effect
  const flashScreen = useCallback((color: 'green' | 'red') => {
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), 500);
  }, []);

  // Handle signal alerts
  useEffect(() => {
    if (!analysis) return;
    
    const { action, confidence } = analysis.signal;
    const alertKey = `${action}-${confidence}`;
    
    if (alertKey !== lastAlertRef.current && confidence >= 70) {
      lastAlertRef.current = alertKey;
      
      if (action === 'BUY') {
        playSound('buy');
        flashScreen('green');
      } else if (action === 'SELL') {
        playSound('sell');
        flashScreen('red');
      } else if (action === 'EXIT' || analysis.exitConditions.shouldExit) {
        playSound('exit');
      }
    }
  }, [analysis, playSound, flashScreen]);

  // Handle trade actions
  const handleEnterTrade = (direction: 'BUY' | 'SELL') => {
    if (analysis && cooldown === 0 && !tradeSession.isActive) {
      enterTrade(direction, analysis.currentPrice);
      playSound(direction.toLowerCase() as 'buy' | 'sell');
      flashScreen(direction === 'BUY' ? 'green' : 'red');
    }
  };

  const handleExitTrade = () => {
    exitTrade();
    playSound('exit');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!analysis) return <Minus className="h-8 w-8" />;
    
    switch (analysis.trend.direction) {
      case 'bullish':
        return <ArrowUp className="h-8 w-8 text-success" />;
      case 'bearish':
        return <ArrowDown className="h-8 w-8 text-destructive" />;
      default:
        return <Minus className="h-8 w-8 text-muted-foreground" />;
    }
  };

  // Get status text
  const getStatusText = () => {
    if (tradeSession.isActive) return 'IN TRADE';
    if (cooldown > 0) return 'COOLDOWN';
    if (!analysis) return 'LOADING...';
    
    switch (analysis.signal.action) {
      case 'BUY':
        return 'ENTER BUY';
      case 'SELL':
        return 'ENTER SELL';
      case 'EXIT':
        return 'EXIT NOW';
      default:
        return 'HOLD';
    }
  };

  // Background flash class
  const flashClass = screenFlash === 'green' 
    ? 'animate-pulse bg-success/20' 
    : screenFlash === 'red' 
    ? 'animate-pulse bg-destructive/20' 
    : '';

  return (
    <div className={cn("min-h-screen bg-[#0a0a0f] pt-16 pb-8 transition-colors duration-300", flashClass)}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-warning to-primary bg-clip-text text-transparent mb-2">
            Golden Pulse
          </h1>
          <p className="text-muted-foreground text-lg">نبض الذهب الخاطف</p>
          <Badge variant="outline" className="mt-2 border-warning/50 text-warning">
            XAUUSD Scalping System
          </Badge>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-4 border-destructive/50 bg-destructive/10">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">{error}</span>
              <Button variant="outline" size="sm" onClick={refetch} className="mr-auto">
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Price Display */}
        <Card className="mb-4 border-primary/30 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">GOLD / USD</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-bold font-mono">
                    {analysis?.currentPrice.toFixed(2) || '----.--'}
                  </span>
                  {getTrendIcon()}
                </div>
                {analysis && (
                  <div className={cn(
                    "text-sm mt-1 font-medium",
                    analysis.priceChange >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {analysis.priceChange >= 0 ? '+' : ''}{analysis.priceChange.toFixed(2)} 
                    ({analysis.priceChangePercent >= 0 ? '+' : ''}{analysis.priceChangePercent.toFixed(3)}%)
                  </div>
                )}
              </div>
              
              <div className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="mb-2"
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                <div className="text-xs text-muted-foreground">
                  {analysis?.timestamp ? new Date(analysis.timestamp).toLocaleTimeString('ar-SA') : '--:--:--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signal Status - استخدام الإشارة الثابتة */}
        <Card className={cn(
          "mb-4 transition-all duration-500 border-2",
          stableSignal.action === 'BUY' && "border-success bg-success/15",
          stableSignal.action === 'SELL' && "border-destructive bg-destructive/15",
          stableSignal.action === 'EXIT' && "border-warning bg-warning/15",
          stableSignal.action === 'HOLD' && "border-muted-foreground/30 bg-muted/10",
          tradeSession.isActive && "ring-2 ring-primary"
        )}>
          <CardContent className="py-6">
            <div className="text-center">
              {/* منطقة الارتداد */}
              {stableSignal.entryZone && (
                <div className="mb-3">
                  <Badge variant="outline" className="text-sm border-primary text-primary">
                    <Target className="h-3 w-3 ml-1" />
                    منطقة {stableSignal.entryZone}
                  </Badge>
                </div>
              )}
              
              <Badge 
                className={cn(
                  "text-xl px-8 py-3 mb-3 font-bold",
                  stableSignal.action === 'BUY' && "bg-success text-success-foreground",
                  stableSignal.action === 'SELL' && "bg-destructive text-destructive-foreground",
                  stableSignal.action === 'EXIT' && "bg-warning text-warning-foreground animate-pulse",
                  stableSignal.action === 'HOLD' && "bg-muted text-muted-foreground"
                )}
              >
                {stableSignal.action === 'BUY' ? '🟢 ادخل شراء' :
                 stableSignal.action === 'SELL' ? '🔴 ادخل بيع' :
                 stableSignal.action === 'EXIT' ? '⚠️ أغلق الآن' : '⏳ انتظر'}
              </Badge>
              
              {/* Confidence Bar */}
              <div className="mt-4 mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">مستوى الثقة</span>
                  <span className="font-bold text-foreground">{stableSignal.confidence}%</span>
                </div>
                <Progress 
                  value={stableSignal.confidence} 
                  className="h-3"
                />
              </div>

              {/* Signal Reasons */}
              {stableSignal.reasons.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {stableSignal.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-background/50">
                      {reason}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* وقت تثبيت الإشارة */}
              {stableSignal.lockedAt && stableSignal.action !== 'HOLD' && (
                <p className="text-xs text-muted-foreground mt-2">
                  تم تثبيت الإشارة: {stableSignal.lockedAt.toLocaleTimeString('ar-SA')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Button
            size="lg"
            className="h-20 text-xl font-bold bg-success hover:bg-success/90 text-success-foreground"
            disabled={cooldown > 0 || tradeSession.isActive || analysis?.signal.action === 'SELL'}
            onClick={() => handleEnterTrade('BUY')}
          >
            <TrendingUp className="h-8 w-8 ml-3" />
            BUY
          </Button>
          
          <Button
            size="lg"
            className="h-20 text-xl font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={cooldown > 0 || tradeSession.isActive || analysis?.signal.action === 'BUY'}
            onClick={() => handleEnterTrade('SELL')}
          >
            <TrendingDown className="h-8 w-8 ml-3" />
            SELL
          </Button>
        </div>

        {/* Exit Button (shown when in trade) */}
        {tradeSession.isActive && (
          <Button
            size="lg"
            variant="outline"
            className="w-full h-16 text-xl font-bold border-warning text-warning hover:bg-warning/10 mb-4"
            onClick={handleExitTrade}
          >
            <AlertTriangle className="h-6 w-6 ml-3" />
            EXIT NOW - أغلق الصفقة
          </Button>
        )}

        {/* Trade Session Info */}
        {tradeSession.isActive && (
          <Card className="mb-4 border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">الاتجاه</p>
                  <Badge className={tradeSession.direction === 'BUY' ? 'bg-success' : 'bg-destructive'}>
                    {tradeSession.direction}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">سعر الدخول</p>
                  <p className="font-bold">{tradeSession.entryPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المدة</p>
                  <p className="font-mono font-bold text-lg">{formatTime(tradeSession.duration)}</p>
                </div>
              </div>
              
              {/* Duration Progress */}
              <div className="mt-3">
                <Progress 
                  value={(tradeSession.duration / 90) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">
                  الحد الأقصى: 90 ثانية
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cooldown Display */}
        {cooldown > 0 && (
          <Card className="mb-4 border-muted bg-muted/20">
            <CardContent className="py-4 text-center">
              <Timer className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">فترة الانتظار</p>
              <p className="text-3xl font-mono font-bold">{formatTime(cooldown)}</p>
            </CardContent>
          </Card>
        )}

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Trend */}
          <Card className="border-muted">
            <CardContent className="py-3 text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">الاتجاه</p>
              <Badge variant="outline" className={cn(
                analysis?.trend.direction === 'bullish' && "border-success text-success",
                analysis?.trend.direction === 'bearish' && "border-destructive text-destructive"
              )}>
                {analysis?.trend.direction === 'bullish' ? 'صاعد' : 
                 analysis?.trend.direction === 'bearish' ? 'هابط' : 'محايد'}
              </Badge>
            </CardContent>
          </Card>

          {/* RSI */}
          <Card className="border-muted">
            <CardContent className="py-3 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-warning" />
              <p className="text-xs text-muted-foreground">RSI (7)</p>
              <p className="font-bold">{analysis?.momentum.rsi7.toFixed(1) || '--'}</p>
            </CardContent>
          </Card>

          {/* Volume */}
          <Card className="border-muted">
            <CardContent className="py-3 text-center">
              <Activity className="h-5 w-5 mx-auto mb-1 text-info" />
              <p className="text-xs text-muted-foreground">الحجم</p>
              <Badge variant={analysis?.momentum.volumeSpike ? "default" : "secondary"}>
                {analysis?.momentum.volumeRatio.toFixed(1) || '--'}x
              </Badge>
            </CardContent>
          </Card>

          {/* Zone */}
          <Card className="border-muted">
            <CardContent className="py-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-accent" />
              <p className="text-xs text-muted-foreground">المنطقة</p>
              <Badge variant="outline">
                {analysis?.reactionZones.zoneType === 'support' ? 'دعم' :
                 analysis?.reactionZones.zoneType === 'resistance' ? 'مقاومة' :
                 analysis?.reactionZones.zoneType === 'vwap' ? 'VWAP' : 'لا يوجد'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* EMA Values */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              المتوسطات المتحركة (EMA)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">EMA 9</p>
                <p className="font-mono font-bold text-success">
                  {analysis?.trend.ema9.toFixed(2) || '----'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EMA 21</p>
                <p className="font-mono font-bold text-warning">
                  {analysis?.trend.ema21.toFixed(2) || '----'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">EMA 50</p>
                <p className="font-mono font-bold text-destructive">
                  {analysis?.trend.ema50.toFixed(2) || '----'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit Conditions Alert */}
        {analysis?.exitConditions.shouldExit && tradeSession.isActive && (
          <Card className="mb-4 border-warning bg-warning/10 animate-pulse">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-bold text-warning">⚠️ إشارة خروج!</p>
                <p className="text-sm text-muted-foreground">{analysis.exitConditions.reason}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Levels */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              المستويات الرئيسية
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">المقاومة</p>
                <p className="font-mono font-bold text-destructive">
                  {analysis?.reactionZones.previousHigh.toFixed(2) || '----'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VWAP</p>
                <p className="font-mono font-bold text-primary">
                  {analysis?.reactionZones.vwap.toFixed(2) || '----'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الدعم</p>
                <p className="font-mono font-bold text-success">
                  {analysis?.reactionZones.previousLow.toFixed(2) || '----'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info Footer */}
        <div className="text-center text-xs text-muted-foreground mt-6">
          <p>Golden Pulse v1.0</p>
          <p>تحديث كل 3 ثوان • بدون SL/TP</p>
        </div>
      </div>
    </div>
  );
};

export default GoldenPulse;
