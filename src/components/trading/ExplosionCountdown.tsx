import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock, Timer, TrendingDown, TrendingUp, XCircle, Zap } from 'lucide-react';
import { ExplosionPhase, ExplosionTimer, PostExplosionStatus, ExplosionEntrySignal } from '@/hooks/useMarketAnalysis';

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

type RecentCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  direction: 'bull' | 'bear' | 'doji';
};

interface ExplosionCountdownProps {
  symbol: string;
  timeframe?: string;
  accumulation?: AccumulationData;
  realTimeMetrics?: RealTimeMetrics;
  explosionTimer?: ExplosionTimer;
  recentCandles?: RecentCandle[];
  priceConsolidation?: boolean;
  bollingerSqueeze?: boolean;
  volumeSpike?: boolean;
}

export const ExplosionCountdown = ({
  symbol,
  timeframe = '15m',
  accumulation,
  realTimeMetrics,
  explosionTimer,
  recentCandles,
  priceConsolidation,
  bollingerSqueeze,
  volumeSpike
}: ExplosionCountdownProps) => {
  const [nowTick, setNowTick] = useState(() => Date.now());
  
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdownData = useMemo(() => {
    const startedAt = explosionTimer?.compressionStartedAt ? new Date(explosionTimer.compressionStartedAt).getTime() : null;
    const explodeAt = explosionTimer?.expectedExplosionAt ? new Date(explosionTimer.expectedExplosionAt).getTime() : null;
    const expectedDurationSeconds = explosionTimer?.expectedDurationSeconds ?? null;
    const elapsedSeconds = startedAt ? Math.max(0, Math.floor((nowTick - startedAt) / 1000)) : 0;
    const remainingSeconds = explodeAt ? Math.floor((explodeAt - nowTick) / 1000) : 0;
    const minutes = Math.floor(Math.abs(remainingSeconds) / 60);
    const seconds = Math.floor(Math.abs(remainingSeconds) % 60);
    const isPastExplosion = remainingSeconds < 0;
    const urgency = !isPastExplosion && remainingSeconds < 120 ? 'critical' 
      : !isPastExplosion && remainingSeconds < 300 ? 'high' 
      : !isPastExplosion && remainingSeconds < 600 ? 'medium' 
      : 'low';
    const progress = expectedDurationSeconds && expectedDurationSeconds > 0 ? Math.min(100, elapsedSeconds / expectedDurationSeconds * 100) : 0;
    
    return {
      minutes,
      seconds,
      remainingSeconds,
      elapsedSeconds,
      elapsedMinutes: Math.floor(elapsedSeconds / 60),
      urgency,
      progress,
      expectedDurationSeconds,
      startedAt,
      explodeAt,
      isPastExplosion,
    };
  }, [explosionTimer?.compressionStartedAt, explosionTimer?.expectedExplosionAt, explosionTimer?.expectedDurationSeconds, nowTick]);

  const phase = explosionTimer?.phase || 'none';
  const entrySignal = explosionTimer?.entrySignal;
  const postExplosion = explosionTimer?.postExplosion;

  // No active state
  if (phase === 'none' || phase === 'ended') {
    const bw = realTimeMetrics?.bollingerWidth ?? 0;
    const vi = realTimeMetrics?.volatilityIndex ?? 0;
    const pr = realTimeMetrics?.priceRangePercent ?? 0;
    const acc = accumulation?.strength ?? 0;
    
    return (
      <Card className="bg-slate-900/80 border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            {phase === 'ended' ? (
              <>
                <Clock className="w-5 h-5" />
                <span className="text-sm">انتهى الانفجار السابق - انتظر تجميع جديد</span>
              </>
            ) : (
              <>
                <Timer className="w-5 h-5" />
                <span className="text-sm">لا يوجد ضغط سعري نشط لـ {symbol} حالياً</span>
              </>
            )}
          </div>
          
          {/* Post-explosion summary if available */}
          {phase === 'ended' && postExplosion && (
            <div className="mt-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-2">نتيجة الانفجار السابق</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1">
                  {postExplosion.breakoutConfirmed ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-slate-300">
                    {postExplosion.breakoutConfirmed ? 'اختراق ناجح' : 'لم يحدث اختراق'}
                  </span>
                </div>
                <div className={`${postExplosion.priceMovedPercent > 0 ? 'text-green-400' : postExplosion.priceMovedPercent < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  تحرك السعر: {postExplosion.priceMovedPercent > 0 ? '+' : ''}{postExplosion.priceMovedPercent}%
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">عرض بولينجر</div>
              <div className="text-slate-300 font-bold">{Number(bw).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">نطاق السعر</div>
              <div className="text-slate-300 font-bold">{Number(pr).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">مؤشر التذبذب</div>
              <div className="text-slate-300 font-bold">{Number(vi).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded p-2">
              <div className="text-slate-500">مؤشر التجميع</div>
              <div className="text-slate-300 font-bold">{Number(acc).toFixed(0)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Phase colors
  const phaseColors = {
    countdown: {
      critical: { bg: 'from-red-900 to-red-800', border: 'border-red-500', text: 'text-red-300', glow: 'shadow-red-500/30 shadow-lg' },
      high: { bg: 'from-orange-900 to-orange-800', border: 'border-orange-500', text: 'text-orange-300', glow: 'shadow-orange-500/20' },
      medium: { bg: 'from-yellow-900 to-amber-800', border: 'border-yellow-500', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
      low: { bg: 'from-slate-800 to-slate-700', border: 'border-slate-600', text: 'text-slate-300', glow: '' },
    },
    active: {
      bg: 'from-green-900 to-emerald-800',
      border: 'border-green-500',
      text: 'text-green-300',
      glow: 'shadow-green-500/30 shadow-lg animate-pulse',
    },
  };

  const isActive = phase === 'active';
  const colors = isActive 
    ? phaseColors.active 
    : phaseColors.countdown[countdownData.urgency as keyof typeof phaseColors.countdown];

  const direction = (explosionTimer?.direction ?? accumulation?.expectedDirection ?? 'unknown') as 'up' | 'down' | 'unknown';

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg ${colors.glow}`}>
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Zap className="w-4 h-4 text-green-400 animate-pulse" />
            ) : (
              <Timer className={`w-4 h-4 ${countdownData.urgency === 'critical' ? 'animate-pulse text-red-400' : 'text-yellow-400'}`} />
            )}
            <span>{isActive ? 'انفجار سعري نشط!' : 'عداد الانفجار السعري'}</span>
            <Badge variant="outline" className="text-[10px] border-white/30 text-white/70">
              {symbol}
            </Badge>
          </div>
          <Badge className={`${isActive ? 'bg-green-500/30 text-green-200' : 'bg-orange-500/30 text-orange-200'} border-0`}>
            {isActive ? '🔥 نشط الآن!' : 
              countdownData.urgency === 'critical' ? '⚡ وشيك!' : 
              countdownData.urgency === 'high' ? '⏰ قريب' : 
              countdownData.urgency === 'medium' ? '⏳ متوسط' : '🕐 بعيد'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          {isActive ? (
            <div className="space-y-2">
              <div className="text-3xl font-black text-green-300 animate-pulse">
                🔥 الانفجار نشط الآن!
              </div>
              {postExplosion && (
                <div className="text-sm text-green-200">
                  مضى {Math.floor(postExplosion.elapsedSinceExplosion / 60)}:{String(postExplosion.elapsedSinceExplosion % 60).padStart(2, '0')} منذ بداية الانفجار
                </div>
              )}
            </div>
          ) : countdownData.isPastExplosion ? (
            <div className="space-y-2">
              <div className="text-4xl font-black text-yellow-300">
                +{String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-yellow-200">تجاوز الوقت المتوقع - راقب الاختراق</div>
            </div>
          ) : (
            <div className={`text-5xl font-black ${colors.text} tracking-wider ${countdownData.urgency === 'critical' ? 'animate-pulse' : ''}`}>
              {String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Entry Signal Card - IMPORTANT */}
        {entrySignal && (
          <div className={`rounded-lg p-3 border-2 ${
            entrySignal.canEnter 
              ? 'bg-green-900/50 border-green-500' 
              : 'bg-slate-800/50 border-slate-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {entrySignal.canEnter ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
                <span className={`font-bold ${entrySignal.canEnter ? 'text-green-300' : 'text-yellow-300'}`}>
                  {entrySignal.canEnter ? 'يمكن الدخول الآن!' : 'انتظر التأكيد'}
                </span>
              </div>
              {entrySignal.canEnter && (
                <Badge className={`${
                  entrySignal.direction === 'BUY' ? 'bg-green-500' : 
                  entrySignal.direction === 'SELL' ? 'bg-red-500' : 'bg-slate-500'
                } text-white font-bold`}>
                  {entrySignal.direction === 'BUY' ? '📈 شراء' : 
                   entrySignal.direction === 'SELL' ? '📉 بيع' : 'انتظر'}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {entrySignal.reasons.map((reason, idx) => (
                <div key={idx} className="text-xs text-white/80 flex items-start gap-1">
                  <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post-explosion status */}
        {isActive && postExplosion && (
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg p-2 border ${postExplosion.volumeConfirmed ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-800/50 border-slate-600'}`}>
              <div className="flex items-center gap-1 text-xs">
                {postExplosion.volumeConfirmed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-400" />
                )}
                <span className={postExplosion.volumeConfirmed ? 'text-green-300' : 'text-slate-400'}>
                  تأكيد الحجم
                </span>
              </div>
            </div>
            <div className={`rounded-lg p-2 border ${postExplosion.breakoutConfirmed ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-800/50 border-slate-600'}`}>
              <div className="flex items-center gap-1 text-xs">
                {postExplosion.breakoutConfirmed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-slate-400" />
                )}
                <span className={postExplosion.breakoutConfirmed ? 'text-green-300' : 'text-slate-400'}>
                  تأكيد الاختراق
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
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
            <div className={`text-sm font-bold ${(realTimeMetrics?.bollingerWidth ?? 99) < 1.5 ? 'text-red-400' : 'text-white'}`}>
              {(realTimeMetrics?.bollingerWidth ?? 0).toFixed(2)}%
            </div>
          </div>
          <div className="bg-black/20 rounded p-2 border border-white/10">
            <div className="text-[9px] text-white/50">ثقة الانفجار</div>
            <div className={`text-sm font-bold ${(explosionTimer?.confidence ?? 0) >= 70 ? 'text-green-400' : 'text-yellow-300'}`}>
              {explosionTimer?.confidence ?? 0}%
            </div>
          </div>
        </div>

        {/* Progress */}
        {!isActive && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/60">
              <span>بداية الضغط</span>
              <span>الانفجار</span>
            </div>
            <div className="relative">
              <Progress value={Math.min(100, countdownData.progress)} className="h-3 bg-black/30" />
              {countdownData.urgency === 'critical' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
                </div>
              )}
            </div>
            <div className="text-center text-[10px] text-white/60">{Math.min(100, countdownData.progress).toFixed(0)}% من دورة الضغط</div>
          </div>
        )}

        {/* Expected Direction */}
        <div className="bg-black/20 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">الاتجاه المتوقع</span>
            <div className={`flex items-center gap-1 ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-slate-300'}`}>
              {direction === 'up' ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">صعود</span>
                </>
              ) : direction === 'down' ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-bold">هبوط</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-bold">محايد</span>
                </>
              )}
            </div>
          </div>
          {accumulation?.breakoutProbability !== undefined && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-white/70">احتمالية الانفجار</span>
              <span className={`text-sm font-bold ${accumulation.breakoutProbability >= 70 ? 'text-green-400' : 'text-yellow-300'}`}>
                {accumulation.breakoutProbability}%
              </span>
            </div>
          )}
        </div>

        {/* Warning for critical countdown */}
        {!isActive && countdownData.urgency === 'critical' && (
          <div className="bg-red-500/20 rounded-lg p-2 flex items-center gap-2 border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">⚠️ انفجار سعري وشيك - استعد للدخول!</span>
          </div>
        )}

        {/* Indicators */}
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
        </div>

        {/* Calibration Info */}
        {explosionTimer?.calibration && (
          <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-2 border border-indigo-500/30">
            <div className="text-[10px] text-indigo-300/80 font-medium mb-1 flex items-center gap-1">
              ⚙️ معايرة تلقائية لـ {symbol} ({timeframe})
            </div>
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              <div className="text-center">
                <div className="text-white/50">عتبة الضغط</div>
                <div className="text-indigo-300 font-bold">{explosionTimer.calibration.dynamicThreshold}%</div>
              </div>
              <div className="text-center">
                <div className="text-white/50">المعامل</div>
                <div className="text-indigo-300 font-bold">{explosionTimer.calibration.ratioUsed}×</div>
              </div>
              <div className="text-center">
                <div className="text-white/50">الفترة</div>
                <div className="text-indigo-300 font-bold">{explosionTimer.calibration.windowDays}ي</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Candles */}
        {recentCandles?.length ? (
          <div className="bg-black/20 rounded-lg p-2 border border-white/10">
            <div className="text-[10px] text-white/60 mb-1">آخر 5 شمعات ({timeframe})</div>
            <div className="space-y-1">
              {recentCandles.slice(-5).reverse().map((c) => {
                const t = new Date(c.time);
                const timeLabel = Number.isFinite(t.getTime())
                  ? t.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
                  : c.time;
                const dirColor = c.direction === 'bull' ? 'text-green-300' : c.direction === 'bear' ? 'text-red-300' : 'text-slate-200';
                const dirLabel = c.direction === 'bull' ? '▲' : c.direction === 'bear' ? '▼' : '•';
                return (
                  <div key={c.time} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">{timeLabel}</span>
                      <span className={dirColor}>{dirLabel}</span>
                    </div>
                    <div className="text-white/70 tabular-nums">
                      O {c.open.toFixed(5)} • H {c.high.toFixed(5)} • L {c.low.toFixed(5)} • C {c.close.toFixed(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Debug stamp */}
        <div className="text-[10px] text-white/40 text-center">
          الطريقة: {explosionTimer?.method === 'bollinger_squeeze_history' ? 'تاريخ ضغط بولينجر' : '—'} • الإطار: {timeframe} • المرحلة: {phase}
        </div>
      </CardContent>
    </Card>
  );
};
