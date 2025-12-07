import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playPriceAlertSound, ensureAudioReady } from '@/utils/soundNotification';
import { usePriceAlerts } from './usePriceAlerts';

// Binance symbols mapping
const symbolToBinance: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'bnb': 'BNBUSDT',
  'solana': 'SOLUSDT',
  'xrp': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'dogecoin': 'DOGEUSDT',
  'avalanche': 'AVAXUSDT',
  'polkadot': 'DOTUSDT',
  'polygon': 'MATICUSDT',
  'chainlink': 'LINKUSDT',
  'litecoin': 'LTCUSDT',
  'toncoin': 'TONUSDT',
  'shiba': 'SHIBUSDT',
  'pepe': 'PEPEUSDT',
};

// Yahoo Finance proxy for stocks
const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS', 'BA', 'JPM', 'V', 'MA', 'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'NKE', 'SBUX', 'MCD'];

export const usePriceAlertChecker = () => {
  const { alerts, refetch } = usePriceAlerts();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const audioInitializedRef = useRef(false);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioInitializedRef.current) {
        ensureAudioReady();
        audioInitializedRef.current = true;
        console.log('Audio initialized for price alerts');
      }
    };

    // Initialize on any user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.png',
          tag: 'price-alert-' + Date.now(),
          requireInteraction: true,
          silent: false, // Allow sound
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        console.log('Browser notification sent:', title);
      } catch (error) {
        console.error('Failed to send browser notification:', error);
      }
    }
  }, []);

  const fetchBinancePrices = async (symbols: string[]): Promise<Record<string, number>> => {
    const priceMap: Record<string, number> = {};
    
    try {
      const binanceSymbols = symbols
        .filter(s => symbolToBinance[s])
        .map(s => symbolToBinance[s]);
      
      if (binanceSymbols.length === 0) return priceMap;

      const symbolsParam = binanceSymbols.map(s => `"${s}"`).join(',');
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=[${symbolsParam}]`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        for (const item of data) {
          const originalSymbol = Object.entries(symbolToBinance)
            .find(([_, v]) => v === item.symbol)?.[0];
          if (originalSymbol) {
            priceMap[originalSymbol] = parseFloat(item.price);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Binance prices:', error);
    }
    
    return priceMap;
  };

  const fetchStockPrices = async (symbols: string[]): Promise<Record<string, number>> => {
    const priceMap: Record<string, number> = {};
    
    const stocksToFetch = symbols.filter(s => stockSymbols.includes(s));
    
    for (const symbol of stocksToFetch) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`
        );
        
        if (response.ok) {
          const data = await response.json();
          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price) {
            priceMap[symbol] = Number(price);
          }
        }
      } catch (error) {
        // Silently fail for individual stocks
      }
    }
    
    return priceMap;
  };

  const checkAlerts = useCallback(async () => {
    if (isCheckingRef.current) return;
    
    const activeAlerts = alerts.filter(a => a.is_active && !a.triggered_at);
    if (activeAlerts.length === 0) return;

    isCheckingRef.current = true;

    try {
      const symbols = [...new Set(activeAlerts.map(a => a.symbol))];
      
      // Fetch prices from different sources
      const [binancePrices, stockPrices] = await Promise.all([
        fetchBinancePrices(symbols),
        fetchStockPrices(symbols)
      ]);
      
      const allPrices = { ...binancePrices, ...stockPrices };
      
      // Check each alert
      for (const alert of activeAlerts) {
        const currentPrice = allPrices[alert.symbol];
        if (currentPrice === undefined) continue;

        const targetPrice = Number(alert.target_price);
        let triggered = false;

        if (alert.condition === 'above' && currentPrice >= targetPrice) {
          triggered = true;
        } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
          triggered = true;
        }

        if (triggered) {
          console.log(`🎯 Alert triggered: ${alert.symbol} ${alert.condition} ${targetPrice} (current: ${currentPrice})`);
          
          // Update alert in database
          const { error: updateError } = await supabase
            .from('price_alerts')
            .update({ triggered_at: new Date().toISOString() })
            .eq('id', alert.id);

          if (!updateError) {
            // Create notification in database
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('user_notifications')
                .insert({
                  user_id: user.id,
                  type: 'price_alert',
                  title: `🔔 تنبيه سعري: ${alert.symbol_name_ar}`,
                  body: `السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice} (الحالي: ${currentPrice.toFixed(2)})`,
                  data: {
                    alert_id: alert.id,
                    symbol: alert.symbol,
                    current_price: currentPrice,
                    target_price: targetPrice,
                    condition: alert.condition
                  }
                });
            }

            // Play loud alert sound
            console.log('Playing price alert sound...');
            playPriceAlertSound();
            
            // Show toast with long duration
            toast.success(`🔔 تنبيه: ${alert.symbol_name_ar}`, {
              description: `السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice} (الحالي: ${currentPrice.toFixed(2)})`,
              duration: 15000,
            });
            
            // Browser notification
            sendBrowserNotification(
              `🔔 تنبيه سعري: ${alert.symbol_name_ar}`,
              `السعر ${alert.condition === 'above' ? 'صعد فوق' : 'هبط تحت'} ${targetPrice} (الحالي: ${currentPrice.toFixed(2)})`
            );

            // Refetch alerts to update state
            refetch();
          }
        }
      }
    } catch (error) {
      console.error('Error checking price alerts:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [alerts, refetch, sendBrowserNotification]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    // Start checking every 1 second for instant alerts
    intervalRef.current = setInterval(() => {
      checkAlerts();
    }, 1000);

    // Initial check
    checkAlerts();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAlerts]);

  return { checkAlerts };
};
