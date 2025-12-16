import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MarketAnalysis {
  symbol: string;
  currentPrice: number;
  ema200: number;
  vwap: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  shortTermTrend: 'bullish' | 'bearish' | 'neutral';
  priceAboveEMA: boolean;
  nearVWAP: boolean;
  cvdStatus: 'rising' | 'falling' | 'flat';
  isValidSetup: boolean;
  signalType: 'BUY' | 'SELL' | 'NONE';
  priceChange: number;
  timestamp: string;
  dataSource: string;
}

interface UseMarketAnalysisOptions {
  symbol?: string;
  timeframe?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSignalDetected?: (analysis: MarketAnalysis) => void;
}

export const useMarketAnalysis = (options: UseMarketAnalysisOptions = {}) => {
  const {
    symbol = 'XAUUSD',
    timeframe = '15m',
    autoRefresh = false,
    refreshInterval = 30000,
    onSignalDetected
  } = options;

  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousSignalRef = useRef<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-smart-recovery', {
        body: { symbol, timeframe }
      });

      if (fnError) throw fnError;

      setAnalysis(data);

      // Check if a new valid signal was detected
      if (data.isValidSetup && data.signalType !== 'NONE') {
        const signalKey = `${data.signalType}-${data.timestamp}`;
        if (previousSignalRef.current !== signalKey) {
          previousSignalRef.current = signalKey;
          onSignalDetected?.(data);
        }
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ في تحليل السوق';
      setError(message);
      console.error('Market analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, onSignalDetected]);

  useEffect(() => {
    fetchAnalysis();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalysis, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAnalysis, autoRefresh, refreshInterval]);

  return {
    analysis,
    loading,
    error,
    refetch: fetchAnalysis
  };
};
