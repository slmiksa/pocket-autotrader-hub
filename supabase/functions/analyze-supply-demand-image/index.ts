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
    const { image, timeframe, market, symbol, zoneDistance } = await req.json();

    if (!image) {
      throw new Error('يرجى تقديم صورة الرسم البياني');
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

    const distanceLabel = zoneDistance === 'near' ? 'قريبة (0.5% - 2%)' : 'بعيدة (2% - 5%)';

    const systemPrompt = `أنت محلل فني محترف متخصص في تحديد مناطق العرض والطلب (Supply and Demand Zones).

مهمتك هي تحليل الرسم البياني المرفق بدقة عالية لتحديد:
1. مناطق العرض (Supply Zones) - المناطق التي يكثر فيها البيع
2. مناطق الطلب (Demand Zones) - المناطق التي يكثر فيها الشراء
3. الاتجاه العام للسوق
4. إعداد صفقة مقترح

**مهم جداً:**
- اقرأ الأسعار بدقة من الشارت
- حدد المناطق ${distanceLabel} من السعر الحالي
- قدم أسعار حقيقية ودقيقة من الشارت

قدم تحليلك بهذا التنسيق JSON بالضبط:
{
  "success": true,
  "currentPrice": [السعر الحالي من الشارت],
  "trend": "[Uptrend/Downtrend/Sideways]",
  "supplyZones": [
    {
      "upper_price": [الحد العلوي],
      "lower_price": [الحد السفلي],
      "strength_score": [1-10],
      "distance_percent": [النسبة المئوية من السعر الحالي]
    }
  ],
  "demandZones": [
    {
      "upper_price": [الحد العلوي],
      "lower_price": [الحد السفلي],
      "strength_score": [1-10],
      "distance_percent": [النسبة المئوية من السعر الحالي]
    }
  ],
  "tradeSetup": {
    "type": "[BUY/SELL]",
    "entry": [سعر الدخول],
    "stopLoss": [وقف الخسارة],
    "takeProfit1": [الهدف الأول],
    "takeProfit2": [الهدف الثاني],
    "reason": "[سبب الصفقة بالعربي]"
  },
  "signalStatus": "[READY/WAITING/NOT_VALID]",
  "analysis": "[تحليل مفصل بالعربي يشرح المناطق والسبب]"
}

**قواعد تحديد المناطق:**
- منطقة العرض: منطقة سعرية كان فيها ضغط بيع قوي أدى لهبوط حاد
- منطقة الطلب: منطقة سعرية كان فيها ضغط شراء قوي أدى لصعود حاد
- قوة المنطقة (1-10): تعتمد على قوة الحركة وعدد مرات الاختبار
- المناطق ${distanceLabel}: فقط أظهر المناطق ضمن المسافة المطلوبة`;

    const userPrompt = `حلل الرسم البياني المرفق بدقة وحدد مناطق العرض والطلب.

**معلومات إضافية:**
- السوق: ${market || 'غير محدد'}
- الرمز: ${symbol || 'غير محدد'}
- الإطار الزمني: ${timeframe || 'غير محدد'}
- المناطق المطلوبة: ${distanceLabel}

**مهم:**
1. اقرأ السعر الحالي من الشارت بدقة
2. حدد مناطق العرض والطلب بأسعار دقيقة
3. اقترح صفقة بناءً على أقرب منطقة
4. قدم الإجابة بتنسيق JSON فقط بدون أي نص إضافي`;

    console.log('Analyzing supply/demand from image...');

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
                text: userPrompt
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
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`فشل تحليل الصورة: ${response.status}`);
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      console.error('No analysis received from AI:', JSON.stringify(data));
      throw new Error('لم يتم الحصول على تحليل من الذكاء الاصطناعي');
    }

    console.log('Raw AI response:', analysisText);

    // Clean up the response - remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to parse JSON
    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('فشل في تحليل استجابة الذكاء الاصطناعي');
        }
      } else {
        throw new Error('لم يتم الحصول على تحليل صالح');
      }
    }

    console.log('Parsed analysis result:', JSON.stringify(analysisResult));

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-supply-demand-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'حدث خطأ أثناء معالجة الطلب' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
