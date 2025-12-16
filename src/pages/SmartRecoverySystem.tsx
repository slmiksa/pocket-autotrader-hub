import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, BarChart3, Clock, DollarSign, Target, Shield, BookOpen, Settings, RefreshCw, Volume2, VolumeX, Trash2, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMarketAnalysis, MarketAnalysis } from '@/hooks/useMarketAnalysis';
import { useSmartRecoveryTrades, SmartRecoveryTrade } from '@/hooks/useSmartRecoveryTrades';
import { 
  playBuySignalAlert, 
  playSellSignalAlert, 
  playSuccessAlert,
  initializeAudio,
  requestNotificationPermission,
  sendBrowserNotification
} from '@/utils/tradingAlerts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isCloseTradeOpen, setIsCloseTradeOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<SmartRecoveryTrade | null>(null);
  const [newTrade, setNewTrade] = useState({
    lotSize: '0.01',
    notes: ''
  });
  const [closeTradeData, setCloseTradeData] = useState({
    exitPrice: '',
    result: 'profit' as 'capital_recovery' | 'profit' | 'no_result' | 'loss'
  });
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

  const { trades, loading: tradesLoading, addTrade, closeTrade, deleteTrade, getStats } = useSmartRecoveryTrades();
  const stats = getStats();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getCVDStatusColor = (status: string) => {
    switch (status) {
      case 'rising': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'falling': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const handleAddTrade = async () => {
    if (!analysis) return;
    
    const success = await addTrade({
      symbol: selectedSymbol,
      direction: analysis.signalType as 'BUY' | 'SELL',
      entry_price: analysis.currentPrice,
      lot_size: parseFloat(newTrade.lotSize) || 0.01,
      entry_reason: `${analysis.trend} trend, CVD: ${analysis.cvdStatus}, Near VWAP: ${analysis.nearVWAP}`,
      cvd_status: analysis.cvdStatus,
      ema_status: analysis.priceAboveEMA ? 'above' : 'below',
      vwap_status: analysis.nearVWAP ? 'near' : 'far',
      notes: newTrade.notes
    });

    if (success) {
      playSuccessAlert();
      setIsAddTradeOpen(false);
      setNewTrade({ lotSize: '0.01', notes: '' });
    }
  };

  const handleCloseTrade = async () => {
    if (!selectedTrade) return;
    
    const success = await closeTrade(
      selectedTrade.id,
      parseFloat(closeTradeData.exitPrice),
      closeTradeData.result
    );

    if (success) {
      playSuccessAlert();
      setIsCloseTradeOpen(false);
      setSelectedTrade(null);
      setCloseTradeData({ exitPrice: '', result: 'profit' });
    }
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'profit': return <Badge className="bg-green-500/20 text-green-400">ربح</Badge>;
      case 'capital_recovery': return <Badge className="bg-blue-500/20 text-blue-400">استرجاع</Badge>;
      case 'loss': return <Badge className="bg-red-500/20 text-red-400">خسارة</Badge>;
      case 'no_result': return <Badge className="bg-gray-500/20 text-gray-400">بدون نتيجة</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base md:text-lg font-bold text-foreground">Smart Recovery System</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">MT5 Trading System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="h-9 w-9"
              >
                <Bell className={`h-4 w-4 ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-9 w-9"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Shield className="w-3 h-3 ml-1" />
                محافظ
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 space-y-4 max-w-4xl">
        {/* Symbol & Timeframe Selection */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                <SelectItem value="EURUSD">EURUSD</SelectItem>
                <SelectItem value="BTCUSDT">BTCUSDT</SelectItem>
                <SelectItem value="ETHUSDT">ETHUSDT</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          >
            <RefreshCw className={`h-4 w-4 ml-1 ${analysisLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Market Status Dashboard */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              لوحة حالة السوق - {selectedSymbol}
              {analysisLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                {/* Main Status Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">الاتجاه</div>
                    <div className={`flex items-center gap-1 ${getTrendColor(analysis.trend)}`}>
                      {getTrendIcon(analysis.trend)}
                      <span className="font-semibold text-sm">
                        {analysis.trend === 'bullish' ? 'صاعد' : analysis.trend === 'bearish' ? 'هابط' : 'عرضي'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">حالة CVD</div>
                    <Badge className={getCVDStatusColor(analysis.cvdStatus)}>
                      {analysis.cvdStatus === 'rising' ? 'صاعد' : analysis.cvdStatus === 'falling' ? 'هابط' : 'ثابت'}
                    </Badge>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">EMA 200</div>
                    <div className="flex items-center gap-1">
                      {analysis.priceAboveEMA ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm font-medium">
                        {analysis.priceAboveEMA ? 'فوق' : 'تحت'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                    <div className="text-xs text-muted-foreground mb-1">VWAP</div>
                    <div className="flex items-center gap-1">
                      {analysis.nearVWAP ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-sm font-medium">
                        {analysis.nearVWAP ? 'قريب' : 'بعيد'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trade Signal */}
                <div className={`rounded-lg p-4 border-2 ${
                  analysis.isValidSetup 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {analysis.isValidSetup ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <div className="font-bold text-sm">
                          {analysis.isValidSetup ? 'السوق صالح للتداول' : 'السوق غير صالح للتداول'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {analysis.isValidSetup ? 'جميع الشروط متحققة' : 'انتظر تحقق الشروط'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis.isValidSetup && (
                        <Badge className={analysis.signalType === 'BUY' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                          {analysis.signalType}
                        </Badge>
                      )}
                      {analysis.isValidSetup && user && (
                        <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                              <Plus className="w-4 h-4" />
                              فتح صفقة
                            </Button>
                          </DialogTrigger>
                          <DialogContent dir="rtl">
                            <DialogHeader>
                              <DialogTitle>فتح صفقة جديدة</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>الزوج</Label>
                                  <Input value={selectedSymbol} disabled />
                                </div>
                                <div>
                                  <Label>الاتجاه</Label>
                                  <Input value={analysis.signalType} disabled />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>سعر الدخول</Label>
                                  <Input value={analysis.currentPrice.toFixed(2)} disabled />
                                </div>
                                <div>
                                  <Label>حجم اللوت</Label>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={newTrade.lotSize}
                                    onChange={(e) => setNewTrade(prev => ({ ...prev, lotSize: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>ملاحظات</Label>
                                <Textarea 
                                  value={newTrade.notes}
                                  onChange={(e) => setNewTrade(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="ملاحظات إضافية..."
                                />
                              </div>
                              <Button onClick={handleAddTrade} className="w-full">
                                تأكيد فتح الصفقة
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">السعر الحالي</div>
                    <div className="font-bold text-primary">${analysis.currentPrice.toFixed(2)}</div>
                  </div>
                  <div className="bg-background/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">EMA 200</div>
                    <div className="font-bold">${analysis.ema200.toFixed(2)}</div>
                  </div>
                  <div className="bg-background/30 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground">VWAP</div>
                    <div className="font-bold">${analysis.vwap.toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>جاري تحليل السوق...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-xs text-muted-foreground">إجمالي الصفقات</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
                <div className="text-xs text-muted-foreground">نسبة النجاح</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.totalProfitLoss.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">إجمالي الربح/الخسارة</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.openTrades}</div>
                <div className="text-xs text-muted-foreground">صفقات مفتوحة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trade Log */}
        <Collapsible open={openSections.log} onOpenChange={() => toggleSection('log')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    سجل الصفقات
                    {stats.openTrades > 0 && (
                      <Badge variant="outline" className="mr-2">{stats.openTrades} مفتوحة</Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.log ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {!user ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">يجب تسجيل الدخول لعرض الصفقات</p>
                    <Button variant="outline" className="mt-2" onClick={() => navigate('/auth')}>
                      تسجيل الدخول
                    </Button>
                  </div>
                ) : tradesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                  </div>
                ) : trades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد صفقات مسجلة بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trades.slice(0, 10).map((trade) => (
                      <div 
                        key={trade.id}
                        className={`p-3 rounded-lg border ${
                          trade.status === 'open' 
                            ? 'bg-blue-500/5 border-blue-500/30' 
                            : 'bg-background/30 border-border/30'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <Badge className={trade.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {trade.direction}
                            </Badge>
                            <div>
                              <div className="font-semibold text-sm">{trade.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                دخول: ${trade.entry_price.toFixed(2)}
                                {trade.exit_price && ` | خروج: $${trade.exit_price.toFixed(2)}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {trade.status === 'open' ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                مفتوحة
                              </Badge>
                            ) : (
                              <>
                                {getResultBadge(trade.result)}
                                {trade.profit_loss !== null && (
                                  <span className={`text-sm font-semibold ${trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${trade.profit_loss.toFixed(2)}
                                  </span>
                                )}
                              </>
                            )}
                            {trade.status === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTrade(trade);
                                  setCloseTradeData({
                                    exitPrice: analysis?.currentPrice?.toString() || '',
                                    result: 'profit'
                                  });
                                  setIsCloseTradeOpen(true);
                                }}
                              >
                                إغلاق
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTrade(trade.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        {trade.was_reinforced && (
                          <div className="mt-2 text-xs text-blue-400">
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

        {/* Close Trade Dialog */}
        <Dialog open={isCloseTradeOpen} onOpenChange={setIsCloseTradeOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إغلاق الصفقة</DialogTitle>
            </DialogHeader>
            {selectedTrade && (
              <div className="space-y-4">
                <div className="p-3 bg-background/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>الزوج:</span>
                    <span className="font-semibold">{selectedTrade.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الاتجاه:</span>
                    <span className="font-semibold">{selectedTrade.direction}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>سعر الدخول:</span>
                    <span className="font-semibold">${selectedTrade.entry_price.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <Label>سعر الخروج</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={closeTradeData.exitPrice}
                    onChange={(e) => setCloseTradeData(prev => ({ ...prev, exitPrice: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>نتيجة الصفقة</Label>
                  <Select 
                    value={closeTradeData.result} 
                    onValueChange={(value: any) => setCloseTradeData(prev => ({ ...prev, result: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profit">ربح</SelectItem>
                      <SelectItem value="capital_recovery">استرجاع رأس المال</SelectItem>
                      <SelectItem value="no_result">بدون نتيجة</SelectItem>
                      <SelectItem value="loss">خسارة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCloseTrade} className="w-full">
                  تأكيد إغلاق الصفقة
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* System Overview - Collapsed by default */}
        <Collapsible open={openSections.overview} onOpenChange={() => toggleSection('overview')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    نظرة عامة على النظام
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.overview ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      الأهداف الرئيسية
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 mr-6">
                      <li>• استرجاع رأس المال</li>
                      <li>• تحقيق ربح بسيط (0.5% - 1%)</li>
                      <li>• صفقات عالية الاحتمالية</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      الإطارات الزمنية
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">M15 ✓</Badge>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">M30 ✓</Badge>
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">M1 ✗</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Important Note */}
        <Card className="bg-yellow-500/5 border-yellow-500/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-400 text-sm mb-1">ملاحظة مهمة</h4>
                <p className="text-xs text-muted-foreground">
                  النظام يعمل فقط عند تحقق الشروط. الامتناع عن التداول جزء أساسي من الاستراتيجية. الأسعار من Binance API.
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
