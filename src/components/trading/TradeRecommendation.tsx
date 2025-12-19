import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Clock, Target, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface MarketAnalysis {
  signalType: 'BUY' | 'SELL' | 'WAIT' | 'NONE';
  confidence?: number;
  currentPrice: number;
  trend: string;
  rsi?: number;
  cvdStatus?: string;
  priceAboveEMA?: boolean;
  signalReasons?: string[];
}

interface TradeRecommendationProps {
  analysis: MarketAnalysis | null;
  symbol: string;
  loading?: boolean;
}

export const TradeRecommendation = ({ analysis, symbol, loading }: TradeRecommendationProps) => {
  // Keep last valid analysis to show during loading
  const lastAnalysisRef = useRef<MarketAnalysis | null>(null);
  
  useEffect(() => {
    if (analysis) {
      lastAnalysisRef.current = analysis;
    }
  }, [analysis]);

  const displayAnalysis = analysis || lastAnalysisRef.current;

  // Only show full loading state if we have no data at all
  if (!displayAnalysis) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-600">
        <CardContent className="p-4 text-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-slate-400" />
            <span className="text-slate-400">جاري تحليل السوق...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confidence = displayAnalysis.confidence || 0;
  const signalType = displayAnalysis.signalType;
  const isWait = signalType === 'WAIT' || signalType === 'NONE';
  const isBuy = signalType === 'BUY';

  // Calculate recommendation score
  const getRecommendationScore = () => {
    let score = 0;
    let reasons: string[] = [];

    // Confidence weight (40%)
    if (confidence >= 70) {
      score += 40;
      reasons.push('ثقة عالية في الإشارة');
    } else if (confidence >= 50) {
      score += 25;
      reasons.push('ثقة متوسطة');
    } else {
      score += 10;
      reasons.push('ثقة منخفضة');
    }

    // Trend alignment (20%)
    if ((isBuy && displayAnalysis.trend === 'bullish') || (!isBuy && !isWait && displayAnalysis.trend === 'bearish')) {
      score += 20;
      reasons.push('متوافق مع الاتجاه العام');
    } else if (displayAnalysis.trend === 'sideways') {
      score += 10;
      reasons.push('سوق عرضي');
    }

    // RSI confirmation (15%)
    const rsi = displayAnalysis.rsi || 50;
    if (isBuy && rsi < 35) {
      score += 15;
      reasons.push('RSI في منطقة ذروة البيع');
    } else if (!isBuy && !isWait && rsi > 65) {
      score += 15;
      reasons.push('RSI في منطقة ذروة الشراء');
    } else if (rsi >= 35 && rsi <= 65) {
      score += 8;
    }

    // CVD/Momentum (15%)
    if ((isBuy && displayAnalysis.cvdStatus === 'rising') || (!isBuy && !isWait && displayAnalysis.cvdStatus === 'falling')) {
      score += 15;
      reasons.push('الزخم يدعم الاتجاه');
    } else if (displayAnalysis.cvdStatus === 'stable') {
      score += 7;
    }

    // EMA alignment (10%)
    if ((isBuy && displayAnalysis.priceAboveEMA) || (!isBuy && !isWait && !displayAnalysis.priceAboveEMA)) {
      score += 10;
      reasons.push('موقع جيد من EMA200');
    }

    return { score: Math.min(100, score), reasons };
  };

  const { score, reasons } = getRecommendationScore();

  // Determine recommendation
  const getRecommendation = () => {
    if (isWait) {
      return {
        text: '⏳ انتظر - لا تدخل الآن',
        description: 'الإشارات متضاربة. انتظر تأكيد أوضح قبل الدخول.',
        color: 'bg-amber-600/20 border-amber-400',
        textColor: 'text-amber-300',
        icon: AlertTriangle,
        shouldEnter: false
      };
    }

    if (score >= 75) {
      return {
        text: isBuy ? '✅ ادخل شراء الآن!' : '✅ ادخل بيع الآن!',
        description: `فرصة قوية! ${confidence}% ثقة مع ${reasons.length} تأكيدات متوافقة.`,
        color: 'bg-green-600/30 border-green-400',
        textColor: 'text-green-300',
        icon: CheckCircle,
        shouldEnter: true
      };
    }

    if (score >= 55) {
      return {
        text: isBuy ? '🟡 يمكنك الشراء بحذر' : '🟡 يمكنك البيع بحذر',
        description: 'فرصة متوسطة. استخدم لوت صغير ووقف خسارة قريب.',
        color: 'bg-yellow-600/20 border-yellow-400',
        textColor: 'text-yellow-300',
        icon: Target,
        shouldEnter: true
      };
    }

    return {
      text: '❌ لا تدخل - خطر عالي',
      description: 'التأكيدات غير كافية. انتظر فرصة أفضل.',
      color: 'bg-red-600/20 border-red-400',
      textColor: 'text-red-300',
      icon: XCircle,
      shouldEnter: false
    };
  };

  const recommendation = getRecommendation();
  const Icon = recommendation.icon;

  return (
    <Card className={`${recommendation.color} border-2 shadow-lg relative transition-all duration-300`}>
      {/* Loading indicator overlay */}
      {loading && (
        <div className="absolute top-2 left-2 z-10">
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        {/* Main Recommendation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${recommendation.shouldEnter ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Icon className={`w-6 h-6 ${recommendation.textColor}`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${recommendation.textColor}`}>
                {recommendation.text}
              </h3>
              <p className="text-xs text-slate-400">{symbol}</p>
            </div>
          </div>
          <Badge className={`${recommendation.shouldEnter ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
            نقاط: {score}/100
          </Badge>
        </div>

        {/* Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">قوة التوصية</span>
            <span className={recommendation.textColor}>{score}%</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                score >= 75 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                score >= 55 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300">{recommendation.description}</p>

        {/* Reasons */}
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason, idx) => (
              <span 
                key={idx}
                className="text-[10px] px-2 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        )}

        {/* Entry Details if recommended */}
        {recommendation.shouldEnter && !isWait && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-600">
            <div className="text-center">
              <div className="text-[10px] text-cyan-400">الدخول</div>
              <div className="font-bold text-white text-sm">
                {displayAnalysis.currentPrice.toFixed(displayAnalysis.currentPrice > 100 ? 2 : 4)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-green-400">الهدف</div>
              <div className="font-bold text-green-300 text-sm">
                {(isBuy 
                  ? displayAnalysis.currentPrice * 1.01 
                  : displayAnalysis.currentPrice * 0.99
                ).toFixed(displayAnalysis.currentPrice > 100 ? 2 : 4)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-red-400">الوقف</div>
              <div className="font-bold text-red-300 text-sm">
                {(isBuy 
                  ? displayAnalysis.currentPrice * 0.995 
                  : displayAnalysis.currentPrice * 1.005
                ).toFixed(displayAnalysis.currentPrice > 100 ? 2 : 4)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
