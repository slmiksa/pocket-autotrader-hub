import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserTradeResults } from "@/hooks/useUserTradeResults";
interface LiveSignalsProps {
  autoTradeEnabled: boolean;
}
export const LiveSignals = ({
  autoTradeEnabled
}: LiveSignalsProps) => {
  const {
    signals,
    loading,
    refetch
  } = useSignals();
  const {
    saveUserResult,
    getUserResult
  } = useUserTradeResults();
  const [fetching, setFetching] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const fetchTelegramMessages = async () => {
    // Prevent concurrent requests
    if (isPolling) {
      console.log('Skipping fetch - previous request still in progress');
      return;
    }
    setIsPolling(true);
    setFetching(true);
    try {
      // Directly fetch from channel reader without webhook setup
      const {
        data: readerData
      } = await supabase.functions.invoke('telegram-channel-reader');
      if (readerData && (readerData.signalsFound > 0 || readerData.resultsUpdated > 0)) {
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

    // Set up aggressive polling to check for new Telegram messages every 3 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Use channel reader for direct message fetching
        const {
          data,
          error
        } = await supabase.functions.invoke('telegram-channel-reader');
        if (!error && data) {
          console.log('📡 Telegram poll result:', data);
          // If new signals were found, refetch to update UI
          if (data.signalsFound > 0 || data.resultsUpdated > 0) {
            refetch();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds for near-realtime updates

    return () => {
      clearInterval(pollInterval);
    };
  }, [refetch]);
  if (loading) {
    return <Card>
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
      </Card>;
  }
  return <>
    <Card className="w-full">
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              التوصيات المباشرة
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm"></CardDescription>
          </div>
          <Button onClick={fetchTelegramMessages} disabled={fetching} size="sm" variant="outline" className="gap-2 w-full sm:w-auto">
            <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
            <span className="text-xs sm:text-sm">جاري جلب الفرص</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <ScrollArea className="h-[400px] pr-2 sm:pr-4">
          {(() => {
            // Filter to show only recent signals (last 12 hours)
            const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
            const recentSignals = signals.filter(signal => new Date(signal.received_at).getTime() >= twelveHoursAgo);
            if (recentSignals.length === 0) {
              return <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">لا توجد توصيات حديثة</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    سيتم عرض التوصيات الجديدة تلقائياً عند وصولها
                  </p>
                </div>;
            }
            return <div className="space-y-3">
                {recentSignals.map(signal => <div key={signal.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg shrink-0", signal.direction === "CALL" ? "bg-success/20" : "bg-danger/20")}>
                    {signal.direction === "CALL" ? <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" /> : <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-danger" />}
                  </div>
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground text-sm sm:text-base">{signal.asset}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(signal.asset);
                          toast.success('تم نسخ اسم السوق');
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {signal.timeframe}
                      </Badge>
                      <Badge variant={signal.direction === "CALL" ? "default" : "destructive"} className={cn("text-xs", signal.direction === "CALL" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90")}>
                        {signal.direction}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(signal.received_at), 'HH:mm:ss')}
                      </span>
                      {signal.entry_time && <span className="text-primary font-medium">
                          ⏰ الدخول: {signal.entry_time}
                        </span>}
                      
                    </div>
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between w-full gap-2">
                  {/* Dynamic status calculation based on result and entry_time */}
                  <div className="flex items-center gap-2">
                  {(() => {
                      // Priority 1: Show result if it exists
                      if (signal.result === "win") {
                        return <Badge variant="default" className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1">
                          <CheckCircle2 className="h-4 w-4" />
                          ✅ ربح
                        </Badge>;
                      }
                      if (signal.result === "win1") {
                        return <Badge variant="default" className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1">
                          <CheckCircle2 className="h-4 w-4" />
                          ✅ ربح ¹
                        </Badge>;
                      }
                      if (signal.result === "win2") {
                        return <Badge variant="default" className="gap-1 bg-success hover:bg-success/90 text-base px-3 py-1">
                          <CheckCircle2 className="h-4 w-4" />
                          ✅ ربح ²
                        </Badge>;
                      }
                      if (signal.result === "loss") {
                        return <Badge variant="destructive" className="gap-1 text-base px-3 py-1">
                          <XCircle className="h-4 w-4" />
                          ❌ خسارة
                        </Badge>;
                      }

                      // Priority 2: No result - calculate status based on entry_time
                      if (!signal.entry_time) {
                        return <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          قيد الانتظار
                        </Badge>;
                      }
                      const parts = signal.entry_time.split(":").map(Number);
                      if (parts.length < 2) {
                        return <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          قيد الانتظار
                        </Badge>;
                      }
                      const now = new Date();
                      // Anchor entry time to the signal's received_at date to avoid day rollover issues
                      const baseDate = new Date(signal.received_at);
                      let entryDateTime = new Date(baseDate);
                      entryDateTime.setHours(parts[0], parts[1], parts[2] || 0, 0);

                      // If entry time appears to be for the next day (e.g., >6h after message time),
                      // it actually belongs to the previous day from the feed context – shift back one day
                      if (entryDateTime.getTime() - baseDate.getTime() > 6 * 60 * 60 * 1000) {
                        entryDateTime.setDate(entryDateTime.getDate() - 1);
                      }

                      // Parse timeframe to minutes
                      let tfMinutes = 1;
                      if (signal.timeframe) {
                        const tf = signal.timeframe.toUpperCase();
                        if (tf.startsWith('M')) tfMinutes = parseInt(tf.slice(1)) || 1;else if (tf.startsWith('H')) tfMinutes = (parseInt(tf.slice(1)) || 1) * 60;
                      }
                      const executionEndTime = new Date(entryDateTime.getTime() + tfMinutes * 60000);

                      // Before entry time → قيد الانتظار
                      if (now < entryDateTime) {
                        return <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          قيد الانتظار
                        </Badge>;
                      }

                      // During execution window (entry_time to entry_time + timeframe) → جاري التنفيذ
                      if (now >= entryDateTime && now <= executionEndTime) {
                        return <Badge variant="default" className="gap-1 bg-blue-500 hover:bg-blue-600 text-white">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          جاري التنفيذ...
                        </Badge>;
                      }

                      // After execution window without result → Show button to enter result
                      return null;
                    })()}

                  {signal.status === "failed"}
                  </div>
                  
                  {/* Show result button if trade is finished and no result yet */}
                  {(() => {
                    // Don't show button if user already entered result or official result exists
                    const userResult = getUserResult(signal.id);
                    if (userResult || signal.result) return null;
                    if (!signal.entry_time) return null;
                    const parts = signal.entry_time.split(":").map(Number);
                    if (parts.length < 2) return null;
                    const now = new Date();
                    const baseDate = new Date(signal.received_at);
                    let entryDateTime = new Date(baseDate);
                    entryDateTime.setHours(parts[0], parts[1], parts[2] || 0, 0);
                    if (entryDateTime.getTime() - baseDate.getTime() > 6 * 60 * 60 * 1000) {
                      entryDateTime.setDate(entryDateTime.getDate() - 1);
                    }
                    let tfMinutes = 1;
                    if (signal.timeframe) {
                      const tf = signal.timeframe.toUpperCase();
                      if (tf.startsWith('M')) tfMinutes = parseInt(tf.slice(1)) || 1;else if (tf.startsWith('H')) tfMinutes = (parseInt(tf.slice(1)) || 1) * 60;
                    }
                    const executionEndTime = new Date(entryDateTime.getTime() + tfMinutes * 60000);

                    // Only show button if trade has finished
                    if (now > executionEndTime) {
                      return <Button variant="outline" size="sm" onClick={() => setSelectedSignal(signal.id)} className="text-xs">
                        ما هي نتيجتك؟
                      </Button>;
                    }
                    return null;
                  })()}
                </div>
                </div>)}
              </div>;
          })()}
        </ScrollArea>
      </CardContent>
    </Card>

    {/* Result Selection Dialog */}
    <Dialog open={!!selectedSignal} onOpenChange={open => !open && setSelectedSignal(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ما هي نتيجة الصفقة؟</DialogTitle>
          <DialogDescription>
            اختر نتيجة الصفقة لتسجيلها في قسم صفقاتي
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button className="w-full bg-success hover:bg-success/90 text-white gap-2 py-6 text-lg" onClick={async () => {
            if (selectedSignal) {
              await saveUserResult(selectedSignal, 'win');
              setSelectedSignal(null);
            }
          }}>
            <CheckCircle2 className="h-5 w-5" />
            صفقة ناجحة ✅
          </Button>
          <Button variant="destructive" className="w-full gap-2 py-6 text-lg" onClick={async () => {
            if (selectedSignal) {
              await saveUserResult(selectedSignal, 'loss');
              setSelectedSignal(null);
            }
          }}>
            <XCircle className="h-5 w-5" />
            صفقة خاسرة ❌
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
};