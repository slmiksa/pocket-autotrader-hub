import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from "lucide-react";
import { LiveSignals } from "./LiveSignals";
import { StatsCard } from "./StatsCard";
import { TradeHistory } from "./TradeHistory";
import { TradingAdvice } from "./TradingAdvice";
import { useSignals } from "@/hooks/useSignals";
import { useAutoTrade } from "@/hooks/useAutoTrade";
import { AutoTradeButton } from "./AutoTradeButton";
export const TradingDashboard = () => {
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const {
    signals
  } = useSignals();

  // Enable auto-trading when switch is on
  useAutoTrade(autoTradeEnabled, signals);
  return <div className="space-y-6">
      {/* Trading Advice */}
      <TradingAdvice />

      {/* Warning Banner */}
      <Card className="border-warning bg-warning/10">
        
      </Card>

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