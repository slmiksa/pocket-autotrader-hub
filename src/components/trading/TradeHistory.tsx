import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";

export const TradeHistory = () => {
  const { signals, loading } = useSignals();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل الصفقات</CardTitle>
          <CardDescription>تاريخ جميع الصفقات والنتائج</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only signals with results (completed trades)
  const completedTrades = signals.filter(signal => signal.result);
  
  const wins = completedTrades.filter(signal => signal.result?.startsWith('win')).length;
  const losses = completedTrades.filter(signal => signal.result === 'loss').length;
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-base sm:text-lg">سجل الصفقات المكتملة</span>
          <div className="flex gap-2 text-xs sm:text-sm">
            <span className="text-success">✅ {wins}</span>
            <span className="text-danger">❌ {losses}</span>
            <span className="text-muted-foreground">({winRate}%)</span>
          </div>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">الصفقات التي لها نتائج نهائية فقط</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {completedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">لا توجد صفقات مكتملة بعد</p>
              <p className="text-xs text-muted-foreground mt-2">
                ستظهر هنا الصفقات التي لها نتيجة نهائية فقط
              </p>
            </div>
          ) : (
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الأصل</TableHead>
                    <TableHead>الاتجاه</TableHead>
                    <TableHead>وقت الدخول</TableHead>
                    <TableHead>النتيجة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedTrades.map((signal) => (
                    <TableRow key={signal.id}>
                      <TableCell className="font-medium">{signal.asset}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={signal.direction === "CALL" ? "default" : "destructive"}
                          className={cn(
                            "text-xs",
                            signal.direction === "CALL" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {signal.direction === "CALL" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {signal.direction}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{signal.entry_time || 'فوري'}</TableCell>
                      <TableCell>
                        {signal.result === "win" && (
                          <Badge 
                            variant="default"
                            className="gap-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            ربح
                          </Badge>
                        )}
                        {signal.result === "win1" && (
                          <Badge 
                            variant="default"
                            className="gap-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            ربح ¹
                          </Badge>
                        )}
                        {signal.result === "win2" && (
                          <Badge 
                            variant="default"
                            className="gap-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            ربح ²
                          </Badge>
                        )}
                        {signal.result === "loss" && (
                          <Badge 
                            variant="destructive"
                            className="gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            خسارة
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(signal.received_at), 'dd/MM HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Mobile View - Card Layout */}
          {completedTrades.length > 0 && (
            <div className="sm:hidden space-y-3 p-3">
              {completedTrades.map((signal) => (
                <div key={signal.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{signal.asset}</span>
                    {signal.result === "win" && (
                      <Badge 
                        variant="default"
                        className="gap-1 bg-success hover:bg-success/90 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        ربح
                      </Badge>
                    )}
                    {signal.result === "win1" && (
                      <Badge 
                        variant="default"
                        className="gap-1 bg-success hover:bg-success/90 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        ربح ¹
                      </Badge>
                    )}
                    {signal.result === "win2" && (
                      <Badge 
                        variant="default"
                        className="gap-1 bg-success hover:bg-success/90 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        ربح ²
                      </Badge>
                    )}
                    {signal.result === "loss" && (
                      <Badge 
                        variant="destructive"
                        className="gap-1 text-xs"
                      >
                        <XCircle className="h-3 w-3" />
                        خسارة
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={signal.direction === "CALL" ? "default" : "destructive"}
                      className={cn(
                        "text-xs",
                        signal.direction === "CALL" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {signal.direction === "CALL" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {signal.direction}
                      </div>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ⏰ {signal.entry_time || 'فوري'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    📅 {format(new Date(signal.received_at), 'dd/MM/yyyy HH:mm')}
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