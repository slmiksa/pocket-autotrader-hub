import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SmartRecoveryTrade {
  id: string;
  user_id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  entry_time: string;
  exit_time: string | null;
  lot_size: number;
  was_reinforced: boolean;
  reinforcement_price: number | null;
  status: 'open' | 'closed';
  result: 'capital_recovery' | 'profit' | 'no_result' | 'loss' | null;
  profit_loss: number | null;
  entry_reason: string | null;
  cvd_status: string | null;
  ema_status: string | null;
  vwap_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTrade {
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  lot_size?: number;
  entry_reason?: string;
  cvd_status?: string;
  ema_status?: string;
  vwap_status?: string;
  notes?: string;
}

export const useSmartRecoveryTrades = () => {
  const [trades, setTrades] = useState<SmartRecoveryTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrades([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('smart_recovery_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades((data || []) as SmartRecoveryTrade[]);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast.error('خطأ في جلب الصفقات');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTrade = async (trade: NewTrade): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const { error } = await supabase
        .from('smart_recovery_trades')
        .insert({
          user_id: user.id,
          ...trade,
          lot_size: trade.lot_size || 0.01
        });

      if (error) throw error;
      
      toast.success('تم فتح الصفقة بنجاح');
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error adding trade:', error);
      toast.error('خطأ في فتح الصفقة');
      return false;
    }
  };

  const closeTrade = async (
    tradeId: string, 
    exitPrice: number, 
    result: 'capital_recovery' | 'profit' | 'no_result' | 'loss'
  ): Promise<boolean> => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return false;

      const profitLoss = trade.direction === 'BUY' 
        ? (exitPrice - trade.entry_price) * trade.lot_size * 100
        : (trade.entry_price - exitPrice) * trade.lot_size * 100;

      const { error } = await supabase
        .from('smart_recovery_trades')
        .update({
          exit_price: exitPrice,
          exit_time: new Date().toISOString(),
          status: 'closed',
          result,
          profit_loss: profitLoss
        })
        .eq('id', tradeId);

      if (error) throw error;
      
      toast.success('تم إغلاق الصفقة بنجاح');
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('خطأ في إغلاق الصفقة');
      return false;
    }
  };

  const reinforceTrade = async (tradeId: string, reinforcementPrice: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('smart_recovery_trades')
        .update({
          was_reinforced: true,
          reinforcement_price: reinforcementPrice
        })
        .eq('id', tradeId);

      if (error) throw error;
      
      toast.success('تم تعزيز الصفقة');
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error reinforcing trade:', error);
      toast.error('خطأ في تعزيز الصفقة');
      return false;
    }
  };

  const deleteTrade = async (tradeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('smart_recovery_trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;
      
      toast.success('تم حذف الصفقة');
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('خطأ في حذف الصفقة');
      return false;
    }
  };

  const getStats = () => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const wins = closedTrades.filter(t => t.result === 'profit' || t.result === 'capital_recovery').length;
    const losses = closedTrades.filter(t => t.result === 'loss').length;
    const noResult = closedTrades.filter(t => t.result === 'no_result').length;
    const totalProfitLoss = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;
    const openTrades = trades.filter(t => t.status === 'open').length;

    return {
      total: closedTrades.length,
      wins,
      losses,
      noResult,
      winRate,
      totalProfitLoss,
      openTrades
    };
  };

  useEffect(() => {
    fetchTrades();

    const channel = supabase
      .channel('smart_recovery_trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'smart_recovery_trades'
        },
        () => fetchTrades()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrades]);

  return {
    trades,
    loading,
    addTrade,
    closeTrade,
    reinforceTrade,
    deleteTrade,
    getStats,
    refetch: fetchTrades
  };
};
