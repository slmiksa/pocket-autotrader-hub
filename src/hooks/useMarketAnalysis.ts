import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  signalType: 'BUY' | 'SELL' | 'WAIT' | 'NONE';
  priceChange: number;
  timestamp: string;
  dataSource: string;
  // Extended fields used by Smart Recovery UI (kept optional for backward compatibility)
  confidence?: number;
  signalReasons?: string[];
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  accumulation?: {
    detected: boolean;
    compressionLevel: number;
    priceRange: number;
    volumeRatio: number;
    strength: number;
    breakoutProbability: number;
    expectedDirection: 'up' | 'down' | 'unknown';
  };
  bollingerSqueeze?: boolean;
  volumeSpike?: boolean;
  priceConsolidation?: boolean;
  realTimeMetrics?: {
    avgVolume24h: number;
    currentVolume: number;
    volumeChangePercent: number;
    volatilityIndex: number;
    priceRangePercent: number;
    bollingerWidth: number;
  };
  explosionTimer?: {
    active: boolean;
    compressionStartedAt: string | null;
    expectedExplosionAt: string | null;
    expectedDurationSeconds: number | null;
    direction: 'up' | 'down' | 'unknown';
    confidence: number;
    method: 'bollinger_squeeze_history' | 'none';
    debug?: {
      thresholdBandWidth: number;
      avgBandWidth: number;
      currentBandWidth: number;
      historicalSamples: number;
      barsInCurrentSqueeze?: number;
    };
    calibration?: {
      dynamicThreshold: number;
      ratioUsed: number;
      windowDays: number;
      avgBandWidth: number;
      minBandWidth: number;
      maxBandWidth: number;
      samples: number;
    };
  };
  recentCandles?: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    direction: 'bull' | 'bear' | 'doji';
  }>;
}

interface UseMarketAnalysisOptions {
  symbol?: string;
  timeframe?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  priceSource?: 'spot' | 'futures';
}

export const useMarketAnalysis = (options: UseMarketAnalysisOptions = {}) => {
  const {
    symbol = 'XAUUSD',
    timeframe = '15m',
    autoRefresh = false,
    refreshInterval = 60000,
    priceSource,
  } = options;

  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchAnalysis = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return null;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-smart-recovery', {
        body: { symbol, timeframe, priceSource },
      });

      if (fnError) throw fnError;

      if (mountedRef.current) {
        setAnalysis(data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ في تحليل السوق';
      if (mountedRef.current) {
        setError(message);
        setAnalysis(null); // لا تعرض بيانات قديمة عند فشل التحليل
      }
      console.error('Market analysis error:', err);
      return null;
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [symbol, timeframe, priceSource]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalysis();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchAnalysis, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (interval) clearInterval(interval);
    };
  }, [symbol, timeframe, priceSource, autoRefresh, refreshInterval, fetchAnalysis]);

  return {
    analysis,
    loading,
    error,
    refetch: fetchAnalysis,
  };
};
