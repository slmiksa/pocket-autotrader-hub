import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  symbol_name_ar: string;
  symbol_name_en: string;
  category: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface NewPriceAlert {
  symbol: string;
  symbol_name_ar: string;
  symbol_name_en: string;
  category: string;
  target_price: number;
  condition: 'above' | 'below';
}

export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as PriceAlert[]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const addAlert = async (alert: NewPriceAlert): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول لإضافة تنبيه');
        return false;
      }

      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          ...alert
        })
        .select()
        .single();

      if (error) throw error;
      
      setAlerts(prev => [data as PriceAlert, ...prev]);
      toast.success('تم إضافة التنبيه بنجاح');
      return true;
    } catch (error) {
      console.error('Error adding alert:', error);
      toast.error('فشل في إضافة التنبيه');
      return false;
    }
  };

  const deleteAlert = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('تم حذف التنبيه');
      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('فشل في حذف التنبيه');
      return false;
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_active: isActive } : a
      ));
      toast.success(isActive ? 'تم تفعيل التنبيه' : 'تم إيقاف التنبيه');
      return true;
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('فشل في تحديث التنبيه');
      return false;
    }
  };

  const getActiveAlerts = () => alerts.filter(a => a.is_active && !a.triggered_at);
  const getTriggeredAlerts = () => alerts.filter(a => a.triggered_at);

  return {
    alerts,
    loading,
    addAlert,
    deleteAlert,
    toggleAlert,
    getActiveAlerts,
    getTriggeredAlerts,
    refetch: fetchAlerts
  };
};
