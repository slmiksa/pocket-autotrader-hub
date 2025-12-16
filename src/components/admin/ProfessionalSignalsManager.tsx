import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Clock, Loader2, Edit, CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProfessionalSignal {
  id: string;
  asset: string;
  direction: string;
  entry_price: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string;
  confidence_level: string | null;
  analysis: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  result: string | null;
}

// List of available markets - Comprehensive list
const MARKET_SYMBOLS = [
  // Forex - Major Pairs
  { value: "EURUSD", label: "EUR/USD", category: "Forex" },
  { value: "EURUSD-OTC", label: "EUR/USD (OTC)", category: "Forex" },
  { value: "GBPUSD", label: "GBP/USD", category: "Forex" },
  { value: "GBPUSD-OTC", label: "GBP/USD (OTC)", category: "Forex" },
  { value: "USDJPY", label: "USD/JPY", category: "Forex" },
  { value: "USDJPY-OTC", label: "USD/JPY (OTC)", category: "Forex" },
  { value: "AUDUSD", label: "AUD/USD", category: "Forex" },
  { value: "AUDUSD-OTC", label: "AUD/USD (OTC)", category: "Forex" },
  { value: "USDCAD", label: "USD/CAD", category: "Forex" },
  { value: "USDCAD-OTC", label: "USD/CAD (OTC)", category: "Forex" },
  { value: "NZDUSD", label: "NZD/USD", category: "Forex" },
  { value: "NZDUSD-OTC", label: "NZD/USD (OTC)", category: "Forex" },
  { value: "USDCHF", label: "USD/CHF", category: "Forex" },
  { value: "USDCHF-OTC", label: "USD/CHF (OTC)", category: "Forex" },
  
  // Forex - Cross Pairs
  { value: "EURGBP", label: "EUR/GBP", category: "Forex" },
  { value: "EURGBP-OTC", label: "EUR/GBP (OTC)", category: "Forex" },
  { value: "EURJPY", label: "EUR/JPY", category: "Forex" },
  { value: "EURJPY-OTC", label: "EUR/JPY (OTC)", category: "Forex" },
  { value: "GBPJPY", label: "GBP/JPY", category: "Forex" },
  { value: "GBPJPY-OTC", label: "GBP/JPY (OTC)", category: "Forex" },
  { value: "AUDJPY", label: "AUD/JPY", category: "Forex" },
  { value: "AUDJPY-OTC", label: "AUD/JPY (OTC)", category: "Forex" },
  { value: "NZDJPY", label: "NZD/JPY", category: "Forex" },
  { value: "NZDJPY-OTC", label: "NZD/JPY (OTC)", category: "Forex" },
  { value: "AUDNZD", label: "AUD/NZD", category: "Forex" },
  { value: "AUDNZD-OTC", label: "AUD/NZD (OTC)", category: "Forex" },
  { value: "AUDCHF", label: "AUD/CHF", category: "Forex" },
  { value: "AUDCHF-OTC", label: "AUD/CHF (OTC)", category: "Forex" },
  { value: "CADCHF", label: "CAD/CHF", category: "Forex" },
  { value: "CADCHF-OTC", label: "CAD/CHF (OTC)", category: "Forex" },
  { value: "CHFJPY", label: "CHF/JPY", category: "Forex" },
  { value: "CHFJPY-OTC", label: "CHF/JPY (OTC)", category: "Forex" },
  { value: "EURCHF", label: "EUR/CHF", category: "Forex" },
  { value: "EURCHF-OTC", label: "EUR/CHF (OTC)", category: "Forex" },
  { value: "GBPCHF", label: "GBP/CHF", category: "Forex" },
  { value: "GBPCHF-OTC", label: "GBP/CHF (OTC)", category: "Forex" },
  
  // Forex - Exotic & Emerging Markets
  { value: "EURRUB", label: "EUR/RUB", category: "Forex" },
  { value: "EURRUB-OTC", label: "EUR/RUB (OTC)", category: "Forex" },
  { value: "USDINR", label: "USD/INR", category: "Forex" },
  { value: "USDINR-OTC", label: "USD/INR (OTC)", category: "Forex" },
  { value: "USDVND", label: "USD/VND", category: "Forex" },
  { value: "USDVND-OTC", label: "USD/VND (OTC)", category: "Forex" },
  { value: "USDPKR", label: "USD/PKR", category: "Forex" },
  { value: "USDPKR-OTC", label: "USD/PKR (OTC)", category: "Forex" },
  { value: "USDCLP", label: "USD/CLP", category: "Forex" },
  { value: "USDCLP-OTC", label: "USD/CLP (OTC)", category: "Forex" },
  { value: "USDBRL", label: "USD/BRL", category: "Forex" },
  { value: "USDBRL-OTC", label: "USD/BRL (OTC)", category: "Forex" },
  { value: "USDTRY", label: "USD/TRY", category: "Forex" },
  { value: "USDTRY-OTC", label: "USD/TRY (OTC)", category: "Forex" },
  { value: "USDMXN", label: "USD/MXN", category: "Forex" },
  { value: "USDMXN-OTC", label: "USD/MXN (OTC)", category: "Forex" },
  { value: "USDZAR", label: "USD/ZAR", category: "Forex" },
  { value: "USDZAR-OTC", label: "USD/ZAR (OTC)", category: "Forex" },
  
  // Crypto
  { value: "BTCUSD", label: "Bitcoin (BTC/USD)", category: "Crypto" },
  { value: "BTCUSD-OTC", label: "Bitcoin (BTC/USD) OTC", category: "Crypto" },
  { value: "ETHUSD", label: "Ethereum (ETH/USD)", category: "Crypto" },
  { value: "ETHUSD-OTC", label: "Ethereum (ETH/USD) OTC", category: "Crypto" },
  { value: "BNBUSD", label: "BNB (BNB/USD)", category: "Crypto" },
  { value: "XRPUSD", label: "XRP (XRP/USD)", category: "Crypto" },
  { value: "ADAUSD", label: "Cardano (ADA/USD)", category: "Crypto" },
  { value: "SOLUSD", label: "Solana (SOL/USD)", category: "Crypto" },
  { value: "DOTUSD", label: "Polkadot (DOT/USD)", category: "Crypto" },
  { value: "DOGEUSD", label: "Dogecoin (DOGE/USD)", category: "Crypto" },
  { value: "MATICUSD", label: "Polygon (MATIC/USD)", category: "Crypto" },
  { value: "LTCUSD", label: "Litecoin (LTC/USD)", category: "Crypto" },
  
  // Metals
  { value: "XAUUSD", label: "الذهب (XAU/USD)", category: "معادن" },
  { value: "XAUUSD-OTC", label: "الذهب (XAU/USD) OTC", category: "معادن" },
  { value: "XAGUSD", label: "الفضة (XAG/USD)", category: "معادن" },
  { value: "XAGUSD-OTC", label: "الفضة (XAG/USD) OTC", category: "معادن" },
  { value: "XPTUSD", label: "البلاتين (XPT/USD)", category: "معادن" },
  { value: "XPDUSD", label: "البلاديوم (XPD/USD)", category: "معادن" },
  
  // Commodities & Energy
  { value: "WTIUSD", label: "النفط الخام WTI", category: "سلع وطاقة" },
  { value: "WTIUSD-OTC", label: "النفط الخام WTI (OTC)", category: "سلع وطاقة" },
  { value: "UKOIL", label: "نفط برنت", category: "سلع وطاقة" },
  { value: "NATGAS", label: "الغاز الطبيعي", category: "سلع وطاقة" },
  
  // Indices
  { value: "US30", label: "Dow Jones (US30)", category: "مؤشرات" },
  { value: "US30-OTC", label: "Dow Jones (US30) OTC", category: "مؤشرات" },
  { value: "NAS100", label: "Nasdaq 100", category: "مؤشرات" },
  { value: "NAS100-OTC", label: "Nasdaq 100 OTC", category: "مؤشرات" },
  { value: "SPX500", label: "S&P 500", category: "مؤشرات" },
  { value: "SPX500-OTC", label: "S&P 500 OTC", category: "مؤشرات" },
  { value: "UK100", label: "FTSE 100", category: "مؤشرات" },
  { value: "GER40", label: "DAX 40", category: "مؤشرات" },
  { value: "FRA40", label: "CAC 40", category: "مؤشرات" },
  { value: "JPN225", label: "Nikkei 225", category: "مؤشرات" },
  { value: "AUS200", label: "ASX 200", category: "مؤشرات" },
  { value: "HKG50", label: "Hang Seng", category: "مؤشرات" },
  
  // Stocks - Tech
  { value: "AAPL", label: "Apple", category: "أسهم" },
  { value: "AAPL-OTC", label: "Apple (OTC)", category: "أسهم" },
  { value: "GOOGL", label: "Google", category: "أسهم" },
  { value: "GOOGL-OTC", label: "Google (OTC)", category: "أسهم" },
  { value: "MSFT", label: "Microsoft", category: "أسهم" },
  { value: "MSFT-OTC", label: "Microsoft (OTC)", category: "أسهم" },
  { value: "TSLA", label: "Tesla", category: "أسهم" },
  { value: "TSLA-OTC", label: "Tesla (OTC)", category: "أسهم" },
  { value: "AMZN", label: "Amazon", category: "أسهم" },
  { value: "AMZN-OTC", label: "Amazon (OTC)", category: "أسهم" },
  { value: "META", label: "Meta (Facebook)", category: "أسهم" },
  { value: "NFLX", label: "Netflix", category: "أسهم" },
  { value: "NVDA", label: "NVIDIA", category: "أسهم" },
  { value: "AMD", label: "AMD", category: "أسهم" },
  { value: "INTC", label: "Intel", category: "أسهم" },
  
  // Stocks - Finance & Others
  { value: "JPM", label: "JPMorgan", category: "أسهم" },
  { value: "BAC", label: "Bank of America", category: "أسهم" },
  { value: "WMT", label: "Walmart", category: "أسهم" },
  { value: "JNJ", label: "Johnson & Johnson", category: "أسهم" },
  { value: "PFE", label: "Pfizer", category: "أسهم" },
  { value: "XOM", label: "Exxon Mobil", category: "أسهم" },
  { value: "CVX", label: "Chevron", category: "أسهم" },
  { value: "KO", label: "Coca-Cola", category: "أسهم" },
  { value: "DIS", label: "Disney", category: "أسهم" },
  { value: "BA", label: "Boeing", category: "أسهم" },
];

export const ProfessionalSignalsManager = () => {
  const [signals, setSignals] = useState<ProfessionalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingSignal, setEditingSignal] = useState<ProfessionalSignal | null>(null);

  // Form state
  const [asset, setAsset] = useState("");
  const [assetOpen, setAssetOpen] = useState(false);
  const [direction, setDirection] = useState("CALL");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [timeframe, setTimeframe] = useState("5m");
  const [confidenceLevel, setConfidenceLevel] = useState("high");
  const [analysis, setAnalysis] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [expiresAtTime, setExpiresAtTime] = useState("12:00");

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from("professional_signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSignals(data || []);
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast.error("فشل تحميل التوصيات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateSignal = async () => {
    if (!asset || !direction || !timeframe) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time for expires_at
      let expiresAtValue = null;
      if (expiresAt) {
        const [hours, minutes] = expiresAtTime.split(':');
        // Create a new date with the selected date
        const year = expiresAt.getFullYear();
        const month = expiresAt.getMonth();
        const day = expiresAt.getDate();
        // Create date with specified time in local timezone
        const dateTime = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);
        expiresAtValue = dateTime.toISOString();
      }

      const signalData = {
        asset,
        direction,
        entry_price: entryPrice || null,
        target_price: targetPrice || null,
        stop_loss: stopLoss || null,
        timeframe,
        confidence_level: confidenceLevel,
        analysis: analysis || null,
        expires_at: expiresAtValue,
        is_active: true,
        result: editingSignal ? editingSignal.result : 'pending'
      };

      if (editingSignal) {
        // Update existing signal
        const { error } = await supabase
          .from("professional_signals")
          .update(signalData)
          .eq("id", editingSignal.id);

        if (error) throw error;
        toast.success("تم تحديث التوصية بنجاح");
      } else {
        // Create new signal
        const { error } = await supabase
          .from("professional_signals")
          .insert(signalData);

        if (error) throw error;
        toast.success("تم إنشاء التوصية بنجاح");
      }
      
      // Reset form
      resetForm();
      fetchSignals();
    } catch (error) {
      console.error("Error saving signal:", error);
      toast.error(editingSignal ? "فشل تحديث التوصية" : "فشل إنشاء التوصية");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAsset("");
    setDirection("CALL");
    setEntryPrice("");
    setTargetPrice("");
    setStopLoss("");
    setTimeframe("5m");
    setConfidenceLevel("high");
    setAnalysis("");
    setExpiresAt(undefined);
    setExpiresAtTime("12:00");
    setEditingSignal(null);
  };

  const handleEditSignal = (signal: ProfessionalSignal) => {
    setEditingSignal(signal);
    setAsset(signal.asset);
    setDirection(signal.direction);
    setEntryPrice(signal.entry_price || "");
    setTargetPrice(signal.target_price || "");
    setStopLoss(signal.stop_loss || "");
    setTimeframe(signal.timeframe);
    setConfidenceLevel(signal.confidence_level || "high");
    setAnalysis(signal.analysis || "");
    
    if (signal.expires_at) {
      const date = new Date(signal.expires_at);
      setExpiresAt(date);
      setExpiresAtTime(format(date, "HH:mm"));
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSignal = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه التوصية؟")) return;

    try {
      const { error } = await supabase
        .from("professional_signals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف التوصية بنجاح");
      fetchSignals();
    } catch (error) {
      console.error("Error deleting signal:", error);
      toast.error("فشل حذف التوصية");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("professional_signals")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} التوصية`);
      fetchSignals();
    } catch (error) {
      console.error("Error toggling signal:", error);
      toast.error("فشل تحديث حالة التوصية");
    }
  };

  const handleUpdateResult = async (id: string, result: string) => {
    try {
      const { error } = await supabase
        .from("professional_signals")
        .update({ 
          result,
          closed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("تم تحديث نتيجة التوصية");
      fetchSignals();
    } catch (error) {
      console.error("Error updating result:", error);
      toast.error("فشل تحديث النتيجة");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Signal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            {editingSignal ? "تعديل التوصية" : "إنشاء توصية احترافية جديدة"}
          </CardTitle>
          <CardDescription>
            {editingSignal ? "قم بتحديث بيانات التوصية" : "أضف توصية جديدة سيتم عرضها للمستخدمين المفعلين"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الأصل / الرمز *</Label>
              <Popover open={assetOpen} onOpenChange={setAssetOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assetOpen}
                    className="w-full justify-between"
                  >
                    {asset
                      ? MARKET_SYMBOLS.find((symbol) => symbol.value === asset)?.label
                      : "ابحث عن الأصل..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن العملة أو السهم..." />
                    <CommandList>
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      {["Forex", "Crypto", "معادن", "مؤشرات", "أسهم"].map((category) => {
                        const items = MARKET_SYMBOLS.filter((s) => s.category === category);
                        if (items.length === 0) return null;
                        return (
                          <CommandGroup key={category} heading={category}>
                            {items.map((symbol) => (
                              <CommandItem
                                key={symbol.value}
                                value={symbol.value}
                                onSelect={(currentValue) => {
                                  setAsset(currentValue);
                                  setAssetOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    asset === symbol.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {symbol.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>الاتجاه *</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">CALL (شراء)</SelectItem>
                  <SelectItem value="PUT">PUT (بيع)</SelectItem>
                  <SelectItem value="BUY">BUY (شراء)</SelectItem>
                  <SelectItem value="SELL">SELL (بيع)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>سعر الدخول</Label>
              <Input
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="مثال: 1.0850"
              />
            </div>

            <div className="space-y-2">
              <Label>الهدف</Label>
              <Input
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="مثال: 1.0900"
              />
            </div>

            <div className="space-y-2">
              <Label>وقف الخسارة</Label>
              <Input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="مثال: 1.0800"
              />
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني *</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 دقيقة</SelectItem>
                  <SelectItem value="5m">5 دقائق</SelectItem>
                  <SelectItem value="15m">15 دقيقة</SelectItem>
                  <SelectItem value="30m">30 دقيقة</SelectItem>
                  <SelectItem value="1h">ساعة</SelectItem>
                  <SelectItem value="4h">4 ساعات</SelectItem>
                  <SelectItem value="1d">يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مستوى الثقة</Label>
              <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="low">منخفض</SelectItem>
                </SelectContent>
              </Select>
            </div>

              <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !expiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP", { locale: ar }) : "اختر تاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={setExpiresAt}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={expiresAtTime}
                  onChange={(e) => setExpiresAtTime(e.target.value)}
                  className="w-32"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const now = new Date();
                    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
                    setExpiresAt(inOneHour);
                    setExpiresAtTime(format(inOneHour, "HH:mm"));
                  }}
                  title="تعيين الانتهاء بعد ساعة من الآن"
                >
                  بعد ساعة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpiresAt(undefined);
                    setExpiresAtTime("12:00");
                  }}
                  title="بدون تاريخ انتهاء"
                >
                  بلا انتهاء
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>التحليل</Label>
            <Textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="اكتب تحليلاً مفصلاً للتوصية..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateOrUpdateSignal}
              disabled={submitting}
              className="flex-1"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  {editingSignal ? "جاري التحديث..." : "جاري الإنشاء..."}
                </>
              ) : (
                <>
                  {editingSignal ? (
                    <>
                      <Edit className="h-4 w-4 ml-2" />
                      تحديث التوصية
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      إنشاء التوصية
                    </>
                  )}
                </>
              )}
            </Button>
            {editingSignal && (
              <Button
                onClick={resetForm}
                variant="outline"
                size="lg"
              >
                إلغاء التعديل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signals List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">التوصيات الحالية</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            إدارة جميع التوصيات الاحترافية ({signals.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>لا توجد توصيات حالياً</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block sm:hidden space-y-3">
                {signals.map((signal) => (
                  <Card key={signal.id} className={`${signal.is_active ? 'border-primary/30' : 'border-muted opacity-60'}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{signal.asset}</span>
                        <Badge
                          className={`text-xs ${
                            signal.direction === "CALL" || signal.direction === "BUY"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {signal.direction}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{signal.timeframe}</span>
                        {signal.confidence_level && (
                          <Badge variant="outline" className="text-xs">
                            {signal.confidence_level === "high" ? "عالي" : 
                             signal.confidence_level === "medium" ? "متوسط" : "منخفض"}
                          </Badge>
                        )}
                        <span className={signal.is_active ? "text-success" : "text-muted-foreground"}>
                          {signal.is_active ? "نشط" : "غير نشط"}
                        </span>
                      </div>

                      {(signal.entry_price || signal.target_price) && (
                        <div className="flex gap-3 text-xs">
                          {signal.entry_price && <span>دخول: {signal.entry_price}</span>}
                          {signal.target_price && <span>هدف: {signal.target_price}</span>}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-1">
                        <Select
                          value={signal.result || "pending"}
                          onValueChange={(value) => handleUpdateResult(signal.id, value)}
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="win">ربح</SelectItem>
                            <SelectItem value="loss">خسارة</SelectItem>
                            <SelectItem value="breakeven">تعادل</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(signal.id, signal.is_active)}
                            className="h-7 w-7 p-0"
                          >
                            {signal.is_active ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSignal(signal)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSignal(signal.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الأصل</TableHead>
                      <TableHead>الاتجاه</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الإطار الزمني</TableHead>
                      <TableHead>الثقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>النتيجة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.map((signal) => (
                      <TableRow key={signal.id}>
                        <TableCell className="font-medium">{signal.asset}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              signal.direction === "CALL" || signal.direction === "BUY"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {signal.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {signal.entry_price && <div>دخول: {signal.entry_price}</div>}
                          {signal.target_price && <div>هدف: {signal.target_price}</div>}
                        </TableCell>
                        <TableCell>{signal.timeframe}</TableCell>
                        <TableCell>
                          {signal.confidence_level && (
                            <Badge variant="outline">
                              {signal.confidence_level === "high" ? "عالي" : 
                               signal.confidence_level === "medium" ? "متوسط" : "منخفض"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(signal.id, signal.is_active)}
                          >
                            {signal.is_active ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={signal.result || "pending"}
                            onValueChange={(value) => handleUpdateResult(signal.id, value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">قيد الانتظار</SelectItem>
                              <SelectItem value="win">ربح</SelectItem>
                              <SelectItem value="loss">خسارة</SelectItem>
                              <SelectItem value="breakeven">تعادل</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSignal(signal)}
                            >
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSignal(signal.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};