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
  telegram_message_id?: number;
}

export const useSignals = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial signals
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

    fetchSignals();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('signals-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'signals'
        },
        (payload) => {
          console.log('Signal update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSignals(prev => [payload.new as Signal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSignals(prev => 
              prev.map(signal => 
                signal.id === payload.new.id ? payload.new as Signal : signal
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSignals(prev => 
              prev.filter(signal => signal.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading };
};
