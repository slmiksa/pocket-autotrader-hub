import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  user_id: string;
  trade_date: string;
  symbol: string | null;
  direction: 'buy' | 'sell' | 'call' | 'put' | null;
  entry_price: number | null;
  exit_price: number | null;
  profit_loss: number | null;
  result: 'win' | 'loss' | 'pending' | 'breakeven' | null;
  notes: string | null;
  daily_goal: number | null;
  daily_achieved: number | null;
  lessons_learned: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewJournalEntry {
  trade_date?: string;
  symbol?: string;
  direction?: 'buy' | 'sell' | 'call' | 'put';
  entry_price?: number;
  exit_price?: number;
  profit_loss?: number;
  result?: 'win' | 'loss' | 'pending' | 'breakeven';
  notes?: string;
  daily_goal?: number;
  daily_achieved?: number;
  lessons_learned?: string;
}

export const useDailyJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_daily_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });

      if (error) throw error;
      setEntries((data as JournalEntry[]) || []);
    } catch (error) {
      console.error('Error fetching journal:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: NewJournalEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const { error } = await supabase
        .from('user_daily_journal')
        .insert({
          user_id: user.id,
          ...entry
        });

      if (error) throw error;

      toast.success('تمت إضافة الصفقة بنجاح');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error adding entry:', error);
      toast.error('حدث خطأ أثناء الإضافة');
      return false;
    }
  };

  const updateEntry = async (id: string, updates: Partial<NewJournalEntry>) => {
    try {
      const { error } = await supabase
        .from('user_daily_journal')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('تم التحديث بنجاح');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('حدث خطأ أثناء التحديث');
      return false;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_daily_journal')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الصفقة');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('حدث خطأ أثناء الحذف');
      return false;
    }
  };

  const getStats = () => {
    const wins = entries.filter(e => e.result === 'win').length;
    const losses = entries.filter(e => e.result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const totalProfit = entries.reduce((sum, e) => sum + (e.profit_loss || 0), 0);

    return { wins, losses, total, winRate, totalProfit };
  };

  const getTodayEntries = () => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(e => e.trade_date === today);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getStats,
    getTodayEntries,
    refetch: fetchEntries
  };
};
