import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, MessageCircle, Lock, TrendingUp, Target, Activity, ArrowUp, ArrowDown, Shield, DollarSign, Image as ImageIcon, Search } from "lucide-react";
import { AnalysisResult } from "@/components/AnalysisResult";
import { PatternImageDisplay } from "@/components/PatternImageDisplay";
import { PullToRefresh } from "@/components/PullToRefresh";

const FOREX_PAIRS = [
  // Major Pairs
  { value: "EURUSD", label: "EUR/USD - Euro/US Dollar" },
  { value: "GBPUSD", label: "GBP/USD - British Pound/US Dollar" },
  { value: "USDJPY", label: "USD/JPY - US Dollar/Japanese Yen" },
  { value: "USDCHF", label: "USD/CHF - US Dollar/Swiss Franc" },
  { value: "AUDUSD", label: "AUD/USD - Australian Dollar/US Dollar" },
  { value: "USDCAD", label: "USD/CAD - US Dollar/Canadian Dollar" },
  { value: "NZDUSD", label: "NZD/USD - New Zealand Dollar/US Dollar" },
  
  // Cross Pairs
  { value: "EURGBP", label: "EUR/GBP - Euro/British Pound" },
  { value: "EURJPY", label: "EUR/JPY - Euro/Japanese Yen" },
  { value: "GBPJPY", label: "GBP/JPY - British Pound/Japanese Yen" },
  { value: "EURCHF", label: "EUR/CHF - Euro/Swiss Franc" },
  { value: "EURAUD", label: "EUR/AUD - Euro/Australian Dollar" },
  { value: "EURCAD", label: "EUR/CAD - Euro/Canadian Dollar" },
  { value: "EURNZD", label: "EUR/NZD - Euro/New Zealand Dollar" },
  { value: "GBPCHF", label: "GBP/CHF - British Pound/Swiss Franc" },
  { value: "GBPAUD", label: "GBP/AUD - British Pound/Australian Dollar" },
  { value: "GBPCAD", label: "GBP/CAD - British Pound/Canadian Dollar" },
  { value: "GBPNZD", label: "GBP/NZD - British Pound/New Zealand Dollar" },
  { value: "AUDCAD", label: "AUD/CAD - Australian Dollar/Canadian Dollar" },
  { value: "AUDJPY", label: "AUD/JPY - Australian Dollar/Japanese Yen" },
  { value: "AUDNZD", label: "AUD/NZD - Australian Dollar/New Zealand Dollar" },
  { value: "AUDCHF", label: "AUD/CHF - Australian Dollar/Swiss Franc" },
  { value: "CADJPY", label: "CAD/JPY - Canadian Dollar/Japanese Yen" },
  { value: "CHFJPY", label: "CHF/JPY - Swiss Franc/Japanese Yen" },
  { value: "NZDJPY", label: "NZD/JPY - New Zealand Dollar/Japanese Yen" },
  { value: "NZDCAD", label: "NZD/CAD - New Zealand Dollar/Canadian Dollar" },
  { value: "NZDCHF", label: "NZD/CHF - New Zealand Dollar/Swiss Franc" },
  
  // Exotic Pairs
  { value: "USDTRY", label: "USD/TRY - US Dollar/Turkish Lira" },
  { value: "USDZAR", label: "USD/ZAR - US Dollar/South African Rand" },
  { value: "USDMXN", label: "USD/MXN - US Dollar/Mexican Peso" },
  { value: "USDBRL", label: "USD/BRL - US Dollar/Brazilian Real" },
  { value: "USDSGD", label: "USD/SGD - US Dollar/Singapore Dollar" },
  { value: "USDHKD", label: "USD/HKD - US Dollar/Hong Kong Dollar" },
  { value: "USDSEK", label: "USD/SEK - US Dollar/Swedish Krona" },
  { value: "USDNOK", label: "USD/NOK - US Dollar/Norwegian Krone" },
  { value: "USDDKK", label: "USD/DKK - US Dollar/Danish Krone" },
  { value: "USDPLN", label: "USD/PLN - US Dollar/Polish Zloty" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1 دقيقة" },
  { value: "5m", label: "5 دقائق" },
  { value: "15m", label: "15 دقيقة" },
  { value: "30m", label: "30 دقيقة" },
  { value: "1h", label: "ساعة واحدة" },
  { value: "3h", label: "3 ساعات" },
  { value: "4h", label: "4 ساعات" },
  { value: "1d", label: "يوم واحد" },
  { value: "1w", label: "أسبوع واحد" },
  { value: "1M", label: "شهر واحد" },
];

const US_STOCKS = [
  // Technology - Major
  { value: "AAPL", label: "Apple Inc. (AAPL)" },
  { value: "MSFT", label: "Microsoft Corporation (MSFT)" },
  { value: "GOOGL", label: "Alphabet Inc. (GOOGL)" },
  { value: "GOOG", label: "Alphabet Inc. Class C (GOOG)" },
  { value: "AMZN", label: "Amazon.com Inc. (AMZN)" },
  { value: "META", label: "Meta Platforms Inc. (META)" },
  { value: "NVDA", label: "NVIDIA Corporation (NVDA)" },
  { value: "TSLA", label: "Tesla Inc. (TSLA)" },
  { value: "NFLX", label: "Netflix Inc. (NFLX)" },
  { value: "ADBE", label: "Adobe Inc. (ADBE)" },
  { value: "CRM", label: "Salesforce Inc. (CRM)" },
  { value: "ORCL", label: "Oracle Corporation (ORCL)" },
  { value: "CSCO", label: "Cisco Systems Inc. (CSCO)" },
  { value: "INTC", label: "Intel Corporation (INTC)" },
  { value: "AMD", label: "Advanced Micro Devices (AMD)" },
  { value: "QCOM", label: "QUALCOMM Inc. (QCOM)" },
  { value: "AVGO", label: "Broadcom Inc. (AVGO)" },
  { value: "TXN", label: "Texas Instruments Inc. (TXN)" },
  { value: "NOW", label: "ServiceNow Inc. (NOW)" },
  { value: "PANW", label: "Palo Alto Networks (PANW)" },
  { value: "SNOW", label: "Snowflake Inc. (SNOW)" },
  { value: "UBER", label: "Uber Technologies (UBER)" },
  { value: "SHOP", label: "Shopify Inc. (SHOP)" },
  { value: "SQ", label: "Block Inc. (SQ)" },
  { value: "PYPL", label: "PayPal Holdings (PYPL)" },
  { value: "IBM", label: "IBM Corporation (IBM)" },
  { value: "AMAT", label: "Applied Materials (AMAT)" },
  { value: "MU", label: "Micron Technology (MU)" },
  { value: "LRCX", label: "Lam Research (LRCX)" },
  { value: "KLAC", label: "KLA Corporation (KLAC)" },
  { value: "MRVL", label: "Marvell Technology (MRVL)" },
  { value: "ADI", label: "Analog Devices (ADI)" },
  { value: "SNPS", label: "Synopsys Inc. (SNPS)" },
  { value: "CDNS", label: "Cadence Design (CDNS)" },
  { value: "CRWD", label: "CrowdStrike Holdings (CRWD)" },
  { value: "ZS", label: "Zscaler Inc. (ZS)" },
  { value: "DDOG", label: "Datadog Inc. (DDOG)" },
  { value: "PLTR", label: "Palantir Technologies (PLTR)" },
  { value: "NET", label: "Cloudflare Inc. (NET)" },
  { value: "COIN", label: "Coinbase Global (COIN)" },
  { value: "HOOD", label: "Robinhood Markets (HOOD)" },
  { value: "RBLX", label: "Roblox Corporation (RBLX)" },
  { value: "U", label: "Unity Software (U)" },
  { value: "TTWO", label: "Take-Two Interactive (TTWO)" },
  { value: "EA", label: "Electronic Arts (EA)" },
  { value: "ATVI", label: "Activision Blizzard (ATVI)" },
  
  // Finance
  { value: "JPM", label: "JPMorgan Chase & Co. (JPM)" },
  { value: "BAC", label: "Bank of America Corp. (BAC)" },
  { value: "WFC", label: "Wells Fargo & Co. (WFC)" },
  { value: "GS", label: "Goldman Sachs Group Inc. (GS)" },
  { value: "MS", label: "Morgan Stanley (MS)" },
  { value: "V", label: "Visa Inc. (V)" },
  { value: "MA", label: "Mastercard Inc. (MA)" },
  { value: "AXP", label: "American Express Co. (AXP)" },
  { value: "BLK", label: "BlackRock Inc. (BLK)" },
  { value: "C", label: "Citigroup Inc. (C)" },
  { value: "SCHW", label: "Charles Schwab (SCHW)" },
  { value: "USB", label: "U.S. Bancorp (USB)" },
  { value: "PNC", label: "PNC Financial (PNC)" },
  { value: "TFC", label: "Truist Financial (TFC)" },
  { value: "COF", label: "Capital One Financial (COF)" },
  { value: "AIG", label: "American International (AIG)" },
  { value: "MET", label: "MetLife Inc. (MET)" },
  { value: "PRU", label: "Prudential Financial (PRU)" },
  { value: "CB", label: "Chubb Limited (CB)" },
  { value: "MMC", label: "Marsh & McLennan (MMC)" },
  { value: "AON", label: "Aon plc (AON)" },
  { value: "SPGI", label: "S&P Global Inc. (SPGI)" },
  { value: "MCO", label: "Moody's Corporation (MCO)" },
  { value: "ICE", label: "Intercontinental Exchange (ICE)" },
  { value: "CME", label: "CME Group Inc. (CME)" },
  
  // Healthcare
  { value: "JNJ", label: "Johnson & Johnson (JNJ)" },
  { value: "UNH", label: "UnitedHealth Group Inc. (UNH)" },
  { value: "PFE", label: "Pfizer Inc. (PFE)" },
  { value: "ABBV", label: "AbbVie Inc. (ABBV)" },
  { value: "TMO", label: "Thermo Fisher Scientific (TMO)" },
  { value: "MRK", label: "Merck & Co. Inc. (MRK)" },
  { value: "LLY", label: "Eli Lilly and Co. (LLY)" },
  { value: "ABT", label: "Abbott Laboratories (ABT)" },
  { value: "DHR", label: "Danaher Corporation (DHR)" },
  { value: "BMY", label: "Bristol-Myers Squibb (BMY)" },
  { value: "AMGN", label: "Amgen Inc. (AMGN)" },
  { value: "GILD", label: "Gilead Sciences (GILD)" },
  { value: "REGN", label: "Regeneron Pharmaceuticals (REGN)" },
  { value: "VRTX", label: "Vertex Pharmaceuticals (VRTX)" },
  { value: "ISRG", label: "Intuitive Surgical (ISRG)" },
  { value: "MDT", label: "Medtronic plc (MDT)" },
  { value: "SYK", label: "Stryker Corporation (SYK)" },
  { value: "BSX", label: "Boston Scientific (BSX)" },
  { value: "EW", label: "Edwards Lifesciences (EW)" },
  { value: "ZBH", label: "Zimmer Biomet (ZBH)" },
  { value: "CVS", label: "CVS Health Corp. (CVS)" },
  { value: "CI", label: "Cigna Group (CI)" },
  { value: "ELV", label: "Elevance Health (ELV)" },
  { value: "HCA", label: "HCA Healthcare (HCA)" },
  { value: "HUM", label: "Humana Inc. (HUM)" },
  { value: "MRNA", label: "Moderna Inc. (MRNA)" },
  { value: "BIIB", label: "Biogen Inc. (BIIB)" },
  
  // Consumer
  { value: "WMT", label: "Walmart Inc. (WMT)" },
  { value: "PG", label: "Procter & Gamble Co. (PG)" },
  { value: "KO", label: "Coca-Cola Co. (KO)" },
  { value: "PEP", label: "PepsiCo Inc. (PEP)" },
  { value: "COST", label: "Costco Wholesale Corp. (COST)" },
  { value: "NKE", label: "Nike Inc. (NKE)" },
  { value: "MCD", label: "McDonald's Corp. (MCD)" },
  { value: "SBUX", label: "Starbucks Corp. (SBUX)" },
  { value: "TGT", label: "Target Corp. (TGT)" },
  { value: "HD", label: "Home Depot Inc. (HD)" },
  { value: "LOW", label: "Lowe's Companies Inc. (LOW)" },
  { value: "TJX", label: "TJX Companies (TJX)" },
  { value: "ROST", label: "Ross Stores (ROST)" },
  { value: "DG", label: "Dollar General (DG)" },
  { value: "DLTR", label: "Dollar Tree (DLTR)" },
  { value: "YUM", label: "Yum! Brands (YUM)" },
  { value: "CMG", label: "Chipotle Mexican Grill (CMG)" },
  { value: "DPZ", label: "Domino's Pizza (DPZ)" },
  { value: "DARDEN", label: "Darden Restaurants (DRI)" },
  { value: "MAR", label: "Marriott International (MAR)" },
  { value: "HLT", label: "Hilton Worldwide (HLT)" },
  { value: "BKNG", label: "Booking Holdings (BKNG)" },
  { value: "ABNB", label: "Airbnb Inc. (ABNB)" },
  { value: "LVS", label: "Las Vegas Sands (LVS)" },
  { value: "WYNN", label: "Wynn Resorts (WYNN)" },
  { value: "MGM", label: "MGM Resorts (MGM)" },
  { value: "LULU", label: "Lululemon Athletica (LULU)" },
  { value: "GPS", label: "Gap Inc. (GPS)" },
  { value: "ANF", label: "Abercrombie & Fitch (ANF)" },
  { value: "RL", label: "Ralph Lauren (RL)" },
  { value: "TPR", label: "Tapestry Inc. (TPR)" },
  { value: "VFC", label: "VF Corporation (VFC)" },
  { value: "EL", label: "Estee Lauder (EL)" },
  { value: "ULTA", label: "Ulta Beauty (ULTA)" },
  { value: "CL", label: "Colgate-Palmolive (CL)" },
  { value: "KMB", label: "Kimberly-Clark (KMB)" },
  { value: "GIS", label: "General Mills (GIS)" },
  { value: "K", label: "Kellogg Company (K)" },
  { value: "HSY", label: "Hershey Company (HSY)" },
  { value: "MDLZ", label: "Mondelez International (MDLZ)" },
  { value: "KHC", label: "Kraft Heinz (KHC)" },
  { value: "STZ", label: "Constellation Brands (STZ)" },
  { value: "BUD", label: "Anheuser-Busch InBev (BUD)" },
  { value: "DEO", label: "Diageo plc (DEO)" },
  { value: "PM", label: "Philip Morris International (PM)" },
  { value: "MO", label: "Altria Group (MO)" },
  
  // Energy
  { value: "XOM", label: "Exxon Mobil Corp. (XOM)" },
  { value: "CVX", label: "Chevron Corp. (CVX)" },
  { value: "COP", label: "ConocoPhillips (COP)" },
  { value: "SLB", label: "Schlumberger NV (SLB)" },
  { value: "EOG", label: "EOG Resources (EOG)" },
  { value: "PXD", label: "Pioneer Natural Resources (PXD)" },
  { value: "DVN", label: "Devon Energy (DVN)" },
  { value: "OXY", label: "Occidental Petroleum (OXY)" },
  { value: "MPC", label: "Marathon Petroleum (MPC)" },
  { value: "VLO", label: "Valero Energy (VLO)" },
  { value: "PSX", label: "Phillips 66 (PSX)" },
  { value: "HAL", label: "Halliburton Company (HAL)" },
  { value: "BKR", label: "Baker Hughes (BKR)" },
  { value: "KMI", label: "Kinder Morgan (KMI)" },
  { value: "WMB", label: "Williams Companies (WMB)" },
  { value: "OKE", label: "ONEOK Inc. (OKE)" },
  { value: "ENPH", label: "Enphase Energy (ENPH)" },
  { value: "FSLR", label: "First Solar (FSLR)" },
  { value: "NEE", label: "NextEra Energy (NEE)" },
  { value: "DUK", label: "Duke Energy (DUK)" },
  { value: "SO", label: "Southern Company (SO)" },
  { value: "D", label: "Dominion Energy (D)" },
  { value: "AEP", label: "American Electric Power (AEP)" },
  { value: "XEL", label: "Xcel Energy (XEL)" },
  
  // Industrial
  { value: "BA", label: "Boeing Co. (BA)" },
  { value: "CAT", label: "Caterpillar Inc. (CAT)" },
  { value: "GE", label: "General Electric Co. (GE)" },
  { value: "MMM", label: "3M Co. (MMM)" },
  { value: "UPS", label: "United Parcel Service (UPS)" },
  { value: "HON", label: "Honeywell International (HON)" },
  { value: "RTX", label: "RTX Corporation (RTX)" },
  { value: "LMT", label: "Lockheed Martin (LMT)" },
  { value: "NOC", label: "Northrop Grumman (NOC)" },
  { value: "GD", label: "General Dynamics (GD)" },
  { value: "LHX", label: "L3Harris Technologies (LHX)" },
  { value: "DE", label: "Deere & Company (DE)" },
  { value: "EMR", label: "Emerson Electric (EMR)" },
  { value: "ETN", label: "Eaton Corporation (ETN)" },
  { value: "ITW", label: "Illinois Tool Works (ITW)" },
  { value: "PH", label: "Parker-Hannifin (PH)" },
  { value: "ROK", label: "Rockwell Automation (ROK)" },
  { value: "CMI", label: "Cummins Inc. (CMI)" },
  { value: "PCAR", label: "PACCAR Inc. (PCAR)" },
  { value: "NSC", label: "Norfolk Southern (NSC)" },
  { value: "UNP", label: "Union Pacific (UNP)" },
  { value: "CSX", label: "CSX Corporation (CSX)" },
  { value: "FDX", label: "FedEx Corporation (FDX)" },
  { value: "DAL", label: "Delta Air Lines (DAL)" },
  { value: "UAL", label: "United Airlines (UAL)" },
  { value: "AAL", label: "American Airlines (AAL)" },
  { value: "LUV", label: "Southwest Airlines (LUV)" },
  { value: "WM", label: "Waste Management (WM)" },
  { value: "RSG", label: "Republic Services (RSG)" },
  
  // Telecom & Media
  { value: "T", label: "AT&T Inc. (T)" },
  { value: "VZ", label: "Verizon Communications (VZ)" },
  { value: "DIS", label: "Walt Disney Co. (DIS)" },
  { value: "CMCSA", label: "Comcast Corp. (CMCSA)" },
  { value: "TMUS", label: "T-Mobile US (TMUS)" },
  { value: "CHTR", label: "Charter Communications (CHTR)" },
  { value: "WBD", label: "Warner Bros. Discovery (WBD)" },
  { value: "PARA", label: "Paramount Global (PARA)" },
  { value: "FOX", label: "Fox Corporation (FOX)" },
  { value: "NWSA", label: "News Corp (NWSA)" },
  
  // Real Estate
  { value: "AMT", label: "American Tower (AMT)" },
  { value: "PLD", label: "Prologis Inc. (PLD)" },
  { value: "CCI", label: "Crown Castle (CCI)" },
  { value: "EQIX", label: "Equinix Inc. (EQIX)" },
  { value: "PSA", label: "Public Storage (PSA)" },
  { value: "SPG", label: "Simon Property Group (SPG)" },
  { value: "O", label: "Realty Income (O)" },
  { value: "WELL", label: "Welltower Inc. (WELL)" },
  { value: "AVB", label: "AvalonBay Communities (AVB)" },
  { value: "EQR", label: "Equity Residential (EQR)" },
  
  // Materials
  { value: "LIN", label: "Linde plc (LIN)" },
  { value: "APD", label: "Air Products (APD)" },
  { value: "SHW", label: "Sherwin-Williams (SHW)" },
  { value: "ECL", label: "Ecolab Inc. (ECL)" },
  { value: "FCX", label: "Freeport-McMoRan (FCX)" },
  { value: "NEM", label: "Newmont Corporation (NEM)" },
  { value: "NUE", label: "Nucor Corporation (NUE)" },
  { value: "STLD", label: "Steel Dynamics (STLD)" },
  { value: "DOW", label: "Dow Inc. (DOW)" },
  { value: "DD", label: "DuPont de Nemours (DD)" },
];

const ANALYSIS_TYPES = [
  { value: "trading", label: "مضاربة قصيرة الأجل" },
  { value: "investment", label: "استثمار طويل الأجل" },
];

const CRYPTO_CURRENCIES = [
  // Major Cryptocurrencies
  { value: "BTCUSD", label: "Bitcoin (BTC)" },
  { value: "ETHUSD", label: "Ethereum (ETH)" },
  { value: "BNBUSD", label: "Binance Coin (BNB)" },
  { value: "XRPUSD", label: "Ripple (XRP)" },
  { value: "ADAUSD", label: "Cardano (ADA)" },
  { value: "SOLUSD", label: "Solana (SOL)" },
  { value: "DOTUSD", label: "Polkadot (DOT)" },
  { value: "DOGEUSD", label: "Dogecoin (DOGE)" },
  { value: "MATICUSD", label: "Polygon (MATIC)" },
  { value: "SHIBUSD", label: "Shiba Inu (SHIB)" },
  { value: "AVAXUSD", label: "Avalanche (AVAX)" },
  { value: "UNIUSD", label: "Uniswap (UNI)" },
  { value: "LINKUSD", label: "Chainlink (LINK)" },
  { value: "LTCUSD", label: "Litecoin (LTC)" },
  { value: "ATOMUSD", label: "Cosmos (ATOM)" },
  { value: "TRXUSD", label: "TRON (TRX)" },
  { value: "ETCUSD", label: "Ethereum Classic (ETC)" },
  { value: "XLMUSD", label: "Stellar (XLM)" },
  { value: "ALGOUSD", label: "Algorand (ALGO)" },
  { value: "VETUSD", label: "VeChain (VET)" },
  { value: "ICPUSD", label: "Internet Computer (ICP)" },
  { value: "FILUSD", label: "Filecoin (FIL)" },
  { value: "FTMUSD", label: "Fantom (FTM)" },
  { value: "APTUSD", label: "Aptos (APT)" },
  { value: "ARBUSD", label: "Arbitrum (ARB)" },
  { value: "OPUSD", label: "Optimism (OP)" },
  { value: "NEARUSD", label: "NEAR Protocol (NEAR)" },
  { value: "AAVEUSD", label: "Aave (AAVE)" },
  { value: "GRTUSD", label: "The Graph (GRT)" },
  { value: "SANDUSD", label: "The Sandbox (SAND)" },
  { value: "MANAUSD", label: "Decentraland (MANA)" },
  { value: "LDOUSD", label: "Lido DAO (LDO)" },
  { value: "INJUSD", label: "Injective (INJ)" },
  { value: "RNDRUSD", label: "Render Token (RNDR)" },
  { value: "PEPEUSD", label: "Pepe (PEPE)" },
];

const METALS = [
  { value: "gold", label: "الذهب (Gold)", icon: "🥇", symbol: "XAUUSD" },
  { value: "silver", label: "الفضة (Silver)", icon: "🥈", symbol: "XAGUSD" },
  { value: "platinum", label: "البلاتين (Platinum)", icon: "⚪", coinGeckoId: "platinum" },
  { value: "copper", label: "النحاس (Copper)", icon: "🟤", coinGeckoId: "copper-token" },
  { value: "palladium", label: "البلاديوم (Palladium)", icon: "⚫", coinGeckoId: "palladium" },
];

const ImageAnalysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<"recommendation" | "support-resistance">("recommendation");
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedForexPair, setSelectedForexPair] = useState<string>("");
  const [forexTimeframe, setForexTimeframe] = useState<string>("5m");
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [stockTimeframe, setStockTimeframe] = useState<string>("1d");
  const [stockAnalysisType, setStockAnalysisType] = useState<string>("trading");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [cryptoTimeframe, setCryptoTimeframe] = useState<string>("1h");
  const [cryptoAnalysisType, setCryptoAnalysisType] = useState<string>("trading");
  const [selectedMetal, setSelectedMetal] = useState<string>("");
  const [metalTimeframe, setMetalTimeframe] = useState<string>("1h");
  const [patternImage, setPatternImage] = useState<string>("");
  const [generatingPattern, setGeneratingPattern] = useState(false);
  
  // Search states
  const [forexSearch, setForexSearch] = useState<string>("");
  const [stockSearch, setStockSearch] = useState<string>("");
  const [cryptoSearch, setCryptoSearch] = useState<string>("");
  const [metalSearch, setMetalSearch] = useState<string>("");
  
  // Filtered lists
  const filteredForexPairs = FOREX_PAIRS.filter(pair => 
    pair.label.toLowerCase().includes(forexSearch.toLowerCase()) || 
    pair.value.toLowerCase().includes(forexSearch.toLowerCase())
  );
  
  const filteredStocks = US_STOCKS.filter(stock => 
    stock.label.toLowerCase().includes(stockSearch.toLowerCase()) || 
    stock.value.toLowerCase().includes(stockSearch.toLowerCase())
  );
  
  const filteredCrypto = CRYPTO_CURRENCIES.filter(crypto => 
    crypto.label.toLowerCase().includes(cryptoSearch.toLowerCase()) || 
    crypto.value.toLowerCase().includes(cryptoSearch.toLowerCase())
  );
  
  const filteredMetals = METALS.filter(metal => 
    metal.label.toLowerCase().includes(metalSearch.toLowerCase()) || 
    metal.value.toLowerCase().includes(metalSearch.toLowerCase())
  );

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("يجب تسجيل الدخول أولاً");
          navigate("/auth");
          return;
        }
        const {
          data,
          error
        } = await supabase.from("profiles").select("image_analysis_enabled").eq("user_id", user.id).single();
        if (error) {
          console.error("Error checking access:", error);
          setHasAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(data?.image_analysis_enabled || false);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setHasAccess(false);
        setLoading(false);
      }
    };
    checkAccess();
  }, [navigate]);
  const processImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('تم تحميل الصورة بنجاح');
    } else {
      toast.error('يرجى اختيار ملف صورة صحيح');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              processImageFile(file);
            }
          }
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  const openWhatsApp = () => {
    const phoneNumber = "966575594911";
    const message = "مرحباً، أريد ترقية الباقة للحصول على ميزة تحليل الصور";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("يرجى اختيار صورة صالحة");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to generate pattern image
  const generatePatternImage = async (analysisData: any, symbol: string) => {
    setGeneratingPattern(true);
    try {
      // Detect pattern from analysis
      let pattern = 'خط اتجاه';
      let direction = 'صعود'; // Default to up
      
      // Convert to string for analysis
      const analysisText = typeof analysisData === 'string' 
        ? analysisData.toLowerCase() 
        : JSON.stringify(analysisData).toLowerCase();
      
      console.log('Analyzing for direction detection:', analysisText.substring(0, 500));
      
      // Count bullish vs bearish signals for better accuracy
      let bullishScore = 0;
      let bearishScore = 0;
      
      // Check for bullish signals (CALL, buy, up)
      if (analysisText.includes('call')) bullishScore += 3;
      if (analysisText.includes('شراء')) bullishScore += 3;
      if (analysisText.includes('صاعد')) bullishScore += 2;
      if (analysisText.includes('صعود')) bullishScore += 2;
      if (analysisText.includes('ارتفاع')) bullishScore += 1;
      if (analysisText.includes('اختراق لأعلى') || analysisText.includes('اختراق صعودي')) bullishScore += 2;
      if (analysisText.includes('bullish')) bullishScore += 2;
      if (analysisText.includes('buy')) bullishScore += 2;
      if (analysisText.includes('uptrend') || analysisText.includes('up trend')) bullishScore += 2;
      
      // Check for bearish signals (PUT, sell, down)
      if (analysisText.includes('put')) bearishScore += 3;
      if (analysisText.includes('بيع')) bearishScore += 3;
      if (analysisText.includes('هابط')) bearishScore += 2;
      if (analysisText.includes('هبوط')) bearishScore += 2;
      if (analysisText.includes('انخفاض')) bearishScore += 1;
      if (analysisText.includes('اختراق لأسفل') || analysisText.includes('اختراق هبوطي')) bearishScore += 2;
      if (analysisText.includes('bearish')) bearishScore += 2;
      if (analysisText.includes('sell')) bearishScore += 2;
      if (analysisText.includes('downtrend') || analysisText.includes('down trend')) bearishScore += 2;
      
      console.log('Direction scores - Bullish:', bullishScore, 'Bearish:', bearishScore);
      
      // Determine direction based on score
      if (bearishScore > bullishScore) {
        direction = 'هبوط';
      } else {
        direction = 'صعود';
      }
      
      // Pattern detection
      if (analysisText.includes('مثلث صاعد') || analysisText.includes('ascending triangle')) {
        pattern = 'مثلث صاعد';
      } else if (analysisText.includes('مثلث هابط') || analysisText.includes('descending triangle')) {
        pattern = 'مثلث هابط';
      } else if (analysisText.includes('مثلث') || analysisText.includes('triangle')) {
        pattern = 'مثلث متماثل';
      } else if (analysisText.includes('قناة صاعدة') || analysisText.includes('ascending channel')) {
        pattern = 'قناة صاعدة';
      } else if (analysisText.includes('قناة هابطة') || analysisText.includes('descending channel')) {
        pattern = 'قناة هابطة';
      } else if (analysisText.includes('قناة') || analysisText.includes('channel')) {
        pattern = direction === 'صعود' ? 'قناة صاعدة' : 'قناة هابطة';
      } else if (analysisText.includes('راية') || analysisText.includes('flag')) {
        pattern = direction === 'صعود' ? 'راية صاعدة' : 'راية هابطة';
      } else if (analysisText.includes('رأس وكتفين مقلوب') || analysisText.includes('inverse head')) {
        pattern = 'رأس وكتفين مقلوب';
      } else if (analysisText.includes('رأس وكتفين') || analysisText.includes('head and shoulders')) {
        pattern = 'رأس وكتفين';
      } else if (analysisText.includes('قمة مزدوجة') || analysisText.includes('double top')) {
        pattern = 'قمة مزدوجة';
      } else if (analysisText.includes('قاع مزدوج') || analysisText.includes('double bottom')) {
        pattern = 'قاع مزدوج';
      } else if (analysisText.includes('وتد') || analysisText.includes('wedge')) {
        pattern = direction === 'صعود' ? 'وتد صاعد' : 'وتد هابط';
      } else if (analysisText.includes('دعم') && analysisText.includes('مقاومة')) {
        pattern = 'دعم ومقاومة';
      } else if (analysisText.includes('اختراق') || analysisText.includes('breakout')) {
        pattern = 'اختراق';
      } else if (analysisText.includes('ارتداد') || analysisText.includes('bounce')) {
        pattern = 'ارتداد';
      }

      console.log('Detected pattern:', pattern, 'Direction:', direction);

      const { data, error } = await supabase.functions.invoke('generate-pattern-image', {
        body: { pattern, direction, symbol }
      });

      if (error) {
        console.error('Pattern image generation error:', error);
        return;
      }

      if (data?.patternImage) {
        setPatternImage(data.patternImage);
      }
    } catch (error) {
      console.error('Error generating pattern image:', error);
    } finally {
      setGeneratingPattern(false);
    }
  };

  const handleAnalyzeForex = async () => {
    if (!selectedForexPair) {
      toast.error("الرجاء اختيار زوج العملات");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");
    setPatternImage("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: selectedForexPair,
          timeframe: forexTimeframe,
          assetType: 'forex'
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("تم التحليل بنجاح");
        // Generate pattern image
        generatePatternImage(data.analysis, selectedForexPair);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل زوج العملات");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeStock = async () => {
    if (!selectedStock) {
      toast.error("الرجاء اختيار السهم");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");
    setPatternImage("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: selectedStock,
          timeframe: stockTimeframe,
          assetType: 'stock',
          analysisType: stockAnalysisType
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("تم التحليل بنجاح");
        // Generate pattern image
        generatePatternImage(data.analysis, selectedStock);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل السهم");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeCrypto = async () => {
    if (!selectedCrypto) {
      toast.error("الرجاء اختيار العملة الرقمية");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");
    setPatternImage("");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: selectedCrypto,
          timeframe: cryptoTimeframe,
          assetType: 'crypto',
          analysisType: cryptoAnalysisType
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("تم التحليل بنجاح");
        // Generate pattern image
        generatePatternImage(data.analysis, selectedCrypto);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل العملة الرقمية");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeMetal = async () => {
    if (!selectedMetal) {
      toast.error("الرجاء اختيار المعدن");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");
    setPatternImage("");

    try {
      const selectedMetalData = METALS.find(m => m.value === selectedMetal);
      
      // Use symbol for gold/silver (forex pairs), otherwise use coinGeckoId for crypto-based metals
      const symbolToUse = selectedMetalData?.symbol || selectedMetalData?.coinGeckoId || selectedMetal;
      const assetType = selectedMetalData?.symbol ? 'forex' : 'metal';
      
      const { data, error } = await supabase.functions.invoke('analyze-symbol', {
        body: {
          symbol: symbolToUse,
          timeframe: metalTimeframe,
          assetType: assetType
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("تم التحليل بنجاح");
        // Generate pattern image
        generatePatternImage(data.analysis, symbolToUse);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("حدث خطأ أثناء تحليل المعدن");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !timeframe) {
      toast.error("يرجى رفع صورة واختيار فترة الشمعة");
      return;
    }
    setAnalyzing(true);
    setAnalysis("");
    setPatternImage("");
    setGeneratingPattern(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          
          // Use analyze-chart-with-drawing to draw patterns on the uploaded image
          const { data, error } = await supabase.functions.invoke('analyze-chart-with-drawing', {
            body: {
              image: base64Image,
              symbol: 'الشارت',
              timeframe: timeframe
            }
          });
          
          if (error) throw error;
          
          if (data?.success) {
            // Set the analysis from structured data
            setAnalysis(data.analysis);
            
            // Set the annotated image (drawn on the original image)
            if (data.annotatedImage) {
              setPatternImage(data.annotatedImage);
            }
            
            toast.success("تم تحليل الصورة ورسم النمط بنجاح");
          } else {
            throw new Error(data?.error || "فشل في التحليل");
          }
        } catch (innerError: any) {
          console.error('Analysis error:', innerError);
          toast.error(innerError.message || "حدث خطأ أثناء تحليل الصورة");
        } finally {
          setAnalyzing(false);
          setGeneratingPattern(false);
        }
      };
      reader.readAsDataURL(image);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "حدث خطأ أثناء تحليل الصورة");
      setAnalyzing(false);
      setGeneratingPattern(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        {/* Safe Area Background */}
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-slate-950 z-[60]" />
        
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="max-w-2xl mx-auto relative">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="ml-2 h-4 w-4" />
            رجوع
          </Button>

          <Card className="border-amber-500/50 bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl text-white">ميزة غير متاحة</CardTitle>
              <CardDescription className="text-slate-400">
                اشتراكك الحالي لا يسمح بالوصول إلى ميزة تحليل الصور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-6 space-y-4 border border-slate-700/50">
                <h3 className="font-semibold text-lg text-white">للحصول على هذه الميزة:</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span>تحليل الشارت من الصور مباشرة</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-100" />
                    <span>توصيات CALL أو PUT دقيقة</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-200" />
                    <span>تحديد أفضل وقت للدخول</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300" />
                    <span>تحليل فني شامل</span>
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <p className="text-slate-400">
                  تواصل معنا لترقية باقتك والحصول على هذه الميزة المتقدمة
                </p>
                <Button onClick={openWhatsApp} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black" size="lg">
                  <MessageCircle className="h-5 w-5" />
                  تواصل معنا لترقية الباقة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  const handleRefresh = useCallback(async () => {
    // Re-check access
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('image_analysis_enabled')
        .eq('user_id', authUser.id)
        .single();
      setHasAccess(profile?.image_analysis_enabled || false);
    }
  }, []);
  
  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 pt-[calc(env(safe-area-inset-top)+48px)]">
      {/* Safe Area Background */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-slate-950 z-[60]" />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-4xl mx-auto relative">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-slate-400 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="ml-2 h-4 w-4" />
          رجوع
        </Button>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1 sm:p-1.5 h-auto rounded-xl gap-1 sm:gap-2">
            <TabsTrigger 
              value="image" 
              className="gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 data-[state=inactive]:text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">تحليل صورة</span>
              <span className="sm:hidden">صورة</span>
            </TabsTrigger>
            <TabsTrigger 
              value="forex" 
              className="gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 data-[state=inactive]:text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              الفوريكس
            </TabsTrigger>
            <TabsTrigger 
              value="stocks" 
              className="gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 data-[state=inactive]:text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              الأسهم
            </TabsTrigger>
            <TabsTrigger 
              value="crypto" 
              className="gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 data-[state=inactive]:text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              العملات
            </TabsTrigger>
            <TabsTrigger 
              value="metals" 
              className="gap-1 sm:gap-2 rounded-lg text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 data-[state=inactive]:text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <span className="text-sm sm:text-lg">🥇</span>
              المعادن
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl text-white">تحليل الشارت بالصورة (MT5 / TradingView / Pocket Option)</CardTitle>
                <CardDescription className="text-slate-400">
                  اختر نوع التحليل المطلوب ثم قم برفع صورة الشارت من أي منصة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analysis Type Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-300">نوع التحليل</Label>
                  <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as "recommendation" | "support-resistance")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700">
                      <TabsTrigger value="recommendation" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>توصية مباشرة</span>
                      </TabsTrigger>
                      <TabsTrigger value="support-resistance" className="gap-2">
                        <Target className="h-4 w-4" />
                        <span>الدعوم والارتدادات</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
              
              {analysisType === "recommendation" ? (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mt-2">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-primary">التوصية المباشرة:</span> ستحصل على توصية CALL أو PUT محددة مع وقت الدخول المثالي
                  </p>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mt-2">
                  <p className="text-sm text-white">
                    <span className="font-semibold text-blue-400">الدعوم والارتدادات:</span> ستحصل على أرقام دقيقة لمستويات الدعم والمقاومة لتدخل بنفسك عند ارتداد السعر
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe" className="text-slate-300">فترة الشمعة</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="اختر فترة الشمعة" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1m" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 دقيقة</SelectItem>
                  <SelectItem value="5m" className="text-white hover:bg-slate-700 focus:bg-slate-700">5 دقائق</SelectItem>
                  <SelectItem value="15m" className="text-white hover:bg-slate-700 focus:bg-slate-700">15 دقيقة</SelectItem>
                  <SelectItem value="30m" className="text-white hover:bg-slate-700 focus:bg-slate-700">30 دقيقة</SelectItem>
                  <SelectItem value="1h" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 ساعة</SelectItem>
                  <SelectItem value="3h" className="text-white hover:bg-slate-700 focus:bg-slate-700">3 ساعات</SelectItem>
                  <SelectItem value="4h" className="text-white hover:bg-slate-700 focus:bg-slate-700">4 ساعات</SelectItem>
                  <SelectItem value="1d" className="text-white hover:bg-slate-700 focus:bg-slate-700">يوم واحد</SelectItem>
                  <SelectItem value="1w" className="text-white hover:bg-slate-700 focus:bg-slate-700">أسبوع واحد</SelectItem>
                  <SelectItem value="1M" className="text-white hover:bg-slate-700 focus:bg-slate-700">شهر واحد</SelectItem>
                </SelectContent>
              </Select>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mt-2">
                <div className="flex items-start gap-2">
                  <div className="text-lg">💡</div>
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold text-amber-400">توصية:</span> يُنصح باختيار فترة الشمعة 5 دقائق ومدة الصفقة 5 دقائق للحصول على أفضل النتائج
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-slate-300">صورة الشارت</Label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">اسحب وأفلت الصورة هنا</p>
                    <p className="text-xs text-slate-400">أو انقر لاختيار ملف</p>
                  </div>
                  <Input 
                    id="image" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="cursor-pointer max-w-xs mx-auto bg-slate-800/50 border-slate-700 text-white" 
                  />
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                <p className="text-xs text-slate-300">
                  💡 <span className="font-semibold">نصيحة:</span> يمكنك لصق الصورة مباشرة من الحافظة باستخدام Ctrl+V أو Cmd+V
                </p>
              </div>
            </div>

            {imagePreview && <div className="space-y-2">
                <Label>معاينة الصورة</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img src={imagePreview} alt="Chart preview" className="max-w-full h-auto rounded" />
                </div>
              </div>}

            <Button onClick={handleAnalyze} disabled={!image || !timeframe || analyzing} className="w-full" size="lg">
              {analyzing ? <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </> : "تحليل الشارت"}
            </Button>

            {analysis && (
              <div className="space-y-4">
                <PatternImageDisplay patternImage={patternImage} isLoading={generatingPattern} />
                <div className="space-y-2">
                  <Label>نتيجة التحليل</Label>
                  <AnalysisResult analysis={analysis} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>


      <TabsContent value="forex">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">تحليل الفوريكس</CardTitle>
            <CardDescription className="text-slate-400">
              اختر زوج العملات والإطار الزمني للحصول على تحليل شامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">بحث في الفوريكس</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن زوج العملات..."
                  value={forexSearch}
                  onChange={(e) => setForexSearch(e.target.value)}
                  className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>اختر زوج العملات</Label>
              <Select value={selectedForexPair} onValueChange={setSelectedForexPair}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="اختر زوج العملات" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {filteredForexPairs.length > 0 ? (
                    filteredForexPairs.map((pair) => (
                      <SelectItem key={pair.value} value={pair.value} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                        {pair.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-slate-400">
                      لا توجد نتائج
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={forexTimeframe} onValueChange={setForexTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeForex}
              disabled={!selectedForexPair || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-4">
                <PatternImageDisplay patternImage={patternImage} isLoading={generatingPattern} />
                <div className="space-y-2">
                  <Label>نتيجة التحليل</Label>
                  <AnalysisResult analysis={analysis} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stocks">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">تحليل الأسهم الأمريكية</CardTitle>
            <CardDescription className="text-slate-400">
              اختر السهم والإطار الزمني ونوع التحليل للحصول على تحليل شامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">بحث في الأسهم</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن السهم..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">اختر سهم</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="اختر سهم" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-slate-800 border-slate-700">
                  {filteredStocks.length > 0 ? (
                    filteredStocks.map((stock) => (
                      <SelectItem key={stock.value} value={stock.value} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                        {stock.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-slate-400">
                      لا توجد نتائج
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع التحليل</Label>
              <Select value={stockAnalysisType} onValueChange={setStockAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANALYSIS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={stockTimeframe} onValueChange={setStockTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeStock}
              disabled={!selectedStock || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-4">
                <PatternImageDisplay patternImage={patternImage} isLoading={generatingPattern} />
                <div className="space-y-2">
                  <Label>نتيجة التحليل</Label>
                  <AnalysisResult analysis={analysis} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="crypto">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">تحليل العملات الرقمية</CardTitle>
            <CardDescription className="text-slate-400">
              اختر العملة الرقمية والإطار الزمني ونوع التحليل للحصول على تحليل شامل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">بحث في العملات الرقمية</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن العملة الرقمية..."
                  value={cryptoSearch}
                  onChange={(e) => setCryptoSearch(e.target.value)}
                  className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">اختر عملة رقمية</Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="اختر عملة رقمية" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-slate-800 border-slate-700 text-white">
                  {filteredCrypto.length > 0 ? (
                    filteredCrypto.map((crypto) => (
                      <SelectItem key={crypto.value} value={crypto.value} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                        {crypto.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-slate-400">
                      لا توجد نتائج
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع التحليل</Label>
              <Select value={cryptoAnalysisType} onValueChange={setCryptoAnalysisType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANALYSIS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
              <Select value={cryptoTimeframe} onValueChange={setCryptoTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeCrypto}
              disabled={!selectedCrypto || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-4">
                <PatternImageDisplay patternImage={patternImage} isLoading={generatingPattern} />
                <div className="space-y-2">
                  <Label>نتيجة التحليل</Label>
                  <AnalysisResult analysis={analysis} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="metals">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-white">
              <span className="text-3xl">🥇</span>
              تحليل المعادن
            </CardTitle>
            <CardDescription className="text-slate-400">
              اختر المعدن وفترة الشمعة للحصول على تحليل مفصل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">بحث في المعادن</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن المعدن..."
                  value={metalSearch}
                  onChange={(e) => setMetalSearch(e.target.value)}
                  className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">اختر المعدن</Label>
              <Select value={selectedMetal} onValueChange={setSelectedMetal}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="اختر المعدن" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {filteredMetals.length > 0 ? (
                    filteredMetals.map((metal) => (
                      <SelectItem key={metal.value} value={metal.value} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                        <span className="flex items-center gap-2">
                          <span>{metal.icon}</span>
                          {metal.label}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-slate-400">
                      لا توجد نتائج
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">فترة الشمعة</Label>
              <Select value={metalTimeframe} onValueChange={setMetalTimeframe}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalyzeMetal}
              disabled={!selectedMetal || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الآن"
              )}
            </Button>

            {analysis && (
              <div className="space-y-4">
                <PatternImageDisplay patternImage={patternImage} isLoading={generatingPattern} />
                <div className="space-y-2">
                  <Label>نتيجة التحليل</Label>
                  <AnalysisResult analysis={analysis} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      {analyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <p className="text-2xl font-bold text-foreground">جاري التحليل...</p>
          </div>
        </div>
      )}
      </div>
    </PullToRefresh>
  );
};

export default ImageAnalysis;