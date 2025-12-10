import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserEventAlert {
  id: string;
  event_id: string;
  notified_at: string | null;
}

export const useEconomicEventAlerts = () => {
  const [alerts, setAlerts] = useState<UserEventAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user's event alerts
  const fetchAlerts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from('user_economic_alerts')
      .select('id, event_id, notified_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Check if an event has alert enabled
  const hasAlert = useCallback((eventId: string) => {
    return alerts.some(a => a.event_id === eventId);
  }, [alerts]);

  // Toggle alert for an event
  const toggleAlert = useCallback(async (eventId: string) => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول لتفعيل التنبيهات');
      return;
    }

    const existingAlert = alerts.find(a => a.event_id === eventId);

    if (existingAlert) {
      // Remove alert
      const { error } = await supabase
        .from('user_economic_alerts')
        .delete()
        .eq('id', existingAlert.id);

      if (error) {
        toast.error('حدث خطأ أثناء إلغاء التنبيه');
        console.error('Error removing alert:', error);
      } else {
        setAlerts(prev => prev.filter(a => a.id !== existingAlert.id));
        toast.success('تم إلغاء التنبيه');
      }
    } else {
      // Add alert
      const { data, error } = await supabase
        .from('user_economic_alerts')
        .insert([{ user_id: userId, event_id: eventId }])
        .select('id, event_id, notified_at')
        .single();

      if (error) {
        toast.error('حدث خطأ أثناء تفعيل التنبيه');
        console.error('Error adding alert:', error);
      } else if (data) {
        setAlerts(prev => [...prev, data]);
        toast.success('تم تفعيل التنبيه');
      }
    }
  }, [userId, alerts]);

  return {
    alerts,
    loading,
    hasAlert,
    toggleAlert,
    isAuthenticated: !!userId
  };
};
