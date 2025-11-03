import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";

interface LiveSignalsProps {
  autoTradeEnabled: boolean;
}

export const LiveSignals = ({ autoTradeEnabled }: LiveSignalsProps) => {
  const { signals, loading } = useSignals();

  if (loading) {
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
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
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
          {signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد توصيات بعد</p>
              <p className="text-xs text-muted-foreground mt-2">
                سيتم عرض التوصيات الجديدة تلقائياً عند وصولها
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
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
                        {format(new Date(signal.received_at), 'yyyy-MM-dd HH:mm:ss')}
                      </span>
                      <span>المبلغ: ${signal.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {signal.status === "executed" && (
                    <Badge 
                      variant="default"
                      className="gap-1 bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      تم التنفيذ
                    </Badge>
                  )}
                  {signal.status === "pending" && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      قيد الانتظار
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
