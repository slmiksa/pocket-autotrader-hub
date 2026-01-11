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
  volume: number;
}

interface Zone {
  type: "supply" | "demand";
  upper_price: number;
  lower_price: number;
  strength_score: number;
  candle_index: number;
  distance_percent: number;
  grade: string; // A+, A, B, C
  touches: number;
  freshness: string;
  volume_confirmation: boolean;
}

interface SwingPoint {
  type: "high" | "low";
  price: number;
  index: number;
}

// =================== LIVE DATA FETCHERS ===================

async function fetchCryptoLiveData(symbol: string, timeframe: string): Promise<Candle[]> {
  try {
    // Convert symbol to Binance format (e.g., BTCUSD -> BTCUSDT)
    let binanceSymbol = symbol.toUpperCase();
    if (binanceSymbol.endsWith("USD")) {
      binanceSymbol = binanceSymbol.replace("USD", "USDT");
    }

    // Convert timeframe to Binance format
    const intervalMap: Record<string, string> = {
      "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
      "1H": "1h", "4H": "4h", "1D": "1d"
    };
    const interval = intervalMap[timeframe] || "1h";

    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=300`;
    console.log(`🔴 Fetching LIVE Crypto data: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    const candles: Candle[] = data.map((k: any[]) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));

    console.log(`✅ Got ${candles.length} LIVE candles for ${binanceSymbol}`);
    return candles;
  } catch (error) {
    console.error("Crypto data fetch error:", error);
    throw error;
  }
}

async function fetchForexLiveData(symbol: string, timeframe: string): Promise<Candle[]> {
  try {
    // Use Yahoo Finance for forex
    const yahooSymbol = `${symbol.substring(0, 3)}${symbol.substring(3)}=X`;
    
    // Map timeframe to Yahoo interval
    const intervalMap: Record<string, { interval: string; range: string }> = {
      "1m": { interval: "1m", range: "1d" },
      "5m": { interval: "5m", range: "5d" },
      "15m": { interval: "15m", range: "5d" },
      "30m": { interval: "30m", range: "5d" },
      "1H": { interval: "1h", range: "1mo" },
      "4H": { interval: "1h", range: "3mo" }, // Yahoo doesn't have 4h, we'll aggregate
      "1D": { interval: "1d", range: "1y" }
    };
    
    const { interval, range } = intervalMap[timeframe] || { interval: "1h", range: "1mo" };
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    console.log(`🔴 Fetching LIVE Forex data: ${yahooSymbol}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.indicators?.quote?.[0]) {
      throw new Error("No data from Yahoo Finance");
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        candles.push({
          time: timestamps[i] * 1000,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0
        });
      }
    }

    // If 4H timeframe, aggregate hourly candles
    if (timeframe === "4H" && candles.length > 0) {
      const aggregated: Candle[] = [];
      for (let i = 0; i < candles.length; i += 4) {
        const chunk = candles.slice(i, Math.min(i + 4, candles.length));
        if (chunk.length > 0) {
          aggregated.push({
            time: chunk[0].time,
            open: chunk[0].open,
            high: Math.max(...chunk.map(c => c.high)),
            low: Math.min(...chunk.map(c => c.low)),
            close: chunk[chunk.length - 1].close,
            volume: chunk.reduce((sum, c) => sum + c.volume, 0)
          });
        }
      }
      console.log(`✅ Got ${aggregated.length} LIVE 4H candles for ${symbol}`);
      return aggregated;
    }

    console.log(`✅ Got ${candles.length} LIVE candles for ${symbol}`);
    return candles;
  } catch (error) {
    console.error("Forex data fetch error:", error);
    throw error;
  }
}

async function fetchMetalLiveData(symbol: string, timeframe: string): Promise<Candle[]> {
  try {
    // Map metal symbols to Yahoo format
    const symbolMap: Record<string, string> = {
      "XAUUSD": "GC=F", // Gold futures
      "XAGUSD": "SI=F", // Silver futures
      "XPTUSD": "PL=F", // Platinum futures
      "XPDUSD": "PA=F", // Palladium futures
      "XCUUSD": "HG=F"  // Copper futures
    };
    
    const yahooSymbol = symbolMap[symbol.toUpperCase()] || "GC=F";
    
    const intervalMap: Record<string, { interval: string; range: string }> = {
      "1m": { interval: "1m", range: "1d" },
      "5m": { interval: "5m", range: "5d" },
      "15m": { interval: "15m", range: "5d" },
      "30m": { interval: "30m", range: "5d" },
      "1H": { interval: "1h", range: "1mo" },
      "4H": { interval: "1h", range: "3mo" },
      "1D": { interval: "1d", range: "1y" }
    };
    
    const { interval, range } = intervalMap[timeframe] || { interval: "1h", range: "1mo" };
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    console.log(`🔴 Fetching LIVE Metals data: ${yahooSymbol}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.indicators?.quote?.[0]) {
      throw new Error("No data from Yahoo Finance");
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        candles.push({
          time: timestamps[i] * 1000,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0
        });
      }
    }

    // If 4H timeframe, aggregate
    if (timeframe === "4H" && candles.length > 0) {
      const aggregated: Candle[] = [];
      for (let i = 0; i < candles.length; i += 4) {
        const chunk = candles.slice(i, Math.min(i + 4, candles.length));
        if (chunk.length > 0) {
          aggregated.push({
            time: chunk[0].time,
            open: chunk[0].open,
            high: Math.max(...chunk.map(c => c.high)),
            low: Math.min(...chunk.map(c => c.low)),
            close: chunk[chunk.length - 1].close,
            volume: chunk.reduce((sum, c) => sum + c.volume, 0)
          });
        }
      }
      console.log(`✅ Got ${aggregated.length} LIVE 4H candles for ${symbol}`);
      return aggregated;
    }

    console.log(`✅ Got ${candles.length} LIVE candles for ${symbol}`);
    return candles;
  } catch (error) {
    console.error("Metal data fetch error:", error);
    throw error;
  }
}

async function fetchStockLiveData(symbol: string, timeframe: string): Promise<Candle[]> {
  try {
    const intervalMap: Record<string, { interval: string; range: string }> = {
      "1m": { interval: "1m", range: "1d" },
      "5m": { interval: "5m", range: "5d" },
      "15m": { interval: "15m", range: "5d" },
      "30m": { interval: "30m", range: "5d" },
      "1H": { interval: "1h", range: "1mo" },
      "4H": { interval: "1h", range: "3mo" },
      "1D": { interval: "1d", range: "1y" }
    };
    
    const { interval, range } = intervalMap[timeframe] || { interval: "1h", range: "1mo" };
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    console.log(`🔴 Fetching LIVE Stock data: ${symbol}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.indicators?.quote?.[0]) {
      throw new Error("No data from Yahoo Finance");
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        candles.push({
          time: timestamps[i] * 1000,
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume?.[i] || 0
        });
      }
    }

    // If 4H timeframe, aggregate
    if (timeframe === "4H" && candles.length > 0) {
      const aggregated: Candle[] = [];
      for (let i = 0; i < candles.length; i += 4) {
        const chunk = candles.slice(i, Math.min(i + 4, candles.length));
        if (chunk.length > 0) {
          aggregated.push({
            time: chunk[0].time,
            open: chunk[0].open,
            high: Math.max(...chunk.map(c => c.high)),
            low: Math.min(...chunk.map(c => c.low)),
            close: chunk[chunk.length - 1].close,
            volume: chunk.reduce((sum, c) => sum + c.volume, 0)
          });
        }
      }
      console.log(`✅ Got ${aggregated.length} LIVE 4H candles for ${symbol}`);
      return aggregated;
    }

    console.log(`✅ Got ${candles.length} LIVE candles for ${symbol}`);
    return candles;
  } catch (error) {
    console.error("Stock data fetch error:", error);
    throw error;
  }
}

async function fetchLiveMarketData(market: string, symbol: string, timeframe: string): Promise<Candle[]> {
  console.log(`🔴 LIVE DATA FETCH: ${market} / ${symbol} / ${timeframe}`);
  
  switch (market.toLowerCase()) {
    case "crypto":
      return await fetchCryptoLiveData(symbol, timeframe);
    case "forex":
      return await fetchForexLiveData(symbol, timeframe);
    case "metals":
      return await fetchMetalLiveData(symbol, timeframe);
    case "stocks":
      return await fetchStockLiveData(symbol, timeframe);
    default:
      return await fetchForexLiveData(symbol, timeframe);
  }
}

// =================== ADVANCED ZONE DETECTION ===================

function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 0;
  
  let atrSum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1]?.close || candles[i].open;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    atrSum += tr;
  }
  
  return atrSum / period;
}

function calculateAverageVolume(candles: Candle[], period: number = 20): number {
  const recentCandles = candles.slice(-period);
  return recentCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / recentCandles.length;
}

function gradeZone(zone: Zone, candles: Candle[], atr: number, avgVolume: number): string {
  let score = 0;
  
  // Strength score contribution (0-3 points)
  if (zone.strength_score >= 8) score += 3;
  else if (zone.strength_score >= 6) score += 2;
  else if (zone.strength_score >= 4) score += 1;
  
  // Freshness contribution (0-2 points)
  const candlesSinceZone = candles.length - zone.candle_index;
  if (candlesSinceZone <= 20) score += 2;
  else if (candlesSinceZone <= 50) score += 1;
  
  // Volume confirmation (0-2 points)
  if (zone.volume_confirmation) score += 2;
  
  // Touches contribution - fewer is better (0-2 points)
  if (zone.touches <= 1) score += 2;
  else if (zone.touches === 2) score += 1;
  
  // Distance - closer zones get priority (0-1 point)
  if (zone.distance_percent < 1) score += 1;
  
  // Grade assignment
  if (score >= 8) return "A+";
  if (score >= 6) return "A";
  if (score >= 4) return "B";
  return "C";
}

function detectDemandZonesAdvanced(candles: Candle[], currentPrice: number, atr: number, avgVolume: number): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 5; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const prev3 = candles[i - 3];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // === PATTERN 1: Rally-Base-Rally (RBR) ===
    const isRBR = 
      prev2.close > prev2.open && // Rally
      Math.abs(prev.close - prev.open) < atr * 0.5 && // Base (small body)
      curr.close > curr.open && curr.close > prev.high; // Rally continuation
    
    // === PATTERN 2: Drop-Base-Rally (DBR) ===
    const isDBR = 
      prev2.close < prev2.open && // Drop
      prev.close < prev.open && // Continued drop
      Math.abs(curr.close - curr.open) < atr * 0.3 && // Base
      next1.close > next1.open && next1.close > curr.high; // Rally
    
    // === PATTERN 3: Strong Bullish Engulfing ===
    const isBullishEngulfing = 
      prev.close < prev.open && // Previous bearish
      curr.close > curr.open && // Current bullish
      curr.close > prev.open && curr.open < prev.close && // Engulfing
      (curr.close - curr.open) > (prev.open - prev.close) * 1.5; // Strong
    
    // === PATTERN 4: Pin Bar / Hammer ===
    const bodySize = Math.abs(curr.close - curr.open);
    const lowerWick = Math.min(curr.open, curr.close) - curr.low;
    const upperWick = curr.high - Math.max(curr.open, curr.close);
    const isPinBar = 
      lowerWick > bodySize * 2 && // Long lower wick
      upperWick < bodySize * 0.5 && // Small upper wick
      curr.close > curr.open; // Bullish
    
    if (isRBR || isDBR || isBullishEngulfing || isPinBar) {
      const lower_price = Math.min(curr.low, prev.low, prev2.low);
      const upper_price = Math.min(curr.open, prev.close);
      
      // Zone must be below current price
      if (upper_price >= currentPrice) continue;
      
      // Calculate volume spike
      const zoneVolume = curr.volume + prev.volume;
      const volumeConfirmation = zoneVolume > avgVolume * 1.5;
      
      // Calculate strength
      const priceMove = (curr.close - curr.low) / curr.low;
      const reactionStrength = (next1.close - curr.close) / curr.close;
      const patternBonus = isRBR ? 2 : (isDBR ? 1.5 : 1);
      const volumeBonus = volumeConfirmation ? 1.5 : 1;
      
      const strength_score = Math.min(10, 
        (priceMove * 300 + reactionStrength * 200 + patternBonus) * volumeBonus
      );
      
      const distance_percent = ((currentPrice - upper_price) / currentPrice) * 100;
      
      // Count touches (how many times price has tested this zone)
      let touches = 0;
      for (let j = i + 3; j < candles.length; j++) {
        if (candles[j].low <= upper_price && candles[j].low >= lower_price) {
          touches++;
        }
      }
      
      // Freshness
      const candlesSince = candles.length - i;
      const freshness = candlesSince <= 20 ? "جديدة" : (candlesSince <= 50 ? "نشطة" : "قديمة");
      
      zones.push({
        type: "demand",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i,
        distance_percent,
        grade: "", // Will be assigned later
        touches,
        freshness,
        volume_confirmation: volumeConfirmation
      });
    }
  }
  
  // Remove overlapping zones
  const filteredZones = removeOverlappingZones(zones);
  
  // Assign grades
  filteredZones.forEach(zone => {
    zone.grade = gradeZone(zone, candles, atr, avgVolume);
  });
  
  // Sort by grade then strength
  return filteredZones.sort((a, b) => {
    const gradeOrder: Record<string, number> = { "A+": 4, "A": 3, "B": 2, "C": 1 };
    const gradeCompare = (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0);
    if (gradeCompare !== 0) return gradeCompare;
    return b.strength_score - a.strength_score;
  });
}

function detectSupplyZonesAdvanced(candles: Candle[], currentPrice: number, atr: number, avgVolume: number): Zone[] {
  const zones: Zone[] = [];
  
  for (let i = 5; i < candles.length - 3; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // === PATTERN 1: Drop-Base-Drop (DBD) ===
    const isDBD = 
      prev2.close < prev2.open && // Drop
      Math.abs(prev.close - prev.open) < atr * 0.5 && // Base
      curr.close < curr.open && curr.close < prev.low; // Drop continuation
    
    // === PATTERN 2: Rally-Base-Drop (RBD) ===
    const isRBD = 
      prev2.close > prev2.open && // Rally
      prev.close > prev.open && // Continued rally
      Math.abs(curr.close - curr.open) < atr * 0.3 && // Base
      next1.close < next1.open && next1.close < curr.low; // Drop
    
    // === PATTERN 3: Strong Bearish Engulfing ===
    const isBearishEngulfing = 
      prev.close > prev.open && // Previous bullish
      curr.close < curr.open && // Current bearish
      curr.open > prev.close && curr.close < prev.open && // Engulfing
      (curr.open - curr.close) > (prev.close - prev.open) * 1.5; // Strong
    
    // === PATTERN 4: Shooting Star ===
    const bodySize = Math.abs(curr.close - curr.open);
    const upperWick = curr.high - Math.max(curr.open, curr.close);
    const lowerWick = Math.min(curr.open, curr.close) - curr.low;
    const isShootingStar = 
      upperWick > bodySize * 2 && // Long upper wick
      lowerWick < bodySize * 0.5 && // Small lower wick
      curr.close < curr.open; // Bearish
    
    if (isDBD || isRBD || isBearishEngulfing || isShootingStar) {
      const upper_price = Math.max(curr.high, prev.high, prev2.high);
      const lower_price = Math.max(curr.open, prev.close);
      
      // Zone must be above current price
      if (lower_price <= currentPrice) continue;
      
      // Calculate volume spike
      const zoneVolume = curr.volume + prev.volume;
      const volumeConfirmation = zoneVolume > avgVolume * 1.5;
      
      // Calculate strength
      const priceMove = (curr.high - curr.close) / curr.high;
      const reactionStrength = (curr.close - next1.close) / curr.close;
      const patternBonus = isDBD ? 2 : (isRBD ? 1.5 : 1);
      const volumeBonus = volumeConfirmation ? 1.5 : 1;
      
      const strength_score = Math.min(10, 
        (priceMove * 300 + reactionStrength * 200 + patternBonus) * volumeBonus
      );
      
      const distance_percent = ((lower_price - currentPrice) / currentPrice) * 100;
      
      // Count touches
      let touches = 0;
      for (let j = i + 3; j < candles.length; j++) {
        if (candles[j].high >= lower_price && candles[j].high <= upper_price) {
          touches++;
        }
      }
      
      const candlesSince = candles.length - i;
      const freshness = candlesSince <= 20 ? "جديدة" : (candlesSince <= 50 ? "نشطة" : "قديمة");
      
      zones.push({
        type: "supply",
        upper_price,
        lower_price,
        strength_score,
        candle_index: i,
        distance_percent,
        grade: "",
        touches,
        freshness,
        volume_confirmation: volumeConfirmation
      });
    }
  }
  
  const filteredZones = removeOverlappingZones(zones);
  
  filteredZones.forEach(zone => {
    zone.grade = gradeZone(zone, candles, atr, avgVolume);
  });
  
  return filteredZones.sort((a, b) => {
    const gradeOrder: Record<string, number> = { "A+": 4, "A": 3, "B": 2, "C": 1 };
    const gradeCompare = (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0);
    if (gradeCompare !== 0) return gradeCompare;
    return b.strength_score - a.strength_score;
  });
}

function removeOverlappingZones(zones: Zone[]): Zone[] {
  const sorted = [...zones].sort((a, b) => b.strength_score - a.strength_score);
  const result: Zone[] = [];
  
  for (const zone of sorted) {
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

// =================== TREND DETECTION ===================

function detectSwingPoints(candles: Candle[]): SwingPoint[] {
  const swings: SwingPoint[] = [];
  const lookback = 5;
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    const curr = candles[i];
    
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

function detectTrendAdvanced(candles: Candle[], swingPoints: SwingPoint[]): { 
  trend: string; 
  strength: number;
  description: string;
} {
  if (swingPoints.length < 4) {
    return { trend: "Sideways", strength: 0, description: "لا توجد بيانات كافية" };
  }
  
  const recentSwings = swingPoints.slice(-8);
  const highs = recentSwings.filter(s => s.type === "high");
  const lows = recentSwings.filter(s => s.type === "low");
  
  let uptrend = 0;
  let downtrend = 0;
  
  // Check higher highs and higher lows
  for (let i = 1; i < highs.length; i++) {
    if (highs[i].price > highs[i - 1].price) uptrend++;
    else if (highs[i].price < highs[i - 1].price) downtrend++;
  }
  
  for (let i = 1; i < lows.length; i++) {
    if (lows[i].price > lows[i - 1].price) uptrend++;
    else if (lows[i].price < lows[i - 1].price) downtrend++;
  }
  
  // Calculate EMA trend
  const ema20 = calculateEMA(candles.map(c => c.close), 20);
  const ema50 = calculateEMA(candles.map(c => c.close), 50);
  const currentPrice = candles[candles.length - 1].close;
  
  if (ema20[ema20.length - 1] > ema50[ema50.length - 1] && currentPrice > ema20[ema20.length - 1]) {
    uptrend += 2;
  } else if (ema20[ema20.length - 1] < ema50[ema50.length - 1] && currentPrice < ema20[ema20.length - 1]) {
    downtrend += 2;
  }
  
  const totalPoints = uptrend + downtrend;
  const strength = totalPoints > 0 ? Math.max(uptrend, downtrend) / totalPoints * 100 : 0;
  
  if (uptrend > downtrend + 1) {
    return { 
      trend: "Uptrend", 
      strength: Math.round(strength),
      description: `اتجاه صاعد - ${highs.length} قمم أعلى، ${lows.length} قيعان أعلى`
    };
  } else if (downtrend > uptrend + 1) {
    return { 
      trend: "Downtrend", 
      strength: Math.round(strength),
      description: `اتجاه هابط - قمم وقيعان أدنى`
    };
  }
  
  return { 
    trend: "Sideways", 
    strength: Math.round(100 - strength),
    description: "تذبذب عرضي - انتظر اختراق"
  };
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
    ema.push(sum / (i + 1));
  }
  
  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  
  return ema;
}

// =================== TRADE SETUP GENERATION ===================

function generateAdvancedTradeSetup(
  currentPrice: number,
  supplyZones: Zone[],
  demandZones: Zone[],
  trendInfo: { trend: string; strength: number },
  candles: Candle[],
  zoneDistance: string,
  atr: number
) {
  // Get A+ or A zones first
  const topSupply = supplyZones.find(z => z.grade === "A+" || z.grade === "A");
  const topDemand = demandZones.find(z => z.grade === "A+" || z.grade === "A");
  
  const nearestSupply = supplyZones[0];
  const nearestDemand = demandZones[0];
  
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  
  // Check price action confirmation
  const hasPinBar = checkPinBar(lastCandle);
  const hasEngulfing = checkEngulfing(lastCandle, prevCandle);
  const hasConfirmation = hasPinBar || hasEngulfing;
  
  // Calculate risk/reward
  const calculateRR = (entry: number, sl: number, tp: number) => 
    Math.abs(tp - entry) / Math.abs(entry - sl);
  
  // Prefer A+ zones with trend alignment
  if (zoneDistance === "near") {
    // BUY Setup
    if (nearestDemand && nearestDemand.distance_percent < 2) {
      const entry = nearestDemand.upper_price;
      const stopLoss = nearestDemand.lower_price - atr * 0.5;
      const riskAmount = entry - stopLoss;
      const takeProfit1 = entry + riskAmount * 2;
      const takeProfit2 = entry + riskAmount * 3;
      
      const rr = calculateRR(entry, stopLoss, takeProfit1);
      
      let confidence = nearestDemand.grade === "A+" ? "عالية جداً" : 
                       nearestDemand.grade === "A" ? "عالية" : 
                       nearestDemand.grade === "B" ? "متوسطة" : "منخفضة";
      
      if (trendInfo.trend === "Uptrend") confidence = confidence === "عالية جداً" ? "ممتازة" : "عالية جداً";
      
      return {
        type: "BUY" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة طلب ${nearestDemand.grade} (${nearestDemand.distance_percent.toFixed(2)}%) - ${nearestDemand.freshness}`,
        grade: nearestDemand.grade,
        confidence,
        riskReward: rr.toFixed(2),
        volumeConfirmed: nearestDemand.volume_confirmation,
        touches: nearestDemand.touches,
        priceActionConfirmation: hasConfirmation
      };
    }
    
    // SELL Setup
    if (nearestSupply && nearestSupply.distance_percent < 2) {
      const entry = nearestSupply.lower_price;
      const stopLoss = nearestSupply.upper_price + atr * 0.5;
      const riskAmount = stopLoss - entry;
      const takeProfit1 = entry - riskAmount * 2;
      const takeProfit2 = entry - riskAmount * 3;
      
      const rr = calculateRR(entry, stopLoss, takeProfit1);
      
      let confidence = nearestSupply.grade === "A+" ? "عالية جداً" : 
                       nearestSupply.grade === "A" ? "عالية" : 
                       nearestSupply.grade === "B" ? "متوسطة" : "منخفضة";
      
      if (trendInfo.trend === "Downtrend") confidence = confidence === "عالية جداً" ? "ممتازة" : "عالية جداً";
      
      return {
        type: "SELL" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة عرض ${nearestSupply.grade} (${nearestSupply.distance_percent.toFixed(2)}%) - ${nearestSupply.freshness}`,
        grade: nearestSupply.grade,
        confidence,
        riskReward: rr.toFixed(2),
        volumeConfirmed: nearestSupply.volume_confirmation,
        touches: nearestSupply.touches,
        priceActionConfirmation: hasConfirmation
      };
    }
  } else {
    // Far zones - prioritize trend alignment
    if (topDemand && trendInfo.trend === "Uptrend") {
      const entry = topDemand.upper_price;
      const stopLoss = topDemand.lower_price - atr;
      const riskAmount = entry - stopLoss;
      const takeProfit1 = entry + riskAmount * 2.5;
      const takeProfit2 = entry + riskAmount * 4;
      
      return {
        type: "BUY" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة طلب ${topDemand.grade} متوافقة مع الاتجاه الصاعد (${topDemand.distance_percent.toFixed(2)}%)`,
        grade: topDemand.grade,
        confidence: "عالية",
        riskReward: "2.5+",
        volumeConfirmed: topDemand.volume_confirmation,
        touches: topDemand.touches,
        priceActionConfirmation: false
      };
    }
    
    if (topSupply && trendInfo.trend === "Downtrend") {
      const entry = topSupply.lower_price;
      const stopLoss = topSupply.upper_price + atr;
      const riskAmount = stopLoss - entry;
      const takeProfit1 = entry - riskAmount * 2.5;
      const takeProfit2 = entry - riskAmount * 4;
      
      return {
        type: "SELL" as const,
        entry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        reason: `منطقة عرض ${topSupply.grade} متوافقة مع الاتجاه الهابط (${topSupply.distance_percent.toFixed(2)}%)`,
        grade: topSupply.grade,
        confidence: "عالية",
        riskReward: "2.5+",
        volumeConfirmed: topSupply.volume_confirmation,
        touches: topSupply.touches,
        priceActionConfirmation: false
      };
    }
  }
  
  return null;
}

function checkPinBar(candle: Candle): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const totalSize = candle.high - candle.low;
  if (totalSize === 0) return false;
  
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  
  return (lowerWick > bodySize * 2 || upperWick > bodySize * 2) && bodySize < totalSize * 0.3;
}

function checkEngulfing(current: Candle, previous: Candle): boolean {
  const bullishEngulfing = 
    previous.close < previous.open &&
    current.close > current.open &&
    current.close > previous.open &&
    current.open < previous.close;
  
  const bearishEngulfing = 
    previous.close > previous.open &&
    current.close < current.open &&
    current.open > previous.close &&
    current.close < previous.open;
  
  return bullishEngulfing || bearishEngulfing;
}

function getDistanceRange(zoneDistance: string): { minDistance: number; maxDistance: number } {
  if (zoneDistance === "near") {
    return { minDistance: 0.001, maxDistance: 0.02 };
  } else {
    return { minDistance: 0.02, maxDistance: 0.05 };
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
      distance = (zone.lower_price - currentPrice) / currentPrice;
    } else {
      distance = (currentPrice - zone.upper_price) / currentPrice;
    }
    
    zone.distance_percent = Math.abs(distance) * 100;
    
    return distance >= minDistance && distance <= maxDistance;
  }).sort((a, b) => a.distance_percent - b.distance_percent);
}

function determineSignalStatus(tradeSetup: any, candles: Candle[]): "READY" | "WAITING" | "NOT_VALID" {
  if (!tradeSetup) return "NOT_VALID";
  
  const lastCandle = candles[candles.length - 1];
  const currentPrice = lastCandle.close;
  
  // Check if price is at entry zone
  const entryZone = tradeSetup.entry;
  const tolerance = Math.abs(entryZone - currentPrice) / currentPrice;
  
  if (tolerance < 0.005 && tradeSetup.priceActionConfirmation) {
    return "READY";
  } else if (tolerance < 0.015) {
    return "WAITING";
  }
  
  return "WAITING";
}

// =================== MAIN HANDLER ===================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { market, symbol, timeframe, zoneDistance = "near" } = await req.json();

    console.log(`🔴 LIVE Supply & Demand Analysis: ${market}:${symbol} on ${timeframe}`);

    // Fetch LIVE market data
    const candles = await fetchLiveMarketData(market, symbol, timeframe);
    
    if (!candles || candles.length < 50) {
      throw new Error("بيانات غير كافية - يرجى المحاولة مرة أخرى");
    }

    const currentPrice = candles[candles.length - 1].close;
    const atr = calculateATR(candles);
    const avgVolume = calculateAverageVolume(candles);

    console.log(`📊 Data: ${candles.length} candles, Price: ${currentPrice}, ATR: ${atr.toFixed(4)}`);

    // Detect zones with advanced patterns
    const allSupplyZones = detectSupplyZonesAdvanced(candles, currentPrice, atr, avgVolume);
    const allDemandZones = detectDemandZonesAdvanced(candles, currentPrice, atr, avgVolume);
    
    // Filter by distance
    const { minDistance, maxDistance } = getDistanceRange(zoneDistance);
    
    const supplyZones = filterZonesByDistance(allSupplyZones, currentPrice, minDistance, maxDistance, "supply");
    const demandZones = filterZonesByDistance(allDemandZones, currentPrice, minDistance, maxDistance, "demand");
    
    console.log(`📍 Zones: ${supplyZones.length} supply, ${demandZones.length} demand in range`);
    
    // Detect trend and swing points
    const swingPoints = detectSwingPoints(candles);
    const trendInfo = detectTrendAdvanced(candles, swingPoints);
    
    // Generate trade setup
    const tradeSetup = generateAdvancedTradeSetup(
      currentPrice,
      supplyZones,
      demandZones,
      trendInfo,
      candles,
      zoneDistance,
      atr
    );

    const signalStatus = determineSignalStatus(tradeSetup, candles);

    // A+ zones count
    const aPlusSupply = supplyZones.filter(z => z.grade === "A+").length;
    const aPlusDemand = demandZones.filter(z => z.grade === "A+").length;

    return new Response(
      JSON.stringify({
        success: true,
        dataSource: "🔴 LIVE",
        supplyZones: supplyZones.slice(0, 5),
        demandZones: demandZones.slice(0, 5),
        trend: trendInfo.trend,
        trendStrength: trendInfo.strength,
        trendDescription: trendInfo.description,
        currentPrice,
        tradeSetup,
        signalStatus,
        swingPoints: swingPoints.slice(-10),
        zoneDistance,
        stats: {
          totalCandles: candles.length,
          atr: atr.toFixed(4),
          avgVolume: Math.round(avgVolume),
          aPlusSupplyZones: aPlusSupply,
          aPlusDemandZones: aPlusDemand,
          lastUpdated: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('🔴 Supply & Demand Analysis Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ غير معروف"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
