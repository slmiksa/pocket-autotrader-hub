import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendWebPush(subscription: PushSubscription, payload: string): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return false;
    }

    // For simplicity, we'll use a basic fetch to the push endpoint
    // In production, you'd use a proper web-push library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload,
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending web push:', error);
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

    const now = new Date();
    let alertsSent = 0;

    // 1. Check for economic events coming up
    console.log('Checking economic events...');
    
    // Get users who have economic alerts enabled
    const { data: usersWithEconomicAlerts } = await supabase
      .from('profiles')
      .select('user_id, alert_before_minutes')
      .eq('economic_alerts_enabled', true);

    if (usersWithEconomicAlerts && usersWithEconomicAlerts.length > 0) {
      for (const user of usersWithEconomicAlerts) {
        const alertMinutes = user.alert_before_minutes || 15;
        const alertTime = new Date(now.getTime() + alertMinutes * 60 * 1000);
        
        // Find events that will happen at the alert time
        const { data: upcomingEvents } = await supabase
          .from('economic_events')
          .select('*')
          .gte('event_time', now.toISOString())
          .lte('event_time', alertTime.toISOString())
          .in('impact', ['high', 'medium']);

        if (upcomingEvents && upcomingEvents.length > 0) {
          for (const event of upcomingEvents) {
            // Get user's push subscriptions
            const { data: subscriptions } = await supabase
              .from('push_subscriptions')
              .select('endpoint, p256dh, auth')
              .eq('user_id', user.user_id);

            if (subscriptions && subscriptions.length > 0) {
              const payload = JSON.stringify({
                title: '📅 حدث اقتصادي قادم',
                body: `${event.title_ar} - ${event.impact === 'high' ? 'تأثير عالي' : 'تأثير متوسط'}`,
                icon: '/favicon.png',
                data: {
                  type: 'economic_event',
                  eventId: event.id
                }
              });

              for (const sub of subscriptions) {
                await sendWebPush(sub, payload);
                alertsSent++;
              }

              // Create notification in database
              await supabase.from('user_notifications').insert({
                user_id: user.user_id,
                type: 'economic_event',
                title: 'حدث اقتصادي قادم',
                body: `${event.title_ar} خلال ${alertMinutes} دقيقة`,
                data: { eventId: event.id }
              });
            }
          }
        }
      }
    }

    // 2. Check for market open/close alerts
    console.log('Checking market alerts...');
    
    const { data: usersWithMarketAlerts } = await supabase
      .from('profiles')
      .select('user_id, alert_before_minutes')
      .eq('market_alerts_enabled', true);

    if (usersWithMarketAlerts && usersWithMarketAlerts.length > 0) {
      // Get all market schedules
      const { data: markets } = await supabase
        .from('market_schedules')
        .select('*')
        .eq('is_active', true);

      if (markets) {
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getUTCDay()];
        const currentTimeMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

        for (const user of usersWithMarketAlerts) {
          const alertMinutes = user.alert_before_minutes || 15;

          // Get user's enabled markets
          const { data: userMarkets } = await supabase
            .from('user_market_preferences')
            .select('market_id')
            .eq('user_id', user.user_id)
            .eq('is_enabled', true);

          const enabledMarketIds = userMarkets?.map(m => m.market_id) || [];

          for (const market of markets) {
            // Skip if user hasn't enabled this market
            if (enabledMarketIds.length > 0 && !enabledMarketIds.includes(market.id)) continue;
            
            // Skip if market doesn't operate today
            if (!market.days_active.includes(currentDay)) continue;

            const [openHours, openMinutes] = market.open_time.split(':').map(Number);
            const [closeHours, closeMinutes] = market.close_time.split(':').map(Number);
            
            const openTimeMinutes = openHours * 60 + openMinutes;
            const closeTimeMinutes = closeHours * 60 + closeMinutes;

            // Check if we should alert for market open
            const timeToOpen = openTimeMinutes - currentTimeMinutes;
            if (timeToOpen > 0 && timeToOpen <= alertMinutes) {
              const { data: subscriptions } = await supabase
                .from('push_subscriptions')
                .select('endpoint, p256dh, auth')
                .eq('user_id', user.user_id);

              if (subscriptions && subscriptions.length > 0) {
                const payload = JSON.stringify({
                  title: '🔔 افتتاح سوق',
                  body: `${market.market_name_ar} سيفتح خلال ${timeToOpen} دقيقة`,
                  icon: '/favicon.png',
                  data: {
                    type: 'market_open',
                    marketId: market.id
                  }
                });

                for (const sub of subscriptions) {
                  await sendWebPush(sub, payload);
                  alertsSent++;
                }

                await supabase.from('user_notifications').insert({
                  user_id: user.user_id,
                  type: 'market_open',
                  title: 'افتتاح سوق',
                  body: `${market.market_name_ar} سيفتح خلال ${timeToOpen} دقيقة`,
                  data: { marketId: market.id }
                });
              }
            }

            // Check if we should alert for market close
            const timeToClose = closeTimeMinutes - currentTimeMinutes;
            if (timeToClose > 0 && timeToClose <= alertMinutes) {
              const { data: subscriptions } = await supabase
                .from('push_subscriptions')
                .select('endpoint, p256dh, auth')
                .eq('user_id', user.user_id);

              if (subscriptions && subscriptions.length > 0) {
                const payload = JSON.stringify({
                  title: '🔔 إغلاق سوق',
                  body: `${market.market_name_ar} سيغلق خلال ${timeToClose} دقيقة`,
                  icon: '/favicon.png',
                  data: {
                    type: 'market_close',
                    marketId: market.id
                  }
                });

                for (const sub of subscriptions) {
                  await sendWebPush(sub, payload);
                  alertsSent++;
                }

                await supabase.from('user_notifications').insert({
                  user_id: user.user_id,
                  type: 'market_close',
                  title: 'إغلاق سوق',
                  body: `${market.market_name_ar} سيغلق خلال ${timeToClose} دقيقة`,
                  data: { marketId: market.id }
                });
              }
            }
          }
        }
      }
    }

    console.log(`Sent ${alertsSent} alerts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error in send-scheduled-alerts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
