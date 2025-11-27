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

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

// Parse RSS XML to extract news items
function parseRSSFeed(xml: string, sourceName: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Extract items from RSS feed
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    // Extract title
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract description
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    let description = descMatch ? descMatch[1].trim() : '';
    // Remove HTML tags from description
    description = description.replace(/<[^>]*>/g, '').trim();
    
    // Extract link
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    // Extract pubDate
    const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
    
    if (title && link) {
      items.push({
        title,
        description: description || title,
        link,
        pubDate,
        source: sourceName
      });
    }
  }
  
  return items;
}

// Fetch RSS feed with timeout
async function fetchRSSFeed(url: string, sourceName: string): Promise<RSSItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`Failed to fetch ${sourceName}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    return parseRSSFeed(xml, sourceName);
  } catch (error) {
    console.log(`Error fetching ${sourceName}:`, (error as Error).message);
    return [];
  }
}

// Translate text to Arabic using Lovable AI
async function translateToArabic(texts: { title: string; description: string }[], apiKey: string): Promise<{ title: string; description: string }[]> {
  try {
    const prompt = `ترجم العناوين والأوصاف التالية إلى اللغة العربية. حافظ على المصطلحات المالية والاقتصادية بدقة.
أعد النتيجة بصيغة JSON فقط (بدون markdown):

${JSON.stringify(texts)}

الصيغة المطلوبة:
[{"title": "العنوان بالعربية", "description": "الوصف بالعربية"}, ...]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return texts;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return texts;
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching real financial news from RSS feeds...');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // RSS Feed sources - free and real news
    const rssSources = [
      { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', name: 'Yahoo Finance' },
      { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', name: 'MarketWatch' },
      { url: 'https://feeds.content.dowjones.io/public/rss/mw_bulletins', name: 'MarketWatch Bulletins' },
      { url: 'https://www.investing.com/rss/news.rss', name: 'Investing.com' },
      { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', name: 'CNBC' },
      { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', name: 'CNBC Finance' },
      { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' },
    ];
    
    // Fetch all RSS feeds in parallel
    const feedPromises = rssSources.map(source => fetchRSSFeed(source.url, source.name));
    const feedResults = await Promise.all(feedPromises);
    
    // Combine all items
    let allItems: RSSItem[] = [];
    feedResults.forEach(items => {
      allItems = allItems.concat(items);
    });
    
    console.log(`Total items fetched: ${allItems.length}`);
    
    // If no items from RSS, try backup API
    if (allItems.length === 0) {
      console.log('No RSS items, trying backup...');
      // Use a simple backup - NewsData.io free tier doesn't need API key for limited requests
      try {
        const backupResponse = await fetch('https://newsdata.io/api/1/news?country=us&category=business&language=en&apikey=pub_0');
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          if (backupData.results) {
            allItems = backupData.results.slice(0, 15).map((item: any) => ({
              title: item.title,
              description: item.description || item.title,
              link: item.link,
              pubDate: item.pubDate || new Date().toISOString(),
              source: item.source_id || 'News Source'
            }));
          }
        }
      } catch (e) {
        console.log('Backup fetch failed:', e);
      }
    }
    
    // Sort by date (newest first) and take top 15
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });
    
    const topItems = allItems.slice(0, 15);
    
    if (topItems.length === 0) {
      return new Response(
        JSON.stringify({ articles: [], message: 'لم يتم العثور على أخبار حالياً' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare texts for translation
    const textsToTranslate = topItems.map(item => ({
      title: item.title,
      description: item.description.substring(0, 300)
    }));
    
    // Translate to Arabic
    console.log('Translating news to Arabic...');
    const translatedTexts = await translateToArabic(textsToTranslate, LOVABLE_API_KEY);
    
    // Financial images from Unsplash
    const imageIds = [
      '1611974789095-28e3e8873470',
      '1642790106117-e829e14a795f',
      '1535320903710-d993d3d77d29',
      '1621416894569-0f39ed31d247',
      '1559589688-40bde46aa2fd',
      '1634704784915-aef9be9241f8',
      '1642543492481-44e81e3914a7',
      '1590283603385-17ffb3a7f29f',
      '1633158829585-23ba8f7c8caf',
      '1579621970588-a35d0e7ab9b6',
      '1518186285589-2f7649de83e0',
      '1460925895917-afdab827c52f',
      '1504868584819-f8e8b4b6d7e3',
      '1507679799987-c73779587326',
      '1611974789855-9c2a0a7236a3'
    ];
    
    // Build final articles
    const articles: NewsArticle[] = topItems.map((item, index) => {
      const translated = translatedTexts[index] || { title: item.title, description: item.description };
      
      // Parse date
      let publishDate = new Date().toISOString();
      try {
        const parsed = new Date(item.pubDate);
        if (!isNaN(parsed.getTime())) {
          publishDate = parsed.toISOString();
        }
      } catch (e) {
        console.log('Date parse error');
      }
      
      return {
        title: translated.title,
        description: translated.description,
        url: item.link,
        urlToImage: `https://images.unsplash.com/photo-${imageIds[index % imageIds.length]}?w=800&q=80&fit=crop`,
        publishedAt: publishDate,
        source: {
          name: item.source
        }
      };
    });

    console.log('Returning real news articles:', articles.length);

    return new Response(
      JSON.stringify({ articles }),
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
