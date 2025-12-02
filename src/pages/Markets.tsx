import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw, Star, User, ChevronDown } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

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
  // Forex - Major & Cross Pairs (28 pairs)
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
  { name: 'EUR/CHF', nameAr: 'يورو/فرنك', symbol: 'eurchf', category: 'فوركس' },
  { name: 'EUR/AUD', nameAr: 'يورو/أسترالي', symbol: 'euraud', category: 'فوركس' },
  { name: 'EUR/CAD', nameAr: 'يورو/كندي', symbol: 'eurcad', category: 'فوركس' },
  { name: 'EUR/NZD', nameAr: 'يورو/نيوزيلندي', symbol: 'eurnzd', category: 'فوركس' },
  { name: 'GBP/CHF', nameAr: 'جنيه/فرنك', symbol: 'gbpchf', category: 'فوركس' },
  { name: 'GBP/AUD', nameAr: 'جنيه/أسترالي', symbol: 'gbpaud', category: 'فوركس' },
  { name: 'GBP/CAD', nameAr: 'جنيه/كندي', symbol: 'gbpcad', category: 'فوركس' },
  { name: 'GBP/NZD', nameAr: 'جنيه/نيوزيلندي', symbol: 'gbpnzd', category: 'فوركس' },
  { name: 'AUD/JPY', nameAr: 'أسترالي/ين', symbol: 'audjpy', category: 'فوركس' },
  { name: 'AUD/NZD', nameAr: 'أسترالي/نيوزيلندي', symbol: 'audnzd', category: 'فوركس' },
  { name: 'AUD/CAD', nameAr: 'أسترالي/كندي', symbol: 'audcad', category: 'فوركس' },
  { name: 'AUD/CHF', nameAr: 'أسترالي/فرنك', symbol: 'audchf', category: 'فوركس' },
  { name: 'NZD/JPY', nameAr: 'نيوزيلندي/ين', symbol: 'nzdjpy', category: 'فوركس' },
  { name: 'NZD/CAD', nameAr: 'نيوزيلندي/كندي', symbol: 'nzdcad', category: 'فوركس' },
  { name: 'NZD/CHF', nameAr: 'نيوزيلندي/فرنك', symbol: 'nzdchf', category: 'فوركس' },
  { name: 'CAD/JPY', nameAr: 'كندي/ين', symbol: 'cadjpy', category: 'فوركس' },
  { name: 'CAD/CHF', nameAr: 'كندي/فرنك', symbol: 'cadchf', category: 'فوركس' },
  { name: 'CHF/JPY', nameAr: 'فرنك/ين', symbol: 'chfjpy', category: 'فوركس' },
  
  // Crypto - Top 50+ coins with Binance symbols
  { name: 'Bitcoin', nameAr: 'بيتكوين', symbol: 'bitcoin', binanceSymbol: 'BTCUSDT', category: 'عملات رقمية' },
  { name: 'Ethereum', nameAr: 'إيثريوم', symbol: 'ethereum', binanceSymbol: 'ETHUSDT', category: 'عملات رقمية' },
  { name: 'BNB', nameAr: 'بي إن بي', symbol: 'bnb', binanceSymbol: 'BNBUSDT', category: 'عملات رقمية' },
  { name: 'Solana', nameAr: 'سولانا', symbol: 'solana', binanceSymbol: 'SOLUSDT', category: 'عملات رقمية' },
  { name: 'XRP', nameAr: 'ريبل', symbol: 'xrp', binanceSymbol: 'XRPUSDT', category: 'عملات رقمية' },
  { name: 'Cardano', nameAr: 'كاردانو', symbol: 'cardano', binanceSymbol: 'ADAUSDT', category: 'عملات رقمية' },
  { name: 'Dogecoin', nameAr: 'دوجكوين', symbol: 'dogecoin', binanceSymbol: 'DOGEUSDT', category: 'عملات رقمية' },
  { name: 'Avalanche', nameAr: 'أفالانش', symbol: 'avalanche', binanceSymbol: 'AVAXUSDT', category: 'عملات رقمية' },
  { name: 'Polkadot', nameAr: 'بولكادوت', symbol: 'polkadot', binanceSymbol: 'DOTUSDT', category: 'عملات رقمية' },
  { name: 'Polygon', nameAr: 'بوليجون', symbol: 'polygon', binanceSymbol: 'MATICUSDT', category: 'عملات رقمية' },
  { name: 'Chainlink', nameAr: 'تشين لينك', symbol: 'chainlink', binanceSymbol: 'LINKUSDT', category: 'عملات رقمية' },
  { name: 'Litecoin', nameAr: 'لايتكوين', symbol: 'litecoin', binanceSymbol: 'LTCUSDT', category: 'عملات رقمية' },
  { name: 'Shiba Inu', nameAr: 'شيبا إينو', symbol: 'shiba', binanceSymbol: 'SHIBUSDT', category: 'عملات رقمية' },
  { name: 'TRON', nameAr: 'ترون', symbol: 'tron', binanceSymbol: 'TRXUSDT', category: 'عملات رقمية' },
  { name: 'Uniswap', nameAr: 'يونيسواب', symbol: 'uniswap', binanceSymbol: 'UNIUSDT', category: 'عملات رقمية' },
  { name: 'Cosmos', nameAr: 'كوزموس', symbol: 'cosmos', binanceSymbol: 'ATOMUSDT', category: 'عملات رقمية' },
  { name: 'Ethereum Classic', nameAr: 'إيثريوم كلاسيك', symbol: 'ethereumclassic', binanceSymbol: 'ETCUSDT', category: 'عملات رقمية' },
  { name: 'Stellar', nameAr: 'ستيلار', symbol: 'stellar', binanceSymbol: 'XLMUSDT', category: 'عملات رقمية' },
  { name: 'Bitcoin Cash', nameAr: 'بيتكوين كاش', symbol: 'bitcoincash', binanceSymbol: 'BCHUSDT', category: 'عملات رقمية' },
  { name: 'Algorand', nameAr: 'ألجوراند', symbol: 'algorand', binanceSymbol: 'ALGOUSDT', category: 'عملات رقمية' },
  { name: 'VeChain', nameAr: 'في تشين', symbol: 'vechain', binanceSymbol: 'VETUSDT', category: 'عملات رقمية' },
  { name: 'Filecoin', nameAr: 'فايل كوين', symbol: 'filecoin', binanceSymbol: 'FILUSDT', category: 'عملات رقمية' },
  { name: 'NEAR Protocol', nameAr: 'نير بروتوكول', symbol: 'near', binanceSymbol: 'NEARUSDT', category: 'عملات رقمية' },
  { name: 'Aptos', nameAr: 'أبتوس', symbol: 'aptos', binanceSymbol: 'APTUSDT', category: 'عملات رقمية' },
  { name: 'Arbitrum', nameAr: 'أربيتروم', symbol: 'arbitrum', binanceSymbol: 'ARBUSDT', category: 'عملات رقمية' },
  { name: 'Optimism', nameAr: 'أوبتيميزم', symbol: 'optimism', binanceSymbol: 'OPUSDT', category: 'عملات رقمية' },
  { name: 'Sui', nameAr: 'سوي', symbol: 'sui', binanceSymbol: 'SUIUSDT', category: 'عملات رقمية' },
  { name: 'Pepe', nameAr: 'بيبي', symbol: 'pepe', binanceSymbol: 'PEPEUSDT', category: 'عملات رقمية' },
  { name: 'The Sandbox', nameAr: 'ذا ساندبوكس', symbol: 'sandbox', binanceSymbol: 'SANDUSDT', category: 'عملات رقمية' },
  { name: 'Decentraland', nameAr: 'ديسنترالاند', symbol: 'decentraland', binanceSymbol: 'MANAUSDT', category: 'عملات رقمية' },
  { name: 'Hedera', nameAr: 'هيديرا', symbol: 'hedera', binanceSymbol: 'HBARUSDT', category: 'عملات رقمية' },
  { name: 'Fantom', nameAr: 'فانتوم', symbol: 'fantom', binanceSymbol: 'FTMUSDT', category: 'عملات رقمية' },
  { name: 'Aave', nameAr: 'آفي', symbol: 'aave', binanceSymbol: 'AAVEUSDT', category: 'عملات رقمية' },
  { name: 'Render', nameAr: 'رندر', symbol: 'render', binanceSymbol: 'RENDERUSDT', category: 'عملات رقمية' },
  { name: 'Injective', nameAr: 'إنجيكتيف', symbol: 'injective', binanceSymbol: 'INJUSDT', category: 'عملات رقمية' },
  
  // Commodities
  { name: 'Gold', nameAr: 'الذهب', symbol: 'gold', binanceSymbol: 'PAXGUSDT', category: 'سلع' },
  { name: 'Silver', nameAr: 'الفضة', symbol: 'silver', category: 'سلع' },
  { name: 'Oil (WTI)', nameAr: 'النفط الخام', symbol: 'oil', category: 'سلع' },
  { name: 'Brent Oil', nameAr: 'نفط برنت', symbol: 'brentoil', category: 'سلع' },
  { name: 'Natural Gas', nameAr: 'الغاز الطبيعي', symbol: 'naturalgas', category: 'سلع' },
  { name: 'Platinum', nameAr: 'البلاتين', symbol: 'platinum', category: 'سلع' },
  { name: 'Palladium', nameAr: 'البلاديوم', symbol: 'palladium', category: 'سلع' },
  { name: 'Copper', nameAr: 'النحاس', symbol: 'copper', category: 'سلع' },
  { name: 'Wheat', nameAr: 'القمح', symbol: 'wheat', category: 'سلع' },
  { name: 'Corn', nameAr: 'الذرة', symbol: 'corn', category: 'سلع' },
  { name: 'Soybeans', nameAr: 'فول الصويا', symbol: 'soybeans', category: 'سلع' },
  { name: 'Coffee', nameAr: 'القهوة', symbol: 'coffee', category: 'سلع' },
  { name: 'Sugar', nameAr: 'السكر', symbol: 'sugar', category: 'سلع' },
  { name: 'Cotton', nameAr: 'القطن', symbol: 'cotton', category: 'سلع' },
  
  // Indices
  { name: 'S&P 500', nameAr: 'إس آند بي 500', symbol: 'sp500', category: 'مؤشرات' },
  { name: 'Dow Jones', nameAr: 'داو جونز', symbol: 'dowjones', category: 'مؤشرات' },
  { name: 'NASDAQ', nameAr: 'ناسداك', symbol: 'nasdaq', category: 'مؤشرات' },
  { name: 'Russell 2000', nameAr: 'راسل 2000', symbol: 'russell2000', category: 'مؤشرات' },
  { name: 'DAX', nameAr: 'داكس الألماني', symbol: 'dax', category: 'مؤشرات' },
  { name: 'FTSE 100', nameAr: 'فوتسي 100', symbol: 'ftse100', category: 'مؤشرات' },
  { name: 'Nikkei 225', nameAr: 'نيكاي 225', symbol: 'nikkei', category: 'مؤشرات' },
  { name: 'CAC 40', nameAr: 'كاك 40', symbol: 'cac40', category: 'مؤشرات' },
  { name: 'Hang Seng', nameAr: 'هانج سينج', symbol: 'hangseng', category: 'مؤشرات' },
  { name: 'ASX 200', nameAr: 'إيه إس إكس 200', symbol: 'asx200', category: 'مؤشرات' },
  
  // US Stocks - Tech Giants & Popular Stocks (100+ stocks)
  { name: 'Apple', nameAr: 'أبل', symbol: 'apple', category: 'أسهم' },
  { name: 'Microsoft', nameAr: 'مايكروسوفت', symbol: 'microsoft', category: 'أسهم' },
  { name: 'Alphabet (Google)', nameAr: 'جوجل', symbol: 'google', category: 'أسهم' },
  { name: 'Amazon', nameAr: 'أمازون', symbol: 'amazon', category: 'أسهم' },
  { name: 'NVIDIA', nameAr: 'إنفيديا', symbol: 'nvidia', category: 'أسهم' },
  { name: 'Tesla', nameAr: 'تسلا', symbol: 'tesla', category: 'أسهم' },
  { name: 'Meta', nameAr: 'ميتا', symbol: 'meta', category: 'أسهم' },
  { name: 'Netflix', nameAr: 'نتفليكس', symbol: 'netflix', category: 'أسهم' },
  { name: 'AMD', nameAr: 'إيه إم دي', symbol: 'amd', category: 'أسهم' },
  { name: 'Intel', nameAr: 'إنتل', symbol: 'intel', category: 'أسهم' },
  { name: 'Qualcomm', nameAr: 'كوالكوم', symbol: 'qualcomm', category: 'أسهم' },
  { name: 'Broadcom', nameAr: 'برودكوم', symbol: 'broadcom', category: 'أسهم' },
  { name: 'Oracle', nameAr: 'أوراكل', symbol: 'oracle', category: 'أسهم' },
  { name: 'Salesforce', nameAr: 'سيلزفورس', symbol: 'salesforce', category: 'أسهم' },
  { name: 'Adobe', nameAr: 'أدوبي', symbol: 'adobe', category: 'أسهم' },
  { name: 'PayPal', nameAr: 'باي بال', symbol: 'paypal', category: 'أسهم' },
  { name: 'Visa', nameAr: 'فيزا', symbol: 'visa', category: 'أسهم' },
  { name: 'Mastercard', nameAr: 'ماستركارد', symbol: 'mastercard', category: 'أسهم' },
  { name: 'JPMorgan', nameAr: 'جيه بي مورجان', symbol: 'jpmorgan', category: 'أسهم' },
  { name: 'Bank of America', nameAr: 'بنك أوف أمريكا', symbol: 'bankofamerica', category: 'أسهم' },
  { name: 'Wells Fargo', nameAr: 'ويلز فارجو', symbol: 'wellsfargo', category: 'أسهم' },
  { name: 'Goldman Sachs', nameAr: 'جولدمان ساكس', symbol: 'goldmansachs', category: 'أسهم' },
  { name: 'Morgan Stanley', nameAr: 'مورجان ستانلي', symbol: 'morganstanley', category: 'أسهم' },
  { name: 'Berkshire Hathaway', nameAr: 'بيركشاير هاثاواي', symbol: 'berkshire', category: 'أسهم' },
  { name: 'Johnson & Johnson', nameAr: 'جونسون آند جونسون', symbol: 'jnj', category: 'أسهم' },
  { name: 'Pfizer', nameAr: 'فايزر', symbol: 'pfizer', category: 'أسهم' },
  { name: 'Moderna', nameAr: 'مودرنا', symbol: 'moderna', category: 'أسهم' },
  { name: 'Abbott Labs', nameAr: 'أبوت', symbol: 'abbott', category: 'أسهم' },
  { name: 'Merck', nameAr: 'ميرك', symbol: 'merck', category: 'أسهم' },
  { name: 'Eli Lilly', nameAr: 'إيلي ليلي', symbol: 'elililly', category: 'أسهم' },
  { name: 'UnitedHealth', nameAr: 'يونايتد هيلث', symbol: 'unitedhealth', category: 'أسهم' },
  { name: 'Disney', nameAr: 'ديزني', symbol: 'disney', category: 'أسهم' },
  { name: 'Comcast', nameAr: 'كومكاست', symbol: 'comcast', category: 'أسهم' },
  { name: 'Coca-Cola', nameAr: 'كوكا كولا', symbol: 'cocacola', category: 'أسهم' },
  { name: 'PepsiCo', nameAr: 'بيبسيكو', symbol: 'pepsico', category: 'أسهم' },
  { name: 'Procter & Gamble', nameAr: 'بروكتر آند جامبل', symbol: 'pg', category: 'أسهم' },
  { name: 'Nike', nameAr: 'نايكي', symbol: 'nike', category: 'أسهم' },
  { name: 'Starbucks', nameAr: 'ستاربكس', symbol: 'starbucks', category: 'أسهم' },
  { name: "McDonald's", nameAr: 'ماكدونالدز', symbol: 'mcdonalds', category: 'أسهم' },
  { name: 'Home Depot', nameAr: 'هوم ديبو', symbol: 'homedepot', category: 'أسهم' },
  { name: 'Walmart', nameAr: 'وول مارت', symbol: 'walmart', category: 'أسهم' },
  { name: 'Target', nameAr: 'تارجت', symbol: 'target', category: 'أسهم' },
  { name: 'Costco', nameAr: 'كوستكو', symbol: 'costco', category: 'أسهم' },
  { name: 'ExxonMobil', nameAr: 'إكسون موبيل', symbol: 'exxonmobil', category: 'أسهم' },
  { name: 'Chevron', nameAr: 'شيفرون', symbol: 'chevron', category: 'أسهم' },
  { name: 'ConocoPhillips', nameAr: 'كونوكو فيليبس', symbol: 'conocophillips', category: 'أسهم' },
  { name: 'Schlumberger', nameAr: 'شلمبرجير', symbol: 'schlumberger', category: 'أسهم' },
  { name: 'Boeing', nameAr: 'بوينج', symbol: 'boeing', category: 'أسهم' },
  { name: 'Lockheed Martin', nameAr: 'لوكهيد مارتن', symbol: 'lockheedmartin', category: 'أسهم' },
  { name: 'Raytheon', nameAr: 'رايثيون', symbol: 'raytheon', category: 'أسهم' },
  { name: 'Caterpillar', nameAr: 'كاتربيلر', symbol: 'caterpillar', category: 'أسهم' },
  { name: '3M Company', nameAr: '3إم', symbol: '3m', category: 'أسهم' },
  { name: 'General Electric', nameAr: 'جنرال إلكتريك', symbol: 'ge', category: 'أسهم' },
  { name: 'Ford', nameAr: 'فورد', symbol: 'ford', category: 'أسهم' },
  { name: 'GM', nameAr: 'جنرال موتورز', symbol: 'gm', category: 'أسهم' },
  { name: 'Rivian', nameAr: 'ريفيان', symbol: 'rivian', category: 'أسهم' },
  { name: 'Lucid', nameAr: 'لوسيد', symbol: 'lucid', category: 'أسهم' },
  { name: 'American Airlines', nameAr: 'أمريكان إيرلاينز', symbol: 'americanairlines', category: 'أسهم' },
  { name: 'Delta Airlines', nameAr: 'دلتا', symbol: 'delta', category: 'أسهم' },
  { name: 'United Airlines', nameAr: 'يونايتد', symbol: 'united', category: 'أسهم' },
  { name: 'Southwest', nameAr: 'ساوثويست', symbol: 'southwest', category: 'أسهم' },
  { name: 'Uber', nameAr: 'أوبر', symbol: 'uber', category: 'أسهم' },
  { name: 'Lyft', nameAr: 'ليفت', symbol: 'lyft', category: 'أسهم' },
  { name: 'Airbnb', nameAr: 'إير بي إن بي', symbol: 'airbnb', category: 'أسهم' },
  { name: 'Booking.com', nameAr: 'بوكينج', symbol: 'booking', category: 'أسهم' },
  { name: 'Marriott', nameAr: 'ماريوت', symbol: 'marriott', category: 'أسهم' },
  { name: 'Hilton', nameAr: 'هيلتون', symbol: 'hilton', category: 'أسهم' },
  { name: 'AT&T', nameAr: 'إيه تي آند تي', symbol: 'att', category: 'أسهم' },
  { name: 'Verizon', nameAr: 'فيرايزون', symbol: 'verizon', category: 'أسهم' },
  { name: 'T-Mobile', nameAr: 'تي موبايل', symbol: 'tmobile', category: 'أسهم' },
  { name: 'Zoom', nameAr: 'زووم', symbol: 'zoom', category: 'أسهم' },
  { name: 'Palantir', nameAr: 'بالانتير', symbol: 'palantir', category: 'أسهم' },
  { name: 'Snowflake', nameAr: 'سنوفليك', symbol: 'snowflake', category: 'أسهم' },
  { name: 'CrowdStrike', nameAr: 'كراود سترايك', symbol: 'crowdstrike', category: 'أسهم' },
  { name: 'Datadog', nameAr: 'داتادوج', symbol: 'datadog', category: 'أسهم' },
  { name: 'Shopify', nameAr: 'شوبيفاي', symbol: 'shopify', category: 'أسهم' },
  { name: 'Square', nameAr: 'سكوير', symbol: 'square', category: 'أسهم' },
  { name: 'Block', nameAr: 'بلوك', symbol: 'block', category: 'أسهم' },
  { name: 'Coinbase', nameAr: 'كوين بيز', symbol: 'coinbase', category: 'أسهم' },
  { name: 'Robinhood', nameAr: 'روبن هود', symbol: 'robinhood', category: 'أسهم' },
  { name: 'Spotify', nameAr: 'سبوتيفاي', symbol: 'spotify', category: 'أسهم' },
  { name: 'Twitch', nameAr: 'تويتش', symbol: 'twitch', category: 'أسهم' },
  { name: 'Roblox', nameAr: 'روبلوكس', symbol: 'roblox', category: 'أسهم' },
  { name: 'Unity', nameAr: 'يونيتي', symbol: 'unity', category: 'أسهم' },
  { name: 'Electronic Arts', nameAr: 'إلكترونيك آرتس', symbol: 'ea', category: 'أسهم' },
  { name: 'Take-Two', nameAr: 'تيك تو', symbol: 'taketwo', category: 'أسهم' },
  { name: 'Activision', nameAr: 'أكتيفيجن', symbol: 'activision', category: 'أسهم' },
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
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  const fetchPrices = async () => {
    try {
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

  const handleFavoriteClick = (e: React.MouseEvent, market: MarketItem) => {
    e.stopPropagation();
    if (isFavorite(market.symbol)) {
      removeFavorite(market.symbol);
    } else {
      addFavorite(market.symbol, market.nameAr, market.name, market.category);
    }
  };

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
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">جميع الأسواق</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchPrices}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
            </p>
          )}
        </div>
      </header>

      {/* Favorites Quick Access */}
      {favorites.length > 0 && (
        <div className="container mx-auto px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-5 w-5 text-warning fill-warning" />
            <span className="text-foreground font-medium">المفضلة</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => navigate(`/live-chart?symbol=${fav.symbol}`)}
                className="flex-shrink-0 px-4 py-2 bg-warning/10 border border-warning/20 rounded-full text-warning text-sm hover:bg-warning/20 transition-colors"
              >
                {fav.symbol_name_ar}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Markets Accordion */}
      <main className="container mx-auto px-4 py-6">
        <Accordion type="multiple" defaultValue={['عملات رقمية']} className="space-y-4">
          {categories.map((category) => {
            const categoryMarkets = markets.filter((market) => market.category === category);
            
            return (
              <AccordionItem key={category} value={category} className="bg-secondary/30 border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{categoryIcons[category]}</span>
                    <h2 className="text-lg font-bold text-foreground">{category}</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full mr-auto">
                      {categoryMarkets.length} سوق
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-4">
                    {categoryMarkets.map((market) => {
                      const priceData = prices[market.symbol];
                      const isMarketFavorite = isFavorite(market.symbol);
                      
                      return (
                        <Card
                          key={market.symbol}
                          className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:bg-accent/50 hover:scale-[1.02]"
                          onClick={() => navigate(`/live-chart?symbol=${market.symbol}`)}
                        >
                          <div className="p-4">
                            {/* Favorite Button */}
                            <button
                              onClick={(e) => handleFavoriteClick(e, market)}
                              className={`absolute top-2 left-2 p-1.5 rounded-full transition-all ${
                                isMarketFavorite 
                                  ? 'text-warning bg-warning/20' 
                                  : 'text-muted-foreground hover:text-warning hover:bg-warning/10 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <Star className={`h-4 w-4 ${isMarketFavorite ? 'fill-warning' : ''}`} />
                            </button>

                            {/* Market Name */}
                            <div className="mb-3">
                              <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                {market.nameAr}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{market.name}</p>
                            </div>
                            
                            {/* Price Section */}
                            {priceData ? (
                              <div className="space-y-2">
                                <p className="text-lg font-bold text-foreground">
                                  ${formatPrice(priceData.price)}
                                </p>
                                <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                  priceData.isPositive 
                                    ? 'bg-success/20 text-success' 
                                    : 'bg-destructive/20 text-destructive'
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
                              <div className="flex items-center gap-2 text-muted-foreground">
                                {loading && market.binanceSymbol ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <span className="text-xs">عرض الشارت →</span>
                                )}
                              </div>
                            )}
                            
                            {/* Hover Arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowLeft className="h-5 w-5 text-primary rotate-180" />
                            </div>
                          </div>
                          
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}

        </Accordion>
        
        {/* Footer Info */}
        <div className="text-center py-8 border-t border-border mt-8">
          <p className="text-muted-foreground text-sm">
            الأسعار مباشرة من Binance • التحديث كل 10 ثوانٍ
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            اضغط على أي سوق لعرض الشارت المباشر من TradingView
          </p>
        </div>
      </main>
    </div>
  );
};

export default Markets;
