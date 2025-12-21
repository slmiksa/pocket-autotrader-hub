import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, BarChart3, Clock, Target, Shield, BookOpen, RefreshCw, Volume2, VolumeX, Trash2, Bell, Eye, Search, Coins, Gem, DollarSign } from 'lucide-react';
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
import { playBuySignalAlert, playSellSignalAlert, initializeAudio, requestNotificationPermission, sendBrowserNotification } from '@/utils/tradingAlerts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/GlobalHeader';
import { TradeRecommendation } from '@/components/trading/TradeRecommendation';

// Market symbols organized by category
const MARKET_SYMBOLS = {
  forex: [{
    symbol: 'EURUSD',
    name: 'يورو/دولار',
    nameEn: 'EUR/USD'
  }, {
    symbol: 'GBPUSD',
    name: 'استرليني/دولار',
    nameEn: 'GBP/USD'
  }, {
    symbol: 'USDJPY',
    name: 'دولار/ين',
    nameEn: 'USD/JPY'
  }, {
    symbol: 'USDCHF',
    name: 'دولار/فرنك',
    nameEn: 'USD/CHF'
  }, {
    symbol: 'AUDUSD',
    name: 'أسترالي/دولار',
    nameEn: 'AUD/USD'
  }, {
    symbol: 'USDCAD',
    name: 'دولار/كندي',
    nameEn: 'USD/CAD'
  }, {
    symbol: 'NZDUSD',
    name: 'نيوزلندي/دولار',
    nameEn: 'NZD/USD'
  }, {
    symbol: 'EURGBP',
    name: 'يورو/استرليني',
    nameEn: 'EUR/GBP'
  }, {
    symbol: 'EURJPY',
    name: 'يورو/ين',
    nameEn: 'EUR/JPY'
  }, {
    symbol: 'GBPJPY',
    name: 'استرليني/ين',
    nameEn: 'GBP/JPY'
  }],
  crypto: [{
    symbol: 'BTCUSDT',
    name: 'بيتكوين',
    nameEn: 'Bitcoin'
  }, {
    symbol: 'ETHUSDT',
    name: 'ايثريوم',
    nameEn: 'Ethereum'
  }, {
    symbol: 'BNBUSDT',
    name: 'BNB',
    nameEn: 'BNB'
  }, {
    symbol: 'XRPUSDT',
    name: 'ريبل',
    nameEn: 'XRP'
  }, {
    symbol: 'SOLUSDT',
    name: 'سولانا',
    nameEn: 'Solana'
  }, {
    symbol: 'ADAUSDT',
    name: 'كاردانو',
    nameEn: 'Cardano'
  }, {
    symbol: 'DOGEUSDT',
    name: 'دوجكوين',
    nameEn: 'Dogecoin'
  }, {
    symbol: 'DOTUSDT',
    name: 'بولكادوت',
    nameEn: 'Polkadot'
  }],
  commodities: [{
    symbol: 'XAUUSD',
    name: 'الذهب',
    nameEn: 'Gold'
  }]
};
const CATEGORY_INFO = {
  forex: {
    label: 'فوركس',
    icon: DollarSign,
    color: 'text-blue-400'
  },
  crypto: {
    label: 'عملات رقمية',
    icon: Coins,
    color: 'text-amber-400'
  },
  commodities: {
    label: 'معادن',
    icon: Gem,
    color: 'text-yellow-400'
  }
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
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [xauPriceSource, setXauPriceSource] = useState<'spot' | 'futures'>('spot');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('forex');
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({
      data
    }) => setUser(data.user));
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
      sendBrowserNotification(`${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`, `السعر: ${analysis.currentPrice.toFixed(2)}`);
    }
    toast.success(`${analysis.signalType === 'BUY' ? '🟢 شراء' : '🔴 بيع'} - ${analysis.symbol}`, {
      duration: 2000
    });
  };
  const {
    analysis,
    loading: analysisLoading,
    refetch: refetchAnalysis
  } = useMarketAnalysis({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    priceSource: selectedSymbol === 'XAUUSD' ? xauPriceSource : undefined,
    autoRefresh: true,
    refreshInterval: 5000 // تحديث فوري كل 5 ثواني
  });
  const {
    trades,
    loading: tradesLoading,
    deleteTrade,
    getStats
  } = useSmartRecoveryTrades();
  const stats = getStats();

  // Filter symbols based on search query
  const filteredSymbols = useMemo(() => {
    const categorySymbols = MARKET_SYMBOLS[activeCategory as keyof typeof MARKET_SYMBOLS] || [];
    if (!searchQuery.trim()) {
      return categorySymbols;
    }
    const allSymbols = Object.entries(MARKET_SYMBOLS).flatMap(([cat, symbols]) => symbols.map(s => ({
      ...s,
      category: cat
    })));
    const query = searchQuery.toLowerCase();
    return allSymbols.filter(s => s.symbol.toLowerCase().includes(query) || s.name.includes(query) || s.nameEn.toLowerCase().includes(query));
  }, [searchQuery, activeCategory]);

  // Get current symbol info
  const currentSymbolInfo = useMemo(() => {
    const allSymbols = Object.values(MARKET_SYMBOLS).flat();
    return allSymbols.find(s => s.symbol === selectedSymbol) || {
      symbol: selectedSymbol,
      name: selectedSymbol,
      nameEn: selectedSymbol
    };
  }, [selectedSymbol]);
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-emerald-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-amber-400';
    }
  };
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-amber-400" />;
    }
  };
  const getCVDStatusColor = (status: string) => {
    switch (status) {
      case 'rising':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'falling':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };
  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'profit':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">ربح</Badge>;
      case 'capital_recovery':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">استرجاع</Badge>;
      case 'loss':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/40">خسارة</Badge>;
      case 'no_result':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/40">بدون نتيجة</Badge>;
      default:
        return null;
    }
  };
  return <div className="dark min-h-screen bg-[#0a0a0f]" dir="rtl">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <GlobalHeader />
      </div>

      {/* Page Header with padding for fixed GlobalHeader */}
      <div className="pt-16 bg-gradient-to-b from-[#0f0f18] to-[#0a0a0f] border-b border-slate-800/50">
        <div className="container mx-auto px-3 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-10 w-10 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50">
                <ArrowLeft className="h-5 w-5 text-slate-300" />
              </Button>
              <div>
                <h1 className="md:text-xl font-bold text-white flex items-center gap-2 mx-0 my-0 px-0 py-0 text-base">
                  <Eye className="w-5 h-5 text-primary" />
                  نظام الصيّاد الهادئ للذهب والعملات  
                </h1>
                
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => {
              setNotificationsEnabled(!notificationsEnabled);
              if (!notificationsEnabled) requestNotificationPermission();
            }} className={`h-8 w-8 ${notificationsEnabled ? 'bg-primary/20' : 'bg-slate-800/50'} hover:bg-slate-700/50`}>
                <Bell className={`h-4 w-4 ${notificationsEnabled ? 'text-primary' : 'text-slate-500'}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className={`h-8 w-8 ${soundEnabled ? 'bg-primary/20' : 'bg-slate-800/50'} hover:bg-slate-700/50`}>
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
                <Input placeholder="ابحث عن رمز..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-[80px] bg-slate-800/80 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                {/* Radix Select content is rendered in a Portal (outside this page tree), so we add `dark` here */}
                <SelectContent className="dark bg-slate-800 border-slate-600">
                  <SelectItem value="15m">M15</SelectItem>
                  <SelectItem value="30m">M30</SelectItem>
                  <SelectItem value="1h">H1</SelectItem>
                </SelectContent>
              </Select>

              {selectedSymbol === 'XAUUSD' && <Select value={xauPriceSource} onValueChange={v => setXauPriceSource(v as 'spot' | 'futures')}>
                  <SelectTrigger className="w-[120px] bg-slate-800/80 border-slate-600 text-white">
                    <SelectValue placeholder="مصدر السعر" />
                  </SelectTrigger>
                  <SelectContent className="dark bg-slate-800 border-slate-600">
                    <SelectItem value="spot">Spot (أقرب للشارت)</SelectItem>
                    <SelectItem value="futures">Futures (GC)</SelectItem>
                  </SelectContent>
                </Select>}

              <Button variant="outline" size="icon" onClick={() => refetchAnalysis()} disabled={analysisLoading} className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700">
                <RefreshCw className={`h-4 w-4 ${analysisLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Category Tabs */}
            {!searchQuery && <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="w-full bg-slate-800/50 p-1 h-auto">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const Icon = info.icon;
                return <TabsTrigger key={key} value={key} className={`flex-1 text-xs py-2 data-[state=active]:bg-slate-700 ${info.color}`}>
                        <Icon className="w-3 h-3 ml-1" />
                        {info.label}
                      </TabsTrigger>;
              })}
                </TabsList>
              </Tabs>}

            {/* Symbols Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              {filteredSymbols.map(sym => {
              // Forex pairs, Gold, and crypto are supported
              const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
              const isSupported = sym.symbol === 'XAUUSD' || sym.symbol.endsWith('USDT') || forexPairs.includes(sym.symbol);
              return <Button key={sym.symbol} variant="ghost" size="sm" disabled={!isSupported} onClick={() => {
                if (!isSupported) {
                  toast.error('هذا السوق غير مدعوم حالياً في Smart Recovery');
                  return;
                }
                setSelectedSymbol(sym.symbol);
                setSearchQuery('');
              }} className={`justify-start h-auto py-2 px-3 ${selectedSymbol === sym.symbol ? 'bg-primary/20 border border-primary/50 text-primary' : 'bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-700/30'} ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="text-right w-full">
                      <div className="font-bold text-xs flex items-center justify-between gap-2">
                        <span>{sym.symbol}</span>
                        {!isSupported && <span className="text-[9px] text-slate-400">غير مدعوم</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">{sym.name}</div>
                    </div>
                  </Button>;
            })}
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
            {analysis ? <>
                {/* Determine signal with confidence */}
                {(() => {
              const signalType = analysis.signalType as 'BUY' | 'SELL' | 'WAIT' | 'NONE';
              const isWait = signalType === 'WAIT' || signalType === 'NONE';
              const isBuy = signalType === 'BUY';
              const confidence = (analysis as any).confidence || 0;
              const signalReasons = (analysis as any).signalReasons || [];
              return <>
                      {/* Confidence Bar */}
                      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-medium">مستوى الثقة في الإشارة</span>
                          <span className={`text-sm font-bold ${confidence >= 60 ? 'text-green-400' : confidence >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{confidence}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${confidence >= 60 ? 'bg-gradient-to-r from-green-600 to-green-400' : confidence >= 40 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`} style={{
                      width: `${confidence}%`
                    }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                          <span>ضعيف</span>
                          <span>متوسط</span>
                          <span>قوي</span>
                        </div>
                      </div>

                      {/* Main Signal */}
                      <div className={`rounded-2xl p-5 text-center cursor-pointer transition-all active:scale-95 shadow-lg ${isWait ? 'bg-gradient-to-br from-amber-600/80 to-amber-800/80 border-2 border-amber-400/60' : isBuy ? 'bg-gradient-to-br from-green-600 to-green-800 border-2 border-green-400' : 'bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400'}`} onClick={isWait ? undefined : triggerManualAlert}>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          {isWait ? <AlertTriangle className="w-10 h-10 text-white" /> : isBuy ? <TrendingUp className="w-10 h-10 text-white" /> : <TrendingDown className="w-10 h-10 text-white" />}
                          <span className="text-4xl font-black text-white drop-shadow-lg">
                            {isWait ? 'انتظار' : isBuy ? 'شراء' : 'بيع'}
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">
                          {analysis.currentPrice.toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                        </div>
                        {analysis.priceChange !== undefined && <div className={`inline-flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-full ${analysis.priceChange >= 0 ? 'bg-green-400/30 text-green-200' : 'bg-red-400/30 text-red-200'}`}>
                            {analysis.priceChange >= 0 ? '▲' : '▼'} {Math.abs(analysis.priceChange).toFixed(2)}%
                          </div>}

                        <div className="mt-3 text-[11px] text-white/75">
                          مصدر السعر: <span className="font-semibold">{analysis.dataSource}</span> • آخر تحديث: {new Date(analysis.timestamp).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                        </div>
                        {selectedSymbol === 'XAUUSD' && <div className="text-[10px] text-white/60 mt-1">قد يختلف عن TradingView حسب مزوّد البيانات/السبريد.</div>}

                        {isWait ? <div className="text-xs text-white/80 mt-3">⏳ الإشارات متضاربة - انتظر تأكيد واضح</div> : <div className="text-xs text-white/70 mt-3">🔔 اضغط للتنبيه الصوتي</div>}
                      </div>

                      {/* Signal Reasons */}
                      {signalReasons.length > 0 && <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-600">
                          <div className="text-xs text-cyan-400 font-medium mb-2">📊 أسباب التوصية:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {signalReasons.map((reason: string, idx: number) => <span key={idx} className={`text-[10px] px-2 py-1 rounded-full ${reason.includes('صاعد') || reason.includes('شراء') || reason.includes('إيجابي') || reason.includes('ذروة البيع') ? 'bg-green-900/50 text-green-300 border border-green-500/30' : reason.includes('هابط') || reason.includes('بيع') || reason.includes('سلبي') || reason.includes('ذروة الشراء') ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-slate-700 text-slate-300 border border-slate-500/30'}`}>
                                {reason}
                              </span>)}
                          </div>
                        </div>}

                      {/* Accumulation Zone Alert - Institutional Activity Detection */}
                      {(analysis as any).accumulation?.detected && <div className="bg-gradient-to-br from-purple-900/80 to-purple-800/60 rounded-xl p-4 border-2 border-purple-400 shadow-lg shadow-purple-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping" />
                              <span className="text-base font-black text-purple-200">🔮 تنبيه تجميع مؤسسي!</span>
                            </div>
                            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400">
                              قوة: {(analysis as any).accumulation.strength}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Real-time Volume Data */}
                            {(analysis as any).realTimeMetrics && <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-purple-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-purple-300 font-medium">الحجم الحالي</div>
                                <div className="text-sm font-bold text-purple-100">
                                  {((analysis as any).realTimeMetrics.currentVolume / 1000).toFixed(1)}K
                                </div>
                                <div className={`text-[9px] font-medium ${(analysis as any).realTimeMetrics.volumeChangePercent > 50 ? 'text-green-400' : 'text-purple-300'}`}>
                                  {(analysis as any).realTimeMetrics.volumeChangePercent > 0 ? '+' : ''}{(analysis as any).realTimeMetrics.volumeChangePercent}% من المتوسط
                                </div>
                              </div>
                              <div className="bg-purple-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-purple-300 font-medium">عرض بولينجر</div>
                                <div className="text-sm font-bold text-purple-100">
                                  {(analysis as any).realTimeMetrics.bollingerWidth}%
                                </div>
                                <div className={`text-[9px] font-medium ${(analysis as any).realTimeMetrics.bollingerWidth < 2 ? 'text-orange-400' : 'text-purple-300'}`}>
                                  {(analysis as any).realTimeMetrics.bollingerWidth < 2 ? 'ضغط شديد!' : 'طبيعي'}
                                </div>
                              </div>
                            </div>}
                            
                            <div className="flex items-center justify-between bg-purple-900/50 rounded-lg p-2">
                              <span className="text-xs text-purple-300">احتمال الانفجار</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-purple-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all" style={{
                            width: `${(analysis as any).accumulation.breakoutProbability}%`
                          }} />
                                </div>
                                <span className="text-sm font-bold text-purple-200">
                                  {(analysis as any).accumulation.breakoutProbability}%
                                </span>
                              </div>
                            </div>
                            
                            {(analysis as any).accumulation.expectedDirection !== 'unknown' && <div className="flex items-center justify-between bg-purple-900/50 rounded-lg p-2">
                                <span className="text-xs text-purple-300">الاتجاه المتوقع</span>
                                <span className={`text-sm font-bold ${(analysis as any).accumulation.expectedDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                  {(analysis as any).accumulation.expectedDirection === 'up' ? '📈 صعود' : '📉 هبوط'}
                                </span>
                              </div>}

                            {/* Volume Ratio & Compression Display */}
                            {(analysis as any).accumulation.volumeRatio && <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between bg-purple-900/40 rounded-lg p-2">
                                <span className="text-[10px] text-purple-300">نسبة الحجم</span>
                                <span className={`text-xs font-bold ${(analysis as any).accumulation.volumeRatio > 2 ? 'text-green-400' : 'text-purple-200'}`}>
                                  {(analysis as any).accumulation.volumeRatio}x
                                </span>
                              </div>
                              <div className="flex items-center justify-between bg-purple-900/40 rounded-lg p-2">
                                <span className="text-[10px] text-purple-300">نطاق السعر</span>
                                <span className={`text-xs font-bold ${(analysis as any).accumulation.priceRange < 1 ? 'text-orange-400' : 'text-purple-200'}`}>
                                  {(analysis as any).accumulation.priceRange?.toFixed(2)}%
                                </span>
                              </div>
                            </div>}
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(analysis as any).accumulation.reasons.map((reason: string, idx: number) => <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-purple-800/50 text-purple-200 border border-purple-500/30">
                                  {reason}
                                </span>)}
                            </div>
                          </div>
                        </div>}

                      {/* Squeeze/Volume/Consolidation Mini Indicators */}
                      {((analysis as any).bollingerSqueeze || (analysis as any).volumeSpike || (analysis as any).priceConsolidation) && <div className="flex gap-2 flex-wrap">
                          {(analysis as any).bollingerSqueeze && <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse">
                              🔥 ضغط بولينجر
                            </Badge>}
                          {(analysis as any).volumeSpike && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
                              📊 ارتفاع الحجم {(analysis as any).realTimeMetrics?.volumeChangePercent > 0 ? `+${(analysis as any).realTimeMetrics.volumeChangePercent}%` : ''}
                            </Badge>}
                          {(analysis as any).priceConsolidation && <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                              📍 تجميع سعري
                            </Badge>}
                        </div>}

                      {/* Entry, Target, Stop Loss - Only show for BUY/SELL signals */}
                      {!isWait && <div className="grid grid-cols-3 gap-2">
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
                              {isBuy ? (analysis.currentPrice * 1.015).toFixed(analysis.currentPrice > 100 ? 2 : 5) : (analysis.currentPrice * 0.985).toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                            </div>
                            <div className="text-[9px] text-green-400 mt-1">+1.5%</div>
                          </div>
                          <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-3 text-center border border-red-500/40">
                            <div className="text-[10px] text-red-300 font-bold mb-1">🛑 وقف الخسارة</div>
                            <div className="font-black text-lg text-red-200">
                              {isBuy ? (analysis.currentPrice * 0.99).toFixed(analysis.currentPrice > 100 ? 2 : 5) : (analysis.currentPrice * 1.01).toFixed(analysis.currentPrice > 100 ? 2 : 5)}
                            </div>
                            <div className="text-[9px] text-red-400 mt-1">-1%</div>
                          </div>
                        </div>}
                    </>;
            })()}

                {/* Compact Status Grid - 5 indicators including RSI */}
                <div className="grid grid-cols-5 gap-1.5">
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium mb-1">الاتجاه</div>
                    <div className={`text-sm font-black ${analysis.trend === 'bullish' ? 'text-green-400' : analysis.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.trend === 'bullish' ? '↑' : analysis.trend === 'bearish' ? '↓' : '→'}
                    </div>
                    <div className={`text-[9px] font-medium ${analysis.trend === 'bullish' ? 'text-green-400' : analysis.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.trend === 'bullish' ? 'صاعد' : analysis.trend === 'bearish' ? 'هابط' : 'عرضي'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium mb-1">RSI</div>
                    <div className={`text-sm font-black ${((analysis as any).rsi || 50) > 70 ? 'text-red-400' : ((analysis as any).rsi || 50) < 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {((analysis as any).rsi || 50).toFixed(0)}
                    </div>
                    <div className={`text-[9px] font-medium ${((analysis as any).rsi || 50) > 70 ? 'text-red-400' : ((analysis as any).rsi || 50) < 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {((analysis as any).rsi || 50) > 70 ? 'تشبع' : ((analysis as any).rsi || 50) < 30 ? 'فرصة' : 'عادي'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium mb-1">MACD</div>
                    <div className={`text-sm font-black ${((analysis as any).macd?.histogram || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((analysis as any).macd?.histogram || 0) > 0 ? '↑' : '↓'}
                    </div>
                    <div className={`text-[9px] font-medium ${((analysis as any).macd?.histogram || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((analysis as any).macd?.histogram || 0) > 0 ? 'إيجابي' : 'سلبي'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium mb-1">الزخم</div>
                    <div className={`text-sm font-black ${analysis.cvdStatus === 'rising' ? 'text-green-400' : analysis.cvdStatus === 'falling' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.cvdStatus === 'rising' ? '↑' : analysis.cvdStatus === 'falling' ? '↓' : '→'}
                    </div>
                    <div className={`text-[9px] font-medium ${analysis.cvdStatus === 'rising' ? 'text-green-400' : analysis.cvdStatus === 'falling' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {analysis.cvdStatus === 'rising' ? 'قوي' : analysis.cvdStatus === 'falling' ? 'ضعيف' : 'متوسط'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium mb-1">EMA200</div>
                    <div className={`text-sm font-black ${analysis.priceAboveEMA ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.priceAboveEMA ? '✓' : '✗'}
                    </div>
                    <div className={`text-[9px] font-medium ${analysis.priceAboveEMA ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.priceAboveEMA ? 'فوق' : 'تحت'}
                    </div>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium">EMA 200</div>
                    <div className="font-bold text-sm text-white">{analysis.ema200.toFixed(analysis.ema200 > 100 ? 2 : 4)}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium">VWAP</div>
                    <div className="font-bold text-sm text-white">{analysis.vwap.toFixed(analysis.vwap > 100 ? 2 : 4)}</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-2 text-center border border-slate-600">
                    <div className="text-[9px] text-cyan-400 font-medium">قرب VWAP</div>
                    <div className={`font-bold text-sm ${analysis.nearVWAP ? 'text-green-400' : 'text-yellow-400'}`}>
                      {analysis.nearVWAP ? '✓ نعم' : '✗ لا'}
                    </div>
                  </div>
                </div>
              </> : <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
                <p className="text-white text-lg font-bold mb-2">جاري تحليل السوق...</p>
                <p className="text-cyan-400 text-sm">جلب بيانات السعر الحية</p>
                <p className="text-slate-500 text-xs mt-2">التحديث كل 5 ثواني</p>
              </div>}
          </CardContent>
        </Card>

        {/* Trade Recommendation - Should I Enter Now? */}
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

        {/* Signals Log */}
        

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
          
        </Card>
      </div>
    </div>;
};
export default SmartRecoverySystem;