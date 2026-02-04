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
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down';
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
}

// Timeframe configuration
const timeframeMap: Record<string, { resolution: string; periodMinutes: number; lookback: number }> = {
  '1': { resolution: '1', periodMinutes: 60 * 4, lookback: 20 },
  '5': { resolution: '5', periodMinutes: 60 * 12, lookback: 30 },
  '15': { resolution: '15', periodMinutes: 60 * 24, lookback: 40 },
  '30': { resolution: '30', periodMinutes: 60 * 48, lookback: 50 },
  '60': { resolution: '60', periodMinutes: 60 * 72, lookback: 60 },
  '240': { resolution: '240', periodMinutes: 60 * 168, lookback: 50 },
  'D': { resolution: 'D', periodMinutes: 60 * 24 * 90, lookback: 30 },
};

async function fetchGoldCandles(timeframe: string): Promise<{ candles: CandleData[]; currentPrice: number; previousClose: number; dataSource: string; isLive: boolean }> {
  const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
  const isPlausibleGoldPrice = (p: unknown) => typeof p === 'number' && isFinite(p) && p > 1000 && p < 5000;
  
  const tfConfig = timeframeMap[timeframe] || timeframeMap['1'];
  const now = Math.floor(Date.now() / 1000);
  const from = now - tfConfig.periodMinutes * 60;

  // Source 1: Finnhub
  if (FINNHUB_API_KEY) {
    try {
      const symbolsToTry = ['OANDA:XAU_USD', 'FX_IDC:XAUUSD'];

      for (const symbol of symbolsToTry) {
        const candlesUrl = `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(symbol)}&resolution=${tfConfig.resolution}&from=${from}&to=${now}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
        const candlesRes = await fetch(candlesUrl, { headers: { 'Accept': 'application/json' } });
        const candlesJson = await candlesRes.json().catch(() => null);

        if (candlesRes.ok && candlesJson?.s === 'ok' && Array.isArray(candlesJson?.c) && candlesJson.c.length >= 30) {
          const candles: CandleData[] = candlesJson.t.map((ts: number, i: number) => ({
            time: ts,
            open: candlesJson.o[i],
            high: candlesJson.h[i],
            low: candlesJson.l[i],
            close: candlesJson.c[i],
            volume: candlesJson.v?.[i] ?? 0,
          })).filter((c: CandleData) => isPlausibleGoldPrice(c.close));

          if (candles.length >= 30) {
            let currentPrice = candles[candles.length - 1].close;
            let previousClose = candles[0].open;
            
            // Get real-time quote
            try {
              const quoteUrl = `https://finnhub.io/api/v1/forex/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
              const quoteRes = await fetch(quoteUrl, { headers: { 'Accept': 'application/json' } });
              const quoteJson = await quoteRes.json().catch(() => null);
              if (quoteRes.ok && quoteJson) {
                if (isPlausibleGoldPrice(quoteJson.c)) currentPrice = quoteJson.c;
                if (isPlausibleGoldPrice(quoteJson.pc)) previousClose = quoteJson.pc;
              }
            } catch (e) {
              console.log('Quote error:', e);
            }

            // Update last candle with current price
            const last = candles[candles.length - 1];
            candles[candles.length - 1] = {
              ...last,
              close: currentPrice,
              high: Math.max(last.high, currentPrice),
              low: Math.min(last.low, currentPrice),
            };

            return {
              candles,
              currentPrice,
              previousClose,
              dataSource: `finnhub:${symbol}`,
              isLive: true,
            };
          }
        }
      }
    } catch (e) {
      console.log('Finnhub error:', e);
    }
  }

  // Source 2: Metals.live
  try {
    const response = await fetch('https://api.metals.live/v1/spot/gold', {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      const candidate = data?.[0]?.price ?? data?.[0] ?? null;
      const price = typeof candidate === 'number' ? candidate : Number(candidate);
      
      if (isPlausibleGoldPrice(price)) {
        const candles = generateCandlesFromPrice(price, timeframe);
        return {
          candles,
          currentPrice: price,
          previousClose: candles[0].open,
          dataSource: 'metals.live',
          isLive: true,
        };
      }
    }
  } catch (e) {
    console.log('Metals.live error:', e);
  }

  // Fallback: Simulated
  const simData = generateSimulatedCandles(timeframe);
  return {
    ...simData,
    dataSource: 'simulated',
    isLive: false,
  };
}

function generateCandlesFromPrice(currentPrice: number, timeframe: string): CandleData[] {
  const candles: CandleData[] = [];
  const tfMinutes = parseInt(timeframe) || 1;
  const candleCount = 100;
  const volatility = 0.0004 * Math.sqrt(tfMinutes);
  
  let price = currentPrice * (1 - volatility * 20);
  
  for (let i = 0; i < candleCount; i++) {
    const change = (Math.random() - 0.48) * currentPrice * volatility * 2;
    const open = price;
    price += change;
    
    const range = Math.abs(change) + Math.random() * currentPrice * volatility * 0.5;
    const high = Math.max(open, price) + range * 0.3;
    const low = Math.min(open, price) - range * 0.3;
    let close = price;

    if (i === candleCount - 1) {
      close = currentPrice;
    }

    candles.push({
      time: Math.floor((Date.now() - (candleCount - 1 - i) * tfMinutes * 60000) / 1000),
      open,
      high: Math.max(high, close),
      low: Math.min(low, close),
      close,
      volume: Math.floor(1000 + Math.random() * 5000),
    });
  }

  return candles;
}

function generateSimulatedCandles(timeframe: string): { candles: CandleData[]; currentPrice: number; previousClose: number } {
  const basePrice = 2765;
  const timeVariation = Math.sin(Date.now() / 60000) * 8 + Math.sin(Date.now() / 30000) * 4;
  const currentPrice = basePrice + timeVariation;
  
  const candles = generateCandlesFromPrice(currentPrice, timeframe);
  
  return {
    candles,
    currentPrice,
    previousClose: candles[0].open,
  };
}

function calculatePivotPoints(candles: CandleData[]): { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number } {
  // Use previous period's high, low, close
  const lookbackCandles = candles.slice(-20, -1);
  const highs = lookbackCandles.map(c => c.high);
  const lows = lookbackCandles.map(c => c.low);
  
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const close = candles[candles.length - 2]?.close || candles[candles.length - 1].close;
  
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

function detectSwingLevels(candles: CandleData[]): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  
  for (let i = 3; i < candles.length - 3; i++) {
    const curr = candles[i];
    const neighbors = [
      candles[i - 3], candles[i - 2], candles[i - 1],
      candles[i + 1], candles[i + 2], candles[i + 3]
    ];
    
    // Swing High
    if (neighbors.every(n => curr.high >= n.high)) {
      highs.push(curr.high);
    }
    
    // Swing Low
    if (neighbors.every(n => curr.low <= n.low)) {
      lows.push(curr.low);
    }
  }
  
  return { highs, lows };
}

function calculateTradingLevels(candles: CandleData[], currentPrice: number): TradingLevel[] {
  const levels: TradingLevel[] = [];
  const pivots = calculatePivotPoints(candles);
  const swings = detectSwingLevels(candles);
  
  // Calculate ATR for target distances
  const atr = candles.slice(-14).reduce((sum, c, i, arr) => {
    if (i === 0) return sum;
    const prev = arr[i - 1];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    return sum + tr;
  }, 0) / 13;
  
  // Find nearest resistance (above current price)
  const resistanceCandidates = [
    ...swings.highs.filter(h => h > currentPrice),
    pivots.r1, pivots.r2, pivots.r3
  ].filter(r => r > currentPrice).sort((a, b) => a - b);
  
  // Find nearest support (below current price)  
  const supportCandidates = [
    ...swings.lows.filter(l => l < currentPrice),
    pivots.s1, pivots.s2, pivots.s3
  ].filter(s => s < currentPrice).sort((a, b) => b - a);
  
  const nearestResistance = resistanceCandidates[0] || currentPrice + atr * 1.5;
  const nearestSupport = supportCandidates[0] || currentPrice - atr * 1.5;
  
  // Entry levels (slightly inside S/R)
  const callEntryPrice = nearestSupport + atr * 0.3;
  const putEntryPrice = nearestResistance - atr * 0.3;
  
  // 1. Resistance Level (المقاومة) - Yellow
  levels.push({
    price: nearestResistance,
    type: 'resistance',
    label: `Resistance: ${nearestResistance.toFixed(2)}`,
    labelAr: `المقاومة: ${nearestResistance.toFixed(2)}`,
    color: '#FFEB3B',
    strength: 85,
  });
  
  // 2. Support Level (الدعم) - Yellow
  levels.push({
    price: nearestSupport,
    type: 'support',
    label: `Support: ${nearestSupport.toFixed(2)}`,
    labelAr: `الدعم: ${nearestSupport.toFixed(2)}`,
    color: '#FFEB3B',
    strength: 85,
  });
  
  // 3. Call Entry (دخول كول) - Green
  levels.push({
    price: callEntryPrice,
    type: 'call_entry',
    label: `CALL Entry: ${callEntryPrice.toFixed(2)}`,
    labelAr: `دخول كول: ${callEntryPrice.toFixed(2)}`,
    color: '#4CAF50',
    strength: 90,
  });
  
  // 4. Put Entry (دخول بوت) - Red/Orange
  levels.push({
    price: putEntryPrice,
    type: 'put_entry',
    label: `PUT Entry: ${putEntryPrice.toFixed(2)}`,
    labelAr: `دخول بوت: ${putEntryPrice.toFixed(2)}`,
    color: '#FF5722',
    strength: 90,
  });
  
  // 5. Targets UP (أهداف صعود) - Green
  const targetsUp = [
    nearestResistance + atr * 0.8,
    nearestResistance + atr * 1.5,
    nearestResistance + atr * 2.5,
  ];
  
  targetsUp.forEach((target, i) => {
    levels.push({
      price: target,
      type: 'target_up',
      label: `Target ${i + 1}: ${target.toFixed(2)}`,
      labelAr: `هدف ${i + 1}: ${target.toFixed(2)}`,
      color: '#4CAF50',
      strength: 70 - i * 10,
    });
  });
  
  // 6. Targets DOWN (أهداف هبوط) - Red/Orange
  const targetsDown = [
    nearestSupport - atr * 0.8,
    nearestSupport - atr * 1.5,
    nearestSupport - atr * 2.5,
  ];
  
  targetsDown.forEach((target, i) => {
    levels.push({
      price: target,
      type: 'target_down',
      label: `Target ${i + 1}: ${target.toFixed(2)}`,
      labelAr: `هدف ${i + 1}: ${target.toFixed(2)}`,
      color: '#FF5722',
      strength: 70 - i * 10,
    });
  });
  
  // Sort by price descending
  levels.sort((a, b) => b.price - a.price);
  
  return levels;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '1';
    
    console.log(`Golden Pulse analysis - Timeframe: ${timeframe}`);
    
    const { candles, currentPrice, previousClose, dataSource, isLive } = await fetchGoldCandles(timeframe);
    
    // Calculate trading levels
    const levels = calculateTradingLevels(candles, currentPrice);
    
    const priceChange = currentPrice - previousClose;
    const priceChangePercent = (priceChange / previousClose) * 100;
    
    const analysis: ChartAnalysis = {
      currentPrice,
      previousClose,
      priceChange,
      priceChangePercent,
      timestamp: new Date().toISOString(),
      timeframe,
      candles,
      levels,
      dataSource,
      isLive,
    };
    
    console.log(`Analysis complete: ${candles.length} candles, ${levels.length} levels, source: ${dataSource}`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Golden Pulse error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
