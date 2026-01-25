import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Timer, TrendingDown, TrendingUp, Zap, Flame, Target, CheckCircle2, Volume2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ExplosionPhase, ExplosionTimer, PostExplosionStatus, ExplosionEntrySignal, ExplosionDetails } from '@/hooks/useMarketAnalysis';

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
  timeframe?: string;
  serverTimestamp?: string;
  accumulation?: AccumulationData;
  realTimeMetrics?: RealTimeMetrics;
  explosionTimer?: ExplosionTimer;
  priceConsolidation?: boolean;
  bollingerSqueeze?: boolean;
  volumeSpike?: boolean;
}

const formatPriceForSymbol = (symbol: string, price: number) => {
  const isCrypto = symbol.endsWith('USDT');
  const isGold = symbol === 'XAUUSD';
  const isJpyPair = symbol.endsWith('JPY');

  const digits = isGold ? 2 : isCrypto ? 2 : isJpyPair ? 3 : 5;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price);
};

export const ExplosionCountdown = ({
  symbol,
  timeframe = '15m',
  serverTimestamp,
  accumulation,
  realTimeMetrics,
  explosionTimer,
  priceConsolidation,
  bollingerSqueeze,
  volumeSpike
}: ExplosionCountdownProps) => {
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Align the timer with backend time
  const serverOffsetMs = useMemo(() => {
    if (!serverTimestamp) return 0;
    const serverMs = new Date(serverTimestamp).getTime();
    if (Number.isNaN(serverMs)) return 0;
    return serverMs - Date.now();
  }, [serverTimestamp]);

  const effectiveNowMs = nowTick + serverOffsetMs;

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdownData = useMemo(() => {
    const startedAt = explosionTimer?.compressionStartedAt ? new Date(explosionTimer.compressionStartedAt).getTime() : null;
    const explodeAt = (explosionTimer?.actualExplosionAt || explosionTimer?.expectedExplosionAt)
      ? new Date(explosionTimer.actualExplosionAt || explosionTimer.expectedExplosionAt!).getTime()
      : null;
    const expectedDurationSeconds = explosionTimer?.expectedDurationSeconds ?? null;

    const elapsedSeconds = startedAt ? Math.max(0, Math.floor((effectiveNowMs - startedAt) / 1000)) : 0;
    const remainingSeconds = explodeAt ? Math.floor((explodeAt - effectiveNowMs) / 1000) : 0;

    const minutes = Math.floor(Math.abs(remainingSeconds) / 60);
    const seconds = Math.floor(Math.abs(remainingSeconds) % 60);

    // FIX: When remainingSeconds is 0 or negative, treat as past explosion
    const isPastExplosion = remainingSeconds <= 0;
    
    // Urgency is only relevant when NOT past explosion
    const urgency = isPastExplosion ? 'expired'
      : remainingSeconds < 120 ? 'critical'
      : remainingSeconds < 300 ? 'high'
      : remainingSeconds < 600 ? 'medium'
      : 'low';

    const progress = expectedDurationSeconds && expectedDurationSeconds > 0
      ? Math.min(100, (elapsedSeconds / expectedDurationSeconds) * 100)
      : 0;

    let elapsedSinceExplosion = 0;
    if (explodeAt != null && isPastExplosion) {
      elapsedSinceExplosion = Math.max(0, Math.floor((effectiveNowMs - explodeAt) / 1000));
    }

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
      elapsedSinceExplosion,
      elapsedExplosionMinutes: Math.floor(elapsedSinceExplosion / 60),
      elapsedExplosionSeconds: elapsedSinceExplosion % 60,
    };
  }, [
    explosionTimer?.compressionStartedAt,
    explosionTimer?.expectedExplosionAt,
    explosionTimer?.actualExplosionAt,
    explosionTimer?.expectedDurationSeconds,
    effectiveNowMs,
  ]);

  const phase = explosionTimer?.phase || 'none';
  const entrySignal = explosionTimer?.entrySignal;
  const postExplosion = explosionTimer?.postExplosion;

  // No active compression state
  if (phase === 'none' || phase === 'ended') {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <Timer className="w-6 h-6" />
            <span className="text-base font-medium">
              {phase === 'ended' ? 'انتهى الانفجار - انتظر ضغط جديد' : `لا يوجد ضغط سعري لـ ${symbol}`}
            </span>
          </div>
          
          {/* Quick metrics */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">عرض بولينجر</div>
              <div className="text-xl font-bold text-slate-200">{(realTimeMetrics?.bollingerWidth ?? 0).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">قوة التجميع</div>
              <div className="text-xl font-bold text-slate-200">{(accumulation?.strength ?? 0).toFixed(0)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = phase === 'active';
  const direction = (explosionTimer?.direction ?? accumulation?.expectedDirection ?? 'unknown') as 'up' | 'down' | 'unknown';

  // Simplified phase-based styling
  const getPhaseStyle = () => {
    if (isActive) {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-900/90 to-green-900/80',
        border: 'border-green-500/60',
        glow: 'shadow-lg shadow-green-500/20',
        accentColor: 'text-green-400',
        badgeClass: 'bg-green-500/20 text-green-300 border-green-500/50'
      };
    }
    
    // Past explosion but waiting for confirmation
    if (countdownData.isPastExplosion) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-900/90 to-yellow-900/80',
        border: 'border-yellow-500/60',
        glow: 'shadow-lg shadow-yellow-500/20',
        accentColor: 'text-yellow-400',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
      };
    }
    
    // Counting down
    if (countdownData.urgency === 'critical') {
      return {
        cardBg: 'bg-gradient-to-br from-red-900/90 to-orange-900/80',
        border: 'border-red-500/60',
        glow: 'shadow-lg shadow-red-500/30 animate-pulse',
        accentColor: 'text-red-400',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50'
      };
    }
    
    return {
      cardBg: 'bg-gradient-to-br from-slate-800/90 to-slate-700/80',
      border: 'border-slate-600/60',
      glow: 'shadow-lg',
      accentColor: 'text-slate-300',
      badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/50'
    };
  };

  const style = getPhaseStyle();

  return (
    <Card className={`${style.cardBg} ${style.border} border-2 ${style.glow} transition-all duration-300`}>
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Flame className="w-5 h-5 text-green-400" />
            ) : countdownData.isPastExplosion ? (
              <Clock className="w-5 h-5 text-yellow-400" />
            ) : (
              <Timer className="w-5 h-5 text-slate-400" />
            )}
            <span className="font-bold text-white text-lg">
              {isActive ? 'انفجار نشط!' : countdownData.isPastExplosion ? 'تجاوز الوقت' : 'عداد الانفجار'}
            </span>
          </div>
          <Badge className={`${style.badgeClass} border font-bold px-3 py-1`}>
            {symbol}
          </Badge>
        </div>

        {/* MAIN TIMER DISPLAY - Clear and Simple */}
        <div className="text-center py-4">
          {isActive ? (
            // Active explosion - show elapsed time
            <div className="space-y-2">
              <div className="text-sm text-green-300/80 font-medium">⏱️ مضى منذ الانفجار</div>
              <div className="text-6xl font-black text-green-400 tabular-nums tracking-wider">
                {String(countdownData.elapsedExplosionMinutes).padStart(2, '0')}:{String(countdownData.elapsedExplosionSeconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-green-200/70">راقب حركة السعر الآن!</div>
            </div>
          ) : countdownData.isPastExplosion ? (
            // Past expected time - show how much we've exceeded
            <div className="space-y-2">
              <div className="text-sm text-yellow-300/80 font-medium">⚠️ تجاوز الوقت المتوقع بـ</div>
              <div className="text-6xl font-black text-yellow-400 tabular-nums tracking-wider">
                +{String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-yellow-200/70">راقب الاختراق - قد يحدث في أي لحظة</div>
            </div>
          ) : (
            // Counting down to explosion
            <div className="space-y-2">
              <div className="text-sm text-white/60 font-medium">⏳ الانفجار المتوقع خلال</div>
              <div className={`text-6xl font-black ${style.accentColor} tabular-nums tracking-wider ${countdownData.urgency === 'critical' ? 'animate-pulse' : ''}`}>
                {String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
              </div>
              {countdownData.urgency === 'critical' && (
                <div className="text-sm text-red-300 animate-pulse font-medium">🚨 استعد للانفجار!</div>
              )}
            </div>
          )}
        </div>

        {/* Entry Signal - Simplified */}
        {entrySignal && (
          <div className={`rounded-xl p-4 border-2 ${
            entrySignal.canEnter 
              ? 'bg-green-900/40 border-green-500/50' 
              : 'bg-yellow-900/30 border-yellow-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {entrySignal.canEnter ? (
                  <Target className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
                <span className={`font-bold ${entrySignal.canEnter ? 'text-green-300' : 'text-yellow-300'}`}>
                  {entrySignal.canEnter ? 'ادخل الآن!' : 'انتظر التأكيد'}
                </span>
              </div>
              {entrySignal.canEnter && entrySignal.direction && (
                <Badge className={`${
                  entrySignal.direction === 'BUY' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                } font-bold`}>
                  {entrySignal.direction === 'BUY' ? '📈 شراء' : '📉 بيع'}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Explosion Details - When Active */}
        {isActive && explosionTimer?.explosionDetails && (
          <div className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-xs text-white/50 mb-1">سعر الانفجار</div>
                <div className="text-lg font-bold text-yellow-400">
                  {formatPriceForSymbol(symbol, explosionTimer.explosionDetails.explosionPrice)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/50 mb-1">السعر الحالي</div>
                <div className="text-lg font-bold text-white">
                  {formatPriceForSymbol(symbol, explosionTimer.explosionDetails.currentPrice)}
                </div>
              </div>
            </div>
            
            {/* Price movement */}
            <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${
              explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 
                ? 'bg-green-500/20 text-green-400' 
                : explosionTimer.explosionDetails.priceMoveSinceExplosionPercent < 0 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-slate-600/30 text-slate-400'
            }`}>
              {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : explosionTimer.explosionDetails.priceMoveSinceExplosionPercent < 0 ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : null}
              <span className="font-bold">
                {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 ? '+' : ''}
                {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent.toFixed(2)}%
              </span>
              <span className="text-sm opacity-70">منذ الانفجار</span>
            </div>

            {/* Direction */}
            <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${
              explosionTimer.explosionDetails.explosionDirection === 'up' 
                ? 'bg-green-500/20 text-green-300' 
                : explosionTimer.explosionDetails.explosionDirection === 'down' 
                ? 'bg-red-500/20 text-red-300' 
                : 'bg-slate-600/30 text-slate-300'
            }`}>
              {explosionTimer.explosionDetails.explosionDirection === 'up' ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">اتجاه صعود 📈</span>
                </>
              ) : explosionTimer.explosionDetails.explosionDirection === 'down' ? (
                <>
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-bold">اتجاه هبوط 📉</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span className="font-bold">مستقر</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Post-explosion confirmations */}
        {isActive && postExplosion && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${
              postExplosion.volumeConfirmed 
                ? 'bg-green-900/40 border-green-500/50' 
                : 'bg-slate-800/50 border-slate-600/30'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <Volume2 className={`w-4 h-4 ${postExplosion.volumeConfirmed ? 'text-green-400' : 'text-slate-400'}`} />
                <span className={postExplosion.volumeConfirmed ? 'text-green-300' : 'text-slate-400'}>
                  تأكيد الحجم
                </span>
                {postExplosion.volumeConfirmed && <CheckCircle2 className="w-4 h-4 text-green-400 mr-auto" />}
              </div>
            </div>
            <div className={`rounded-xl p-3 border ${
              postExplosion.breakoutConfirmed 
                ? 'bg-green-900/40 border-green-500/50' 
                : 'bg-slate-800/50 border-slate-600/30'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className={`w-4 h-4 ${postExplosion.breakoutConfirmed ? 'text-green-400' : 'text-slate-400'}`} />
                <span className={postExplosion.breakoutConfirmed ? 'text-green-300' : 'text-slate-400'}>
                  تأكيد الاختراق
                </span>
                {postExplosion.breakoutConfirmed && <CheckCircle2 className="w-4 h-4 text-green-400 mr-auto" />}
              </div>
            </div>
          </div>
        )}

        {/* Simple Metrics - 3 columns */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
            <div className="text-xs text-white/50 mb-1">مدة الضغط</div>
            <div className="text-lg font-bold text-white">{countdownData.elapsedMinutes}د</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
            <div className="text-xs text-white/50 mb-1">بولينجر</div>
            <div className={`text-lg font-bold ${(realTimeMetrics?.bollingerWidth ?? 99) < 1.5 ? 'text-red-400' : 'text-white'}`}>
              {(realTimeMetrics?.bollingerWidth ?? 0).toFixed(2)}%
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
            <div className="text-xs text-white/50 mb-1">الثقة</div>
            <div className={`text-lg font-bold ${(explosionTimer?.confidence ?? 0) >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {explosionTimer?.confidence ?? 0}%
            </div>
          </div>
        </div>

        {/* Progress Bar - Only when counting down */}
        {!isActive && !countdownData.isPastExplosion && (
          <div className="space-y-2">
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div 
                className={`h-full transition-all duration-500 ${
                  countdownData.urgency === 'critical' 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}
                style={{ width: `${Math.min(100, countdownData.progress)}%` }}
              />
            </div>
            <div className="text-center text-xs text-white/50">
              {Math.min(100, countdownData.progress).toFixed(0)}% من دورة الضغط
            </div>
          </div>
        )}

        {/* Expected Direction - Simplified */}
        {!isActive && (
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-4 border border-white/5">
            <span className="text-sm text-white/60">الاتجاه المتوقع</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold ${
              direction === 'up' ? 'bg-green-500/20 text-green-400' : 
              direction === 'down' ? 'bg-red-500/20 text-red-400' : 
              'bg-slate-600/30 text-slate-300'
            }`}>
              {direction === 'up' ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>صعود</span>
                </>
              ) : direction === 'down' ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span>هبوط</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>محايد</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Indicators badges - Compact */}
        {(bollingerSqueeze || volumeSpike || priceConsolidation) && (
          <div className="flex flex-wrap gap-2 justify-center">
            {bollingerSqueeze && (
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                🔥 ضغط بولينجر
              </Badge>
            )}
            {volumeSpike && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                📊 ارتفاع الحجم
              </Badge>
            )}
            {priceConsolidation && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                📍 تجميع سعري
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
