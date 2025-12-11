import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { VirtualTrade } from "@/hooks/useVirtualWallet";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TradeHistoryProps {
  trades: VirtualTrade[];
}

export const TradeHistory = ({ trades }: TradeHistoryProps) => {
  const closedTrades = trades.filter(t => t.status === 'closed');

  if (closedTrades.length === 0) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">سجل الصفقات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>لا توجد صفقات مغلقة بعد</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          سجل الصفقات
          <Badge variant="secondary" className="text-xs">
            {closedTrades.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            {closedTrades.map((trade) => {
              const isWin = (trade.profit_loss || 0) > 0;

              return (
                <div
                  key={trade.id}
                  className={`p-3 rounded-lg border ${
                    isWin 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={trade.trade_type === 'buy' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {trade.trade_type === 'buy' ? (
                          <><TrendingUp className="h-3 w-3 ml-1" /> شراء</>
                        ) : (
                          <><TrendingDown className="h-3 w-3 ml-1" /> بيع</>
                        )}
                      </Badge>
                      {isWin ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className={`font-bold text-sm ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                      {isWin ? '+' : ''}{(trade.profit_loss || 0).toFixed(2)}$
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{trade.symbol_name_ar}</p>
                      <p className="text-xs text-muted-foreground">{trade.symbol}</p>
                    </div>
                    <div className="text-left text-xs text-muted-foreground">
                      {trade.closed_at && format(new Date(trade.closed_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div className="text-center">
                      <p className="text-muted-foreground">الدخول</p>
                      <p className="font-semibold">{trade.entry_price.toFixed(4)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">الخروج</p>
                      <p className="font-semibold">{trade.exit_price?.toFixed(4) || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">المبلغ</p>
                      <p className="font-semibold">${trade.amount}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
