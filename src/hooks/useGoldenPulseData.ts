import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingLevel {
  price: number;
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down';
  label: string;
  labelAr: string;
  color: string;
  strength: number;
}

interface GoldenPulseData {
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: string;
  timeframe: string;
  candles: CandleData[];
  levels: TradingLevel[];
  dataSource: string;
  isLive: boolean;
}

interface UseGoldenPulseDataOptions {
  timeframe: string;
  refreshInterval?: number;
}

export const useGoldenPulseData = ({ timeframe, refreshInterval = 3000 }: UseGoldenPulseDataOptions) => {
  const [data, setData] = useState<GoldenPulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('analyze-golden-pulse', {
        body: {},
        headers: {},
      });

      // Also try with query param
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-golden-pulse?timeframe=${timeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const jsonData = await response.json();

      if (mountedRef.current) {
        setData(jsonData);
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Golden Pulse fetch error:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'خطأ في جلب البيانات');
        setLoading(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchData();

    const interval = setInterval(fetchData, refreshInterval);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
