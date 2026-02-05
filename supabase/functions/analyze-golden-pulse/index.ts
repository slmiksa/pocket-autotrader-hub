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
   type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot';
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
 
 // Validate gold price is realistic (between 1500 and 5000 USD)
 function isValidGoldPrice(price: number): boolean {
   return typeof price === 'number' && isFinite(price) && price > 1500 && price < 5000;
 }
 
 // Fetch REAL gold data from Yahoo Finance
 async function fetchYahooGoldData(timeframe: string): Promise<{ 
   candles: CandleData[]; 
   currentPrice: number; 
   previousClose: number; 
   dailyHigh: number;
   dailyLow: number;
 } | null> {
   const config = yahooIntervalMap[timeframe] || yahooIntervalMap['5'];
   
   // Use XAUUSD=X for spot gold price
   const symbol = 'GC=F'; // Gold Futures - more reliable than XAUUSD=X
   const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${config.interval}&range=${config.range}&includePrePost=false`;
   
   console.log(`Fetching Yahoo Finance: ${url}`);
   
   try {
     const response = await fetch(url, {
       headers: {
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
         'Accept': 'application/json',
       },
     });
     
     if (!response.ok) {
       console.log(`Yahoo Finance HTTP error: ${response.status}`);
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
       console.log(`Yahoo Finance: Not enough candles (${candles.length})`);
       return null;
     }
     
     const currentPrice = meta.regularMarketPrice || candles[candles.length - 1].close;
     const previousClose = meta.previousClose || meta.chartPreviousClose || candles[0].open;
     const dailyHigh = meta.regularMarketDayHigh || Math.max(...candles.slice(-20).map(c => c.high));
     const dailyLow = meta.regularMarketDayLow || Math.min(...candles.slice(-20).map(c => c.low));
     
     console.log(`Yahoo Finance SUCCESS: ${candles.length} candles, price: ${currentPrice}`);
     
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
 
 // Fetch from Finnhub as backup
 async function fetchFinnhubData(timeframe: string): Promise<{ 
   candles: CandleData[]; 
   currentPrice: number; 
   previousClose: number;
   dailyHigh: number;
   dailyLow: number;
 } | null> {
   const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
   if (!FINNHUB_API_KEY) {
     console.log('Finnhub: No API key');
     return null;
   }
   
   const resolutionMap: Record<string, string> = {
     '1': '1', '5': '5', '15': '15', '30': '30', '60': '60', '240': '240', 'D': 'D'
   };
   const resolution = resolutionMap[timeframe] || '5';
   
   const now = Math.floor(Date.now() / 1000);
   const from = now - 7 * 24 * 60 * 60; // 7 days back
   
   const symbols = ['OANDA:XAU_USD', 'FOREXCOM:XAUUSD'];
   
   for (const symbol of symbols) {
     try {
       const url = `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`;
       console.log(`Trying Finnhub: ${symbol}`);
       
       const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
       
       if (!response.ok) continue;
       
       const data = await response.json();
       
       if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length < 20) continue;
       
       const candles: CandleData[] = [];
       
       for (let i = 0; i < data.t.length; i++) {
         const close = data.c[i];
         if (!isValidGoldPrice(close)) continue;
         
         candles.push({
           time: data.t[i],
           open: data.o[i],
           high: data.h[i],
           low: data.l[i],
           close,
           volume: data.v?.[i] || 0,
         });
       }
       
       if (candles.length >= 20) {
         const currentPrice = candles[candles.length - 1].close;
         console.log(`Finnhub SUCCESS: ${candles.length} candles, price: ${currentPrice}`);
         
         return {
           candles,
           currentPrice,
           previousClose: candles[0].open,
           dailyHigh: Math.max(...candles.slice(-20).map(c => c.high)),
           dailyLow: Math.min(...candles.slice(-20).map(c => c.low)),
         };
       }
     } catch (e) {
       console.log(`Finnhub ${symbol} error:`, e);
     }
   }
   
   return null;
 }
 
 // Calculate Standard Pivot Points based on daily H/L/C
 function calculateDailyPivots(high: number, low: number, close: number): {
   pivot: number;
   r1: number; r2: number; r3: number;
   s1: number; s2: number; s3: number;
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
 
 // Calculate trading levels from REAL data - STABLE, not changing every second
 function calculateTradingLevels(
   candles: CandleData[], 
   currentPrice: number,
   dailyHigh: number,
   dailyLow: number
 ): TradingLevel[] {
   const levels: TradingLevel[] = [];
   
   // Get previous day's close for pivot calculation
   const previousClose = candles.length > 1 ? candles[candles.length - 2].close : currentPrice;
   
   // Calculate Standard Pivot Points from daily data
   const pivots = calculateDailyPivots(dailyHigh, dailyLow, previousClose);
   
   // Calculate ATR for entry offset
   const atr = candles.slice(-14).reduce((sum, c, i, arr) => {
     if (i === 0) return sum;
     const prev = arr[i - 1];
     const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
     return sum + tr;
   }, 0) / 13;
   
   // R3 - Resistance 3
   levels.push({
     price: pivots.r3,
     type: 'resistance',
     label: `R3: ${pivots.r3.toFixed(2)}`,
     labelAr: `مقاومة 3: ${pivots.r3.toFixed(2)}`,
     color: '#EF4444',
     strength: 95,
   });
   
   // R2 - Resistance 2
   levels.push({
     price: pivots.r2,
     type: 'resistance',
     label: `R2: ${pivots.r2.toFixed(2)}`,
     labelAr: `مقاومة 2: ${pivots.r2.toFixed(2)}`,
     color: '#F97316',
     strength: 90,
   });
   
   // PUT Entry - slightly below R1
   const putEntry = pivots.r1 - atr * 0.2;
   levels.push({
     price: putEntry,
     type: 'put_entry',
     label: `PUT Entry: ${putEntry.toFixed(2)}`,
     labelAr: `دخول PUT: ${putEntry.toFixed(2)}`,
     color: '#DC2626',
     strength: 92,
   });
   
   // R1 - Resistance 1
   levels.push({
     price: pivots.r1,
     type: 'resistance',
     label: `R1: ${pivots.r1.toFixed(2)}`,
     labelAr: `مقاومة 1: ${pivots.r1.toFixed(2)}`,
     color: '#FBBF24',
     strength: 85,
   });
   
   // Pivot Point
   levels.push({
     price: pivots.pivot,
     type: 'pivot',
     label: `Pivot: ${pivots.pivot.toFixed(2)}`,
     labelAr: `المحور: ${pivots.pivot.toFixed(2)}`,
     color: '#A855F7',
     strength: 80,
   });
   
   // S1 - Support 1
   levels.push({
     price: pivots.s1,
     type: 'support',
     label: `S1: ${pivots.s1.toFixed(2)}`,
     labelAr: `دعم 1: ${pivots.s1.toFixed(2)}`,
     color: '#22C55E',
     strength: 85,
   });
   
   // CALL Entry - slightly above S1
   const callEntry = pivots.s1 + atr * 0.2;
   levels.push({
     price: callEntry,
     type: 'call_entry',
     label: `CALL Entry: ${callEntry.toFixed(2)}`,
     labelAr: `دخول CALL: ${callEntry.toFixed(2)}`,
     color: '#16A34A',
     strength: 92,
   });
   
   // S2 - Support 2
   levels.push({
     price: pivots.s2,
     type: 'support',
     label: `S2: ${pivots.s2.toFixed(2)}`,
     labelAr: `دعم 2: ${pivots.s2.toFixed(2)}`,
     color: '#10B981',
     strength: 90,
   });
   
   // S3 - Support 3
   levels.push({
     price: pivots.s3,
     type: 'support',
     label: `S3: ${pivots.s3.toFixed(2)}`,
     labelAr: `دعم 3: ${pivots.s3.toFixed(2)}`,
     color: '#059669',
     strength: 95,
   });
   
   // Target levels
   const targetUp1 = pivots.r1 + atr * 0.5;
   const targetUp2 = pivots.r2 + atr * 0.5;
   const targetDown1 = pivots.s1 - atr * 0.5;
   const targetDown2 = pivots.s2 - atr * 0.5;
   
   levels.push({
     price: targetUp1,
     type: 'target_up',
     label: `Target 1↑: ${targetUp1.toFixed(2)}`,
     labelAr: `هدف 1↑: ${targetUp1.toFixed(2)}`,
     color: '#22C55E',
     strength: 70,
   });
   
   levels.push({
     price: targetUp2,
     type: 'target_up',
     label: `Target 2↑: ${targetUp2.toFixed(2)}`,
     labelAr: `هدف 2↑: ${targetUp2.toFixed(2)}`,
     color: '#22C55E',
     strength: 65,
   });
   
   levels.push({
     price: targetDown1,
     type: 'target_down',
     label: `Target 1↓: ${targetDown1.toFixed(2)}`,
     labelAr: `هدف 1↓: ${targetDown1.toFixed(2)}`,
     color: '#EF4444',
     strength: 70,
   });
   
   levels.push({
     price: targetDown2,
     type: 'target_down',
     label: `Target 2↓: ${targetDown2.toFixed(2)}`,
     labelAr: `هدف 2↓: ${targetDown2.toFixed(2)}`,
     color: '#EF4444',
     strength: 65,
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
     const timeframe = url.searchParams.get('timeframe') || '5';
     
     console.log(`Golden Pulse analysis - Timeframe: ${timeframe}`);
     
     // Try Yahoo Finance first (most reliable for gold)
     let goldData = await fetchYahooGoldData(timeframe);
     let dataSource = 'yahoo-finance';
     
     // Fallback to Finnhub
     if (!goldData) {
       console.log('Yahoo Finance failed, trying Finnhub...');
       goldData = await fetchFinnhubData(timeframe);
       dataSource = 'finnhub';
     }
     
     // If all sources fail, return error instead of fake data
     if (!goldData) {
       console.error('All data sources failed - NOT returning fake data');
       return new Response(
         JSON.stringify({ 
           error: 'Unable to fetch real gold market data. Please try again.',
           errorAr: 'تعذر جلب بيانات سوق الذهب الحقيقية. يرجى المحاولة مرة أخرى.',
           timestamp: new Date().toISOString(),
           isLive: false,
         }),
         { 
           status: 503,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
         }
       );
     }
     
     const { candles, currentPrice, previousClose, dailyHigh, dailyLow } = goldData;
     
     // Calculate STABLE trading levels based on daily pivots
     const levels = calculateTradingLevels(candles, currentPrice, dailyHigh, dailyLow);
     
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
       isLive: true,
       dailyHigh,
       dailyLow,
     };
     
     console.log(`Analysis complete: ${candles.length} candles, ${levels.length} levels, source: ${dataSource}, price: ${currentPrice.toFixed(2)}`);
 
     return new Response(JSON.stringify(analysis), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
     });
   } catch (error) {
     console.error('Golden Pulse error:', error);
     return new Response(
       JSON.stringify({ 
         error: error instanceof Error ? error.message : 'Unknown error',
         timestamp: new Date().toISOString(),
         isLive: false,
       }),
       { 
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
       }
     );
   }
 });
