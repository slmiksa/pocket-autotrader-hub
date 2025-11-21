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
    console.log('Fetching real-time financial news...');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // Use Lovable AI to get latest financial news
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `ابحث عن أحدث 15 خبر مالي واقتصادي عن الأسهم والتداول والعملات والذهب والنفط من آخر 24 ساعة. 
            
            أرجع النتائج بصيغة JSON فقط بهذا الشكل (بدون أي نص إضافي):
            {
              "articles": [
                {
                  "title": "عنوان الخبر بالعربية",
                  "description": "وصف مفصل للخبر بالعربية (100-150 كلمة)",
                  "url": "رابط المصدر الأصلي",
                  "source": "اسم المصدر",
                  "publishedAt": "التاريخ والوقت بصيغة ISO"
                }
              ]
            }
            
            تأكد من:
            - جميع الأخبار حقيقية وحديثة من آخر 24 ساعة
            - كل خبر له رابط مصدر حقيقي
            - الوصف مفصل ومفيد بالعربية
            - تنوع المواضيع: أسهم، عملات، ذهب، نفط، بيتكوين، فوركس`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to fetch news from AI');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', aiData);
    
    let newsData;
    try {
      // Extract JSON from AI response
      const content = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      newsData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse news data');
    }

    // Add images from Unsplash based on topic
    const imageTopics = [
      'stock-market-trading',
      'forex-trading',
      'gold-investment',
      'cryptocurrency-bitcoin',
      'oil-commodities',
      'financial-chart',
      'stock-exchange',
      'currency-exchange',
      'investment-finance',
      'trading-desk',
      'market-analysis',
      'financial-news',
      'money-finance',
      'business-chart',
      'trading-screen'
    ];

    const articles: NewsArticle[] = newsData.articles.map((article: any, index: number) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: `https://images.unsplash.com/photo-${1460925895917 + index * 123456789}?w=800&q=80&topic=${imageTopics[index % imageTopics.length]}`,
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: {
        name: article.source || 'مصدر مالي'
      }
    }));

    console.log('Returning news articles:', articles.length);

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