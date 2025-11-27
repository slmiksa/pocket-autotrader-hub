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
  distance_percent: number;
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
    const { market, symbol, timeframe, zoneDistance = "near" } = await req.json();

    console.log(`Analyzing ${market}:${symbol} on ${timeframe}, zoneDistance: ${zoneDistance}`);

    // Fetch market data
    const candles = await fetchMarketData(market, symbol, timeframe);
    
    if (!candles || candles.length === 0) {
      throw new Error("Unable to fetch market data");
    }

    const currentPrice = candles[candles.length - 1].close;

    // Perform analysis
    const allSupplyZones = detectSupplyZones(candles, currentPrice);
    const allDemandZones = detectDemandZones(candles, currentPrice);
    
    // Filter zones by distance
    const { minDistance, maxDistance } = getDistanceRange(zoneDistance);
    
    const supplyZones = filterZonesByDistance(allSupplyZones, currentPrice, minDistance, maxDistance, "supply");
    const demandZones = filterZonesByDistance(allDemandZones, currentPrice, minDistance, maxDistance, "demand");
    
    console.log(`Found ${supplyZones.length} supply zones and ${demandZones.length} demand zones in range ${minDistance*100}%-${maxDistance*100}%`);
    
    const swingPoints = detectSwingPoints(candles);
    const trend = detectTrend(swingPoints);
    
    // Generate trade setup with filtered zones
    const tradeSetup = generateTradeSetup(
      currentPrice,
      supplyZones,
      demandZones,
      trend,
      candles,
      zoneDistance
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
        zoneDistance,
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

function getDistanceRange(zoneDistance: string): { minDistance: number; maxDistance: number } {
  if (zoneDistance === "near") {
    return { minDistance: 0.001, maxDistance: 0.02 }; // 0.1% to 2%
  } else {
    return { minDistance: 0.02, maxDistance: 0.05 }; // 2% to 5%
  }
}

function filterZonesByDistance(
  zones: Zone[], 
  currentPrice: number, 
  minDistance: number, 
  maxDistance: number,
  zoneType: "supply" | "demand"
): Zone[] {
  return zones.filter(zone => {
    let distance: number;
    
    if (zoneType === "supply") {
      // Supply zones should be ABOVE current price
      distance = (zone.lower_price - currentPrice) / currentPrice;
    } else {
      // Demand zones should be BELOW current price
      distance = (currentPrice - zone.upper_price) / currentPrice;
    }
    
    zone.distance_percent = Math.abs(distance) * 100;
    
    // Only include zones in the right direction and within distance range
    return distance >= minDistance && distance <= maxDistance;
  }).sort((a, b) => {
    // Sort by closest first, then by strength
    const aDistance = a.distance_percent;
    const bDistance = b.distance_percent;
    if (Math.abs(aDistance - bDistance) < 0.5) {
      return b.strength_score - a.strength_score;
    }
    return aDistance - bDistance;
  });
}

async function fetchMarketData(market: string, symbol: string, timeframe: string): Promise<Candle[]> {
  // Generate more realistic synthetic data
  // In production, integrate with real APIs like Alpha Vantage, Binance, etc.
  
  const candles: Candle[] = [];
  const numCandles = 200;
  let basePrice = 1.1000;
  
  // Adjust base price for different markets
  if (market === "crypto") {
    if (symbol.includes("BTC")) {
      basePrice = 95000;
    } else if (symbol.includes("ETH")) {
      basePrice = 3500;
    } else {
      basePrice = 100;
    }
  } else if (market === "stocks") {
    basePrice = 150;
  } else if (market === "metals") {
    if (symbol.includes("XAU") || symbol.includes("GOLD")) {
      basePrice = 2650;
    } else if (symbol.includes("XAG") || symbol.includes("SILVER")) {
      basePrice = 31;
    } else {
      basePrice = 1000;
    }
  }

  // Create more realistic price movements with trends
  let trendDirection = Math.random() > 0.5 ? 1 : -1;
  let trendStrength = 0.0002;
  
  for (let i = 0; i < numCandles; i++) {
    // Change trend occasionally
    if (i % 30 === 0) {
      trendDirection = Math.random() > 0.5 ? 1 : -1;
      trendStrength = 0.0001 + Math.random() * 0.0003;
    }
    
    const volatility = basePrice * 0.003;
    const trendBias = trendDirection * trendStrength * basePrice;
    
    const open = basePrice;
    const close = open + trendBias + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time: Date.now() - (numCandles - i) * 3600000,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000
    });

    basePrice = close;
  }

  return candles;
}

function detectDemandZones(candles: Candle[], currentPrice: number): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 5; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // Look for strong bullish reversal patterns
    const isPrevDown = prev.close < prev.open;
    const isPrev2Down = prev2.close < prev2.open;
    const isCurrBullish = curr.close > curr.open;
    
    // Strong move away from the zone
    const strongReaction = curr.close > Math.max(prev.high, prev2.high);
    const continuedMove = next1.close > curr.close && next2.close > next1.close;
    
    // Zone should be BELOW current price
    const zoneBelow = curr.low < currentPrice;
    
    if (isPrevDown && isPrev2Down && isCurrBullish && strongReaction && zoneBelow) {
      const lower_price = Math.min(curr.low, prev.low, prev2.low);
      const upper_price = Math.min(curr.open, prev.close);
      
      // Calculate strength based on multiple factors
      const priceMove = (curr.close - curr.low) / curr.low;
      const candleSize = (curr.high - curr.low) / curr.low;
      const moveConfirmation = continuedMove ? 2 : 1;
      const strength_score = Math.min(10, (priceMove * 500 + candleSize * 300) * moveConfirmation);
      
      // Calculate distance from current price
      const distance_percent = ((currentPrice - upper_price) / currentPrice) * 100;
      
      zones.push({
        type: "demand",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i,
        distance_percent
      });
    }
  }
  
  // Sort by strength and remove overlapping zones
  const sortedZones = zones.sort((a, b) => b.strength_score - a.strength_score);
  return removeOverlappingZones(sortedZones);
}

function detectSupplyZones(candles: Candle[], currentPrice: number): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 5; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // Look for strong bearish reversal patterns
    const isPrevUp = prev.close > prev.open;
    const isPrev2Up = prev2.close > prev2.open;
    const isCurrBearish = curr.close < curr.open;
    
    // Strong move away from the zone
    const strongReaction = curr.close < Math.min(prev.low, prev2.low);
    const continuedMove = next1.close < curr.close && next2.close < next1.close;
    
    // Zone should be ABOVE current price
    const zoneAbove = curr.high > currentPrice;
    
    if (isPrevUp && isPrev2Up && isCurrBearish && strongReaction && zoneAbove) {
      const upper_price = Math.max(curr.high, prev.high, prev2.high);
      const lower_price = Math.max(curr.open, prev.close);
      
      // Calculate strength
      const priceMove = (curr.high - curr.close) / curr.high;
      const candleSize = (curr.high - curr.low) / curr.high;
      const moveConfirmation = continuedMove ? 2 : 1;
      const strength_score = Math.min(10, (priceMove * 500 + candleSize * 300) * moveConfirmation);
      
      // Calculate distance from current price
      const distance_percent = ((lower_price - currentPrice) / currentPrice) * 100;
      
      zones.push({
        type: "supply",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i,
        distance_percent
      });
    }
  }
  
  const sortedZones = zones.sort((a, b) => b.strength_score - a.strength_score);
  return removeOverlappingZones(sortedZones);
}

function removeOverlappingZones(zones: Zone[]): Zone[] {
  const result: Zone[] = [];
  
  for (const zone of zones) {
    let overlaps = false;
    
    for (const existing of result) {
      const overlap = 
        (zone.lower_price <= existing.upper_price && zone.upper_price >= existing.lower_price);
      
      if (overlap) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      result.push(zone);
    }
  }
  
  return result;
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
  
  const recentSwings = swingPoints.slice(-6);
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
  candles: Candle[],
  zoneDistance: string
) {
  // Get the nearest valid zone
  const nearestSupply = supplyZones[0]; // Already sorted by distance
  const nearestDemand = demandZones[0];
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const hasPriceAction = checkPriceActionConfirmation(lastCandle, prevCandle);
  
  // For near zones, prioritize setups where price is approaching the zone
  if (zoneDistance === "near") {
    // Check for buy setup near demand zone
    if (nearestDemand && nearestDemand.distance_percent < 2) {
      const entry = nearestDemand.upper_price;
      const stopLoss = nearestDemand.lower_price - (nearestDemand.upper_price - nearestDemand.lower_price) * 0.2;
      const riskAmount = entry - stopLoss;
      const takeProfit1 = entry + riskAmount * 1.5;
      const takeProfit2 = entry + riskAmount * 2.5;
      
      return {
        type: "BUY" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة طلب قريبة (${nearestDemand.distance_percent.toFixed(2)}% بعيداً) - قوة: ${nearestDemand.strength_score.toFixed(1)} ${hasPriceAction ? "+ تأكيد Price Action" : ""}`
      };
    }
    
    // Check for sell setup near supply zone
    if (nearestSupply && nearestSupply.distance_percent < 2) {
      const entry = nearestSupply.lower_price;
      const stopLoss = nearestSupply.upper_price + (nearestSupply.upper_price - nearestSupply.lower_price) * 0.2;
      const riskAmount = stopLoss - entry;
      const takeProfit1 = entry - riskAmount * 1.5;
      const takeProfit2 = entry - riskAmount * 2.5;
      
      return {
        type: "SELL" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة عرض قريبة (${nearestSupply.distance_percent.toFixed(2)}% بعيداً) - قوة: ${nearestSupply.strength_score.toFixed(1)} ${hasPriceAction ? "+ تأكيد Price Action" : ""}`
      };
    }
  } else {
    // For far zones, look for stronger zones with trend alignment
    if (nearestDemand && trend === "Uptrend") {
      const entry = nearestDemand.upper_price;
      const stopLoss = nearestDemand.lower_price - (nearestDemand.upper_price - nearestDemand.lower_price) * 0.3;
      const riskAmount = entry - stopLoss;
      const takeProfit1 = entry + riskAmount * 2;
      const takeProfit2 = entry + riskAmount * 3;
      
      return {
        type: "BUY" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة طلب بعيدة (${nearestDemand.distance_percent.toFixed(2)}%) متوافقة مع الاتجاه الصاعد - قوة: ${nearestDemand.strength_score.toFixed(1)}`
      };
    }
    
    if (nearestSupply && trend === "Downtrend") {
      const entry = nearestSupply.lower_price;
      const stopLoss = nearestSupply.upper_price + (nearestSupply.upper_price - nearestSupply.lower_price) * 0.3;
      const riskAmount = stopLoss - entry;
      const takeProfit1 = entry - riskAmount * 2;
      const takeProfit2 = entry - riskAmount * 3;
      
      return {
        type: "SELL" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة عرض بعيدة (${nearestSupply.distance_percent.toFixed(2)}%) متوافقة مع الاتجاه الهابط - قوة: ${nearestSupply.strength_score.toFixed(1)}`
      };
    }
  }
  
  return null;
}

function checkPriceActionConfirmation(current: Candle, previous: Candle): boolean {
  // Pin bar detection
  const bodySize = Math.abs(current.close - current.open);
  const totalSize = current.high - current.low;
  const isPinBar = bodySize < totalSize * 0.3 && totalSize > 0;
  
  // Engulfing pattern
  const isBullishEngulfing = 
    current.close > current.open && previous.close < previous.open &&
    current.close > previous.open && current.open < previous.close;
    
  const isBearishEngulfing =
    current.close < current.open && previous.close > previous.open &&
    current.close < previous.open && current.open > previous.close;
  
  return isPinBar || isBullishEngulfing || isBearishEngulfing;
}

function determineSignalStatus(tradeSetup: any, candles: Candle[]): "READY" | "WAITING" | "NOT_VALID" {
  if (!tradeSetup) return "WAITING";
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  const hasPriceAction = checkPriceActionConfirmation(lastCandle, prevCandle);
  
  if (hasPriceAction) return "READY";
  
  return "WAITING";
}