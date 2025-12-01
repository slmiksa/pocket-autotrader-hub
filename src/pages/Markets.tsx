import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';

interface MarketItem {
  name: string;
  nameAr: string;
  symbol: string;
  binanceSymbol?: string;
  category: string;
}

interface PriceData {
  price: number;
  change24h: number;
  isPositive: boolean;
}

const markets: MarketItem[] = [
  // Forex - Major Pairs
  { name: 'EUR/USD', nameAr: 'يورو/دولار', symbol: 'eurusd', category: 'فوركس' },
  { name: 'GBP/USD', nameAr: 'جنيه/دولار', symbol: 'gbpusd', category: 'فوركس' },
  { name: 'USD/JPY', nameAr: 'دولار/ين', symbol: 'usdjpy', category: 'فوركس' },
  { name: 'USD/CHF', nameAr: 'دولار/فرنك', symbol: 'usdchf', category: 'فوركس' },
  { name: 'AUD/USD', nameAr: 'أسترالي/دولار', symbol: 'audusd', category: 'فوركس' },
  { name: 'USD/CAD', nameAr: 'دولار/كندي', symbol: 'usdcad', category: 'فوركس' },
  { name: 'NZD/USD', nameAr: 'نيوزيلندي/دولار', symbol: 'nzdusd', category: 'فوركس' },
  { name: 'EUR/GBP', nameAr: 'يورو/جنيه', symbol: 'eurgbp', category: 'فوركس' },
  { name: 'EUR/JPY', nameAr: 'يورو/ين', symbol: 'eurjpy', category: 'فوركس' },
  { name: 'GBP/JPY', nameAr: 'جنيه/ين', symbol: 'gbpjpy', category: 'فوركس' },
  
  // Crypto - Top coins with Binance symbols
  { name: 'Bitcoin', nameAr: 'بيتكوين', symbol: 'bitcoin', binanceSymbol: 'BTCUSDT', category: 'عملات رقمية' },
  { name: 'Ethereum', nameAr: 'إيثريوم', symbol: 'ethereum', binanceSymbol: 'ETHUSDT', category: 'عملات رقمية' },
  { name: 'BNB', nameAr: 'بي إن بي', symbol: 'bnb', binanceSymbol: 'BNBUSDT', category: 'عملات رقمية' },
  { name: 'Solana', nameAr: 'سولانا', symbol: 'solana', binanceSymbol: 'SOLUSDT', category: 'عملات رقمية' },
  { name: 'XRP', nameAr: 'ريبل', symbol: 'xrp', binanceSymbol: 'XRPUSDT', category: 'عملات رقمية' },
  { name: 'Cardano', nameAr: 'كاردانو', symbol: 'cardano', binanceSymbol: 'ADAUSDT', category: 'عملات رقمية' },
  { name: 'Dogecoin', nameAr: 'دوجكوين', symbol: 'dogecoin', binanceSymbol: 'DOGEUSDT', category: 'عملات رقمية' },
  { name: 'Litecoin', nameAr: 'لايتكوين', symbol: 'litecoin', binanceSymbol: 'LTCUSDT', category: 'عملات رقمية' },
  { name: 'Avalanche', nameAr: 'أفالانش', symbol: 'avalanche', binanceSymbol: 'AVAXUSDT', category: 'عملات رقمية' },
  { name: 'Polkadot', nameAr: 'بولكادوت', symbol: 'polkadot', binanceSymbol: 'DOTUSDT', category: 'عملات رقمية' },
  { name: 'Chainlink', nameAr: 'تشين لينك', symbol: 'chainlink', binanceSymbol: 'LINKUSDT', category: 'عملات رقمية' },
  { name: 'Polygon', nameAr: 'بوليجون', symbol: 'polygon', binanceSymbol: 'MATICUSDT', category: 'عملات رقمية' },
  { name: 'Shiba Inu', nameAr: 'شيبا إينو', symbol: 'shiba', binanceSymbol: 'SHIBUSDT', category: 'عملات رقمية' },
  { name: 'TRON', nameAr: 'ترون', symbol: 'tron', binanceSymbol: 'TRXUSDT', category: 'عملات رقمية' },
  { name: 'Uniswap', nameAr: 'يونيسواب', symbol: 'uniswap', binanceSymbol: 'UNIUSDT', category: 'عملات رقمية' },
  
  // Commodities
  { name: 'Gold', nameAr: 'الذهب', symbol: 'gold', binanceSymbol: 'PAXGUSDT', category: 'سلع' },
  { name: 'Silver', nameAr: 'الفضة', symbol: 'silver', category: 'سلع' },
  { name: 'Oil (WTI)', nameAr: 'النفط الخام', symbol: 'oil', category: 'سلع' },
  { name: 'Natural Gas', nameAr: 'الغاز الطبيعي', symbol: 'naturalgas', category: 'سلع' },
  { name: 'Platinum', nameAr: 'البلاتين', symbol: 'platinum', category: 'سلع' },
  { name: 'Copper', nameAr: 'النحاس', symbol: 'copper', category: 'سلع' },
  
  // Indices
  { name: 'S&P 500', nameAr: 'إس آند بي 500', symbol: 'sp500', category: 'مؤشرات' },
  { name: 'Dow Jones', nameAr: 'داو جونز', symbol: 'dowjones', category: 'مؤشرات' },
  { name: 'NASDAQ', nameAr: 'ناسداك', symbol: 'nasdaq', category: 'مؤشرات' },
  { name: 'DAX', nameAr: 'داكس الألماني', symbol: 'dax', category: 'مؤشرات' },
  { name: 'FTSE 100', nameAr: 'فوتسي 100', symbol: 'ftse100', category: 'مؤشرات' },
  { name: 'Nikkei 225', nameAr: 'نيكاي 225', symbol: 'nikkei', category: 'مؤشرات' },
  { name: 'CAC 40', nameAr: 'كاك 40', symbol: 'cac40', category: 'مؤشرات' },
  
  // Popular Stocks
  { name: 'Apple', nameAr: 'أبل', symbol: 'apple', category: 'أسهم' },
  { name: 'Tesla', nameAr: 'تسلا', symbol: 'tesla', category: 'أسهم' },
  { name: 'Amazon', nameAr: 'أمازون', symbol: 'amazon', category: 'أسهم' },
  { name: 'Google', nameAr: 'جوجل', symbol: 'google', category: 'أسهم' },
  { name: 'Microsoft', nameAr: 'مايكروسوفت', symbol: 'microsoft', category: 'أسهم' },
  { name: 'Meta', nameAr: 'ميتا', symbol: 'meta', category: 'أسهم' },
  { name: 'NVIDIA', nameAr: 'إنفيديا', symbol: 'nvidia', category: 'أسهم' },
  { name: 'Netflix', nameAr: 'نتفليكس', symbol: 'netflix', category: 'أسهم' },
  { name: 'AMD', nameAr: 'إيه إم دي', symbol: 'amd', category: 'أسهم' },
  { name: 'Intel', nameAr: 'إنتل', symbol: 'intel', category: 'أسهم' },
  { name: 'Disney', nameAr: 'ديزني', symbol: 'disney', category: 'أسهم' },
  { name: 'Coca-Cola', nameAr: 'كوكا كولا', symbol: 'cocacola', category: 'أسهم' },
];

const categories = ['فوركس', 'عملات رقمية', 'سلع', 'مؤشرات', 'أسهم'];

const categoryIcons: Record<string, string> = {
  'فوركس': '💱',
  'عملات رقمية': '₿',
  'سلع': '🛢️',
  'مؤشرات': '📊',
  'أسهم': '📈',
};

const Markets = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      // Fetch crypto prices from Binance
      const cryptoSymbols = markets
        .filter(m => m.binanceSymbol)
        .map(m => m.binanceSymbol);
      
      const responses = await Promise.all(
        cryptoSymbols.map(symbol =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
            .then(res => res.json())
            .catch(() => null)
        )
      );

      const newPrices: Record<string, PriceData> = {};
      
      responses.forEach((data, index) => {
        if (data && data.lastPrice) {
          const market = markets.find(m => m.binanceSymbol === cryptoSymbols[index]);
          if (market) {
            const change = parseFloat(data.priceChangePercent);
            newPrices[market.symbol] = {
              price: parseFloat(data.lastPrice),
              change24h: change,
              isPositive: change >= 0
            };
          }
        }
      });

      setPrices(newPrices);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    } else {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-white">جميع الأسواق</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchPrices}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {lastUpdate && (
            <p className="text-center text-xs text-white/40 mt-2">
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
            </p>
          )}
        </div>
      </header>

      {/* Markets Grid */}
      <main className="container mx-auto px-4 py-6 space-y-10">
        {categories.map((category) => {
          const categoryMarkets = markets.filter((market) => market.category === category);
          
          return (
            <section key={category}>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{categoryIcons[category]}</span>
                <h2 className="text-lg font-bold text-white">{category}</h2>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                  {categoryMarkets.length} سوق
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {categoryMarkets.map((market) => {
                  const priceData = prices[market.symbol];
                  
                  return (
                    <Card
                      key={market.symbol}
                      className="group relative overflow-hidden bg-[#12121a] border-white/5 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:bg-[#16161f] hover:scale-[1.02]"
                      onClick={() => navigate(`/live-chart?symbol=${market.symbol}`)}
                    >
                      <div className="p-4">
                        {/* Market Name */}
                        <div className="mb-3">
                          <p className="font-bold text-white text-base group-hover:text-primary transition-colors">
                            {market.nameAr}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">{market.name}</p>
                        </div>
                        
                        {/* Price Section */}
                        {priceData ? (
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-white">
                              ${formatPrice(priceData.price)}
                            </p>
                            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              priceData.isPositive 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {priceData.isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span>
                                {priceData.isPositive ? '+' : ''}
                                {priceData.change24h.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-white/30">
                            {loading && market.binanceSymbol ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="text-xs">عرض الشارت →</span>
                            )}
                          </div>
                        )}
                        
                        {/* Hover Arrow */}
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowLeft className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Footer Info */}
        <div className="text-center py-8 border-t border-white/5">
          <p className="text-white/40 text-sm">
            الأسعار مباشرة من Binance • التحديث كل 10 ثوانٍ
          </p>
          <p className="text-white/30 text-xs mt-2">
            اضغط على أي سوق لعرض الشارت المباشر من TradingView
          </p>
        </div>
      </main>
    </div>
  );
};

export default Markets;
