import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TradingGoal {
  id: string;
  user_id: string;
  initial_capital: number;
  target_amount: number;
  duration_days: number;
  market_type: 'forex' | 'crypto' | 'stocks' | 'metals';
  loss_compensation_rate: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface NewTradingGoal {
  initial_capital: number;
  target_amount: number;
  duration_days: number;
  market_type: 'forex' | 'crypto' | 'stocks' | 'metals';
  loss_compensation_rate?: number;
}

export const useTradingGoals = () => {
  const [goals, setGoals] = useState<TradingGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<TradingGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGoals([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trading_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const goalsList = (data as TradingGoal[]) || [];
      setGoals(goalsList);
      
      // Set active goal
      const active = goalsList.find(g => g.is_active);
      setActiveGoal(active || null);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goal: NewTradingGoal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      // Deactivate all existing goals
      await supabase
        .from('trading_goals')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('trading_goals')
        .insert({
          user_id: user.id,
          ...goal,
          is_active: true
        });

      if (error) throw error;

      toast.success('تم إنشاء خطة التداول بنجاح');
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('حدث خطأ أثناء إنشاء الخطة');
      return false;
    }
  };

  const updateGoal = async (id: string, updates: Partial<NewTradingGoal>) => {
    try {
      const { error } = await supabase
        .from('trading_goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم تحديث الخطة بنجاح');
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('حدث خطأ أثناء التحديث');
      return false;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trading_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الخطة');
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('حدث خطأ أثناء الحذف');
      return false;
    }
  };

  const setActiveGoalById = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Deactivate all goals
      await supabase
        .from('trading_goals')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected goal
      const { error } = await supabase
        .from('trading_goals')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Error setting active goal:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return {
    goals,
    activeGoal,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    setActiveGoalById,
    refetch: fetchGoals
  };
};