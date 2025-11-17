import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}
interface MarketTickerProps {
  type: 'forex' | 'stocks';
}
const FOREX_SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'];
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA'];
export const MarketTicker = ({
  type
}: MarketTickerProps) => {
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  useEffect(() => {
    // Generate mock data
    const symbols = type === 'forex' ? FOREX_SYMBOLS : STOCK_SYMBOLS;
    const mockData = symbols.map(symbol => ({
      symbol,
      price: type === 'forex' ? (Math.random() * 2 + 0.5).toFixed(4) : (Math.random() * 500 + 100).toFixed(2),
      change: (Math.random() * 4 - 2).toFixed(2),
      isPositive: Math.random() > 0.5
    }));
    setTicker(mockData);

    // Update prices periodically
    const interval = setInterval(() => {
      setTicker(prev => prev.map(item => ({
        ...item,
        change: (Math.random() * 4 - 2).toFixed(2),
        isPositive: Math.random() > 0.5
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [type]);
  return <div className="bg-card border-y border-border overflow-hidden">
      <div className="relative w-full overflow-hidden bg-warning py-2">
        <div className="animate-marquee inline-flex gap-8 whitespace-nowrap">
          {[...ticker, ...ticker].map((item, idx) => <div key={`${item.symbol}-${idx}`} className="inline-flex items-center gap-2 px-4">
              <span className="font-semibold text-sm text-warning-foreground">{item.symbol}</span>
              <span className="text-sm text-warning-foreground">{item.price}</span>
              <span className={`inline-flex items-center text-xs font-medium ${item.isPositive ? 'text-success' : 'text-danger'}`}>
                {item.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {item.isPositive ? '+' : ''}{item.change}%
              </span>
            </div>)}
        </div>
      </div>
    </div>;
};