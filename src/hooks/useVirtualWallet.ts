import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playTradeWinSound, playTradeLossSound } from '@/utils/soundNotification';

export interface VirtualWallet {
  id: string;
  user_id: string;
  balance: number;
  initial_balance: number;
  total_profit_loss: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  created_at: string;
  updated_at: string;
}

export interface VirtualTrade {
  id: string;
  user_id: string;
  wallet_id: string;
  symbol: string;
  symbol_name_ar: string;
  trade_type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  amount: number;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  status: 'open' | 'pending' | 'closed' | 'cancelled';
  profit_loss: number | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useVirtualWallet = () => {
  const [wallet, setWallet] = useState<VirtualWallet | null>(null);
  const [trades, setTrades] = useState<VirtualTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to get existing wallet
      let { data: walletData, error } = await supabase
        .from('virtual_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no wallet exists, create one
      if (!walletData) {
        const { data: newWallet, error: createError } = await supabase
          .from('virtual_wallets')
          .insert({
            user_id: user.id,
            balance: 1000,
            initial_balance: 1000
          })
          .select()
          .single();

        if (createError) throw createError;
        walletData = newWallet;
      }

      setWallet(walletData as VirtualWallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('virtual_trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades((data || []) as VirtualTrade[]);
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const openTrade = async (trade: {
    symbol: string;
    symbol_name_ar: string;
    trade_type: 'buy' | 'sell';
    order_type: 'market' | 'limit' | 'stop';
    amount: number;
    entry_price: number;
    stop_loss?: number;
    take_profit?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wallet) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      if (trade.amount > wallet.balance) {
        toast.error('رصيدك غير كافٍ لهذه الصفقة');
        return false;
      }

      const quantity = trade.amount / trade.entry_price;

      const { error: tradeError } = await supabase
        .from('virtual_trades')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          symbol: trade.symbol,
          symbol_name_ar: trade.symbol_name_ar,
          trade_type: trade.trade_type,
          order_type: trade.order_type,
          amount: trade.amount,
          quantity: quantity,
          entry_price: trade.entry_price,
          stop_loss: trade.stop_loss,
          take_profit: trade.take_profit,
          status: trade.order_type === 'market' ? 'open' : 'pending'
        });

      if (tradeError) throw tradeError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('virtual_wallets')
        .update({
          balance: wallet.balance - trade.amount,
          total_trades: wallet.total_trades + 1
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      toast.success(trade.trade_type === 'buy' ? '✅ تم فتح صفقة شراء' : '✅ تم فتح صفقة بيع');
      await fetchWallet();
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error opening trade:', error);
      toast.error('حدث خطأ أثناء فتح الصفقة');
      return false;
    }
  };

  const closeTrade = async (tradeId: string, exitPrice: number) => {
    try {
      const trade = trades.find(t => t.id === tradeId);
      if (!trade || !wallet) return false;

      // Calculate profit/loss
      let profitLoss: number;
      if (trade.trade_type === 'buy') {
        profitLoss = (exitPrice - trade.entry_price) * trade.quantity;
      } else {
        profitLoss = (trade.entry_price - exitPrice) * trade.quantity;
      }

      // Update trade
      const { error: tradeError } = await supabase
        .from('virtual_trades')
        .update({
          exit_price: exitPrice,
          profit_loss: profitLoss,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (tradeError) throw tradeError;

      // Update wallet
      const newBalance = wallet.balance + trade.amount + profitLoss;
      const isWin = profitLoss > 0;

      const { error: walletError } = await supabase
        .from('virtual_wallets')
        .update({
          balance: newBalance,
          total_profit_loss: wallet.total_profit_loss + profitLoss,
          winning_trades: isWin ? wallet.winning_trades + 1 : wallet.winning_trades,
          losing_trades: !isWin ? wallet.losing_trades + 1 : wallet.losing_trades
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Play sound notification
      if (isWin) {
        playTradeWinSound();
      } else {
        playTradeLossSound();
      }

      toast.success(profitLoss > 0 ? `🎉 ربح: $${profitLoss.toFixed(2)}` : `📉 خسارة: $${Math.abs(profitLoss).toFixed(2)}`);
      await fetchWallet();
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('حدث خطأ أثناء إغلاق الصفقة');
      return false;
    }
  };

  const resetWallet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wallet) return false;

      // Delete all trades
      await supabase
        .from('virtual_trades')
        .delete()
        .eq('user_id', user.id);

      // Reset wallet
      const { error } = await supabase
        .from('virtual_wallets')
        .update({
          balance: 1000,
          initial_balance: 1000,
          total_profit_loss: 0,
          total_trades: 0,
          winning_trades: 0,
          losing_trades: 0
        })
        .eq('id', wallet.id);

      if (error) throw error;

      toast.success('تم إعادة تعيين المحفظة بنجاح');
      await fetchWallet();
      await fetchTrades();
      return true;
    } catch (error) {
      console.error('Error resetting wallet:', error);
      toast.error('حدث خطأ أثناء إعادة تعيين المحفظة');
      return false;
    }
  };

  const updateWalletBalance = async (newBalance: number) => {
    try {
      if (!wallet) return false;

      const { error } = await supabase
        .from('virtual_wallets')
        .update({
          balance: newBalance,
          initial_balance: newBalance
        })
        .eq('id', wallet.id);

      if (error) throw error;

      toast.success('تم تحديث الرصيد بنجاح');
      await fetchWallet();
      return true;
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error('حدث خطأ أثناء تحديث الرصيد');
      return false;
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTrades();
  }, []);

  return {
    wallet,
    trades,
    loading,
    openTrade,
    closeTrade,
    resetWallet,
    updateWalletBalance,
    refetch: () => {
      fetchWallet();
      fetchTrades();
    }
  };
};
