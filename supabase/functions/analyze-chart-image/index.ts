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
    const { image, timeframe } = await req.json();

    if (!image || !timeframe) {
      throw new Error('يرجى تقديم الصورة وفترة الشمعة');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract base64 data from data URL if needed
    let base64Image = image;
    if (image.includes('base64,')) {
      base64Image = image.split('base64,')[1];
    }

    const systemPrompt = `أنت محلل فني محترف متخصص في تحليل الشموع اليابانية وأنماط الشارت.
مهمتك هي تحليل صورة الشارت المقدمة وتقديم توصية واضحة ومفصلة.

يجب أن يتضمن تحليلك:
1. **التوصية الرئيسية**: شراء (BUY) أو بيع (SELL)
2. **مستوى الدخول**: السعر المثالي للدخول في الصفقة
3. **وقف الخسارة (Stop Loss)**: المستوى الذي يجب الخروج عنده في حالة تحرك السعر ضدك
4. **جني الأرباح (Take Profit)**: المستويات المستهدفة للأرباح (يفضل ذكر 2-3 مستويات)
5. **التحليل الفني**: شرح مفصل للأسباب التي أدت لهذه التوصية بناءً على:
   - أنماط الشموع اليابانية
   - مستويات الدعم والمقاومة
   - الاتجاه العام (Trend)
   - المؤشرات الفنية المرئية في الشارت
   - حجم التداول إن كان ظاهراً
6. **إدارة المخاطر**: نسبة المخاطرة للعائد ونصائح لإدارة الصفقة

قدم التحليل بشكل واضح ومنظم باللغة العربية.`;

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
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `قم بتحليل هذا الشارت. فترة الشمعة: ${timeframe}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`فشل تحليل الصورة: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('لم يتم الحصول على تحليل من الذكاء الاصطناعي');
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-chart-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'حدث خطأ أثناء معالجة الطلب' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
