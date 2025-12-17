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
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  trend: 'bullish' | 'bearish' | 'neutral';
  shortTermTrend: 'bullish' | 'bearish' | 'neutral';
  priceAboveEMA: boolean;
  nearVWAP: boolean;
  cvdStatus: 'rising' | 'falling' | 'flat';
  isValidSetup: boolean;
  signalType: 'BUY' | 'SELL' | 'WAIT';
  confidence: number; // 0-100
  signalReasons: string[];
  priceChange: number;
  timestamp: string;
  dataSource: string;
}

// Map our app symbols to a supported Binance symbol (or null if unsupported)
function getBinanceSymbol(symbol: string): string | null {
  if (symbol === 'XAUUSD') return 'PAXGUSDT';
  if (symbol.endsWith('USDT')) return symbol;
  return null;
}

// Fetch price from Binance API with retry
async function fetchBinancePrice(symbol: string, retries = 3): Promise<number | null> {
  const binanceSymbol = getBinanceSymbol(symbol);
  if (!binanceSymbol) return null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return parseFloat(data.price);
      }

      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
    } catch (error) {
      console.error(`Binance fetch error (attempt ${attempt + 1}):`, error);
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

// Calculate RSI
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate smoothed RSI
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const ema12_i = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26_i = calculateEMA(prices.slice(0, i + 1), 26);
    macdValues.push(ema12_i - ema26_i);
  }
  
  const signalLine = macdValues.length >= 9 ? calculateEMA(macdValues, 9) : macdLine;
  const histogram = macdLine - signalLine;
  
  return { macd: macdLine, signal: signalLine, histogram };
}

// Calculate VWAP
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

// Analyze short-term trend
function analyzeShortTermTrend(klines: any[]): { trend: 'bullish' | 'bearish' | 'neutral'; priceChange: number } {
  if (klines.length < 10) return { trend: 'neutral', priceChange: 0 };
  
  const recentKlines = klines.slice(-10);
  const firstClose = parseFloat(recentKlines[0][4]);
  const lastClose = parseFloat(recentKlines[recentKlines.length - 1][4]);
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;
  
  let bullishCandles = 0;
  let bearishCandles = 0;
  
  for (const k of recentKlines) {
    const open = parseFloat(k[1]);
    const close = parseFloat(k[4]);
    if (close > open) bullishCandles++;
    else if (close < open) bearishCandles++;
  }
  
  const highs = recentKlines.map(k => parseFloat(k[2]));
  const lows = recentKlines.map(k => parseFloat(k[3]));
  
  let higherHighs = 0;
  let lowerLows = 0;
  
  for (let i = 1; i < highs.length; i++) {
    if (highs[i] > highs[i - 1]) higherHighs++;
    if (lows[i] < lows[i - 1]) lowerLows++;
  }
  
  const bullishScore = bullishCandles + higherHighs + (priceChange > 0.1 ? 2 : 0);
  const bearishScore = bearishCandles + lowerLows + (priceChange < -0.1 ? 2 : 0);
  
  if (bullishScore > bearishScore + 3) return { trend: 'bullish', priceChange };
  if (bearishScore > bullishScore + 3) return { trend: 'bearish', priceChange };
  return { trend: 'neutral', priceChange };
}

// Analyze CVD
function analyzeCVD(klines: any[]): 'rising' | 'falling' | 'flat' {
  if (klines.length < 20) return 'flat';
  
  const recentKlines = klines.slice(-20);
  const recent10 = recentKlines.slice(-10);
  const older10 = recentKlines.slice(0, 10);
  
  let recentBuy = 0, recentSell = 0, olderBuy = 0, olderSell = 0;
  
  for (const k of recent10) {
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
  
  if (recentDelta > olderDelta * 1.15) return 'rising';
  if (recentDelta < olderDelta * 0.85) return 'falling';
  return 'flat';
}

// Calculate signal confidence and reasons
function calculateSignalConfidence(
  trend: string,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  cvdStatus: string,
  nearVWAP: boolean,
  priceAboveEMA: boolean
): { confidence: number; signalType: 'BUY' | 'SELL' | 'WAIT'; reasons: string[] } {
  let buyScore = 0;
  let sellScore = 0;
  const reasons: string[] = [];

  // Trend analysis (weight: 25%)
  if (trend === 'bullish') {
    buyScore += 25;
    reasons.push('الاتجاه صاعد');
  } else if (trend === 'bearish') {
    sellScore += 25;
    reasons.push('الاتجاه هابط');
  }

  // RSI analysis (weight: 25%)
  if (rsi < 30) {
    buyScore += 25;
    reasons.push('RSI في منطقة ذروة البيع');
  } else if (rsi < 40) {
    buyScore += 15;
    reasons.push('RSI قريب من ذروة البيع');
  } else if (rsi > 70) {
    sellScore += 25;
    reasons.push('RSI في منطقة ذروة الشراء');
  } else if (rsi > 60) {
    sellScore += 15;
    reasons.push('RSI قريب من ذروة الشراء');
  }

  // MACD analysis (weight: 20%)
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    buyScore += 20;
    reasons.push('MACD إيجابي ومتقاطع للأعلى');
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    sellScore += 20;
    reasons.push('MACD سلبي ومتقاطع للأسفل');
  }

  // CVD analysis (weight: 15%)
  if (cvdStatus === 'rising') {
    buyScore += 15;
    reasons.push('ضغط شراء متزايد');
  } else if (cvdStatus === 'falling') {
    sellScore += 15;
    reasons.push('ضغط بيع متزايد');
  }

  // VWAP proximity (weight: 10%)
  if (nearVWAP) {
    reasons.push('السعر قريب من VWAP');
    // Near VWAP is good for entry
    buyScore += 5;
    sellScore += 5;
  }

  // EMA position (weight: 5%)
  if (priceAboveEMA) {
    buyScore += 5;
  } else {
    sellScore += 5;
  }

  // Determine signal type and confidence
  const maxScore = Math.max(buyScore, sellScore);
  const scoreDifference = Math.abs(buyScore - sellScore);

  // Tighten rules to reduce false/reversed entries:
  // - require clearer separation (>= 20)
  // - require higher minimum score (>= 55)
  if (scoreDifference >= 20 && maxScore >= 55) {
    if (buyScore > sellScore) {
      return { confidence: Math.min(100, Math.round(buyScore)), signalType: 'BUY', reasons };
    } else {
      return { confidence: Math.min(100, Math.round(sellScore)), signalType: 'SELL', reasons };
    }
  }

  reasons.push('الإشارات متضاربة/غير كافية - انتظر تأكيد');
  return { confidence: Math.min(100, Math.round(maxScore)), signalType: 'WAIT', reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAUUSD', timeframe = '15m' } = await req.json();

    const binanceSymbol = getBinanceSymbol(symbol);
    if (!binanceSymbol) {
      return new Response(
        JSON.stringify({
          error: 'هذا الرمز غير مدعوم حالياً في Smart Recovery',
          supported: ['XAUUSD', '*USDT'],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allowedIntervals = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d']);
    if (!allowedIntervals.has(timeframe)) {
      return new Response(JSON.stringify({ error: 'إطار زمني غير مدعوم' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing ${symbol} on ${timeframe} timeframe`);

    const currentPrice = await fetchBinancePrice(symbol);
    if (!currentPrice) {
      throw new Error('Could not fetch current price');
    }

    const klinesResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${timeframe}&limit=250`
    );

    let klines: any[] = [];
    if (klinesResponse.ok) {
      klines = await klinesResponse.json();
    }

    const closePrices = klines.map((k: any[]) => parseFloat(k[4]));

    // Calculate all indicators
    const ema200 = calculateEMA(closePrices, 200);
    const vwap = calculateVWAP(klines.slice(-50));
    const rsi = calculateRSI(closePrices, 14);
    const macd = calculateMACD(closePrices);
    const cvdStatus = analyzeCVD(klines);
    const shortTermAnalysis = analyzeShortTermTrend(klines);

    const priceAboveEMA = currentPrice > ema200;
    const trend = shortTermAnalysis.trend;
    
    const vwapDistance = Math.abs((currentPrice - vwap) / vwap) * 100;
    const nearVWAP = vwapDistance <= 0.8;

    // Calculate confidence-based signal
    const { confidence, signalType, reasons } = calculateSignalConfidence(
      trend,
      rsi,
      macd,
      cvdStatus,
      nearVWAP,
      priceAboveEMA
    );

    const isValidSetup = signalType !== 'WAIT' && confidence >= 60;

    const analysis: MarketAnalysis = {
      symbol,
      currentPrice,
      ema200,
      vwap,
      rsi,
      macd,
      trend,
      shortTermTrend: shortTermAnalysis.trend,
      priceAboveEMA,
      nearVWAP,
      cvdStatus,
      isValidSetup,
      signalType,
      confidence,
      signalReasons: reasons,
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
