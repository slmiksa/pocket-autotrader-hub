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
   type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot';
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
   dailyHigh?: number;
   dailyLow?: number;
   error?: string;
   errorAr?: string;
 }
 
 interface UseGoldenPulseDataOptions {
   timeframe: string;
   refreshInterval?: number;
 }
 
 // Longer refresh interval to avoid constant API calls - 30 seconds
 export const useGoldenPulseData = ({ timeframe, refreshInterval = 30000 }: UseGoldenPulseDataOptions) => {
   const [data, setData] = useState<GoldenPulseData | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const mountedRef = useRef(true);
   const isFetchingRef = useRef(false);
   const lastTimeframeRef = useRef(timeframe);
 
   const fetchData = useCallback(async (forceRefresh = false) => {
     // Skip if already fetching, unless forced
     if (isFetchingRef.current && !forceRefresh) return;
     isFetchingRef.current = true;
     
     try {
       console.log(`[Golden Pulse] Fetching data for timeframe: ${timeframe}`);
       
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-golden-pulse?timeframe=${timeframe}`,
         {
           headers: {
             'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
             'Content-Type': 'application/json',
           },
         }
       );
 
       const jsonData = await response.json();
       
       // Check for error response from backend
       if (jsonData.error || jsonData.errorAr) {
         throw new Error(jsonData.errorAr || jsonData.error || 'فشل في جلب البيانات');
       }
 
       if (!response.ok) {
         throw new Error(`HTTP error: ${response.status}`);
       }
 
       // Validate that we got real data (not simulated)
       if (!jsonData.isLive) {
         throw new Error('البيانات غير متاحة حالياً - يرجى المحاولة لاحقاً');
       }
 
       if (mountedRef.current) {
         console.log(`[Golden Pulse] Data received: ${jsonData.candles?.length} candles, source: ${jsonData.dataSource}, price: ${jsonData.currentPrice}`);
         setData(jsonData);
         setError(null);
         setLoading(false);
       }
     } catch (err) {
       console.error('[Golden Pulse] Fetch error:', err);
       if (mountedRef.current) {
         const errorMessage = err instanceof Error ? err.message : 'خطأ في جلب بيانات السوق الحقيقية';
         setError(errorMessage);
         setLoading(false);
         // Don't clear existing data on error - keep showing last good data
       }
     } finally {
       isFetchingRef.current = false;
     }
   }, [timeframe]);
 
   // Reset and fetch when timeframe changes
   useEffect(() => {
     if (lastTimeframeRef.current !== timeframe) {
       lastTimeframeRef.current = timeframe;
       setLoading(true);
       setError(null);
       fetchData(true);
     }
   }, [timeframe, fetchData]);
 
   // Initial fetch and interval
   useEffect(() => {
     mountedRef.current = true;
     setLoading(true);
     fetchData(true);
 
     // Refresh every 30 seconds for live price updates
     const interval = setInterval(() => fetchData(false), refreshInterval);
 
     return () => {
       mountedRef.current = false;
       clearInterval(interval);
     };
   }, [fetchData, refreshInterval]);
 
   return {
     data,
     loading,
     error,
     refetch: () => fetchData(true),
   };
 };
