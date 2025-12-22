import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, Zap, AlertTriangle, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface RealTimeMetrics {
  avgVolume24h: number;
  currentVolume: number;
  volumeChangePercent: number;
  volatilityIndex: number;
  priceRangePercent: number;
  bollingerWidth: number;
}

interface AccumulationData {
  detected: boolean;
  compressionLevel: number;
  priceRange: number;
  volumeRatio: number;
  strength: number;
  breakoutProbability: number;
  expectedDirection: 'up' | 'down' | 'unknown';
}

interface ExplosionCountdownProps {
  symbol: string;
  accumulation?: AccumulationData;
  bollingerWidth?: number;
  priceConsolidation?: boolean;
  bollingerSqueeze?: boolean;
  realTimeMetrics?: RealTimeMetrics;
  volumeSpike?: boolean;
}

export const ExplosionCountdown = ({ 
  symbol,
  accumulation, 
  bollingerWidth = 2,
  priceConsolidation,
  bollingerSqueeze,
  realTimeMetrics,
  volumeSpike
}: ExplosionCountdownProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const compressionStartRef = useRef<number | null>(null);
  const [compressionDuration, setCompressionDuration] = useState(0);

  // Track when compression started
  useEffect(() => {
    const isCompressing = priceConsolidation || bollingerSqueeze || accumulation?.detected;
    
    if (isCompressing && compressionStartRef.current === null) {
      // Compression just started
      compressionStartRef.current = Date.now();
    } else if (!isCompressing && compressionStartRef.current !== null) {
      // Compression ended
      compressionStartRef.current = null;
      setElapsedTime(0);
      setCompressionDuration(0);
    }
  }, [priceConsolidation, bollingerSqueeze, accumulation?.detected]);

  // Update elapsed time every second when compression is active
  useEffect(() => {
    if (compressionStartRef.current === null) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - compressionStartRef.current!) / 1000);
      setElapsedTime(elapsed);
      setCompressionDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate explosion countdown based on REAL compression metrics
  const countdownData = useMemo(() => {
    // Base expected compression time: 20-60 minutes depending on volatility
    // Lower volatility = longer compression = bigger explosion
    const baseMinutes = 30;
    
    // Calculate compression factor from real data
    let compressionFactor = 1;
    
    // Real Bollinger width analysis
    if (realTimeMetrics?.bollingerWidth) {
      const bw = realTimeMetrics.bollingerWidth;
      if (bw < 0.5) compressionFactor *= 0.3; // Extreme squeeze - explosion very soon
      else if (bw < 1.0) compressionFactor *= 0.5;
      else if (bw < 1.5) compressionFactor *= 0.7;
      else if (bw < 2.0) compressionFactor *= 0.85;
    }

    // Real volatility index
    if (realTimeMetrics?.volatilityIndex) {
      const vi = realTimeMetrics.volatilityIndex;
      if (vi < 30) compressionFactor *= 0.6; // Very low volatility = explosion imminent
      else if (vi < 50) compressionFactor *= 0.8;
    }

    // Accumulation strength from real analysis
    if (accumulation?.strength) {
      if (accumulation.strength > 80) compressionFactor *= 0.5;
      else if (accumulation.strength > 60) compressionFactor *= 0.7;
    }

    // Volume spike accelerates countdown
    if (volumeSpike && realTimeMetrics?.volumeChangePercent && realTimeMetrics.volumeChangePercent > 100) {
      compressionFactor *= 0.6;
    }

    const expectedDurationSeconds = baseMinutes * 60 * compressionFactor;
    const remainingSeconds = Math.max(0, expectedDurationSeconds - elapsedTime);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    
    // Calculate urgency level based on real remaining time
    const urgency = remainingSeconds < 120 ? 'critical' : 
                    remainingSeconds < 300 ? 'high' : 
                    remainingSeconds < 600 ? 'medium' : 'low';

    // Progress percentage based on actual elapsed time
    const progress = expectedDurationSeconds > 0 
      ? Math.min(100, (elapsedTime / expectedDurationSeconds) * 100)
      : 0;

    return { 
      minutes, 
      seconds, 
      remainingSeconds, 
      urgency, 
      progress, 
      expectedDurationSeconds,
      elapsedMinutes: Math.floor(elapsedTime / 60)
    };
  }, [realTimeMetrics, accumulation, elapsedTime, volumeSpike]);

  // If no compression detected, show waiting state
  if (!priceConsolidation && !bollingerSqueeze && !accumulation?.detected) {
    return (
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Timer className="w-5 h-5" />
            <span className="text-sm">في انتظار اكتشاف ضغط سعري لـ {symbol}...</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">عرض بولينجر</div>
              <div className="text-slate-300 font-bold">{(realTimeMetrics?.bollingerWidth || bollingerWidth).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">مؤشر التذبذب</div>
              <div className="text-slate-300 font-bold">{realTimeMetrics?.volatilityIndex || 0}%</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">نطاق السعر</div>
              <div className="text-slate-300 font-bold">{(realTimeMetrics?.priceRangePercent || 0).toFixed(2)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgencyColors = {
    critical: {
      bg: 'from-red-900 to-red-800',
      border: 'border-red-500',
      text: 'text-red-300',
      glow: 'shadow-red-500/30 shadow-lg',
      badge: 'bg-red-500/30 text-red-200'
    },
    high: {
      bg: 'from-orange-900 to-orange-800',
      border: 'border-orange-500',
      text: 'text-orange-300',
      glow: 'shadow-orange-500/20',
      badge: 'bg-orange-500/30 text-orange-200'
    },
    medium: {
      bg: 'from-yellow-900 to-amber-800',
      border: 'border-yellow-500',
      text: 'text-yellow-300',
      glow: 'shadow-yellow-500/20',
      badge: 'bg-yellow-500/30 text-yellow-200'
    },
    low: {
      bg: 'from-slate-800 to-slate-700',
      border: 'border-slate-600',
      text: 'text-slate-300',
      glow: '',
      badge: 'bg-slate-500/30 text-slate-200'
    }
  };

  const colors = urgencyColors[countdownData.urgency];

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg ${colors.glow}`}>
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${countdownData.urgency === 'critical' ? 'animate-pulse text-red-400' : 'text-yellow-400'}`} />
            <span>عداد الانفجار السعري</span>
            <Badge variant="outline" className="text-[10px] border-white/30 text-white/70">
              {symbol}
            </Badge>
          </div>
          <Badge className={`${colors.badge} border-0`}>
            {countdownData.urgency === 'critical' ? '🔥 وشيك!' : 
             countdownData.urgency === 'high' ? '⚡ قريب' : 
             countdownData.urgency === 'medium' ? '⏳ متوسط' : '🕐 بعيد'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Countdown Timer */}
        <div className="text-center">
          <div className={`text-5xl font-black ${colors.text} tracking-wider ${countdownData.urgency === 'critical' ? 'animate-pulse' : ''}`}>
            {String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/60 mt-1">الوقت المتوقع للانفجار</div>
        </div>

        {/* Real-Time Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/20 rounded p-2 border border-white/10">
            <div className="text-[9px] text-white/50 flex items-center justify-center gap-1">
              <BarChart3 className="w-3 h-3" />
              مدة الضغط
            </div>
            <div className="text-sm font-bold text-white">{countdownData.elapsedMinutes}د</div>
          </div>
          <div className="bg-black/20 rounded p-2 border border-white/10">
            <div className="text-[9px] text-white/50">عرض بولينجر</div>
            <div className={`text-sm font-bold ${(realTimeMetrics?.bollingerWidth || bollingerWidth) < 1.5 ? 'text-red-400' : 'text-white'}`}>
              {(realTimeMetrics?.bollingerWidth || bollingerWidth).toFixed(2)}%
            </div>
          </div>
          <div className="bg-black/20 rounded p-2 border border-white/10">
            <div className="text-[9px] text-white/50">قوة التجميع</div>
            <div className={`text-sm font-bold ${(accumulation?.strength || 0) > 60 ? 'text-yellow-400' : 'text-white'}`}>
              {accumulation?.strength || 0}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-white/60">
            <span>بداية الضغط</span>
            <span>الانفجار</span>
          </div>
          <div className="relative">
            <Progress 
              value={countdownData.progress} 
              className="h-3 bg-black/30"
            />
            {countdownData.urgency === 'critical' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
              </div>
            )}
          </div>
          <div className="text-center text-[10px] text-white/60">
            {countdownData.progress.toFixed(0)}% من دورة الضغط
          </div>
        </div>

        {/* Expected Direction */}
        {accumulation?.expectedDirection && accumulation.expectedDirection !== 'unknown' && (
          <div className="bg-black/20 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">الاتجاه المتوقع</span>
              <div className={`flex items-center gap-1 ${accumulation.expectedDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {accumulation.expectedDirection === 'up' ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold">صعود</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-bold">هبوط</span>
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-white/70">احتمالية الانفجار</span>
              <span className={`text-sm font-bold ${accumulation.breakoutProbability >= 70 ? 'text-green-400' : 'text-yellow-300'}`}>
                {accumulation.breakoutProbability}%
              </span>
            </div>
          </div>
        )}

        {/* Warning */}
        {countdownData.urgency === 'critical' && (
          <div className="bg-red-500/20 rounded-lg p-2 flex items-center gap-2 border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">⚠️ انفجار سعري وشيك - استعد للدخول!</span>
          </div>
        )}

        {/* Real-Time Compression Indicators */}
        <div className="flex gap-2 flex-wrap justify-center">
          {bollingerSqueeze && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px]">
              🔥 ضغط بولينجر نشط
            </Badge>
          )}
          {priceConsolidation && (
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px]">
              📍 تجميع سعري فوري
            </Badge>
          )}
          {volumeSpike && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]">
              📊 ارتفاع حجم {realTimeMetrics?.volumeChangePercent}%+
            </Badge>
          )}
          {realTimeMetrics && realTimeMetrics.bollingerWidth < 1.5 && (
            <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-[10px]">
              ⚡ عرض ضيق جداً
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
