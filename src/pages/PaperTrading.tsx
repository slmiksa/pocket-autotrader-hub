import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DisclaimerDialog } from "@/components/paper-trading/DisclaimerDialog";
import { useVirtualWallet } from "@/hooks/useVirtualWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, TrendingUp, TrendingDown, Wallet, Clock, 
  ChevronDown, History, Search, X, RefreshCw, 
  Trophy, Zap, ArrowUp, ArrowDown, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playTradeWinSound, playTradeLossSound } from "@/utils/soundNotification";

// Markets data
const markets = [
  { symbol: "FX:EURUSD", name: "EUR/USD", category: "forex", flag: "🇪🇺🇺🇸", pip: 0.0001 },
  { symbol: "FX:GBPUSD", name: "GBP/USD", category: "forex", flag: "🇬🇧🇺🇸", pip: 0.0001 },
  { symbol: "FX:USDJPY", name: "USD/JPY", category: "forex", flag: "🇺🇸🇯🇵", pip: 0.01 },
  { symbol: "FX:AUDUSD", name: "AUD/USD", category: "forex", flag: "🇦🇺🇺🇸", pip: 0.0001 },
  { symbol: "BINANCE:BTCUSDT", name: "BTC/USDT", category: "crypto", flag: "₿", pip: 1 },
  { symbol: "BINANCE:ETHUSDT", name: "ETH/USDT", category: "crypto", flag: "Ξ", pip: 0.1 },
  { symbol: "TVC:GOLD", name: "GOLD", category: "commodities", flag: "🥇", pip: 0.1 },
];

const timeframes = [
  { label: "30 ث", value: 30, seconds: 30 },
  { label: "1 د", value: 60, seconds: 60 },
  { label: "2 د", value: 120, seconds: 120 },
  { label: "5 د", value: 300, seconds: 300 },
];

interface ActiveTrade {
  id: string;
  direction: "buy" | "sell";
  entryPrice: number;
  amount: number;
  startTime: number;
  duration: number;
  symbol: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const PaperTrading = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(markets[0]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(0);
  const [amount, setAmount] = useState("100");
  const [selectedTime, setSelectedTime] = useState(60);
  const [marketSheetOpen, setMarketSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { wallet, trades, openTrade, closeTrade, resetWallet, refetch } = useVirtualWallet();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Generate realistic price movements
  const generatePrice = useCallback(() => {
    const basePrices: Record<string, number> = {
      "FX:EURUSD": 1.08500, "FX:GBPUSD": 1.26500, "FX:USDJPY": 149.500,
      "FX:AUDUSD": 0.65500, "BINANCE:BTCUSDT": 95000, "BINANCE:ETHUSDT": 3400,
      "TVC:GOLD": 2650,
    };
    
    if (currentPrice === 0) {
      const base = basePrices[selectedSymbol.symbol] || 100;
      setCurrentPrice(base);
      setPreviousPrice(base);
      return base;
    }

    // Simulate realistic tick movement
    const pip = selectedSymbol.pip;
    const movement = (Math.random() - 0.5) * pip * 5;
    const newPrice = currentPrice + movement;
    
    setPreviousPrice(currentPrice);
    setCurrentPrice(newPrice);
    
    // Update price history for chart
    setPriceHistory(prev => {
      const updated = [...prev, newPrice];
      return updated.slice(-200); // Keep last 200 prices
    });
    
    return newPrice;
  }, [currentPrice, selectedSymbol]);

  // Price ticker
  useEffect(() => {
    if (!disclaimerAccepted) return;
    
    // Initialize price
    const basePrices: Record<string, number> = {
      "FX:EURUSD": 1.08500, "FX:GBPUSD": 1.26500, "FX:USDJPY": 149.500,
      "FX:AUDUSD": 0.65500, "BINANCE:BTCUSDT": 95000, "BINANCE:ETHUSDT": 3400,
      "TVC:GOLD": 2650,
    };
    const initPrice = basePrices[selectedSymbol.symbol] || 100;
    setCurrentPrice(initPrice);
    setPreviousPrice(initPrice);
    setPriceHistory([initPrice]);
    
    const interval = setInterval(() => {
      generatePrice();
    }, 500);
    
    return () => clearInterval(interval);
  }, [disclaimerAccepted, selectedSymbol.symbol]);

  // Generate candles from price history
  useEffect(() => {
    if (priceHistory.length < 4) return;
    
    const candleSize = 8; // 8 ticks per candle
    const newCandles: CandleData[] = [];
    
    for (let i = 0; i < priceHistory.length; i += candleSize) {
      const slice = priceHistory.slice(i, i + candleSize);
      if (slice.length > 0) {
        newCandles.push({
          time: i,
          open: slice[0],
          high: Math.max(...slice),
          low: Math.min(...slice),
          close: slice[slice.length - 1],
        });
      }
    }
    
    setCandles(newCandles);
  }, [priceHistory]);

  // Draw custom chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;

    // Clear
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    for (let i = 0; i < width; i += 60) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Calculate price range
    const allPrices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices) - selectedSymbol.pip * 10;
    const maxPrice = Math.max(...allPrices) + selectedSymbol.pip * 10;
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = Math.max(4, (width - 80) / candles.length - 2);
    const startX = 40;

    // Draw candles
    candles.forEach((candle, i) => {
      const x = startX + i * (candleWidth + 2);
      const isGreen = candle.close >= candle.open;
      
      const openY = height - 60 - ((candle.open - minPrice) / priceRange) * (height - 100);
      const closeY = height - 60 - ((candle.close - minPrice) / priceRange) * (height - 100);
      const highY = height - 60 - ((candle.high - minPrice) / priceRange) * (height - 100);
      const lowY = height - 60 - ((candle.low - minPrice) / priceRange) * (height - 100);

      // Wick
      ctx.strokeStyle = isGreen ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = isGreen ? "#22c55e" : "#ef4444";
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 2;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    });

    // Current price line
    const currentY = height - 60 - ((currentPrice - minPrice) / priceRange) * (height - 100);
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(width - 75, currentY - 12, 70, 24);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(currentPrice.toFixed(selectedSymbol.pip < 0.01 ? 5 : 2), width - 40, currentY + 4);

    // Active trade visualization
    if (activeTrade) {
      const entryY = height - 60 - ((activeTrade.entryPrice - minPrice) / priceRange) * (height - 100);
      
      // Entry line
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(width - 80, entryY);
      ctx.stroke();

      // Entry price label
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(width - 75, entryY - 12, 70, 24);
      ctx.fillStyle = "#000";
      ctx.font = "bold 11px monospace";
      ctx.fillText(activeTrade.entryPrice.toFixed(selectedSymbol.pip < 0.01 ? 5 : 2), width - 40, entryY + 4);

      // Profit/Loss zone
      const isProfit = activeTrade.direction === "buy" 
        ? currentPrice > activeTrade.entryPrice 
        : currentPrice < activeTrade.entryPrice;
      
      ctx.fillStyle = isProfit ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";
      const zoneTop = Math.min(entryY, currentY);
      const zoneHeight = Math.abs(currentY - entryY);
      ctx.fillRect(startX, zoneTop, width - startX - 80, zoneHeight);

      // Entry marker
      ctx.fillStyle = activeTrade.direction === "buy" ? "#22c55e" : "#ef4444";
      ctx.beginPath();
      ctx.moveTo(startX + candles.length * (candleWidth + 2) - 20, entryY);
      if (activeTrade.direction === "buy") {
        ctx.lineTo(startX + candles.length * (candleWidth + 2) - 30, entryY + 15);
        ctx.lineTo(startX + candles.length * (candleWidth + 2) - 10, entryY + 15);
      } else {
        ctx.lineTo(startX + candles.length * (candleWidth + 2) - 30, entryY - 15);
        ctx.lineTo(startX + candles.length * (candleWidth + 2) - 10, entryY - 15);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Price scale on right
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i) / 5;
      const y = height - 60 - (i / 5) * (height - 100);
      ctx.fillText(price.toFixed(selectedSymbol.pip < 0.01 ? 5 : 2), width - 5, y + 3);
    }

  }, [candles, currentPrice, activeTrade, selectedSymbol]);

  // Trade countdown
  useEffect(() => {
    if (!activeTrade) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - activeTrade.startTime) / 1000;
      const remaining = Math.max(0, activeTrade.duration - elapsed);
      setCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        // Close trade
        finishTrade();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeTrade]);

  const finishTrade = async () => {
    if (!activeTrade || !wallet) return;

    const pnl = activeTrade.direction === "buy"
      ? (currentPrice - activeTrade.entryPrice) * (activeTrade.amount / activeTrade.entryPrice) * 100
      : (activeTrade.entryPrice - currentPrice) * (activeTrade.amount / activeTrade.entryPrice) * 100;

    const isWin = pnl > 0;
    
    // Play sound
    if (isWin) {
      playTradeWinSound();
    } else {
      playTradeLossSound();
    }

    // Update via hook
    const openTradesFromDb = trades.filter(t => t.status === "open");
    if (openTradesFromDb.length > 0) {
      await closeTrade(openTradesFromDb[0].id, currentPrice);
    }

    setActiveTrade(null);
    setCountdown(0);
    refetch();
  };

  // Handle trade
  const handleTrade = async (direction: "buy" | "sell") => {
    if (!wallet || activeTrade) return;
    
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0 || tradeAmount > wallet.balance) return;

    // Open trade in DB
    const success = await openTrade({
      symbol: selectedSymbol.symbol,
      symbol_name_ar: selectedSymbol.name,
      trade_type: direction,
      order_type: "market",
      amount: tradeAmount,
      entry_price: currentPrice,
    });

    if (success) {
      setActiveTrade({
        id: Date.now().toString(),
        direction,
        entryPrice: currentPrice,
        amount: tradeAmount,
        startTime: Date.now(),
        duration: selectedTime,
        symbol: selectedSymbol.symbol,
      });
      setCountdown(selectedTime);
    }
  };

  // Calculate live P&L
  const calculatePnL = () => {
    if (!activeTrade) return { pnl: 0, pnlPercent: 0 };
    
    const priceDiff = activeTrade.direction === "buy"
      ? currentPrice - activeTrade.entryPrice
      : activeTrade.entryPrice - currentPrice;
    
    const pnl = priceDiff * (activeTrade.amount / activeTrade.entryPrice) * 100;
    const pnlPercent = (pnl / activeTrade.amount) * 100;
    
    return { pnl, pnlPercent };
  };

  const { pnl, pnlPercent } = calculatePnL();
  const isProfit = pnl >= 0;

  const filteredMarkets = markets.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const winRate = wallet ? (wallet.total_trades > 0 ? (wallet.winning_trades / wallet.total_trades * 100).toFixed(0) : 0) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white overflow-hidden">
      <DisclaimerDialog onAccept={() => setDisclaimerAccepted(true)} />

      {disclaimerAccepted && (
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-[#0d1421] via-[#121a2d] to-[#0d1421] border-b border-cyan-500/20 px-3 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="h-9 w-9 rounded-xl bg-[#1a2235] border border-cyan-500/20 hover:bg-cyan-500/20"
              >
                <ArrowRight className="h-5 w-5 text-cyan-400" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-sm font-bold text-cyan-400">TIFUE TRADE</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-[#1a2235] rounded-lg px-3 py-1.5 border border-cyan-500/20 flex items-center gap-2">
                <Wallet className="h-3 w-3 text-cyan-400" />
                <span className="text-sm font-bold">${wallet?.balance.toFixed(2)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistorySheetOpen(true)}
                className="h-8 w-8 rounded-lg bg-[#1a2235] border border-cyan-500/20"
              >
                <History className="h-4 w-4 text-cyan-400" />
              </Button>
            </div>
          </header>

          {/* Symbol & Price Bar */}
          <div className="bg-[#0d1421] px-3 py-2 flex items-center gap-2 border-b border-white/5 shrink-0">
            <Sheet open={marketSheetOpen} onOpenChange={setMarketSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#1a2235] border-cyan-500/30 gap-1 h-8 px-2">
                  <span>{selectedSymbol.flag}</span>
                  <span className="font-bold text-xs">{selectedSymbol.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-[#0d1421] border-t border-cyan-500/20 h-[60vh] rounded-t-2xl">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">الأسواق</h3>
                    <Button variant="ghost" size="icon" onClick={() => setMarketSheetOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 bg-[#1a2235] border-cyan-500/20 h-9" />
                  </div>
                  <ScrollArea className="h-[40vh]">
                    <div className="space-y-1">
                      {filteredMarkets.map((market) => (
                        <button
                          key={market.symbol}
                          onClick={() => { setSelectedSymbol(market); setMarketSheetOpen(false); setCurrentPrice(0); setPriceHistory([]); }}
                          className={cn("w-full flex items-center gap-2 p-2 rounded-lg", selectedSymbol.symbol === market.symbol ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-[#1a2235] hover:bg-cyan-500/10")}
                        >
                          <span className="text-xl">{market.flag}</span>
                          <span className="font-medium text-sm">{market.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 flex items-center justify-center gap-2">
              <span className={cn("text-lg font-bold font-mono transition-colors", currentPrice > previousPrice ? "text-green-400" : currentPrice < previousPrice ? "text-red-400" : "text-white")}>
                {currentPrice.toFixed(selectedSymbol.pip < 0.01 ? 5 : 2)}
              </span>
              {currentPrice > previousPrice ? (
                <ArrowUp className="h-4 w-4 text-green-400 animate-bounce" />
              ) : currentPrice < previousPrice ? (
                <ArrowDown className="h-4 w-4 text-red-400 animate-bounce" />
              ) : null}
            </div>

            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
              <Trophy className="h-3 w-3 mr-1" />
              {winRate}%
            </Badge>
          </div>

          {/* Chart */}
          <div className="flex-1 relative min-h-0">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />

            {/* Active Trade Overlay */}
            {activeTrade && (
              <div className="absolute top-3 left-3 right-3 z-10">
                <div className={cn(
                  "rounded-xl p-3 border backdrop-blur-sm",
                  isProfit 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={activeTrade.direction === "buy" ? "bg-green-500" : "bg-red-500"}>
                        {activeTrade.direction === "buy" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {activeTrade.direction === "buy" ? "شراء" : "بيع"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">@ {activeTrade.entryPrice.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <span className="text-lg font-bold font-mono text-cyan-400">{countdown}s</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div 
                      className={cn("h-full transition-all", isProfit ? "bg-green-500" : "bg-red-500")}
                      style={{ width: `${((activeTrade.duration - countdown) / activeTrade.duration) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">الربح/الخسارة</span>
                    <span className={cn("text-xl font-bold", isProfit ? "text-green-400" : "text-red-400")}>
                      {isProfit ? "+" : ""}{pnl.toFixed(2)}$
                      <span className="text-sm ml-1">({pnlPercent.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trading Panel */}
          <div className="bg-gradient-to-t from-[#0d1421] to-transparent border-t border-cyan-500/10 p-3 shrink-0 space-y-3 pb-6">
            {/* Time Selection */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setSelectedTime(tf.value)}
                  disabled={!!activeTrade}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                    selectedTime === tf.value
                      ? "bg-cyan-500 text-white"
                      : "bg-[#1a2235] text-white/60 hover:bg-cyan-500/20",
                    activeTrade && "opacity-50"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!!activeTrade}
                className="bg-[#1a2235] border-cyan-500/20 h-12 text-lg font-bold flex-1"
                placeholder="المبلغ"
              />
              {[50, 100, 200].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  disabled={!!activeTrade}
                  className="px-3 py-2 rounded-lg bg-[#1a2235] text-xs hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleTrade("buy")}
                disabled={!!activeTrade || !amount || parseFloat(amount) > (wallet?.balance || 0)}
                className="h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-lg font-bold shadow-lg shadow-green-500/20"
              >
                <TrendingUp className="h-5 w-5 ml-2" />
                شراء ↑
              </Button>
              <Button
                onClick={() => handleTrade("sell")}
                disabled={!!activeTrade || !amount || parseFloat(amount) > (wallet?.balance || 0)}
                className="h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-lg font-bold shadow-lg shadow-red-500/20"
              >
                <TrendingDown className="h-5 w-5 ml-2" />
                بيع ↓
              </Button>
            </div>
          </div>

          {/* History Sheet */}
          <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
            <SheetContent side="right" className="bg-[#0d1421] border-l border-cyan-500/20 w-full sm:max-w-sm p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-cyan-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">السجل</h3>
                    <Button variant="ghost" size="sm" onClick={resetWallet} className="text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      إعادة
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#1a2235] rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-cyan-400">{wallet?.total_trades || 0}</p>
                      <p className="text-[10px] text-muted-foreground">إجمالي</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-400">{wallet?.winning_trades || 0}</p>
                      <p className="text-[10px] text-green-400/60">رابحة</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-red-400">{wallet?.losing_trades || 0}</p>
                      <p className="text-[10px] text-red-400/60">خاسرة</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {trades.filter(t => t.status === "closed").map((trade) => (
                      <div key={trade.id} className={cn("p-2 rounded-lg border text-sm", (trade.profit_loss || 0) > 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20")}>
                        <div className="flex justify-between mb-1">
                          <Badge variant={trade.trade_type === "buy" ? "default" : "destructive"} className="text-[10px]">
                            {trade.trade_type === "buy" ? "شراء" : "بيع"}
                          </Badge>
                          <span className={cn("font-bold", (trade.profit_loss || 0) > 0 ? "text-green-400" : "text-red-400")}>
                            {(trade.profit_loss || 0) > 0 ? "+" : ""}${(trade.profit_loss || 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.symbol_name_ar}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
};

export default PaperTrading;
