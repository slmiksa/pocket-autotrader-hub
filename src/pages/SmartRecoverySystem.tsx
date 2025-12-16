import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Activity, BarChart3, Clock, DollarSign, Target, Shield, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

const SmartRecoverySystem = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    conditions: true,
    management: false,
    rules: false,
    log: false
  });

  // Simulated market data
  const [marketData] = useState({
    trend: 'bullish' as 'bullish' | 'bearish' | 'neutral',
    cvdStatus: 'rising' as 'rising' | 'falling' | 'flat',
    priceAboveEMA: true,
    nearVWAP: true,
    isValidSetup: true,
    currentPrice: 2650.50,
    ema200: 2620.30,
    vwap: 2648.20
  });

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
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Shield className="w-3 h-3 ml-1" />
              محافظ
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 py-4 space-y-4 max-w-4xl">
        {/* Market Status Dashboard */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              لوحة حالة السوق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Trend Status */}
              <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="text-xs text-muted-foreground mb-1">الاتجاه</div>
                <div className={`flex items-center gap-1 ${getTrendColor(marketData.trend)}`}>
                  {getTrendIcon(marketData.trend)}
                  <span className="font-semibold text-sm">
                    {marketData.trend === 'bullish' ? 'صاعد' : marketData.trend === 'bearish' ? 'هابط' : 'عرضي'}
                  </span>
                </div>
              </div>

              {/* CVD Status */}
              <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="text-xs text-muted-foreground mb-1">حالة CVD</div>
                <Badge className={getCVDStatusColor(marketData.cvdStatus)}>
                  {marketData.cvdStatus === 'rising' ? 'صاعد' : marketData.cvdStatus === 'falling' ? 'هابط' : 'ثابت'}
                </Badge>
              </div>

              {/* EMA Status */}
              <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="text-xs text-muted-foreground mb-1">EMA 200</div>
                <div className="flex items-center gap-1">
                  {marketData.priceAboveEMA ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium">
                    {marketData.priceAboveEMA ? 'فوق' : 'تحت'}
                  </span>
                </div>
              </div>

              {/* VWAP Status */}
              <div className="bg-background/50 rounded-lg p-3 border border-border/30">
                <div className="text-xs text-muted-foreground mb-1">VWAP</div>
                <div className="flex items-center gap-1">
                  {marketData.nearVWAP ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-sm font-medium">
                    {marketData.nearVWAP ? 'قريب' : 'بعيد'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trade Signal */}
            <div className={`rounded-lg p-4 border-2 ${
              marketData.isValidSetup 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {marketData.isValidSetup ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {marketData.isValidSetup ? 'السوق صالح للتداول' : 'السوق غير صالح للتداول'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {marketData.isValidSetup ? 'جميع الشروط متحققة' : 'انتظر تحقق الشروط'}
                    </div>
                  </div>
                </div>
                {marketData.isValidSetup && (
                  <Badge className="bg-green-500 text-white">
                    {marketData.trend === 'bullish' ? 'BUY' : 'SELL'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Price Levels */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-background/30 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">السعر الحالي</div>
                <div className="font-bold text-primary">${marketData.currentPrice}</div>
              </div>
              <div className="bg-background/30 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">EMA 200</div>
                <div className="font-bold">${marketData.ema200}</div>
              </div>
              <div className="bg-background/30 rounded-lg p-2">
                <div className="text-xs text-muted-foreground">VWAP</div>
                <div className="font-bold">${marketData.vwap}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
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
                      <li>• عدد صفقات قليل</li>
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
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">M5 ✗</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      الأسواق المدعومة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">XAUUSD</Badge>
                      <Badge variant="outline">EURUSD</Badge>
                      <Badge variant="outline">أزواج عالية السيولة</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      المؤشرات المطلوبة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">EMA 200</Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">VWAP</Badge>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">CVD</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Entry Conditions */}
        <Collapsible open={openSections.conditions} onOpenChange={() => toggleSection('conditions')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    شروط الدخول
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.conditions ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                      <TrendingUp className="w-4 h-4 ml-1" />
                      شراء BUY
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                      <TrendingDown className="w-4 h-4 ml-1" />
                      بيع SELL
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy" className="space-y-3">
                    <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                      <h4 className="font-semibold text-green-400 mb-2 text-sm">✅ شروط صفقة الشراء</h4>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>السعر أعلى EMA 200</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>السعر يعود (Pullback) باتجاه VWAP</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>السعر يلامس أو يقترب من VWAP (± 0.2%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>CVD صاعد أو ثابت (لا يصنع قيعان أدنى)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>شمعة رفض (ذيل سفلي واضح أو ابتلاعية صاعدة)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>لا يوجد خبر قوي خلال 30 دقيقة</span>
                        </li>
                      </ul>
                      <div className="mt-3 p-2 bg-green-500/10 rounded text-xs text-green-400">
                        📌 الدخول: مع إغلاق شمعة التأكيد
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sell" className="space-y-3">
                    <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                      <h4 className="font-semibold text-red-400 mb-2 text-sm">❌ شروط صفقة البيع</h4>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>السعر أسفل EMA 200</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>السعر يصعد باتجاه VWAP</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>السعر يلامس أو يقترب من VWAP</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>CVD هابط أو ثابت (لا يصنع قمم أعلى)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>شمعة رفض علوية</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>لا أخبار قوية</span>
                        </li>
                      </ul>
                      <div className="mt-3 p-2 bg-red-500/10 rounded text-xs text-red-400">
                        📌 الدخول: مع إغلاق شمعة التأكيد
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Trade Management */}
        <Collapsible open={openSections.management} onOpenChange={() => toggleSection('management')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    إدارة الصفقة
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.management ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* No Stop Loss Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-semibold text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    بدون Stop Loss
                  </div>
                  <p className="text-xs text-muted-foreground">
                    النظام يعتمد على الخروج الذكي والتعزيز المحسوب بدلاً من وقف الخسارة التقليدي
                  </p>
                </div>

                {/* Smart Reinforcement */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-400 mb-2 text-sm">🔁 نظام التعزيز الذكي</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• يسمح بتعزيز <strong>واحد فقط</strong></li>
                    <li>• بنفس اتجاه الصفقة الأصلية</li>
                    <li>• فقط إذا السعر لا يزال يحترم EMA 200</li>
                    <li>• السعر عند VWAP مرة أخرى</li>
                    <li>• CVD لم ينعكس ضد الصفقة</li>
                  </ul>
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
                    ❌ ممنوع: التعزيز أكثر من مرة | التعزيز ضد الترند
                  </div>
                </div>

                {/* Take Profit */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-green-400 mb-2 text-sm">🎯 أهداف الصفقة</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">الهدف الأول</div>
                      <div className="font-semibold">Break Even + عمولة</div>
                    </div>
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">الهدف الثاني</div>
                      <div className="font-semibold">0.5% - 1%</div>
                    </div>
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">الخروج الإجباري</div>
                      <div className="font-semibold">3-5 شمعات</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Trading Rules */}
        <Collapsible open={openSections.rules} onOpenChange={() => toggleSection('rules')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    قواعد التداول
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.rules ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Trade Filters */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-red-400 mb-2 text-sm">🛑 شروط منع التداول</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• السوق عرضي (CVD أفقي تماماً)</li>
                    <li>• لا يوجد حجم تداول واضح</li>
                    <li>• شموع صغيرة متداخلة</li>
                    <li>• وقت الأخبار القوية</li>
                    <li>• بعد تحقيق الهدف اليومي</li>
                  </ul>
                </div>

                {/* Risk Management */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-400 mb-2 text-sm">📉 إدارة رأس المال</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">حجم الصفقة</div>
                      <div className="font-semibold">5% - 10%</div>
                    </div>
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">صفقات مفتوحة</div>
                      <div className="font-semibold">صفقة واحدة</div>
                    </div>
                    <div className="bg-background/30 rounded p-2 text-center">
                      <div className="text-xs text-muted-foreground">صفقات متعاكسة</div>
                      <div className="font-semibold text-red-400">ممنوع</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Trade Log */}
        <Collapsible open={openSections.log} onOpenChange={() => toggleSection('log')}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    سجل الصفقات
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openSections.log ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد صفقات مسجلة بعد</p>
                  <p className="text-xs">سيتم تسجيل الصفقات تلقائياً عند تنفيذها</p>
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
                  النظام لا يعمل دائماً - بل يعمل فقط عند تحقق الشروط. الامتناع عن التداول جزء أساسي من الاستراتيجية.
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
