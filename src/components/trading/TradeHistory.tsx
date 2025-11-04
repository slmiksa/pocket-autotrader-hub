import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { useUserTradeResults } from "@/hooks/useUserTradeResults";
import { format } from "date-fns";

export const TradeHistory = () => {
  const { signals, loading } = useSignals();
  const { userResults, getStats } = useUserTradeResults();
  
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>صفقاتي</CardTitle>
          <CardDescription>الصفقات التي سجلت نتائجها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>;
  }

  const stats = getStats();
  
  // Get signals with user results
  const myTrades = userResults.map(result => {
    const signal = signals.find(s => s.id === result.signal_id);
    return signal ? { ...signal, userResult: result.user_result } : null;
  }).filter(Boolean);

  return <Card>
    <CardHeader>
      <CardTitle>صفقاتي</CardTitle>
      <CardDescription>الصفقات التي سجلت نتائجها</CardDescription>
      
      {/* Stats Summary */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg bg-card border p-3">
            <div className="text-xs text-muted-foreground">إجمالي الصفقات</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg bg-success/20 border border-success/30 p-3">
            <div className="text-xs text-muted-foreground">ناجحة</div>
            <div className="text-2xl font-bold text-success">{stats.wins}</div>
          </div>
          <div className="rounded-lg bg-danger/20 border border-danger/30 p-3">
            <div className="text-xs text-muted-foreground">خاسرة</div>
            <div className="text-2xl font-bold text-danger">{stats.losses}</div>
          </div>
          <div className="rounded-lg bg-primary/20 border border-primary/30 p-3">
            <div className="text-xs text-muted-foreground">نسبة النجاح</div>
            <div className="text-2xl font-bold text-primary">{stats.winRate}%</div>
          </div>
        </div>
      )}
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[400px]">
        {myTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <p className="text-muted-foreground">لم تسجل أي نتائج بعد</p>
            <p className="text-xs text-muted-foreground mt-2">
              سجل نتائج صفقاتك من قسم التوصيات المباشرة
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTrades.map(signal => signal && (
              <div key={signal.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                    signal.direction === "CALL" ? "bg-success/20" : "bg-danger/20"
                  )}>
                    {signal.direction === "CALL" ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-danger" />
                    )}
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{signal.asset}</span>
                      <Badge variant="outline" className="text-xs">
                        {signal.timeframe}
                      </Badge>
                      <Badge 
                        variant={signal.direction === "CALL" ? "default" : "destructive"}
                        className={cn(
                          "text-xs",
                          signal.direction === "CALL" 
                            ? "bg-success hover:bg-success/90" 
                            : "bg-danger hover:bg-danger/90"
                        )}
                      >
                        {signal.direction}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(signal.received_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                <Badge 
                  variant={signal.userResult === 'win' ? 'default' : 'destructive'}
                  className={cn(
                    "gap-1 text-base px-3 py-1",
                    signal.userResult === 'win' && 'bg-success hover:bg-success/90'
                  )}
                >
                  {signal.userResult === 'win' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      ✅ ربح
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      ❌ خسارة
                    </>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </CardContent>
  </Card>;
};