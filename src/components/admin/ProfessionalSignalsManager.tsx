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
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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

export const ProfessionalSignalsManager = () => {
  const [signals, setSignals] = useState<ProfessionalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [asset, setAsset] = useState("");
  const [direction, setDirection] = useState("CALL");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [timeframe, setTimeframe] = useState("5m");
  const [confidenceLevel, setConfidenceLevel] = useState("high");
  const [analysis, setAnalysis] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

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

  const handleCreateSignal = async () => {
    if (!asset || !direction || !timeframe) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("professional_signals").insert({
        asset,
        direction,
        entry_price: entryPrice || null,
        target_price: targetPrice || null,
        stop_loss: stopLoss || null,
        timeframe,
        confidence_level: confidenceLevel,
        analysis: analysis || null,
        expires_at: expiresAt || null,
        is_active: true,
        result: 'pending'
      });

      if (error) throw error;

      toast.success("تم إنشاء التوصية بنجاح");
      
      // Reset form
      setAsset("");
      setDirection("CALL");
      setEntryPrice("");
      setTargetPrice("");
      setStopLoss("");
      setTimeframe("5m");
      setConfidenceLevel("high");
      setAnalysis("");
      setExpiresAt("");
      
      fetchSignals();
    } catch (error) {
      console.error("Error creating signal:", error);
      toast.error("فشل إنشاء التوصية");
    } finally {
      setSubmitting(false);
    }
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
            إنشاء توصية احترافية جديدة
          </CardTitle>
          <CardDescription>
            أضف توصية جديدة سيتم عرضها للمستخدمين المفعلين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الأصل / الرمز *</Label>
              <Input
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="مثال: EURUSD, BTCUSD, GOLD"
              />
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
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
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

          <Button
            onClick={handleCreateSignal}
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء التوصية
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Signals List */}
      <Card>
        <CardHeader>
          <CardTitle>التوصيات الحالية</CardTitle>
          <CardDescription>
            إدارة جميع التوصيات الاحترافية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>لا توجد توصيات حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSignal(signal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};