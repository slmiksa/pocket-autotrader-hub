import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketAnalysis {
  symbol: string;
  currentPrice: number;
  ema200: number;
  vwap: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  shortTermTrend: 'bullish' | 'bearish' | 'neutral';
  priceAboveEMA: boolean;
  nearVWAP: boolean;
  cvdStatus: 'rising' | 'falling' | 'flat';
  isValidSetup: boolean;
  signalType: 'BUY' | 'SELL' | 'NONE';
  priceChange: number;
  timestamp: string;
  dataSource: string;
}

// Fetch price from Binance API with retry
async function fetchBinancePrice(symbol: string, retries = 3): Promise<number | null> {
  const binanceSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : symbol.replace('/', '');
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add delay between retries to avoid rate limiting
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.price);
      }
      
      // If rate limited, wait longer
      if (response.status === 429) {
        console.log('Rate limited, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      console.error(`Binance API error: ${response.status}`);
    } catch (error) {
      console.error(`Binance fetch error (attempt ${attempt + 1}):`, error);
    }
  }
  
  // Fallback: try CoinGecko for crypto
  if (symbol === 'BTCUSDT' || symbol === 'ETHUSDT') {
    try {
      const id = symbol === 'BTCUSDT' ? 'bitcoin' : 'ethereum';
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      if (response.ok) {
        const data = await response.json();
        return data[id]?.usd || null;
      }
    } catch (error) {
      console.error('CoinGecko fallback error:', error);
    }
  }
  
  return null;
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

// Calculate VWAP (simplified - using typical price average)
function calculateVWAP(klines: any[]): number {
  if (klines.length === 0) return 0;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const k of klines) {
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const volume = parseFloat(k[5]);
    
    const typicalPrice = (high + low + close) / 3;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
}

// Analyze short-term trend based on recent candles
function analyzeShortTermTrend(klines: any[]): { trend: 'bullish' | 'bearish' | 'neutral'; priceChange: number } {
  if (klines.length < 10) return { trend: 'neutral', priceChange: 0 };
  
  // Look at last 10 candles for short-term trend
  const recentKlines = klines.slice(-10);
  const firstClose = parseFloat(recentKlines[0][4]);
  const lastClose = parseFloat(recentKlines[recentKlines.length - 1][4]);
  
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  // Count bullish vs bearish candles
  let bullishCandles = 0;
  let bearishCandles = 0;
  
  for (const k of recentKlines) {
    const open = parseFloat(k[1]);
    const close = parseFloat(k[4]);
    if (close > open) bullishCandles++;
    else if (close < open) bearishCandles++;
  }
  
  // Also check if making higher highs and higher lows (bullish) or lower highs and lower lows (bearish)
  const highs = recentKlines.map(k => parseFloat(k[2]));
  const lows = recentKlines.map(k => parseFloat(k[3]));
  
  let higherHighs = 0;
  let lowerLows = 0;
  
  for (let i = 1; i < highs.length; i++) {
    if (highs[i] > highs[i - 1]) higherHighs++;
    if (lows[i] < lows[i - 1]) lowerLows++;
  }
  
  // Combine signals for trend determination
  const bullishScore = bullishCandles + higherHighs + (priceChange > 0.1 ? 2 : 0);
  const bearishScore = bearishCandles + lowerLows + (priceChange < -0.1 ? 2 : 0);
  
  if (bullishScore > bearishScore + 2) return { trend: 'bullish', priceChange };
  if (bearishScore > bullishScore + 2) return { trend: 'bearish', priceChange };
  return { trend: 'neutral', priceChange };
}

// Analyze CVD trend using volume and price action
function analyzeCVD(klines: any[]): 'rising' | 'falling' | 'flat' {
  if (klines.length < 20) return 'flat';
  
  const recentKlines = klines.slice(-20);
  
  // Simulate CVD by looking at buy/sell pressure
  let buyPressure = 0;
  let sellPressure = 0;
  
  for (const k of recentKlines) {
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const volume = parseFloat(k[5]);
    
    // Calculate buy/sell pressure based on candle structure
    const range = high - low;
    if (range > 0) {
      const buyVolume = ((close - low) / range) * volume;
      const sellVolume = ((high - close) / range) * volume;
      buyPressure += buyVolume;
      sellPressure += sellVolume;
    }
  }
  
  // Compare recent CVD (last 10) vs older (first 10)
  const recent10 = recentKlines.slice(-10);
  const older10 = recentKlines.slice(0, 10);
  
  let recentBuy = 0, recentSell = 0, olderBuy = 0, olderSell = 0;
  
  for (const k of recent10) {
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const volume = parseFloat(k[5]);
    const range = high - low;
    if (range > 0) {
      recentBuy += ((close - low) / range) * volume;
      recentSell += ((high - close) / range) * volume;
    }
  }
  
  for (const k of older10) {
    const open = parseFloat(k[1]);
    const high = parseFloat(k[2]);
    const low = parseFloat(k[3]);
    const close = parseFloat(k[4]);
    const volume = parseFloat(k[5]);
    const range = high - low;
    if (range > 0) {
      olderBuy += ((close - low) / range) * volume;
      olderSell += ((high - close) / range) * volume;
    }
  }
  
  const recentDelta = recentBuy - recentSell;
  const olderDelta = olderBuy - olderSell;
  
  if (recentDelta > olderDelta * 1.1) return 'rising';
  if (recentDelta < olderDelta * 0.9) return 'falling';
  return 'flat';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAUUSD', timeframe = '15m' } = await req.json();
    
    console.log(`Analyzing ${symbol} on ${timeframe} timeframe`);

    // Fetch current price
    const currentPrice = await fetchBinancePrice(symbol);
    if (!currentPrice) {
      throw new Error('Could not fetch current price');
    }

    // Fetch historical data
    const binanceSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : symbol.replace('/', '');
    const klinesResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${timeframe}&limit=250`
    );
    
    let klines: any[] = [];
    if (klinesResponse.ok) {
      klines = await klinesResponse.json();
    }

    const closePrices = klines.map((k: any[]) => parseFloat(k[4]));

    // Calculate indicators
    const ema200 = calculateEMA(closePrices, 200);
    const vwap = calculateVWAP(klines.slice(-50)); // Last 50 candles for daily VWAP approximation
    const cvdStatus = analyzeCVD(klines);
    
    // Analyze short-term trend (THIS IS THE KEY FIX)
    const shortTermAnalysis = analyzeShortTermTrend(klines);

    // Determine EMA-based trend (long-term structure)
    const priceAboveEMA = currentPrice > ema200;
    
    // Use SHORT-TERM trend for signal generation (more responsive)
    const trend = shortTermAnalysis.trend;

    // Check if price is near VWAP (within 0.5%)
    const vwapDistance = Math.abs((currentPrice - vwap) / vwap) * 100;
    const nearVWAP = vwapDistance <= 0.5;

    // Determine if setup is valid - now using short-term trend
    let isValidSetup = false;
    let signalType: 'BUY' | 'SELL' | 'NONE' = 'NONE';

    // BUY: Short-term bullish, near VWAP, CVD rising or flat
    if (trend === 'bullish' && nearVWAP && (cvdStatus === 'rising' || cvdStatus === 'flat')) {
      isValidSetup = true;
      signalType = 'BUY';
    } 
    // SELL: Short-term bearish, near VWAP, CVD falling or flat
    else if (trend === 'bearish' && nearVWAP && (cvdStatus === 'falling' || cvdStatus === 'flat')) {
      isValidSetup = true;
      signalType = 'SELL';
    }

    const analysis: MarketAnalysis = {
      symbol,
      currentPrice,
      ema200,
      vwap,
      trend, // Now reflects short-term trend
      shortTermTrend: shortTermAnalysis.trend,
      priceAboveEMA,
      nearVWAP,
      cvdStatus,
      isValidSetup,
      signalType,
      priceChange: shortTermAnalysis.priceChange,
      timestamp: new Date().toISOString(),
      dataSource: symbol === 'XAUUSD' ? 'PAXG/USDT (Binance proxy)' : binanceSymbol
    };

    console.log('Analysis result:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
