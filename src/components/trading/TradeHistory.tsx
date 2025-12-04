import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { useUserTradeResults } from "@/hooks/useUserTradeResults";
import { format, isSameDay, addDays, subDays, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export const TradeHistory = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const { signals, loading } = useSignals();
  const { userResults, loading: loadingResults, getStats } = useUserTradeResults();

  // Calculate weekly stats for chart
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayResults = userResults.filter(r => isSameDay(new Date(r.created_at), date));
      const wins = dayResults.filter(r => r.user_result === 'win').length;
      const losses = dayResults.filter(r => r.user_result === 'loss').length;
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      
      data.push({
        date: format(date, 'EEE', { locale: ar }),
        fullDate: format(date, 'dd/MM'),
        wins,
        losses,
        total,
        winRate,
      });
    }
    return data;
  }, [userResults]);

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const exportResults = () => {
    if (myTrades.length === 0) {
      toast.error('لا توجد صفقات للتصدير في هذا اليوم');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let csvContent = "الأصل,الاتجاه,الإطار الزمني,الوقت,النتيجة\n";
    
    myTrades.forEach(trade => {
      if (trade) {
        csvContent += `${trade.asset},${trade.direction},${trade.timeframe},${format(new Date(trade.received_at), 'HH:mm')},${trade.userResult === 'win' ? 'ربح' : 'خسارة'}\n`;
      }
    });

    // Add summary
    csvContent += `\nالملخص\n`;
    csvContent += `إجمالي الصفقات,${dayStats.total}\n`;
    csvContent += `الصفقات الناجحة,${dayStats.wins}\n`;
    csvContent += `الصفقات الخاسرة,${dayStats.losses}\n`;
    csvContent += `نسبة النجاح,${dayStats.winRate}%\n`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `نتائج-الصفقات-${dateStr}.csv`;
    link.click();
    
    toast.success('تم تصدير النتائج بنجاح');
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>قائمة صفقاتي</CardTitle>
            <CardDescription>الصفقات التي سجلت نتائجها</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showChart ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="h-4 w-4 ml-1" />
              الرسم البياني
            </Button>
            {!isToday && (
              <Button variant="outline" size="sm" onClick={goToToday}>
                اليوم
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Date Navigator with Calendar */}
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="min-w-[200px] justify-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: ar })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
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

        {/* Weekly Performance Chart */}
        {showChart && (
          <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-medium mb-3 text-center">أداء الأسبوع</h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-lg text-xs">
                            <p className="font-medium">{data.fullDate}</p>
                            <p className="text-success">ربح: {data.wins}</p>
                            <p className="text-danger">خسارة: {data.losses}</p>
                            <p className="text-primary font-bold">نسبة النجاح: {data.winRate}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.winRate >= 50 ? 'hsl(var(--success))' : entry.total > 0 ? 'hsl(var(--danger))' : 'hsl(var(--muted))'}
                        opacity={entry.total === 0 ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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