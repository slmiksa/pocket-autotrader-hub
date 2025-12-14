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
    const { title, description, content } = await req.json();
    console.log('Translating news to Arabic using OpenAI...');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `أنت مترجم متخصص في ترجمة الأخبار المالية من الإنجليزية إلى العربية. قم بترجمة النص بدقة مع الحفاظ على المصطلحات المالية والتقنية بشكل صحيح. اجعل الترجمة طبيعية وسلسة.`;

    const userPrompt = `قم بترجمة الأخبار التالية إلى اللغة العربية:

العنوان: ${title}
الوصف: ${description}
${content ? `المحتوى: ${content}` : ''}

قدم الترجمة بالتنسيق التالي:
العنوان المترجم: [الترجمة هنا]
الوصف المترجم: [الترجمة هنا]
${content ? 'المحتوى المترجم: [الترجمة هنا]' : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;
    console.log('Translation completed successfully');

    // Parse the translated text
    const titleMatch = translatedText.match(/العنوان المترجم:\s*(.+?)(?=\n|$)/);
    const descMatch = translatedText.match(/الوصف المترجم:\s*(.+?)(?=\n|$)/);
    const contentMatch = translatedText.match(/المحتوى المترجم:\s*(.+?)(?=\n|$)/s);

    return new Response(
      JSON.stringify({
        translatedTitle: titleMatch ? titleMatch[1].trim() : title,
        translatedDescription: descMatch ? descMatch[1].trim() : description,
        translatedContent: contentMatch ? contentMatch[1].trim() : content || description,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-news:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
