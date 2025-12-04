import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Binance symbols mapping for crypto
const symbolToBinance: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'bnb': 'BNBUSDT',
  'solana': 'SOLUSDT',
  'xrp': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'dogecoin': 'DOGEUSDT',
  'avalanche': 'AVAXUSDT',
  'polkadot': 'DOTUSDT',
  'polygon': 'MATICUSDT',
  'chainlink': 'LINKUSDT',
  'litecoin': 'LTCUSDT',
  'gold': 'PAXGUSDT',
  'toncoin': 'TONUSDT',
  'shiba': 'SHIBUSDT',
  'pepe': 'PEPEUSDT',
};

// Yahoo Finance symbols mapping for stocks and forex
const symbolToYahoo: Record<string, string> = {
  // US Stocks
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'TSLA': 'TSLA',
  'META': 'META',
  'NVDA': 'NVDA',
  'AMD': 'AMD',
  'NFLX': 'NFLX',
  'DIS': 'DIS',
  'BA': 'BA',
  'JPM': 'JPM',
  'V': 'V',
  'MA': 'MA',
  'JNJ': 'JNJ',
  'PG': 'PG',
  'KO': 'KO',
  'PEP': 'PEP',
  'WMT': 'WMT',
  'NKE': 'NKE',
  'SBUX': 'SBUX',
  'MCD': 'MCD',
  // Saudi stocks
  '2222': '2222.SR', // Aramco
  '1120': '1120.SR', // Al Rajhi
  '1180': '1180.SR', // Al Inma
  '2010': '2010.SR', // SABIC
  '7010': '7010.SR', // STC
  // Forex
  'EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'USDJPY': 'USDJPY=X',
  'AUDUSD': 'AUDUSD=X',
  'USDCAD': 'USDCAD=X',
  'USDCHF': 'USDCHF=X',
  'NZDUSD': 'NZDUSD=X',
  'EURGBP': 'EURGBP=X',
  'EURJPY': 'EURJPY=X',
  'GBPJPY': 'GBPJPY=X',
  // Commodities
  'XAUUSD': 'GC=F', // Gold futures
  'XAGUSD': 'SI=F', // Silver futures
  'WTICOUSD': 'CL=F', // Oil WTI
  'BRENTOIL': 'BZ=F', // Brent Oil
};

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const yahooSymbol = symbolToYahoo[symbol];
    if (!yahooSymbol) return null;

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Yahoo API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ? Number(price) : null;
  } catch (error) {
    console.error(`Error fetching Yahoo price for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔔 Checking price alerts...');

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return new Response(JSON.stringify({ message: 'No active alerts', checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${alerts.length} active alerts`);

    // Collect prices from different sources
    const priceMap: Record<string, number> = {};
    const symbolsToCheck = [...new Set(alerts.map(a => a.symbol))];

    // 1. Fetch Binance prices for crypto
    const binanceSymbols = symbolsToCheck.filter(s => symbolToBinance[s]);
    if (binanceSymbols.length > 0) {
      try {
        const symbolsParam = binanceSymbols.map(s => `"${symbolToBinance[s]}"`).join(',');
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbols=[${symbolsParam}]`
        );
        const priceData = await response.json();
        
        if (Array.isArray(priceData)) {
          for (const item of priceData) {
            const originalSymbol = Object.entries(symbolToBinance)
              .find(([_, v]) => v === item.symbol)?.[0];
            if (originalSymbol) {
              priceMap[originalSymbol] = parseFloat(item.price);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching Binance prices:', e);
      }
    }

    // 2. Fetch Yahoo prices for stocks and forex
    const yahooSymbols = symbolsToCheck.filter(s => symbolToYahoo[s] && !symbolToBinance[s]);
    for (const symbol of yahooSymbols) {
      const price = await fetchYahooPrice(symbol);
      if (price !== null) {
        priceMap[symbol] = price;
      }
    }

    console.log('Current prices:', priceMap);

    // Check each alert
    const triggeredAlerts: string[] = [];
    
    for (const alert of alerts) {
      const currentPrice = priceMap[alert.symbol];
      
      if (currentPrice === undefined) {
        console.log(`No price data for ${alert.symbol}`);
        continue;
      }

      const targetPrice = Number(alert.target_price);
      let triggered = false;

      if (alert.condition === 'above' && currentPrice >= targetPrice) {
        triggered = true;
        console.log(`🎯 Alert triggered: ${alert.symbol} is above ${targetPrice} (current: ${currentPrice})`);
      } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
        triggered = true;
        console.log(`🎯 Alert triggered: ${alert.symbol} is below ${targetPrice} (current: ${currentPrice})`);
      }

      if (triggered) {
        // Update alert as triggered
        const { error: updateError } = await supabase
          .from('price_alerts')
          .update({ triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        if (updateError) {
          console.error('Error updating alert:', updateError);
        } else {
          triggeredAlerts.push(alert.id);
          
          // Store notification for the user
          await supabase
            .from('user_notifications')
            .insert({
              user_id: alert.user_id,
              type: 'price_alert',
              title: `🔔 تنبيه سعري: ${alert.symbol_name_ar}`,
              body: `السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice} (الحالي: ${currentPrice.toFixed(2)})`,
              data: {
                alert_id: alert.id,
                symbol: alert.symbol,
                current_price: currentPrice,
                target_price: targetPrice,
                condition: alert.condition
              }
            });
          
          console.log(`✅ Notification created for user ${alert.user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Price check completed',
      checked: alerts.length,
      triggered: triggeredAlerts.length,
      triggered_ids: triggeredAlerts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-price-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
