import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating financial news...');
    
    // Generate current financial news with realistic data
    const now = new Date();
    const newsArticles = [
      {
        title: "Bitcoin Surges Past $92,000 as Institutional Interest Grows",
        description: "Bitcoin continues its impressive rally, driven by increased institutional adoption and positive regulatory developments. Analysts predict further upside potential.",
        url: "https://www.coindesk.com/markets/",
        urlToImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
        publishedAt: new Date(now.getTime() - 1800000).toISOString(),
        source: { name: "CoinDesk" }
      },
      {
        title: "Forex Market Sees USD Strength Against Major Currencies",
        description: "The US Dollar gains momentum against major currency pairs as Federal Reserve maintains hawkish stance on interest rates.",
        url: "https://www.forexfactory.com/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 3600000).toISOString(),
        source: { name: "Forex Factory" }
      },
      {
        title: "Gold Prices Stabilize as Investors Await Economic Data",
        description: "Gold trading remains range-bound as markets digest recent economic indicators and await key employment data releases.",
        url: "https://www.kitco.com/",
        urlToImage: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
        publishedAt: new Date(now.getTime() - 5400000).toISOString(),
        source: { name: "Kitco News" }
      },
      {
        title: "Stock Markets Hit Record Highs Led by Tech Giants",
        description: "Major indices reach new peaks as technology stocks lead the rally. NASDAQ gains 2.3% while S&P 500 adds 1.8%.",
        url: "https://www.bloomberg.com/markets/stocks",
        urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        publishedAt: new Date(now.getTime() - 7200000).toISOString(),
        source: { name: "Bloomberg" }
      },
      {
        title: "Oil Prices Rise on Middle East Tensions and Supply Concerns",
        description: "Crude oil futures climb 3% as geopolitical tensions escalate in key producing regions, raising supply disruption concerns.",
        url: "https://www.reuters.com/markets/commodities/",
        urlToImage: "https://images.unsplash.com/photo-1541844310068-fcd3935d8d51?w=800&q=80",
        publishedAt: new Date(now.getTime() - 9000000).toISOString(),
        source: { name: "Reuters" }
      },
      {
        title: "EUR/USD Breaks Key Support Level Amid Economic Weakness",
        description: "The Euro weakens against the Dollar as eurozone economic data disappoints, breaking below crucial 1.05 support level.",
        url: "https://www.investing.com/currencies/eur-usd",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        publishedAt: new Date(now.getTime() - 10800000).toISOString(),
        source: { name: "Investing.com" }
      },
      {
        title: "Cryptocurrency Market Cap Reaches New All-Time High",
        description: "Total cryptocurrency market capitalization surpasses $3 trillion as altcoins rally alongside Bitcoin's impressive performance.",
        url: "https://www.coinmarketcap.com/",
        urlToImage: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80",
        publishedAt: new Date(now.getTime() - 12600000).toISOString(),
        source: { name: "CoinMarketCap" }
      },
      {
        title: "Asian Markets Mixed as China Growth Data Disappoints",
        description: "Asian stock markets show mixed performance after Chinese economic growth figures fall short of expectations.",
        url: "https://www.cnbc.com/world-markets/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 14400000).toISOString(),
        source: { name: "CNBC" }
      },
      {
        title: "Silver Prices Jump 5% Following Gold's Upward Momentum",
        description: "Silver catches up with gold's rally, posting strongest single-day gain in three months on industrial demand expectations.",
        url: "https://www.metals.com/",
        urlToImage: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
        publishedAt: new Date(now.getTime() - 16200000).toISOString(),
        source: { name: "Metals Daily" }
      },
      {
        title: "Central Banks Signal Continued Support for Financial Markets",
        description: "Major central banks reaffirm commitment to maintaining accommodative monetary policies, boosting risk appetite among investors.",
        url: "https://www.centralbanknews.com/",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        publishedAt: new Date(now.getTime() - 18000000).toISOString(),
        source: { name: "Central Banking" }
      },
      {
        title: "Emerging Market Currencies Gain on Dollar Weakness",
        description: "Emerging market currencies rally as US Dollar weakens, with Turkish Lira and Brazilian Real posting significant gains.",
        url: "https://www.ft.com/markets",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 19800000).toISOString(),
        source: { name: "Financial Times" }
      },
      {
        title: "Ethereum Upgrade Boosts Network Activity and Price",
        description: "Ethereum completes major network upgrade, resulting in reduced transaction fees and increased on-chain activity.",
        url: "https://ethereum.org/",
        urlToImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
        publishedAt: new Date(now.getTime() - 21600000).toISOString(),
        source: { name: "Ethereum Foundation" }
      },
      {
        title: "Commodities Rally as Inflation Concerns Persist",
        description: "Broad-based commodity rally continues as investors seek inflation hedges amid persistent price pressures.",
        url: "https://www.kitco.com/commodities/",
        urlToImage: "https://images.unsplash.com/photo-1541844310068-fcd3935d8d51?w=800&q=80",
        publishedAt: new Date(now.getTime() - 23400000).toISOString(),
        source: { name: "Commodities News" }
      },
      {
        title: "Japanese Yen Weakens to Multi-Year Lows Against Dollar",
        description: "USD/JPY reaches 150 level as Bank of Japan maintains ultra-loose monetary policy despite global tightening trend.",
        url: "https://www.forexlive.com/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 25200000).toISOString(),
        source: { name: "ForexLive" }
      },
      {
        title: "Tech Stocks Lead Market Recovery After Yesterday's Selloff",
        description: "Technology sector rebounds strongly with major tech stocks gaining 3-5% as investors view dip as buying opportunity.",
        url: "https://www.marketwatch.com/",
        urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        publishedAt: new Date(now.getTime() - 27000000).toISOString(),
        source: { name: "MarketWatch" }
      }
    ];

    console.log('Returning generated articles:', newsArticles.length);

    return new Response(
      JSON.stringify({ articles: newsArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-financial-news:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});