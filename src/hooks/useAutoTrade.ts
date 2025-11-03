import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Signal } from './useSignals';

export const useAutoTrade = (enabled: boolean, signals: Signal[]) => {
  useEffect(() => {
    if (!enabled) return;

    const executePendingSignals = async () => {
      // Find all pending signals
      const pendingSignals = signals.filter(s => s.status === 'pending');
      
      for (const signal of pendingSignals) {
        try {
          console.log('Auto-executing signal:', signal);
          
          const { data, error } = await supabase.functions.invoke('pocket-option-trade', {
            body: {
              signalId: signal.id,
              asset: signal.asset,
              direction: signal.direction,
              amount: signal.amount,
              timeframe: signal.timeframe
            }
          });

          if (error) {
            console.error('Trade execution error:', error);
            toast.error(`فشل تنفيذ صفقة ${signal.asset}: ${error.message}`);
            continue;
          }

          if (data.success) {
            toast.success(`تم تنفيذ صفقة ${signal.asset} ${signal.direction} بنجاح 🎯`);
          }
        } catch (error) {
          console.error('Auto-trade error:', error);
        }
      }
    };

    // Execute immediately when enabled
    executePendingSignals();

    // Subscribe to new signals for auto-execution
    const channel = supabase
      .channel('auto-trade-signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals'
        },
        (payload) => {
          const newSignal = payload.new as Signal;
          if (newSignal.status === 'pending') {
            console.log('New signal received, auto-executing:', newSignal);
            
            supabase.functions.invoke('pocket-option-trade', {
              body: {
                signalId: newSignal.id,
                asset: newSignal.asset,
                direction: newSignal.direction,
                amount: newSignal.amount,
                timeframe: newSignal.timeframe
              }
            }).then(({ data, error }) => {
              if (error) {
                toast.error(`فشل تنفيذ صفقة ${newSignal.asset}`);
              } else if (data?.success) {
                toast.success(`تم تنفيذ صفقة ${newSignal.asset} ${newSignal.direction} تلقائياً 🎯`);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, signals]);
};
