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
    const { pattern, direction, symbol } = await req.json();

    if (!pattern || !direction) {
      throw new Error('يرجى تقديم نوع النمط والاتجاه');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating pattern image:', { pattern, direction, symbol });

    // Map Arabic pattern names to English for better AI generation
    const patternMapping: Record<string, string> = {
      'مثلث صاعد': 'ascending triangle',
      'مثلث هابط': 'descending triangle',
      'مثلث متماثل': 'symmetrical triangle',
      'قناة صاعدة': 'ascending channel',
      'قناة هابطة': 'descending channel',
      'قناة أفقية': 'horizontal channel',
      'راية صاعدة': 'bullish flag',
      'راية هابطة': 'bearish flag',
      'رأس وكتفين': 'head and shoulders',
      'رأس وكتفين مقلوب': 'inverse head and shoulders',
      'قمة مزدوجة': 'double top',
      'قاع مزدوج': 'double bottom',
      'وتد صاعد': 'rising wedge',
      'وتد هابط': 'falling wedge',
      'كوب وعروة': 'cup and handle',
      'دعم ومقاومة': 'support and resistance levels',
      'خط اتجاه': 'trend line',
      'فيبوناتشي': 'fibonacci retracement',
      'اختراق': 'breakout pattern',
      'ارتداد': 'bounce pattern',
    };

    const englishPattern = patternMapping[pattern] || pattern;
    const isUptrend = direction.includes('صعود') || direction.includes('شراء') || direction.includes('CALL') || direction.includes('صاعد');
    const arrowDirection = isUptrend ? 'upward green arrow' : 'downward red arrow';
    const trendColor = isUptrend ? 'green' : 'red';

    const prompt = `Create a clean, professional trading chart diagram showing a ${englishPattern} pattern. 
The chart should have:
- A white or light background
- Clean candlestick or line chart visualization
- Clear pattern lines in blue/purple showing the ${englishPattern}
- A large ${arrowDirection} indicating the expected price movement direction
- The trend direction should be clearly marked in ${trendColor}
- Professional financial chart style, minimalist design
- Price axis on the right side
- No text labels, just visual pattern and arrow
- High contrast, easy to read
- The pattern should be clearly visible and educational
${symbol ? `- Symbol: ${symbol}` : ''}

Style: Professional trading chart, clean lines, modern financial visualization, 16:9 aspect ratio`;

    console.log('Generating image with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation API error:', response.status, errorText);
      throw new Error(`فشل توليد الصورة: ${response.status}`);
    }

    const data = await response.json();
    console.log('Image generation response received');

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('لم يتم توليد صورة');
    }

    console.log('Pattern image generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        patternImage: imageUrl,
        pattern,
        direction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-pattern-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'حدث خطأ أثناء توليد صورة النمط' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
