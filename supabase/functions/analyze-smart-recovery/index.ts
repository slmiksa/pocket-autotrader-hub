import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccumulationZone {
  detected: boolean;
  type: 'institutional_buy' | 'institutional_sell' | 'none';
  strength: number;
  reasons: string[];
  breakoutProbability: number;
  expectedDirection: 'up' | 'down' | 'unknown';
  volumeRatio: number;
  priceRange: number;
  compressionLevel: number;
}

type ExplosionPhase = 'countdown' | 'active' | 'ended' | 'none';

interface ExplosionState {
  phase: ExplosionPhase;
  active: boolean;
  compressionStartedAt: string | null;
  expectedExplosionAt: string | null;
  actualExplosionAt: string | null; // وقت حدوث الانفجار الفعلي
  expectedDurationSeconds: number | null;
  direction: 'up' | 'down' | 'unknown';
  confidence: number;
  method: 'bollinger_squeeze_history' | 'none';
  // معلومات الانفجار التفصيلية
  explosionDetails?: {
    explosionPrice: number; // سعر لحظة الانفجار
    currentPrice: number; // السعر الحالي
    priceAtCompression: number; // سعر بداية الضغط
    priceMoveSinceExplosion: number; // حركة السعر منذ الانفجار بالنقاط
    priceMoveSinceExplosionPercent: number; // حركة السعر بالنسبة المئوية
    explosionDirection: 'up' | 'down' | 'flat'; // اتجاه الانفجار الفعلي
    isDirectionCorrect: boolean; // هل الاتجاه المتوقع كان صحيحاً
    entryWindow: 'optimal' | 'good' | 'late' | 'missed'; // نافذة الدخول
    entryWindowMessage: string; // رسالة توضيحية
    recommendedAction: string; // التوصية
  };
  entrySignal?: {
    canEnter: boolean;
    direction: 'BUY' | 'SELL' | 'WAIT';
    reasons: string[];
    urgency: 'critical' | 'high' | 'medium' | 'low';
  };
  postExplosion?: {
    stillValid: boolean;
    elapsedSinceExplosion: number;
    priceMovedPercent: number;
    volumeConfirmed: boolean;
    breakoutConfirmed: boolean;
  };
  debug: {
    thresholdBandWidth: number;
    avgBandWidth: number;
    currentBandWidth: number;
    historicalSamples: number;
    barsInCurrentSqueeze?: number;
  };
  calibration?: {
    dynamicThreshold: number;
    ratioUsed: number;
    windowDays: number;
    avgBandWidth: number;
    minBandWidth: number;
    maxBandWidth: number;
    samples: number;
  };
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
  confidence: number;
  signalReasons: string[];
  priceChange: number;
  timestamp: string;
  dataSource: string;
  accumulation: AccumulationZone;
  bollingerSqueeze: boolean;
  volumeSpike: boolean;
  priceConsolidation: boolean;
  realTimeMetrics: {
    avgVolume24h: number;
    currentVolume: number;
    volumeChangePercent: number;
    volatilityIndex: number;
    priceRangePercent: number;
    bollingerWidth: number;
  };
  explosionTimer: ExplosionState;
  recentCandles?: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    direction: 'bull' | 'bear' | 'doji';
  }>;
}

// ============= LIVE MARKET DATA APIs =============

// Fetch real-time gold price from multiple sources
async function fetchGoldPriceLive(): Promise<{ price: number; change: number; source: string } | null> {
  const sources = [
    { name: 'Yahoo Finance', fetch: fetchYahooGold },
    { name: 'Metals.live', fetch: fetchMetalsLive },
  ];

  for (const source of sources) {
    try {
      const result = await source.fetch();
      if (result) {
        console.log(`Gold price from ${source.name}: $${result.price}`);
        return { ...result, source: source.name };
      }
    } catch (e) {
      console.error(`${source.name} failed:`, e);
    }
  }
  return null;
}

async function fetchYahooGold(): Promise<{ price: number; change: number } | null> {
  const tickers = ['GC=F', 'XAUUSD=X'];
  
  for (const ticker of tickers) {
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
      );

      if (response.ok) {
        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
          return {
            price: meta.regularMarketPrice,
            change: prevClose ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100 : 0,
          };
        }
      }
    } catch (e) {
      console.error(`Yahoo ${ticker} error:`, e);
    }
  }
  return null;
}

async function fetchMetalsLive(): Promise<{ price: number; change: number } | null> {
  try {
    const response = await fetch('https://api.metals.live/v1/spot/gold', {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Gold LIVE from Metals.live: $${data[0].price}`);
        return { price: data[0].price, change: 0 };
      }
    }
  } catch (e) {
    console.error('Metals.live error:', e);
  }
  
  // Fallback to GoldAPI via CoinGecko (PAX Gold as proxy)
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true'
    );
    if (response.ok) {
      const data = await response.json();
      if (data['pax-gold']?.usd) {
        console.log(`✅ Gold LIVE from CoinGecko (PAXG): $${data['pax-gold'].usd}`);
        return { price: data['pax-gold'].usd, change: data['pax-gold'].usd_24h_change || 0 };
      }
    }
  } catch (e) {
    console.error('CoinGecko PAXG error:', e);
  }
  
  return null;
}

// Fetch real-time forex prices
async function fetchForexPriceLive(symbol: string): Promise<{ price: number; change: number; source: string } | null> {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3, 6);

  // Try Yahoo Finance first
  try {
    const ticker = `${symbol}=X`;
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );

    if (response.ok) {
      const data = await response.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
        console.log(`Forex ${symbol} from Yahoo: ${meta.regularMarketPrice}`);
        return {
          price: meta.regularMarketPrice,
          change: prevClose ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100 : 0,
          source: `Yahoo Finance (${symbol})`,
        };
      }
    }
  } catch (e) {
    console.error('Yahoo Forex error:', e);
  }

  // Fallback to Frankfurter
  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
    if (response.ok) {
      const data = await response.json();
      if (data.rates?.[quote]) {
        return { price: data.rates[quote], change: 0, source: 'Frankfurter API' };
      }
    }
  } catch (e) {
    console.error('Frankfurter error:', e);
  }

  return null;
}

// Fetch real-time crypto prices from Binance with fallback to CoinGecko
async function fetchCryptoPriceLive(symbol: string): Promise<{ price: number; change: number; source: string } | null> {
  const binanceSymbol = symbol.endsWith('USDT') ? symbol : `${symbol.replace('USD', '')}USDT`;
  
  // Try Binance first (most accurate for crypto)
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.lastPrice) {
        console.log(`✅ Crypto ${binanceSymbol} LIVE from Binance: ${data.lastPrice}`);
        return {
          price: parseFloat(data.lastPrice),
          change: parseFloat(data.priceChangePercent),
          source: `Binance LIVE (${binanceSymbol})`,
        };
      }
    }
  } catch (e) {
    console.error('Binance error:', e);
  }
  
  // Fallback to CoinGecko
  try {
    const coinId = symbol.replace('USDT', '').replace('USD', '').toLowerCase();
    const coinGeckoMap: Record<string, string> = {
      'btc': 'bitcoin', 'eth': 'ethereum', 'bnb': 'binancecoin',
      'xrp': 'ripple', 'ada': 'cardano', 'sol': 'solana',
      'doge': 'dogecoin', 'dot': 'polkadot', 'ltc': 'litecoin',
    };
    const cgId = coinGeckoMap[coinId] || coinId;
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true`
    );
    if (response.ok) {
      const data = await response.json();
      if (data[cgId]?.usd) {
        console.log(`✅ Crypto ${symbol} LIVE from CoinGecko: ${data[cgId].usd}`);
        return {
          price: data[cgId].usd,
          change: data[cgId].usd_24h_change || 0,
          source: `CoinGecko LIVE (${cgId})`,
        };
      }
    }
  } catch (e) {
    console.error('CoinGecko error:', e);
  }
  
  return null;
}

// Fetch klines with pagination for historical data
async function fetchKlinesLive(symbol: string, timeframe: string, targetBars: number): Promise<any[]> {
  const isGold = symbol === 'XAUUSD';
  const isForex = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'].includes(symbol);
  
  if (isGold) {
    return await fetchYahooKlines('GC=F', timeframe, targetBars);
  } else if (isForex) {
    return await fetchYahooKlines(`${symbol}=X`, timeframe, targetBars);
  } else {
    return await fetchBinanceKlines(symbol.endsWith('USDT') ? symbol : `${symbol.replace('USD', '')}USDT`, timeframe, targetBars);
  }
}

async function fetchYahooKlines(ticker: string, timeframe: string, targetBars: number): Promise<any[]> {
  const intervalMap: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '60m', '2h': '60m', '4h': '60m', '1d': '1d',
  };
  const interval = intervalMap[timeframe] || '15m';
  const range = interval === '1d' ? '1y' : interval === '1m' ? '7d' : '60d';

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
    );

    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (result) {
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        const { open, high, low, close, volume } = quotes;

        const klines: any[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (open?.[i] != null && high?.[i] != null && low?.[i] != null && close?.[i] != null) {
            klines.push([
              timestamps[i] * 1000,
              String(open[i]),
              String(high[i]),
              String(low[i]),
              String(close[i]),
              String(volume?.[i] ?? 1000000),
            ]);
          }
        }
        console.log(`Yahoo klines for ${ticker}: ${klines.length} bars`);
        return klines.slice(-targetBars);
      }
    }
  } catch (e) {
    console.error('Yahoo klines error:', e);
  }
  return [];
}

async function fetchBinanceKlines(symbol: string, timeframe: string, targetBars: number): Promise<any[]> {
  const collected: any[] = [];
  let endTime = Date.now();
  const limit = Math.min(1000, targetBars);

  for (let attempt = 0; attempt < 10 && collected.length < targetBars; attempt++) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&limit=${limit}&endTime=${endTime}`
      );

      if (!response.ok) break;
      const chunk = await response.json();
      if (!Array.isArray(chunk) || chunk.length === 0) break;

      collected.unshift(...chunk);
      endTime = Number(chunk[0][0]) - 1;
    } catch (e) {
      console.error('Binance klines error:', e);
      break;
    }
  }

  const uniq = new Map<number, any[]>();
  for (const k of collected) uniq.set(Number(k[0]), k);
  const sorted = [...uniq.values()].sort((a, b) => Number(a[0]) - Number(b[0]));
  console.log(`Binance klines for ${symbol}: ${sorted.length} bars`);
  return sorted.slice(-targetBars);
}

// ============= TECHNICAL INDICATORS =============

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  // Use Wilder's smoothing method for accurate RSI
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // Initial averages using SMA for first period
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  
  // Apply Wilder's smoothing for remaining data
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.round(rsi * 100) / 100;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const macdValues: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const ema12_i = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26_i = calculateEMA(prices.slice(0, i + 1), 26);
    macdValues.push(ema12_i - ema26_i);
  }
  const signalLine = macdValues.length >= 9 ? calculateEMA(macdValues, 9) : macdLine;
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

function calculateVWAP(klines: any[]): number {
  if (klines.length === 0) return 0;
  let cumulativeTPV = 0, cumulativeVolume = 0;
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

function analyzeShortTermTrend(klines: any[]): { trend: 'bullish' | 'bearish' | 'neutral'; priceChange: number } {
  if (klines.length < 10) return { trend: 'neutral', priceChange: 0 };
  const recentKlines = klines.slice(-10);
  const firstClose = parseFloat(recentKlines[0][4]);
  const lastClose = parseFloat(recentKlines[recentKlines.length - 1][4]);
  const priceChange = ((lastClose - firstClose) / firstClose) * 100;

  let bullishCandles = 0, bearishCandles = 0;
  for (const k of recentKlines) {
    const open = parseFloat(k[1]);
    const close = parseFloat(k[4]);
    if (close > open) bullishCandles++;
    else if (close < open) bearishCandles++;
  }

  const highs = recentKlines.map(k => parseFloat(k[2]));
  const lows = recentKlines.map(k => parseFloat(k[3]));
  let higherHighs = 0, lowerLows = 0;
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

function detectBollingerSqueeze(prices: number[], period: number = 20): { squeeze: boolean; bandWidth: number } {
  if (prices.length < period) return { squeeze: false, bandWidth: 0 };

  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upperBand = sma + stdDev * 2;
  const lowerBand = sma - stdDev * 2;
  const bandWidth = ((upperBand - lowerBand) / sma) * 100;

  const historicalBandWidths: number[] = [];
  for (let i = period; i < prices.length; i++) {
    const histPrices = prices.slice(i - period, i);
    const histSma = histPrices.reduce((a, b) => a + b, 0) / period;
    const histVariance = histPrices.reduce((sum, p) => sum + Math.pow(p - histSma, 2), 0) / period;
    const histStdDev = Math.sqrt(histVariance);
    const histBandWidth = ((histSma + histStdDev * 2 - (histSma - histStdDev * 2)) / histSma) * 100;
    historicalBandWidths.push(histBandWidth);
  }

  if (historicalBandWidths.length < 10) return { squeeze: false, bandWidth };

  const avgBandWidth = historicalBandWidths.reduce((a, b) => a + b, 0) / historicalBandWidths.length;
  const squeeze = bandWidth < avgBandWidth * 0.6;

  return { squeeze, bandWidth };
}

function detectVolumeSpike(klines: any[]): { spike: boolean; ratio: number; avgVolume: number; recentVolume: number } {
  if (klines.length < 30) return { spike: false, ratio: 1, avgVolume: 0, recentVolume: 0 };

  const recent5 = klines.slice(-5);
  const older20 = klines.slice(-25, -5);

  const recentAvgVolume = recent5.reduce((sum, k) => sum + parseFloat(k[5]), 0) / 5;
  const olderAvgVolume = older20.reduce((sum, k) => sum + parseFloat(k[5]), 0) / 20;

  const ratio = olderAvgVolume > 0 ? recentAvgVolume / olderAvgVolume : 1;
  const spike = ratio > 2.0;

  return { spike, ratio: Math.round(ratio * 100) / 100, avgVolume: Math.round(olderAvgVolume), recentVolume: Math.round(recentAvgVolume) };
}

function detectPriceConsolidation(klines: any[]): { consolidation: boolean; rangePercent: number; compressionRatio: number } {
  if (klines.length < 30) return { consolidation: false, rangePercent: 0, compressionRatio: 1 };

  const recent20 = klines.slice(-20);
  const older20 = klines.slice(-40, -20);
  const highs = recent20.map(k => parseFloat(k[2]));
  const lows = recent20.map(k => parseFloat(k[3]));

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  const midPrice = (highestHigh + lowestLow) / 2;
  const rangePercent = ((highestHigh - lowestLow) / midPrice) * 100;

  let recentATR = 0;
  for (const k of recent20) {
    recentATR += parseFloat(k[2]) - parseFloat(k[3]);
  }
  recentATR /= recent20.length;

  let olderATR = 0;
  for (const k of older20) {
    olderATR += parseFloat(k[2]) - parseFloat(k[3]);
  }
  olderATR /= older20.length;

  const compressionRatio = olderATR > 0 ? recentATR / olderATR : 1;
  const consolidation = rangePercent < 1.2 && compressionRatio < 0.6;

  return { consolidation, rangePercent: Math.round(rangePercent * 100) / 100, compressionRatio: Math.round(compressionRatio * 100) / 100 };
}

function timeframeToSeconds(timeframe: string): number {
  const map: Record<string, number> = {
    '1m': 60, '3m': 180, '5m': 300, '15m': 900, '30m': 1800,
    '1h': 3600, '2h': 7200, '4h': 14400, '6h': 21600, '8h': 28800, '12h': 43200, '1d': 86400,
  };
  return map[timeframe] ?? 900;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateBandWidthSeries(klines: any[], period: number = 20): Array<{ time: number; bandWidth: number }> {
  if (klines.length < period) return [];
  const closes = klines.map(k => parseFloat(k[4]));
  const times = klines.map(k => Number(k[0]));

  const series: Array<{ time: number; bandWidth: number }> = [];
  for (let i = period - 1; i < closes.length; i++) {
    const window = closes.slice(i - period + 1, i + 1);
    const sma = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    const upper = sma + stdDev * 2;
    const lower = sma - stdDev * 2;
    const bandWidth = sma > 0 ? ((upper - lower) / sma) * 100 : 0;
    series.push({ time: times[i], bandWidth });
  }
  return series;
}

function calculateDynamicSqueezeThreshold(bandWidths: number[]) {
  const ratioUsed = 0.6;
  if (!bandWidths.length) {
    return { threshold: ratioUsed, ratioUsed, avgBandWidth: 1, minBandWidth: 0, maxBandWidth: 0, calibrationSamples: 0 };
  }

  const avgBandWidth = bandWidths.reduce((a, b) => a + b, 0) / bandWidths.length;
  const minBandWidth = Math.min(...bandWidths);
  const maxBandWidth = Math.max(...bandWidths);
  const safeAvg = Number.isFinite(avgBandWidth) && avgBandWidth > 0 ? avgBandWidth : 1;

  return {
    threshold: safeAvg * ratioUsed,
    ratioUsed,
    avgBandWidth: Math.round(safeAvg * 100) / 100,
    minBandWidth: Math.round(minBandWidth * 100) / 100,
    maxBandWidth: Math.round(maxBandWidth * 100) / 100,
    calibrationSamples: bandWidths.length,
  };
}

function computeExplosionTimer(opts: {
  klines: any[];
  timeframe: string;
  latestBandWidth: number;
  accumulation: AccumulationZone;
  volumeSpike: boolean;
  direction: 'up' | 'down' | 'unknown';
  cvdStatus: 'rising' | 'falling' | 'flat';
  rsi: number;
  signalType: 'BUY' | 'SELL' | 'WAIT';
}): ExplosionState {
  const { klines, timeframe, latestBandWidth, accumulation, volumeSpike, direction, cvdStatus, rsi, signalType } = opts;

  const series = calculateBandWidthSeries(klines, 20);
  if (series.length < 15) {
    return {
      phase: 'none',
      active: false,
      compressionStartedAt: null,
      expectedExplosionAt: null,
      actualExplosionAt: null,
      expectedDurationSeconds: null,
      direction,
      confidence: 0,
      method: 'none',
      debug: { thresholdBandWidth: 0, avgBandWidth: 0, currentBandWidth: latestBandWidth, historicalSamples: 0 },
    };
  }

  const barSeconds = timeframeToSeconds(timeframe);
  const windowBars = Math.min(series.length, Math.ceil((30 * 86400) / barSeconds));
  const windowSeries = series.slice(-windowBars);

  const calibrationRaw = calculateDynamicSqueezeThreshold(windowSeries.map(s => s.bandWidth));
  const thresholdBandWidth = calibrationRaw.threshold;

  const completedDurations: number[] = [];
  let inSeg = false, segCount = 0;

  for (let i = 0; i < windowSeries.length; i++) {
    const below = windowSeries[i].bandWidth < thresholdBandWidth;
    if (below && !inSeg) {
      inSeg = true;
      segCount = 1;
    } else if (below && inSeg) {
      segCount++;
    } else if (!below && inSeg) {
      if (segCount >= 3) completedDurations.push(segCount * barSeconds);
      inSeg = false;
      segCount = 0;
    }
  }

  const currentlyBelow = series[series.length - 1].bandWidth < thresholdBandWidth;
  let startTime = series[series.length - 1].time;
  let barsInCurrent = 1;
  for (let i = series.length - 2; i >= 0; i--) {
    if (series[i].bandWidth < thresholdBandWidth) {
      startTime = series[i].time;
      barsInCurrent++;
    } else {
      break;
    }
  }

  const squeezeActive = Boolean(currentlyBelow && barsInCurrent >= 3);

  const expectedFromHistory = median(completedDurations);
  const fallbackSeconds = barSeconds * 15;
  const expectedDurationSeconds = Math.min(Math.max(expectedFromHistory ?? fallbackSeconds, barSeconds * 5), barSeconds * 400);

  const now = Date.now();

  // Determine the squeeze start + (optional) real explosion time.
  // IMPORTANT: We only mark phase = 'active' when the squeeze actually ends (real breakout),
  // not just when a predicted countdown reaches zero.
  let squeezeStartMs: number | null = null;
  let barsInSqueeze = 0;
  let actualExplosionAtMs: number | null = null;

  if (squeezeActive) {
    squeezeStartMs = startTime;
    barsInSqueeze = barsInCurrent;
  } else if (!currentlyBelow) {
    // Find the most recent squeeze segment that ended immediately before the latest bar.
    // Last bar is above threshold (breakout candle). We look back from the previous bar.
    let i = series.length - 2;
    while (i >= 0 && series[i].bandWidth < thresholdBandWidth) i--;
    const segBars = (series.length - 2) - i;

    if (segBars >= 3) {
      squeezeStartMs = series[i + 1].time;
      barsInSqueeze = segBars;
      actualExplosionAtMs = series[series.length - 1].time;
    }
  }

  const expectedExplosionAtMs = squeezeStartMs ? squeezeStartMs + expectedDurationSeconds * 1000 : null;
  const remainingSeconds = expectedExplosionAtMs ? Math.max(0, Math.floor((expectedExplosionAtMs - now) / 1000)) : 0;

  let phase: ExplosionPhase = 'none';
  if (squeezeActive && squeezeStartMs) {
    phase = 'countdown';
  } else if (actualExplosionAtMs) {
    const timeSinceExplosion = (now - actualExplosionAtMs) / 1000;
    phase = timeSinceExplosion < barSeconds * 5 ? 'active' : 'ended';
  }

  let confidence = 40;
  if (latestBandWidth > 0 && thresholdBandWidth > 0) {
    const ratio = latestBandWidth / thresholdBandWidth;
    if (ratio < 0.9) confidence += 10;
    if (ratio < 0.75) confidence += 15;
    if (ratio < 0.6) confidence += 15;
  }
  if (accumulation?.detected) confidence += 15;
  if (accumulation?.breakoutProbability) confidence += Math.min(15, Math.floor(accumulation.breakoutProbability / 10));
  if (volumeSpike) confidence += 10;
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  // حساب التأكيدات المطلوبة
  const volumeConfirmed = volumeSpike;
  const cvdConfirmed = (direction === 'up' && cvdStatus === 'rising') || (direction === 'down' && cvdStatus === 'falling');
  const rsiConfirmed = (direction === 'up' && rsi < 70) || (direction === 'down' && rsi > 30);
  const accumulationStrong = accumulation?.strength >= 50;
  
  // حساب نسبة حركة السعر لتحديد الاختراق
  const priceAtStart = klines.length > barsInCurrent ? parseFloat(klines[klines.length - barsInCurrent][4]) : 0;
  const latestPrice = parseFloat(klines[klines.length - 1][4]);
  const priceMovePercent = priceAtStart > 0 ? ((latestPrice - priceAtStart) / priceAtStart) * 100 : 0;
  const breakoutConfirmed = Math.abs(priceMovePercent) > 0.2;
  
  const confirmationCount = [volumeConfirmed, cvdConfirmed, breakoutConfirmed].filter(Boolean).length;

  let entrySignal: ExplosionState['entrySignal'] = undefined;
  if (phase === 'countdown' || phase === 'active') {
    const entryReasons: string[] = [];
    let canEnter = false;
    let entryDirection: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';

    if (phase === 'active') {
      // الانفجار نشط - يجب أن يكون لدينا تأكيدين على الأقل للدخول
      if (confirmationCount >= 2) {
        canEnter = true;
        entryDirection = direction === 'up' ? 'BUY' : direction === 'down' ? 'SELL' : signalType;
        urgency = 'critical';
        entryReasons.push('🔥 انفجار مؤكد!');
        if (volumeConfirmed) entryReasons.push('✅ حجم قوي');
        if (cvdConfirmed) entryReasons.push('✅ تدفق ' + (cvdStatus === 'rising' ? 'شراء' : 'بيع'));
        if (breakoutConfirmed) entryReasons.push(`✅ اختراق ${priceMovePercent > 0 ? '+' : ''}${priceMovePercent.toFixed(2)}%`);
      } else if (confirmationCount === 1) {
        canEnter = false;
        entryDirection = 'WAIT';
        urgency = 'high';
        entryReasons.push('⏳ انتظر تأكيد إضافي');
        if (volumeConfirmed) entryReasons.push('✅ حجم قوي');
        else entryReasons.push('❌ الحجم ضعيف');
        if (cvdConfirmed) entryReasons.push('✅ تدفق ' + (cvdStatus === 'rising' ? 'شراء' : 'بيع'));
        if (breakoutConfirmed) entryReasons.push(`✅ اختراق ${priceMovePercent > 0 ? '+' : ''}${priceMovePercent.toFixed(2)}%`);
        else entryReasons.push('❌ لا اختراق واضح');
      } else {
        canEnter = false;
        entryDirection = 'WAIT';
        urgency = 'medium';
        entryReasons.push('⚠️ لا توجد تأكيدات كافية');
        entryReasons.push('❌ الحجم ضعيف');
        entryReasons.push('❌ لا اختراق واضح');
      }
    } else if (phase === 'countdown') {
      // العد التنازلي - لا ندخل إلا في حالات خاصة
      if (remainingSeconds < 60 && accumulationStrong && cvdConfirmed) {
        canEnter = true;
        entryDirection = direction === 'up' ? 'BUY' : direction === 'down' ? 'SELL' : 'WAIT';
        urgency = 'critical';
        entryReasons.push('🎯 دخول استباقي!');
        entryReasons.push('✅ تجميع مؤسسي قوي');
        entryReasons.push(`✅ تدفق ${cvdStatus === 'rising' ? 'شراء' : 'بيع'}`);
      } else if (remainingSeconds < 120) {
        canEnter = false;
        entryDirection = 'WAIT';
        urgency = 'critical';
        entryReasons.push('🔥 انفجار وشيك!');
        entryReasons.push('⏳ انتظر الاختراق للدخول');
      } else if (remainingSeconds < 300) {
        canEnter = false;
        entryDirection = 'WAIT';
        urgency = 'high';
        entryReasons.push('⚡ استعد للانفجار');
      } else {
        canEnter = false;
        entryDirection = 'WAIT';
        urgency = remainingSeconds < 600 ? 'medium' : 'low';
        entryReasons.push('📊 ضغط نشط - راقب');
      }

      if (rsiConfirmed) entryReasons.push(`📈 RSI مناسب (${rsi.toFixed(0)})`);
    }

    entrySignal = { canEnter, direction: entryDirection, reasons: entryReasons, urgency };
  }

  let postExplosion: ExplosionState['postExplosion'] = undefined;
  if (actualExplosionAtMs && (phase === 'active' || phase === 'ended')) {
    const elapsedSinceExplosion = Math.max(0, Math.floor((now - actualExplosionAtMs) / 1000));

    // Start-of-squeeze price (for "moved since explosion" context)
    const startIndex = Math.max(0, klines.length - (barsInSqueeze + 1));
    const priceAtStart = klines.length ? parseFloat(klines[startIndex][4]) : 0;

    const currentPrice = parseFloat(klines[klines.length - 1][4]);
    const priceMovedPercent = priceAtStart > 0 ? ((currentPrice - priceAtStart) / priceAtStart) * 100 : 0;
    const breakoutConfirmed = Math.abs(priceMovedPercent) > 0.3;
    const stillValid = phase === 'active' && (volumeSpike || breakoutConfirmed);

    postExplosion = {
      stillValid,
      elapsedSinceExplosion,
      priceMovedPercent: Math.round(priceMovedPercent * 100) / 100,
      volumeConfirmed: volumeSpike,
      breakoutConfirmed,
    };
  }

  const calibration = {
    dynamicThreshold: Math.round(thresholdBandWidth * 100) / 100,
    ratioUsed: calibrationRaw.ratioUsed,
    windowDays: 30,
    avgBandWidth: calibrationRaw.avgBandWidth,
    minBandWidth: calibrationRaw.minBandWidth,
    maxBandWidth: calibrationRaw.maxBandWidth,
    samples: calibrationRaw.calibrationSamples,
  };

  // حساب الثقة حتى عند عدم وجود انفجار نشط
  if (phase === 'none' && !squeezeActive) {
    // نحسب الثقة بناءً على المؤشرات الموجودة
    let baseConfidence = 30; // ثقة أساسية
    
    // تقييم قوة التجمع السعري
    if (accumulation?.detected) {
      baseConfidence += 25;
      if (accumulation.strength >= 70) baseConfidence += 15;
      else if (accumulation.strength >= 50) baseConfidence += 10;
    }
    
    // تقييم اقتراب البولينجر من الضغط
    if (latestBandWidth > 0 && thresholdBandWidth > 0) {
      const ratio = latestBandWidth / thresholdBandWidth;
      if (ratio < 1.2) baseConfidence += 15;
      if (ratio < 1.0) baseConfidence += 10;
    }
    
    // تقييم المؤشرات الفنية
    if (volumeSpike) baseConfidence += 10;
    if (cvdStatus !== 'flat') baseConfidence += 5;
    if ((direction === 'up' && rsi < 50) || (direction === 'down' && rsi > 50)) baseConfidence += 5;
    
    confidence = Math.max(0, Math.min(85, Math.round(baseConfidence)));
  }
  
  if (phase === 'ended') {
    // في حالة انتهاء الانفجار، نقلل الثقة تدريجياً
    confidence = Math.max(0, Math.round(confidence * 0.3));
  }
  
  if (phase === 'none' || phase === 'ended') {
    const startIso = squeezeStartMs ? new Date(squeezeStartMs).toISOString() : null;
    const expectedIso = expectedExplosionAtMs ? new Date(expectedExplosionAtMs).toISOString() : null;
    const actualIso = actualExplosionAtMs ? new Date(actualExplosionAtMs).toISOString() : null;

    return {
      phase,
      active: false,
      compressionStartedAt: startIso,
      expectedExplosionAt: expectedIso,
      actualExplosionAt: actualIso,
      expectedDurationSeconds: squeezeStartMs ? expectedDurationSeconds : null,
      direction,
      confidence, // استخدام الثقة المحسوبة بدلاً من 0
      method: 'bollinger_squeeze_history',
      postExplosion,
      debug: {
        thresholdBandWidth: Math.round(thresholdBandWidth * 100) / 100,
        avgBandWidth: calibrationRaw.avgBandWidth,
        currentBandWidth: Math.round(latestBandWidth * 100) / 100,
        historicalSamples: completedDurations.length,
        barsInCurrentSqueeze: barsInSqueeze || undefined,
      },
      calibration,
    };
  }

  // حساب تفاصيل الانفجار
  const currentPrice = parseFloat(klines[klines.length - 1][4]);
  const priceAtCompression = klines.length > barsInCurrent ? parseFloat(klines[klines.length - barsInCurrent][4]) : currentPrice;
  
  // سعر الانفجار: السعر في آخر شمعة قبل وقت الانفجار المتوقع
  // إذا كان الانفجار نشط، نحسب كم شمعة مرت منذ الانفجار
  const explosionTimeMs = actualExplosionAtMs ?? expectedExplosionAtMs ?? now;
  const barsElapsedSinceExplosion = Math.max(0, Math.floor((now - explosionTimeMs) / (barSeconds * 1000)));
  const explosionBarIndex = Math.max(0, klines.length - 1 - barsElapsedSinceExplosion);
  
  // سعر لحظة الانفجار الفعلية (الشمعة التي حدث فيها الانفجار)
  const explosionPrice = phase === 'active' && barsElapsedSinceExplosion > 0
    ? parseFloat(klines[explosionBarIndex][4])
    : priceAtCompression;
  
  // حركة السعر منذ الانفجار
  const priceMoveSinceExplosion = currentPrice - explosionPrice;
  const priceMoveSinceExplosionPercent = explosionPrice > 0 ? (priceMoveSinceExplosion / explosionPrice) * 100 : 0;
  
  // تحديد اتجاه الانفجار الفعلي بناءً على حركة السعر من بداية الضغط
  const priceChangeSinceCompression = currentPrice - priceAtCompression;
  const priceChangeSinceCompressionPercent = priceAtCompression > 0 ? (priceChangeSinceCompression / priceAtCompression) * 100 : 0;
  
  const explosionDirection: 'up' | 'down' | 'flat' = 
    priceChangeSinceCompressionPercent > 0.05 ? 'up' : 
    priceChangeSinceCompressionPercent < -0.05 ? 'down' : 'flat';
  
  const isDirectionCorrect = direction === explosionDirection || explosionDirection === 'flat';
  
  // تحديد نافذة الدخول والتأكيدات
  const elapsedSinceExplosion = (phase === 'active' && actualExplosionAtMs != null)
    ? Math.max(0, Math.floor((now - actualExplosionAtMs) / 1000))
    : 0;
  const hasVolumeConfirmation = volumeSpike;
  const hasCVDConfirmation = (direction === 'up' && cvdStatus === 'rising') || (direction === 'down' && cvdStatus === 'falling');
  const hasBreakoutConfirmation = Math.abs(priceChangeSinceCompressionPercent) > 0.2;
  
  let entryWindow: 'optimal' | 'good' | 'late' | 'missed' = 'missed';
  let entryWindowMessage = '';
  let recommendedAction = '';
  
  if (phase === 'countdown') {
    if (remainingSeconds < 60) {
      entryWindow = 'optimal';
      entryWindowMessage = `🎯 الانفجار خلال ${remainingSeconds} ثانية!`;
      recommendedAction = accumulation?.strength >= 50 
        ? `استعد للدخول ${direction === 'up' ? 'شراء 📈' : direction === 'down' ? 'بيع 📉' : ''}`
        : 'انتظر تأكيد الاختراق';
    } else if (remainingSeconds < 180) {
      entryWindow = 'good';
      entryWindowMessage = `⏳ متبقي ${Math.ceil(remainingSeconds / 60)} دقيقة للانفجار`;
      recommendedAction = 'استعد وراقب الحجم';
    } else {
      entryWindow = 'late';
      entryWindowMessage = `📊 ضغط نشط - انتظر ${Math.ceil(remainingSeconds / 60)} دقيقة`;
      recommendedAction = 'راقب واستعد';
    }
  } else if (phase === 'active') {
    // الانفجار نشط - تحديد حالة الدخول بناءً على التأكيدات
    const confirmationCount = [hasVolumeConfirmation, hasCVDConfirmation, hasBreakoutConfirmation].filter(Boolean).length;
    
    if (elapsedSinceExplosion < 60 && confirmationCount >= 2) {
      entryWindow = 'optimal';
      entryWindowMessage = '🔥 فرصة مثالية - تأكيدات قوية!';
      recommendedAction = `ادخل ${explosionDirection === 'up' ? 'شراء 📈' : explosionDirection === 'down' ? 'بيع 📉' : 'بحذر'}`;
    } else if (elapsedSinceExplosion < 180 && confirmationCount >= 1) {
      entryWindow = 'good';
      entryWindowMessage = `✅ فرصة جيدة (مضى ${Math.floor(elapsedSinceExplosion / 60)}:${String(elapsedSinceExplosion % 60).padStart(2, '0')})`;
      recommendedAction = `يمكنك الدخول ${explosionDirection === 'up' ? 'شراء' : explosionDirection === 'down' ? 'بيع' : ''}`;
    } else if (elapsedSinceExplosion < 180 && confirmationCount === 0) {
      entryWindow = 'good';
      entryWindowMessage = `⏳ انتظر التأكيد (مضى ${Math.floor(elapsedSinceExplosion / 60)}:${String(elapsedSinceExplosion % 60).padStart(2, '0')})`;
      recommendedAction = 'انتظر تأكيد الحجم أو الاختراق';
    } else if (elapsedSinceExplosion < 600 && hasBreakoutConfirmation) {
      entryWindow = 'late';
      entryWindowMessage = `⚠️ متأخر لكن الاختراق مؤكد (${Math.floor(elapsedSinceExplosion / 60)} دقيقة)`;
      recommendedAction = 'دخول بحذر مع وقف خسارة قريب';
    } else if (elapsedSinceExplosion >= 600) {
      entryWindow = 'missed';
      entryWindowMessage = `❌ فات الأوان (${Math.floor(elapsedSinceExplosion / 60)} دقيقة)`;
      recommendedAction = 'انتظر الفرصة القادمة';
    } else {
      entryWindow = 'late';
      entryWindowMessage = `⏳ انتظر التأكيد (${Math.floor(elapsedSinceExplosion / 60)}:${String(elapsedSinceExplosion % 60).padStart(2, '0')})`;
      recommendedAction = 'لا تدخل بدون تأكيد الحجم';
    }
  }
  
  const explosionDetails: ExplosionState['explosionDetails'] = {
    explosionPrice: Math.round(explosionPrice * 100) / 100, // تقريب للأسعار المقروءة
    currentPrice: Math.round(currentPrice * 100) / 100,
    priceAtCompression: Math.round(priceAtCompression * 100) / 100,
    priceMoveSinceExplosion: Math.round(priceMoveSinceExplosion * 100) / 100,
    priceMoveSinceExplosionPercent: Math.round(priceMoveSinceExplosionPercent * 1000) / 1000,
    explosionDirection,
    isDirectionCorrect,
    entryWindow,
    entryWindowMessage,
    recommendedAction,
  };
  
  return {
    phase,
    active: phase === 'countdown' || phase === 'active',
    compressionStartedAt: squeezeStartMs ? new Date(squeezeStartMs).toISOString() : null,
    expectedExplosionAt: expectedExplosionAtMs ? new Date(expectedExplosionAtMs).toISOString() : null,
    actualExplosionAt: actualExplosionAtMs ? new Date(actualExplosionAtMs).toISOString() : null,
    expectedDurationSeconds: squeezeStartMs ? expectedDurationSeconds : null,
    direction,
    confidence,
    method: 'bollinger_squeeze_history',
    explosionDetails,
    entrySignal,
    postExplosion,
    debug: {
      thresholdBandWidth: Math.round(thresholdBandWidth * 100) / 100,
      avgBandWidth: calibrationRaw.avgBandWidth,
      currentBandWidth: Math.round(latestBandWidth * 100) / 100,
      historicalSamples: completedDurations.length,
      barsInCurrentSqueeze: barsInCurrent,
    },
    calibration,
  };
}

function detectAccumulationZone(
  klines: any[],
  cvdStatus: string,
  bollingerSqueeze: boolean,
  volumeData: { spike: boolean; ratio: number; avgVolume: number; recentVolume: number },
  consolidationData: { consolidation: boolean; rangePercent: number; compressionRatio: number },
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  bandWidth: number
): AccumulationZone {
  const reasons: string[] = [];
  let buySignals = 0, sellSignals = 0, strength = 0;

  if (bollingerSqueeze && bandWidth < 2.0) {
    strength += 35;
    reasons.push(`🔥 ضغط بولينجر شديد (${bandWidth.toFixed(1)}%)`);
  } else if (bollingerSqueeze) {
    strength += 20;
    reasons.push(`📊 ضغط بولينجر (${bandWidth.toFixed(1)}%)`);
  }

  if (volumeData.spike && consolidationData.consolidation) {
    strength += 40;
    reasons.push(`📊 تجميع مؤسسي قوي (حجم ${volumeData.ratio}x)`);
  } else if (volumeData.spike && volumeData.ratio > 2.5) {
    strength += 25;
    reasons.push(`📈 حجم استثنائي (${volumeData.ratio}x)`);
  } else if (volumeData.spike) {
    strength += 15;
    reasons.push(`📈 ارتفاع الحجم (${volumeData.ratio}x)`);
  }

  if (consolidationData.consolidation && consolidationData.compressionRatio < 0.5) {
    strength += 20;
    reasons.push(`📍 ضغط سعري شديد (${consolidationData.rangePercent.toFixed(2)}%)`);
  } else if (consolidationData.consolidation) {
    strength += 10;
    reasons.push(`📍 نطاق سعري ضيق`);
  }

  if (cvdStatus === 'rising') {
    buySignals += 3;
    reasons.push('💚 تدفق شراء مؤسسي');
  } else if (cvdStatus === 'falling') {
    sellSignals += 3;
    reasons.push('🔴 تدفق بيع مؤسسي');
  }

  if (rsi < 30 && cvdStatus === 'rising') {
    buySignals += 3;
    strength += 20;
    reasons.push('⚡ تباعد إيجابي');
  } else if (rsi > 70 && cvdStatus === 'falling') {
    sellSignals += 3;
    strength += 20;
    reasons.push('⚡ تباعد سلبي');
  }

  if (macd.histogram > 0 && macd.macd > macd.signal) buySignals += 1;
  else if (macd.histogram < 0 && macd.macd < macd.signal) sellSignals += 1;

  const detected = strength >= 45;
  let type: 'institutional_buy' | 'institutional_sell' | 'none' = 'none';
  let expectedDirection: 'up' | 'down' | 'unknown' = 'unknown';

  if (detected) {
    if (buySignals > sellSignals + 1) {
      type = 'institutional_buy';
      expectedDirection = 'up';
    } else if (sellSignals > buySignals + 1) {
      type = 'institutional_sell';
      expectedDirection = 'down';
    }
  }

  let breakoutProbability = 0;
  if (bollingerSqueeze && bandWidth < 2.0) breakoutProbability += 45;
  else if (bollingerSqueeze) breakoutProbability += 30;
  if (volumeData.spike && consolidationData.consolidation) breakoutProbability += 35;
  else if (volumeData.spike && volumeData.ratio > 2.5) breakoutProbability += 25;
  if (cvdStatus !== 'flat') breakoutProbability += 10;
  if (Math.abs(buySignals - sellSignals) >= 3) breakoutProbability += 10;

  return {
    detected,
    type,
    strength: Math.min(100, strength),
    reasons,
    breakoutProbability: Math.min(100, breakoutProbability),
    expectedDirection,
    volumeRatio: volumeData.ratio,
    priceRange: consolidationData.rangePercent,
    compressionLevel: consolidationData.compressionRatio,
  };
}

function calculateSignalConfidence(
  trend: string,
  rsi: number,
  macd: { macd: number; signal: number; histogram: number },
  cvdStatus: string,
  nearVWAP: boolean,
  priceAboveEMA: boolean,
  ema50?: number,
  ema200?: number
): { confidence: number; signalType: 'BUY' | 'SELL' | 'WAIT'; reasons: string[] } {
  const reasons: string[] = [];
  let buyConfirmations = 0, sellConfirmations = 0, conflictPenalty = 0;

  const htfBullish = ema50 && ema200 && ema50 > ema200;
  const htfBearish = ema50 && ema200 && ema50 < ema200;

  if (htfBullish) {
    buyConfirmations += 1;
    reasons.push('✅ الاتجاه العام صاعد');
  } else if (htfBearish) {
    sellConfirmations += 1;
    reasons.push('✅ الاتجاه العام هابط');
  }

  if (trend === 'bullish') {
    buyConfirmations += 1;
    reasons.push('✅ الاتجاه القصير صاعد');
  } else if (trend === 'bearish') {
    sellConfirmations += 1;
    reasons.push('✅ الاتجاه القصير هابط');
  }

  if (rsi >= 20 && rsi < 35) {
    buyConfirmations += 1;
    reasons.push('✅ RSI ذروة بيع');
  } else if (rsi > 65 && rsi <= 80) {
    sellConfirmations += 1;
    reasons.push('✅ RSI ذروة شراء');
  } else if (rsi < 20 || rsi > 80) {
    conflictPenalty += 1;
    reasons.push('⚠️ RSI متطرف');
  }

  if (macd.macd > macd.signal && macd.histogram > 0) {
    buyConfirmations += 1;
    reasons.push('✅ MACD صاعد');
  } else if (macd.macd < macd.signal && macd.histogram < 0) {
    sellConfirmations += 1;
    reasons.push('✅ MACD هابط');
  }

  if (cvdStatus === 'rising') {
    buyConfirmations += 1;
    reasons.push('✅ ضغط شراء');
  } else if (cvdStatus === 'falling') {
    sellConfirmations += 1;
    reasons.push('✅ ضغط بيع');
  }

  if (priceAboveEMA) {
    buyConfirmations += 0.5;
    reasons.push('📍 فوق EMA200');
  } else {
    sellConfirmations += 0.5;
    reasons.push('📍 تحت EMA200');
  }

  if (nearVWAP) reasons.push('📍 قريب من VWAP');

  if (buyConfirmations > 0 && sellConfirmations > 0) {
    const mixRatio = Math.min(buyConfirmations, sellConfirmations) / Math.max(buyConfirmations, sellConfirmations);
    if (mixRatio > 0.5) {
      conflictPenalty += 1;
      reasons.push('⚠️ إشارات متضاربة');
    }
  }

  const netBuy = buyConfirmations - sellConfirmations * 0.3 - conflictPenalty;
  const netSell = sellConfirmations - buyConfirmations * 0.3 - conflictPenalty;

  const rawConfidence = (Math.max(netBuy, netSell) / 5.25) * 100;
  const confidence = Math.min(100, Math.max(0, Math.round(rawConfidence)));

  if (netBuy >= 2.5 && buyConfirmations >= 3 && conflictPenalty < 2) {
    reasons.unshift('🟢 إشارة شراء مؤكدة');
    return { confidence: Math.max(60, confidence), signalType: 'BUY', reasons };
  }

  if (netSell >= 2.5 && sellConfirmations >= 3 && conflictPenalty < 2) {
    reasons.unshift('🔴 إشارة بيع مؤكدة');
    return { confidence: Math.max(60, confidence), signalType: 'SELL', reasons };
  }

  reasons.unshift('⏳ انتظر تأكيد');
  return { confidence: Math.min(50, confidence), signalType: 'WAIT', reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'XAUUSD', timeframe = '15m' } = await req.json();

    const allowedIntervals = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d']);
    if (!allowedIntervals.has(timeframe)) {
      return new Response(JSON.stringify({ error: 'إطار زمني غير مدعوم' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔴 LIVE Analysis: ${symbol} on ${timeframe}`);

    let currentPrice: number | null = null;
    let priceChangePercent = 0;
    let dataSource = '';

    const isGold = symbol === 'XAUUSD';
    const isForex = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'].includes(symbol);

    // Fetch LIVE price
    if (isGold) {
      const goldData = await fetchGoldPriceLive();
      if (goldData) {
        currentPrice = goldData.price;
        priceChangePercent = goldData.change;
        dataSource = goldData.source;
      }
    } else if (isForex) {
      const forexData = await fetchForexPriceLive(symbol);
      if (forexData) {
        currentPrice = forexData.price;
        priceChangePercent = forexData.change;
        dataSource = forexData.source;
      }
    } else {
      const cryptoData = await fetchCryptoPriceLive(symbol);
      if (cryptoData) {
        currentPrice = cryptoData.price;
        priceChangePercent = cryptoData.change;
        dataSource = cryptoData.source;
      }
    }

    if (!currentPrice) {
      throw new Error('فشل في جلب السعر الحالي');
    }

    // Fetch LIVE klines
    const barSeconds = timeframeToSeconds(timeframe);
    const targetBars = Math.min(5000, Math.max(300, Math.ceil((30 * 86400) / barSeconds) + 250));
    const klines = await fetchKlinesLive(symbol, timeframe, targetBars);

    if (klines.length < 50) {
      throw new Error('بيانات غير كافية للتحليل');
    }

    console.log(`📊 Fetched ${klines.length} live bars for ${symbol}`);

    const closePrices = klines.map(k => parseFloat(k[4]));

    // Calculate indicators
    const ema50 = calculateEMA(closePrices, 50);
    const ema200 = calculateEMA(closePrices, 200);
    const vwap = calculateVWAP(klines.slice(-50));
    const rsi = calculateRSI(closePrices, 14);
    const macd = calculateMACD(closePrices);
    const cvdStatus = analyzeCVD(klines);
    const shortTermAnalysis = analyzeShortTermTrend(klines);

    const bollingerResult = detectBollingerSqueeze(closePrices);
    const volumeData = detectVolumeSpike(klines);
    const consolidationData = detectPriceConsolidation(klines);

    const bwSeries = calculateBandWidthSeries(klines, 20);
    const windowBars = Math.min(bwSeries.length, Math.ceil((30 * 86400) / barSeconds));
    const calibration = calculateDynamicSqueezeThreshold(bwSeries.slice(-windowBars).map(s => s.bandWidth));
    const calibratedSqueeze = bollingerResult.bandWidth > 0 && bollingerResult.bandWidth < calibration.threshold;

    const accumulation = detectAccumulationZone(klines, cvdStatus, calibratedSqueeze, volumeData, consolidationData, rsi, macd, bollingerResult.bandWidth);

    const priceAboveEMA = currentPrice > ema200;
    const vwapDistance = Math.abs((currentPrice - vwap) / vwap) * 100;
    const nearVWAP = vwapDistance <= 0.8;

    const { confidence, signalType, reasons } = calculateSignalConfidence(
      shortTermAnalysis.trend, rsi, macd, cvdStatus, nearVWAP, priceAboveEMA, ema50, ema200
    );

    const explosionTimer = computeExplosionTimer({
      klines,
      timeframe,
      latestBandWidth: bollingerResult.bandWidth,
      accumulation,
      volumeSpike: volumeData.spike,
      direction: accumulation.expectedDirection,
      cvdStatus,
      rsi,
      signalType,
    });

    // Recent candles
    const recentKlines = klines.slice(-5);
    const recentCandles = recentKlines.map(k => {
      const open = parseFloat(k[1]);
      const high = parseFloat(k[2]);
      const low = parseFloat(k[3]);
      const close = parseFloat(k[4]);
      let direction: 'bull' | 'bear' | 'doji' = 'doji';
      const body = Math.abs(close - open);
      const range = high - low;
      if (range > 0 && body / range < 0.1) direction = 'doji';
      else if (close > open) direction = 'bull';
      else if (close < open) direction = 'bear';
      return { time: new Date(Number(k[0])).toISOString(), open, high, low, close, direction };
    });

    const analysis: MarketAnalysis = {
      symbol,
      currentPrice,
      ema200,
      vwap,
      rsi,
      macd,
      trend: shortTermAnalysis.trend,
      shortTermTrend: shortTermAnalysis.trend,
      priceAboveEMA,
      nearVWAP,
      cvdStatus,
      isValidSetup: signalType !== 'WAIT',
      signalType,
      confidence,
      signalReasons: reasons,
      priceChange: priceChangePercent,
      timestamp: new Date().toISOString(),
      dataSource: `🔴 LIVE: ${dataSource}`,
      accumulation,
      bollingerSqueeze: calibratedSqueeze,
      volumeSpike: volumeData.spike,
      priceConsolidation: consolidationData.consolidation,
      realTimeMetrics: {
        avgVolume24h: volumeData.avgVolume,
        currentVolume: volumeData.recentVolume,
        volumeChangePercent: Math.round(((volumeData.ratio - 1) * 100) * 10) / 10,
        volatilityIndex: Math.round(bollingerResult.bandWidth * 10) / 10,
        priceRangePercent: Math.round(consolidationData.rangePercent * 100) / 100,
        bollingerWidth: Math.round(bollingerResult.bandWidth * 100) / 100,
      },
      explosionTimer,
      recentCandles,
    };

    console.log(`✅ Analysis complete: ${signalType} (${confidence}%)`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'حدث خطأ' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
