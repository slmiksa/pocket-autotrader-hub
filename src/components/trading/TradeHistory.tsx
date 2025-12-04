import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { useUserTradeResults } from "@/hooks/useUserTradeResults";
import { format, isSameDay, startOfDay, addDays, subDays } from "date-fns";
import { ar } from "date-fns/locale";

export const TradeHistory = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { signals, loading } = useSignals();
  const { userResults, loading: loadingResults, getStats } = useUserTradeResults();

  if (loading || loadingResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>صفقاتي</CardTitle>
          <CardDescription>الصفقات التي سجلت نتائجها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter results by selected date
  const filteredResults = userResults.filter(result => 
    isSameDay(new Date(result.created_at), selectedDate)
  );

  // Get stats for selected date only
  const getDayStats = () => {
    const dayWins = filteredResults.filter(r => r.user_result === 'win').length;
    const dayLosses = filteredResults.filter(r => r.user_result === 'loss').length;
    const dayTotal = dayWins + dayLosses;
    const dayWinRate = dayTotal > 0 ? Math.round((dayWins / dayTotal) * 100) : 0;
    return { wins: dayWins, losses: dayLosses, total: dayTotal, winRate: dayWinRate };
  };

  const dayStats = getDayStats();
  const allStats = getStats();

  // Get trades for selected date
  const myTrades = filteredResults.map(result => {
    const signal = signals.find(s => s.id === result.signal_id);
    return signal ? { ...signal, userResult: result.user_result } : null;
  }).filter(Boolean);

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>قائمة صفقاتي</CardTitle>
            <CardDescription>الصفقات التي سجلت نتائجها</CardDescription>
          </div>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={goToToday}>
              اليوم
            </Button>
          )}
        </div>

        {/* Date Navigator */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: ar })}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextDay}
            disabled={isToday}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-card border p-3">
            <div className="text-xs text-muted-foreground">صفقات اليوم</div>
            <div className="text-2xl font-bold">{dayStats.total}</div>
          </div>
          <div className="rounded-lg bg-success/20 border border-success/30 p-3">
            <div className="text-xs text-muted-foreground">ناجحة</div>
            <div className="text-2xl font-bold text-success">{dayStats.wins}</div>
          </div>
          <div className="rounded-lg bg-danger/20 border border-danger/30 p-3">
            <div className="text-xs text-muted-foreground">خاسرة</div>
            <div className="text-2xl font-bold text-danger">{dayStats.losses}</div>
          </div>
          <div className="rounded-lg bg-primary/20 border border-primary/30 p-3">
            <div className="text-xs text-muted-foreground">نسبة النجاح</div>
            <div className="text-2xl font-bold text-primary">{dayStats.winRate}%</div>
          </div>
        </div>

        {/* All Time Stats Summary */}
        {allStats.total > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border text-center">
            <span className="text-xs text-muted-foreground">
              الإجمالي الكلي: {allStats.total} صفقة | {allStats.wins} ربح | {allStats.losses} خسارة | نسبة النجاح {allStats.winRate}%
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[350px]">
          {myTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">لا توجد صفقات في هذا اليوم</p>
              <p className="text-xs text-muted-foreground mt-2">
                سجل نتائج صفقاتك من قسم التوصيات المباشرة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrades.map(signal => signal && (
                <div 
                  key={signal.id} 
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      signal.direction === "CALL" ? "bg-success/20" : "bg-danger/20"
                    )}>
                      {signal.direction === "CALL" 
                        ? <TrendingUp className="h-5 w-5 text-success" /> 
                        : <TrendingDown className="h-5 w-5 text-danger" />
                      }
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{signal.asset}</span>
                        <Badge variant="outline" className="text-xs">{signal.timeframe}</Badge>
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
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(signal.received_at), 'HH:mm')}
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
    </Card>
  );
};