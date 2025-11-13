import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, TrendingUp, AlertCircle, Info, ArrowRight, Loader2 } from 'lucide-react';
import mt5TradeInterface from '@/assets/mt5-trade-interface.png';

// Popular cryptocurrencies
const CRYPTO_LIST = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum', id: 'ethereum' },
  { symbol: 'BNBUSDT', name: 'Binance Coin', id: 'binancecoin' },
  { symbol: 'XRPUSDT', name: 'Ripple', id: 'ripple' },
  { symbol: 'ADAUSDT', name: 'Cardano', id: 'cardano' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', id: 'dogecoin' },
  { symbol: 'SOLUSDT', name: 'Solana', id: 'solana' },
  { symbol: 'DOTUSDT', name: 'Polkadot', id: 'polkadot' },
  { symbol: 'MATICUSDT', name: 'Polygon', id: 'matic-network' },
  { symbol: 'LTCUSDT', name: 'Litecoin', id: 'litecoin' },
];

// Popular US stocks
const STOCKS_LIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
];

const MT5Analysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('5m');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [assetType, setAssetType] = useState<'crypto' | 'stock'>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  const processImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('تم تحميل الصورة بنجاح');
    } else {
      toast.error('يرجى اختيار ملف صورة صحيح');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
          }
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Add paste event listener
  useState(() => {
    const pasteHandler = (e: ClipboardEvent) => handlePaste(e);
    window.addEventListener('paste', pasteHandler as any);
    return () => window.removeEventListener('paste', pasteHandler as any);
  });

  const handleAnalyzeSymbol = async () => {
    if (!selectedSymbol) {
      toast.error('يرجى اختيار رمز للتحليل');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: { 
          symbol: selectedSymbol,
          timeframe,
          assetType
        }
      });

      if (error) throw error;
      
      setAnalysis(data.analysis);
      toast.success('تم التحليل بنجاح 🎯');
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast.error('يرجى اختيار صورة للشارت');
      return;
    }

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('analyze-mt5-chart', {
          body: { 
            image: base64,
            timeframe 
          }
        });

        if (error) throw error;
        
        setAnalysis(data.analysis);
        toast.success('تم التحليل بنجاح 🎯');
      };
      reader.readAsDataURL(image);
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('حدث خطأ أثناء التحليل');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8" dir="rtl">
      {/* Loading Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="border-2 border-primary/20 shadow-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-2xl font-bold text-primary">جاري التحليل...</p>
              <p className="text-muted-foreground">يرجى الانتظار، نقوم بتحليل الشارت</p>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* زر الرجوع */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2 hover:gap-3 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للصفحة الرئيسية
        </Button>
        
        {/* Header */}
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              تحليل شارت MT5 الذكي
            </CardTitle>
            <CardDescription className="text-lg">
              تحليل فني متقدم مع توصيات دقيقة لنقاط الدخول والخروج
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Symbol Analysis Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              تحليل الرموز التلقائي
            </CardTitle>
            <CardDescription>
              اختر عملة رقمية أو سهم أمريكي للحصول على تحليل فوري
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={assetType} onValueChange={(v) => {
              setAssetType(v as 'crypto' | 'stock');
              setSelectedSymbol('');
              setAnalysis(null);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="crypto">العملات الرقمية</TabsTrigger>
                <TabsTrigger value="stock">الأسهم الأمريكية</TabsTrigger>
              </TabsList>

              <TabsContent value="crypto" className="space-y-4">
                <div className="space-y-2">
                  <Label>اختر العملة الرقمية</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عملة رقمية" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_LIST.map((crypto) => (
                        <SelectItem key={crypto.symbol} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4">
                <div className="space-y-2">
                  <Label>اختر السهم</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر سهم" />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCKS_LIST.map((stock) => (
                        <SelectItem key={stock.symbol} value={stock.symbol}>
                          {stock.name} ({stock.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 دقيقة</SelectItem>
                  <SelectItem value="5m">5 دقائق</SelectItem>
                  <SelectItem value="15m">15 دقيقة</SelectItem>
                  <SelectItem value="30m">30 دقيقة</SelectItem>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="4h">4 ساعات</SelectItem>
                  <SelectItem value="1d">يوم واحد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAnalyzeSymbol}
              disabled={analyzing || !selectedSymbol}
              className="w-full"
              size="lg"
            >
              {analyzing ? 'جاري التحليل...' : 'تحليل الآن'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                تحميل الشارت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>الإطار الزمني</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 دقيقة</SelectItem>
                    <SelectItem value="5m">5 دقائق</SelectItem>
                    <SelectItem value="15m">15 دقيقة</SelectItem>
                    <SelectItem value="30m">30 دقيقة</SelectItem>
                    <SelectItem value="1h">1 ساعة</SelectItem>
                    <SelectItem value="4h">4 ساعات</SelectItem>
                    <SelectItem value="1d">يوم واحد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Drop Zone */}
              <div 
                className={`space-y-2 rounded-lg border-2 border-dashed p-6 transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-primary/20 hover:border-primary/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <TrendingUp className="w-12 h-12 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">الصق الصورة هنا (Ctrl+V)</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      أو اسحب وأفلت الصورة، أو اختر ملف
                    </p>
                  </div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                      <span className="text-sm font-medium">اختر صورة من الجهاز</span>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>

              {preview && (
                <div className="rounded-lg border-2 border-primary/20 overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleAnalyze}
                disabled={analyzing || !image}
                className="w-full"
                size="lg"
              >
                {analyzing ? 'جاري التحليل...' : 'تحليل الشارت'}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                تعليمات الاستخدام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="capture" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="capture">التقاط الشارت</TabsTrigger>
                  <TabsTrigger value="trade">تنفيذ الصفقة</TabsTrigger>
                </TabsList>
                
                <TabsContent value="capture" className="space-y-3 text-sm">
                  <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                    <h4 className="font-bold text-primary">كيفية التقاط صورة الشارت:</h4>
                    <ol className="list-decimal list-inside space-y-2 mr-2">
                      <li>افتح منصة MT5 واختر الزوج المراد تحليله (مثل AUD/USD)</li>
                      <li>اختر الإطار الزمني المناسب من أعلى الشارت</li>
                      <li>تأكد من ظهور الشموع اليابانية بوضوح</li>
                      <li>التقط صورة للشاشة (Screenshot) أو استخدم أداة القص</li>
                      <li>ارفع الصورة هنا واختر نفس الإطار الزمني</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-accent/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>نصيحة:</strong> تأكد من وضوح الشموع والأسعار في الصورة للحصول على تحليل دقيق
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="trade" className="space-y-3 text-sm">
                  <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                    <h4 className="font-bold text-primary">خطوات تنفيذ الصفقة في MT5:</h4>
                    <ol className="list-decimal list-inside space-y-2 mr-2">
                      <li>اضغط على زر "طلب تداول" في MT5</li>
                      <li>اختر نوع الطلب: "السوق" للتنفيذ الفوري</li>
                      <li>حدد حجم الصفقة (اللوت) المناسب لرأس مالك</li>
                      <li>في قسم "شروط إبرام الصفقة" قم بتفعيل:</li>
                      <ul className="list-disc list-inside mr-6 space-y-1">
                        <li><strong>وقف الخسارة (Stop Loss):</strong> ضع السعر الذي سيعطيه التحليل</li>
                        <li><strong>جني الأرباح (Take Profit):</strong> ضع الهدف المحدد</li>
                      </ul>
                      <li>إذا كانت التوصية شراء: اضغط زر "شراء" الأخضر</li>
                      <li>إذا كانت التوصية بيع: اضغط زر "بيع" الأحمر</li>
                    </ol>
                  </div>

                  {/* MT5 Interface Image */}
                  <div className="rounded-lg border-2 border-primary/20 overflow-hidden bg-background">
                    <img 
                      src={mt5TradeInterface} 
                      alt="واجهة تنفيذ الصفقة في MT5" 
                      className="w-full"
                    />
                    <p className="text-xs text-center text-muted-foreground p-2 bg-primary/5">
                      واجهة تنفيذ الصفقة في MT5 - ضع Stop Loss و Take Profit في الخانات المخصصة
                    </p>
                  </div>

                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <span><strong>تحذير:</strong> لا تتداول بأكثر من 2-3% من رأس مالك في صفقة واحدة. التزم دائماً بوقف الخسارة.</span>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">نتيجة التحليل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Recommendation */}
              <div className={`p-6 rounded-xl border-2 ${
                analysis.direction === 'شراء' || analysis.direction === 'BUY'
                  ? 'bg-green-500/10 border-green-500'
                  : 'bg-red-500/10 border-red-500'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(analysis.direction === 'شراء' || analysis.direction === 'BUY') ? (
                      <ArrowUp className="w-8 h-8 text-green-500" />
                    ) : (
                      <ArrowDown className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold">
                        {analysis.direction === 'شراء' || analysis.direction === 'BUY' ? 'توصية شراء' : 'توصية بيع'}
                      </h3>
                      <p className="text-sm opacity-80">
                        قوة الإشارة: {analysis.confidence || analysis.signalStrength || 'متوسطة'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">الإطار الزمني</p>
                    <p className="text-xl font-bold">{timeframe}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg">
                    <p className="text-sm opacity-80 mb-1">نقطة الدخول</p>
                    <p className="text-xl font-bold">{analysis.entryPoint || analysis.entry || 'السعر الحالي'}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <p className="text-sm opacity-80 mb-1">وقف الخسارة</p>
                    <p className="text-xl font-bold text-red-500">{analysis.stopLoss || 'غير محدد'}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <p className="text-sm opacity-80 mb-1">جني الأرباح</p>
                    <p className="text-xl font-bold text-green-500">{analysis.takeProfit || analysis.target || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              {/* Technical Analysis */}
              {(analysis.trend || analysis.pattern) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.trend && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">الاتجاه العام</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80">{analysis.trend}</p>
                      </CardContent>
                    </Card>
                  )}
                  {analysis.pattern && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">نمط الشموع</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80">{analysis.pattern}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Support & Resistance */}
              {(analysis.support || analysis.resistance) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">مستويات الدعم والمقاومة</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    {analysis.support && (
                      <div className="p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm opacity-80 mb-1">الدعم</p>
                        <p className="text-xl font-bold">{analysis.support}</p>
                      </div>
                    )}
                    {analysis.resistance && (
                      <div className="p-4 bg-red-500/10 rounded-lg">
                        <p className="text-sm opacity-80 mb-1">المقاومة</p>
                        <p className="text-xl font-bold">{analysis.resistance}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Advice */}
              {analysis.advice && (
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      نصائح مهمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-foreground/80">
                      {typeof analysis.advice === 'string' ? (
                        <p className="whitespace-pre-wrap">{analysis.advice}</p>
                      ) : (
                        <ul className="space-y-2">
                          {Object.values(analysis.advice).map((tip: any, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full Analysis */}
              {analysis.analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">التحليل التفصيلي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/80 whitespace-pre-wrap">{analysis.analysis}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MT5Analysis;