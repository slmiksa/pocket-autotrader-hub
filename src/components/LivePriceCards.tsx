import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, LineChart } from 'lucide-react';

interface PriceData {
  price: number;
  change24h: number;
  isPositive: boolean;
}

export const LivePriceCards = () => {
  const navigate = useNavigate();
  const [goldPrice, setGoldPrice] = useState<PriceData | null>(null);
  const [btcPrice, setBtcPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch Bitcoin and Gold prices from CoinGecko API
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,pax-gold&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();

        if (data.bitcoin) {
          setBtcPrice({
            price: data.bitcoin.usd,
            change24h: data.bitcoin.usd_24h_change || 0,
            isPositive: (data.bitcoin.usd_24h_change || 0) > 0
          });
        }

        if (data['pax-gold']) {
          setGoldPrice({
            price: data['pax-gold'].usd,
            change24h: data['pax-gold'].usd_24h_change || 0,
            isPositive: (data['pax-gold'].usd_24h_change || 0) > 0
          });
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    // Fetch immediately
    fetchPrices();

    // Update every 30 seconds
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-6 bg-muted/30">
      {/* Gold Card */}
      <Card 
        className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => navigate('/live-chart?symbol=gold')}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">الذهب (أونصة)</h3>
              <LineChart className="h-4 w-4 text-warning opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {goldPrice ? `$${goldPrice.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'جاري التحميل...'}
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              اضغط لعرض الشارت المباشر
            </p>
          </div>
          <div className="text-right">
            {goldPrice && (
              <div className={`flex items-center gap-1 text-lg font-semibold ${goldPrice.isPositive ? 'text-success' : 'text-danger'}`}>
                {goldPrice.isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{goldPrice.isPositive ? '+' : ''}{goldPrice.change24h.toFixed(2)}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">24 ساعة</p>
          </div>
        </div>
      </Card>

      {/* Bitcoin Card */}
      <Card 
        className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => navigate('/live-chart?symbol=bitcoin')}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">بيتكوين (BTC)</h3>
              <LineChart className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {btcPrice ? `$${btcPrice.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'جاري التحميل...'}
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              اضغط لعرض الشارت المباشر
            </p>
          </div>
          <div className="text-right">
            {btcPrice && (
              <div className={`flex items-center gap-1 text-lg font-semibold ${btcPrice.isPositive ? 'text-success' : 'text-danger'}`}>
                {btcPrice.isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span>{btcPrice.isPositive ? '+' : ''}{btcPrice.change24h.toFixed(2)}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">24 ساعة</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
