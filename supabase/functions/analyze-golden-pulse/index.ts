import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoldenPulseAnalysis {
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: string;
  
  // Trend Analysis (EMA 9, 21, 50)
  trend: {
    direction: 'bullish' | 'bearish' | 'neutral';
    ema9: number;
    ema21: number;
    ema50: number;
    strength: number; // 0-100
  };
  
  // Momentum (RSI 7, Volume)
  momentum: {
    rsi7: number;
    volumeRatio: number; // current vs avg 20
    volumeSpike: boolean;
    momentumSignal: 'buy' | 'sell' | 'neutral';
  };
  
  // Smart Reaction Zones
  reactionZones: {
    previousHigh: number;
    previousLow: number;
    vwap: number;
    nearZone: boolean;
    zoneType: 'support' | 'resistance' | 'vwap' | 'none';
    rejectCandle: boolean;
  };
  
  // Entry Trigger (Candle Analysis)
  candleAnalysis: {
    bodyRatio: number; // body / total range
    validEntry: boolean;
    candleType: 'bullish' | 'bearish' | 'doji';
  };
  
  // Final Signal
  signal: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
    confidence: number; // 0-100
    reasons: string[];
    urgency: 'immediate' | 'soon' | 'wait';
  };
  
  // Exit Conditions
  exitConditions: {
    shouldExit: boolean;
    reason: string | null;
    rsiReversal: boolean;
    oppositeCandle: boolean;
    volumeDrop: boolean;
    hitZone: boolean;
  };
  
  // Risk Management
  riskManagement: {
    canTrade: boolean;
    cooldownRemaining: number; // seconds
    maxDurationReached: boolean;
    newsAlert: boolean;
  };
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Calculate RSI
function calculateRSI(prices: number[], period: number = 7): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate VWAP
function calculateVWAP(candles: any[]): number {
  if (!candles.length) return 0;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 1;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : candles[candles.length - 1]?.close || 0;
}

async function fetchGoldData(): Promise<any> {
  try {
    // Fetch from Yahoo Finance - XAUUSD spot price
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1m&range=1h';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No data from Yahoo Finance');
    }
    
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];
    
    const candles = timestamps.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString(),
      open: quote?.open?.[i] || 0,
      high: quote?.high?.[i] || 0,
      low: quote?.low?.[i] || 0,
      close: quote?.close?.[i] || 0,
      volume: quote?.volume?.[i] || 0,
    })).filter((c: any) => c.close > 0);
    
    const currentPrice = result.meta?.regularMarketPrice || candles[candles.length - 1]?.close || 0;
    const previousClose = result.meta?.previousClose || currentPrice;
    
    return {
      currentPrice,
      previousClose,
      candles,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching gold data:', error);
    throw error;
  }
}

function analyzeGoldPulse(data: any): GoldenPulseAnalysis {
  const { currentPrice, previousClose, candles, timestamp } = data;
  
  // Extract close prices for calculations
  const closePrices = candles.map((c: any) => c.close);
  const last20Candles = candles.slice(-20);
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  // 1. Trend Analysis (EMA 9, 21, 50)
  const ema9 = calculateEMA(closePrices, 9);
  const ema21 = calculateEMA(closePrices, 21);
  const ema50 = calculateEMA(closePrices, 50);
  
  let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let trendStrength = 50;
  
  if (ema9 > ema21 && ema21 > ema50) {
    trendDirection = 'bullish';
    trendStrength = Math.min(100, 60 + ((ema9 - ema50) / ema50) * 1000);
  } else if (ema9 < ema21 && ema21 < ema50) {
    trendDirection = 'bearish';
    trendStrength = Math.min(100, 60 + ((ema50 - ema9) / ema50) * 1000);
  }
  
  // 2. Momentum (RSI 7, Volume)
  const rsi7 = calculateRSI(closePrices, 7);
  const volumes = last20Candles.map((c: any) => c.volume || 1);
  const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length;
  const currentVolume = lastCandle?.volume || 1;
  const volumeRatio = currentVolume / avgVolume;
  const volumeSpike = volumeRatio > 1.5;
  
  let momentumSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
  if (rsi7 >= 55 && rsi7 <= 70 && volumeSpike) {
    momentumSignal = 'buy';
  } else if (rsi7 >= 30 && rsi7 <= 45 && volumeSpike) {
    momentumSignal = 'sell';
  }
  
  // 3. Smart Reaction Zones
  const highs = last20Candles.map((c: any) => c.high);
  const lows = last20Candles.map((c: any) => c.low);
  const previousHigh = Math.max(...highs);
  const previousLow = Math.min(...lows);
  const vwap = calculateVWAP(last20Candles);
  
  const distanceToHigh = Math.abs(currentPrice - previousHigh);
  const distanceToLow = Math.abs(currentPrice - previousLow);
  const distanceToVwap = Math.abs(currentPrice - vwap);
  const priceRange = previousHigh - previousLow;
  const zoneThreshold = priceRange * 0.05; // 5% of range
  
  let zoneType: 'support' | 'resistance' | 'vwap' | 'none' = 'none';
  let nearZone = false;
  
  if (distanceToLow < zoneThreshold) {
    zoneType = 'support';
    nearZone = true;
  } else if (distanceToHigh < zoneThreshold) {
    zoneType = 'resistance';
    nearZone = true;
  } else if (distanceToVwap < zoneThreshold) {
    zoneType = 'vwap';
    nearZone = true;
  }
  
  // Reject Candle Detection
  const rejectCandle = lastCandle && prevCandle && (
    (zoneType === 'support' && lastCandle.close > lastCandle.open && lastCandle.low < prevCandle.low) ||
    (zoneType === 'resistance' && lastCandle.close < lastCandle.open && lastCandle.high > prevCandle.high)
  );
  
  // 4. Candle Analysis (Entry Trigger)
  let bodyRatio = 0;
  let candleType: 'bullish' | 'bearish' | 'doji' = 'doji';
  
  if (lastCandle) {
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const range = lastCandle.high - lastCandle.low;
    bodyRatio = range > 0 ? body / range : 0;
    
    if (lastCandle.close > lastCandle.open) {
      candleType = 'bullish';
    } else if (lastCandle.close < lastCandle.open) {
      candleType = 'bearish';
    }
  }
  
  const validEntry = bodyRatio >= 0.6;
  
  // 5. Generate Final Signal
  let action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT' = 'HOLD';
  let confidence = 0;
  const reasons: string[] = [];
  
  // BUY conditions
  const buyConditions = [
    trendDirection === 'bullish',
    momentumSignal === 'buy' || (rsi7 >= 50 && rsi7 <= 70),
    (zoneType === 'support' && nearZone) || !nearZone,
    candleType === 'bullish' && validEntry
  ];
  
  // SELL conditions
  const sellConditions = [
    trendDirection === 'bearish',
    momentumSignal === 'sell' || (rsi7 >= 30 && rsi7 <= 50),
    (zoneType === 'resistance' && nearZone) || !nearZone,
    candleType === 'bearish' && validEntry
  ];
  
  const buyScore = buyConditions.filter(Boolean).length;
  const sellScore = sellConditions.filter(Boolean).length;
  
  if (buyScore >= 3) {
    action = 'BUY';
    confidence = Math.min(95, 50 + buyScore * 12);
    if (trendDirection === 'bullish') reasons.push('اتجاه صاعد (EMA9 > EMA21 > EMA50)');
    if (rsi7 >= 55 && rsi7 <= 70) reasons.push(`زخم إيجابي (RSI: ${rsi7.toFixed(1)})`);
    if (volumeSpike) reasons.push('ارتفاع الحجم');
    if (zoneType === 'support' && nearZone) reasons.push('ارتداد من دعم');
    if (validEntry && candleType === 'bullish') reasons.push('شمعة صاعدة قوية');
  } else if (sellScore >= 3) {
    action = 'SELL';
    confidence = Math.min(95, 50 + sellScore * 12);
    if (trendDirection === 'bearish') reasons.push('اتجاه هابط (EMA9 < EMA21 < EMA50)');
    if (rsi7 >= 30 && rsi7 <= 45) reasons.push(`زخم سلبي (RSI: ${rsi7.toFixed(1)})`);
    if (volumeSpike) reasons.push('ارتفاع الحجم');
    if (zoneType === 'resistance' && nearZone) reasons.push('ارتداد من مقاومة');
    if (validEntry && candleType === 'bearish') reasons.push('شمعة هابطة قوية');
  } else {
    reasons.push('انتظار تأكيد الإشارة');
  }
  
  // 6. Exit Conditions
  const rsiReversal = (action === 'BUY' && rsi7 < 40) || (action === 'SELL' && rsi7 > 60);
  const oppositeCandle = (action === 'BUY' && candleType === 'bearish' && bodyRatio > 0.7) ||
                         (action === 'SELL' && candleType === 'bullish' && bodyRatio > 0.7);
  const volumeDrop = volumeRatio < 0.5;
  const hitZone = (action === 'BUY' && zoneType === 'resistance' && nearZone) ||
                  (action === 'SELL' && zoneType === 'support' && nearZone);
  
  const shouldExit = rsiReversal || oppositeCandle || volumeDrop || hitZone;
  let exitReason: string | null = null;
  
  if (rsiReversal) exitReason = 'انعكاس RSI';
  else if (oppositeCandle) exitReason = 'شمعة معاكسة قوية';
  else if (volumeDrop) exitReason = 'انخفاض الحجم';
  else if (hitZone) exitReason = 'وصول لمنطقة مقاومة/دعم';
  
  // Price change
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = (priceChange / previousClose) * 100;
  
  return {
    currentPrice,
    previousPrice: previousClose,
    priceChange,
    priceChangePercent,
    timestamp,
    trend: {
      direction: trendDirection,
      ema9,
      ema21,
      ema50,
      strength: trendStrength
    },
    momentum: {
      rsi7,
      volumeRatio,
      volumeSpike,
      momentumSignal
    },
    reactionZones: {
      previousHigh,
      previousLow,
      vwap,
      nearZone,
      zoneType,
      rejectCandle
    },
    candleAnalysis: {
      bodyRatio,
      validEntry,
      candleType
    },
    signal: {
      action,
      confidence,
      reasons,
      urgency: confidence >= 80 ? 'immediate' : confidence >= 60 ? 'soon' : 'wait'
    },
    exitConditions: {
      shouldExit,
      reason: exitReason,
      rsiReversal,
      oppositeCandle,
      volumeDrop,
      hitZone
    },
    riskManagement: {
      canTrade: true,
      cooldownRemaining: 0,
      maxDurationReached: false,
      newsAlert: false
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Golden Pulse analysis requested');
    
    const goldData = await fetchGoldData();
    const analysis = analyzeGoldPulse(goldData);
    
    console.log(`Signal: ${analysis.signal.action} with ${analysis.signal.confidence}% confidence`);
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Golden Pulse analysis error:', error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
