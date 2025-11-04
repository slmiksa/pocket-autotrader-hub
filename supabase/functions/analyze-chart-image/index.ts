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

    const systemPrompt = `أنت محلل فني محترف متخصص في تحليل الشموع اليابانية وأنماط الشارت لمنصة Pocket Option.

**ملاحظة مهمة**: منصة Pocket Option لا تحتوي على وقف خسارة أو جني أرباح. التداول يعتمد على اختيار اتجاه السعر (صعود أو هبوط) وفترة زمنية محددة.

يجب أن يتضمن تحليلك التالي بالضبط:

## 🎯 التوصية النهائية
- **الاتجاه**: CALL (شراء/صعود) أو PUT (بيع/هبوط)
- **وقت الدخول**: 
  - "ادخل الآن" - إذا كانت الإشارة قوية والتوقيت مثالي حالياً
  - "انتظر نهاية الشمعة الحالية" - إذا كان من الأفضل الانتظار لتأكيد الإشارة
  - "انتظر حتى يصل السعر إلى [مستوى معين]" - إذا كان هناك مستوى دعم/مقاومة أفضل

## 📊 التحليل الفني المفصل
1. **تحليل الشموع اليابانية**:
   - وصف نمط الشموع الحالي
   - هل يوجد نموذج انعكاسي أو استمراري؟

2. **مستويات الدعم والمقاومة**:
   - حدد المستويات المهمة المرئية في الشارت
   - حدد منطقة الدخول المثالية بالتحديد

3. **الاتجاه العام**:
   - ما هو الاتجاه الحالي؟ (صاعد/هابط/عرضي)
   - هل التوصية مع أو ضد الاتجاه؟

4. **المؤشرات الفنية** (إن وُجدت في الشارت):
   - وصف إشارات المؤشرات المرئية
   - هل تدعم التوصية؟

5. **نقطة الدخول المحددة**:
   - "ادخل من المنطقة [حدد السعر/المنطقة] لأن [السبب]"
   - مثال: "ادخل من منطقة 1.0850 لأنها منطقة دعم قوية ظهرت عدة مرات"

## ⚠️ إدارة المخاطر
- قوة الإشارة: (ضعيفة/متوسطة/قوية)
- نسبة الثقة: [نسبة مئوية]
- نصائح إضافية للصفقة

قدم التحليل بشكل واضح ومنظم باللغة العربية مع التركيز على التفاصيل الدقيقة.`;

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
                text: `قم بتحليل هذا الشارت لمنصة Pocket Option.
فترة الشمعة: ${timeframe}

تذكر:
- حدد الاتجاه: CALL أو PUT
- حدد التوقيت: هل ادخل الآن أم انتظر نهاية الشمعة؟
- حدد منطقة الدخول المثالية بالتحديد على الشارت
- اشرح الأسباب التقنية بالتفصيل`
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
