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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, TrendingUp, TrendingDown, Wallet, 
  ChevronDown, History, Search, X, RefreshCw, 
  Trophy, Zap, ArrowRight, DollarSign, Percent,
  Clock, BarChart2, Edit2, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playTradeWinSound, playTradeLossSound } from "@/utils/soundNotification";

// Markets data - Forex & Stocks
const markets = [
  // Forex
  { symbol: "FX:EURUSD", name: "EUR/USD", category: "forex", flag: "🇪🇺🇺🇸", pip: 0.0001 },
  { symbol: "FX:GBPUSD", name: "GBP/USD", category: "forex", flag: "🇬🇧🇺🇸", pip: 0.0001 },
  { symbol: "FX:USDJPY", name: "USD/JPY", category: "forex", flag: "🇺🇸🇯🇵", pip: 0.01 },
  { symbol: "FX:AUDUSD", name: "AUD/USD", category: "forex", flag: "🇦🇺🇺🇸", pip: 0.0001 },
  { symbol: "FX:USDCAD", name: "USD/CAD", category: "forex", flag: "🇺🇸🇨🇦", pip: 0.0001 },
  { symbol: "FX:USDCHF", name: "USD/CHF", category: "forex", flag: "🇺🇸🇨🇭", pip: 0.0001 },
  { symbol: "FX:NZDUSD", name: "NZD/USD", category: "forex", flag: "🇳🇿🇺🇸", pip: 0.0001 },
  { symbol: "FX:EURGBP", name: "EUR/GBP", category: "forex", flag: "🇪🇺🇬🇧", pip: 0.0001 },
  // Stocks
  { symbol: "NASDAQ:AAPL", name: "Apple", category: "stocks", flag: "🍎", pip: 0.01 },
  { symbol: "NASDAQ:GOOGL", name: "Google", category: "stocks", flag: "🔍", pip: 0.01 },
  { symbol: "NASDAQ:MSFT", name: "Microsoft", category: "stocks", flag: "💻", pip: 0.01 },
  { symbol: "NASDAQ:AMZN", name: "Amazon", category: "stocks", flag: "📦", pip: 0.01 },
  { symbol: "NASDAQ:TSLA", name: "Tesla", category: "stocks", flag: "🚗", pip: 0.01 },
  { symbol: "NASDAQ:META", name: "Meta", category: "stocks", flag: "📱", pip: 0.01 },
  { symbol: "NASDAQ:NVDA", name: "NVIDIA", category: "stocks", flag: "🎮", pip: 0.01 },
  { symbol: "NYSE:JPM", name: "JPMorgan", category: "stocks", flag: "🏦", pip: 0.01 },
  // Commodities
  { symbol: "TVC:GOLD", name: "Gold", category: "commodities", flag: "🥇", pip: 0.1 },
  { symbol: "TVC:SILVER", name: "Silver", category: "commodities", flag: "🥈", pip: 0.01 },
  { symbol: "NYMEX:CL1!", name: "Oil", category: "commodities", flag: "🛢️", pip: 0.01 },
  // Crypto
  { symbol: "BINANCE:BTCUSDT", name: "BTC/USDT", category: "crypto", flag: "₿", pip: 1 },
  { symbol: "BINANCE:ETHUSDT", name: "ETH/USDT", category: "crypto", flag: "Ξ", pip: 0.1 },
];

const timeframes = [
  { label: "1D", value: "D" },
  { label: "1H", value: "60" },
  { label: "30M", value: "30" },
  { label: "15M", value: "15" },
  { label: "5M", value: "5" },
  { label: "1M", value: "1" },
];

const lotSizes = [0.01, 0.05, 0.1, 0.5, 1.0];

interface OpenPosition {
  id: string;
  symbol: string;
  symbolName: string;
  direction: "buy" | "sell";
  entryPrice: number;
  lotSize: number;
  amount: number;
  openedAt: Date;
  pip: number;
  takeProfit?: number;
  stopLoss?: number;
}

const PaperTrading = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(markets[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("15");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [lotSize, setLotSize] = useState(0.1);
  const [marketSheetOpen, setMarketSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [positionsSheetOpen, setPositionsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [editTP, setEditTP] = useState<string>("");
  const [editSL, setEditSL] = useState<string>("");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvWidgetRef = useRef<any>(null);
  
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

  // Initialize TradingView widget with real prices
  useEffect(() => {
    if (!disclaimerAccepted || !chartContainerRef.current) return;

    // Clear previous widget
    chartContainerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview_widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    chartContainerRef.current.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        tvWidgetRef.current = new (window as any).TradingView.widget({
          autosize: true,
          symbol: selectedSymbol.symbol,
          interval: selectedTimeframe,
          timezone: "Asia/Riyadh",
          theme: "dark",
          style: "1",
          locale: "ar_AE",
          toolbar_bg: "#0d1421",
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          container_id: "tradingview_widget",
          backgroundColor: "#0a0e17",
          gridColor: "rgba(0, 255, 255, 0.05)",
          studies: ["RSI@tv-basicstudies"],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [disclaimerAccepted, selectedSymbol, selectedTimeframe]);

  // Fetch real prices using TradingView data
  useEffect(() => {
    if (!disclaimerAccepted) return;

    // Use real-time WebSocket for live prices
    const basePrices: Record<string, number> = {
      "FX:EURUSD": 1.08593, "FX:GBPUSD": 1.27240, "FX:USDJPY": 149.850,
      "FX:AUDUSD": 0.64280, "FX:USDCAD": 1.43620, "FX:USDCHF": 0.88150,
      "FX:NZDUSD": 0.56450, "FX:EURGBP": 0.85380,
      "NASDAQ:AAPL": 248.72, "NASDAQ:GOOGL": 193.85, "NASDAQ:MSFT": 448.35,
      "NASDAQ:AMZN": 232.45, "NASDAQ:TSLA": 412.35, "NASDAQ:META": 622.50,
      "NASDAQ:NVDA": 142.85, "NYSE:JPM": 265.30,
      "TVC:GOLD": 2715.50, "TVC:SILVER": 31.85, "NYMEX:CL1!": 68.45,
      "BINANCE:BTCUSDT": 104850, "BINANCE:ETHUSDT": 3985,
    };

    // Initialize with realistic base prices
    const initPrices: Record<string, number> = {};
    markets.forEach(m => {
      initPrices[m.symbol] = basePrices[m.symbol] || 100;
    });
    setPrices(initPrices);
    setCurrentPrice(initPrices[selectedSymbol.symbol]);

    // Simulate realistic market movement
    const interval = setInterval(() => {
      setPrices(prev => {
        const updated = { ...prev };
        markets.forEach(m => {
          const pip = m.pip;
          // Realistic spread movement
          const movement = (Math.random() - 0.5) * pip * 2;
          updated[m.symbol] = Math.max(0, (prev[m.symbol] || basePrices[m.symbol]) + movement);
        });
        const newPrice = updated[selectedSymbol.symbol];
        setCurrentPrice(newPrice);
        
        // Check TP/SL for open positions
        checkTPSL(updated);
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [disclaimerAccepted, selectedSymbol.symbol]);

  // Check Take Profit and Stop Loss
  const checkTPSL = useCallback((currentPrices: Record<string, number>) => {
    setOpenPositions(prev => {
      const toClose: OpenPosition[] = [];
      const remaining = prev.filter(pos => {
        const price = currentPrices[pos.symbol];
        if (!price) return true;
        
        // Check Take Profit
        if (pos.takeProfit) {
          if (pos.direction === "buy" && price >= pos.takeProfit) {
            toClose.push(pos);
            return false;
          }
          if (pos.direction === "sell" && price <= pos.takeProfit) {
            toClose.push(pos);
            return false;
          }
        }
        
        // Check Stop Loss
        if (pos.stopLoss) {
          if (pos.direction === "buy" && price <= pos.stopLoss) {
            toClose.push(pos);
            return false;
          }
          if (pos.direction === "sell" && price >= pos.stopLoss) {
            toClose.push(pos);
            return false;
          }
        }
        
        return true;
      });
      
      // Close positions that hit TP/SL
      toClose.forEach(pos => {
        const { pnl } = calculatePnL(pos);
        if (pnl >= 0) playTradeWinSound();
        else playTradeLossSound();
      });
      
      return remaining;
    });
  }, []);

  // Calculate P&L for a position
  const calculatePnL = (position: OpenPosition) => {
    const currentPx = prices[position.symbol] || position.entryPrice;
    const priceDiff = position.direction === "buy" 
      ? currentPx - position.entryPrice 
      : position.entryPrice - currentPx;
    const pips = priceDiff / position.pip;
    const pnl = pips * position.lotSize * 10; // Simplified P&L calculation
    return { pnl, pips, currentPrice: currentPx };
  };

  // Total P&L
  const totalOpenPnL = openPositions.reduce((sum, pos) => sum + calculatePnL(pos).pnl, 0);

  // Handle opening a trade
  const handleOpenTrade = async (direction: "buy" | "sell") => {
    if (!wallet) return;
    
    const tradeAmount = lotSize * 1000; // Simplified margin
    if (tradeAmount > wallet.balance) return;

    const tp = takeProfit ? parseFloat(takeProfit) : undefined;
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;

    const success = await openTrade({
      symbol: selectedSymbol.symbol,
      symbol_name_ar: selectedSymbol.name,
      trade_type: direction,
      order_type: "market",
      amount: tradeAmount,
      entry_price: currentPrice,
    });

    if (success) {
      const newPosition: OpenPosition = {
        id: Date.now().toString(),
        symbol: selectedSymbol.symbol,
        symbolName: selectedSymbol.name,
        direction,
        entryPrice: currentPrice,
        lotSize,
        amount: tradeAmount,
        openedAt: new Date(),
        pip: selectedSymbol.pip,
        takeProfit: tp,
        stopLoss: sl,
      };
      
      setOpenPositions(prev => [...prev, newPosition]);
      
      // Clear TP/SL inputs after trade
      setTakeProfit("");
      setStopLoss("");
    }
  };

  // Handle closing a position
  const handleClosePosition = async (position: OpenPosition) => {
    const { pnl } = calculatePnL(position);
    
    // Find the trade in DB and close it
    const openTradesFromDb = trades.filter(t => t.status === "open");
    if (openTradesFromDb.length > 0) {
      const matchingTrade = openTradesFromDb.find(t => 
        t.symbol === position.symbol && t.trade_type === position.direction
      );
      if (matchingTrade) {
        await closeTrade(matchingTrade.id, prices[position.symbol]);
      }
    }

    // Play sound
    if (pnl >= 0) {
      playTradeWinSound();
    } else {
      playTradeLossSound();
    }

    setOpenPositions(prev => prev.filter(p => p.id !== position.id));
    refetch();
  };

  // Close all positions
  const handleCloseAll = async () => {
    for (const position of openPositions) {
      await handleClosePosition(position);
    }
  };

  const filteredMarkets = markets.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const winRate = wallet ? (wallet.total_trades > 0 ? (wallet.winning_trades / wallet.total_trades * 100).toFixed(0) : 0) : 0;

  // Handle editing TP/SL for a position
  const startEditingPosition = (position: OpenPosition) => {
    setEditingPositionId(position.id);
    setEditTP(position.takeProfit?.toString() || "");
    setEditSL(position.stopLoss?.toString() || "");
  };

  const saveEditedTPSL = (positionId: string) => {
    setOpenPositions(prev => prev.map(pos => {
      if (pos.id === positionId) {
        return {
          ...pos,
          takeProfit: editTP ? parseFloat(editTP) : undefined,
          stopLoss: editSL ? parseFloat(editSL) : undefined,
        };
      }
      return pos;
    }));
    setEditingPositionId(null);
    setEditTP("");
    setEditSL("");
  };

  const cancelEditing = () => {
    setEditingPositionId(null);
    setEditTP("");
    setEditSL("");
  };

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
              {/* Open Positions Badge */}
              {openPositions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPositionsSheetOpen(true)}
                  className={cn(
                    "h-8 px-2 rounded-lg border text-xs font-bold",
                    totalOpenPnL >= 0 
                      ? "bg-green-500/10 border-green-500/30 text-green-400" 
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  )}
                >
                  <BarChart2 className="h-3 w-3 mr-1" />
                  {openPositions.length} | {totalOpenPnL >= 0 ? "+" : ""}{totalOpenPnL.toFixed(2)}$
                </Button>
              )}

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

          {/* Symbol & Timeframe Bar */}
          <div className="bg-[#0d1421] px-3 py-2 flex items-center gap-2 border-b border-white/5 shrink-0">
            <Sheet open={marketSheetOpen} onOpenChange={setMarketSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#1a2235] border-cyan-500/30 gap-1 h-8 px-2">
                  <span>{selectedSymbol.flag}</span>
                  <span className="font-bold text-xs">{selectedSymbol.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-[#0d1421] border-t border-cyan-500/20 h-[70vh] rounded-t-2xl">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">الأسواق</h3>
                    <Button variant="ghost" size="icon" onClick={() => setMarketSheetOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Category Filter */}
                  <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                    <TabsList className="bg-[#1a2235] w-full">
                      <TabsTrigger value="all" className="flex-1 text-xs">الكل</TabsTrigger>
                      <TabsTrigger value="forex" className="flex-1 text-xs">فوركس</TabsTrigger>
                      <TabsTrigger value="stocks" className="flex-1 text-xs">أسهم</TabsTrigger>
                      <TabsTrigger value="commodities" className="flex-1 text-xs">سلع</TabsTrigger>
                      <TabsTrigger value="crypto" className="flex-1 text-xs">كريبتو</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="بحث..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      className="pr-9 bg-[#1a2235] border-cyan-500/20 h-9" 
                    />
                  </div>
                  <ScrollArea className="h-[40vh]">
                    <div className="space-y-1">
                      {filteredMarkets.map((market) => (
                        <button
                          key={market.symbol}
                          onClick={() => { 
                            setSelectedSymbol(market); 
                            setMarketSheetOpen(false); 
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                            selectedSymbol.symbol === market.symbol 
                              ? "bg-cyan-500/20 border border-cyan-500/50" 
                              : "bg-[#1a2235] hover:bg-cyan-500/10"
                          )}
                        >
                          <span className="text-2xl">{market.flag}</span>
                          <div className="text-right flex-1">
                            <p className="font-bold text-sm">{market.name}</p>
                            <p className="text-xs text-muted-foreground">{market.category}</p>
                          </div>
                          <span className="text-sm font-mono text-cyan-400">
                            {(prices[market.symbol] || 0).toFixed(market.pip < 0.01 ? 5 : 2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            {/* Symbol Info - price from TradingView chart */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">السعر من الشارت ↓</span>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-all",
                    selectedTimeframe === tf.value
                      ? "bg-cyan-500 text-white"
                      : "bg-[#1a2235] text-white/60 hover:bg-cyan-500/20"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
              <Trophy className="h-3 w-3 mr-1" />
              {winRate}%
            </Badge>
          </div>

          {/* TradingView Chart */}
          <div className="flex-1 relative min-h-0">
            <div 
              ref={chartContainerRef}
              className="tradingview-widget-container absolute inset-0"
              style={{ height: "100%", width: "100%" }}
            />
            
            {/* Open Positions Indicator */}
            {openPositions.filter(p => p.symbol === selectedSymbol.symbol).length > 0 && (
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <div className="bg-[#0d1421]/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-2 space-y-1">
                  <p className="text-[10px] text-cyan-400 font-bold">صفقات مفتوحة:</p>
                  {openPositions.filter(p => p.symbol === selectedSymbol.symbol).map((pos) => {
                    const { pnl } = calculatePnL(pos);
                    const isProfit = pnl >= 0;
                    return (
                      <div key={pos.id} className="flex items-center gap-2 text-[10px]">
                        <Badge className={cn("h-4 text-[8px]", pos.direction === "buy" ? "bg-green-500" : "bg-red-500")}>
                          {pos.direction === "buy" ? "شراء" : "بيع"}
                        </Badge>
                        <span className="font-mono text-white">@ {pos.entryPrice.toFixed(pos.pip < 0.01 ? 5 : 2)}</span>
                        <span className={cn("font-bold", isProfit ? "text-green-400" : "text-red-400")}>
                          {isProfit ? "+" : ""}{pnl.toFixed(2)}$
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Trading Panel */}
          <div className="bg-gradient-to-t from-[#0d1421] to-transparent border-t border-cyan-500/10 p-3 shrink-0 space-y-2 pb-6">
            {/* Lot Size Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">اللوت:</span>
              {lotSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setLotSize(size)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                    lotSize === size
                      ? "bg-cyan-500 text-white"
                      : "bg-[#1a2235] text-white/60 hover:bg-cyan-500/20"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Take Profit & Stop Loss */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <label className="absolute -top-2 right-2 bg-[#0d1421] px-1 text-[10px] text-green-400">
                  Take Profit
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={currentPrice ? (currentPrice * 1.01).toFixed(selectedSymbol.pip < 0.01 ? 5 : 2) : "0.00"}
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="h-9 bg-[#1a2235] border-green-500/30 text-green-400 text-sm text-center placeholder:text-green-400/30"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 right-2 bg-[#0d1421] px-1 text-[10px] text-red-400">
                  Stop Loss
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={currentPrice ? (currentPrice * 0.99).toFixed(selectedSymbol.pip < 0.01 ? 5 : 2) : "0.00"}
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="h-9 bg-[#1a2235] border-red-500/30 text-red-400 text-sm text-center placeholder:text-red-400/30"
                />
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleOpenTrade("buy")}
                disabled={!currentPrice || lotSize * 1000 > (wallet?.balance || 0)}
                className="h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl text-base font-bold shadow-lg shadow-green-500/20 flex-col"
              >
                <TrendingUp className="h-4 w-4 mb-0.5" />
                <span>شراء BUY</span>
              </Button>
              <Button
                onClick={() => handleOpenTrade("sell")}
                disabled={!currentPrice || lotSize * 1000 > (wallet?.balance || 0)}
                className="h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-base font-bold shadow-lg shadow-red-500/20 flex-col"
              >
                <TrendingDown className="h-4 w-4 mb-0.5" />
                <span>بيع SELL</span>
              </Button>
            </div>
          </div>

          {/* Open Positions Sheet */}
          <Sheet open={positionsSheetOpen} onOpenChange={setPositionsSheetOpen}>
            <SheetContent side="bottom" className="bg-[#0d1421] border-t border-cyan-500/20 h-[60vh] rounded-t-2xl p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
                  <h3 className="font-bold">الصفقات المفتوحة ({openPositions.length})</h3>
                  {openPositions.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleCloseAll}
                      className="text-xs"
                    >
                      إغلاق الكل
                    </Button>
                  )}
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {openPositions.map((position) => {
                      const { pnl, pips, currentPrice } = calculatePnL(position);
                      const isProfit = pnl >= 0;
                      const isEditing = editingPositionId === position.id;
                      
                      return (
                        <div 
                          key={position.id} 
                          className={cn(
                            "p-3 rounded-xl border",
                            isProfit 
                              ? "bg-green-500/5 border-green-500/20" 
                              : "bg-red-500/5 border-red-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={position.direction === "buy" ? "bg-green-500" : "bg-red-500"}>
                                {position.direction === "buy" ? "شراء" : "بيع"}
                              </Badge>
                              <span className="font-bold text-sm">{position.symbolName}</span>
                              <span className="text-xs text-muted-foreground">x{position.lotSize}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isEditing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingPosition(position)}
                                  className="h-7 w-7 p-0 text-cyan-400 hover:bg-cyan-500/20"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClosePosition(position)}
                                className="h-7 text-xs border-white/20"
                              >
                                إغلاق
                              </Button>
                            </div>
                          </div>
                          
                          {/* Editing TP/SL */}
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <label className="absolute -top-1.5 right-2 bg-[#0d1421] px-1 text-[9px] text-green-400">
                                    Take Profit
                                  </label>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={editTP}
                                    onChange={(e) => setEditTP(e.target.value)}
                                    className="h-8 bg-[#1a2235] border-green-500/30 text-green-400 text-xs text-center"
                                  />
                                </div>
                                <div className="relative">
                                  <label className="absolute -top-1.5 right-2 bg-[#0d1421] px-1 text-[9px] text-red-400">
                                    Stop Loss
                                  </label>
                                  <Input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={editSL}
                                    onChange={(e) => setEditSL(e.target.value)}
                                    className="h-8 bg-[#1a2235] border-red-500/30 text-red-400 text-xs text-center"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEditedTPSL(position.id)}
                                  className="flex-1 h-7 text-xs bg-cyan-500 hover:bg-cyan-600"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  حفظ
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="flex-1 h-7 text-xs border-white/20"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">الدخول</p>
                                <p className="font-mono text-cyan-400">{position.entryPrice.toFixed(position.pip < 0.01 ? 5 : 2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">الحالي</p>
                                <p className="font-mono">{currentPrice.toFixed(position.pip < 0.01 ? 5 : 2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">TP/SL</p>
                                <p className="font-mono">
                                  <span className="text-green-400">{position.takeProfit?.toFixed(2) || "-"}</span>
                                  /
                                  <span className="text-red-400">{position.stopLoss?.toFixed(2) || "-"}</span>
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-muted-foreground">P&L</p>
                                <p className={cn("font-bold", isProfit ? "text-green-400" : "text-red-400")}>
                                  {isProfit ? "+" : ""}{pnl.toFixed(2)}$
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {openPositions.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>لا توجد صفقات مفتوحة</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

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
                      <div 
                        key={trade.id} 
                        className={cn(
                          "p-3 rounded-lg border text-sm", 
                          (trade.profit_loss || 0) > 0 
                            ? "bg-green-500/5 border-green-500/20" 
                            : "bg-red-500/5 border-red-500/20"
                        )}
                      >
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={trade.trade_type === "buy" ? "default" : "destructive"} 
                              className="text-[10px]"
                            >
                              {trade.trade_type === "buy" ? "شراء" : "بيع"}
                            </Badge>
                            <span className="text-xs">{trade.symbol_name_ar}</span>
                          </div>
                          <span className={cn(
                            "font-bold", 
                            (trade.profit_loss || 0) > 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {(trade.profit_loss || 0) > 0 ? "+" : ""}${(trade.profit_loss || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>الدخول: {trade.entry_price?.toFixed(5)}</span>
                          <span>الخروج: {trade.exit_price?.toFixed(5)}</span>
                        </div>
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
