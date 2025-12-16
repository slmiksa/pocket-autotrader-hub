import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, BarChart3, Clock, Target, Shield, BookOpen, RefreshCw, Volume2, VolumeX, Trash2, Bell, Eye, Search, Coins, DollarSign, BarChart2, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketAnalysis } from '@/hooks/useMarketAnalysis';
import { useSmartRecoveryTrades } from '@/hooks/useSmartRecoveryTrades';
import { 
  playBuySignalAlert, 
  playSellSignalAlert, 
  initializeAudio,
  requestNotificationPermission,
  sendBrowserNotification
} from '@/utils/tradingAlerts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/GlobalHeader';

// Market symbols organized by category
const MARKET_SYMBOLS = {
  forex: [
    { symbol: 'EURUSD', name: 'يورو/دولار', nameEn: 'EUR/USD' },
    { symbol: 'GBPUSD', name: 'جنيه/دولار', nameEn: 'GBP/USD' },
    { symbol: 'USDJPY', name: 'دولار/ين', nameEn: 'USD/JPY' },
    { symbol: 'AUDUSD', name: 'استرالي/دولار', nameEn: 'AUD/USD' },
    { symbol: 'USDCAD', name: 'دولار/كندي', nameEn: 'USD/CAD' },
    { symbol: 'USDCHF', name: 'دولار/فرنك', nameEn: 'USD/CHF' },
    { symbol: 'NZDUSD', name: 'نيوزلندي/دولار', nameEn: 'NZD/USD' },
    { symbol: 'EURGBP', name: 'يورو/جنيه', nameEn: 'EUR/GBP' },
  ],
  crypto: [
    { symbol: 'BTCUSDT', name: 'بيتكوين', nameEn: 'Bitcoin' },
    { symbol: 'ETHUSDT', name: 'ايثريوم', nameEn: 'Ethereum' },
    { symbol: 'BNBUSDT', name: 'BNB', nameEn: 'BNB' },
    { symbol: 'XRPUSDT', name: 'ريبل', nameEn: 'XRP' },
    { symbol: 'SOLUSDT', name: 'سولانا', nameEn: 'Solana' },
    { symbol: 'ADAUSDT', name: 'كاردانو', nameEn: 'Cardano' },
    { symbol: 'DOGEUSDT', name: 'دوجكوين', nameEn: 'Dogecoin' },
    { symbol: 'DOTUSDT', name: 'بولكادوت', nameEn: 'Polkadot' },
  ],
  commodities: [
    { symbol: 'XAUUSD', name: 'الذهب', nameEn: 'Gold' },
    { symbol: 'XAGUSD', name: 'الفضة', nameEn: 'Silver' },
    { symbol: 'WTIUSD', name: 'النفط', nameEn: 'Crude Oil' },
  ],
  stocks: [
    { symbol: 'AAPL', name: 'أبل', nameEn: 'Apple' },
    { symbol: 'GOOGL', name: 'جوجل', nameEn: 'Google' },
    { symbol: 'MSFT', name: 'مايكروسوفت', nameEn: 'Microsoft' },
    { symbol: 'AMZN', name: 'أمازون', nameEn: 'Amazon' },
    { symbol: 'TSLA', name: 'تسلا', nameEn: 'Tesla' },
    { symbol: 'META', name: 'ميتا', nameEn: 'Meta' },
    { symbol: 'NVDA', name: 'انفيديا', nameEn: 'Nvidia' },
  ],
};

const CATEGORY_INFO = {
  forex: { label: 'فوركس', icon: DollarSign, color: 'text-blue-400' },
  crypto: { label: 'عملات رقمية', icon: Coins, color: 'text-amber-400' },
  commodities: { label: 'معادن', icon: Gem, color: 'text-yellow-400' },
  stocks: { label: 'أسهم', icon: BarChart2, color: 'text-purple-400' },
};

const SmartRecoverySystem = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: false,
    conditions: false,
    management: false,
    rules: false,
    log: true
  });
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('commodities');
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

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

  // Manual alert trigger - user controls when to get notified
  const triggerManualAlert = () => {
    if (!analysis) return;
    
    if (soundEnabled) {
      if (analysis.signalType === 'BUY') {
        playBuySignalAlert();
      } else if (analysis.signalType === 'SELL') {
        playSellSignalAlert();
      }
    }

    if (notificationsEnabled) {
      sendBrowserNotification(
        `${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`,
        `السعر: ${analysis.currentPrice.toFixed(2)}`
      );
    }

    toast.success(`${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`, {
      duration: 2000,
    });
  };

  const { analysis, loading: analysisLoading, refetch: refetchAnalysis } = useMarketAnalysis({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    autoRefresh: true,
    refreshInterval: 5000, // تحديث فوري كل 5 ثواني
  });

  const { trades, loading: tradesLoading, deleteTrade, getStats } = useSmartRecoveryTrades();
  const stats = getStats();

  // Filter symbols based on search query
  const filteredSymbols = useMemo(() => {
    const categorySymbols = MARKET_SYMBOLS[activeCategory as keyof typeof MARKET_SYMBOLS] || [];
    
    if (!searchQuery.trim()) {
      return categorySymbols;
    }
    
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

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-emerald-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-amber-400" />;
    }
  };

  const getCVDStatusColor = (status: string) => {
    switch (status) {
      case 'rising': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'falling': return 'bg-red-500/20 text-red-400 border-red-500/40';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'profit': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">ربح</Badge>;
      case 'capital_recovery': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">استرجاع</Badge>;
      case 'loss': return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">خسارة</Badge>;
      case 'no_result': return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/40">بدون نتيجة</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir="rtl">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <GlobalHeader />
      </div>

      {/* Page Header with padding for fixed GlobalHeader */}
      <div className="pt-16 bg-gradient-to-b from-[#0f0f18] to-[#0a0a0f] border-b border-slate-800/50">
        <div className="container mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-10 w-10 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
              >
                <ArrowLeft className="h-5 w-5 text-slate-300" />
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Smart Recovery System
                </h1>
                <p className="text-xs text-slate-400">نظام التوصيات الذكي - MT5</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  if (!notificationsEnabled) requestNotificationPermission();
                }}
                className={`h-8 w-8 ${notificationsEnabled ? 'bg-primary/20' : 'bg-slate-800/50'} hover:bg-slate-700/50`}
              >
                <Bell className={`h-4 w-4 ${notificationsEnabled ? 'text-primary' : 'text-slate-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-8 w-8 ${soundEnabled ? 'bg-primary/20' : 'bg-slate-800/50'} hover:bg-slate-700/50`}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-6 space-y-5 max-w-4xl">
        {/* Symbol Selection with Search */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-3 space-y-3">
            {/* Search and Timeframe */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="ابحث عن رمز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-[80px] bg-slate-800/80 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="15m">M15</SelectItem>
                  <SelectItem value="30m">M30</SelectItem>
                  <SelectItem value="1h">H1</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchAnalysis()}
                disabled={analysisLoading}
                className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 ${analysisLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full bg-slate-800/50 p-1 h-auto">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const Icon = info.icon;
                    return (
                      <TabsTrigger 
                        key={key} 
                        value={key}
                        className={`flex-1 text-xs py-2 data-[state=active]:bg-slate-700 ${info.color}`}
                      >
                        <Icon className="w-3 h-3 ml-1" />
                        {info.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            )}

            {/* Symbols Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {filteredSymbols.map((sym) => (
                <Button
                  key={sym.symbol}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSymbol(sym.symbol);
                    setSearchQuery('');
                  }}
                  className={`justify-start h-auto py-2 px-3 ${
                    selectedSymbol === sym.symbol 
                      ? 'bg-primary/20 border border-primary/50 text-primary' 
                      : 'bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-700/30'
                  }`}
                >
                  <div className="text-right w-full">
                    <div className="font-bold text-xs">{sym.symbol}</div>
                    <div className="text-[10px] text-slate-400">{sym.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Status Dashboard */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden shadow-xl">
          <CardHeader className="pb-2 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <span className="font-bold">{selectedSymbol}</span>
                <span className="text-slate-400 text-xs">({currentSymbolInfo.name})</span>
                {analysisLoading && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {analysis ? (
              <>
                {/* Determine signal based on trend when signalType is NONE */}
                {(() => {
                  const effectiveSignal = analysis.signalType !== 'NONE' 
                    ? analysis.signalType 
                    : analysis.trend === 'bullish' ? 'BUY' : analysis.trend === 'bearish' ? 'SELL' : 'BUY';
                  const isBuy = effectiveSignal === 'BUY';
                  
                  return (
                    <>
                      {/* Main Signal - BUY or SELL */}
                      <div 
                        className={`rounded-2xl p-5 text-center cursor-pointer transition-all active:scale-95 shadow-lg ${
                          isBuy 
                            ? 'bg-gradient-to-br from-green-600 to-green-800 border-2 border-green-400' 
                            : 'bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400'
                        }`}
                        onClick={triggerManualAlert}
                      >
                        <div className="flex items-center justify-center gap-3 mb-3">
                          {isBuy ? (
                            <TrendingUp className="w-10 h-10 text-white" />
                          ) : (
                            <TrendingDown className="w-10 h-10 text-white" />
                          )}
                          <span className="text-4xl font-black text-white drop-shadow-lg">
                            {isBuy ? 'شراء' : 'بيع'}
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                          {analysis.currentPrice.toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                        </div>
                        {analysis.priceChange !== undefined && (
                          <div className={`inline-flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full ${
                            analysis.priceChange >= 0 ? 'bg-green-400/30 text-green-200' : 'bg-red-400/30 text-red-200'
                          }`}>
                            {analysis.priceChange >= 0 ? '▲' : '▼'} {Math.abs(analysis.priceChange).toFixed(2)}%
                          </div>
                        )}
                        <div className="text-xs text-white/70 mt-3">🔔 اضغط للتنبيه الصوتي</div>
                      </div>

                      {/* Entry, Target, Stop Loss */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-3 text-center border border-blue-500/40">
                          <div className="text-[10px] text-blue-300 font-bold mb-1">🎯 سعر الدخول</div>
                          <div className="font-black text-lg text-blue-200">
                            {analysis.currentPrice.toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                          </div>
                          <div className="text-[9px] text-blue-400 mt-1">الدخول الآن</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-3 text-center border border-green-500/40">
                          <div className="text-[10px] text-green-300 font-bold mb-1">🏆 الهدف</div>
                          <div className="font-black text-lg text-green-200">
                            {isBuy 
                              ? (analysis.currentPrice * 1.015).toFixed(analysis.currentPrice > 100 ? 2 : 5)
                              : (analysis.currentPrice * 0.985).toFixed(analysis.currentPrice > 100 ? 2 : 5)
                            }
                          </div>
                          <div className="text-[9px] text-green-400 mt-1">+1.5%</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-3 text-center border border-red-500/40">
                          <div className="text-[10px] text-red-300 font-bold mb-1">🛑 وقف الخسارة</div>
                          <div className="font-black text-lg text-red-200">
                            {isBuy 
                              ? (analysis.currentPrice * 0.99).toFixed(analysis.currentPrice > 100 ? 2 : 5)
                              : (analysis.currentPrice * 1.01).toFixed(analysis.currentPrice > 100 ? 2 : 5)
                            }
                          </div>
                          <div className="text-[9px] text-red-400 mt-1">-1%</div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Compact Status Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium mb-1">الاتجاه</div>
                    <div className={`text-lg font-black ${analysis.trend === 'bullish' ? 'text-green-400' : analysis.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.trend === 'bullish' ? '↑ صاعد' : analysis.trend === 'bearish' ? '↓ هابط' : '→ عرضي'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium mb-1">الزخم</div>
                    <div className={`text-lg font-black ${analysis.cvdStatus === 'rising' ? 'text-green-400' : analysis.cvdStatus === 'falling' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.cvdStatus === 'rising' ? '↑ قوي' : analysis.cvdStatus === 'falling' ? '↓ ضعيف' : '→ متوسط'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium mb-1">المتوسط</div>
                    <div className={`text-lg font-black ${analysis.priceAboveEMA ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.priceAboveEMA ? '✓ فوق' : '✗ تحت'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium mb-1">السعر العادل</div>
                    <div className={`text-lg font-black ${analysis.nearVWAP ? 'text-green-400' : 'text-yellow-400'}`}>
                      {analysis.nearVWAP ? '✓ قريب' : '⚠ بعيد'}
                    </div>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium">المتوسط المتحرك 200</div>
                    <div className="font-bold text-lg text-white">{analysis.ema200.toFixed(analysis.ema200 > 100 ? 2 : 5)}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-[10px] text-cyan-400 font-medium">السعر العادل VWAP</div>
                    <div className="font-bold text-lg text-white">{analysis.vwap.toFixed(analysis.vwap > 100 ? 2 : 5)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
                <p className="text-white text-lg font-bold mb-2">جاري تحليل السوق...</p>
                <p className="text-cyan-400 text-sm">جلب بيانات السعر الحية</p>
                <p className="text-slate-500 text-xs mt-2">التحديث كل 5 ثواني</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-cyan-400">{stats.total}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">إجمالي التوصيات</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-green-400">{stats.winRate}%</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">نسبة النجاح</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-black ${stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.totalProfitLoss.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">إجمالي النتائج</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-600">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-purple-400">{stats.openTrades}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium">توصيات نشطة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Signals Log */}
        <Collapsible open={openSections.log} onOpenChange={() => toggleSection('log')}>
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <BookOpen className="w-5 h-5 text-primary" />
                    سجل التوصيات
                    {stats.openTrades > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 mr-2">{stats.openTrades} نشطة</Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.log ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                {!user ? (
                  <div className="text-center py-10">
                    <Shield className="w-14 h-14 mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-400 text-sm mb-3">يجب تسجيل الدخول لعرض السجل</p>
                    <Button variant="outline" className="bg-slate-800/50 border-slate-700/50" onClick={() => navigate('/auth')}>
                      تسجيل الدخول
                    </Button>
                  </div>
                ) : tradesLoading ? (
                  <div className="text-center py-10">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-slate-600" />
                  </div>
                ) : trades.length === 0 ? (
                  <div className="text-center py-10">
                    <BookOpen className="w-14 h-14 mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-400 text-sm">لا توجد توصيات مسجلة بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trades.slice(0, 10).map((trade) => (
                      <div 
                        key={trade.id}
                        className={`p-4 rounded-xl border ${
                          trade.status === 'open' 
                            ? 'bg-blue-500/5 border-blue-500/30' 
                            : 'bg-slate-800/30 border-slate-700/30'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-4">
                            <Badge className={`text-sm px-3 py-1 ${trade.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {trade.direction === 'BUY' ? '📈 شراء' : '📉 بيع'}
                            </Badge>
                            <div>
                              <div className="font-bold text-white">{trade.symbol}</div>
                              <div className="text-xs text-slate-500">
                                سعر الدخول: ${trade.entry_price.toFixed(2)}
                                {trade.exit_price && ` | الخروج: $${trade.exit_price.toFixed(2)}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {trade.status === 'open' ? (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                                نشطة
                              </Badge>
                            ) : (
                              <>
                                {getResultBadge(trade.result)}
                                {trade.profit_loss !== null && (
                                  <span className={`text-sm font-bold ${trade.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ${trade.profit_loss.toFixed(2)}
                                  </span>
                                )}
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-500/20"
                              onClick={() => deleteTrade(trade.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        {trade.was_reinforced && (
                          <div className="mt-3 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg inline-block">
                            ✓ تم التعزيز عند ${trade.reinforcement_price?.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* System Overview */}
        <Collapsible open={openSections.overview} onOpenChange={() => toggleSection('overview')}>
          <Card className="bg-slate-900/50 border-slate-800/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3 border-b border-slate-800/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-white">
                    <Target className="w-5 h-5 text-primary" />
                    نظرة عامة على النظام
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.overview ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="font-bold text-sm flex items-center gap-2 text-white mb-3">
                      <Target className="w-4 h-4 text-emerald-400" />
                      الأهداف الرئيسية
                    </h4>
                    <ul className="text-sm text-slate-400 space-y-2 mr-6">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        استرجاع رأس المال
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        تحقيق ربح بسيط (0.5% - 1%)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        توصيات عالية الاحتمالية
                      </li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h4 className="font-bold text-sm flex items-center gap-2 text-white mb-3">
                      <Clock className="w-4 h-4 text-blue-400" />
                      الإطارات الزمنية
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">✓ M15</Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">✓ M30</Badge>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/40">✗ M1</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Important Note */}
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-amber-400 text-sm mb-1">تنبيه مهم</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  هذا نظام توصيات فقط وليس تنفيذ تلقائي. التحليل يعتمد على الاتجاه القصير المدى (آخر 10 شموع).
                  للذهب XAUUSD نستخدم PAXG/USDT من Binance كبديل وقد يختلف السعر قليلاً عن السعر الفعلي في MT5.
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
