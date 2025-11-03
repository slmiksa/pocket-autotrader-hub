import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveSignalsProps {
  autoTradeEnabled: boolean;
}

// Mock data - سيتم استبداله ببيانات حقيقية من Telegram
const mockSignals = [
  {
    id: 1,
    asset: "GBPUSD-OTC",
    timeframe: "M1",
    direction: "PUT",
    amount: 5,
    timestamp: "2025-11-03 14:23:45",
    status: "executed",
    result: "win"
  },
  {
    id: 2,
    asset: "EURUSD-OTC",
    timeframe: "M1",
    direction: "CALL",
    amount: 5,
    timestamp: "2025-11-03 14:20:12",
    status: "executed",
    result: "loss"
  },
  {
    id: 3,
    asset: "AUDCAD-OTC",
    timeframe: "M1",
    direction: "PUT",
    amount: 5,
    timestamp: "2025-11-03 14:18:33",
    status: "pending",
    result: null
  }
];

export const LiveSignals = ({ autoTradeEnabled }: LiveSignalsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
          التوصيات المباشرة
        </CardTitle>
        <CardDescription>
          آخر التوصيات من قناة تيليجرام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {mockSignals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    signal.direction === "CALL" ? "bg-success/20" : "bg-danger/20"
                  )}>
                    {signal.direction === "CALL" ? (
                      <TrendingUp className="h-6 w-6 text-success" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-danger" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{signal.asset}</span>
                      <Badge variant="outline" className="text-xs">
                        {signal.timeframe}
                      </Badge>
                      <Badge 
                        variant={signal.direction === "CALL" ? "default" : "destructive"}
                        className={cn(
                          "text-xs",
                          signal.direction === "CALL" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                        )}
                      >
                        {signal.direction}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {signal.timestamp}
                      </span>
                      <span>المبلغ: ${signal.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {signal.status === "executed" && signal.result && (
                    <Badge 
                      variant={signal.result === "win" ? "default" : "destructive"}
                      className={cn(
                        "gap-1",
                        signal.result === "win" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                      )}
                    >
                      {signal.result === "win" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          ربح
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          خسارة
                        </>
                      )}
                    </Badge>
                  )}
                  {signal.status === "pending" && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      قيد التنفيذ
                    </Badge>
                  )}
                  {!autoTradeEnabled && signal.status === "pending" && (
                    <Button size="sm" variant="outline">
                      تنفيذ يدوي
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
