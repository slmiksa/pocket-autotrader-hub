import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TradingGoalProgress {
  id: string;
  goal_id: string;
  user_id: string;
  day_number: number;
  achieved_amount: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewProgress {
  goal_id: string;
  day_number: number;
  achieved_amount: number;
  notes?: string;
}

export const useTradingGoalProgress = (goalId: string | null) => {
  const [progress, setProgress] = useState<TradingGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!goalId) {
      setProgress([]);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trading_goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('day_number', { ascending: true });

      if (error) throw error;
      setProgress(data || []);
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      toast.error('فشل تحميل التقدم');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (dayNumber: number, achievedAmount: number, notes?: string) => {
    if (!goalId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if progress for this day already exists
      const existing = progress.find(p => p.day_number === dayNumber);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('trading_goal_progress')
          .update({
            achieved_amount: achievedAmount,
            notes: notes || null,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        toast.success('تم تحديث التقدم بنجاح');
      } else {
        // Insert new
        const { error } = await supabase
          .from('trading_goal_progress')
          .insert({
            goal_id: goalId,
            user_id: user.id,
            day_number: dayNumber,
            achieved_amount: achievedAmount,
            notes: notes || null,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('تم حفظ التقدم بنجاح');
      }

      await fetchProgress();
      return true;
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error('فشل حفظ التقدم');
      return false;
    }
  };

  const deleteProgress = async (dayNumber: number) => {
    if (!goalId) return false;

    try {
      const existing = progress.find(p => p.day_number === dayNumber);
      if (!existing) return false;

      const { error } = await supabase
        .from('trading_goal_progress')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      toast.success('تم حذف التقدم بنجاح');
      await fetchProgress();
      return true;
    } catch (error: any) {
      console.error('Error deleting progress:', error);
      toast.error('فشل حذف التقدم');
      return false;
    }
  };

  const clearAllProgress = async () => {
    if (!goalId) return false;

    try {
      const { error } = await supabase
        .from('trading_goal_progress')
        .delete()
        .eq('goal_id', goalId);

      if (error) throw error;

      toast.success('تم مسح جميع التقدم بنجاح');
      await fetchProgress();
      return true;
    } catch (error: any) {
      console.error('Error clearing progress:', error);
      toast.error('فشل مسح التقدم');
      return false;
    }
  };

  const getProgressForDay = (dayNumber: number) => {
    return progress.find(p => p.day_number === dayNumber);
  };

  const getTotalAchieved = () => {
    return progress.reduce((sum, p) => sum + Number(p.achieved_amount), 0);
  };

  const getCompletedDays = () => {
    return progress.length;
  };

  useEffect(() => {
    fetchProgress();
  }, [goalId]);

  return {
    progress,
    loading,
    updateProgress,
    deleteProgress,
    clearAllProgress,
    getProgressForDay,
    getTotalAchieved,
    getCompletedDays,
    refetch: fetchProgress
  };
};
