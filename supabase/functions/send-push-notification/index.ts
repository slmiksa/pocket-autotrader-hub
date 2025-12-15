import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  'shiba': 'SHIBUSDT',
  'pepe': 'PEPEUSDT',
};

// Send push notification using simple POST to endpoint
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, 
  payload: string
): Promise<boolean> {
  try {
    console.log('Sending push to:', subscription.endpoint.substring(0, 60) + '...');

    // Direct POST to push service endpoint
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: payload,
    });

    console.log('Push response status:', response.status);
    
    if (!response.ok && response.status !== 201) {
      const errorText = await response.text();
      console.error('Push error:', response.status, errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting price alert check...');

    // Fetch all active alerts
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
      return new Response(JSON.stringify({ message: 'No active alerts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${alerts.length} active alerts`);

    // Get unique symbols
    const symbols = [...new Set(alerts.map(a => a.symbol))];
    const binanceSymbols = symbols
      .filter(s => symbolToBinance[s])
      .map(s => symbolToBinance[s]);

    // Fetch prices from Binance
    const priceMap: Record<string, number> = {};
    
    if (binanceSymbols.length > 0) {
      const symbolsParam = binanceSymbols.map(s => `"${s}"`).join(',');
      const priceResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=[${symbolsParam}]`
      );
      const priceData = await priceResponse.json();

      if (Array.isArray(priceData)) {
        for (const item of priceData) {
          const originalSymbol = Object.entries(symbolToBinance)
            .find(([_, v]) => v === item.symbol)?.[0];
          if (originalSymbol) {
            priceMap[originalSymbol] = parseFloat(item.price);
          }
        }
      }
    }

    console.log('Current prices:', priceMap);

    let triggeredCount = 0;
    let pushSuccessCount = 0;

    // Check each alert
    for (const alert of alerts) {
      const currentPrice = priceMap[alert.symbol];
      if (currentPrice === undefined) continue;

      const targetPrice = Number(alert.target_price);
      let triggered = false;

      if (alert.condition === 'above' && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        console.log(`🎯 Alert triggered: ${alert.symbol} ${alert.condition} ${targetPrice} (current: ${currentPrice})`);

        // Update alert as triggered
        await supabase
          .from('price_alerts')
          .update({ triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        // Create notification in database
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

        // Send email notification if enabled
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, email_notifications_enabled')
            .eq('user_id', alert.user_id)
            .single();

          if (profile?.email && profile?.email_notifications_enabled) {
            const emailHtml = `
              <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">⚡ تنبيه سعري</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                  <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; text-align: center;">
                    <p style="font-size: 28px; font-weight: bold; color: #333; margin: 0;">${alert.symbol_name_ar}</p>
                    <p style="font-size: 18px; color: #666; margin: 15px 0;">السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice}</p>
                    <p style="font-size: 24px; color: #10b981; font-weight: bold; margin: 0;">السعر الحالي: ${currentPrice.toFixed(2)}</p>
                  </div>
                  <div style="text-align: center; margin-top: 25px;">
                    <a href="https://tifue.com/markets" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                      عرض الأسواق
                    </a>
                  </div>
                </div>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
              </div>
            `;

            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: "TIFUE SA <noreply@tifue.com>",
                  to: [profile.email],
                  subject: `⚡ تنبيه سعري: ${alert.symbol_name_ar}`,
                  html: emailHtml,
                }),
              });
              console.log(`Email notification sent for price alert to ${profile.email}`);
            } catch (emailError) {
              console.error('Error sending price alert email:', emailError);
            }
          }
        }

        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', alert.user_id);

        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `🔔 تنبيه سعري: ${alert.symbol_name_ar}`,
            body: `السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice} (الحالي: ${currentPrice.toFixed(2)})`,
            icon: '/favicon.png',
            badge: '/favicon.png',
            data: {
              url: '/markets',
              alert_id: alert.id,
            },
            requireInteraction: true,
            tag: `price-alert-${alert.id}`,
          });

          for (const sub of subscriptions) {
            const success = await sendWebPush({
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              }
            }, payload);
            
            if (success) pushSuccessCount++;
          }
        }

        triggeredCount++;
      }
    }

    console.log(`✅ Triggered ${triggeredCount} alerts, ${pushSuccessCount} push notifications sent`);

    return new Response(JSON.stringify({ 
      success: true, 
      checked: alerts.length,
      triggered: triggeredCount,
      pushSent: pushSuccessCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
