import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { LiveSignals } from "./LiveSignals";
import { StatsCard } from "./StatsCard";
import { TradeHistory } from "./TradeHistory";
import { TradingAdvice } from "./TradingAdvice";
import { useSignals } from "@/hooks/useSignals";
import { useAutoTrade } from "@/hooks/useAutoTrade";
import { AutoTradeButton } from "./AutoTradeButton";
export const TradingDashboard = () => {
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const {
    signals
  } = useSignals();

  // Enable auto-trading when switch is on
  useAutoTrade(autoTradeEnabled, signals);
  return <div className="space-y-6">
      {/* Trading Advice */}
      <TradingAdvice />

      {/* Instructions Button */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto" size="lg">
            <BookOpen className="h-5 w-5 ml-2" />
            تعليمات استخدام التوصيات
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              دليل استخدام التوصيات الاحترافي
            </DialogTitle>
            <DialogDescription>
              اتبع هذه التعليمات بدقة لتحقيق أفضل النتائج وأعلى معدلات الربح
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Rule 1 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">1. الالتزام الدقيق بالتوصية</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    يجب التقيد التام بالتوصية من حيث <span className="font-semibold text-foreground">التوقيت المحدد</span> و<span className="font-semibold text-foreground">الاتجاه (Call أو Put)</span>. لا تتداول قبل أو بعد الوقت المحدد، ولا تغير الاتجاه تحت أي ظرف.
                  </p>
                </div>
              </div>
            </div>

            {/* Rule 2 */}
            <div className="space-y-3 bg-warning/5 p-4 rounded-lg border border-warning/20">
              <div className="flex items-start gap-3">
                <div className="bg-warning/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">2. استراتيجية المضاعفة (3 محاولات)</h3>
                  <div className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed">
                      في حالة خسارة الصفقة، لديك <span className="font-bold text-warning">مضاعفتان إضافيتان</span> فقط لتعويض الخسارة:
                    </p>
                    
                    <div className="bg-background rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary">•</span>
                        <p className="text-sm">
                          <span className="font-semibold">المحاولة الأولى:</span> ادخل بالمبلغ الأساسي (1% من رأس المال)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-warning">•</span>
                        <p className="text-sm">
                          <span className="font-semibold">المحاولة الثانية (في حالة الخسارة):</span> ضاعف المبلغ في الدقيقة التالية مباشرة بنفس الاتجاه
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-destructive">•</span>
                        <p className="text-sm">
                          <span className="font-semibold">المحاولة الثالثة (في حالة الخسارة):</span> ضاعف المبلغ مرة أخرى عند بداية الدقيقة التالية بنفس الاتجاه
                        </p>
                      </div>
                    </div>

                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <p className="text-sm font-semibold text-destructive">
                        ⚠️ تنبيه هام: بعد المحاولة الثالثة، توقف تماماً وانتظر التوصية التالية
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rule 3 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-success/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">3. إدارة رأس المال</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    ادخل فقط بـ <span className="font-bold text-success text-xl">1%</span> من إجمالي رأس المال في كل صفقة. هذه النسبة تضمن لك حماية رأس المال وتحقيق نمو مستدام على المدى الطويل.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-gradient-to-r from-primary/10 to-success/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🎯</div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-primary">مفتاح النجاح</h3>
                  <p className="text-foreground leading-relaxed">
                    بالالتزام الكامل بهذه التعليمات، سوف تحقق <span className="font-bold text-success">أرباحاً استثنائية</span> بإذن الله. الانضباط والصبر هما سر التداول الناجح.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowInstructions(false)} size="lg">
              فهمت التعليمات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Important Trading Information */}
      <div className="space-y-4">
        

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">ملاحظة هامة - استراتيجية المضاعفة:</p>
              <p className="text-foreground">
                في حالة خسارة التوصية من المرة الأولى، لديك <span className="font-bold text-destructive">مضاعفتان فقط</span> للنجاح بالصفقة. لا تضاعف أكثر من مرتين للحفاظ على رأس مالك.
              </p>
            </div>
          </div>
        </div>
      </div>

      {autoTradeEnabled && <Card className="border-success/30 bg-success/10">
          <CardContent className="flex items-start sm:items-center gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-6">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0 animate-pulse mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-success">✅ التداول التلقائي مفعّل</p>
              <p className="text-xs text-muted-foreground mt-1">
                سيتم تنفيذ التوصيات الجديدة تلقائياً في الوقت المحدد. تأكد من فتح Pocket Option في متصفح آخر.
              </p>
            </div>
          </CardContent>
        </Card>}

      {/* Auto Trade Control */}
      <Card>
        
      </Card>

      {/* Stats Grid */}
      

      {/* Live Signals and Trade History */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <LiveSignals autoTradeEnabled={autoTradeEnabled} />
        <TradeHistory />
      </div>
    </div>;
};