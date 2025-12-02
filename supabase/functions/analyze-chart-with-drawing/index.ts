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
    const { image, symbol, timeframe } = await req.json();

    if (!image) {
      throw new Error('يرجى تقديم صورة الشارت');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting chart analysis with drawing...');

    // Extract base64 data from data URL if needed
    let base64Image = image;
    if (image.includes('base64,')) {
      base64Image = image.split('base64,')[1];
    }

    const systemPrompt = `أنت محلل فني محترف متخصص في التحليل الفني وتحديد مستويات الدعم والمقاومة والارتدادات.

مهمتك:
1. تحليل الشارت المرفق بدقة عالية
2. تحديد مستويات الدعم والمقاومة الرئيسية
3. تحديد نقاط الارتداد المحتملة
4. تقديم توصية تداول واضحة

قدم تحليلك بتنسيق JSON فقط:
{
  "currentPrice": [السعر الحالي],
  "trend": "[صاعد/هابط/عرضي]",
  "supportLevels": [
    { "price": [السعر], "strength": "[قوي/متوسط/ضعيف]" }
  ],
  "resistanceLevels": [
    { "price": [السعر], "strength": "[قوي/متوسط/ضعيف]" }
  ],
  "recommendation": {
    "action": "[شراء/بيع/انتظار]",
    "entry": [سعر الدخول],
    "stopLoss": [وقف الخسارة],
    "target1": [الهدف الأول],
    "target2": [الهدف الثاني],
    "reason": "[السبب بالعربي]"
  },
  "analysis": "[تحليل مفصل بالعربي]"
}`;

    const userPrompt = `حلل الشارت التالي:
- الرمز: ${symbol || 'غير محدد'}
- الإطار الزمني: ${timeframe || 'غير محدد'}

حدد مستويات الدعم والمقاومة بدقة، وقدم توصية تداول واضحة مع الأسعار الدقيقة.`;

    // Step 1: Analyze the chart
    console.log('Step 1: Analyzing chart...');
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis API error:', analysisResponse.status, errorText);
      throw new Error(`فشل التحليل: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText = analysisData.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error('لم يتم الحصول على تحليل');
    }

    // Clean and parse JSON
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('فشل في تحليل البيانات');
      }
    }

    console.log('Analysis complete:', analysis);

    // Step 2: Generate annotated image
    console.log('Step 2: Generating annotated image...');
    
    const drawingPrompt = `قم بإنشاء نسخة من هذا الشارت مع إضافة الرسومات التالية بوضوح:

1. ارسم خطوط أفقية حمراء عند مستويات المقاومة: ${analysis.resistanceLevels?.map((r: any) => r.price).join(', ')}
2. ارسم خطوط أفقية خضراء عند مستويات الدعم: ${analysis.supportLevels?.map((s: any) => s.price).join(', ')}
3. ضع علامات على كل خط بالسعر
4. أضف سهم يشير إلى الاتجاه المتوقع: ${analysis.trend}
5. ضع مربع نص في الزاوية العلوية يحتوي على التوصية: ${analysis.recommendation?.action}
   - الدخول: ${analysis.recommendation?.entry}
   - وقف الخسارة: ${analysis.recommendation?.stopLoss}
   - الهدف 1: ${analysis.recommendation?.target1}

تأكد من وضوح الخطوط والنصوص على الشارت.`;

    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: drawingPrompt },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      console.error('Image generation error:', imageResponse.status);
      // Return analysis without image if generation fails
      return new Response(
        JSON.stringify({
          success: true,
          analysis,
          annotatedImage: null,
          message: 'تم التحليل بنجاح ولكن فشل إنشاء الصورة المشروحة'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await imageResponse.json();
    const annotatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    console.log('Image generation complete');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        annotatedImage,
        message: 'تم التحليل والرسم بنجاح'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-chart-with-drawing:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'حدث خطأ أثناء التحليل' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});