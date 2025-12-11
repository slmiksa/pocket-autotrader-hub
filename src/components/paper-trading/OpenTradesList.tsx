import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { VirtualTrade } from "@/hooks/useVirtualWallet";

interface OpenTradesListProps {
  trades: VirtualTrade[];
  currentPrices: Record<string, number>;
  onCloseTrade: (tradeId: string, exitPrice: number) => Promise<boolean>;
}

export const OpenTradesList = ({ trades, currentPrices, onCloseTrade }: OpenTradesListProps) => {
  const [closingId, setClosingId] = useState<string | null>(null);

  const openTrades = trades.filter(t => t.status === 'open' || t.status === 'pending');

  const calculatePnL = (trade: VirtualTrade, currentPrice: number) => {
    if (trade.trade_type === 'buy') {
      return (currentPrice - trade.entry_price) * trade.quantity;
    }
    return (trade.entry_price - currentPrice) * trade.quantity;
  };

  const handleClose = async (trade: VirtualTrade) => {
    const currentPrice = currentPrices[trade.symbol] || trade.entry_price;
    setClosingId(trade.id);
    await onCloseTrade(trade.id, currentPrice);
    setClosingId(null);
  };

  if (openTrades.length === 0) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">الصفقات المفتوحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>لا توجد صفقات مفتوحة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          الصفقات المفتوحة
          <Badge variant="secondary" className="text-xs">
            {openTrades.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {openTrades.map((trade) => {
            const currentPrice = currentPrices[trade.symbol] || trade.entry_price;
            const pnl = calculatePnL(trade, currentPrice);
            const pnlPercent = (pnl / trade.amount * 100).toFixed(2);

            return (
              <div
                key={trade.id}
                className="bg-background/50 p-3 rounded-lg border border-border/30"
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
                    {trade.status === 'pending' && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 ml-1" /> معلق
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleClose(trade)}
                    disabled={closingId === trade.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{trade.symbol_name_ar}</p>
                    <p className="text-xs text-muted-foreground">{trade.symbol}</p>
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}$
                    </p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}{pnlPercent}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="text-center bg-background/50 p-1 rounded">
                    <p className="text-muted-foreground">المبلغ</p>
                    <p className="font-semibold">${trade.amount}</p>
                  </div>
                  <div className="text-center bg-background/50 p-1 rounded">
                    <p className="text-muted-foreground">الدخول</p>
                    <p className="font-semibold">{trade.entry_price.toFixed(4)}</p>
                  </div>
                  <div className="text-center bg-background/50 p-1 rounded">
                    <p className="text-muted-foreground">الحالي</p>
                    <p className="font-semibold">{currentPrice.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
