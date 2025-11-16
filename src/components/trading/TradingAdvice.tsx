import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Target, Shield, Lightbulb } from "lucide-react";
export const TradingAdvice = () => {
  return <div className="space-y-4">
      {/* Success Rate Banner */}
      <Card className="border-success/50 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-success"> توصيات باينري أوبشن لمنصة بوكيت اوبشن<Target className="h-5 w-5" />
            نسبة نجاح التوصيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-success">89%</p>
              <p className="text-sm text-muted-foreground">معدل الربح</p>
            </div>
            <Badge variant="default" className="bg-success hover:bg-success/90 text-lg px-4 py-2">
              عالي الدقة ✅
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Martingale Warning */}
      

      {/* Trading Tips */}
      <Card className="mx-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            نصائح التداول
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">إدارة رأس المال</p>
              <p className="text-xs text-muted-foreground">
                لا تخاطر بأكثر من 2-5% من رأس مالك في الصفقة الواحدة
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">التزم بالتوصيات</p>
              <p className="text-xs text-muted-foreground">
                اتبع وقت الدخول والاتجاه المحددين في التوصية بدقة
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">تجنب العشوائية</p>
              <p className="text-xs text-muted-foreground">
                لا تدخل صفقات بدون توصية، والتزم بالاستراتيجية
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">راقب النتائج</p>
              <p className="text-xs text-muted-foreground">
                تابع نتائج التوصيات السابقة لفهم أداء الاستراتيجية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};