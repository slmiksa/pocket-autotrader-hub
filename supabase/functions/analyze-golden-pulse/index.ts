import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingLevel {
  price: number;
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot' | 'swing_high' | 'swing_low' | 'stop_loss';
  label: string;
  labelAr: string;
  color: string;
  strength: number;
}

interface ChartAnalysis {
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: string;
  timeframe: string;
  candles: CandleData[];
  levels: TradingLevel[];
  dataSource: string;
  isLive: boolean;
  dailyHigh: number;
  dailyLow: number;
}

// Timeframe to Yahoo Finance interval mapping
const yahooIntervalMap: Record<string, { interval: string; range: string }> = {
  '1': { interval: '1m', range: '1d' },
  '5': { interval: '5m', range: '5d' },
  '15': { interval: '15m', range: '5d' },
  '30': { interval: '30m', range: '5d' },
  '60': { interval: '1h', range: '1mo' },
  '240': { interval: '1h', range: '1mo' },
  'D': { interval: '1d', range: '3mo' },
};

// Validate gold price - reasonable range for any gold instrument (spot or futures)
// Range covers 2000-8000 USD to account for futures and future price movements
function isValidGoldPrice(price: number): boolean {
  return typeof price === 'number' && isFinite(price) && price >= 2000 && price <= 8000;
}

// PRIMARY: Fetch gold data from Yahoo Finance (GC=F is gold futures, most reliable)
async function fetchYahooGoldData(timeframe: string): Promise<{ 
  candles: CandleData[]; 
  currentPrice: number; 
  previousClose: number; 
  dailyHigh: number;
  dailyLow: number;
} | null> {
  const config = yahooIntervalMap[timeframe] || yahooIntervalMap['5'];
  
  // GC=F is Gold Futures - the most reliable gold data from Yahoo Finance
  const symbol = 'GC=F';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${config.interval}&range=${config.range}&includePrePost=false`;
  
  console.log(`Yahoo Finance: Fetching ${symbol}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`Yahoo Finance: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      console.log('Yahoo Finance: No result data');
      return null;
    }
    
    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    const meta = result.meta;
    
    if (!timestamps || !quote || !meta) {
      console.log('Yahoo Finance: Missing data fields');
      return null;
    }
    
    const candles: CandleData[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i] || 0;
      
      // Skip invalid candles
      if (!isValidGoldPrice(close) || !isValidGoldPrice(open)) continue;
      
      candles.push({
        time: timestamps[i],
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume,
      });
    }
    
    if (candles.length < 20) {
      console.log(`Yahoo Finance: Not enough valid candles (${candles.length})`);
      return null;
    }
    
    const currentPrice = meta.regularMarketPrice || candles[candles.length - 1].close;
    const previousClose = meta.previousClose || meta.chartPreviousClose || candles[0].open;
    const dailyHigh = meta.regularMarketDayHigh || Math.max(...candles.slice(-20).map(c => c.high));
    const dailyLow = meta.regularMarketDayLow || Math.min(...candles.slice(-20).map(c => c.low));
    
    console.log(`Yahoo Finance SUCCESS: ${candles.length} candles, price: $${currentPrice.toFixed(2)}`);
    
    return {
      candles,
      currentPrice,
      previousClose,
      dailyHigh,
      dailyLow,
    };
  } catch (error) {
    console.log('Yahoo Finance error:', error);
    return null;
  }
}

// Calculate Standard Pivot Points
function calculateDailyPivots(high: number, low: number, close: number): {
  pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number;
} {
  const pivot = (high + low + close) / 3;
  const range = high - low;
  
  return {
    pivot,
    r1: 2 * pivot - low,
    r2: pivot + range,
    r3: high + 2 * (pivot - low),
    s1: 2 * pivot - high,
    s2: pivot - range,
    s3: low - 2 * (high - pivot),
  };
}

// Detect Swing Highs and Lows
function detectSwingPoints(candles: CandleData[], lookback: number = 5): { swingHighs: number[]; swingLows: number[] } {
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    let isSwingHigh = true;
    let isSwingLow = true;
    
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].high >= current.high) isSwingHigh = false;
      if (candles[j].low <= current.low) isSwingLow = false;
    }
    
    if (isSwingHigh) swingHighs.push(current.high);
    if (isSwingLow) swingLows.push(current.low);
  }
  
  return { swingHighs, swingLows };
}

// Calculate ATR
function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length < period + 1) return 15; // Default ATR for gold
  
  let atrSum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    atrSum += tr;
  }
  
  return atrSum / period;
}

// Calculate trading levels - professional and stable
function calculateTradingLevels(
  candles: CandleData[], 
  currentPrice: number,
  dailyHigh: number,
  dailyLow: number
): TradingLevel[] {
  const levels: TradingLevel[] = [];
  
  const previousClose = candles.length > 1 ? candles[candles.length - 2].close : currentPrice;
  const pivots = calculateDailyPivots(dailyHigh, dailyLow, previousClose);
  const atr = calculateATR(candles);
  
  const { swingHighs, swingLows } = detectSwingPoints(candles, 5);
  const recentSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1] : dailyHigh;
  const recentSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1] : dailyLow;
  
  // ═══════════════════════════════════════════════════════
  // SELL/PUT ZONE
  // ═══════════════════════════════════════════════════════
  
  const stopLossPut = pivots.r2 + atr * 0.5;
  levels.push({
    price: stopLossPut, type: 'stop_loss', label: `STOP PUT`,
    labelAr: `ستوب بيع ${stopLossPut.toFixed(2)}`, color: '#DC2626', strength: 100,
  });
  
  levels.push({
    price: pivots.r2, type: 'resistance', label: `R2`,
    labelAr: `مقاومة 2 - ${pivots.r2.toFixed(2)}`, color: '#F97316', strength: 92,
  });
  
  const target2Call = pivots.r1 + atr * 0.5;
  levels.push({
    price: target2Call, type: 'target_up', label: `T2 CALL`,
    labelAr: `هدف 2 شراء ${target2Call.toFixed(2)}`, color: '#10B981', strength: 70,
  });
  
  if (Math.abs(recentSwingHigh - pivots.r1) > atr * 0.3) {
    levels.push({
      price: recentSwingHigh, type: 'swing_high', label: `SWING HIGH`,
      labelAr: `قمة ${recentSwingHigh.toFixed(2)}`, color: '#F472B6', strength: 85,
    });
  }
  
  const putEntry = pivots.r1;
  levels.push({
    price: putEntry, type: 'put_entry', label: `SELL ENTRY`,
    labelAr: `دخول بيع ${putEntry.toFixed(2)}`, color: '#EF4444', strength: 98,
  });
  
  levels.push({
    price: pivots.r1, type: 'resistance', label: `R1`,
    labelAr: `مقاومة 1 - ${pivots.r1.toFixed(2)}`, color: '#FBBF24', strength: 88,
  });
  
  const target1Call = pivots.pivot + atr * 0.8;
  levels.push({
    price: target1Call, type: 'target_up', label: `T1 CALL`,
    labelAr: `هدف 1 شراء ${target1Call.toFixed(2)}`, color: '#34D399', strength: 75,
  });
  
  // ═══════════════════════════════════════════════════════
  // NEUTRAL ZONE
  // ═══════════════════════════════════════════════════════
  
  levels.push({
    price: pivots.pivot, type: 'pivot', label: `PIVOT`,
    labelAr: `المحور ${pivots.pivot.toFixed(2)}`, color: '#A855F7', strength: 82,
  });
  
  // ═══════════════════════════════════════════════════════
  // BUY/CALL ZONE
  // ═══════════════════════════════════════════════════════
  
  const target1Put = pivots.pivot - atr * 0.8;
  levels.push({
    price: target1Put, type: 'target_down', label: `T1 PUT`,
    labelAr: `هدف 1 بيع ${target1Put.toFixed(2)}`, color: '#F87171', strength: 75,
  });
  
  levels.push({
    price: pivots.s1, type: 'support', label: `S1`,
    labelAr: `دعم 1 - ${pivots.s1.toFixed(2)}`, color: '#22C55E', strength: 88,
  });
  
  const callEntry = pivots.s1;
  levels.push({
    price: callEntry, type: 'call_entry', label: `BUY ENTRY`,
    labelAr: `دخول شراء ${callEntry.toFixed(2)}`, color: '#16A34A', strength: 98,
  });
  
  if (Math.abs(recentSwingLow - pivots.s1) > atr * 0.3) {
    levels.push({
      price: recentSwingLow, type: 'swing_low', label: `SWING LOW`,
      labelAr: `قاع ${recentSwingLow.toFixed(2)}`, color: '#4ADE80', strength: 85,
    });
  }
  
  const target2Put = pivots.s1 - atr * 0.5;
  levels.push({
    price: target2Put, type: 'target_down', label: `T2 PUT`,
    labelAr: `هدف 2 بيع ${target2Put.toFixed(2)}`, color: '#EF4444', strength: 70,
  });
  
  levels.push({
    price: pivots.s2, type: 'support', label: `S2`,
    labelAr: `دعم 2 - ${pivots.s2.toFixed(2)}`, color: '#10B981', strength: 92,
  });
  
  const stopLossCall = pivots.s2 - atr * 0.5;
  levels.push({
    price: stopLossCall, type: 'stop_loss', label: `STOP CALL`,
    labelAr: `ستوب شراء ${stopLossCall.toFixed(2)}`, color: '#DC2626', strength: 100,
  });
  
  levels.sort((a, b) => b.price - a.price);
  
  return levels;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '5';
    
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`Golden Pulse Analysis - Timeframe: ${timeframe}`);
    console.log(`═══════════════════════════════════════════════════`);
    
    // Fetch gold data from Yahoo Finance
    const goldData = await fetchYahooGoldData(timeframe);
    
    if (!goldData) {
      console.error('Failed to fetch gold data');
      return new Response(
        JSON.stringify({ 
          error: 'Unable to fetch gold data. Markets may be closed.',
          errorAr: 'تعذر جلب بيانات الذهب. قد تكون الأسواق مغلقة.',
          timestamp: new Date().toISOString(),
          isLive: false,
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const levels = calculateTradingLevels(
      goldData.candles, 
      goldData.currentPrice,
      goldData.dailyHigh,
      goldData.dailyLow
    );
    
    const analysis: ChartAnalysis = {
      currentPrice: goldData.currentPrice,
      previousClose: goldData.previousClose,
      priceChange: goldData.currentPrice - goldData.previousClose,
      priceChangePercent: ((goldData.currentPrice - goldData.previousClose) / goldData.previousClose) * 100,
      timestamp: new Date().toISOString(),
      timeframe,
      candles: goldData.candles,
      levels,
      dataSource: 'yahoo-finance-gold',
      isLive: true,
      dailyHigh: goldData.dailyHigh,
      dailyLow: goldData.dailyLow,
    };
    
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`SUCCESS: $${goldData.currentPrice.toFixed(2)} | ${levels.length} levels`);
    console.log(`═══════════════════════════════════════════════════`);
    
    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Golden Pulse error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorAr: 'خطأ في تحليل بيانات الذهب',
        timestamp: new Date().toISOString(),
        isLive: false,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
