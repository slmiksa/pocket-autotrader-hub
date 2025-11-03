import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
            setSignals(prev => 
              prev.map(signal => 
                signal.id === (payload.new as any).id ? payload.new as Signal : signal
              )
            );
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

    return () => {
      console.log('📡 Unsubscribing from realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading, refetch: fetchSignals };
};
