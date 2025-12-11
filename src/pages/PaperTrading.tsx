import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Wallet, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

interface Position {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  timestamp: Date;
}

interface ClosedTrade {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  profit: number;
  closedAt: Date;
}

const PaperTrading = () => {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('paperTradingBalance');
    return saved ? parseFloat(saved) : 10000;
  });
  const [amount, setAmount] = useState("100");
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('paperTradingPositions');
    return saved ? JSON.parse(saved) : [];
  });
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    const saved = localStorage.getItem('paperTradingHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const chartRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('paperTradingBalance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('paperTradingPositions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('paperTradingHistory', JSON.stringify(closedTrades));
  }, [closedTrades]);

  // Initialize TradingView chart
  useEffect(() => {
    if (!chartRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "FX:EURUSD",
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "ar",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"]
    });

    chartRef.current.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    container.style.height = '100%';
    container.style.width = '100%';
    chartRef.current.appendChild(container);
    container.appendChild(script);
  }, []);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.0005;
        return Math.max(0.5, prev + change);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const openPosition = (type: 'buy' | 'sell') => {
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast.error("أدخل مبلغ صحيح");
      return;
    }
    if (tradeAmount > balance) {
      toast.error("رصيد غير كافي");
      return;
    }

    const position: Position = {
      id: Date.now().toString(),
      type,
      entryPrice: currentPrice,
      amount: tradeAmount,
      timestamp: new Date()
    };

    setPositions(prev => [...prev, position]);
    setBalance(prev => prev - tradeAmount);
    toast.success(`تم فتح صفقة ${type === 'buy' ? 'شراء' : 'بيع'} بسعر ${currentPrice.toFixed(5)}`);
  };

  const closePosition = (position: Position) => {
    const priceDiff = position.type === 'buy' 
      ? currentPrice - position.entryPrice 
      : position.entryPrice - currentPrice;
    
    const pips = priceDiff * 10000;
    const profit = pips * (position.amount / 100);
    const totalReturn = position.amount + profit;

    const closedTrade: ClosedTrade = {
      id: position.id,
      type: position.type,
      entryPrice: position.entryPrice,
      exitPrice: currentPrice,
      amount: position.amount,
      profit,
      closedAt: new Date()
    };

    setClosedTrades(prev => [closedTrade, ...prev]);
    setPositions(prev => prev.filter(p => p.id !== position.id));
    setBalance(prev => prev + totalReturn);

    if (profit >= 0) {
      toast.success(`ربح: +$${profit.toFixed(2)}`);
    } else {
      toast.error(`خسارة: $${profit.toFixed(2)}`);
    }
  };

  const calculatePnL = useCallback((position: Position) => {
    const priceDiff = position.type === 'buy' 
      ? currentPrice - position.entryPrice 
      : position.entryPrice - currentPrice;
    const pips = priceDiff * 10000;
    return pips * (position.amount / 100);
  }, [currentPrice]);

  const resetAccount = () => {
    setBalance(10000);
    setPositions([]);
    setClosedTrades([]);
    localStorage.removeItem('paperTradingBalance');
    localStorage.removeItem('paperTradingPositions');
    localStorage.removeItem('paperTradingHistory');
    toast.success("تم إعادة ضبط الحساب");
  };

  const totalPnL = positions.reduce((sum, pos) => sum + calculatePnL(pos), 0);
  const equity = balance + positions.reduce((sum, pos) => sum + pos.amount + calculatePnL(pos), 0);

  return (
    <div className="min-h-screen bg-background pt-16 pb-4">
      <div className="container mx-auto px-2 space-y-3">
        {/* Header Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">الرصيد</p>
              <p className="text-lg font-bold text-primary">${balance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">الإكويتي</p>
              <p className="text-lg font-bold">${equity.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">الربح/الخسارة</p>
              <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-0">
            <div 
              ref={chartRef} 
              className="tradingview-widget-container h-[350px] w-full"
            />
          </CardContent>
        </Card>

        {/* Trading Panel */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">EUR/USD</CardTitle>
              <Badge variant="outline" className="text-lg font-mono">
                {currentPrice.toFixed(5)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="المبلغ"
                className="flex-1"
              />
              <div className="flex gap-1">
                {[50, 100, 250, 500].map(val => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(val.toString())}
                    className="text-xs px-2"
                  >
                    ${val}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => openPosition('buy')}
                className="bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <TrendingUp className="h-5 w-5 ml-2" />
                شراء
              </Button>
              <Button
                onClick={() => openPosition('sell')}
                className="bg-red-600 hover:bg-red-700 text-white h-12"
              >
                <TrendingDown className="h-5 w-5 ml-2" />
                بيع
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Open Positions */}
        {positions.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-base flex items-center gap-2">
                الصفقات المفتوحة
                <Badge variant="secondary">{positions.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {positions.map(pos => {
                  const pnl = calculatePnL(pos);
                  return (
                    <div 
                      key={pos.id}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        pnl >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={pos.type === 'buy' ? 'default' : 'destructive'}>
                          {pos.type === 'buy' ? 'شراء' : 'بيع'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">${pos.amount}</p>
                          <p className="text-xs text-muted-foreground">
                            دخول: {pos.entryPrice.toFixed(5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => closePosition(pos)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade History */}
        {closedTrades.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-base">سجل الصفقات</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {closedTrades.slice(0, 20).map(trade => (
                    <div 
                      key={trade.id}
                      className={`p-2 rounded border text-sm ${
                        trade.profit >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                          {trade.type === 'buy' ? 'شراء' : 'بيع'}
                        </Badge>
                        <span className={`font-bold ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{trade.entryPrice.toFixed(5)} → {trade.exitPrice.toFixed(5)}</span>
                        <span>${trade.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetAccount}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          إعادة ضبط الحساب
        </Button>
      </div>
    </div>
  );
};

export default PaperTrading;
