import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradePanelProps {
  selectedSymbol: { symbol: string; name: string; price: number } | null;
  walletBalance: number;
  onOpenTrade: (trade: {
    symbol: string;
    symbol_name_ar: string;
    trade_type: 'buy' | 'sell';
    order_type: 'market' | 'limit' | 'stop';
    amount: number;
    entry_price: number;
    stop_loss?: number;
    take_profit?: number;
  }) => Promise<boolean>;
}

export const TradePanel = ({ selectedSymbol, walletBalance, onOpenTrade }: TradePanelProps) => {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrade = async (tradeType: 'buy' | 'sell') => {
    if (!selectedSymbol || !amount) return;
    
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) return;

    setIsSubmitting(true);
    
    const entryPrice = orderType === 'market' 
      ? selectedSymbol.price 
      : parseFloat(limitPrice) || selectedSymbol.price;

    await onOpenTrade({
      symbol: selectedSymbol.symbol,
      symbol_name_ar: selectedSymbol.name,
      trade_type: tradeType,
      order_type: orderType,
      amount: tradeAmount,
      entry_price: entryPrice,
      stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
      take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    setIsSubmitting(false);
    setAmount("");
    setLimitPrice("");
    setStopLoss("");
    setTakeProfit("");
  };

  const quickAmounts = [50, 100, 250, 500];

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">فتح صفقة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedSymbol ? (
          <>
            {/* Selected Symbol Info */}
            <div className="bg-background/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">الأصل المحدد</p>
              <p className="font-semibold">{selectedSymbol.name}</p>
              <p className="text-lg font-bold text-primary">
                ${selectedSymbol.price.toFixed(selectedSymbol.price < 10 ? 5 : 2)}
              </p>
            </div>

            {/* Order Type */}
            <div>
              <Label className="text-sm mb-2 block">نوع الأمر</Label>
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="market">سوق</TabsTrigger>
                  <TabsTrigger value="limit">محدد</TabsTrigger>
                  <TabsTrigger value="stop">إيقاف</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Limit/Stop Price */}
            {orderType !== 'market' && (
              <div>
                <Label className="text-sm mb-2 block">
                  {orderType === 'limit' ? 'سعر الدخول المحدد' : 'سعر الإيقاف'}
                </Label>
                <Input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={selectedSymbol.price.toString()}
                  step="0.01"
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <Label className="text-sm mb-2 block">المبلغ ($)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                min="1"
                max={walletBalance}
              />
              <div className="flex gap-2 mt-2">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(qa.toString())}
                    disabled={qa > walletBalance}
                    className="flex-1 text-xs"
                  >
                    ${qa}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                المتاح: ${walletBalance.toFixed(2)}
              </p>
            </div>

            {/* Stop Loss & Take Profit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">وقف الخسارة</Label>
                <Input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="اختياري"
                  step="0.01"
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">جني الأرباح</Label>
                <Input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="اختياري"
                  step="0.01"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handleTrade('buy')}
                disabled={!amount || isSubmitting || parseFloat(amount) > walletBalance}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <TrendingUp className="h-4 w-4 ml-2" />
                شراء
              </Button>
              <Button
                onClick={() => handleTrade('sell')}
                disabled={!amount || isSubmitting || parseFloat(amount) > walletBalance}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <TrendingDown className="h-4 w-4 ml-2" />
                بيع
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>اختر أصل من القائمة للبدء</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
