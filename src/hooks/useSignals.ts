import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from './useNotifications';
import { playCallNotificationSound, playPutNotificationSound } from '@/utils/soundNotification';

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
  const { sendNotification, permission } = useNotifications();
  const processedSignalIds = useRef<Set<string>>(new Set());

  // Play sound for new signal (works without notification permission)
  const playSignalSound = (direction: string) => {
    try {
      if (direction === 'CALL') {
        playCallNotificationSound();
      } else {
        playPutNotificationSound();
      }
    } catch (error) {
      console.error('Error playing signal sound:', error);
    }
  };

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
              
              // Only play sound if we haven't processed this signal before
              if (!processedSignalIds.current.has(newSignal.id)) {
                processedSignalIds.current.add(newSignal.id);
                
                // Always play sound for new signals (no permission needed)
                playSignalSound(newSignal.direction);
                
                // Show toast notification
                const directionText = newSignal.direction === 'CALL' ? '📈 شراء' : '📉 بيع';
                toast.success(`🔔 توصية جديدة: ${newSignal.asset} - ${directionText}`, {
                  duration: 5000,
                });
                
                // Send browser notification if permission granted
                if (permission === 'granted') {
                  const soundType = newSignal.direction === 'CALL' ? 'call' : 'put';
                  sendNotification('🔔 توصية جديدة', {
                    body: `${newSignal.asset} - ${directionText}\nالفترة: ${newSignal.timeframe}`,
                    tag: newSignal.id,
                    requireInteraction: false,
                    soundType: soundType,
                  });
                }
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

    // Minimal fallback polling (every 20s) with webhook-first approach
    const poll = setInterval(() => {
      fetchSignals();
    }, 20000);
 
    return () => {
      console.log('📡 Unsubscribing from realtime');
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  return { signals, loading, refetch: fetchSignals };
};
