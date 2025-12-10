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
  user_id: string;
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Simple web push implementation using fetch
async function sendWebPush(
  subscription: PushSubscription, 
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    console.log(`Sending push to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    
    const payloadString = JSON.stringify(payload);
    
    // For FCM endpoints, we need proper VAPID headers
    // This is a simplified version - for production use web-push library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: payloadString,
    });

    if (!response.ok) {
      console.error(`Push failed with status: ${response.status}`);
      return false;
    }

    console.log('Push sent successfully');
    return true;
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
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    let alertsSent = 0;
    const notificationsCreated: string[] = [];

    // 1. Check for economic events coming up
    console.log('Checking economic events...');
    
    // Get users who have economic alerts enabled
    const { data: usersWithEconomicAlerts, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, alert_before_minutes')
      .eq('economic_alerts_enabled', true);

    if (usersError) {
      console.error('Error fetching users with economic alerts:', usersError);
    }

    console.log(`Found ${usersWithEconomicAlerts?.length || 0} users with economic alerts enabled`);

    if (usersWithEconomicAlerts && usersWithEconomicAlerts.length > 0) {
      for (const user of usersWithEconomicAlerts) {
        const alertMinutes = user.alert_before_minutes || 15;
        const alertTime = new Date(now.getTime() + alertMinutes * 60 * 1000);
        
        // Find events that will happen within the alert window
        const { data: upcomingEvents, error: eventsError } = await supabase
          .from('economic_events')
          .select('*')
          .gte('event_time', now.toISOString())
          .lte('event_time', alertTime.toISOString())
          .in('impact', ['high', 'medium']);

        if (eventsError) {
          console.error('Error fetching economic events:', eventsError);
          continue;
        }

        console.log(`Found ${upcomingEvents?.length || 0} upcoming events for user ${user.user_id}`);

        if (upcomingEvents && upcomingEvents.length > 0) {
          for (const event of upcomingEvents) {
            // Check if we already sent a notification for this event to this user
            const { data: existingNotif } = await supabase
              .from('user_notifications')
              .select('id')
              .eq('user_id', user.user_id)
              .eq('type', 'economic_event')
              .contains('data', { eventId: event.id })
              .single();

            if (existingNotif) {
              console.log(`Already sent notification for event ${event.id} to user ${user.user_id}`);
              continue;
            }

            // Get user's push subscriptions
            const { data: subscriptions } = await supabase
              .from('push_subscriptions')
              .select('endpoint, p256dh, auth, user_id')
              .eq('user_id', user.user_id);

            const eventTime = new Date(event.event_time);
            const minutesUntil = Math.round((eventTime.getTime() - now.getTime()) / 60000);
            
            const impactText = event.impact === 'high' ? '🔴 تأثير عالي' : '🟡 تأثير متوسط';
            const notificationPayload = {
              title: '📅 حدث اقتصادي قادم',
              body: `${event.title_ar} - ${impactText} - خلال ${minutesUntil} دقيقة`,
              icon: '/favicon.png',
              badge: '/favicon.png',
              tag: `economic-${event.id}`,
              data: {
                type: 'economic_event',
                eventId: event.id,
                url: '/economic-calendar'
              }
            };

            // Send push notifications
            if (subscriptions && subscriptions.length > 0) {
              for (const sub of subscriptions) {
                const success = await sendWebPush(sub, notificationPayload, vapidPublicKey, vapidPrivateKey);
                if (success) alertsSent++;
              }
            }

            // Create notification in database
            const { error: insertError } = await supabase.from('user_notifications').insert({
              user_id: user.user_id,
              type: 'economic_event',
              title: 'حدث اقتصادي قادم',
              body: `${event.title_ar} - ${impactText} - خلال ${minutesUntil} دقيقة`,
              data: { 
                eventId: event.id,
                impact: event.impact,
                currency: event.currency,
                country: event.country
              }
            });

            if (insertError) {
              console.error('Error inserting notification:', insertError);
            } else {
              notificationsCreated.push(event.id);
              console.log(`Created notification for event ${event.id}`);
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

    console.log(`Found ${usersWithMarketAlerts?.length || 0} users with market alerts enabled`);

    if (usersWithMarketAlerts && usersWithMarketAlerts.length > 0) {
      const { data: markets } = await supabase
        .from('market_schedules')
        .select('*')
        .eq('is_active', true);

      if (markets) {
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getUTCDay()];
        const currentTimeMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

        for (const user of usersWithMarketAlerts) {
          const alertMinutes = user.alert_before_minutes || 15;

          const { data: userMarkets } = await supabase
            .from('user_market_preferences')
            .select('market_id')
            .eq('user_id', user.user_id)
            .eq('is_enabled', true);

          const enabledMarketIds = userMarkets?.map(m => m.market_id) || [];

          for (const market of markets) {
            if (enabledMarketIds.length > 0 && !enabledMarketIds.includes(market.id)) continue;
            if (!market.days_active?.includes(currentDay)) continue;

            const [openHours, openMinutes] = market.open_time.split(':').map(Number);
            const [closeHours, closeMinutes] = market.close_time.split(':').map(Number);
            
            const openTimeMinutes = openHours * 60 + openMinutes;
            const closeTimeMinutes = closeHours * 60 + closeMinutes;

            const timeToOpen = openTimeMinutes - currentTimeMinutes;
            const today = now.toISOString().split('T')[0];

            // Check for market open
            if (timeToOpen > 0 && timeToOpen <= alertMinutes) {
              const { data: existingNotif } = await supabase
                .from('user_notifications')
                .select('id')
                .eq('user_id', user.user_id)
                .eq('type', 'market_open')
                .contains('data', { marketId: market.id, date: today })
                .single();

              if (!existingNotif) {
                const { data: subscriptions } = await supabase
                  .from('push_subscriptions')
                  .select('endpoint, p256dh, auth, user_id')
                  .eq('user_id', user.user_id);

                const payload = {
                  title: '🔔 افتتاح سوق',
                  body: `${market.market_name_ar} سيفتح خلال ${timeToOpen} دقيقة`,
                  icon: '/favicon.png',
                  badge: '/favicon.png',
                  tag: `market-open-${market.id}`,
                  data: { type: 'market_open', marketId: market.id }
                };

                if (subscriptions && subscriptions.length > 0) {
                  for (const sub of subscriptions) {
                    const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
                    if (success) alertsSent++;
                  }
                }

                await supabase.from('user_notifications').insert({
                  user_id: user.user_id,
                  type: 'market_open',
                  title: 'افتتاح سوق',
                  body: `${market.market_name_ar} سيفتح خلال ${timeToOpen} دقيقة`,
                  data: { marketId: market.id, date: today }
                });
              }
            }

            // Check for market close
            const timeToClose = closeTimeMinutes - currentTimeMinutes;
            if (timeToClose > 0 && timeToClose <= alertMinutes) {
              const { data: existingNotif } = await supabase
                .from('user_notifications')
                .select('id')
                .eq('user_id', user.user_id)
                .eq('type', 'market_close')
                .contains('data', { marketId: market.id, date: today })
                .single();

              if (!existingNotif) {
                const { data: subscriptions } = await supabase
                  .from('push_subscriptions')
                  .select('endpoint, p256dh, auth, user_id')
                  .eq('user_id', user.user_id);

                const payload = {
                  title: '🔔 إغلاق سوق',
                  body: `${market.market_name_ar} سيغلق خلال ${timeToClose} دقيقة`,
                  icon: '/favicon.png',
                  badge: '/favicon.png',
                  tag: `market-close-${market.id}`,
                  data: { type: 'market_close', marketId: market.id }
                };

                if (subscriptions && subscriptions.length > 0) {
                  for (const sub of subscriptions) {
                    const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
                    if (success) alertsSent++;
                  }
                }

                await supabase.from('user_notifications').insert({
                  user_id: user.user_id,
                  type: 'market_close',
                  title: 'إغلاق سوق',
                  body: `${market.market_name_ar} سيغلق خلال ${timeToClose} دقيقة`,
                  data: { marketId: market.id, date: today }
                });
              }
            }
          }
        }
      }
    }

    console.log(`Completed. Alerts sent: ${alertsSent}, Notifications created: ${notificationsCreated.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsSent,
        notificationsCreated: notificationsCreated.length,
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
