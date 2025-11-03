import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Signal } from './useSignals';

export const useAutoTrade = (enabled: boolean, signals: Signal[]) => {
  useEffect(() => {
    // Auto-trade disabled: Pocket Option doesn't provide official API
    // Signals are displayed for manual execution
    if (!enabled) return;
    
    // Temporarily disabled auto-trade functionality
    return;

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
              timeframe: signal.timeframe,
              entryTime: (signal as any).entry_time
            }
          });

          if (error) {
            // Check if error is due to timing
            if (error.message && error.message.includes('Not yet time')) {
              console.log('Waiting for entry time:', (signal as any).entry_time);
              // Don't show error, just wait
            } else {
              console.error('Trade execution error:', error);
              toast.error(`فشل تنفيذ صفقة ${signal.asset}: ${error.message}`);
            }
            continue;
          }

          if (data.success) {
            const entryTimeMsg = (signal as any).entry_time ? ` في ${(signal as any).entry_time}` : '';
            toast.success(`تم تنفيذ صفقة ${signal.asset} ${signal.direction}${entryTimeMsg} بنجاح 🎯`);
          }
        } catch (error) {
          console.error('Auto-trade error:', error);
        }
      }
    };

    // Execute immediately when enabled
    executePendingSignals();

    // Set up interval to check and execute trades at their entry time every 30 seconds
    const interval = setInterval(() => {
      executePendingSignals();
    }, 30000);

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
                timeframe: newSignal.timeframe,
                entryTime: (newSignal as any).entry_time
              }
            }).then(({ data, error }) => {
              if (error && !error.message?.includes('Not yet time')) {
                toast.error(`فشل تنفيذ صفقة ${newSignal.asset}`);
              } else if (data?.success) {
                const entryTimeMsg = (newSignal as any).entry_time ? ` في ${(newSignal as any).entry_time}` : '';
                toast.success(`تم تنفيذ صفقة ${newSignal.asset} ${newSignal.direction}${entryTimeMsg} تلقائياً 🎯`);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [enabled, signals]);
};
