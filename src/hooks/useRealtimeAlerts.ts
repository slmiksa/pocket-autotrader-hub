import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserNotifications } from './useUserNotifications';
import { playNotificationSound } from '@/utils/soundNotification';
import type { Json } from '@/integrations/supabase/types';

interface UserPreferences {
  economic_alerts_enabled: boolean;
  market_alerts_enabled: boolean;
  alert_before_minutes: number;
}

interface EconomicEvent {
  id: string;
  title_ar: string;
  event_time: string;
  impact: string;
  currency: string;
  country: string;
}

interface MarketSchedule {
  id: string;
  market_name_ar: string;
  open_time: string;
  close_time: string;
  days_active: string[];
  timezone: string;
}

// Track already notified events to avoid duplicates
const notifiedEvents = new Set<string>();
const notifiedMarkets = new Set<string>();

export const useRealtimeAlerts = () => {
  const { sendBrowserNotification } = useUserNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const userPrefsRef = useRef<UserPreferences | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Create notification in database
  const createNotification = useCallback(async (
    userId: string,
    type: string,
    title: string,
    body: string,
    data: Json
  ) => {
    try {
      const { error } = await supabase.from('user_notifications').insert([{
        user_id: userId,
        type,
        title,
        body,
        data
      }]);
      if (error) console.error('Error creating notification:', error);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, []);

  // Check for upcoming economic events
  const checkEconomicEvents = useCallback(async () => {
    if (!userPrefsRef.current?.economic_alerts_enabled || !userIdRef.current) return;

    const alertMinutes = userPrefsRef.current.alert_before_minutes || 15;
    const now = new Date();
    const alertTime = new Date(now.getTime() + alertMinutes * 60 * 1000);

    try {
      const { data: events } = await supabase
        .from('economic_events')
        .select('*')
        .gte('event_time', now.toISOString())
        .lte('event_time', alertTime.toISOString())
        .in('impact', ['high', 'medium']);

      if (events && events.length > 0) {
        for (const event of events as EconomicEvent[]) {
          const notifKey = `economic-${event.id}-${userIdRef.current}`;
          
          if (!notifiedEvents.has(notifKey)) {
            notifiedEvents.add(notifKey);
            
            const eventTime = new Date(event.event_time);
            const minutesUntil = Math.round((eventTime.getTime() - now.getTime()) / 60000);
            const impactText = event.impact === 'high' ? '🔴 تأثير عالي' : '🟡 تأثير متوسط';
            
            const title = '📅 حدث اقتصادي قادم';
            const body = `${event.title_ar} - ${impactText} - خلال ${minutesUntil} دقيقة`;

            // Send browser notification immediately
            sendBrowserNotification(title, body);
            playNotificationSound();

            // Save to database
            await createNotification(
              userIdRef.current!,
              'economic_event',
              title,
              body,
              { eventId: event.id, impact: event.impact, currency: event.currency }
            );

            console.log('📅 Economic event alert sent:', event.title_ar);
          }
        }
      }
    } catch (error) {
      console.error('Error checking economic events:', error);
    }
  }, [sendBrowserNotification, createNotification]);

  // Check for market open/close
  const checkMarketAlerts = useCallback(async () => {
    if (!userPrefsRef.current?.market_alerts_enabled || !userIdRef.current) return;

    const alertMinutes = userPrefsRef.current.alert_before_minutes || 15;
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getUTCDay()];
    const currentTimeMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const today = now.toISOString().split('T')[0];

    try {
      // Get user's enabled markets
      const { data: userMarkets } = await supabase
        .from('user_market_preferences')
        .select('market_id')
        .eq('user_id', userIdRef.current)
        .eq('is_enabled', true);

      const enabledMarketIds = userMarkets?.map(m => m.market_id) || [];

      const { data: markets } = await supabase
        .from('market_schedules')
        .select('*')
        .eq('is_active', true);

      if (markets) {
        for (const market of markets as MarketSchedule[]) {
          if (enabledMarketIds.length > 0 && !enabledMarketIds.includes(market.id)) continue;
          if (!market.days_active?.includes(currentDay)) continue;

          const [openHours, openMinutes] = market.open_time.split(':').map(Number);
          const [closeHours, closeMinutes] = market.close_time.split(':').map(Number);
          
          const openTimeMinutes = openHours * 60 + openMinutes;
          const closeTimeMinutes = closeHours * 60 + closeMinutes;

          // Check market open
          const timeToOpen = openTimeMinutes - currentTimeMinutes;
          if (timeToOpen > 0 && timeToOpen <= alertMinutes) {
            const notifKey = `market-open-${market.id}-${today}`;
            
            if (!notifiedMarkets.has(notifKey)) {
              notifiedMarkets.add(notifKey);
              
              const title = '🟢 افتتاح سوق';
              const body = `${market.market_name_ar} سيفتح خلال ${timeToOpen} دقيقة`;

              sendBrowserNotification(title, body);
              playNotificationSound();

              await createNotification(
                userIdRef.current!,
                'market_open',
                title,
                body,
                { marketId: market.id, date: today }
              );

              console.log('🟢 Market open alert sent:', market.market_name_ar);
            }
          }

          // Check market close
          const timeToClose = closeTimeMinutes - currentTimeMinutes;
          if (timeToClose > 0 && timeToClose <= alertMinutes) {
            const notifKey = `market-close-${market.id}-${today}`;
            
            if (!notifiedMarkets.has(notifKey)) {
              notifiedMarkets.add(notifKey);
              
              const title = '🔴 إغلاق سوق';
              const body = `${market.market_name_ar} سيغلق خلال ${timeToClose} دقيقة`;

              sendBrowserNotification(title, body);
              playNotificationSound();

              await createNotification(
                userIdRef.current!,
                'market_close',
                title,
                body,
                { marketId: market.id, date: today }
              );

              console.log('🔴 Market close alert sent:', market.market_name_ar);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking market alerts:', error);
    }
  }, [sendBrowserNotification, createNotification]);

  // Main check function
  const runAlertChecks = useCallback(async () => {
    await Promise.all([
      checkEconomicEvents(),
      checkMarketAlerts()
    ]);
  }, [checkEconomicEvents, checkMarketAlerts]);

  // Initialize and start checking
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      userIdRef.current = user.id;

      // Get user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('economic_alerts_enabled, market_alerts_enabled, alert_before_minutes')
        .eq('user_id', user.id)
        .single();

      if (profile && mounted) {
        userPrefsRef.current = {
          economic_alerts_enabled: profile.economic_alerts_enabled || false,
          market_alerts_enabled: profile.market_alerts_enabled || false,
          alert_before_minutes: profile.alert_before_minutes || 15
        };

        // Run initial check
        runAlertChecks();

        // Set up interval - check every 3 seconds for real-time alerts
        intervalRef.current = setInterval(() => {
          if (mounted) {
            runAlertChecks();
          }
        }, 3000);
      }
    };

    init();

    // Listen for profile changes to update preferences
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const newProfile = payload.new as Record<string, unknown>;
          if (newProfile.user_id === userIdRef.current) {
            userPrefsRef.current = {
              economic_alerts_enabled: (newProfile.economic_alerts_enabled as boolean) || false,
              market_alerts_enabled: (newProfile.market_alerts_enabled as boolean) || false,
              alert_before_minutes: (newProfile.alert_before_minutes as number) || 15
            };
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [runAlertChecks]);

  // Clean up old notified events periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Clear notifications older than 1 hour
      notifiedEvents.clear();
      notifiedMarkets.clear();
    }, 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return null;
};
