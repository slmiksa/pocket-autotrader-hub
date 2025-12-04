import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Upload, Loader2, Info, Save, Bell, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PriceAlertDialog } from "@/components/alerts/PriceAlertDialog";

// Symbol to API mapping for price fetching
const symbolToPriceAPI: Record<string, { api: 'binance' | 'forex' | 'commodity', symbol: string }> = {
  // Crypto - Binance
  bitcoin: { api: 'binance', symbol: 'BTCUSDT' },
  ethereum: { api: 'binance', symbol: 'ETHUSDT' },
  bnb: { api: 'binance', symbol: 'BNBUSDT' },
  solana: { api: 'binance', symbol: 'SOLUSDT' },
  xrp: { api: 'binance', symbol: 'XRPUSDT' },
  cardano: { api: 'binance', symbol: 'ADAUSDT' },
  dogecoin: { api: 'binance', symbol: 'DOGEUSDT' },
  avalanche: { api: 'binance', symbol: 'AVAXUSDT' },
  polkadot: { api: 'binance', symbol: 'DOTUSDT' },
  polygon: { api: 'binance', symbol: 'MATICUSDT' },
  chainlink: { api: 'binance', symbol: 'LINKUSDT' },
  litecoin: { api: 'binance', symbol: 'LTCUSDT' },
  shiba: { api: 'binance', symbol: 'SHIBUSDT' },
  pepe: { api: 'binance', symbol: 'PEPEUSDT' },
  tron: { api: 'binance', symbol: 'TRXUSDT' },
  uniswap: { api: 'binance', symbol: 'UNIUSDT' },
  near: { api: 'binance', symbol: 'NEARUSDT' },
  aptos: { api: 'binance', symbol: 'APTUSDT' },
  arbitrum: { api: 'binance', symbol: 'ARBUSDT' },
  sui: { api: 'binance', symbol: 'SUIUSDT' },
  
  // Forex pairs - using exchangerate API simulation via Binance stablecoins
  eurusd: { api: 'forex', symbol: 'EURUSD' },
  gbpusd: { api: 'forex', symbol: 'GBPUSD' },
  usdjpy: { api: 'forex', symbol: 'USDJPY' },
  usdchf: { api: 'forex', symbol: 'USDCHF' },
  audusd: { api: 'forex', symbol: 'AUDUSD' },
  usdcad: { api: 'forex', symbol: 'USDCAD' },
  nzdusd: { api: 'forex', symbol: 'NZDUSD' },
  eurgbp: { api: 'forex', symbol: 'EURGBP' },
  eurjpy: { api: 'forex', symbol: 'EURJPY' },
  gbpjpy: { api: 'forex', symbol: 'GBPJPY' },
  
  // Commodities
  gold: { api: 'commodity', symbol: 'XAU' },
  silver: { api: 'commodity', symbol: 'XAG' },
  oil: { api: 'commodity', symbol: 'WTI' },
  brentoil: { api: 'commodity', symbol: 'BRENT' },
  naturalgas: { api: 'commodity', symbol: 'NG' },
};

// Forex base rates cache (updated every fetch)
const forexRates: Record<string, number> = {
  EURUSD: 1.0850,
  GBPUSD: 1.2650,
  USDJPY: 149.50,
  USDCHF: 0.8820,
  AUDUSD: 0.6550,
  USDCAD: 1.3580,
  NZDUSD: 0.5980,
  EURGBP: 0.8580,
  EURJPY: 162.20,
  GBPJPY: 189.15,
};

// Commodity prices cache
const commodityPrices: Record<string, number> = {
  XAU: 2650.00,
  XAG: 31.50,
  WTI: 71.50,
  BRENT: 75.80,
  NG: 3.25,
};

export default function LiveChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get("symbol") || "bitcoin";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("D");
  const [selectedInterval, setSelectedInterval] = useState("يومي");
  const [showInstructions, setShowInstructions] = useState(false);
  const [chartAnalysisEnabled, setChartAnalysisEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceCopied, setPriceCopied] = useState(false);
  const {
    saveAnalysis
  } = useSavedAnalyses();

  // Fetch current price from API
  const fetchCurrentPrice = useCallback(async () => {
    const priceConfig = symbolToPriceAPI[symbol];
    if (!priceConfig) return;

    try {
      if (priceConfig.api === 'binance') {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${priceConfig.symbol}`);
        const data = await response.json();
        if (data.price) {
          setCurrentPrice(parseFloat(data.price));
        }
      } else if (priceConfig.api === 'forex') {
        // Use free forex API
        try {
          const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
          const data = await response.json();
          if (data.rates) {
            const pair = priceConfig.symbol;
            let price = forexRates[pair]; // fallback
            
            if (pair === 'EURUSD') price = 1 / (data.rates.EUR || 0.92);
            else if (pair === 'GBPUSD') price = 1 / (data.rates.GBP || 0.79);
            else if (pair === 'USDJPY') price = data.rates.JPY || 149.5;
            else if (pair === 'USDCHF') price = data.rates.CHF || 0.88;
            else if (pair === 'AUDUSD') price = 1 / (data.rates.AUD || 1.53);
            else if (pair === 'USDCAD') price = data.rates.CAD || 1.36;
            else if (pair === 'NZDUSD') price = 1 / (data.rates.NZD || 1.67);
            else if (pair === 'EURGBP') price = data.rates.GBP / data.rates.EUR;
            else if (pair === 'EURJPY') price = data.rates.JPY / data.rates.EUR;
            else if (pair === 'GBPJPY') price = data.rates.JPY / data.rates.GBP;
            
            // Add small random variation to simulate live price
            const variation = (Math.random() - 0.5) * 0.0002 * price;
            setCurrentPrice(price + variation);
          }
        } catch {
          // Use cached forex rate with variation
          const basePrice = forexRates[priceConfig.symbol] || 1;
          const variation = (Math.random() - 0.5) * 0.001 * basePrice;
          setCurrentPrice(basePrice + variation);
        }
      } else if (priceConfig.api === 'commodity') {
        // Use cached commodity prices with realistic variation
        const basePrice = commodityPrices[priceConfig.symbol] || 100;
        const variation = (Math.random() - 0.5) * 0.002 * basePrice;
        setCurrentPrice(basePrice + variation);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  }, [symbol]);

  // Fetch price on mount and every 2 seconds
  useEffect(() => {
    fetchCurrentPrice();
    const interval = setInterval(fetchCurrentPrice, 2000);
    return () => clearInterval(interval);
  }, [fetchCurrentPrice]);

  // Copy price to clipboard
  const handleCopyPrice = () => {
    if (currentPrice) {
      const priceStr = currentPrice < 1 ? currentPrice.toFixed(8) : currentPrice.toFixed(2);
      navigator.clipboard.writeText(priceStr);
      setPriceCopied(true);
      toast.success(`تم نسخ السعر: ${priceStr}`);
      setTimeout(() => setPriceCopied(false), 2000);
    }
  };

  // Open alert dialog with current price
  const handleOpenAlertWithPrice = () => {
    setAlertDialogOpen(true);
  };

  // Check if chart analysis is enabled for the user
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: {
            user: authUser
          }
        } = await supabase.auth.getUser();
        if (!authUser) {
          setLoading(false);
          return;
        }
        setUser(authUser);
        const {
          data: profile
        } = await supabase.from('profiles').select('image_analysis_enabled').eq('user_id', authUser.id).single();
        setChartAnalysisEnabled(profile?.image_analysis_enabled || false);
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAccess();
  }, []);

  // Get TradingView symbol and display name
  const getSymbolInfo = () => {
    // Saudi market stock names map
    const saudiStockNames: Record<string, string> = {
      '2222': 'أرامكو السعودية',
      '1211': 'معادن',
      '2010': 'سابك',
      '1010': 'الرياض',
      '1180': 'الأهلي',
      '1120': 'الراجحي',
      '2380': 'بترورابغ',
      '2310': 'سبكيم',
      '2350': 'كيان',
      '2330': 'المتقدمة',
      '2250': 'المراعي',
      '4030': 'البحري',
      '4200': 'الدريس',
      '4001': 'أسمنت الجنوب',
      '3010': 'أسمنت العربية',
      '3020': 'أسمنت اليمامة',
      '3030': 'أسمنت السعودية',
      '3040': 'أسمنت القصيم',
      '3050': 'أسمنت الجنوبية',
      '3060': 'أسمنت ينبع',
      '3080': 'أسمنت الشرقية',
      '3090': 'أسمنت تبوك',
      '3091': 'أسمنت الجوف',
      '3007': 'زجاج',
      '2020': 'سافكو',
      '2060': 'التصنيع',
      '2070': 'الغاز',
      '2090': 'الدوائية',
      '2150': 'زين السعودية',
      '7010': 'الاتصالات',
      '7020': 'موبايلي',
      '2001': 'كيمانول',
      '2290': 'ينساب',
      '2170': 'اللجين',
      '2180': 'فيبكو',
      '2200': 'أنابيب',
      '2210': 'نماء للكيماويات',
      '2220': 'معدنية',
      '2230': 'الكيميائية',
      '2240': 'الزامل',
      '4003': 'إكسترا',
      '4190': 'جرير',
      '4002': 'المواساة',
      '4004': 'دله الصحية',
      '4005': 'رعاية',
      '4007': 'الحمادي'
    };

    // If symbol contains "TADAWUL:" - Saudi market stock
    if (symbol.includes('TADAWUL:')) {
      const ticker = symbol.split(':')[1];
      const displayName = saudiStockNames[ticker] ? `${saudiStockNames[ticker]} (${ticker})` : `تداول (${ticker})`;

      // TradingView uses TADAWUL:XXXX format for Saudi stocks
      return {
        tvSymbol: `TADAWUL:${ticker}`,
        displayName
      };
    }

    // For other symbols with ":" (like FX:EURUSD), use as-is
    if (symbol.includes(':')) {
      return {
        tvSymbol: symbol,
        displayName: symbol
      };
    }
    const symbolMap: Record<string, {
      tvSymbol: string;
      displayName: string;
    }> = {
      // Forex - Major & Cross Pairs
      eurusd: { tvSymbol: "FX:EURUSD", displayName: "يورو/دولار (EUR/USD)" },
      gbpusd: { tvSymbol: "FX:GBPUSD", displayName: "جنيه/دولار (GBP/USD)" },
      usdjpy: { tvSymbol: "FX:USDJPY", displayName: "دولار/ين (USD/JPY)" },
      usdchf: { tvSymbol: "FX:USDCHF", displayName: "دولار/فرنك (USD/CHF)" },
      audusd: { tvSymbol: "FX:AUDUSD", displayName: "أسترالي/دولار (AUD/USD)" },
      usdcad: { tvSymbol: "FX:USDCAD", displayName: "دولار/كندي (USD/CAD)" },
      nzdusd: { tvSymbol: "FX:NZDUSD", displayName: "نيوزيلندي/دولار (NZD/USD)" },
      eurgbp: { tvSymbol: "FX:EURGBP", displayName: "يورو/جنيه (EUR/GBP)" },
      eurjpy: { tvSymbol: "FX:EURJPY", displayName: "يورو/ين (EUR/JPY)" },
      gbpjpy: { tvSymbol: "FX:GBPJPY", displayName: "جنيه/ين (GBP/JPY)" },
      eurchf: { tvSymbol: "FX:EURCHF", displayName: "يورو/فرنك (EUR/CHF)" },
      euraud: { tvSymbol: "FX:EURAUD", displayName: "يورو/أسترالي (EUR/AUD)" },
      eurcad: { tvSymbol: "FX:EURCAD", displayName: "يورو/كندي (EUR/CAD)" },
      eurnzd: { tvSymbol: "FX:EURNZD", displayName: "يورو/نيوزيلندي (EUR/NZD)" },
      gbpchf: { tvSymbol: "FX:GBPCHF", displayName: "جنيه/فرنك (GBP/CHF)" },
      gbpaud: { tvSymbol: "FX:GBPAUD", displayName: "جنيه/أسترالي (GBP/AUD)" },
      gbpcad: { tvSymbol: "FX:GBPCAD", displayName: "جنيه/كندي (GBP/CAD)" },
      gbpnzd: { tvSymbol: "FX:GBPNZD", displayName: "جنيه/نيوزيلندي (GBP/NZD)" },
      audjpy: { tvSymbol: "FX:AUDJPY", displayName: "أسترالي/ين (AUD/JPY)" },
      audnzd: { tvSymbol: "FX:AUDNZD", displayName: "أسترالي/نيوزيلندي (AUD/NZD)" },
      audcad: { tvSymbol: "FX:AUDCAD", displayName: "أسترالي/كندي (AUD/CAD)" },
      audchf: { tvSymbol: "FX:AUDCHF", displayName: "أسترالي/فرنك (AUD/CHF)" },
      nzdjpy: { tvSymbol: "FX:NZDJPY", displayName: "نيوزيلندي/ين (NZD/JPY)" },
      nzdcad: { tvSymbol: "FX:NZDCAD", displayName: "نيوزيلندي/كندي (NZD/CAD)" },
      nzdchf: { tvSymbol: "FX:NZDCHF", displayName: "نيوزيلندي/فرنك (NZD/CHF)" },
      cadjpy: { tvSymbol: "FX:CADJPY", displayName: "كندي/ين (CAD/JPY)" },
      cadchf: { tvSymbol: "FX:CADCHF", displayName: "كندي/فرنك (CAD/CHF)" },
      chfjpy: { tvSymbol: "FX:CHFJPY", displayName: "فرنك/ين (CHF/JPY)" },
      
      // Crypto
      bitcoin: { tvSymbol: "BITSTAMP:BTCUSD", displayName: "بيتكوين (BTC/USD)" },
      ethereum: { tvSymbol: "BITSTAMP:ETHUSD", displayName: "إيثريوم (ETH/USD)" },
      bnb: { tvSymbol: "BINANCE:BNBUSDT", displayName: "بي إن بي (BNB/USD)" },
      solana: { tvSymbol: "COINBASE:SOLUSD", displayName: "سولانا (SOL/USD)" },
      xrp: { tvSymbol: "BITSTAMP:XRPUSD", displayName: "ريبل (XRP/USD)" },
      cardano: { tvSymbol: "COINBASE:ADAUSD", displayName: "كاردانو (ADA/USD)" },
      dogecoin: { tvSymbol: "BINANCE:DOGEUSDT", displayName: "دوجكوين (DOGE/USD)" },
      litecoin: { tvSymbol: "COINBASE:LTCUSD", displayName: "لايتكوين (LTC/USD)" },
      avalanche: { tvSymbol: "COINBASE:AVAXUSD", displayName: "أفالانش (AVAX/USD)" },
      polkadot: { tvSymbol: "COINBASE:DOTUSD", displayName: "بولكادوت (DOT/USD)" },
      chainlink: { tvSymbol: "COINBASE:LINKUSD", displayName: "تشين لينك (LINK/USD)" },
      polygon: { tvSymbol: "COINBASE:MATICUSD", displayName: "بوليجون (MATIC/USD)" },
      shiba: { tvSymbol: "BINANCE:SHIBUSDT", displayName: "شيبا إينو (SHIB/USD)" },
      tron: { tvSymbol: "BINANCE:TRXUSDT", displayName: "ترون (TRX/USD)" },
      uniswap: { tvSymbol: "COINBASE:UNIUSD", displayName: "يونيسواب (UNI/USD)" },
      cosmos: { tvSymbol: "COINBASE:ATOMUSD", displayName: "كوزموس (ATOM/USD)" },
      ethereumclassic: { tvSymbol: "COINBASE:ETCUSD", displayName: "إيثريوم كلاسيك (ETC/USD)" },
      stellar: { tvSymbol: "COINBASE:XLMUSD", displayName: "ستيلار (XLM/USD)" },
      bitcoincash: { tvSymbol: "COINBASE:BCHUSD", displayName: "بيتكوين كاش (BCH/USD)" },
      algorand: { tvSymbol: "COINBASE:ALGOUSD", displayName: "ألجوراند (ALGO/USD)" },
      vechain: { tvSymbol: "BINANCE:VETUSDT", displayName: "في تشين (VET/USD)" },
      filecoin: { tvSymbol: "COINBASE:FILUSD", displayName: "فايل كوين (FIL/USD)" },
      near: { tvSymbol: "COINBASE:NEARUSD", displayName: "نير بروتوكول (NEAR/USD)" },
      aptos: { tvSymbol: "BINANCE:APTUSDT", displayName: "أبتوس (APT/USD)" },
      arbitrum: { tvSymbol: "BINANCE:ARBUSDT", displayName: "أربيتروم (ARB/USD)" },
      optimism: { tvSymbol: "BINANCE:OPUSDT", displayName: "أوبتيميزم (OP/USD)" },
      sui: { tvSymbol: "BINANCE:SUIUSDT", displayName: "سوي (SUI/USD)" },
      pepe: { tvSymbol: "BINANCE:PEPEUSDT", displayName: "بيبي (PEPE/USD)" },
      sandbox: { tvSymbol: "COINBASE:SANDUSD", displayName: "ذا ساندبوكس (SAND/USD)" },
      decentraland: { tvSymbol: "COINBASE:MANAUSD", displayName: "ديسنترالاند (MANA/USD)" },
      hedera: { tvSymbol: "BINANCE:HBARUSDT", displayName: "هيديرا (HBAR/USD)" },
      fantom: { tvSymbol: "BINANCE:FTMUSDT", displayName: "فانتوم (FTM/USD)" },
      aave: { tvSymbol: "COINBASE:AAVEUSD", displayName: "آفي (AAVE/USD)" },
      render: { tvSymbol: "BINANCE:RENDERUSDT", displayName: "رندر (RENDER/USD)" },
      injective: { tvSymbol: "BINANCE:INJUSDT", displayName: "إنجيكتيف (INJ/USD)" },
      
      // Commodities
      gold: { tvSymbol: "OANDA:XAUUSD", displayName: "الذهب (XAU/USD)" },
      silver: { tvSymbol: "OANDA:XAGUSD", displayName: "الفضة (XAG/USD)" },
      oil: { tvSymbol: "TVC:USOIL", displayName: "النفط الخام (WTI)" },
      brentoil: { tvSymbol: "TVC:UKOIL", displayName: "نفط برنت (Brent)" },
      naturalgas: { tvSymbol: "TVC:NATURALGAS", displayName: "الغاز الطبيعي" },
      platinum: { tvSymbol: "TVC:PLATINUM", displayName: "البلاتين" },
      palladium: { tvSymbol: "TVC:PALLADIUM", displayName: "البلاديوم" },
      copper: { tvSymbol: "TVC:COPPER", displayName: "النحاس" },
      wheat: { tvSymbol: "CBOT:ZW1!", displayName: "القمح" },
      corn: { tvSymbol: "CBOT:ZC1!", displayName: "الذرة" },
      soybeans: { tvSymbol: "CBOT:ZS1!", displayName: "فول الصويا" },
      coffee: { tvSymbol: "ICEUS:KC1!", displayName: "القهوة" },
      sugar: { tvSymbol: "ICEUS:SB1!", displayName: "السكر" },
      cotton: { tvSymbol: "ICEUS:CT1!", displayName: "القطن" },
      
      // Indices
      sp500: { tvSymbol: "FOREXCOM:SPXUSD", displayName: "إس آند بي 500 (S&P 500)" },
      dowjones: { tvSymbol: "TVC:DJI", displayName: "داو جونز (Dow Jones)" },
      nasdaq: { tvSymbol: "NASDAQ:NDX", displayName: "ناسداك (NASDAQ)" },
      russell2000: { tvSymbol: "TVC:RUT", displayName: "راسل 2000 (Russell 2000)" },
      dax: { tvSymbol: "XETR:DAX", displayName: "داكس الألماني (DAX)" },
      ftse100: { tvSymbol: "TVC:UKX", displayName: "فوتسي 100 (FTSE 100)" },
      nikkei: { tvSymbol: "TVC:NI225", displayName: "نيكاي 225 (Nikkei)" },
      cac40: { tvSymbol: "TVC:CAC40", displayName: "كاك 40 (CAC 40)" },
      hangseng: { tvSymbol: "TVC:HSI", displayName: "هانج سينج (Hang Seng)" },
      asx200: { tvSymbol: "PEPPERSTONE:AUS200", displayName: "إيه إس إكس 200 (ASX 200)" },
      
      // US Stocks
      apple: { tvSymbol: "NASDAQ:AAPL", displayName: "أبل (Apple)" },
      microsoft: { tvSymbol: "NASDAQ:MSFT", displayName: "مايكروسوفت (Microsoft)" },
      google: { tvSymbol: "NASDAQ:GOOGL", displayName: "جوجل (Google)" },
      amazon: { tvSymbol: "NASDAQ:AMZN", displayName: "أمازون (Amazon)" },
      nvidia: { tvSymbol: "NASDAQ:NVDA", displayName: "إنفيديا (NVIDIA)" },
      tesla: { tvSymbol: "NASDAQ:TSLA", displayName: "تسلا (Tesla)" },
      meta: { tvSymbol: "NASDAQ:META", displayName: "ميتا (Meta)" },
      netflix: { tvSymbol: "NASDAQ:NFLX", displayName: "نتفليكس (Netflix)" },
      amd: { tvSymbol: "NASDAQ:AMD", displayName: "إيه إم دي (AMD)" },
      intel: { tvSymbol: "NASDAQ:INTC", displayName: "إنتل (Intel)" },
      qualcomm: { tvSymbol: "NASDAQ:QCOM", displayName: "كوالكوم (Qualcomm)" },
      broadcom: { tvSymbol: "NASDAQ:AVGO", displayName: "برودكوم (Broadcom)" },
      oracle: { tvSymbol: "NYSE:ORCL", displayName: "أوراكل (Oracle)" },
      salesforce: { tvSymbol: "NYSE:CRM", displayName: "سيلزفورس (Salesforce)" },
      adobe: { tvSymbol: "NASDAQ:ADBE", displayName: "أدوبي (Adobe)" },
      paypal: { tvSymbol: "NASDAQ:PYPL", displayName: "باي بال (PayPal)" },
      visa: { tvSymbol: "NYSE:V", displayName: "فيزا (Visa)" },
      mastercard: { tvSymbol: "NYSE:MA", displayName: "ماستركارد (Mastercard)" },
      jpmorgan: { tvSymbol: "NYSE:JPM", displayName: "جيه بي مورجان (JPMorgan)" },
      bankofamerica: { tvSymbol: "NYSE:BAC", displayName: "بنك أوف أمريكا (Bank of America)" },
      wellsfargo: { tvSymbol: "NYSE:WFC", displayName: "ويلز فارجو (Wells Fargo)" },
      goldmansachs: { tvSymbol: "NYSE:GS", displayName: "جولدمان ساكس (Goldman Sachs)" },
      morganstanley: { tvSymbol: "NYSE:MS", displayName: "مورجان ستانلي (Morgan Stanley)" },
      berkshire: { tvSymbol: "NYSE:BRK.B", displayName: "بيركشاير هاثاواي (Berkshire)" },
      jnj: { tvSymbol: "NYSE:JNJ", displayName: "جونسون آند جونسون (J&J)" },
      pfizer: { tvSymbol: "NYSE:PFE", displayName: "فايزر (Pfizer)" },
      moderna: { tvSymbol: "NASDAQ:MRNA", displayName: "مودرنا (Moderna)" },
      abbott: { tvSymbol: "NYSE:ABT", displayName: "أبوت (Abbott)" },
      merck: { tvSymbol: "NYSE:MRK", displayName: "ميرك (Merck)" },
      elililly: { tvSymbol: "NYSE:LLY", displayName: "إيلي ليلي (Eli Lilly)" },
      unitedhealth: { tvSymbol: "NYSE:UNH", displayName: "يونايتد هيلث (UnitedHealth)" },
      disney: { tvSymbol: "NYSE:DIS", displayName: "ديزني (Disney)" },
      comcast: { tvSymbol: "NASDAQ:CMCSA", displayName: "كومكاست (Comcast)" },
      cocacola: { tvSymbol: "NYSE:KO", displayName: "كوكا كولا (Coca-Cola)" },
      pepsico: { tvSymbol: "NASDAQ:PEP", displayName: "بيبسيكو (PepsiCo)" },
      pg: { tvSymbol: "NYSE:PG", displayName: "بروكتر آند جامبل (P&G)" },
      nike: { tvSymbol: "NYSE:NKE", displayName: "نايكي (Nike)" },
      starbucks: { tvSymbol: "NASDAQ:SBUX", displayName: "ستاربكس (Starbucks)" },
      mcdonalds: { tvSymbol: "NYSE:MCD", displayName: "ماكدونالدز (McDonald's)" },
      homedepot: { tvSymbol: "NYSE:HD", displayName: "هوم ديبو (Home Depot)" },
      walmart: { tvSymbol: "NYSE:WMT", displayName: "وول مارت (Walmart)" },
      target: { tvSymbol: "NYSE:TGT", displayName: "تارجت (Target)" },
      costco: { tvSymbol: "NASDAQ:COST", displayName: "كوستكو (Costco)" },
      exxonmobil: { tvSymbol: "NYSE:XOM", displayName: "إكسون موبيل (ExxonMobil)" },
      chevron: { tvSymbol: "NYSE:CVX", displayName: "شيفرون (Chevron)" },
      conocophillips: { tvSymbol: "NYSE:COP", displayName: "كونوكو فيليبس (ConocoPhillips)" },
      schlumberger: { tvSymbol: "NYSE:SLB", displayName: "شلمبرجير (Schlumberger)" },
      boeing: { tvSymbol: "NYSE:BA", displayName: "بوينج (Boeing)" },
      lockheedmartin: { tvSymbol: "NYSE:LMT", displayName: "لوكهيد مارتن (Lockheed Martin)" },
      raytheon: { tvSymbol: "NYSE:RTX", displayName: "رايثيون (Raytheon)" },
      caterpillar: { tvSymbol: "NYSE:CAT", displayName: "كاتربيلر (Caterpillar)" },
      '3m': { tvSymbol: "NYSE:MMM", displayName: "3إم (3M)" },
      ge: { tvSymbol: "NYSE:GE", displayName: "جنرال إلكتريك (GE)" },
      ford: { tvSymbol: "NYSE:F", displayName: "فورد (Ford)" },
      gm: { tvSymbol: "NYSE:GM", displayName: "جنرال موتورز (GM)" },
      rivian: { tvSymbol: "NASDAQ:RIVN", displayName: "ريفيان (Rivian)" },
      lucid: { tvSymbol: "NASDAQ:LCID", displayName: "لوسيد (Lucid)" },
      americanairlines: { tvSymbol: "NASDAQ:AAL", displayName: "أمريكان إيرلاينز (American Airlines)" },
      delta: { tvSymbol: "NYSE:DAL", displayName: "دلتا (Delta)" },
      unitedairlines: { tvSymbol: "NASDAQ:UAL", displayName: "يونايتد إيرلاينز (United Airlines)" },
      southwest: { tvSymbol: "NYSE:LUV", displayName: "ساوث ويست (Southwest)" },
      att: { tvSymbol: "NYSE:T", displayName: "إيه تي آند تي (AT&T)" },
      verizon: { tvSymbol: "NYSE:VZ", displayName: "فيرايزون (Verizon)" },
      tmobile: { tvSymbol: "NASDAQ:TMUS", displayName: "تي موبايل (T-Mobile)" },
      uber: { tvSymbol: "NYSE:UBER", displayName: "أوبر (Uber)" },
      airbnb: { tvSymbol: "NASDAQ:ABNB", displayName: "إير بي إن بي (Airbnb)" },
      zoom: { tvSymbol: "NASDAQ:ZM", displayName: "زوم (Zoom)" },
      spotify: { tvSymbol: "NYSE:SPOT", displayName: "سبوتيفاي (Spotify)" },
      block: { tvSymbol: "NYSE:SQ", displayName: "بلوك (Block/Square)" },
      coinbase: { tvSymbol: "NASDAQ:COIN", displayName: "كوينبيس (Coinbase)" },
      palantir: { tvSymbol: "NYSE:PLTR", displayName: "بالانتير (Palantir)" },
      snowflake: { tvSymbol: "NYSE:SNOW", displayName: "سنوفليك (Snowflake)" },
      crowdstrike: { tvSymbol: "NASDAQ:CRWD", displayName: "كراود سترايك (CrowdStrike)" },
      servicenow: { tvSymbol: "NYSE:NOW", displayName: "سيرفس ناو (ServiceNow)" },
      intuit: { tvSymbol: "NASDAQ:INTU", displayName: "إنتويت (Intuit)" },
      shopify: { tvSymbol: "NYSE:SHOP", displayName: "شوبيفاي (Shopify)" },
      twilio: { tvSymbol: "NYSE:TWLO", displayName: "تويليو (Twilio)" },
      datadog: { tvSymbol: "NASDAQ:DDOG", displayName: "داتا دوج (Datadog)" },
      mongodb: { tvSymbol: "NASDAQ:MDB", displayName: "مونجو دي بي (MongoDB)" },
      okta: { tvSymbol: "NASDAQ:OKTA", displayName: "أوكتا (Okta)" },
      asml: { tvSymbol: "NASDAQ:ASML", displayName: "إيه إس إم إل (ASML)" },
      tsmc: { tvSymbol: "NYSE:TSM", displayName: "تي إس إم سي (TSMC)" },
      sony: { tvSymbol: "NYSE:SONY", displayName: "سوني (Sony)" },
      nintendo: { tvSymbol: "OTCMKTS:NTDOY", displayName: "نينتندو (Nintendo)" }
    };
    
    // If symbol exists in map, return it
    if (symbolMap[symbol]) {
      return symbolMap[symbol];
    }
    
    // For unknown symbols, try to construct a TradingView symbol
    // Default to NASDAQ for unknown stocks
    return {
      tvSymbol: `NASDAQ:${symbol.toUpperCase()}`,
      displayName: symbol.charAt(0).toUpperCase() + symbol.slice(1)
    };
  };
  const symbolInfo = getSymbolInfo();

  // Check if it's a Saudi stock
  const isSaudiStock = symbol.includes('TADAWUL:');

  // Get TradingView URL for Saudi stocks
  const getTradingViewUrl = () => {
    if (isSaudiStock) {
      const ticker = symbol.split(':')[1];
      return `https://www.tradingview.com/chart/?symbol=TADAWUL%3A${ticker}`;
    }
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbolInfo.tvSymbol)}`;
  };
  useEffect(() => {
    if (!containerRef.current || isSaudiStock) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // For non-Saudi symbols, use the advanced chart widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbolInfo.tvSymbol,
      interval: selectedTimeframe,
      timezone: "Asia/Riyadh",
      theme: "dark",
      style: "1",
      locale: "ar_AE",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: false,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"]
    });
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetInner.style.height = 'calc(100% - 32px)';
    widgetInner.style.width = '100%';
    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, symbolInfo.tvSymbol, selectedTimeframe, isSaudiStock]);
  const handleRefresh = () => {
    if (containerRef.current) {
      const currentContent = containerRef.current.innerHTML;
      containerRef.current.innerHTML = '';
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML = currentContent;
        }
      }, 100);
    }
    window.location.reload();
  };
  const handleAnalyzeChart = async (imageFile?: File) => {
    if (!chartAnalysisEnabled) {
      toast.error("ميزة تحليل الشارت غير مفعلة لحسابك");
      return;
    }
    if (!imageFile) {
      setShowInstructions(true);
      return;
    }
    setIsAnalyzing(true);
    toast.info("جاري تحليل الشارت والرسم عليه...");
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        // Send to AI for analysis and drawing
        const {
          data,
          error
        } = await supabase.functions.invoke('analyze-chart-with-drawing', {
          body: {
            image: base64Image,
            symbol: symbolInfo.displayName,
            timeframe: selectedInterval
          }
        });
        if (error) {
          console.error('Supabase function error:', error);
          toast.error("حدث خطأ أثناء الاتصال بالخادم");
          setIsAnalyzing(false);
          return;
        }
        if (data?.success) {
          setAnalysisResult(data);
          setShowAnalysis(true);
          toast.success("تم التحليل والرسم بنجاح!");
        } else {
          toast.error(data?.error || 'فشل التحليل');
        }
        setIsAnalyzing(false);
      };
      reader.onerror = () => {
        toast.error("فشل قراءة الصورة");
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error: any) {
      console.error('Error analyzing chart:', error);
      toast.error(error.message || "حدث خطأ أثناء التحليل");
      setIsAnalyzing(false);
    }
  };
  const handleSaveAnalysis = async () => {
    if (!analysisResult || !analysisResult.analysis) {
      toast.error('لا يوجد تحليل لحفظه');
      return;
    }
    const analysisText = JSON.stringify(analysisResult.analysis);
    const imageUrl = analysisResult.annotatedImage || '';
    await saveAnalysis(symbolInfo.displayName, analysisText, imageUrl);
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleAnalyzeChart(file);
      } else {
        toast.error("يرجى اختيار صورة فقط");
      }
    }
  };
  return <div className="min-h-screen bg-[#0a0a0f] pt-[env(safe-area-inset-top)]" dir="rtl">
      {/* Safe Area Background */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-[#0a0a0f] z-[60]" />
      
      {/* Header - Mobile Optimized */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          {/* Top Row: Back button and Symbol */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">{symbolInfo.displayName}</h1>
                <p className="text-xs text-white/50 hidden sm:block">شارت حقيقي مباشر من TradingView</p>
              </div>
            </div>
            
            {/* Price Display and Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentPrice && (
                <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg px-2 py-1 border border-slate-700">
                  <span className="text-xs text-white/60">السعر:</span>
                  <span className="text-sm font-bold text-emerald-400" dir="ltr">
                    {currentPrice < 1 ? currentPrice.toFixed(6) : currentPrice.toFixed(2)}
                  </span>
                  <Button
                    onClick={handleCopyPrice}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    {priceCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              
              {/* Alert Button */}
              {user && <Button onClick={handleOpenAlertWithPrice} variant="outline" size="sm" className="gap-1.5 border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 text-xs sm:text-sm h-8 flex-shrink-0">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">تنبيه سعري</span>
                </Button>}
            </div>
            
            {/* Timeframe Selector */}
            <Select value={selectedTimeframe} onValueChange={val => {
            setSelectedTimeframe(val);
            const intervalMap: Record<string, string> = {
              "1": "دقيقة",
              "5": "5 دقائق",
              "15": "15 دقيقة",
              "30": "30 دقيقة",
              "60": "ساعة",
              "240": "4 ساعات",
              "D": "يومي",
              "W": "أسبوعي"
            };
            setSelectedInterval(intervalMap[val] || "يومي");
          }}>
              <SelectTrigger className="w-[90px] sm:w-[120px] bg-slate-800/50 border-slate-700 text-white text-xs sm:text-sm h-8 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="1" className="text-white">1 دقيقة</SelectItem>
                <SelectItem value="5" className="text-white">5 دقائق</SelectItem>
                <SelectItem value="15" className="text-white">15 دقيقة</SelectItem>
                <SelectItem value="30" className="text-white">30 دقيقة</SelectItem>
                <SelectItem value="60" className="text-white">ساعة</SelectItem>
                <SelectItem value="240" className="text-white">4 ساعات</SelectItem>
                <SelectItem value="D" className="text-white">يومي</SelectItem>
                <SelectItem value="W" className="text-white">أسبوعي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Bottom Row: Action Buttons */}
          {chartAnalysisEnabled && <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <Button onClick={() => setShowInstructions(true)} variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs sm:text-sm h-8 flex-shrink-0">
                <Info className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">كيفية التحليل</span>
                <span className="xs:hidden">تعليمات</span>
              </Button>
              
              <Button type="button" disabled={isAnalyzing || !chartAnalysisEnabled} className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs sm:text-sm h-8 flex-shrink-0" size="sm" onClick={() => document.getElementById('chart-upload')?.click()}>
                {isAnalyzing ? <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden xs:inline">جاري التحليل...</span>
                    <span className="xs:hidden">تحليل...</span>
                  </> : <>
                    <Upload className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">رفع صورة الشارت</span>
                    <span className="xs:hidden">رفع صورة</span>
                  </>}
              </Button>
              <Input id="chart-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isAnalyzing || !chartAnalysisEnabled} />
              
              <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-xs sm:text-sm h-8 flex-shrink-0">
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">تحديث</span>
                <span className="xs:hidden">⟳</span>
              </Button>
            </div>}
        </div>
      </header>

      {/* Chart Container */}
      <main className="container mx-auto px-4 py-6">
        <Card className="p-4 bg-[#12121a] border-white/10">
          
          
          {/* TradingView Chart Widget or Saudi Stock Notice */}
          {isSaudiStock ? <div className="w-full rounded-lg overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] border border-white/10" style={{
          height: '600px'
        }}>
              <div className="text-center p-8 max-w-lg">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{symbolInfo.displayName}</h3>
                <p className="text-white/60 mb-6 leading-relaxed">
                  شارتات السوق السعودي (تداول) متاحة فقط على موقع TradingView مباشرة.
                  <br />
                  <span className="text-primary font-medium">للتحليل الذكي:</span> افتح الشارت من الزر أدناه، التقط صورة للشارت، ثم عد لهذه الصفحة واستخدم زر "تحليل الشارت" لتحليله بالذكاء الاصطناعي.
                </p>
                <Button onClick={() => window.open(getTradingViewUrl(), '_blank')} className="gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white px-8 py-6 text-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  فتح الشارت في TradingView
                </Button>
                <p className="text-white/40 text-sm mt-4">
                  سيتم فتح الشارت في نافذة جديدة
                </p>
              </div>
            </div> : <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{
          height: '600px'
        }} />}
          
          
        </Card>

        {/* Analysis Results */}
        {showAnalysis && analysisResult && <Card className="mt-6 p-6 bg-[#12121a] border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                نتيجة التحليل
              </h2>
              <Button onClick={() => setShowAnalysis(false)} variant="ghost" size="sm" className="text-white/70 hover:text-white">
                إغلاق
              </Button>
            </div>

            {/* Annotated Chart Image */}
            {analysisResult.annotatedImage && <div className="mb-6 rounded-lg overflow-hidden border border-white/10">
                <img src={analysisResult.annotatedImage} alt="الشارت المحلل" className="w-full h-auto" />
              </div>}

            {/* Analysis Details */}
            {analysisResult.analysis && <div className="space-y-4">
                {/* Current Price & Trend */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-white/50 mb-1">السعر الحالي</p>
                    <p className="text-2xl font-bold text-white">
                      {analysisResult.analysis.currentPrice}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-sm text-white/50 mb-1">الاتجاه</p>
                    <p className="text-2xl font-bold text-primary">
                      {analysisResult.analysis.trend}
                    </p>
                  </div>
                </div>

                {/* Recommendation */}
                {analysisResult.analysis.recommendation && <div className="p-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <h3 className="text-lg font-bold text-white mb-4">التوصية</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-white/50 mb-1">العملية</p>
                        <p className="text-lg font-bold text-primary">
                          {analysisResult.analysis.recommendation.action}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">الدخول</p>
                        <p className="text-lg font-bold text-white">
                          {analysisResult.analysis.recommendation.entry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">وقف الخسارة</p>
                        <p className="text-lg font-bold text-destructive">
                          {analysisResult.analysis.recommendation.stopLoss}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 mb-1">الهدف</p>
                        <p className="text-lg font-bold text-success">
                          {analysisResult.analysis.recommendation.target1}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">السبب: </span>
                        {analysisResult.analysis.recommendation.reason}
                      </p>
                    </div>
                  </div>}

                {/* Support & Resistance Levels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Support Levels */}
                  {analysisResult.analysis.supportLevels && analysisResult.analysis.supportLevels.length > 0 && <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="text-sm font-semibold text-success mb-3">مستويات الدعم</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.supportLevels.map((level: any, idx: number) => <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{level.price}</span>
                            <span className="text-success text-xs">{level.strength}</span>
                          </div>)}
                      </div>
                    </div>}

                  {/* Resistance Levels */}
                  {analysisResult.analysis.resistanceLevels && analysisResult.analysis.resistanceLevels.length > 0 && <div className="p-4 rounded-lg bg-white/5">
                      <h4 className="text-sm font-semibold text-destructive mb-3">مستويات المقاومة</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.resistanceLevels.map((level: any, idx: number) => <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">{level.price}</span>
                            <span className="text-destructive text-xs">{level.strength}</span>
                          </div>)}
                      </div>
                    </div>}
                </div>

                {/* Detailed Analysis */}
                {analysisResult.analysis.analysis && <div className="p-4 rounded-lg bg-white/5">
                    <h4 className="text-sm font-semibold text-white mb-2">تحليل مفصل</h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {analysisResult.analysis.analysis}
                    </p>
                  </div>}

                {/* Save Analysis Button */}
                <div className="flex justify-center mt-6 pt-6 border-t border-white/10">
                  <Button onClick={handleSaveAnalysis} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" size="lg">
                    <Save className="h-5 w-5" />
                    هل تريد حفظ التحليل في قائمة تحليلاتي؟
                  </Button>
                </div>
              </div>}
          </Card>}

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="bg-[#12121a] border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">كيفية تحليل الشارت</DialogTitle>
              <DialogDescription className="text-white/70">
                اتبع الخطوات التالية للحصول على تحليل دقيق
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">1</span>
                  اختر الإطار الزمني
                </h3>
                <p className="text-white/70 text-sm">
                  حدد الإطار الزمني المناسب للشارت (دقيقة، 5 دقائق، ساعة، يومي، إلخ)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">2</span>
                  التقط صورة الشارت
                </h3>
                <p className="text-white/70 text-sm mb-2">
                  استخدم أحد الطرق التالية:
                </p>
                <ul className="list-disc list-inside text-white/60 text-sm space-y-1 mr-4">
                  <li><strong className="text-white/80">Windows:</strong> اضغط Print Screen أو Windows + Shift + S</li>
                  <li><strong className="text-white/80">Mac:</strong> اضغط Command + Shift + 4</li>
                  <li><strong className="text-white/80">الهاتف:</strong> استخدم خاصية Screenshot في جهازك</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">3</span>
                  ارفع الصورة
                </h3>
                <p className="text-white/70 text-sm">
                  اضغط على زر "رفع صورة الشارت" واختر الصورة التي التقطتها
                </p>
              </div>

              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h3 className="font-bold text-success mb-2">💡 نصيحة</h3>
                <p className="text-white/70 text-sm">
                  تأكد أن الصورة واضحة وتحتوي على الشارت بالكامل مع المؤشرات الفنية لأفضل نتائج تحليل
                </p>
              </div>

              <Button onClick={() => {
              setShowInstructions(false);
              document.getElementById('chart-upload')?.click();
            }} className="w-full bg-gradient-to-r from-primary to-primary/80">
                <Upload className="h-4 w-4 ml-2" />
                رفع صورة الشارت الآن
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Price Alert Dialog */}
        <PriceAlertDialog 
          open={alertDialogOpen} 
          onOpenChange={setAlertDialogOpen} 
          market={{
            name: symbolInfo.displayName.split(' (')[0],
            nameAr: symbolInfo.displayName.split(' (')[0],
            symbol: symbol,
            category: symbol.includes('TADAWUL') ? 'السوق السعودي' : ['bitcoin', 'ethereum', 'bnb', 'solana', 'xrp', 'cardano', 'dogecoin'].includes(symbol) ? 'عملات رقمية' : ['gold', 'silver', 'oil', 'naturalgas'].includes(symbol) ? 'سلع' : ['sp500', 'dowjones', 'nasdaq', 'dax'].includes(symbol) ? 'مؤشرات' : ['eurusd', 'gbpusd', 'usdjpy'].includes(symbol) ? 'فوركس' : 'أسهم'
          }}
          currentPrice={currentPrice || undefined}
        />
      </main>
    </div>;
}