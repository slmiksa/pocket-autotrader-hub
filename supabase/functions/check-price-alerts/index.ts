import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Binance symbols mapping
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
};

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

    // Get unique symbols that have Binance support
    const symbolsToCheck = [...new Set(alerts.map(a => a.symbol))];
    const binanceSymbols = symbolsToCheck
      .filter(s => symbolToBinance[s])
      .map(s => symbolToBinance[s]);

    // Fetch current prices from Binance
    const priceMap: Record<string, number> = {};
    
    if (binanceSymbols.length > 0) {
      try {
        const symbolsParam = binanceSymbols.map(s => `"${s}"`).join(',');
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbols=[${symbolsParam}]`
        );
        const priceData = await response.json();
        
        if (Array.isArray(priceData)) {
          for (const item of priceData) {
            // Find original symbol from Binance symbol
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
              title: `تنبيه سعري: ${alert.symbol_name_ar}`,
              body: `${alert.condition === 'above' ? 'صعد' : 'هبط'} السعر ${alert.condition === 'above' ? 'فوق' : 'تحت'} ${targetPrice}`,
              data: {
                alert_id: alert.id,
                symbol: alert.symbol,
                current_price: currentPrice,
                target_price: targetPrice,
                condition: alert.condition
              }
            });
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
