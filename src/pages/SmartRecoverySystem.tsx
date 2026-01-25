import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Clock, RefreshCw, Volume2, VolumeX, Bell, Search, Coins, Gem, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketAnalysis } from '@/hooks/useMarketAnalysis';
import { playBuySignalAlert, playSellSignalAlert, initializeAudio, requestNotificationPermission, sendBrowserNotification } from '@/utils/tradingAlerts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/GlobalHeader';
import { TradeRecommendation } from '@/components/trading/TradeRecommendation';
import { ExplosionCountdown } from '@/components/trading/ExplosionCountdown';

// Market symbols organized by category
const MARKET_SYMBOLS = {
  forex: [
    { symbol: 'EURUSD', name: 'يورو/دولار', nameEn: 'EUR/USD' },
    { symbol: 'GBPUSD', name: 'استرليني/دولار', nameEn: 'GBP/USD' },
    { symbol: 'USDJPY', name: 'دولار/ين', nameEn: 'USD/JPY' },
    { symbol: 'USDCHF', name: 'دولار/فرنك', nameEn: 'USD/CHF' },
    { symbol: 'AUDUSD', name: 'أسترالي/دولار', nameEn: 'AUD/USD' },
    { symbol: 'USDCAD', name: 'دولار/كندي', nameEn: 'USD/CAD' },
    { symbol: 'NZDUSD', name: 'نيوزلندي/دولار', nameEn: 'NZD/USD' },
    { symbol: 'EURGBP', name: 'يورو/استرليني', nameEn: 'EUR/GBP' },
    { symbol: 'EURJPY', name: 'يورو/ين', nameEn: 'EUR/JPY' },
    { symbol: 'GBPJPY', name: 'استرليني/ين', nameEn: 'GBP/JPY' }
  ],
  crypto: [
    { symbol: 'BTCUSDT', name: 'بيتكوين', nameEn: 'Bitcoin' },
    { symbol: 'ETHUSDT', name: 'ايثريوم', nameEn: 'Ethereum' },
    { symbol: 'BNBUSDT', name: 'BNB', nameEn: 'BNB' },
    { symbol: 'XRPUSDT', name: 'ريبل', nameEn: 'XRP' },
    { symbol: 'SOLUSDT', name: 'سولانا', nameEn: 'Solana' },
    { symbol: 'ADAUSDT', name: 'كاردانو', nameEn: 'Cardano' },
    { symbol: 'DOGEUSDT', name: 'دوجكوين', nameEn: 'Dogecoin' },
    { symbol: 'DOTUSDT', name: 'بولكادوت', nameEn: 'Polkadot' }
  ],
  commodities: [
    { symbol: 'XAUUSD', name: 'الذهب', nameEn: 'Gold' }
  ]
};

const CATEGORY_INFO = {
  forex: { label: 'فوركس', icon: DollarSign, color: 'text-blue-400' },
  crypto: { label: 'عملات رقمية', icon: Coins, color: 'text-amber-400' },
  commodities: { label: 'معادن', icon: Gem, color: 'text-yellow-400' }
};

const SmartRecoverySystem = () => {
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [xauPriceSource, setXauPriceSource] = useState<'spot' | 'futures'>('spot');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('crypto');

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    return () => document.removeEventListener('click', handleInteraction);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  const { analysis, loading: analysisLoading, refetch: refetchAnalysis } = useMarketAnalysis({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    priceSource: selectedSymbol === 'XAUUSD' ? xauPriceSource : undefined,
    autoRefresh: true,
    refreshInterval: 5000
  });

  // Manual alert trigger
  const triggerManualAlert = () => {
    if (!analysis) return;
    if (soundEnabled) {
      if (analysis.signalType === 'BUY') playBuySignalAlert();
      else if (analysis.signalType === 'SELL') playSellSignalAlert();
    }
    if (notificationsEnabled) {
      sendBrowserNotification(
        `${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`,
        `السعر: ${analysis.currentPrice.toFixed(2)}`
      );
    }
    toast.success(`${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`, { duration: 2000 });
  };

  // Filter symbols based on search query
  const filteredSymbols = useMemo(() => {
    const categorySymbols = MARKET_SYMBOLS[activeCategory as keyof typeof MARKET_SYMBOLS] || [];
    if (!searchQuery.trim()) return categorySymbols;
    
    const allSymbols = Object.entries(MARKET_SYMBOLS).flatMap(([cat, symbols]) => 
      symbols.map(s => ({ ...s, category: cat }))
    );
    const query = searchQuery.toLowerCase();
    return allSymbols.filter(s => 
      s.symbol.toLowerCase().includes(query) || 
      s.name.includes(query) || 
      s.nameEn.toLowerCase().includes(query)
    );
  }, [searchQuery, activeCategory]);

  // Get current symbol info
  const currentSymbolInfo = useMemo(() => {
    const allSymbols = Object.values(MARKET_SYMBOLS).flat();
    return allSymbols.find(s => s.symbol === selectedSymbol) || { symbol: selectedSymbol, name: selectedSymbol, nameEn: selectedSymbol };
  }, [selectedSymbol]);

  const signalType = analysis?.signalType as 'BUY' | 'SELL' | 'WAIT' | 'NONE';
  const isWait = signalType === 'WAIT' || signalType === 'NONE';
  const isBuy = signalType === 'BUY';
  const confidence = (analysis as any)?.confidence || 0;
  const signalReasons = (analysis as any)?.signalReasons || [];

  return (
    <div className="dark min-h-screen bg-background" dir="rtl">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <GlobalHeader />
      </div>

      {/* Page Header */}
      <div className="pt-16 bg-gradient-to-b from-muted/50 to-background border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')} 
                className="h-10 w-10 bg-muted/50 hover:bg-muted border border-border/50"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  نظام الصيّاد الهادئ
                </h1>
                <p className="text-xs text-muted-foreground">تحليل ذكي للأسواق</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  if (!notificationsEnabled) requestNotificationPermission();
                }} 
                className={`h-9 w-9 ${notificationsEnabled ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`h-9 w-9 ${soundEnabled ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Symbol Selection */}
        <Card className="bg-card/80 border-border/50">
          <CardContent className="p-4 space-y-4">
            {/* Search and Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="ابحث عن رمز..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="pr-10 bg-muted/50 border-border"
                />
              </div>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-20 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark bg-popover border-border">
                  <SelectItem value="15m">M15</SelectItem>
                  <SelectItem value="30m">M30</SelectItem>
                  <SelectItem value="1h">H1</SelectItem>
                </SelectContent>
              </Select>

              {selectedSymbol === 'XAUUSD' && (
                <Select value={xauPriceSource} onValueChange={v => setXauPriceSource(v as 'spot' | 'futures')}>
                  <SelectTrigger className="w-28 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark bg-popover border-border">
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetchAnalysis()} 
                disabled={analysisLoading}
                className="bg-muted/50 border-border"
              >
                <RefreshCw className={`h-4 w-4 ${analysisLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full bg-muted/50 p-1 h-auto">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    return (
                      <TabsTrigger 
                        key={key} 
                        value={key} 
                        className={`flex-1 text-xs py-2.5 data-[state=active]:bg-background ${info.color}`}
                      >
                        <Icon className="w-4 h-4 ml-1.5" />
                        {info.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            )}

            {/* Symbols Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredSymbols.map(sym => {
                const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
                const isSupported = sym.symbol === 'XAUUSD' || sym.symbol.endsWith('USDT') || forexPairs.includes(sym.symbol);
                const isSelected = selectedSymbol === sym.symbol;
                
                return (
                  <Button 
                    key={sym.symbol} 
                    variant="ghost" 
                    size="sm" 
                    disabled={!isSupported} 
                    onClick={() => {
                      if (!isSupported) {
                        toast.error('غير مدعوم حالياً');
                        return;
                      }
                      setSelectedSymbol(sym.symbol);
                      setSearchQuery('');
                    }} 
                    className={`justify-start h-auto py-2.5 px-3 ${
                      isSelected 
                        ? 'bg-primary/20 border-2 border-primary/50 text-primary' 
                        : 'bg-muted/30 hover:bg-muted/50 text-foreground border border-border/30'
                    } ${!isSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-right w-full">
                      <div className="font-bold text-sm">{sym.symbol}</div>
                      <div className="text-[11px] text-muted-foreground">{sym.name}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Signal Card */}
        <Card className="bg-card border-border overflow-hidden shadow-xl">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-foreground">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-bold">{selectedSymbol}</span>
                <span className="text-muted-foreground text-xs">({currentSymbolInfo.name})</span>
                {analysisLoading && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            {analysis ? (
              <>
                {/* Confidence Bar */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">مستوى الثقة</span>
                    <span className={`text-lg font-bold ${
                      confidence >= 60 ? 'text-green-500' : confidence >= 40 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {confidence}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        confidence >= 60 ? 'bg-green-500' : confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${confidence}%` }} 
                    />
                  </div>
                </div>

                {/* Main Signal */}
                <div 
                  className={`rounded-2xl p-6 text-center cursor-pointer transition-all active:scale-98 shadow-lg ${
                    isWait 
                      ? 'bg-gradient-to-br from-amber-600/80 to-amber-700/80 border-2 border-amber-400/60' 
                      : isBuy 
                      ? 'bg-gradient-to-br from-green-600 to-green-700 border-2 border-green-400' 
                      : 'bg-gradient-to-br from-red-600 to-red-700 border-2 border-red-400'
                  }`} 
                  onClick={isWait ? undefined : triggerManualAlert}
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {isWait ? <AlertTriangle className="w-12 h-12 text-white" /> : isBuy ? <TrendingUp className="w-12 h-12 text-white" /> : <TrendingDown className="w-12 h-12 text-white" />}
                    <span className="text-4xl font-black text-white">
                      {isWait ? 'انتظار' : isBuy ? 'شراء' : 'بيع'}
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {analysis.currentPrice.toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                  </div>
                  {analysis.priceChange !== undefined && (
                    <div className={`inline-flex items-center gap-1 text-lg font-bold px-4 py-1.5 rounded-full ${
                      analysis.priceChange >= 0 ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'
                    }`}>
                      {analysis.priceChange >= 0 ? '▲' : '▼'} {Math.abs(analysis.priceChange).toFixed(2)}%
                    </div>
                  )}
                  <div className="mt-4 text-xs text-white/70">
                    آخر تحديث: {new Date(analysis.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {!isWait && (
                    <div className="text-xs text-white/60 mt-2">🔔 اضغط للتنبيه الصوتي</div>
                  )}
                </div>

                {/* Signal Reasons */}
                {signalReasons.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="text-sm text-primary font-medium mb-3">📊 أسباب التوصية:</div>
                    <div className="flex flex-wrap gap-2">
                      {signalReasons.map((reason: string, idx: number) => {
                        const isPositive = reason.includes('صاعد') || reason.includes('شراء') || reason.includes('إيجابي');
                        const isNegative = reason.includes('هابط') || reason.includes('بيع') || reason.includes('سلبي');
                        return (
                          <span 
                            key={idx} 
                            className={`text-xs px-3 py-1.5 rounded-full ${
                              isPositive 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : isNegative 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                : 'bg-muted text-muted-foreground border border-border/30'
                            }`}
                          >
                            {reason}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Entry, Target, Stop Loss */}
                {!isWait && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-500/10 rounded-xl p-4 text-center border border-blue-500/30">
                      <div className="text-xs text-blue-400 font-bold mb-1">🎯 الدخول</div>
                      <div className="font-black text-lg text-blue-300">
                        {analysis.currentPrice.toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                      </div>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/30">
                      <div className="text-xs text-green-400 font-bold mb-1">🏆 الهدف</div>
                      <div className="font-black text-lg text-green-300">
                        {isBuy 
                          ? (analysis.currentPrice * 1.015).toFixed(analysis.currentPrice > 100 ? 2 : 5) 
                          : (analysis.currentPrice * 0.985).toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                      </div>
                      <div className="text-[10px] text-green-400/70 mt-0.5">+1.5%</div>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/30">
                      <div className="text-xs text-red-400 font-bold mb-1">🛑 الوقف</div>
                      <div className="font-black text-lg text-red-300">
                        {isBuy 
                          ? (analysis.currentPrice * 0.99).toFixed(analysis.currentPrice > 100 ? 2 : 5) 
                          : (analysis.currentPrice * 1.01).toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                      </div>
                      <div className="text-[10px] text-red-400/70 mt-0.5">-1%</div>
                    </div>
                  </div>
                )}

                {/* Mini Indicators */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/30">
                    <div className="text-[10px] text-muted-foreground mb-1">الاتجاه</div>
                    <div className={`text-lg font-bold ${
                      analysis.trend === 'bullish' ? 'text-green-500' : analysis.trend === 'bearish' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {analysis.trend === 'bullish' ? '↑' : analysis.trend === 'bearish' ? '↓' : '→'}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/30">
                    <div className="text-[10px] text-muted-foreground mb-1">RSI</div>
                    <div className={`text-lg font-bold ${
                      ((analysis as any).rsi || 50) > 70 ? 'text-red-500' : ((analysis as any).rsi || 50) < 30 ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {((analysis as any).rsi || 50).toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/30">
                    <div className="text-[10px] text-muted-foreground mb-1">MACD</div>
                    <div className={`text-lg font-bold ${
                      ((analysis as any).macd?.histogram || 0) > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {((analysis as any).macd?.histogram || 0) > 0 ? '↑' : '↓'}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/30">
                    <div className="text-[10px] text-muted-foreground mb-1">EMA200</div>
                    <div className={`text-lg font-bold ${analysis.priceAboveEMA ? 'text-green-500' : 'text-red-500'}`}>
                      {analysis.priceAboveEMA ? '✓' : '✗'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl">
                <RefreshCw className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-foreground text-lg font-bold mb-1">جاري تحليل السوق...</p>
                <p className="text-muted-foreground text-sm">التحديث كل 5 ثواني</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Recommendation */}
        <TradeRecommendation 
          analysis={analysis ? {
            signalType: analysis.signalType as 'BUY' | 'SELL' | 'WAIT' | 'NONE',
            confidence: (analysis as any).confidence,
            currentPrice: analysis.currentPrice,
            trend: analysis.trend,
            rsi: (analysis as any).rsi,
            cvdStatus: analysis.cvdStatus,
            priceAboveEMA: analysis.priceAboveEMA,
            signalReasons: (analysis as any).signalReasons
          } : null} 
          symbol={selectedSymbol} 
          loading={analysisLoading} 
        />

        {/* Explosion Countdown Timer */}
        <ExplosionCountdown 
          symbol={selectedSymbol}
          timeframe={selectedTimeframe}
          serverTimestamp={analysis?.timestamp}
          accumulation={(analysis as any)?.accumulation}
          realTimeMetrics={(analysis as any)?.realTimeMetrics}
          explosionTimer={(analysis as any)?.explosionTimer}
          priceConsolidation={(analysis as any)?.priceConsolidation}
          bollingerSqueeze={(analysis as any)?.bollingerSqueeze}
          volumeSpike={(analysis as any)?.volumeSpike}
        />

        {/* Disclaimer */}
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200/80 font-medium">تنبيه مهم</p>
                <p className="text-xs text-amber-300/60 mt-1">
                  هذا النظام للمساعدة فقط وليس نصيحة مالية. تداول بمسؤولية.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartRecoverySystem;
