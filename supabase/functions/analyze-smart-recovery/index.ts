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
  priceAboveEMA: boolean;
  nearVWAP: boolean;
  cvdStatus: 'rising' | 'falling' | 'flat';
  isValidSetup: boolean;
  signalType: 'BUY' | 'SELL' | 'NONE';
  timestamp: string;
}

// Fetch price from Binance API
async function fetchBinancePrice(symbol: string): Promise<number | null> {
  try {
    const binanceSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : symbol.replace('/', '');
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    if (response.ok) {
      const data = await response.json();
      return parseFloat(data.price);
    }
  } catch (error) {
    console.error('Binance fetch error:', error);
  }
  return null;
}

// Fetch historical klines for EMA calculation
async function fetchKlines(symbol: string, interval: string = '15m', limit: number = 250): Promise<number[]> {
  try {
    const binanceSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : symbol.replace('/', '');
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.map((k: any[]) => parseFloat(k[4])); // Close prices
    }
  } catch (error) {
    console.error('Klines fetch error:', error);
  }
  return [];
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

// Analyze CVD trend (simplified using price momentum)
function analyzeCVD(prices: number[]): 'rising' | 'falling' | 'flat' {
  if (prices.length < 20) return 'flat';
  
  const recent = prices.slice(-10);
  const older = prices.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change > 0.1) return 'rising';
  if (change < -0.1) return 'falling';
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
    const cvdStatus = analyzeCVD(closePrices);

    // Determine trend
    const priceAboveEMA = currentPrice > ema200;
    const trend = priceAboveEMA ? 'bullish' : currentPrice < ema200 ? 'bearish' : 'neutral';

    // Check if price is near VWAP (within 0.2%)
    const vwapDistance = Math.abs((currentPrice - vwap) / vwap) * 100;
    const nearVWAP = vwapDistance <= 0.5;

    // Determine if setup is valid
    let isValidSetup = false;
    let signalType: 'BUY' | 'SELL' | 'NONE' = 'NONE';

    if (trend === 'bullish' && nearVWAP && (cvdStatus === 'rising' || cvdStatus === 'flat')) {
      isValidSetup = true;
      signalType = 'BUY';
    } else if (trend === 'bearish' && nearVWAP && (cvdStatus === 'falling' || cvdStatus === 'flat')) {
      isValidSetup = true;
      signalType = 'SELL';
    }

    const analysis: MarketAnalysis = {
      symbol,
      currentPrice,
      ema200,
      vwap,
      trend,
      priceAboveEMA,
      nearVWAP,
      cvdStatus,
      isValidSetup,
      signalType,
      timestamp: new Date().toISOString()
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
