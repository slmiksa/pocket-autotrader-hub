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
  ChevronDown, History, Settings, Search, Star,
  BarChart3, Zap, X, RefreshCw, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playTradeWinSound, playTradeLossSound } from "@/utils/soundNotification";

declare global {
  interface Window {
    TradingView: any;
  }
}

// Markets data
const markets = [
  { symbol: "FX:EURUSD", name: "EUR/USD", category: "forex", flag: "🇪🇺🇺🇸" },
  { symbol: "FX:GBPUSD", name: "GBP/USD", category: "forex", flag: "🇬🇧🇺🇸" },
  { symbol: "FX:USDJPY", name: "USD/JPY", category: "forex", flag: "🇺🇸🇯🇵" },
  { symbol: "FX:AUDUSD", name: "AUD/USD", category: "forex", flag: "🇦🇺🇺🇸" },
  { symbol: "FX:USDCAD", name: "USD/CAD", category: "forex", flag: "🇺🇸🇨🇦" },
  { symbol: "BINANCE:BTCUSDT", name: "BTC/USDT", category: "crypto", flag: "₿" },
  { symbol: "BINANCE:ETHUSDT", name: "ETH/USDT", category: "crypto", flag: "Ξ" },
  { symbol: "TVC:GOLD", name: "GOLD", category: "commodities", flag: "🥇" },
  { symbol: "TVC:SILVER", name: "SILVER", category: "commodities", flag: "🥈" },
  { symbol: "SP:SPX", name: "S&P 500", category: "indices", flag: "📊" },
  { symbol: "NASDAQ:AAPL", name: "Apple", category: "stocks", flag: "🍎" },
  { symbol: "NASDAQ:TSLA", name: "Tesla", category: "stocks", flag: "⚡" },
];

const timeframes = [
  { label: "30 ث", value: 30 },
  { label: "1 د", value: 60 },
  { label: "2 د", value: 120 },
  { label: "5 د", value: 300 },
  { label: "15 د", value: 900 },
];

const PaperTrading = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(markets[0]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [amount, setAmount] = useState("100");
  const [selectedTime, setSelectedTime] = useState(60);
  const [isTrading, setIsTrading] = useState(false);
  const [marketSheetOpen, setMarketSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

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

  // Generate mock prices
  const generatePrice = useCallback(() => {
    const basePrices: Record<string, number> = {
      "FX:EURUSD": 1.0850, "FX:GBPUSD": 1.2650, "FX:USDJPY": 149.50,
      "FX:AUDUSD": 0.6550, "FX:USDCAD": 1.3550,
      "BINANCE:BTCUSDT": 95000, "BINANCE:ETHUSDT": 3400,
      "TVC:GOLD": 2650, "TVC:SILVER": 31.50,
      "SP:SPX": 5950, "NASDAQ:AAPL": 195, "NASDAQ:TSLA": 380,
    };
    const base = basePrices[selectedSymbol.symbol] || 100;
    const variation = base * 0.0005;
    const newPrice = base + (Math.random() - 0.5) * variation;
    const change = ((newPrice - base) / base) * 100;
    setCurrentPrice(newPrice);
    setPriceChange(change);
  }, [selectedSymbol]);

  useEffect(() => {
    if (!disclaimerAccepted) return;
    generatePrice();
    const interval = setInterval(generatePrice, 1000);
    return () => clearInterval(interval);
  }, [disclaimerAccepted, generatePrice]);

  // Initialize TradingView widget
  useEffect(() => {
    if (!disclaimerAccepted || !chartContainerRef.current) return;

    const loadWidget = () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (e) {}
      }

      if (window.TradingView) {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: selectedSymbol.symbol,
          interval: "1",
          timezone: "Asia/Riyadh",
          theme: "dark",
          style: "1",
          locale: "ar",
          toolbar_bg: "#0d1421",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: "tv_chart_paper",
          backgroundColor: "#0d1421",
          gridColor: "rgba(255,255,255,0.03)",
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        });
      }
    };

    if (!window.TradingView) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = loadWidget;
      document.head.appendChild(script);
    } else {
      loadWidget();
    }

    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (e) {}
      }
    };
  }, [disclaimerAccepted, selectedSymbol.symbol]);

  // Handle trade
  const handleTrade = async (direction: "buy" | "sell") => {
    if (!wallet || isTrading) return;
    
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0 || tradeAmount > wallet.balance) return;

    setIsTrading(true);
    
    const success = await openTrade({
      symbol: selectedSymbol.symbol,
      symbol_name_ar: selectedSymbol.name,
      trade_type: direction,
      order_type: "market",
      amount: tradeAmount,
      entry_price: currentPrice,
    });

    if (success) {
      // Simulate trade result after selected time
      setTimeout(async () => {
        const latestTrades = trades;
        const openTrades = latestTrades.filter(t => t.status === "open");
        if (openTrades.length > 0) {
          const trade = openTrades[0];
          // Random outcome for demo (60% win rate)
          const isWin = Math.random() < 0.6;
          const exitPrice = direction === "buy" 
            ? (isWin ? currentPrice * 1.001 : currentPrice * 0.999)
            : (isWin ? currentPrice * 0.999 : currentPrice * 1.001);
          
          await closeTrade(trade.id, exitPrice);
        }
        setIsTrading(false);
        refetch();
      }, selectedTime * 1000);
    } else {
      setIsTrading(false);
    }
  };

  const filteredMarkets = markets.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openTrades = trades.filter(t => t.status === "open");
  const closedTrades = trades.filter(t => t.status === "closed");
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
          <header className="bg-gradient-to-r from-[#0d1421] via-[#121a2d] to-[#0d1421] border-b border-cyan-500/10 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  TIFUE TRADE
                </h1>
                <p className="text-[10px] text-cyan-500/60">Paper Trading</p>
              </div>
            </div>

            {/* Wallet */}
            <div className="flex items-center gap-2">
              <div className="bg-[#1a2235] rounded-xl px-4 py-2 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">
                    ${wallet?.balance.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistorySheetOpen(true)}
                className="h-10 w-10 rounded-xl bg-[#1a2235] border border-cyan-500/20 hover:bg-cyan-500/10"
              >
                <History className="h-4 w-4 text-cyan-400" />
              </Button>
            </div>
          </header>

          {/* Symbol Selector */}
          <div className="bg-[#0d1421] px-4 py-2 flex items-center gap-3 border-b border-white/5 shrink-0">
            <Sheet open={marketSheetOpen} onOpenChange={setMarketSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-[#1a2235] border-cyan-500/30 hover:bg-cyan-500/10 gap-2 px-4 py-5 rounded-xl"
                >
                  <span className="text-lg">{selectedSymbol.flag}</span>
                  <span className="font-bold">{selectedSymbol.name}</span>
                  <ChevronDown className="h-4 w-4 text-cyan-400" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-[#0d1421] border-t border-cyan-500/20 h-[70vh] rounded-t-3xl">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">اختر السوق</h3>
                    <Button variant="ghost" size="icon" onClick={() => setMarketSheetOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 bg-[#1a2235] border-cyan-500/20"
                    />
                  </div>
                  <ScrollArea className="h-[45vh]">
                    <div className="space-y-2">
                      {filteredMarkets.map((market) => (
                        <button
                          key={market.symbol}
                          onClick={() => {
                            setSelectedSymbol(market);
                            setMarketSheetOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                            selectedSymbol.symbol === market.symbol
                              ? "bg-cyan-500/20 border border-cyan-500/50"
                              : "bg-[#1a2235] border border-transparent hover:border-cyan-500/30"
                          )}
                        >
                          <span className="text-2xl">{market.flag}</span>
                          <div className="text-right flex-1">
                            <p className="font-bold">{market.name}</p>
                            <p className="text-xs text-muted-foreground">{market.category}</p>
                          </div>
                          {selectedSymbol.symbol === market.symbol && (
                            <Star className="h-4 w-4 text-cyan-400 fill-cyan-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            {/* Price Display */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-white">
                  {currentPrice.toFixed(currentPrice < 10 ? 5 : 2)}
                </span>
                <Badge 
                  className={cn(
                    "text-xs",
                    priceChange >= 0 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  )}
                >
                  {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(3)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 relative min-h-0">
            <div 
              id="tv_chart_paper" 
              ref={chartContainerRef}
              className="absolute inset-0"
            />
            
            {/* Trading Indicator Overlay */}
            {isTrading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-[#1a2235] rounded-2xl p-6 border border-cyan-500/30 text-center animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mx-auto mb-3" />
                  <p className="text-lg font-bold">صفقة جارية...</p>
                  <p className="text-sm text-muted-foreground">انتظر {selectedTime} ثانية</p>
                </div>
              </div>
            )}

            {/* Open Trades Badge */}
            {openTrades.length > 0 && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse">
                  {openTrades.length} صفقة مفتوحة
                </Badge>
              </div>
            )}
          </div>

          {/* Trading Panel */}
          <div className="bg-gradient-to-t from-[#0d1421] via-[#121a2d] to-[#0d1421] border-t border-cyan-500/10 p-4 shrink-0 space-y-4 pb-8">
            {/* Stats Bar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-green-400">
                <Trophy className="h-3 w-3" />
                <span>نسبة الفوز: {winRate}%</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-green-400">رابح: {wallet?.winning_trades || 0}</span>
                <span className="text-red-400">خاسر: {wallet?.losing_trades || 0}</span>
              </div>
            </div>

            {/* Time Selection */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTime(tf.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                      selectedTime === tf.value
                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                        : "bg-[#1a2235] text-white/60 hover:bg-cyan-500/20"
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#1a2235] border-cyan-500/20 text-lg font-bold h-14 pr-12 rounded-xl"
                  placeholder="المبلغ"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">$</span>
              </div>
              <div className="flex gap-2">
                {[50, 100, 250].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="px-3 py-2 rounded-lg bg-[#1a2235] text-xs font-medium text-white/60 hover:bg-cyan-500/20 transition-all"
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleTrade("buy")}
                disabled={isTrading || !amount || parseFloat(amount) > (wallet?.balance || 0)}
                className="h-16 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-lg font-bold shadow-lg shadow-green-500/30 disabled:opacity-50"
              >
                <TrendingUp className="h-6 w-6 ml-2" />
                شراء
              </Button>
              <Button
                onClick={() => handleTrade("sell")}
                disabled={isTrading || !amount || parseFloat(amount) > (wallet?.balance || 0)}
                className="h-16 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-lg font-bold shadow-lg shadow-red-500/30 disabled:opacity-50"
              >
                <TrendingDown className="h-6 w-6 ml-2" />
                بيع
              </Button>
            </div>
          </div>

          {/* History Sheet */}
          <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
            <SheetContent side="right" className="bg-[#0d1421] border-l border-cyan-500/20 w-full sm:max-w-md p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">سجل الصفقات</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetWallet}
                        className="text-xs text-muted-foreground"
                      >
                        <RefreshCw className="h-3 w-3 ml-1" />
                        إعادة تعيين
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-[#1a2235] rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-cyan-400">{wallet?.total_trades || 0}</p>
                      <p className="text-xs text-muted-foreground">إجمالي</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-green-400">{wallet?.winning_trades || 0}</p>
                      <p className="text-xs text-green-400/60">رابحة</p>
                    </div>
                    <div className="bg-red-500/10 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-red-400">{wallet?.losing_trades || 0}</p>
                      <p className="text-xs text-red-400/60">خاسرة</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {closedTrades.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>لا توجد صفقات مغلقة</p>
                      </div>
                    ) : (
                      closedTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className={cn(
                            "p-3 rounded-xl border",
                            (trade.profit_loss || 0) > 0
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-red-500/5 border-red-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={trade.trade_type === "buy" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {trade.trade_type === "buy" ? "شراء" : "بيع"}
                              </Badge>
                              <span className="text-sm font-medium">{trade.symbol_name_ar}</span>
                            </div>
                            <span className={cn(
                              "font-bold",
                              (trade.profit_loss || 0) > 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {(trade.profit_loss || 0) > 0 ? "+" : ""}
                              ${(trade.profit_loss || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>دخول: {trade.entry_price.toFixed(4)}</span>
                            <span>خروج: {trade.exit_price?.toFixed(4)}</span>
                          </div>
                        </div>
                      ))
                    )}
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
