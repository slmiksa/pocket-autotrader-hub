import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PullToRefresh } from "@/components/PullToRefresh";
import { DisclaimerDialog } from "@/components/paper-trading/DisclaimerDialog";
import { WalletCard } from "@/components/paper-trading/WalletCard";
import { TradePanel } from "@/components/paper-trading/TradePanel";
import { MarketSelector } from "@/components/paper-trading/MarketSelector";
import { OpenTradesList } from "@/components/paper-trading/OpenTradesList";
import { TradeHistory } from "@/components/paper-trading/TradeHistory";
import { useVirtualWallet } from "@/hooks/useVirtualWallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, History, Briefcase } from "lucide-react";

declare global {
  interface Window {
    TradingView: any;
  }
}

const PaperTrading = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<{ symbol: string; name: string; price: number } | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  const { wallet, trades, openTrade, closeTrade, resetWallet, updateWalletBalance, refetch } = useVirtualWallet();

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

  // Fetch prices for selected symbol
  const fetchPrice = useCallback(async (symbol: string) => {
    // Use TradingView widget data or mock prices for demo
    // In production, you'd integrate with a real price API
    const mockPrices: Record<string, number> = {
      "FX:EURUSD": 1.0850 + (Math.random() - 0.5) * 0.001,
      "FX:GBPUSD": 1.2650 + (Math.random() - 0.5) * 0.001,
      "FX:USDJPY": 149.50 + (Math.random() - 0.5) * 0.1,
      "FX:USDCHF": 0.8750 + (Math.random() - 0.5) * 0.001,
      "FX:AUDUSD": 0.6550 + (Math.random() - 0.5) * 0.001,
      "FX:USDCAD": 1.3550 + (Math.random() - 0.5) * 0.001,
      "FX:NZDUSD": 0.6150 + (Math.random() - 0.5) * 0.001,
      "FX:EURGBP": 0.8580 + (Math.random() - 0.5) * 0.001,
      "FX:EURJPY": 162.20 + (Math.random() - 0.5) * 0.1,
      "FX:GBPJPY": 189.10 + (Math.random() - 0.5) * 0.1,
      "BINANCE:BTCUSDT": 95000 + (Math.random() - 0.5) * 500,
      "BINANCE:ETHUSDT": 3400 + (Math.random() - 0.5) * 50,
      "BINANCE:BNBUSDT": 620 + (Math.random() - 0.5) * 10,
      "BINANCE:XRPUSDT": 2.15 + (Math.random() - 0.5) * 0.05,
      "BINANCE:SOLUSDT": 185 + (Math.random() - 0.5) * 5,
      "BINANCE:ADAUSDT": 0.95 + (Math.random() - 0.5) * 0.02,
      "BINANCE:DOGEUSDT": 0.38 + (Math.random() - 0.5) * 0.01,
      "TVC:GOLD": 2650 + (Math.random() - 0.5) * 10,
      "TVC:SILVER": 31.50 + (Math.random() - 0.5) * 0.5,
      "NYMEX:CL1!": 72.50 + (Math.random() - 0.5) * 1,
      "NYMEX:NG1!": 3.25 + (Math.random() - 0.5) * 0.1,
      "SP:SPX": 5950 + (Math.random() - 0.5) * 20,
      "DJ:DJI": 43500 + (Math.random() - 0.5) * 100,
      "NASDAQ:NDX": 20800 + (Math.random() - 0.5) * 50,
      "TVC:DAX": 19800 + (Math.random() - 0.5) * 50,
      "TVC:UKX": 8150 + (Math.random() - 0.5) * 20,
      "NASDAQ:AAPL": 195 + (Math.random() - 0.5) * 2,
      "NASDAQ:GOOGL": 175 + (Math.random() - 0.5) * 2,
      "NASDAQ:MSFT": 420 + (Math.random() - 0.5) * 5,
      "NASDAQ:AMZN": 205 + (Math.random() - 0.5) * 3,
      "NASDAQ:TSLA": 380 + (Math.random() - 0.5) * 10,
      "NASDAQ:META": 580 + (Math.random() - 0.5) * 10,
      "NASDAQ:NVDA": 140 + (Math.random() - 0.5) * 5,
    };

    const price = mockPrices[symbol];
    if (price) {
      setPrices(prev => ({ ...prev, [symbol]: price }));
      return price;
    }
    return null;
  }, []);

  // Update prices periodically
  useEffect(() => {
    if (!disclaimerAccepted) return;

    const updatePrices = () => {
      // Update all open trade prices
      trades.filter(t => t.status === 'open').forEach(trade => {
        fetchPrice(trade.symbol);
      });
      // Update selected symbol price
      if (selectedSymbol) {
        fetchPrice(selectedSymbol.symbol);
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 2000);
    return () => clearInterval(interval);
  }, [disclaimerAccepted, trades, selectedSymbol, fetchPrice]);

  // Initialize TradingView widget
  useEffect(() => {
    if (!disclaimerAccepted || !selectedSymbol || !chartContainerRef.current) return;

    const loadTradingViewWidget = () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if (window.TradingView && chartContainerRef.current) {
          widgetRef.current = new window.TradingView.widget({
            autosize: true,
            symbol: selectedSymbol.symbol,
            interval: '15',
            timezone: 'Asia/Riyadh',
            theme: 'dark',
            style: '1',
            locale: 'ar',
            toolbar_bg: '#1a1a2e',
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            container_id: 'tradingview_chart',
            studies: [
              'RSI@tv-basicstudies',
              'MASimple@tv-basicstudies',
              'MACD@tv-basicstudies',
              'BB@tv-basicstudies',
            ],
          });
        }
      };
      document.head.appendChild(script);
    };

    loadTradingViewWidget();

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [disclaimerAccepted, selectedSymbol?.symbol]);

  // Handle symbol selection
  const handleSelectSymbol = async (symbol: string, name: string) => {
    const price = await fetchPrice(symbol);
    setSelectedSymbol({ symbol, name, price: price || 0 });
  };

  // Update selected symbol price
  useEffect(() => {
    if (selectedSymbol && prices[selectedSymbol.symbol]) {
      setSelectedSymbol(prev => prev ? { ...prev, price: prices[selectedSymbol.symbol] } : null);
    }
  }, [prices]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="min-h-screen bg-background pb-20">
        <DisclaimerDialog onAccept={() => setDisclaimerAccepted(true)} />

        {disclaimerAccepted && (
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6 text-center">تداول وتعلم</h1>

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-4">
              <WalletCard
                wallet={wallet}
                onResetWallet={resetWallet}
                onUpdateBalance={updateWalletBalance}
              />

              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="chart" className="text-xs">
                    <BarChart3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="trade" className="text-xs">
                    <Briefcase className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="open" className="text-xs">
                    مفتوحة
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    <History className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chart" className="mt-4 space-y-4">
                  <MarketSelector
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={handleSelectSymbol}
                    prices={prices}
                  />
                  {selectedSymbol && (
                    <div 
                      id="tradingview_chart" 
                      ref={chartContainerRef}
                      className="h-[400px] rounded-lg overflow-hidden border border-border/50"
                    />
                  )}
                </TabsContent>

                <TabsContent value="trade" className="mt-4">
                  <TradePanel
                    selectedSymbol={selectedSymbol}
                    walletBalance={wallet?.balance || 0}
                    onOpenTrade={openTrade}
                  />
                </TabsContent>

                <TabsContent value="open" className="mt-4">
                  <OpenTradesList
                    trades={trades}
                    currentPrices={prices}
                    onCloseTrade={closeTrade}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <TradeHistory trades={trades} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="space-y-4">
                <WalletCard
                  wallet={wallet}
                  onResetWallet={resetWallet}
                  onUpdateBalance={updateWalletBalance}
                />
                <MarketSelector
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={handleSelectSymbol}
                  prices={prices}
                />
              </div>

              {/* Chart */}
              <div className="lg:col-span-2">
                {selectedSymbol ? (
                  <div 
                    id="tradingview_chart" 
                    ref={chartContainerRef}
                    className="h-[600px] rounded-lg overflow-hidden border border-border/50"
                  />
                ) : (
                  <div className="h-[600px] rounded-lg border border-border/50 flex items-center justify-center bg-card">
                    <p className="text-muted-foreground">اختر سوق لعرض الشارت</p>
                  </div>
                )}
              </div>

              {/* Trade Panel & Trades */}
              <div className="space-y-4">
                <TradePanel
                  selectedSymbol={selectedSymbol}
                  walletBalance={wallet?.balance || 0}
                  onOpenTrade={openTrade}
                />
                <OpenTradesList
                  trades={trades}
                  currentPrices={prices}
                  onCloseTrade={closeTrade}
                />
                <TradeHistory trades={trades} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default PaperTrading;
