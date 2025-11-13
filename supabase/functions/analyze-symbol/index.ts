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
    const { symbol, timeframe, assetType } = await req.json();
    console.log('Analyzing symbol:', symbol, 'timeframe:', timeframe, 'type:', assetType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get current price data based on asset type
    let priceData = '';
    let currentPrice = '';

    if (assetType === 'crypto') {
      // Fetch crypto data from CoinGecko
      const coinId = symbol.toLowerCase().replace('usdt', '');
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );
        const data = await response.json();
        if (data[coinId]) {
          currentPrice = `$${data[coinId].usd}`;
          const change24h = data[coinId].usd_24h_change?.toFixed(2) || 'N/A';
          priceData = `السعر الحالي: ${currentPrice}\nالتغير في 24 ساعة: ${change24h}%`;
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        priceData = 'لا يمكن الحصول على بيانات السعر حالياً';
      }
    } else if (assetType === 'forex') {
      // For forex, we'll use a simpler approach
      priceData = `زوج العملات: ${symbol}\nنوع الأصل: فوريكس`;
    } else {
      // For stocks, we'll use a simpler approach since we don't have a free real-time API
      priceData = `الرمز: ${symbol}\nنوع الأصل: سهم أمريكي`;
    }

    const timeframeMap: { [key: string]: string } = {
      '1m': '1-2 دقيقة',
      '5m': '5-15 دقيقة',
      '15m': '15-30 دقيقة',
      '30m': '30-60 دقيقة',
      '1h': '1-2 ساعة',
      '4h': '4-8 ساعات',
      '1d': 'يوم واحد أو أكثر'
    };

    let assetName = 'السهم';
    if (assetType === 'crypto') assetName = 'العملة الرقمية';
    if (assetType === 'forex') assetName = 'زوج العملات';
    
    const systemPrompt = `أنت محلل فني خبير في الأسواق المالية. مهمتك تحليل ${assetName} ${symbol} وتقديم توصيات دقيقة.

معلومات السوق الحالية:
${priceData}

الإطار الزمني المختار: ${timeframe}
مدة الصفقة المتوقعة: ${timeframeMap[timeframe] || 'متوسط'}

قدم تحليل شامل يتضمن:
1. الاتجاه العام للسعر (صاعد/هابط/محايد)
2. توصية واضحة (شراء/بيع)
3. نقطة الدخول المقترحة
4. مستوى وقف الخسارة (Stop Loss)
5. هدف جني الأرباح (Take Profit)
6. قوة الإشارة (ضعيفة/متوسطة/قوية/قوية جداً)
7. نصائح مهمة لإدارة المخاطر

يجب أن يكون الرد بصيغة JSON بالشكل التالي:
{
  "direction": "شراء أو بيع",
  "entryPoint": "السعر المقترح للدخول",
  "stopLoss": "سعر وقف الخسارة",
  "takeProfit": "سعر جني الأرباح",
  "confidence": "قوة الإشارة",
  "trend": "وصف الاتجاه العام",
  "analysis": "تحليل تفصيلي للوضع الحالي",
  "advice": "نصائح مهمة لإدارة المخاطر"
}`;

    const userPrompt = `حلل ${symbol} على إطار ${timeframe} وقدم توصية تداول كاملة. تأكد من أن التحليل واقعي ومبني على المعطيات الحالية.`;

    console.log('Calling Lovable AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let analysisText = aiData.choices[0].message.content;
    console.log('Raw AI response:', analysisText);

    // Extract JSON from markdown code blocks if present
    const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      analysisText = jsonMatch[1];
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Create a fallback structure
      analysis = {
        direction: analysisText.includes('شراء') || analysisText.includes('BUY') ? 'شراء' : 'بيع',
        entryPoint: currentPrice || 'السعر الحالي',
        stopLoss: 'يحدد حسب استراتيجيتك',
        takeProfit: 'يحدد حسب استراتيجيتك',
        confidence: 'متوسطة',
        trend: 'تحليل غير متوفر بصيغة منظمة',
        analysis: analysisText,
        advice: 'التزم بإدارة رأس المال وضع وقف خسارة مناسب'
      };
    }

    // Add current price to the analysis
    if (currentPrice) {
      analysis.currentPrice = currentPrice;
    }

    console.log('Analysis complete:', analysis);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-symbol function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
