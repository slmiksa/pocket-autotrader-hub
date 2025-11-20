import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching financial news...');
    
    // Fetch news from NewsAPI
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=trading OR forex OR stocks OR cryptocurrency OR finance&language=en&sortBy=publishedAt&pageSize=20&apiKey=demo`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!newsResponse.ok) {
      console.error('News API error:', newsResponse.status);
      throw new Error('Failed to fetch news');
    }

    const newsData = await newsResponse.json();
    console.log('Fetched articles:', newsData.articles?.length || 0);

    if (!newsData.articles || newsData.articles.length === 0) {
      // Fallback to sample news if API fails
      const fallbackNews = [
        {
          title: "Bitcoin Reaches New Heights in Trading Markets",
          description: "Bitcoin continues to show strong performance as global markets react to recent economic indicators.",
          url: "https://example.com/bitcoin-news",
          urlToImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800",
          publishedAt: new Date().toISOString(),
          source: { name: "Financial Times" }
        },
        {
          title: "Forex Markets Show Volatility Amid Economic Changes",
          description: "Major currency pairs experience significant movement as traders respond to central bank announcements.",
          url: "https://example.com/forex-news",
          urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          source: { name: "Bloomberg" }
        },
        {
          title: "Stock Market Rally Continues with Tech Sector Leading",
          description: "Technology stocks push major indices higher as investor confidence grows.",
          url: "https://example.com/stocks-news",
          urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          source: { name: "Reuters" }
        }
      ];
      
      return new Response(
        JSON.stringify({ articles: fallbackNews }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter and clean articles
    const cleanedArticles = newsData.articles
      .filter((article: NewsArticle) => 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
      )
      .slice(0, 20);

    console.log('Returning cleaned articles:', cleanedArticles.length);

    return new Response(
      JSON.stringify({ articles: cleanedArticles }),
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