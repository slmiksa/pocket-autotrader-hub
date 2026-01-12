import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock, Timer, TrendingDown, TrendingUp, XCircle, Zap, Flame, Target, Shield, Volume2, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

type RecentCandle = {
  time: string;
  open: number;
  high: number;
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
  
  // Update every second for accurate countdown
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
    
    // Calculate elapsed time since explosion for active phase
    const elapsedSinceExplosion = isPastExplosion ? Math.abs(remainingSeconds) : 0;
    const elapsedExplosionMinutes = Math.floor(elapsedSinceExplosion / 60);
    const elapsedExplosionSeconds = elapsedSinceExplosion % 60;
    
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
      elapsedExplosionMinutes,
      elapsedExplosionSeconds,
    };
  }, [explosionTimer?.compressionStartedAt, explosionTimer?.expectedExplosionAt, explosionTimer?.expectedDurationSeconds, nowTick]);

  const phase = explosionTimer?.phase || 'none';
  const entrySignal = explosionTimer?.entrySignal;
  const postExplosion = explosionTimer?.postExplosion;

  // Determine if entry is still valid
  const getEntryStatus = () => {
    if (phase === 'active' && postExplosion) {
      const elapsed = countdownData.elapsedSinceExplosion;
      // Entry valid for first 5 minutes with volume confirmation
      if (elapsed < 300 && postExplosion.volumeConfirmed) {
        return { status: 'valid', message: '✅ الدخول متاح الآن!', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500' };
      } else if (elapsed < 300) {
        return { status: 'waiting', message: '⏳ انتظر تأكيد الحجم', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500' };
      } else if (elapsed < 600 && postExplosion.breakoutConfirmed) {
        return { status: 'late', message: '⚠️ متأخر لكن ممكن', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500' };
      } else {
        return { status: 'missed', message: '❌ فات الأوان - انتظر الفرصة القادمة', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500' };
      }
    }
    return null;
  };

  const entryStatus = getEntryStatus();

  // No active state
  if (phase === 'none' || phase === 'ended') {
    const bw = realTimeMetrics?.bollingerWidth ?? 0;
    const vi = realTimeMetrics?.volatilityIndex ?? 0;
    const pr = realTimeMetrics?.priceRangePercent ?? 0;
    const acc = accumulation?.strength ?? 0;
    
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-600/50">
        <CardContent className="p-5 text-center">
          <div className="flex items-center justify-center gap-3 text-slate-400 mb-4">
            {phase === 'ended' ? (
              <>
                <div className="p-2 rounded-full bg-slate-700/50">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">انتهى الانفجار السابق - انتظر تجميع جديد</span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-slate-700/50">
                  <Timer className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">لا يوجد ضغط سعري نشط لـ {symbol} حالياً</span>
              </>
            )}
          </div>
          
          {/* Post-explosion summary if available */}
          {phase === 'ended' && postExplosion && (
            <div className="mt-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-xl p-4 border border-slate-600/50">
              <div className="text-xs text-slate-400 mb-3 font-medium">📊 نتيجة الانفجار السابق</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${postExplosion.breakoutConfirmed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {postExplosion.breakoutConfirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={postExplosion.breakoutConfirmed ? 'text-green-300' : 'text-red-300'}>
                    {postExplosion.breakoutConfirmed ? 'اختراق ناجح' : 'لم يحدث اختراق'}
                  </span>
                </div>
                <div className={`p-2 rounded-lg text-center ${postExplosion.priceMovedPercent > 0 ? 'bg-green-500/10 text-green-400' : postExplosion.priceMovedPercent < 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-600/30 text-slate-400'}`}>
                  تحرك السعر: {postExplosion.priceMovedPercent > 0 ? '+' : ''}{postExplosion.priceMovedPercent}%
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-slate-500 mb-1">عرض بولينجر</div>
              <div className="text-slate-200 font-bold text-sm">{Number(bw).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-slate-500 mb-1">نطاق السعر</div>
              <div className="text-slate-200 font-bold text-sm">{Number(pr).toFixed(2)}%</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-slate-500 mb-1">مؤشر التذبذب</div>
              <div className="text-slate-200 font-bold text-sm">{Number(vi).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-slate-500 mb-1">مؤشر التجميع</div>
              <div className="text-slate-200 font-bold text-sm">{Number(acc).toFixed(0)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = phase === 'active';
  const direction = (explosionTimer?.direction ?? accumulation?.expectedDirection ?? 'unknown') as 'up' | 'down' | 'unknown';

  // Dynamic phase colors with gradients
  const getPhaseStyle = () => {
    if (isActive) {
      return {
        cardBg: 'bg-gradient-to-br from-green-900/90 via-emerald-900/80 to-green-800/90',
        border: 'border-green-500/70',
        glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]',
        headerBg: 'bg-gradient-to-r from-green-600/30 to-emerald-600/30',
        accentColor: 'text-green-400',
      };
    }
    
    switch (countdownData.urgency) {
      case 'critical':
        return {
          cardBg: 'bg-gradient-to-br from-red-900/90 via-orange-900/80 to-red-800/90',
          border: 'border-red-500/70',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse',
          headerBg: 'bg-gradient-to-r from-red-600/30 to-orange-600/30',
          accentColor: 'text-red-400',
        };
      case 'high':
        return {
          cardBg: 'bg-gradient-to-br from-orange-900/90 via-amber-900/80 to-orange-800/90',
          border: 'border-orange-500/70',
          glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
          headerBg: 'bg-gradient-to-r from-orange-600/30 to-amber-600/30',
          accentColor: 'text-orange-400',
        };
      case 'medium':
        return {
          cardBg: 'bg-gradient-to-br from-yellow-900/90 via-amber-900/80 to-yellow-800/90',
          border: 'border-yellow-500/70',
          glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]',
          headerBg: 'bg-gradient-to-r from-yellow-600/30 to-amber-600/30',
          accentColor: 'text-yellow-400',
        };
      default:
        return {
          cardBg: 'bg-gradient-to-br from-slate-800/90 via-slate-700/80 to-slate-800/90',
          border: 'border-slate-600/70',
          glow: '',
          headerBg: 'bg-gradient-to-r from-slate-600/30 to-slate-500/30',
          accentColor: 'text-slate-300',
        };
    }
  };

  const style = getPhaseStyle();

  return (
    <Card className={`${style.cardBg} ${style.border} border-2 ${style.glow} transition-all duration-500`}>
      <CardHeader className={`pb-3 border-b border-white/10 ${style.headerBg} rounded-t-lg`}>
        <CardTitle className="text-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {isActive ? (
              <div className="p-1.5 rounded-lg bg-green-500/20">
                <Flame className="w-4 h-4 text-green-400 animate-pulse" />
              </div>
            ) : (
              <div className={`p-1.5 rounded-lg ${countdownData.urgency === 'critical' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                <Timer className={`w-4 h-4 ${countdownData.urgency === 'critical' ? 'animate-pulse text-red-400' : 'text-yellow-400'}`} />
              </div>
            )}
            <span className="font-semibold">{isActive ? 'انفجار سعري نشط!' : 'عداد الانفجار السعري'}</span>
            <Badge variant="outline" className="text-[10px] border-white/30 text-white/80 font-medium">
              {symbol}
            </Badge>
          </div>
          <Badge className={`${isActive ? 'bg-green-500/30 text-green-200 border-green-400/50' : countdownData.urgency === 'critical' ? 'bg-red-500/30 text-red-200 border-red-400/50 animate-pulse' : countdownData.urgency === 'high' ? 'bg-orange-500/30 text-orange-200 border-orange-400/50' : 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50'} border font-bold`}>
            {isActive ? '🔥 نشط الآن!' : 
              countdownData.urgency === 'critical' ? '⚡ وشيك!' : 
              countdownData.urgency === 'high' ? '⏰ قريب' : 
              countdownData.urgency === 'medium' ? '⏳ متوسط' : '🕐 بعيد'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Explosion Details Card - NEW */}
        {explosionTimer?.explosionDetails && (phase === 'active' || phase === 'countdown') && (
          <div className={`rounded-xl p-4 border-2 ${
            explosionTimer.explosionDetails.entryWindow === 'optimal' 
              ? 'bg-gradient-to-br from-green-900/70 to-emerald-800/70 border-green-400/70 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
              : explosionTimer.explosionDetails.entryWindow === 'good'
              ? 'bg-gradient-to-br from-blue-900/70 to-cyan-800/70 border-blue-400/70'
              : explosionTimer.explosionDetails.entryWindow === 'late'
              ? 'bg-gradient-to-br from-orange-900/70 to-amber-800/70 border-orange-400/70'
              : 'bg-gradient-to-br from-red-900/70 to-rose-800/70 border-red-400/70'
          }`}>
            {/* Entry Window Status */}
            <div className="text-center mb-4">
              <div className={`text-2xl font-black mb-2 ${
                explosionTimer.explosionDetails.entryWindow === 'optimal' ? 'text-green-300' :
                explosionTimer.explosionDetails.entryWindow === 'good' ? 'text-blue-300' :
                explosionTimer.explosionDetails.entryWindow === 'late' ? 'text-orange-300' :
                'text-red-300'
              }`}>
                {explosionTimer.explosionDetails.entryWindowMessage}
              </div>
              <div className={`text-lg font-bold ${
                explosionTimer.explosionDetails.entryWindow === 'optimal' ? 'text-green-200' :
                explosionTimer.explosionDetails.entryWindow === 'good' ? 'text-blue-200' :
                explosionTimer.explosionDetails.entryWindow === 'late' ? 'text-orange-200' :
                'text-red-200'
              }`}>
                {explosionTimer.explosionDetails.recommendedAction}
              </div>
            </div>
            
            {/* Price Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* سعر الانفجار */}
              <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-white/60 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  سعر الانفجار
                </div>
                <div className="text-xl font-black text-yellow-400">
                  {explosionTimer.explosionDetails.explosionPrice.toLocaleString()}
                </div>
              </div>
              
              {/* السعر الحالي */}
              <div className="bg-black/40 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-white/60 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  السعر الحالي
                </div>
                <div className="text-xl font-black text-white">
                  {explosionTimer.explosionDetails.currentPrice.toLocaleString()}
                </div>
              </div>
              
              {/* حركة السعر منذ الانفجار */}
              <div className={`bg-black/40 rounded-xl p-3 border ${
                explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 
                  ? 'border-green-500/30' 
                  : explosionTimer.explosionDetails.priceMoveSinceExplosionPercent < 0 
                  ? 'border-red-500/30' 
                  : 'border-white/10'
              }`}>
                <div className="text-[10px] text-white/60 mb-1">حركة السعر منذ الانفجار</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 
                    ? 'text-green-400' 
                    : explosionTimer.explosionDetails.priceMoveSinceExplosionPercent < 0 
                    ? 'text-red-400' 
                    : 'text-gray-400'
                }`}>
                  {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : explosionTimer.explosionDetails.priceMoveSinceExplosionPercent < 0 ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : null}
                  {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent > 0 ? '+' : ''}
                  {explosionTimer.explosionDetails.priceMoveSinceExplosionPercent.toFixed(2)}%
                </div>
              </div>
              
              {/* اتجاه الانفجار الفعلي */}
              <div className={`bg-black/40 rounded-xl p-3 border ${
                explosionTimer.explosionDetails.explosionDirection === 'up' 
                  ? 'border-green-500/30' 
                  : explosionTimer.explosionDetails.explosionDirection === 'down' 
                  ? 'border-red-500/30' 
                  : 'border-white/10'
              }`}>
                <div className="text-[10px] text-white/60 mb-1">اتجاه الانفجار الفعلي</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  explosionTimer.explosionDetails.explosionDirection === 'up' 
                    ? 'text-green-400' 
                    : explosionTimer.explosionDetails.explosionDirection === 'down' 
                    ? 'text-red-400' 
                    : 'text-gray-400'
                }`}>
                  {explosionTimer.explosionDetails.explosionDirection === 'up' ? (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      صعود 📈
                    </>
                  ) : explosionTimer.explosionDetails.explosionDirection === 'down' ? (
                    <>
                      <TrendingDown className="w-5 h-5" />
                      هبوط 📉
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      مستقر
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Direction Accuracy */}
            {phase === 'active' && (
              <div className={`mt-3 p-2 rounded-lg text-center ${
                explosionTimer.explosionDetails.isDirectionCorrect 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <span className={`text-sm font-medium ${
                  explosionTimer.explosionDetails.isDirectionCorrect ? 'text-green-300' : 'text-red-300'
                }`}>
                  {explosionTimer.explosionDetails.isDirectionCorrect 
                    ? '✅ التوقع كان صحيحاً!' 
                    : '❌ الاتجاه مختلف عن المتوقع - كن حذراً'}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Main Timer Display */}
        <div className="text-center">
          {isActive ? (
            <div className="space-y-3">
              <div className="text-3xl font-black text-green-300 animate-pulse flex items-center justify-center gap-3">
                <Flame className="w-8 h-8" />
                <span>الانفجار نشط الآن!</span>
                <Flame className="w-8 h-8" />
              </div>
              
              {/* Elapsed time since explosion - BIG DIGITAL DISPLAY */}
              <div className="bg-black/40 rounded-2xl p-4 border border-green-500/30">
                <div className="text-xs text-green-300/70 mb-2 font-medium">⏱️ مضى منذ بداية الانفجار</div>
                <div className="text-5xl font-black text-green-400 tabular-nums tracking-wider">
                  {String(countdownData.elapsedExplosionMinutes).padStart(2, '0')}:{String(countdownData.elapsedExplosionSeconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          ) : countdownData.isPastExplosion ? (
            <div className="space-y-2">
              <div className="text-xs text-yellow-300/70 mb-1">⚠️ تجاوز الوقت المتوقع</div>
              <div className="text-5xl font-black text-yellow-400 tabular-nums tracking-wider">
                +{String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-yellow-200/80">راقب الاختراق - قد يحدث في أي لحظة</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-white/60 mb-1">⏳ الوقت المتبقي للانفجار</div>
              <div className={`text-6xl font-black ${style.accentColor} tabular-nums tracking-wider ${countdownData.urgency === 'critical' ? 'animate-pulse' : ''}`}>
                {String(countdownData.minutes).padStart(2, '0')}:{String(countdownData.seconds).padStart(2, '0')}
              </div>
              {countdownData.urgency === 'critical' && (
                <div className="text-sm text-red-300 animate-pulse font-medium">
                  🚨 استعد للدخول فوراً!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entry Signal Card - Enhanced Design */}
        {entrySignal && (
          <div className={`rounded-xl p-4 border-2 transition-all duration-300 ${
            entrySignal.canEnter 
              ? 'bg-gradient-to-r from-green-900/60 to-emerald-900/60 border-green-500/70 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
              : 'bg-gradient-to-r from-slate-800/60 to-slate-700/60 border-slate-600/70'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${entrySignal.canEnter ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  {entrySignal.canEnter ? (
                    <Target className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <span className={`font-bold text-lg ${entrySignal.canEnter ? 'text-green-300' : 'text-yellow-300'}`}>
                  {entrySignal.canEnter ? '🎯 يمكن الدخول الآن!' : '⏳ انتظر التأكيد'}
                </span>
              </div>
              {entrySignal.canEnter && (
                <Badge className={`text-sm px-3 py-1 font-bold ${
                  entrySignal.direction === 'BUY' ? 'bg-green-500 text-white' : 
                  entrySignal.direction === 'SELL' ? 'bg-red-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {entrySignal.direction === 'BUY' ? '📈 شراء' : 
                   entrySignal.direction === 'SELL' ? '📉 بيع' : 'انتظر'}
                </Badge>
              )}
            </div>
            
            {/* Entry Reasons - Enhanced Pills */}
            <div className="flex flex-wrap gap-2">
              {entrySignal.reasons.map((reason, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${
                    entrySignal.canEnter 
                      ? 'bg-green-500/20 text-green-200 border border-green-500/30' 
                      : 'bg-slate-600/40 text-slate-300 border border-slate-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post-explosion confirmations */}
        {isActive && postExplosion && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border-2 transition-all duration-300 ${
              postExplosion.volumeConfirmed 
                ? 'bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/60' 
                : 'bg-slate-800/50 border-slate-600/50'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <div className={`p-1.5 rounded-full ${postExplosion.volumeConfirmed ? 'bg-green-500/20' : 'bg-slate-600/30'}`}>
                  {postExplosion.volumeConfirmed ? (
                    <Volume2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className={`font-medium ${postExplosion.volumeConfirmed ? 'text-green-300' : 'text-slate-400'}`}>
                  تأكيد الحجم
                </span>
                {postExplosion.volumeConfirmed && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 mr-auto" />
                )}
              </div>
            </div>
            <div className={`rounded-xl p-3 border-2 transition-all duration-300 ${
              postExplosion.breakoutConfirmed 
                ? 'bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/60' 
                : 'bg-slate-800/50 border-slate-600/50'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <div className={`p-1.5 rounded-full ${postExplosion.breakoutConfirmed ? 'bg-green-500/20' : 'bg-slate-600/30'}`}>
                  {postExplosion.breakoutConfirmed ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className={`font-medium ${postExplosion.breakoutConfirmed ? 'text-green-300' : 'text-slate-400'}`}>
                  تأكيد الاختراق
                </span>
                {postExplosion.breakoutConfirmed && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 mr-auto" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid - Enhanced */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-white/50 flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-3 h-3" />
              مدة الضغط
            </div>
            <div className="text-lg font-bold text-white">{countdownData.elapsedMinutes}د</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-white/50 mb-1">عرض بولينجر</div>
            <div className={`text-lg font-bold ${(realTimeMetrics?.bollingerWidth ?? 99) < 1.5 ? 'text-red-400' : 'text-white'}`}>
              {(realTimeMetrics?.bollingerWidth ?? 0).toFixed(2)}%
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/10">
            <div className="text-[10px] text-white/50 mb-1">ثقة الانفجار</div>
            <div className={`text-lg font-bold ${(explosionTimer?.confidence ?? 0) >= 70 ? 'text-green-400' : 'text-yellow-300'}`}>
              {explosionTimer?.confidence ?? 0}%
            </div>
          </div>
        </div>

        {/* Progress Bar - Enhanced */}
        {!isActive && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60 font-medium">
              <span>🔄 بداية الضغط</span>
              <span>💥 الانفجار</span>
            </div>
            <div className="relative">
              <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-500 ${
                    countdownData.urgency === 'critical' 
                      ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-500' 
                      : countdownData.urgency === 'high'
                      ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, countdownData.progress)}%` }}
                />
              </div>
              {countdownData.urgency === 'critical' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400 animate-bounce drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                </div>
              )}
            </div>
            <div className="text-center text-xs text-white/60 font-medium">
              {Math.min(100, countdownData.progress).toFixed(0)}% من دورة الضغط
            </div>
          </div>
        )}

        {/* Expected Direction - Enhanced */}
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70 font-medium">الاتجاه المتوقع</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              direction === 'up' ? 'bg-green-500/20 text-green-400' : 
              direction === 'down' ? 'bg-red-500/20 text-red-400' : 
              'bg-slate-600/30 text-slate-300'
            }`}>
              {direction === 'up' ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">صعود</span>
                </>
              ) : direction === 'down' ? (
                <>
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-bold">هبوط</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span className="font-bold">محايد</span>
                </>
              )}
            </div>
          </div>
          {accumulation?.breakoutProbability !== undefined && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-white/70 font-medium">احتمالية الانفجار</span>
              <span className={`text-lg font-bold ${accumulation.breakoutProbability >= 70 ? 'text-green-400' : 'text-yellow-300'}`}>
                {accumulation.breakoutProbability}%
              </span>
            </div>
          )}
        </div>

        {/* Critical Warning */}
        {!isActive && countdownData.urgency === 'critical' && (
          <div className="bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-xl p-4 flex items-center gap-3 border-2 border-red-500/50 animate-pulse">
            <div className="p-2 rounded-full bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-red-200 font-bold">🚨 انفجار سعري وشيك - استعد للدخول فوراً!</span>
          </div>
        )}

        {/* Indicators */}
        <div className="flex gap-2 flex-wrap justify-center">
          {bollingerSqueeze && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-xs px-3 py-1">
              🔥 ضغط بولينجر نشط
            </Badge>
          )}
          {priceConsolidation && (
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs px-3 py-1">
              📍 تجميع سعري
            </Badge>
          )}
          {volumeSpike && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs px-3 py-1">
              📊 ارتفاع حجم {realTimeMetrics?.volumeChangePercent}%+
            </Badge>
          )}
        </div>

        {/* Debug Info */}
        <div className="text-[10px] text-white/30 text-center pt-2 border-t border-white/5">
          الطريقة: {explosionTimer?.method === 'bollinger_squeeze_history' ? 'تاريخ ضغط بولينجر' : '—'} • الإطار: {timeframe} • المرحلة: {phase}
        </div>
      </CardContent>
    </Card>
  );
};
