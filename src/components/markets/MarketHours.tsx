import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Building2, Loader2 } from 'lucide-react';

interface MarketSchedule {
  id: string;
  market_name: string;
  market_name_ar: string;
  open_time: string;
  close_time: string;
  timezone: string;
  is_active: boolean;
  days_active: string[];
}

const getDayAbbreviation = (): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

const isMarketOpen = (market: MarketSchedule): boolean => {
  const currentDay = getDayAbbreviation();
  if (!market.days_active.includes(currentDay)) return false;

  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  
  const open = parseTime(market.open_time);
  const close = parseTime(market.close_time);
  
  const openMinutes = open.hours * 60 + open.minutes;
  const closeMinutes = close.hours * 60 + close.minutes;

  // Handle 24-hour markets (like Forex with same open/close)
  if (openMinutes === closeMinutes) return true;

  // Handle overnight markets
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

const getTimeUntil = (market: MarketSchedule): string => {
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  
  const open = parseTime(market.open_time);
  const close = parseTime(market.close_time);
  
  const openMinutes = open.hours * 60 + open.minutes;
  const closeMinutes = close.hours * 60 + close.minutes;

  const isOpen = isMarketOpen(market);

  let targetMinutes: number;
  let label: string;

  if (isOpen) {
    // Time until close
    if (closeMinutes < openMinutes) {
      // Overnight market
      targetMinutes = currentMinutes >= openMinutes 
        ? (24 * 60 - currentMinutes) + closeMinutes
        : closeMinutes - currentMinutes;
    } else {
      targetMinutes = closeMinutes - currentMinutes;
    }
    label = 'للإغلاق';
  } else {
    // Time until open
    if (currentMinutes >= closeMinutes && closeMinutes > openMinutes) {
      // After close, before midnight - open tomorrow
      targetMinutes = (24 * 60 - currentMinutes) + openMinutes;
    } else if (currentMinutes < openMinutes) {
      targetMinutes = openMinutes - currentMinutes;
    } else {
      targetMinutes = (24 * 60 - currentMinutes) + openMinutes;
    }
    label = 'للافتتاح';
  }

  const hours = Math.floor(targetMinutes / 60);
  const minutes = targetMinutes % 60;

  if (hours > 0) {
    return `${hours}س ${minutes}د ${label}`;
  }
  return `${minutes}د ${label}`;
};

export const MarketHours = () => {
  const [markets, setMarkets] = useState<MarketSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('market_schedules')
        .select('*')
        .eq('is_active', true)
        .order('market_name');

      if (error) throw error;
      setMarkets(data || []);
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Building2 className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-[hsl(210,40%,98%)]">حالة الأسواق</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {markets.map(market => {
          const isOpen = isMarketOpen(market);
          const timeUntil = getTimeUntil(market);

          return (
            <div
              key={market.id}
              className={`p-3 rounded-xl border transition-all ${
                isOpen 
                  ? 'border-emerald-500/30 bg-emerald-500/5' 
                  : 'border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[hsl(210,40%,98%)] truncate">
                  {market.market_name_ar}
                </span>
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              </div>
              <div className="flex items-center gap-1 text-xs text-[hsl(215,20%,65%)]">
                <Clock className="h-3 w-3" />
                <span>{timeUntil}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
