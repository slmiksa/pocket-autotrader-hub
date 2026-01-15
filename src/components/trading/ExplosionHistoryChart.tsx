import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Zap, Target, TrendingUp, TrendingDown, Activity } from 'lucide-react';

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

interface ExplosionHistoryChartProps {
  symbol: string;
  accumulation?: AccumulationData;
  bollingerWidth?: number;
  realTimeMetrics?: RealTimeMetrics;
  currentPrice?: number;
  priceChange?: number;
  signalType?: 'BUY' | 'SELL' | 'WAIT';
}

interface PriceDataPoint {
  time: string;
  price: number;
  volume: number;
  movement: number;
}

export const ExplosionHistoryChart = ({ 
  symbol, 
  accumulation, 
  bollingerWidth,
  realTimeMetrics,
  currentPrice,
  priceChange,
  signalType
}: ExplosionHistoryChartProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  
  // Track real price movements over time (derive *live* movement from consecutive prices)
  useEffect(() => {
    if (!currentPrice) return;

    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    setPriceHistory((prev) => {
      const prevPoint = prev[prev.length - 1];
      const movement = prevPoint?.price
        ? ((currentPrice - prevPoint.price) / prevPoint.price) * 100
        : (priceChange ?? 0);

      const newPoint: PriceDataPoint = {
        time: timeLabel,
        price: currentPrice,
        volume: realTimeMetrics?.currentVolume || 0,
        movement,
      };

      // Keep last 20 data points for real-time tracking
      return [...prev, newPoint].slice(-20);
    });
  }, [currentPrice, realTimeMetrics?.currentVolume, priceChange]);

  // Calculate real statistics from actual data
  const stats = useMemo(() => {
    if (priceHistory.length < 2) {
      return {
        avgMovement: 0,
        avgVolume: realTimeMetrics?.avgVolume24h || 0,
        upMoves: 0,
        downMoves: 0,
        volatility: realTimeMetrics?.volatilityIndex || 0
      };
    }

    let upMoves = 0;
    let downMoves = 0;
    let totalMovement = 0;

    for (let i = 1; i < priceHistory.length; i++) {
      const priceDiff = priceHistory[i].price - priceHistory[i - 1].price;
      if (priceDiff > 0) upMoves++;
      else if (priceDiff < 0) downMoves++;
      totalMovement += Math.abs(priceHistory[i].movement);
    }

    return {
      avgMovement: totalMovement / (priceHistory.length - 1),
      avgVolume: realTimeMetrics?.avgVolume24h || 0,
      upMoves,
      downMoves,
      volatility: realTimeMetrics?.volatilityIndex || 0
    };
  }, [priceHistory, realTimeMetrics]);

  // Chart data from real price history
  const chartData = useMemo(() => {
    if (priceHistory.length < 2) {
      // Show placeholder with current data
      return [{
        time: 'الآن',
        movement: priceChange || 0,
        volume: realTimeMetrics?.currentVolume || 0
      }];
    }

    return priceHistory.map((point, index) => ({
      time: point.time,
      movement: point.movement,
      volume: point.volume,
      isPositive: index > 0 ? point.price > priceHistory[index - 1].price : true
    }));
  }, [priceHistory, priceChange, realTimeMetrics]);

  // Format volume for display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toFixed(0);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardHeader className="pb-2 border-b border-slate-700">
        <CardTitle className="text-sm flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>تحليل الحركة السعرية الفورية</span>
            <Badge variant="outline" className="text-[10px] border-cyan-500/50 text-cyan-400">
              {symbol}
            </Badge>
          </div>
          {accumulation?.detected && (
            <Badge className={`${accumulation.breakoutProbability >= 70 ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'} border-0 animate-pulse`}>
              احتمال الانفجار: {accumulation.breakoutProbability}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Real-Time Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-800/80 rounded-lg p-2 text-center border border-slate-600">
            <div className="text-[9px] text-slate-400">الحجم الحالي</div>
            <div className="text-sm font-bold text-cyan-400">
              {formatVolume(realTimeMetrics?.currentVolume || 0)}
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2 text-center border border-slate-600">
            <div className="text-[9px] text-slate-400">تغير الحجم</div>
            <div className={`text-sm font-bold ${(realTimeMetrics?.volumeChangePercent || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(realTimeMetrics?.volumeChangePercent || 0) > 0 ? '+' : ''}{Number(realTimeMetrics?.volumeChangePercent || 0).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2 text-center border border-slate-600">
            <div className="text-[9px] text-slate-400">صعود</div>
            <div className="text-sm font-bold text-green-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.upMoves}
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2 text-center border border-slate-600">
            <div className="text-[9px] text-slate-400">هبوط</div>
            <div className="text-sm font-bold text-red-400 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {stats.downMoves}
            </div>
          </div>
        </div>

        {/* Real-Time Chart */}
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => `${value.toFixed(2)}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '11px'
                }}
                formatter={(value: number) => [`${Number(value).toFixed(2)}%`, 'الحركة']}
                labelFormatter={(label) => `الوقت: ${label}`}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="movement" 
                stroke={priceChange && priceChange >= 0 ? "#22c55e" : "#ef4444"}
                fill={priceChange && priceChange >= 0 ? "url(#positiveGradient)" : "url(#negativeGradient)"}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Current Compression Status - Real Data */}
        {accumulation?.detected && (
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-3 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-yellow-300">حالة الضغط الحالية - بيانات فورية</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[9px] text-yellow-400/70">قوة التجميع</div>
                <div className="text-sm font-bold text-yellow-300">{accumulation.strength}%</div>
              </div>
              <div>
                <div className="text-[9px] text-yellow-400/70">نطاق السعر</div>
                <div className="text-sm font-bold text-yellow-300">{accumulation.priceRange.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[9px] text-yellow-400/70">نسبة الحجم</div>
                <div className="text-sm font-bold text-yellow-300">{accumulation.volumeRatio.toFixed(1)}x</div>
              </div>
              <div>
                <div className="text-[9px] text-yellow-400/70">بولينجر</div>
                <div className="text-sm font-bold text-yellow-300">{(bollingerWidth || 0).toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Expected Direction Indicator */}
        {accumulation?.detected && accumulation.expectedDirection !== 'unknown' && (
          <div className={`rounded-lg p-2 flex items-center justify-between border ${
            accumulation.expectedDirection === 'up' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70">الاتجاه المتوقع للانفجار</span>
            </div>
            <div className={`flex items-center gap-1 font-bold ${
              accumulation.expectedDirection === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {accumulation.expectedDirection === 'up' ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">صعود</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">هبوط</span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
