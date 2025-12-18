import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccumulationZone {
  detected: boolean;
  type: 'institutional_buy' | 'institutional_sell' | 'none';
  strength: number; // 0-100
  reasons: string[];
  breakoutProbability: number; // 0-100
  expectedDirection: 'up' | 'down' | 'unknown';
}

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
  // Accumulation Zone Detection
  accumulation: AccumulationZone;
  bollingerSqueeze: boolean;
  volumeSpike: boolean;
  priceConsolidation: boolean;
}

// Map our app symbols to a supported Binance symbol (or null if unsupported)
function getBinanceSymbol(symbol: string): string | null {
  // Gold and commodities should use different API
  if (symbol === 'XAUUSD' || symbol === 'XAGUSD') return null;
  if (symbol.endsWith('USDT')) return symbol;
  return null;
}

// Fetch gold price from Yahoo Finance (spot or futures)
type GoldPriceSource = 'spot' | 'futures';

async function fetchGoldPrice(source: GoldPriceSource = 'spot'): Promise<
  { price: number; change: number; sourceLabel: string } | null
> {
  const ticker = source === 'spot' ? 'XAUUSD=X' : 'GC=F';
  const sourceLabel = source === 'spot'
    ? 'Yahoo Finance (Gold Spot XAUUSD=X)'
    : 'Yahoo Finance (Gold Futures GC=F)';

  // Primary: chart endpoint (lets us compute % change reliably)
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
        const change = prevClose
          ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100
          : 0;

        return {
          price: meta.regularMarketPrice,
          change,
          sourceLabel,
        };
      }
    }
  } catch (error) {
    console.error('Yahoo Finance gold chart fetch error:', error);
  }

  // Fallback: quoteSummary endpoint
  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const price = data.quoteSummary?.result?.[0]?.price;
      const rawPrice = price?.regularMarketPrice?.raw;
      const rawChangePct = price?.regularMarketChangePercent?.raw;

      if (typeof rawPrice === 'number') {
        let change = 0;
        if (typeof rawChangePct === 'number') {
          // Yahoo can return either 0.23 (percent) or 0.0023 (fraction). Normalize.
          change = Math.abs(rawChangePct) <= 1 ? rawChangePct * 100 : rawChangePct;
        }
        return { price: rawPrice, change, sourceLabel };
      }
    }
  } catch (error) {
    console.error('Yahoo Finance gold quoteSummary fetch error:', error);
  }

  // Last resort: try futures if spot failed (or vice versa)
  if (source === 'spot') return await fetchGoldPrice('futures');

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

// Calculate Bollinger Bands and detect squeeze
function detectBollingerSqueeze(prices: number[], period: number = 20, stdMultiplier: number = 2): { squeeze: boolean; bandWidth: number } {
  if (prices.length < period) return { squeeze: false, bandWidth: 0 };
  
  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = recentPrices.map(p => Math.pow(p - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upperBand = sma + (stdDev * stdMultiplier);
  const lowerBand = sma - (stdDev * stdMultiplier);
  const bandWidth = ((upperBand - lowerBand) / sma) * 100;
  
  // Calculate historical band width to compare
  const historicalBandWidths: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const histPrices = prices.slice(i - period, i);
    const histSma = histPrices.reduce((a, b) => a + b, 0) / period;
    const histSquaredDiffs = histPrices.map(p => Math.pow(p - histSma, 2));
    const histVariance = histSquaredDiffs.reduce((a, b) => a + b, 0) / period;
    const histStdDev = Math.sqrt(histVariance);
    const histUpper = histSma + (histStdDev * stdMultiplier);
    const histLower = histSma - (histStdDev * stdMultiplier);
    historicalBandWidths.push(((histUpper - histLower) / histSma) * 100);
  }
  
  if (historicalBandWidths.length < 10) return { squeeze: false, bandWidth };
  
  const avgBandWidth = historicalBandWidths.reduce((a, b) => a + b, 0) / historicalBandWidths.length;
  // Squeeze detected when current band width is significantly lower than average
  const squeeze = bandWidth < avgBandWidth * 0.6;
  
  return { squeeze, bandWidth };
}

// Detect volume spike (institutional activity)
function detectVolumeSpike(klines: any[]): { spike: boolean; ratio: number } {
  if (klines.length < 30) return { spike: false, ratio: 1 };
  
  const volumes = klines.map(k => parseFloat(k[5]));
  const recent5Volumes = volumes.slice(-5);
  const older25Volumes = volumes.slice(-30, -5);
  
  const recentAvgVolume = recent5Volumes.reduce((a, b) => a + b, 0) / 5;
  const olderAvgVolume = older25Volumes.reduce((a, b) => a + b, 0) / 25;
  
  const ratio = recentAvgVolume / olderAvgVolume;
  // Volume spike detected when recent volume is significantly higher
  const spike = ratio > 1.8;
  
  return { spike, ratio };
}

// Detect price consolidation (tight range)
function detectPriceConsolidation(klines: any[]): { consolidation: boolean; rangePercent: number } {
  if (klines.length < 20) return { consolidation: false, rangePercent: 0 };
  
  const recent20 = klines.slice(-20);
  const highs = recent20.map(k => parseFloat(k[2]));
  const lows = recent20.map(k => parseFloat(k[3]));
  
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const midPrice = (highestHigh + lowestLow) / 2;
  const rangePercent = ((highestHigh - lowestLow) / midPrice) * 100;
  
  // Consolidation detected when price range is very tight (< 1.5%)
  const consolidation = rangePercent < 1.5;
  
  return { consolidation, rangePercent };
}

// Detect institutional accumulation/distribution
function detectAccumulationZone(
  klines: any[],
  cvdStatus: string,
  bollingerSqueeze: boolean,
  volumeSpike: boolean,
  priceConsolidation: boolean,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number }
): AccumulationZone {
  const reasons: string[] = [];
  let buySignals = 0;
  let sellSignals = 0;
  let strength = 0;

  // 1. Bollinger Squeeze - main breakout indicator
  if (bollingerSqueeze) {
    strength += 30;
    reasons.push('🔥 ضغط بولينجر - انفجار سعري وشيك');
  }

  // 2. Volume Spike with price consolidation - institutional activity
  if (volumeSpike && priceConsolidation) {
    strength += 35;
    reasons.push('📊 تجميع مؤسسي - حجم عالي مع سعر ثابت');
  } else if (volumeSpike) {
    strength += 15;
    reasons.push('📈 ارتفاع غير عادي في الحجم');
  } else if (priceConsolidation) {
    strength += 10;
    reasons.push('📍 السعر في نطاق ضيق');
  }

  // 3. CVD analysis for direction
  if (cvdStatus === 'rising') {
    buySignals += 2;
    reasons.push('💚 تدفق شراء مؤسسي');
  } else if (cvdStatus === 'falling') {
    sellSignals += 2;
    reasons.push('🔴 تدفق بيع مؤسسي');
  }

  // 4. RSI divergence
  if (rsi < 35 && cvdStatus === 'rising') {
    buySignals += 2;
    strength += 15;
    reasons.push('⚡ تجميع في قاع RSI');
  } else if (rsi > 65 && cvdStatus === 'falling') {
    sellSignals += 2;
    strength += 15;
    reasons.push('⚡ توزيع في قمة RSI');
  }

  // 5. MACD momentum
  if (macd.histogram > 0 && macd.histogram > macd.signal * 0.1) {
    buySignals += 1;
  } else if (macd.histogram < 0 && macd.histogram < macd.signal * -0.1) {
    sellSignals += 1;
  }

  // Determine accumulation type
  const detected = strength >= 40;
  let type: 'institutional_buy' | 'institutional_sell' | 'none' = 'none';
  let expectedDirection: 'up' | 'down' | 'unknown' = 'unknown';

  if (detected) {
    if (buySignals > sellSignals) {
      type = 'institutional_buy';
      expectedDirection = 'up';
    } else if (sellSignals > buySignals) {
      type = 'institutional_sell';
      expectedDirection = 'down';
    }
  }

  // Calculate breakout probability
  let breakoutProbability = 0;
  if (bollingerSqueeze) breakoutProbability += 40;
  if (volumeSpike && priceConsolidation) breakoutProbability += 35;
  if (cvdStatus !== 'flat') breakoutProbability += 15;
  if (Math.abs(buySignals - sellSignals) >= 2) breakoutProbability += 10;

  return {
    detected,
    type,
    strength: Math.min(100, strength),
    reasons,
    breakoutProbability: Math.min(100, breakoutProbability),
    expectedDirection
  };
}

// IMPROVED: Calculate signal confidence with stricter multi-confirmation logic
function calculateSignalConfidence(
  trend: string,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  cvdStatus: string,
  nearVWAP: boolean,
  priceAboveEMA: boolean,
  ema50?: number,
  ema200?: number,
  currentPrice?: number,
  prevHistogram?: number
): { confidence: number; signalType: 'BUY' | 'SELL' | 'WAIT'; reasons: string[] } {
  const reasons: string[] = [];

  // ========== MULTI-CONFIRMATION SYSTEM ==========
  // Each confirmation adds to the signal. We require at least 3 aligned confirmations.
  let buyConfirmations = 0;
  let sellConfirmations = 0;
  let conflictPenalty = 0;

  // ----- 1. Higher Timeframe Trend Filter (EMA50 vs EMA200) -----
  const htfBullish = ema50 && ema200 && ema50 > ema200;
  const htfBearish = ema50 && ema200 && ema50 < ema200;

  if (htfBullish) {
    buyConfirmations += 1;
    reasons.push('✅ الاتجاه العام صاعد (EMA50 > EMA200)');
  } else if (htfBearish) {
    sellConfirmations += 1;
    reasons.push('✅ الاتجاه العام هابط (EMA50 < EMA200)');
  }

  // ----- 2. Short-Term Trend -----
  if (trend === 'bullish') {
    buyConfirmations += 1;
    reasons.push('✅ الاتجاه القصير صاعد');
  } else if (trend === 'bearish') {
    sellConfirmations += 1;
    reasons.push('✅ الاتجاه القصير هابط');
  }

  // ----- 3. RSI Confirmation (strict zones) -----
  // BUY: RSI recovering from oversold (<35) but not extreme (<20 = wait for bounce)
  // SELL: RSI dropping from overbought (>65) but not extreme (>80 = wait for pullback)
  if (rsi >= 20 && rsi < 35) {
    buyConfirmations += 1;
    reasons.push('✅ RSI في منطقة ذروة البيع مع احتمال ارتداد');
  } else if (rsi > 65 && rsi <= 80) {
    sellConfirmations += 1;
    reasons.push('✅ RSI في منطقة ذروة الشراء مع احتمال تراجع');
  } else if (rsi < 20) {
    reasons.push('⚠️ RSI متطرف (ذروة بيع شديدة) - انتظر ارتداد');
    conflictPenalty += 1;
  } else if (rsi > 80) {
    reasons.push('⚠️ RSI متطرف (ذروة شراء شديدة) - انتظر تصحيح');
    conflictPenalty += 1;
  }

  // ----- 4. MACD Confirmation (crossover + momentum) -----
  const macdBullishCross = macd.macd > macd.signal && macd.histogram > 0;
  const macdBearishCross = macd.macd < macd.signal && macd.histogram < 0;
  const histogramGrowing = prevHistogram !== undefined && Math.abs(macd.histogram) > Math.abs(prevHistogram);

  if (macdBullishCross) {
    buyConfirmations += 1;
    if (histogramGrowing && macd.histogram > 0) {
      buyConfirmations += 0.5; // Extra weight for growing momentum
      reasons.push('✅ MACD صاعد مع زخم متزايد');
    } else {
      reasons.push('✅ MACD متقاطع للأعلى');
    }
  } else if (macdBearishCross) {
    sellConfirmations += 1;
    if (histogramGrowing && macd.histogram < 0) {
      sellConfirmations += 0.5;
      reasons.push('✅ MACD هابط مع زخم متزايد');
    } else {
      reasons.push('✅ MACD متقاطع للأسفل');
    }
  }

  // ----- 5. CVD (Volume Delta) Confirmation -----
  if (cvdStatus === 'rising') {
    buyConfirmations += 1;
    reasons.push('✅ ضغط شراء صافي متزايد');
  } else if (cvdStatus === 'falling') {
    sellConfirmations += 1;
    reasons.push('✅ ضغط بيع صافي متزايد');
  }

  // ----- 6. Price Position vs EMA200 -----
  if (priceAboveEMA) {
    buyConfirmations += 0.5;
    reasons.push('📍 السعر فوق EMA200');
  } else {
    sellConfirmations += 0.5;
    reasons.push('📍 السعر تحت EMA200');
  }

  // ----- 7. VWAP Entry Quality -----
  if (nearVWAP) {
    reasons.push('📍 السعر قريب من VWAP (نقطة دخول جيدة)');
    // Good entry zone, slight bonus
    buyConfirmations += 0.25;
    sellConfirmations += 0.25;
  }

  // ========== CONFLICT DETECTION ==========
  // Penalize when signals are mixed (e.g., bullish trend but RSI overbought)
  if (buyConfirmations > 0 && sellConfirmations > 0) {
    const mixRatio = Math.min(buyConfirmations, sellConfirmations) / Math.max(buyConfirmations, sellConfirmations);
    if (mixRatio > 0.5) {
      conflictPenalty += 1;
      reasons.push('⚠️ إشارات متضاربة - توخّ الحذر');
    }
  }

  // ========== FINAL DECISION ==========
  const netBuy = buyConfirmations - (sellConfirmations * 0.3) - conflictPenalty;
  const netSell = sellConfirmations - (buyConfirmations * 0.3) - conflictPenalty;

  // Calculate confidence (0-100)
  const maxConfirmations = 5.25; // theoretical max
  const rawConfidence = (Math.max(netBuy, netSell) / maxConfirmations) * 100;
  const confidence = Math.min(100, Math.max(0, Math.round(rawConfidence)));

  // STRICT ENTRY RULES:
  // - Need at least 3 aligned confirmations
  // - Net score must be >= 2.5 (clear direction)
  // - No high conflict penalty
  const minConfirmationsRequired = 3;
  const minNetScore = 2.5;

  if (netBuy >= minNetScore && buyConfirmations >= minConfirmationsRequired && conflictPenalty < 2) {
    reasons.unshift('🟢 إشارة شراء مؤكدة');
    return { confidence: Math.max(60, confidence), signalType: 'BUY', reasons };
  }

  if (netSell >= minNetScore && sellConfirmations >= minConfirmationsRequired && conflictPenalty < 2) {
    reasons.unshift('🔴 إشارة بيع مؤكدة');
    return { confidence: Math.max(60, confidence), signalType: 'SELL', reasons };
  }

  // Not enough confirmations or conflicting signals
  reasons.unshift('⏳ انتظر تأكيد أوضح');
  reasons.push(`تأكيدات الشراء: ${buyConfirmations.toFixed(1)} | البيع: ${sellConfirmations.toFixed(1)}`);
  return { confidence: Math.min(50, confidence), signalType: 'WAIT', reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAUUSD', timeframe = '15m', priceSource } = await req.json();

    const allowedIntervals = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d']);
    if (!allowedIntervals.has(timeframe)) {
      return new Response(JSON.stringify({ error: 'إطار زمني غير مدعوم' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing ${symbol} on ${timeframe} timeframe`);

    let currentPrice: number | null = null;
    let priceChangePercent = 0;
    let dataSource = '';
    let klines: any[] = [];

    // Handle Gold (XAUUSD) separately using Yahoo Finance
    if (symbol === 'XAUUSD') {
      const goldSource: GoldPriceSource = priceSource === 'futures' ? 'futures' : 'spot';
      const goldData = await fetchGoldPrice(goldSource);
      if (goldData) {
        currentPrice = goldData.price;
        priceChangePercent = goldData.change;
        dataSource = goldData.sourceLabel;
      }
      
      // Fetch klines from PAXG as technical indicator proxy (not for price)
      const klinesResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${timeframe}&limit=250`
      );
      if (klinesResponse.ok) {
        klines = await klinesResponse.json();
      }
    } else {
      // For crypto, use Binance
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
      
      currentPrice = await fetchBinancePrice(symbol);
      dataSource = binanceSymbol;
      
      const klinesResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${timeframe}&limit=250`
      );
      if (klinesResponse.ok) {
        klines = await klinesResponse.json();
      }
    }

    if (!currentPrice) {
      throw new Error('Could not fetch current price');
    }

    const closePrices = klines.map((k: any[]) => parseFloat(k[4]));

    // Calculate all indicators
    const ema50 = calculateEMA(closePrices, 50);
    const ema200 = calculateEMA(closePrices, 200);
    const vwap = calculateVWAP(klines.slice(-50));
    const rsi = calculateRSI(closePrices, 14);
    const macd = calculateMACD(closePrices);
    const cvdStatus = analyzeCVD(klines);
    const shortTermAnalysis = analyzeShortTermTrend(klines);

    // Calculate previous MACD histogram for momentum detection
    let prevHistogram: number | undefined;
    if (closePrices.length > 10) {
      const prevMacd = calculateMACD(closePrices.slice(0, -5));
      prevHistogram = prevMacd.histogram;
    }

    // Accumulation detection
    const { squeeze: bollingerSqueeze } = detectBollingerSqueeze(closePrices);
    const { spike: volumeSpike } = detectVolumeSpike(klines);
    const { consolidation: priceConsolidation } = detectPriceConsolidation(klines);
    const accumulation = detectAccumulationZone(
      klines,
      cvdStatus,
      bollingerSqueeze,
      volumeSpike,
      priceConsolidation,
      rsi,
      macd
    );

    const priceAboveEMA = currentPrice > ema200;
    const trend = shortTermAnalysis.trend;
    
    const vwapDistance = Math.abs((currentPrice - vwap) / vwap) * 100;
    const nearVWAP = vwapDistance <= 0.8;

    // Calculate confidence-based signal with improved multi-confirmation
    const { confidence, signalType, reasons } = calculateSignalConfidence(
      trend,
      rsi,
      macd,
      cvdStatus,
      nearVWAP,
      priceAboveEMA,
      ema50,
      ema200,
      currentPrice,
      prevHistogram
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
      priceChange: symbol === 'XAUUSD' ? priceChangePercent : shortTermAnalysis.priceChange,
      timestamp: new Date().toISOString(),
      dataSource,
      // Accumulation zone data
      accumulation,
      bollingerSqueeze,
      volumeSpike,
      priceConsolidation
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
