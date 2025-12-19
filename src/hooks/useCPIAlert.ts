import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserNotifications } from './useUserNotifications';
import { playNotificationSound } from '@/utils/soundNotification';
import { toast } from 'sonner';

interface CPIEvent {
  id: string;
  title: string;
  title_ar: string;
  event_time: string;
  impact: string;
  currency: string;
  country: string;
  forecast_value: string | null;
  previous_value: string | null;
}

// CPI keywords to detect
const CPI_KEYWORDS = ['CPI', 'Consumer Price Index', 'التضخم', 'مؤشر أسعار المستهلك', 'Inflation'];

export const useCPIAlert = () => {
  const { sendBrowserNotification } = useUserNotifications();
  const notifiedCPIRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkCPIEvents = useCallback(async () => {
    try {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000); // Next hour

      // Fetch upcoming economic events
      const { data: events } = await supabase
        .from('economic_events')
        .select('*')
        .gte('event_time', now.toISOString())
        .lte('event_time', nextHour.toISOString())
        .eq('impact', 'high');

      if (!events || events.length === 0) return;

      // Filter for CPI events
      const cpiEvents = events.filter((event: CPIEvent) => {
        const titleLower = (event.title + ' ' + event.title_ar).toLowerCase();
        return CPI_KEYWORDS.some(keyword => titleLower.includes(keyword.toLowerCase()));
      });

      for (const event of cpiEvents as CPIEvent[]) {
        const notifKey = `cpi-${event.id}`;
        
        if (notifiedCPIRef.current.has(notifKey)) continue;
        notifiedCPIRef.current.add(notifKey);

        const eventTime = new Date(event.event_time);
        const minutesUntil = Math.round((eventTime.getTime() - now.getTime()) / 60000);

        const title = '🚨 تنبيه CPI - احتمال انفجار سعري!';
        const body = `${event.title_ar} (${event.currency}) خلال ${minutesUntil} دقيقة - توقع تقلبات عالية!`;

        // Send browser notification
        sendBrowserNotification(title, body);
        playNotificationSound();

        // Show toast
        toast.warning(title, {
          description: body,
          duration: 15000,
          action: {
            label: 'عرض',
            onClick: () => window.location.href = '/economic-calendar'
          }
        });

        console.log('🚨 CPI Alert sent:', event.title_ar, 'in', minutesUntil, 'minutes');
      }
    } catch (error) {
      console.error('Error checking CPI events:', error);
    }
  }, [sendBrowserNotification]);

  useEffect(() => {
    // Check immediately on mount
    checkCPIEvents();

    // Check every minute
    intervalRef.current = setInterval(checkCPIEvents, 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkCPIEvents]);

  // Clear old notifications every hour
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      notifiedCPIRef.current.clear();
    }, 60 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return { checkCPIEvents };
};
