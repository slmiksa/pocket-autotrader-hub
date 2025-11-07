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

    // Map timeframe to recommended trade duration
    const tradeDurationMap: Record<string, string> = {
      '1m': '1-2 دقيقة',
      '5m': '5 دقائق',
      '15m': '10-15 دقيقة',
      '30m': '20-30 دقيقة',
      '1h': '30-45 دقيقة',
      '4h': '2-3 ساعات',
      '1d': '4-6 ساعات'
    };

    const recommendedDuration = tradeDurationMap[timeframe] || '5 دقائق';

    const systemPrompt = `أنت محلل فني محترف لمنصة Pocket Option. التحليل يجب أن يكون مختصراً وقوياً ومباشراً.

يجب أن يتضمن تحليلك بالضبط:

## 🎯 التوصية
- **الاتجاه**: CALL أو PUT
- **مدة الصفقة المقترحة**: ${recommendedDuration}
- **التوقيت**: ادخل الآن / انتظر نهاية الشمعة / انتظر السعر [مستوى محدد]

## 📍 مناطق الدخول القوية
- **مقاومة قوية**: [رقم محدد] → افتح PUT (بيع) عند الوصول
- **دعم قوي**: [رقم محدد] → افتح CALL (شراء) عند الوصول
- **منطقة الدخول الحالية**: [رقم محدد] → [CALL/PUT]

## 📊 التحليل (مختصر جداً)
- نمط الشموع: [جملة واحدة فقط]
- الاتجاه: [صاعد/هابط]
- السبب: [جملة واحدة فقط]

## ⚠️ المخاطر
- قوة الإشارة: ضعيفة/متوسطة/قوية
- نسبة الثقة: [نسبة مئوية]

كن مختصراً جداً. اكتب فقط المعلومات الأساسية بدون شرح إضافي.`;

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
                text: `حلل هذا الشارت - فترة الشمعة: ${timeframe}

التزم بالتنسيق المطلوب:
- CALL أو PUT؟
- مدة الصفقة: ${recommendedDuration}
- متى ادخل؟ (حدد السعر إن لم يكن الآن)
- حدد أرقام المقاومة القوية (للبيع PUT)
- حدد أرقام الدعم القوي (للشراء CALL)
- ما هي منطقة الدخول الحالية بالضبط؟
- نمط الشموع؟ (جملة واحدة)
- السبب؟ (جملة واحدة)
- قوة الإشارة ونسبة الثقة؟

مهم: اكتب الأرقام الدقيقة للمستويات من الشارت.`
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
        max_tokens: 700,
        temperature: 0.3
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
