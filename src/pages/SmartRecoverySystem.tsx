import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, BarChart3, Clock, Target, Shield, BookOpen, RefreshCw, Volume2, VolumeX, Trash2, Bell, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketAnalysis, MarketAnalysis } from '@/hooks/useMarketAnalysis';
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  const handleSignalDetected = (analysis: MarketAnalysis) => {
    if (soundEnabled) {
      if (analysis.signalType === 'BUY') {
        playBuySignalAlert();
      } else if (analysis.signalType === 'SELL') {
        playSellSignalAlert();
      }
    }

    if (notificationsEnabled) {
      sendBrowserNotification(
        `إشارة ${analysis.signalType === 'BUY' ? 'شراء' : 'بيع'} - ${analysis.symbol}`,
        `السعر: ${analysis.currentPrice.toFixed(2)} | الاتجاه: ${analysis.trend === 'bullish' ? 'صاعد' : 'هابط'}`
      );
    }

    toast.success(
      `🎯 إشارة ${analysis.signalType === 'BUY' ? 'شراء' : 'بيع'} على ${analysis.symbol}`,
      { duration: 10000 }
    );
  };

  const { analysis, loading: analysisLoading, refetch: refetchAnalysis } = useMarketAnalysis({
    symbol: selectedSymbol,
    timeframe: selectedTimeframe,
    autoRefresh: true,
    refreshInterval: 30000,
    onSignalDetected: handleSignalDetected
  });

  const { trades, loading: tradesLoading, deleteTrade, getStats } = useSmartRecoveryTrades();
  const stats = getStats();

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
                <p className="text-xs text-slate-400">نظام توصيات ذكي - MT5</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="h-9 w-9 bg-slate-800/50 hover:bg-slate-700/50"
              >
                <Bell className={`h-4 w-4 ${notificationsEnabled ? 'text-primary' : 'text-slate-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-9 w-9 bg-slate-800/50 hover:bg-slate-700/50"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-slate-300" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
              </Button>
              <Badge className="bg-primary/20 text-primary border-primary/40 px-3">
                <Shield className="w-3 h-3 ml-1" />
                توصيات
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-6 space-y-5 max-w-4xl">
        {/* Symbol & Timeframe Selection */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
          <div className="flex gap-3">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-[130px] bg-slate-800/80 border-slate-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                <SelectItem value="EURUSD">EURUSD</SelectItem>
                <SelectItem value="BTCUSDT">BTCUSDT</SelectItem>
                <SelectItem value="ETHUSDT">ETHUSDT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[90px] bg-slate-800/80 border-slate-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="15m">M15</SelectItem>
                <SelectItem value="30m">M30</SelectItem>
                <SelectItem value="1h">H1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAnalysis()}
            disabled={analysisLoading}
            className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${analysisLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Market Status Dashboard */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/50 border-slate-800/50 overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800/50">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-primary" />
              لوحة حالة السوق - {selectedSymbol}
              {analysisLoading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            {analysis ? (
              <>
                {/* Main Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-2">الاتجاه</div>
                    <div className={`flex items-center gap-2 ${getTrendColor(analysis.trend)}`}>
                      {getTrendIcon(analysis.trend)}
                      <span className="font-bold text-sm">
                        {analysis.trend === 'bullish' ? 'صاعد' : analysis.trend === 'bearish' ? 'هابط' : 'عرضي'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-2">حالة CVD</div>
                    <Badge className={`${getCVDStatusColor(analysis.cvdStatus)} font-medium`}>
                      {analysis.cvdStatus === 'rising' ? 'صاعد' : analysis.cvdStatus === 'falling' ? 'هابط' : 'ثابت'}
                    </Badge>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-2">EMA 200</div>
                    <div className="flex items-center gap-2">
                      {analysis.priceAboveEMA ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm font-bold ${analysis.priceAboveEMA ? 'text-emerald-400' : 'text-red-400'}`}>
                        {analysis.priceAboveEMA ? 'فوق' : 'تحت'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-2">VWAP</div>
                    <div className="flex items-center gap-2">
                      {analysis.nearVWAP ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className={`text-sm font-bold ${analysis.nearVWAP ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {analysis.nearVWAP ? 'قريب' : 'بعيد'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signal Recommendation */}
                <div className={`rounded-xl p-5 border-2 ${
                  analysis.isValidSetup 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/40' 
                    : 'bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/40'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {analysis.isValidSetup ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-base text-white">
                          {analysis.isValidSetup ? 'توصية متاحة' : 'لا توجد توصية حالياً'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {analysis.isValidSetup ? 'جميع شروط الدخول متحققة' : 'انتظر تحقق شروط الدخول'}
                        </div>
                      </div>
                    </div>
                    {analysis.isValidSetup && (
                      <div className="flex items-center gap-3">
                        <Badge className={`text-base px-4 py-2 ${analysis.signalType === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {analysis.signalType === 'BUY' ? '📈 توصية شراء' : '📉 توصية بيع'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-1">السعر الحالي</div>
                    <div className="font-bold text-lg text-primary">${analysis.currentPrice.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-1">EMA 200</div>
                    <div className="font-bold text-lg text-white">${analysis.ema200.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700/30">
                    <div className="text-xs text-slate-500 mb-1">VWAP</div>
                    <div className="font-bold text-lg text-white">${analysis.vwap.toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-primary/50" />
                <p className="text-slate-400">جاري تحليل السوق...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-500 mt-1">إجمالي التوصيات</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.winRate}%</div>
                <div className="text-xs text-slate-500 mt-1">نسبة النجاح</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${stats.totalProfitLoss.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1">إجمالي النتائج</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.openTrades}</div>
                <div className="text-xs text-slate-500 mt-1">توصيات نشطة</div>
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
                  هذا نظام توصيات فقط وليس تنفيذ تلقائي. النظام يعمل عند تحقق الشروط فقط. 
                  الامتناع عن التداول جزء أساسي من الاستراتيجية. الأسعار مباشرة من Binance API.
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
