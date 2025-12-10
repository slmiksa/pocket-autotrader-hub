import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Filter, RefreshCw, Loader2, Globe2 } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PullToRefresh } from '@/components/PullToRefresh';
import { MarketHours } from '@/components/markets/MarketHours';

interface EconomicEvent {
  id: string;
  title: string;
  title_ar: string;
  country: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event_time: string;
  actual_value: string | null;
  forecast_value: string | null;
  previous_value: string | null;
}

const impactColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const impactLabels = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي'
};

const currencyFlags: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
  NZD: '🇳🇿',
  CNY: '🇨🇳'
};

const EconomicCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  useEffect(() => {
    refreshCalendar();
  }, []);

  const refreshCalendar = async () => {
    setLoading(true);
    try {
      // First, fetch fresh data from Finnhub API
      console.log('Fetching fresh economic calendar data...');
      const { error: fetchError } = await supabase.functions.invoke('fetch-economic-calendar');
      if (fetchError) {
        console.error('Error fetching from API:', fetchError);
      }
      
      // Then load from database
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing calendar:', error);
      await fetchEvents();
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('economic_events')
        .select('*')
        .gte('event_time', new Date().toISOString())
        .order('event_time', { ascending: true })
        .limit(50);

      if (error) throw error;
      setEvents((data || []) as EconomicEvent[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter !== 'all' && event.impact !== filter) return false;
    if (currencyFilter !== 'all' && event.currency !== currencyFilter) return false;
    return true;
  });

  const todayEvents = filteredEvents.filter(e => isToday(new Date(e.event_time)));
  const tomorrowEvents = filteredEvents.filter(e => isTomorrow(new Date(e.event_time)));
  const laterEvents = filteredEvents.filter(e => {
    const eventDate = new Date(e.event_time);
    return !isToday(eventDate) && !isTomorrow(eventDate);
  });

  const currencies = [...new Set(events.map(e => e.currency))];

  const renderEvent = (event: EconomicEvent) => {
    const eventDate = new Date(event.event_time);
    const isPast = eventDate < new Date();
    const timeRemaining = formatDistanceToNow(eventDate, { locale: ar, addSuffix: true });

    return (
      <Card 
        key={event.id} 
        className={`p-4 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)] hover:border-primary/30 transition-all ${isPast ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start gap-4">
          {/* Currency Flag */}
          <div className="text-3xl">{currencyFlags[event.currency] || '🌍'}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[hsl(210,40%,98%)] truncate">{event.title_ar}</h3>
              <Badge className={`${impactColors[event.impact]} text-xs`}>
                {impactLabels[event.impact]}
              </Badge>
            </div>
            
            <p className="text-sm text-[hsl(215,20%,65%)] mb-2">{event.title}</p>
            
            <div className="flex items-center gap-4 text-xs text-[hsl(215,20%,50%)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(eventDate, 'HH:mm', { locale: ar })}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(eventDate, 'dd MMM', { locale: ar })}
              </span>
              {!isPast && (
                <span className="text-primary">{timeRemaining}</span>
              )}
            </div>

            {/* Values */}
            {(event.actual_value || event.forecast_value || event.previous_value) && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[hsl(217,33%,17%)]">
                {event.previous_value && (
                  <div className="text-center">
                    <p className="text-xs text-[hsl(215,20%,50%)]">سابق</p>
                    <p className="text-sm font-medium text-[hsl(210,40%,98%)]">{event.previous_value}</p>
                  </div>
                )}
                {event.forecast_value && (
                  <div className="text-center">
                    <p className="text-xs text-[hsl(215,20%,50%)]">متوقع</p>
                    <p className="text-sm font-medium text-amber-400">{event.forecast_value}</p>
                  </div>
                )}
                {event.actual_value && (
                  <div className="text-center">
                    <p className="text-xs text-[hsl(215,20%,50%)]">فعلي</p>
                    <p className="text-sm font-medium text-emerald-400">{event.actual_value}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Impact Indicator */}
          <div className={`w-2 h-full min-h-[60px] rounded-full ${
            event.impact === 'high' ? 'bg-red-500' :
            event.impact === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
        </div>
      </Card>
    );
  };

  const renderEventGroup = (title: string, eventsGroup: EconomicEvent[], icon: React.ReactNode) => {
    if (eventsGroup.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[hsl(215,20%,65%)]">
          {icon}
          <span className="font-medium">{title}</span>
          <Badge variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)]">
            {eventsGroup.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {eventsGroup.map(renderEvent)}
        </div>
      </div>
    );
  };

  return (
    <PullToRefresh onRefresh={fetchEvents} className="min-h-screen bg-[hsl(222,47%,6%)] pt-[calc(env(safe-area-inset-top,0px)+88px)]">
      <div dir="rtl" className="h-full">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="bg-[hsl(222,47%,8%)]/80 backdrop-blur-xl border-b border-[hsl(217,33%,17%)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)} 
                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(217,33%,17%)]"
              >
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </Button>
              <h1 className="text-xl font-bold text-[hsl(210,40%,98%)] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                التقويم الاقتصادي
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refreshCalendar}
                disabled={loading}
                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(217,33%,17%)]"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6 relative">
          {/* Market Hours Section */}
          <MarketHours />

          {/* Filters */}
          <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[hsl(215,20%,65%)]" />
                <span className="text-sm text-[hsl(215,20%,65%)]">تصفية:</span>
              </div>
              
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-32 bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]">
                  <SelectValue placeholder="التأثير" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)]">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="high">عالي التأثير</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-32 bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]">
                  <SelectValue placeholder="العملة" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)]">
                  <SelectItem value="all">كل العملات</SelectItem>
                  {currencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currencyFlags[currency]} {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Events List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-12 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)] text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-blue-500/40" />
              </div>
              <p className="text-lg font-medium text-[hsl(210,40%,98%)]">لا توجد أحداث اقتصادية</p>
              <p className="text-sm text-[hsl(215,20%,65%)] mt-1">لم يتم العثور على أحداث تطابق معايير البحث</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {renderEventGroup(
                'اليوم',
                todayEvents,
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              )}
              {renderEventGroup(
                'غداً',
                tomorrowEvents,
                <Clock className="h-4 w-4 text-blue-400" />
              )}
              {renderEventGroup(
                'الأيام القادمة',
                laterEvents,
                <Calendar className="h-4 w-4 text-[hsl(215,20%,65%)]" />
              )}
            </div>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
};

export default EconomicCalendar;
