import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface ExplosionCountdownProps {
  accumulation?: {
    detected: boolean;
    compressionLevel: number;
    priceRange: number;
    volumeRatio: number;
    strength: number;
    breakoutProbability: number;
    expectedDirection: 'up' | 'down' | 'unknown';
  };
  bollingerWidth?: number;
  priceConsolidation?: boolean;
  bollingerSqueeze?: boolean;
}

export const ExplosionCountdown = ({ 
  accumulation, 
  bollingerWidth = 2,
  priceConsolidation,
  bollingerSqueeze
}: ExplosionCountdownProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(() => Date.now());

  // Update elapsed time every second when compression is detected
  useEffect(() => {
    if (!priceConsolidation && !bollingerSqueeze && !accumulation?.detected) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [priceConsolidation, bollingerSqueeze, accumulation?.detected, startTime]);

  // Calculate explosion countdown based on compression metrics
  const countdownData = useMemo(() => {
    // Typical compression duration before explosion: 30-90 minutes
    // More compression = closer to explosion
    const baseTime = 45 * 60; // 45 minutes in seconds
    
    // Factors that reduce time to explosion
    let compressionFactor = 1;
    
    if (bollingerWidth && bollingerWidth < 1) {
      compressionFactor *= 0.5; // Very tight squeeze = explosion imminent
    } else if (bollingerWidth && bollingerWidth < 1.5) {
      compressionFactor *= 0.7;
    } else if (bollingerWidth && bollingerWidth < 2) {
      compressionFactor *= 0.85;
    }

    if (accumulation?.compressionLevel && accumulation.compressionLevel > 0.7) {
      compressionFactor *= 0.6;
    }

    if (accumulation?.strength && accumulation.strength > 60) {
      compressionFactor *= 0.7;
    }

    const adjustedTime = baseTime * compressionFactor;
    const remainingSeconds = Math.max(0, adjustedTime - elapsedTime);
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    
    // Calculate urgency level
    const urgency = remainingSeconds < 300 ? 'critical' : 
                    remainingSeconds < 600 ? 'high' : 
                    remainingSeconds < 1200 ? 'medium' : 'low';

    // Progress percentage (how close to explosion)
    const progress = Math.min(100, ((adjustedTime - remainingSeconds) / adjustedTime) * 100);

    return { minutes, seconds, remainingSeconds, urgency, progress, adjustedTime };
  }, [bollingerWidth, accumulation, elapsedTime]);

  // If no compression detected, show waiting state
  if (!priceConsolidation && !bollingerSqueeze && !accumulation?.detected) {
    return (
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Timer className="w-5 h-5" />
            <span className="text-sm">في انتظار اكتشاف ضغط سعري...</span>
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
      glow: 'shadow-red-500/30',
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
          </div>
          <Badge className={`${colors.badge} border-0`}>
            {countdownData.urgency === 'critical' ? 'وشيك!' : 
             countdownData.urgency === 'high' ? 'قريب' : 
             countdownData.urgency === 'medium' ? 'متوسط' : 'بعيد'}
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
              <span className="text-sm font-bold text-yellow-300">
                {accumulation.breakoutProbability}%
              </span>
            </div>
          </div>
        )}

        {/* Warning */}
        {countdownData.urgency === 'critical' && (
          <div className="bg-red-500/20 rounded-lg p-2 flex items-center gap-2 border border-red-500/40">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs text-red-300">⚠️ انفجار سعري وشيك - استعد للدخول!</span>
          </div>
        )}

        {/* Compression Indicators */}
        <div className="flex gap-2 flex-wrap justify-center">
          {bollingerSqueeze && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px]">
              🔥 ضغط بولينجر
            </Badge>
          )}
          {priceConsolidation && (
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px]">
              📍 تجميع سعري
            </Badge>
          )}
          {bollingerWidth && bollingerWidth < 1.5 && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]">
              ⚡ عرض {bollingerWidth.toFixed(2)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
