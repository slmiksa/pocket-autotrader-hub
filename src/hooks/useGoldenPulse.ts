import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoldenPulseAnalysis {
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  timestamp: string;
  
  trend: {
    direction: 'bullish' | 'bearish' | 'neutral';
    ema9: number;
    ema21: number;
    ema50: number;
    strength: number;
  };
  
  momentum: {
    rsi7: number;
    volumeRatio: number;
    volumeSpike: boolean;
    momentumSignal: 'buy' | 'sell' | 'neutral';
  };
  
  reactionZones: {
    previousHigh: number;
    previousLow: number;
    vwap: number;
    nearZone: boolean;
    zoneType: 'support' | 'resistance' | 'vwap' | 'none';
    rejectCandle: boolean;
  };
  
  candleAnalysis: {
    bodyRatio: number;
    validEntry: boolean;
    candleType: 'bullish' | 'bearish' | 'doji';
  };
  
  signal: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'EXIT';
    confidence: number;
    reasons: string[];
    urgency: 'immediate' | 'soon' | 'wait';
  };
  
  exitConditions: {
    shouldExit: boolean;
    reason: string | null;
    rsiReversal: boolean;
    oppositeCandle: boolean;
    volumeDrop: boolean;
    hitZone: boolean;
  };
  
  riskManagement: {
    canTrade: boolean;
    cooldownRemaining: number;
    maxDurationReached: boolean;
    newsAlert: boolean;
  };
}

export interface TradeSession {
  isActive: boolean;
  entryPrice: number | null;
  entryTime: Date | null;
  direction: 'BUY' | 'SELL' | null;
  duration: number; // seconds
}

interface UseGoldenPulseOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  maxTradeDuration?: number; // seconds
  cooldownPeriod?: number; // seconds
}

export const useGoldenPulse = (options: UseGoldenPulseOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 1000, // 1 second default
    maxTradeDuration = 90, // 90 seconds max trade
    cooldownPeriod = 120, // 2 minutes cooldown
  } = options;

  const [analysis, setAnalysis] = useState<GoldenPulseAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradeSession, setTradeSession] = useState<TradeSession>({
    isActive: false,
    entryPrice: null,
    entryTime: null,
    direction: null,
    duration: 0,
  });
  const [cooldown, setCooldown] = useState(0);
  const [lastSignal, setLastSignal] = useState<'BUY' | 'SELL' | 'HOLD' | 'EXIT' | null>(null);
  
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (isFetchingRef.current) return null;
    isFetchingRef.current = true;
    
    if (!analysis) setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-golden-pulse');

      if (fnError) throw fnError;

      if (mountedRef.current && data) {
        // Apply local risk management overrides
        const updatedData = {
          ...data,
          riskManagement: {
            ...data.riskManagement,
            canTrade: cooldown === 0 && !tradeSession.isActive,
            cooldownRemaining: cooldown,
            maxDurationReached: tradeSession.duration >= maxTradeDuration,
          }
        };
        
        setAnalysis(updatedData);
        
        // Track signal changes for alerts
        if (data.signal.action !== lastSignal) {
          setLastSignal(data.signal.action);
        }
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ في تحليل نبض الذهب';
      if (mountedRef.current) {
        setError(message);
      }
      console.error('Golden Pulse analysis error:', err);
      return null;
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [analysis, cooldown, tradeSession, maxTradeDuration, lastSignal]);

  // Enter trade
  const enterTrade = useCallback((direction: 'BUY' | 'SELL', entryPrice: number) => {
    if (cooldown > 0 || tradeSession.isActive) return;
    
    setTradeSession({
      isActive: true,
      entryPrice,
      entryTime: new Date(),
      direction,
      duration: 0,
    });
    
    // Start trade duration timer
    tradeTimerRef.current = setInterval(() => {
      setTradeSession(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
  }, [cooldown, tradeSession.isActive]);

  // Exit trade
  const exitTrade = useCallback(() => {
    if (!tradeSession.isActive) return;
    
    // Clear trade timer
    if (tradeTimerRef.current) {
      clearInterval(tradeTimerRef.current);
      tradeTimerRef.current = null;
    }
    
    // Reset trade session
    setTradeSession({
      isActive: false,
      entryPrice: null,
      entryTime: null,
      direction: null,
      duration: 0,
    });
    
    // Start cooldown
    setCooldown(cooldownPeriod);
    
    cooldownTimerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [tradeSession.isActive, cooldownPeriod]);

  // Auto-exit on max duration
  useEffect(() => {
    if (tradeSession.isActive && tradeSession.duration >= maxTradeDuration) {
      exitTrade();
    }
  }, [tradeSession.duration, maxTradeDuration, tradeSession.isActive, exitTrade]);

  // Auto-refresh
  useEffect(() => {
    mountedRef.current = true;
    fetchAnalysis();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAnalysis, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [autoRefresh, refreshInterval, fetchAnalysis]);

  return {
    analysis,
    loading,
    error,
    tradeSession,
    cooldown,
    lastSignal,
    refetch: fetchAnalysis,
    enterTrade,
    exitTrade,
  };
};
