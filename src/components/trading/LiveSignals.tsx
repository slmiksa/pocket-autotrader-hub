import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface LiveSignalsProps {
  autoTradeEnabled: boolean;
}

export const LiveSignals = ({ autoTradeEnabled }: LiveSignalsProps) => {
  const { signals, loading, refetch } = useSignals();
  const [fetching, setFetching] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const fetchTelegramMessages = async () => {
    // Prevent concurrent requests
    if (isPolling) {
      console.log('Skipping fetch - previous request still in progress');
      return;
    }

    setIsPolling(true);
    setFetching(true);
    
    try {
      // Use the new channel reader function instead
      const { data, error } = await supabase.functions.invoke('telegram-channel-reader');
      
      if (error) throw error;
      
      if (data.signalsFound > 0) {
        toast.success(`تم العثور على ${data.signalsFound} توصية جديدة من القناة 📢`);
        // Refresh signals immediately after finding new ones
        refetch();
      }
      if (data.resultsUpdated > 0) {
        // Create detailed result notification
        const resultMessage = data.resultsUpdated === 1 ? 
          'تم تحديث نتيجة صفقة واحدة 📊' : 
          `تم تحديث ${data.resultsUpdated} نتائج صفقات 📊`;
        toast.success(resultMessage, {
          duration: 4000,
          description: 'تحققوا من النتائج في القائمة أدناه'
        });
        // Refresh signals to show updated results
        refetch();
      }
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
    } finally {
      setFetching(false);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchTelegramMessages();

    // Set up interval to fetch every 3 seconds for better real-time updates
    const interval = setInterval(() => {
      fetchTelegramMessages();
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              التوصيات المباشرة
            </CardTitle>
            <CardDescription>
              آخر التوصيات من قناة تيليجرام
            </CardDescription>
          </div>
          <Button 
            onClick={fetchTelegramMessages} 
            disabled={fetching}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
            جلب الرسائل
          </Button>
        </div>
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
                        {format(new Date(signal.received_at), 'HH:mm:ss')}
                      </span>
                      {signal.entry_time && (
                        <span className="text-primary font-medium">
                          ⏰ الدخول: {signal.entry_time}
                        </span>
                      )}
                      <span>المبلغ: ${signal.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {/* Show result based on exact result value */}
                  {signal.status === "completed" && signal.result === "win" && (
                    <Badge 
                      variant="default"
                      className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      ✅ ربح
                    </Badge>
                  )}
                  {signal.status === "completed" && signal.result === "win1" && (
                    <Badge 
                      variant="default"
                      className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      ✅ ربح ¹
                    </Badge>
                  )}
                  {signal.status === "completed" && signal.result === "win2" && (
                    <Badge 
                      variant="default"
                      className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      ✅ ربح ²
                    </Badge>
                  )}
                  {signal.status === "completed" && signal.result === "loss" && (
                    <Badge 
                      variant="destructive"
                      className="gap-1 text-base px-3 py-1"
                    >
                      <XCircle className="h-4 w-4" />
                      ❌ خسارة
                    </Badge>
                  )}
                  
                  {/* Show executing status based on entry time and status */}
                  {!signal.result && (() => {
                    // Check if we're in execution window based on entry_time
                    const isInExecutionWindow = (() => {
                      if (!signal.entry_time) return false;
                      const parts = signal.entry_time.split(":").map(Number);
                      if (parts.length < 2) return false;
                      
                      const now = new Date();
                      const entryDateTime = new Date(now);
                      entryDateTime.setHours(parts[0], parts[1], parts[2] || 0, 0);
                      
                      const diffMin = (now.getTime() - entryDateTime.getTime()) / 60000;
                      return diffMin >= -1 && diffMin <= 5; // 1 min before to 5 min after
                    })();
                    
                    const shouldShowExecuting = signal.status === "executed" || 
                      (signal.status === "pending" && isInExecutionWindow);
                    
                    if (shouldShowExecuting) {
                      return (
                        <Badge 
                          variant="secondary"
                          className="gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          جاري التنفيذ...
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Show pending only when not in execution window and no result */}
                  {signal.status === "pending" && !signal.result && (() => {
                    if (!signal.entry_time) return (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        قيد الانتظار
                      </Badge>
                    );
                    
                    const parts = signal.entry_time.split(":").map(Number);
                    if (parts.length < 2) return null;
                    
                    const now = new Date();
                    const entryDateTime = new Date(now);
                    entryDateTime.setHours(parts[0], parts[1], parts[2] || 0, 0);
                    const diffMin = (now.getTime() - entryDateTime.getTime()) / 60000;
                    
                    // Show pending only if not yet in execution window
                    if (diffMin < -1) {
                      return (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          قيد الانتظار
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Finished (no result yet) after timeframe passes */}
                  {!signal.result && signal.entry_time && (() => {
                    const parts = signal.entry_time.split(":").map(Number);
                    if (parts.length < 2) return null;
                    const now = new Date();
                    const entryDateTime = new Date(now);
                    entryDateTime.setHours(parts[0], parts[1], parts[2] || 0, 0);
                    // Parse timeframe minutes
                    let tfMin = 1;
                    if (signal.timeframe) {
                      const tf = signal.timeframe.toUpperCase();
                      if (tf.startsWith('M')) tfMin = parseInt(tf.slice(1)) || 1;
                      else if (tf.startsWith('H')) tfMin = (parseInt(tf.slice(1)) || 1) * 60;
                    }
                    const endTime = new Date(entryDateTime.getTime() + (tfMin + 1) * 60000); // +1m buffer
                    if (now > endTime) {
                      return (
                        <Badge variant="outline" className="gap-1">
                          منتهية
                        </Badge>
                      );
                    }
                    return null;
                  })()}

                  {signal.status === "failed" && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      فشل التنفيذ
                    </Badge>
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
