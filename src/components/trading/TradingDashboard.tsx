import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from "lucide-react";
import { LiveSignals } from "./LiveSignals";
import { StatsCard } from "./StatsCard";
import { useSignals } from "@/hooks/useSignals";
import { useAutoTrade } from "@/hooks/useAutoTrade";
import { AutoTradeButton } from "./AutoTradeButton";

export const TradingDashboard = () => {
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const { signals } = useSignals();
  
  // Enable auto-trading when switch is on
  useAutoTrade(autoTradeEnabled, signals);
  
  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="border-warning bg-warning/10">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm text-foreground">
            <strong>تحذير:</strong> النظام حالياً متصل بحساب تجريبي (Demo). تأكد من اختبار كل شيء قبل التبديل إلى الحساب الحقيقي.
          </p>
        </CardContent>
      </Card>

      {autoTradeEnabled && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="flex items-center gap-3 py-4">
            <Activity className="h-5 w-5 text-success shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-success">✅ التداول التلقائي مفعّل</p>
              <p className="text-xs text-muted-foreground mt-1">
                سيتم تنفيذ التوصيات الجديدة تلقائياً في الوقت المحدد. تأكد من فتح Pocket Option في متصفح آخر.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Trade Control */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>التداول الآلي</CardTitle>
              <CardDescription>تفعيل/إيقاف نسخ الصفقات تلقائياً</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <AutoTradeButton />
              <Badge variant={autoTradeEnabled ? "default" : "secondary"} className="text-sm">
                {autoTradeEnabled ? "مُفعّل" : "مُعطّل"}
              </Badge>
              <Switch 
                checked={autoTradeEnabled} 
                onCheckedChange={setAutoTradeEnabled}
                className="data-[state=checked]:bg-success"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="إجمالي الأرباح"
          value="$1,234.56"
          change="+12.5%"
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="معدل النجاح"
          value="68%"
          change="+5.2%"
          icon={Activity}
          trend="up"
        />
        <StatsCard
          title="صفقات رابحة"
          value="34"
          change="+8"
          icon={TrendingUp}
          trend="up"
        />
        <StatsCard
          title="صفقات خاسرة"
          value="16"
          change="-3"
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Live Signals */}
      <LiveSignals autoTradeEnabled={autoTradeEnabled} />
    </div>
  );
};
