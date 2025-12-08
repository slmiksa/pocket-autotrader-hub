import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, RefreshCw, Star, User, BarChart3, Sparkles, Bell, Search } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { PriceAlertDialog } from '@/components/alerts/PriceAlertDialog';
import { supabase } from '@/integrations/supabase/client';
import { PullToRefresh } from '@/components/PullToRefresh';
import { toast } from 'sonner';

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
{
  name: 'EUR/USD',
  nameAr: 'يورو/دولار',
  symbol: 'eurusd',
  category: 'فوركس'
}, {
  name: 'GBP/USD',
  nameAr: 'جنيه/دولار',
  symbol: 'gbpusd',
  category: 'فوركس'
}, {
  name: 'USD/JPY',
  nameAr: 'دولار/ين',
  symbol: 'usdjpy',
  category: 'فوركس'
}, {
  name: 'USD/CHF',
  nameAr: 'دولار/فرنك',
  symbol: 'usdchf',
  category: 'فوركس'
}, {
  name: 'AUD/USD',
  nameAr: 'أسترالي/دولار',
  symbol: 'audusd',
  category: 'فوركس'
}, {
  name: 'USD/CAD',
  nameAr: 'دولار/كندي',
  symbol: 'usdcad',
  category: 'فوركس'
}, {
  name: 'NZD/USD',
  nameAr: 'نيوزيلندي/دولار',
  symbol: 'nzdusd',
  category: 'فوركس'
}, {
  name: 'EUR/GBP',
  nameAr: 'يورو/جنيه',
  symbol: 'eurgbp',
  category: 'فوركس'
}, {
  name: 'EUR/JPY',
  nameAr: 'يورو/ين',
  symbol: 'eurjpy',
  category: 'فوركس'
}, {
  name: 'GBP/JPY',
  nameAr: 'جنيه/ين',
  symbol: 'gbpjpy',
  category: 'فوركس'
}, {
  name: 'EUR/CHF',
  nameAr: 'يورو/فرنك',
  symbol: 'eurchf',
  category: 'فوركس'
}, {
  name: 'EUR/AUD',
  nameAr: 'يورو/أسترالي',
  symbol: 'euraud',
  category: 'فوركس'
}, {
  name: 'EUR/CAD',
  nameAr: 'يورو/كندي',
  symbol: 'eurcad',
  category: 'فوركس'
}, {
  name: 'EUR/NZD',
  nameAr: 'يورو/نيوزيلندي',
  symbol: 'eurnzd',
  category: 'فوركس'
}, {
  name: 'GBP/CHF',
  nameAr: 'جنيه/فرنك',
  symbol: 'gbpchf',
  category: 'فوركس'
}, {
  name: 'GBP/AUD',
  nameAr: 'جنيه/أسترالي',
  symbol: 'gbpaud',
  category: 'فوركس'
}, {
  name: 'GBP/CAD',
  nameAr: 'جنيه/كندي',
  symbol: 'gbpcad',
  category: 'فوركس'
}, {
  name: 'GBP/NZD',
  nameAr: 'جنيه/نيوزيلندي',
  symbol: 'gbpnzd',
  category: 'فوركس'
}, {
  name: 'AUD/JPY',
  nameAr: 'أسترالي/ين',
  symbol: 'audjpy',
  category: 'فوركس'
}, {
  name: 'AUD/NZD',
  nameAr: 'أسترالي/نيوزيلندي',
  symbol: 'audnzd',
  category: 'فوركس'
}, {
  name: 'AUD/CAD',
  nameAr: 'أسترالي/كندي',
  symbol: 'audcad',
  category: 'فوركس'
}, {
  name: 'AUD/CHF',
  nameAr: 'أسترالي/فرنك',
  symbol: 'audchf',
  category: 'فوركس'
}, {
  name: 'NZD/JPY',
  nameAr: 'نيوزيلندي/ين',
  symbol: 'nzdjpy',
  category: 'فوركس'
}, {
  name: 'NZD/CAD',
  nameAr: 'نيوزيلندي/كندي',
  symbol: 'nzdcad',
  category: 'فوركس'
}, {
  name: 'NZD/CHF',
  nameAr: 'نيوزيلندي/فرنك',
  symbol: 'nzdchf',
  category: 'فوركس'
}, {
  name: 'CAD/JPY',
  nameAr: 'كندي/ين',
  symbol: 'cadjpy',
  category: 'فوركس'
}, {
  name: 'CAD/CHF',
  nameAr: 'كندي/فرنك',
  symbol: 'cadchf',
  category: 'فوركس'
}, {
  name: 'CHF/JPY',
  nameAr: 'فرنك/ين',
  symbol: 'chfjpy',
  category: 'فوركس'
},
// Crypto - Top 50+ coins with Binance symbols
{
  name: 'Bitcoin',
  nameAr: 'بيتكوين',
  symbol: 'bitcoin',
  binanceSymbol: 'BTCUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Ethereum',
  nameAr: 'إيثريوم',
  symbol: 'ethereum',
  binanceSymbol: 'ETHUSDT',
  category: 'عملات رقمية'
}, {
  name: 'BNB',
  nameAr: 'بي إن بي',
  symbol: 'bnb',
  binanceSymbol: 'BNBUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Solana',
  nameAr: 'سولانا',
  symbol: 'solana',
  binanceSymbol: 'SOLUSDT',
  category: 'عملات رقمية'
}, {
  name: 'XRP',
  nameAr: 'ريبل',
  symbol: 'xrp',
  binanceSymbol: 'XRPUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Cardano',
  nameAr: 'كاردانو',
  symbol: 'cardano',
  binanceSymbol: 'ADAUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Dogecoin',
  nameAr: 'دوجكوين',
  symbol: 'dogecoin',
  binanceSymbol: 'DOGEUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Avalanche',
  nameAr: 'أفالانش',
  symbol: 'avalanche',
  binanceSymbol: 'AVAXUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Polkadot',
  nameAr: 'بولكادوت',
  symbol: 'polkadot',
  binanceSymbol: 'DOTUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Polygon',
  nameAr: 'بوليجون',
  symbol: 'polygon',
  binanceSymbol: 'MATICUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Chainlink',
  nameAr: 'تشين لينك',
  symbol: 'chainlink',
  binanceSymbol: 'LINKUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Litecoin',
  nameAr: 'لايتكوين',
  symbol: 'litecoin',
  binanceSymbol: 'LTCUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Shiba Inu',
  nameAr: 'شيبا إينو',
  symbol: 'shiba',
  binanceSymbol: 'SHIBUSDT',
  category: 'عملات رقمية'
}, {
  name: 'TRON',
  nameAr: 'ترون',
  symbol: 'tron',
  binanceSymbol: 'TRXUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Uniswap',
  nameAr: 'يونيسواب',
  symbol: 'uniswap',
  binanceSymbol: 'UNIUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Cosmos',
  nameAr: 'كوزموس',
  symbol: 'cosmos',
  binanceSymbol: 'ATOMUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Ethereum Classic',
  nameAr: 'إيثريوم كلاسيك',
  symbol: 'ethereumclassic',
  binanceSymbol: 'ETCUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Stellar',
  nameAr: 'ستيلار',
  symbol: 'stellar',
  binanceSymbol: 'XLMUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Bitcoin Cash',
  nameAr: 'بيتكوين كاش',
  symbol: 'bitcoincash',
  binanceSymbol: 'BCHUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Algorand',
  nameAr: 'ألجوراند',
  symbol: 'algorand',
  binanceSymbol: 'ALGOUSDT',
  category: 'عملات رقمية'
}, {
  name: 'VeChain',
  nameAr: 'في تشين',
  symbol: 'vechain',
  binanceSymbol: 'VETUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Filecoin',
  nameAr: 'فايل كوين',
  symbol: 'filecoin',
  binanceSymbol: 'FILUSDT',
  category: 'عملات رقمية'
}, {
  name: 'NEAR Protocol',
  nameAr: 'نير بروتوكول',
  symbol: 'near',
  binanceSymbol: 'NEARUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Aptos',
  nameAr: 'أبتوس',
  symbol: 'aptos',
  binanceSymbol: 'APTUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Arbitrum',
  nameAr: 'أربيتروم',
  symbol: 'arbitrum',
  binanceSymbol: 'ARBUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Optimism',
  nameAr: 'أوبتيميزم',
  symbol: 'optimism',
  binanceSymbol: 'OPUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Sui',
  nameAr: 'سوي',
  symbol: 'sui',
  binanceSymbol: 'SUIUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Pepe',
  nameAr: 'بيبي',
  symbol: 'pepe',
  binanceSymbol: 'PEPEUSDT',
  category: 'عملات رقمية'
}, {
  name: 'The Sandbox',
  nameAr: 'ذا ساندبوكس',
  symbol: 'sandbox',
  binanceSymbol: 'SANDUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Decentraland',
  nameAr: 'ديسنترالاند',
  symbol: 'decentraland',
  binanceSymbol: 'MANAUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Hedera',
  nameAr: 'هيديرا',
  symbol: 'hedera',
  binanceSymbol: 'HBARUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Fantom',
  nameAr: 'فانتوم',
  symbol: 'fantom',
  binanceSymbol: 'FTMUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Aave',
  nameAr: 'آفي',
  symbol: 'aave',
  binanceSymbol: 'AAVEUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Render',
  nameAr: 'رندر',
  symbol: 'render',
  binanceSymbol: 'RENDERUSDT',
  category: 'عملات رقمية'
}, {
  name: 'Injective',
  nameAr: 'إنجيكتيف',
  symbol: 'injective',
  binanceSymbol: 'INJUSDT',
  category: 'عملات رقمية'
},
// Commodities
{
  name: 'Gold',
  nameAr: 'الذهب',
  symbol: 'gold',
  binanceSymbol: 'PAXGUSDT',
  category: 'سلع'
}, {
  name: 'Silver',
  nameAr: 'الفضة',
  symbol: 'silver',
  category: 'سلع'
}, {
  name: 'Oil (WTI)',
  nameAr: 'النفط الخام',
  symbol: 'oil',
  category: 'سلع'
}, {
  name: 'Brent Oil',
  nameAr: 'نفط برنت',
  symbol: 'brentoil',
  category: 'سلع'
}, {
  name: 'Natural Gas',
  nameAr: 'الغاز الطبيعي',
  symbol: 'naturalgas',
  category: 'سلع'
}, {
  name: 'Platinum',
  nameAr: 'البلاتين',
  symbol: 'platinum',
  category: 'سلع'
}, {
  name: 'Palladium',
  nameAr: 'البلاديوم',
  symbol: 'palladium',
  category: 'سلع'
}, {
  name: 'Copper',
  nameAr: 'النحاس',
  symbol: 'copper',
  category: 'سلع'
}, {
  name: 'Wheat',
  nameAr: 'القمح',
  symbol: 'wheat',
  category: 'سلع'
}, {
  name: 'Corn',
  nameAr: 'الذرة',
  symbol: 'corn',
  category: 'سلع'
}, {
  name: 'Soybeans',
  nameAr: 'فول الصويا',
  symbol: 'soybeans',
  category: 'سلع'
}, {
  name: 'Coffee',
  nameAr: 'القهوة',
  symbol: 'coffee',
  category: 'سلع'
}, {
  name: 'Sugar',
  nameAr: 'السكر',
  symbol: 'sugar',
  category: 'سلع'
}, {
  name: 'Cotton',
  nameAr: 'القطن',
  symbol: 'cotton',
  category: 'سلع'
},
// Indices
{
  name: 'S&P 500',
  nameAr: 'إس آند بي 500',
  symbol: 'sp500',
  category: 'مؤشرات'
}, {
  name: 'Dow Jones',
  nameAr: 'داو جونز',
  symbol: 'dowjones',
  category: 'مؤشرات'
}, {
  name: 'NASDAQ',
  nameAr: 'ناسداك',
  symbol: 'nasdaq',
  category: 'مؤشرات'
}, {
  name: 'Russell 2000',
  nameAr: 'راسل 2000',
  symbol: 'russell2000',
  category: 'مؤشرات'
}, {
  name: 'DAX',
  nameAr: 'داكس الألماني',
  symbol: 'dax',
  category: 'مؤشرات'
}, {
  name: 'FTSE 100',
  nameAr: 'فوتسي 100',
  symbol: 'ftse100',
  category: 'مؤشرات'
}, {
  name: 'Nikkei 225',
  nameAr: 'نيكاي 225',
  symbol: 'nikkei',
  category: 'مؤشرات'
}, {
  name: 'CAC 40',
  nameAr: 'كاك 40',
  symbol: 'cac40',
  category: 'مؤشرات'
}, {
  name: 'Hang Seng',
  nameAr: 'هانج سينج',
  symbol: 'hangseng',
  category: 'مؤشرات'
}, {
  name: 'ASX 200',
  nameAr: 'إيه إس إكس 200',
  symbol: 'asx200',
  category: 'مؤشرات'
},
// US Stocks - Tech Giants & Popular Stocks (100+ stocks)
{
  name: 'Apple',
  nameAr: 'أبل',
  symbol: 'apple',
  category: 'أسهم'
}, {
  name: 'Microsoft',
  nameAr: 'مايكروسوفت',
  symbol: 'microsoft',
  category: 'أسهم'
}, {
  name: 'Alphabet (Google)',
  nameAr: 'جوجل',
  symbol: 'google',
  category: 'أسهم'
}, {
  name: 'Amazon',
  nameAr: 'أمازون',
  symbol: 'amazon',
  category: 'أسهم'
}, {
  name: 'NVIDIA',
  nameAr: 'إنفيديا',
  symbol: 'nvidia',
  category: 'أسهم'
}, {
  name: 'Tesla',
  nameAr: 'تسلا',
  symbol: 'tesla',
  category: 'أسهم'
}, {
  name: 'Meta',
  nameAr: 'ميتا',
  symbol: 'meta',
  category: 'أسهم'
}, {
  name: 'Netflix',
  nameAr: 'نتفليكس',
  symbol: 'netflix',
  category: 'أسهم'
}, {
  name: 'AMD',
  nameAr: 'إيه إم دي',
  symbol: 'amd',
  category: 'أسهم'
}, {
  name: 'Intel',
  nameAr: 'إنتل',
  symbol: 'intel',
  category: 'أسهم'
}, {
  name: 'Qualcomm',
  nameAr: 'كوالكوم',
  symbol: 'qualcomm',
  category: 'أسهم'
}, {
  name: 'Broadcom',
  nameAr: 'برودكوم',
  symbol: 'broadcom',
  category: 'أسهم'
}, {
  name: 'Oracle',
  nameAr: 'أوراكل',
  symbol: 'oracle',
  category: 'أسهم'
}, {
  name: 'Salesforce',
  nameAr: 'سيلزفورس',
  symbol: 'salesforce',
  category: 'أسهم'
}, {
  name: 'Adobe',
  nameAr: 'أدوبي',
  symbol: 'adobe',
  category: 'أسهم'
}, {
  name: 'PayPal',
  nameAr: 'باي بال',
  symbol: 'paypal',
  category: 'أسهم'
}, {
  name: 'Visa',
  nameAr: 'فيزا',
  symbol: 'visa',
  category: 'أسهم'
}, {
  name: 'Mastercard',
  nameAr: 'ماستركارد',
  symbol: 'mastercard',
  category: 'أسهم'
}, {
  name: 'JPMorgan',
  nameAr: 'جيه بي مورجان',
  symbol: 'jpmorgan',
  category: 'أسهم'
}, {
  name: 'Bank of America',
  nameAr: 'بنك أوف أمريكا',
  symbol: 'bankofamerica',
  category: 'أسهم'
}, {
  name: 'Wells Fargo',
  nameAr: 'ويلز فارجو',
  symbol: 'wellsfargo',
  category: 'أسهم'
}, {
  name: 'Goldman Sachs',
  nameAr: 'جولدمان ساكس',
  symbol: 'goldmansachs',
  category: 'أسهم'
}, {
  name: 'Morgan Stanley',
  nameAr: 'مورجان ستانلي',
  symbol: 'morganstanley',
  category: 'أسهم'
}, {
  name: 'Berkshire Hathaway',
  nameAr: 'بيركشاير هاثاواي',
  symbol: 'berkshire',
  category: 'أسهم'
}, {
  name: 'Johnson & Johnson',
  nameAr: 'جونسون آند جونسون',
  symbol: 'jnj',
  category: 'أسهم'
}, {
  name: 'Pfizer',
  nameAr: 'فايزر',
  symbol: 'pfizer',
  category: 'أسهم'
}, {
  name: 'Moderna',
  nameAr: 'مودرنا',
  symbol: 'moderna',
  category: 'أسهم'
}, {
  name: 'Abbott Labs',
  nameAr: 'أبوت',
  symbol: 'abbott',
  category: 'أسهم'
}, {
  name: 'Merck',
  nameAr: 'ميرك',
  symbol: 'merck',
  category: 'أسهم'
}, {
  name: 'Eli Lilly',
  nameAr: 'إيلي ليلي',
  symbol: 'elililly',
  category: 'أسهم'
}, {
  name: 'UnitedHealth',
  nameAr: 'يونايتد هيلث',
  symbol: 'unitedhealth',
  category: 'أسهم'
}, {
  name: 'Disney',
  nameAr: 'ديزني',
  symbol: 'disney',
  category: 'أسهم'
}, {
  name: 'Comcast',
  nameAr: 'كومكاست',
  symbol: 'comcast',
  category: 'أسهم'
}, {
  name: 'Coca-Cola',
  nameAr: 'كوكا كولا',
  symbol: 'cocacola',
  category: 'أسهم'
}, {
  name: 'PepsiCo',
  nameAr: 'بيبسيكو',
  symbol: 'pepsico',
  category: 'أسهم'
}, {
  name: 'Procter & Gamble',
  nameAr: 'بروكتر آند جامبل',
  symbol: 'pg',
  category: 'أسهم'
}, {
  name: 'Nike',
  nameAr: 'نايكي',
  symbol: 'nike',
  category: 'أسهم'
}, {
  name: 'Starbucks',
  nameAr: 'ستاربكس',
  symbol: 'starbucks',
  category: 'أسهم'
}, {
  name: "McDonald's",
  nameAr: 'ماكدونالدز',
  symbol: 'mcdonalds',
  category: 'أسهم'
}, {
  name: 'Home Depot',
  nameAr: 'هوم ديبو',
  symbol: 'homedepot',
  category: 'أسهم'
}, {
  name: 'Walmart',
  nameAr: 'وول مارت',
  symbol: 'walmart',
  category: 'أسهم'
}, {
  name: 'Target',
  nameAr: 'تارجت',
  symbol: 'target',
  category: 'أسهم'
}, {
  name: 'Costco',
  nameAr: 'كوستكو',
  symbol: 'costco',
  category: 'أسهم'
}, {
  name: 'ExxonMobil',
  nameAr: 'إكسون موبيل',
  symbol: 'exxonmobil',
  category: 'أسهم'
}, {
  name: 'Chevron',
  nameAr: 'شيفرون',
  symbol: 'chevron',
  category: 'أسهم'
}, {
  name: 'ConocoPhillips',
  nameAr: 'كونوكو فيليبس',
  symbol: 'conocophillips',
  category: 'أسهم'
}, {
  name: 'Schlumberger',
  nameAr: 'شلمبرجير',
  symbol: 'schlumberger',
  category: 'أسهم'
}, {
  name: 'Boeing',
  nameAr: 'بوينج',
  symbol: 'boeing',
  category: 'أسهم'
}, {
  name: 'Lockheed Martin',
  nameAr: 'لوكهيد مارتن',
  symbol: 'lockheedmartin',
  category: 'أسهم'
}, {
  name: 'Raytheon',
  nameAr: 'رايثيون',
  symbol: 'raytheon',
  category: 'أسهم'
}, {
  name: 'Caterpillar',
  nameAr: 'كاتربيلر',
  symbol: 'caterpillar',
  category: 'أسهم'
}, {
  name: '3M Company',
  nameAr: '3إم',
  symbol: '3m',
  category: 'أسهم'
}, {
  name: 'General Electric',
  nameAr: 'جنرال إلكتريك',
  symbol: 'ge',
  category: 'أسهم'
}, {
  name: 'Ford',
  nameAr: 'فورد',
  symbol: 'ford',
  category: 'أسهم'
}, {
  name: 'GM',
  nameAr: 'جنرال موتورز',
  symbol: 'gm',
  category: 'أسهم'
}, {
  name: 'Rivian',
  nameAr: 'ريفيان',
  symbol: 'rivian',
  category: 'أسهم'
}, {
  name: 'Lucid',
  nameAr: 'لوسيد',
  symbol: 'lucid',
  category: 'أسهم'
}, {
  name: 'American Airlines',
  nameAr: 'أمريكان إيرلاينز',
  symbol: 'americanairlines',
  category: 'أسهم'
}, {
  name: 'Delta Airlines',
  nameAr: 'دلتا',
  symbol: 'delta',
  category: 'أسهم'
}, {
  name: 'United Airlines',
  nameAr: 'يونايتد',
  symbol: 'united',
  category: 'أسهم'
}, {
  name: 'Southwest',
  nameAr: 'ساوثويست',
  symbol: 'southwest',
  category: 'أسهم'
}, {
  name: 'Uber',
  nameAr: 'أوبر',
  symbol: 'uber',
  category: 'أسهم'
}, {
  name: 'Lyft',
  nameAr: 'ليفت',
  symbol: 'lyft',
  category: 'أسهم'
}, {
  name: 'Airbnb',
  nameAr: 'إير بي إن بي',
  symbol: 'airbnb',
  category: 'أسهم'
}, {
  name: 'Booking.com',
  nameAr: 'بوكينج',
  symbol: 'booking',
  category: 'أسهم'
}, {
  name: 'Marriott',
  nameAr: 'ماريوت',
  symbol: 'marriott',
  category: 'أسهم'
}, {
  name: 'Hilton',
  nameAr: 'هيلتون',
  symbol: 'hilton',
  category: 'أسهم'
}, {
  name: 'AT&T',
  nameAr: 'إيه تي آند تي',
  symbol: 'att',
  category: 'أسهم'
}, {
  name: 'Verizon',
  nameAr: 'فيرايزون',
  symbol: 'verizon',
  category: 'أسهم'
}, {
  name: 'T-Mobile',
  nameAr: 'تي موبايل',
  symbol: 'tmobile',
  category: 'أسهم'
}, {
  name: 'Zoom',
  nameAr: 'زووم',
  symbol: 'zoom',
  category: 'أسهم'
}, {
  name: 'Palantir',
  nameAr: 'بالانتير',
  symbol: 'palantir',
  category: 'أسهم'
}, {
  name: 'Snowflake',
  nameAr: 'سنوفليك',
  symbol: 'snowflake',
  category: 'أسهم'
}, {
  name: 'CrowdStrike',
  nameAr: 'كراود سترايك',
  symbol: 'crowdstrike',
  category: 'أسهم'
}, {
  name: 'Datadog',
  nameAr: 'داتادوج',
  symbol: 'datadog',
  category: 'أسهم'
}, {
  name: 'Shopify',
  nameAr: 'شوبيفاي',
  symbol: 'shopify',
  category: 'أسهم'
}, {
  name: 'Square',
  nameAr: 'سكوير',
  symbol: 'square',
  category: 'أسهم'
}, {
  name: 'Block',
  nameAr: 'بلوك',
  symbol: 'block',
  category: 'أسهم'
}, {
  name: 'Coinbase',
  nameAr: 'كوين بيز',
  symbol: 'coinbase',
  category: 'أسهم'
}, {
  name: 'Robinhood',
  nameAr: 'روبن هود',
  symbol: 'robinhood',
  category: 'أسهم'
}, {
  name: 'Spotify',
  nameAr: 'سبوتيفاي',
  symbol: 'spotify',
  category: 'أسهم'
}, {
  name: 'Twitch',
  nameAr: 'تويتش',
  symbol: 'twitch',
  category: 'أسهم'
}, {
  name: 'Roblox',
  nameAr: 'روبلوكس',
  symbol: 'roblox',
  category: 'أسهم'
}, {
  name: 'Unity',
  nameAr: 'يونيتي',
  symbol: 'unity',
  category: 'أسهم'
}, {
  name: 'Electronic Arts',
  nameAr: 'إلكترونيك آرتس',
  symbol: 'ea',
  category: 'أسهم'
}, {
  name: 'Take-Two',
  nameAr: 'تيك تو',
  symbol: 'taketwo',
  category: 'أسهم'
}, {
  name: 'Activision',
  nameAr: 'أكتيفيجن',
  symbol: 'activision',
  category: 'أسهم'
},
// Saudi Market (Tadawul) - Major Saudi stocks
{
  name: 'Saudi Aramco',
  nameAr: 'أرامكو السعودية',
  symbol: 'TADAWUL:2222',
  category: 'السوق السعودي'
}, {
  name: 'Al Rajhi Bank',
  nameAr: 'مصرف الراجحي',
  symbol: 'TADAWUL:1120',
  category: 'السوق السعودي'
}, {
  name: 'SNB',
  nameAr: 'البنك الأهلي السعودي',
  symbol: 'TADAWUL:1180',
  category: 'السوق السعودي'
}, {
  name: 'SABIC',
  nameAr: 'سابك',
  symbol: 'TADAWUL:2010',
  category: 'السوق السعودي'
}, {
  name: 'STC',
  nameAr: 'الاتصالات السعودية',
  symbol: 'TADAWUL:7010',
  category: 'السوق السعودي'
}, {
  name: 'Maaden',
  nameAr: 'معادن',
  symbol: 'TADAWUL:1211',
  category: 'السوق السعودي'
}, {
  name: 'ACWA Power',
  nameAr: 'أكوا باور',
  symbol: 'TADAWUL:2082',
  category: 'السوق السعودي'
}, {
  name: 'Alinma Bank',
  nameAr: 'مصرف الإنماء',
  symbol: 'TADAWUL:1150',
  category: 'السوق السعودي'
}, {
  name: 'Riyad Bank',
  nameAr: 'بنك الرياض',
  symbol: 'TADAWUL:1010',
  category: 'السوق السعودي'
}, {
  name: 'SABB',
  nameAr: 'البنك السعودي البريطاني',
  symbol: 'TADAWUL:1060',
  category: 'السوق السعودي'
}, {
  name: 'Almarai',
  nameAr: 'المراعي',
  symbol: 'TADAWUL:2280',
  category: 'السوق السعودي'
}, {
  name: 'Jarir',
  nameAr: 'جرير',
  symbol: 'TADAWUL:4190',
  category: 'السوق السعودي'
}, {
  name: 'Extra',
  nameAr: 'إكسترا',
  symbol: 'TADAWUL:4003',
  category: 'السوق السعودي'
}, {
  name: 'Nahdi Medical',
  nameAr: 'النهدي الطبية',
  symbol: 'TADAWUL:4164',
  category: 'السوق السعودي'
}, {
  name: 'Dr Sulaiman Al Habib',
  nameAr: 'د.سليمان الحبيب',
  symbol: 'TADAWUL:4013',
  category: 'السوق السعودي'
}, {
  name: 'Bupa Arabia',
  nameAr: 'بوبا العربية',
  symbol: 'TADAWUL:8210',
  category: 'السوق السعودي'
}, {
  name: 'Tawuniya',
  nameAr: 'التعاونية',
  symbol: 'TADAWUL:8010',
  category: 'السوق السعودي'
}, {
  name: 'Elm',
  nameAr: 'علم',
  symbol: 'TADAWUL:7203',
  category: 'السوق السعودي'
}, {
  name: 'Saudi Cement',
  nameAr: 'الأسمنت السعودي',
  symbol: 'TADAWUL:3010',
  category: 'السوق السعودي'
}, {
  name: 'Yanbu Cement',
  nameAr: 'أسمنت ينبع',
  symbol: 'TADAWUL:3060',
  category: 'السوق السعودي'
}];
const categories = ['فوركس', 'عملات رقمية', 'سلع', 'مؤشرات', 'أسهم', 'السوق السعودي'];
const categoryIcons: {
  [key: string]: string;
} = {
  'فوركس': '💱',
  'عملات رقمية': '₿',
  'سلع': '🥇',
  'مؤشرات': '📊',
  'أسهم': '📈',
  'السوق السعودي': '🇸🇦'
};
const Markets = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<{
    [key: string]: PriceData;
  }>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [user, setUser] = useState<any>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);
  const [categorySearchTerms, setCategorySearchTerms] = useState<{
    [key: string]: string;
  }>({});
  const {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite
  } = useFavorites();

  // Check user auth
  useEffect(() => {
    supabase.auth.getUser().then(({
      data: {
        user
      }
    }) => setUser(user));
  }, []);
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const cryptoMarkets = markets.filter(m => m.binanceSymbol);
      const symbols = cryptoMarkets.map(m => `"${m.binanceSymbol}"`).join(',');
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
      const data = await response.json();
      const newPrices: {
        [key: string]: PriceData;
      } = {};
      data.forEach((ticker: any) => {
        const market = cryptoMarkets.find(m => m.binanceSymbol === ticker.symbol);
        if (market) {
          const change = parseFloat(ticker.priceChangePercent);
          newPrices[market.symbol] = {
            price: parseFloat(ticker.lastPrice),
            change24h: change,
            isPositive: change >= 0
          };
        }
      });
      setPrices(newPrices);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchPrices();
    toast.success('تم تحديث الأسعار');
  }, [fetchPrices]);
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
    } else {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
      });
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
  return <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pt-[calc(env(safe-area-inset-top,0px)+88px)]"><div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" dir="rtl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Page Header - Part of scrollable content */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl">
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white">جميع الأسواق</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchPrices} className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {lastUpdate && <p className="text-center text-xs text-slate-500 mt-2">
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
            </p>}
        </div>
      </header>

      {/* Favorites Quick Access */}
      {favorites.length > 0 && <div className="container mx-auto px-4 py-4 border-b border-slate-700/50 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">المفضلة</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {favorites.map(fav => <button key={fav.id} onClick={() => navigate(`/live-chart?symbol=${fav.symbol}`)} className="flex-shrink-0 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm hover:bg-amber-500/20 transition-all duration-300 hover:border-amber-400/50">
                {fav.symbol_name_ar}
              </button>)}
          </div>
        </div>}

      {/* Markets Accordion */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <Accordion type="multiple" defaultValue={[]} className="space-y-4">
          {categories.map(category => {
          const categoryMarkets = markets.filter(market => market.category === category);
          const searchKey = category as keyof typeof categorySearchTerms;
          const searchTerm = categorySearchTerms[searchKey] || '';
          const filteredMarkets = categoryMarkets.filter(market => market.name.toLowerCase().includes(searchTerm.toLowerCase()) || market.nameAr.includes(searchTerm));
          return <AccordionItem key={category} value={category} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{categoryIcons[category]}</span>
                    <h2 className="text-lg font-bold text-white">{category}</h2>
                    <span className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full mr-auto border border-slate-600/50">
                      {categoryMarkets.length} سوق
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  {/* Search Bar for Category */}
                  <div className="relative mt-4 mb-4">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="text" placeholder={`ابحث في ${category}...`} value={searchTerm} onChange={e => setCategorySearchTerms(prev => ({
                  ...prev,
                  [category]: e.target.value
                }))} className="pr-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredMarkets.map(market => {
                  const priceData = prices[market.symbol];
                  const isMarketFavorite = isFavorite(market.symbol);
                  return <div key={market.symbol} className="group relative overflow-hidden bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-amber-500/50 transition-all duration-300 cursor-pointer hover:bg-slate-700/40 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]" onClick={() => navigate(`/live-chart?symbol=${market.symbol}`)}>
                          <div className="p-4">
                            {/* Action Buttons */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {/* Alert Button */}
                              {user && <button onClick={e => {
                          e.stopPropagation();
                          setSelectedMarket(market);
                          setAlertDialogOpen(true);
                        }} className="p-1.5 rounded-full transition-all text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 opacity-0 group-hover:opacity-100" title="إضافة تنبيه سعري">
                                  <Bell className="h-4 w-4" />
                                </button>}
                              {/* Favorite Button */}
                              <button onClick={e => handleFavoriteClick(e, market)} className={`p-1.5 rounded-full transition-all ${isMarketFavorite ? 'text-amber-400 bg-amber-500/20' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100'}`}>
                                <Star className={`h-4 w-4 ${isMarketFavorite ? 'fill-amber-400' : ''}`} />
                              </button>
                            </div>

                            {/* Market Name */}
                            <div className="mb-3">
                              <p className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                                {market.nameAr}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{market.name}</p>
                            </div>
                            
                            {/* Price Section */}
                            {priceData ? <div className="space-y-2">
                                <p className="text-lg font-bold text-white">
                                  ${formatPrice(priceData.price)}
                                </p>
                                <div className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${priceData.isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                  {priceData.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  <span>
                                    {priceData.isPositive ? '+' : ''}
                                    {priceData.change24h.toFixed(2)}%
                                  </span>
                                </div>
                              </div> : <div className="flex items-center gap-2 text-slate-500">
                                {loading && market.binanceSymbol ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">عرض الشارت →</span>}
                              </div>}
                            
                            {/* Hover Arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowLeft className="h-5 w-5 text-amber-400 rotate-180" />
                            </div>
                          </div>
                          
                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-l from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>;
                })}
                  </div>
                </AccordionContent>
              </AccordionItem>;
        })}
        </Accordion>
        
        {/* Footer Info */}
        
      </main>

      {/* Price Alert Dialog */}
      {selectedMarket && <PriceAlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen} market={selectedMarket} currentPrice={prices[selectedMarket.symbol]?.price} />}
    </div></PullToRefresh>;
};
export default Markets;