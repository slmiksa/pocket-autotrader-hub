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
    const patternMapping: Record<string, { en: string, description: string }> = {
      'مثلث صاعد': { 
        en: 'ascending triangle', 
        description: 'Draw two converging lines: a horizontal resistance line at the top and an ascending support trendline from bottom-left going up to meet it. Price should be inside the triangle with candlesticks.'
      },
      'مثلث هابط': { 
        en: 'descending triangle', 
        description: 'Draw two converging lines: a horizontal support line at the bottom and a descending resistance trendline from top-left going down to meet it. Price should be inside the triangle with candlesticks.'
      },
      'مثلث متماثل': { 
        en: 'symmetrical triangle', 
        description: 'Draw two converging lines: one descending from top-left and one ascending from bottom-left, meeting at a point on the right. Candlesticks should be inside the triangle pattern.'
      },
      'قناة صاعدة': { 
        en: 'ascending channel', 
        description: 'Draw two parallel ascending lines from bottom-left to top-right with candlesticks bouncing between them.'
      },
      'قناة هابطة': { 
        en: 'descending channel', 
        description: 'Draw two parallel descending lines from top-left to bottom-right with candlesticks bouncing between them.'
      },
      'قناة أفقية': { 
        en: 'horizontal channel', 
        description: 'Draw two horizontal parallel lines with candlesticks bouncing between the support and resistance levels.'
      },
      'راية صاعدة': { 
        en: 'bullish flag', 
        description: 'Draw a strong upward move (flagpole) followed by a small downward sloping rectangle (flag) with candlesticks inside.'
      },
      'راية هابطة': { 
        en: 'bearish flag', 
        description: 'Draw a strong downward move (flagpole) followed by a small upward sloping rectangle (flag) with candlesticks inside.'
      },
      'رأس وكتفين': { 
        en: 'head and shoulders', 
        description: 'Draw three peaks where the middle peak (head) is higher than the two side peaks (shoulders), with a neckline connecting the lows.'
      },
      'رأس وكتفين مقلوب': { 
        en: 'inverse head and shoulders', 
        description: 'Draw three troughs where the middle trough (head) is lower than the two side troughs (shoulders), with a neckline connecting the highs.'
      },
      'قمة مزدوجة': { 
        en: 'double top', 
        description: 'Draw two similar peaks at approximately the same price level with a valley between them, forming an M shape.'
      },
      'قاع مزدوج': { 
        en: 'double bottom', 
        description: 'Draw two similar troughs at approximately the same price level with a peak between them, forming a W shape.'
      },
      'وتد صاعد': { 
        en: 'rising wedge', 
        description: 'Draw two converging upward sloping lines with the lower line steeper than the upper line.'
      },
      'وتد هابط': { 
        en: 'falling wedge', 
        description: 'Draw two converging downward sloping lines with the upper line steeper than the lower line.'
      },
      'دعم ومقاومة': { 
        en: 'support and resistance', 
        description: 'Draw two horizontal lines - one at the top (resistance in red) and one at the bottom (support in green) with candlesticks between them.'
      },
      'خط اتجاه': { 
        en: 'trend line', 
        description: 'Draw a diagonal trend line connecting the highs (downtrend) or lows (uptrend) of the candlesticks.'
      },
      'اختراق': { 
        en: 'breakout', 
        description: 'Draw a horizontal resistance line with candlesticks breaking through it upward, or support line with breakout downward.'
      },
      'ارتداد': { 
        en: 'bounce', 
        description: 'Draw a support or resistance line with candlesticks bouncing off it.'
      },
    };

    const patternInfo = patternMapping[pattern] || { en: pattern, description: 'Draw a trading pattern' };
    const isUptrend = direction.includes('صعود') || direction.includes('شراء') || direction.includes('CALL') || direction.includes('صاعد');
    const arrowDirection = isUptrend ? 'UP' : 'DOWN';
    const arrowColor = isUptrend ? 'green' : 'red';

    const prompt = `Generate a professional trading chart image showing a ${patternInfo.en} pattern.

CRITICAL REQUIREMENTS:
1. MUST include realistic Japanese candlesticks (red and green candles) showing price movement
2. MUST draw clear ${patternInfo.en} pattern lines in BLUE or PURPLE color overlaid on the candlesticks
3. ${patternInfo.description}
4. MUST include a direction indicator box in the corner showing:
   - A large ${arrowColor} arrow pointing ${arrowDirection}
   - Text "POSSIBLE DIRECTION" or "${arrowDirection}"
   - The box should have a ${arrowColor} border

STYLE:
- Light gray or white background
- Professional financial chart style like TradingView
- Clean, educational visualization
- Price axis on the right side with numbers
- High contrast, easy to read
- The pattern lines should be thick (2-3px) and clearly visible
- No grid lines
- Aspect ratio 16:9

This is for educational purposes to show the ${patternInfo.en} chart pattern with expected ${arrowDirection} direction.`;

    console.log('Generating image with improved prompt');

    // Try with the pro image model for better quality
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
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
      console.error('No image in response, trying fallback');
      
      // Fallback: try with flash model
      const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: `Create a simple trading chart diagram:
- White background
- Draw green and red candlesticks
- Draw a ${patternInfo.en} pattern with blue lines
- Add a ${arrowColor} arrow in a box labeled "${arrowDirection}" in the bottom right corner
- Professional chart style`
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackImage = fallbackData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (fallbackImage) {
          console.log('Fallback image generated successfully');
          return new Response(
            JSON.stringify({ 
              success: true,
              patternImage: fallbackImage,
              pattern,
              direction
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.error('Both attempts failed to generate image');
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
