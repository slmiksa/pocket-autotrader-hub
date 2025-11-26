import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface Zone {
  type: "supply" | "demand";
  upper_price: number;
  lower_price: number;
  strength_score: number;
  candle_index: number;
}

interface SwingPoint {
  type: "high" | "low";
  price: number;
  index: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { market, symbol, timeframe } = await req.json();

    console.log(`Analyzing ${market}:${symbol} on ${timeframe}`);

    // Fetch market data
    const candles = await fetchMarketData(market, symbol, timeframe);
    
    if (!candles || candles.length === 0) {
      throw new Error("Unable to fetch market data");
    }

    // Perform analysis
    const supplyZones = detectSupplyZones(candles);
    const demandZones = detectDemandZones(candles);
    const swingPoints = detectSwingPoints(candles);
    const trend = detectTrend(swingPoints);
    const currentPrice = candles[candles.length - 1].close;
    
    // Generate trade setup
    const tradeSetup = generateTradeSetup(
      currentPrice,
      supplyZones,
      demandZones,
      trend,
      candles
    );

    // Determine signal status
    const signalStatus = determineSignalStatus(tradeSetup, candles);

    return new Response(
      JSON.stringify({
        success: true,
        supplyZones: supplyZones.slice(0, 5), // Top 5 zones
        demandZones: demandZones.slice(0, 5),
        trend,
        currentPrice,
        tradeSetup,
        signalStatus,
        swingPoints: swingPoints.slice(-10), // Last 10 swing points
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Supply & Demand Analysis Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchMarketData(market: string, symbol: string, timeframe: string): Promise<Candle[]> {
  // Generate synthetic data for demonstration
  // In production, integrate with real APIs like Alpha Vantage, Binance, etc.
  
  const candles: Candle[] = [];
  const numCandles = 200;
  let basePrice = 1.1000;
  
  // Adjust base price for different markets
  if (market === "crypto" && symbol.includes("BTC")) {
    basePrice = 88000;
  } else if (market === "stocks") {
    basePrice = 150;
  } else if (market === "metals" && symbol.includes("GOLD")) {
    basePrice = 2050;
  }

  for (let i = 0; i < numCandles; i++) {
    const volatility = basePrice * 0.002;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    candles.push({
      time: Date.now() - (numCandles - i) * 3600000,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000
    });

    basePrice = close; // Trend continuation
  }

  return candles;
}

function detectDemandZones(candles: Candle[]): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 3; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const next = candles[i + 1];
    
    // Look for bullish reversal
    const isPrevDown = prev.close < prev.open;
    const isCurrBullish = curr.close > curr.open;
    const strongReaction = curr.close > candles[i - 2].high;
    
    if (isPrevDown && isCurrBullish && strongReaction) {
      const lower_price = Math.min(curr.low, prev.low);
      const upper_price = Math.min(curr.open, prev.close);
      
      // Calculate strength based on volume and movement
      const priceMove = (curr.close - curr.low) / curr.low;
      const strength_score = Math.min(10, priceMove * 1000);
      
      zones.push({
        type: "demand",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i
      });
    }
  }
  
  // Sort by strength
  return zones.sort((a, b) => b.strength_score - a.strength_score);
}

function detectSupplyZones(candles: Candle[]): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 3; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    
    // Look for bearish reversal
    const isPrevUp = prev.close > prev.open;
    const isCurrBearish = curr.close < curr.open;
    const strongReaction = curr.close < candles[i - 2].low;
    
    if (isPrevUp && isCurrBearish && strongReaction) {
      const upper_price = Math.max(curr.high, prev.high);
      const lower_price = Math.max(curr.open, prev.close);
      
      // Calculate strength
      const priceMove = (curr.high - curr.close) / curr.high;
      const strength_score = Math.min(10, priceMove * 1000);
      
      zones.push({
        type: "supply",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i
      });
    }
  }
  
  return zones.sort((a, b) => b.strength_score - a.strength_score);
}

function detectSwingPoints(candles: Candle[]): SwingPoint[] {
  const swings: SwingPoint[] = [];
  const lookback = 5;
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const curr = candles[i];
    
    // Check for swing high
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high >= curr.high) {
        isSwingHigh = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      swings.push({ type: "high", price: curr.high, index: i });
    }
    
    // Check for swing low
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low <= curr.low) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingLow) {
      swings.push({ type: "low", price: curr.low, index: i });
    }
  }
  
  return swings;
}

function detectTrend(swingPoints: SwingPoint[]): string {
  if (swingPoints.length < 4) return "Sideways";
  
  const recentSwings = swingPoints.slice(-4);
  const highs = recentSwings.filter(s => s.type === "high");
  const lows = recentSwings.filter(s => s.type === "low");
  
  if (highs.length >= 2 && lows.length >= 2) {
    const highsRising = highs[highs.length - 1].price > highs[highs.length - 2].price;
    const lowsRising = lows[lows.length - 1].price > lows[lows.length - 2].price;
    
    if (highsRising && lowsRising) return "Uptrend";
    
    const highsFalling = highs[highs.length - 1].price < highs[highs.length - 2].price;
    const lowsFalling = lows[lows.length - 1].price < lows[lows.length - 2].price;
    
    if (highsFalling && lowsFalling) return "Downtrend";
  }
  
  return "Sideways";
}

function generateTradeSetup(
  currentPrice: number,
  supplyZones: Zone[],
  demandZones: Zone[],
  trend: string,
  candles: Candle[]
) {
  // Find nearest zones
  const nearestSupply = supplyZones.find(z => z.lower_price > currentPrice);
  const nearestDemand = demandZones.find(z => z.upper_price < currentPrice);
  
  // Check for buy setup near demand zone
  if (nearestDemand && Math.abs(currentPrice - nearestDemand.upper_price) / currentPrice < 0.01) {
    const entry = nearestDemand.upper_price;
    const stopLoss = nearestDemand.lower_price - (nearestDemand.upper_price - nearestDemand.lower_price) * 0.1;
    const riskAmount = entry - stopLoss;
    const takeProfit1 = nearestSupply ? nearestSupply.lower_price : entry + riskAmount * 1.5;
    const takeProfit2 = entry + riskAmount * 1.5;
    
    // Check for price action confirmation
    const lastCandle = candles[candles.length - 1];
    const hasPriceAction = checkPriceActionConfirmation(lastCandle, candles[candles.length - 2]);
    
    return {
      type: "BUY" as const,
      entry,
      stopLoss,
      takeProfit1,
      takeProfit2,
      reason: `السعر يلامس منطقة طلب قوية (${nearestDemand.strength_score.toFixed(1)}) ${hasPriceAction ? "+ تأكيد من Price Action" : ""}`
    };
  }
  
  // Check for sell setup near supply zone
  if (nearestSupply && Math.abs(currentPrice - nearestSupply.lower_price) / currentPrice < 0.01) {
    const entry = nearestSupply.lower_price;
    const stopLoss = nearestSupply.upper_price + (nearestSupply.upper_price - nearestSupply.lower_price) * 0.1;
    const riskAmount = stopLoss - entry;
    const takeProfit1 = nearestDemand ? nearestDemand.upper_price : entry - riskAmount * 1.5;
    const takeProfit2 = entry - riskAmount * 1.5;
    
    const lastCandle = candles[candles.length - 1];
    const hasPriceAction = checkPriceActionConfirmation(lastCandle, candles[candles.length - 2]);
    
    return {
      type: "SELL" as const,
      entry,
      stopLoss,
      takeProfit1,
      takeProfit2,
      reason: `السعر يلامس منطقة عرض قوية (${nearestSupply.strength_score.toFixed(1)}) ${hasPriceAction ? "+ تأكيد من Price Action" : ""}`
    };
  }
  
  return null;
}

function checkPriceActionConfirmation(current: Candle, previous: Candle): boolean {
  // Pin bar detection
  const bodySize = Math.abs(current.close - current.open);
  const totalSize = current.high - current.low;
  const isPinBar = bodySize < totalSize * 0.3;
  
  // Engulfing pattern
  const isEngulfing = 
    (current.close > current.open && previous.close < previous.open &&
     current.close > previous.open && current.open < previous.close) ||
    (current.close < current.open && previous.close > previous.open &&
     current.close < previous.open && current.open > previous.close);
  
  return isPinBar || isEngulfing;
}

function determineSignalStatus(tradeSetup: any, candles: Candle[]): "READY" | "WAITING" | "NOT_VALID" {
  if (!tradeSetup) return "WAITING";
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const hasPriceAction = checkPriceActionConfirmation(lastCandle, prevCandle);
  
  if (hasPriceAction) return "READY";
  
  return "WAITING";
}
