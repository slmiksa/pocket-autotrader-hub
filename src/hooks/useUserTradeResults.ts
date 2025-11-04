import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserTradeResult {
  id: string;
  signal_id: string;
  user_id: string;
  user_result: 'win' | 'loss';
  created_at: string;
}

export const useUserTradeResults = () => {
  const [userResults, setUserResults] = useState<UserTradeResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_trade_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserResults((data || []) as UserTradeResult[]);
    } catch (error) {
      console.error('Error fetching user results:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserResult = async (signalId: string, result: 'win' | 'loss') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const { error } = await supabase
        .from('user_trade_results')
        .upsert({
          signal_id: signalId,
          user_id: user.id,
          user_result: result
        }, {
          onConflict: 'signal_id,user_id'
        });

      if (error) throw error;

      toast.success(result === 'win' ? '✅ تم تسجيل صفقة ناجحة' : '❌ تم تسجيل صفقة خاسرة');
      await fetchUserResults();
      return true;
    } catch (error) {
      console.error('Error saving user result:', error);
      toast.error('حدث خطأ أثناء حفظ النتيجة');
      return false;
    }
  };

  const getUserResult = (signalId: string): 'win' | 'loss' | null => {
    const result = userResults.find(r => r.signal_id === signalId);
    return result ? result.user_result : null;
  };

  const getStats = () => {
    const wins = userResults.filter(r => r.user_result === 'win').length;
    const losses = userResults.filter(r => r.user_result === 'loss').length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return { wins, losses, total, winRate };
  };

  useEffect(() => {
    fetchUserResults();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user_trade_results_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_trade_results'
        },
        () => {
          fetchUserResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    userResults,
    loading,
    saveUserResult,
    getUserResult,
    getStats,
    refetch: fetchUserResults
  };
};
