import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Signal {
  id: string;
  asset: string;
  timeframe: string;
  direction: string;
  amount: number;
  status: string;
  received_at: string;
  raw_message?: string;
  telegram_message_id?: string;
  result?: string | null; // 'win', 'win1', 'win2', 'loss', or null
  entry_time?: string | null;
}

export const useSignals = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  // Expose a refetch to allow manual refresh when polling detects new data
  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching signals:', error);
    } else {
      setSignals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial load
    fetchSignals();

    // Subscribe to realtime changes with better handling
    const channel = supabase
      .channel('signals-realtime-channel', {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals'
        },
        (payload) => {
          console.log('📡 Realtime signal update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newSignal = payload.new as Signal;
            setSignals(prev => {
              // Avoid duplicates
              if (prev.some(s => s.id === newSignal.id)) {
                return prev;
              }
              return [newSignal, ...prev.slice(0, 19)]; // Keep max 20
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Signal;
            setSignals(prev => {
              const prevSignal = prev.find(s => s.id === updated.id);
              if (prevSignal) {
                if (!prevSignal.result && updated.result) {
                  const label = updated.result === 'loss' ? '❌ خسارة' : (updated.result === 'win' ? '✅ ربح' : updated.result === 'win1' ? '✅ ربح ¹' : '✅ ربح ²');
                  const isLoss = updated.result === 'loss';
                  (isLoss ? toast.error : toast.success)(`نتيجة ${updated.asset}: ${label}`);
                } else if (prevSignal.status !== 'executed' && updated.status === 'executed' && !updated.result) {
                  toast.info(`بدء تنفيذ ${updated.asset} الآن ⏱️`);
                }
              }
              return prev.map(signal => signal.id === updated.id ? updated : signal);
            });
          } else if (payload.eventType === 'DELETE') {
            setSignals(prev => 
              prev.filter(signal => signal.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Fallback polling in case realtime disconnects
    const poll = setInterval(() => {
      fetchSignals();
    }, 15000);
 
    return () => {
      console.log('📡 Unsubscribing from realtime');
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading, refetch: fetchSignals };
};
