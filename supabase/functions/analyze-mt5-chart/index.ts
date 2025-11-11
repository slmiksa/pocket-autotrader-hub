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
    const { image, timeframe } = await req.json();

    if (!image) {
      throw new Error('Image is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing MT5 chart with timeframe:', timeframe);

    // Prepare the image data
    const base64Image = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    // Map timeframe to recommended duration
    const durationMap: Record<string, string> = {
      '1m': '1-2 دقيقة',
      '5m': '5-10 دقائق',
      '15m': '15-30 دقيقة',
      '30m': '30-60 دقيقة',
      '1h': '1-2 ساعة',
      '4h': '4-8 ساعات',
      '1d': 'يوم واحد'
    };

    const recommendedDuration = durationMap[timeframe] || timeframe;

    const systemPrompt = `أنت خبير تحليل فني متخصص في MT5 (MetaTrader 5). مهمتك تحليل شارت الفوركس وإعطاء توصيات دقيقة ومفصلة.

الإطار الزمني: ${timeframe}
المدة الموصى بها للصفقة: ${recommendedDuration}

يجب أن يتضمن تحليلك:
1. **direction**: الاتجاه المقترح (شراء أو بيع)
2. **entryPoint**: نقطة الدخول المحددة (رقم السعر)
3. **stopLoss**: وقف الخسارة (رقم السعر) - يجب أن يكون دقيق جداً
4. **takeProfit**: جني الأرباح (رقم السعر) - الهدف المحدد
5. **confidence**: قوة الإشارة (ضعيفة، متوسطة، قوية، قوية جداً)
6. **trend**: الاتجاه العام للسوق (صاعد، هابط، عرضي)
7. **pattern**: نمط الشموع اليابانية المكتشف
8. **support**: مستوى الدعم الأقرب (رقم)
9. **resistance**: مستوى المقاومة الأقرب (رقم)
10. **advice**: نصائح مهمة للمتداول (3-5 نقاط)
11. **analysis**: تحليل تفصيلي للشارت

ملاحظات مهمة:
- استخدم أرقام دقيقة للأسعار (مثل: 0.65310)
- وقف الخسارة يجب أن يكون منطقي ويحمي رأس المال
- التحليل يجب أن يكون واضح ومفهوم للمبتدئين
- النصائح يجب أن تكون عملية وقابلة للتطبيق

أرجع الإجابة بصيغة JSON فقط بدون أي نص إضافي:
{
  "direction": "شراء أو بيع",
  "entryPoint": "رقم السعر",
  "stopLoss": "رقم السعر",
  "takeProfit": "رقم السعر",
  "confidence": "قوة الإشارة",
  "trend": "الاتجاه",
  "pattern": "نمط الشموع",
  "support": "رقم الدعم",
  "resistance": "رقم المقاومة",
  "advice": "نصائح مفصلة",
  "analysis": "تحليل كامل"
}`;

    const userPrompt = `حلل هذا الشارت من MT5 وأعطني توصية كاملة مع جميع التفاصيل المطلوبة.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    let analysisText = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    if (analysisText.includes('```json')) {
      analysisText = analysisText.split('```json')[1].split('```')[0].trim();
    } else if (analysisText.includes('```')) {
      analysisText = analysisText.split('```')[1].split('```')[0].trim();
    }

    // Try to parse as JSON, if fails return as text
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.log('Failed to parse as JSON, returning as text');
      analysis = {
        analysis: analysisText,
        direction: analysisText.includes('شراء') || analysisText.includes('BUY') ? 'شراء' : 'بيع',
        confidence: 'متوسطة'
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-mt5-chart:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});