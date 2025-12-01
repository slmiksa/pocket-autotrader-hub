import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, ChevronLeft } from 'lucide-react';

interface MarketItem {
  name: string;
  nameAr: string;
  symbol: string;
  category: string;
}

const markets: MarketItem[] = [
  // Forex
  { name: 'EUR/USD', nameAr: 'يورو/دولار', symbol: 'eurusd', category: 'فوركس' },
  { name: 'GBP/USD', nameAr: 'جنيه/دولار', symbol: 'gbpusd', category: 'فوركس' },
  { name: 'USD/JPY', nameAr: 'دولار/ين', symbol: 'usdjpy', category: 'فوركس' },
  { name: 'USD/CHF', nameAr: 'دولار/فرنك', symbol: 'usdchf', category: 'فوركس' },
  { name: 'AUD/USD', nameAr: 'أسترالي/دولار', symbol: 'audusd', category: 'فوركس' },
  { name: 'USD/CAD', nameAr: 'دولار/كندي', symbol: 'usdcad', category: 'فوركس' },
  { name: 'NZD/USD', nameAr: 'نيوزيلندي/دولار', symbol: 'nzdusd', category: 'فوركس' },
  { name: 'EUR/GBP', nameAr: 'يورو/جنيه', symbol: 'eurgbp', category: 'فوركس' },
  
  // Crypto
  { name: 'Bitcoin', nameAr: 'بيتكوين', symbol: 'bitcoin', category: 'عملات رقمية' },
  { name: 'Ethereum', nameAr: 'إيثريوم', symbol: 'ethereum', category: 'عملات رقمية' },
  { name: 'BNB', nameAr: 'بي إن بي', symbol: 'bnb', category: 'عملات رقمية' },
  { name: 'Solana', nameAr: 'سولانا', symbol: 'solana', category: 'عملات رقمية' },
  { name: 'XRP', nameAr: 'ريبل', symbol: 'xrp', category: 'عملات رقمية' },
  { name: 'Cardano', nameAr: 'كاردانو', symbol: 'cardano', category: 'عملات رقمية' },
  { name: 'Dogecoin', nameAr: 'دوجكوين', symbol: 'dogecoin', category: 'عملات رقمية' },
  { name: 'Litecoin', nameAr: 'لايتكوين', symbol: 'litecoin', category: 'عملات رقمية' },
  
  // Commodities
  { name: 'Gold', nameAr: 'الذهب', symbol: 'gold', category: 'سلع' },
  { name: 'Silver', nameAr: 'الفضة', symbol: 'silver', category: 'سلع' },
  { name: 'Oil (WTI)', nameAr: 'النفط الخام', symbol: 'oil', category: 'سلع' },
  { name: 'Natural Gas', nameAr: 'الغاز الطبيعي', symbol: 'naturalgas', category: 'سلع' },
  
  // Stocks/Indices
  { name: 'S&P 500', nameAr: 'إس آند بي 500', symbol: 'sp500', category: 'مؤشرات' },
  { name: 'Dow Jones', nameAr: 'داو جونز', symbol: 'dowjones', category: 'مؤشرات' },
  { name: 'NASDAQ', nameAr: 'ناسداك', symbol: 'nasdaq', category: 'مؤشرات' },
  { name: 'DAX', nameAr: 'داكس الألماني', symbol: 'dax', category: 'مؤشرات' },
  { name: 'FTSE 100', nameAr: 'فوتسي 100', symbol: 'ftse100', category: 'مؤشرات' },
  
  // Popular Stocks
  { name: 'Apple', nameAr: 'أبل', symbol: 'apple', category: 'أسهم' },
  { name: 'Tesla', nameAr: 'تسلا', symbol: 'tesla', category: 'أسهم' },
  { name: 'Amazon', nameAr: 'أمازون', symbol: 'amazon', category: 'أسهم' },
  { name: 'Google', nameAr: 'جوجل', symbol: 'google', category: 'أسهم' },
  { name: 'Microsoft', nameAr: 'مايكروسوفت', symbol: 'microsoft', category: 'أسهم' },
  { name: 'Meta', nameAr: 'ميتا', symbol: 'meta', category: 'أسهم' },
  { name: 'NVIDIA', nameAr: 'إنفيديا', symbol: 'nvidia', category: 'أسهم' },
];

const categories = ['فوركس', 'عملات رقمية', 'سلع', 'مؤشرات', 'أسهم'];

const Markets = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">جميع الأسواق</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Markets Grid */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {markets
                .filter((market) => market.category === category)
                .map((market) => (
                  <Card
                    key={market.symbol}
                    className="p-4 hover:bg-muted/50 transition-all cursor-pointer group border-border/50 hover:border-primary/30"
                    onClick={() => navigate(`/live-chart?symbol=${market.symbol}`)}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {market.nameAr}
                      </p>
                      <p className="text-xs text-muted-foreground">{market.name}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-[-4px]" />
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Markets;
