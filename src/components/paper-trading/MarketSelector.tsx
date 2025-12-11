import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

interface Market {
  symbol: string;
  name: string;
  category: string;
  price?: number;
  change?: number;
}

interface MarketSelectorProps {
  selectedSymbol: { symbol: string; name: string; price: number } | null;
  onSelectSymbol: (symbol: string, name: string) => void;
  prices: Record<string, number>;
}

const markets: Market[] = [
  // Forex
  { symbol: "FX:EURUSD", name: "يورو/دولار", category: "forex" },
  { symbol: "FX:GBPUSD", name: "جنيه/دولار", category: "forex" },
  { symbol: "FX:USDJPY", name: "دولار/ين", category: "forex" },
  { symbol: "FX:USDCHF", name: "دولار/فرنك", category: "forex" },
  { symbol: "FX:AUDUSD", name: "أسترالي/دولار", category: "forex" },
  { symbol: "FX:USDCAD", name: "دولار/كندي", category: "forex" },
  { symbol: "FX:NZDUSD", name: "نيوزلندي/دولار", category: "forex" },
  { symbol: "FX:EURGBP", name: "يورو/جنيه", category: "forex" },
  { symbol: "FX:EURJPY", name: "يورو/ين", category: "forex" },
  { symbol: "FX:GBPJPY", name: "جنيه/ين", category: "forex" },
  
  // Crypto
  { symbol: "BINANCE:BTCUSDT", name: "بيتكوين", category: "crypto" },
  { symbol: "BINANCE:ETHUSDT", name: "إيثيريوم", category: "crypto" },
  { symbol: "BINANCE:BNBUSDT", name: "بينانس كوين", category: "crypto" },
  { symbol: "BINANCE:XRPUSDT", name: "ريبل", category: "crypto" },
  { symbol: "BINANCE:SOLUSDT", name: "سولانا", category: "crypto" },
  { symbol: "BINANCE:ADAUSDT", name: "كاردانو", category: "crypto" },
  { symbol: "BINANCE:DOGEUSDT", name: "دوجكوين", category: "crypto" },
  
  // Commodities
  { symbol: "TVC:GOLD", name: "الذهب", category: "commodities" },
  { symbol: "TVC:SILVER", name: "الفضة", category: "commodities" },
  { symbol: "NYMEX:CL1!", name: "النفط الخام", category: "commodities" },
  { symbol: "NYMEX:NG1!", name: "الغاز الطبيعي", category: "commodities" },
  
  // Indices
  { symbol: "SP:SPX", name: "S&P 500", category: "indices" },
  { symbol: "DJ:DJI", name: "داو جونز", category: "indices" },
  { symbol: "NASDAQ:NDX", name: "ناسداك 100", category: "indices" },
  { symbol: "TVC:DAX", name: "داكس الألماني", category: "indices" },
  { symbol: "TVC:UKX", name: "فوتسي 100", category: "indices" },
  
  // Stocks
  { symbol: "NASDAQ:AAPL", name: "أبل", category: "stocks" },
  { symbol: "NASDAQ:GOOGL", name: "جوجل", category: "stocks" },
  { symbol: "NASDAQ:MSFT", name: "مايكروسوفت", category: "stocks" },
  { symbol: "NASDAQ:AMZN", name: "أمازون", category: "stocks" },
  { symbol: "NASDAQ:TSLA", name: "تسلا", category: "stocks" },
  { symbol: "NASDAQ:META", name: "ميتا", category: "stocks" },
  { symbol: "NASDAQ:NVDA", name: "إنفيديا", category: "stocks" },
];

export const MarketSelector = ({ selectedSymbol, onSelectSymbol, prices }: MarketSelectorProps) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("forex");

  const filteredMarkets = markets.filter(
    (m) =>
      m.category === activeCategory &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">اختر السوق</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-5 w-full text-xs">
            <TabsTrigger value="forex">عملات</TabsTrigger>
            <TabsTrigger value="crypto">كريبتو</TabsTrigger>
            <TabsTrigger value="commodities">سلع</TabsTrigger>
            <TabsTrigger value="indices">مؤشرات</TabsTrigger>
            <TabsTrigger value="stocks">أسهم</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Markets List */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            {filteredMarkets.map((market) => {
              const price = prices[market.symbol];
              const isSelected = selectedSymbol?.symbol === market.symbol;

              return (
                <button
                  key={market.symbol}
                  onClick={() => onSelectSymbol(market.symbol, market.name)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-background/50"
                  }`}
                >
                  <div className="text-right">
                    <p className="font-medium text-sm">{market.name}</p>
                    <p className="text-xs text-muted-foreground">{market.symbol}</p>
                  </div>
                  {price && (
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        ${price.toFixed(price < 10 ? 5 : 2)}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
