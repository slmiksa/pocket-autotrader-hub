import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";
export const TradeHistory = () => {
  const {
    signals,
    loading
  } = useSignals();
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>سجل الصفقات</CardTitle>
          <CardDescription>تاريخ جميع الصفقات والنتائج</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>;
  }

  // Show only signals with results (completed trades)
  const completedTrades = signals.filter(signal => signal.result);
  const wins = completedTrades.filter(signal => signal.result?.startsWith('win')).length;
  const losses = completedTrades.filter(signal => signal.result === 'loss').length;
  const winRate = wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0;
  return;
};