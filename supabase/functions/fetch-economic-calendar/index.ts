import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Impact mapping based on event importance
const getImpact = (importance: number): 'low' | 'medium' | 'high' => {
  if (importance >= 3) return 'high';
  if (importance >= 2) return 'medium';
  return 'low';
};

// Arabic translations for common economic events
const arabicTranslations: Record<string, string> = {
  'Interest Rate Decision': 'قرار سعر الفائدة',
  'Non-Farm Payrolls': 'الوظائف غير الزراعية',
  'Unemployment Rate': 'معدل البطالة',
  'CPI': 'مؤشر أسعار المستهلك',
  'GDP': 'الناتج المحلي الإجمالي',
  'Retail Sales': 'مبيعات التجزئة',
  'Manufacturing PMI': 'مؤشر مديري المشتريات الصناعي',
  'Services PMI': 'مؤشر مديري المشتريات الخدمي',
  'Trade Balance': 'الميزان التجاري',
  'Consumer Confidence': 'ثقة المستهلك',
  'Core CPI': 'مؤشر أسعار المستهلك الأساسي',
  'Core PPI': 'مؤشر أسعار المنتجين الأساسي',
  'PPI': 'مؤشر أسعار المنتجين',
  'Initial Jobless Claims': 'طلبات إعانة البطالة الأولية',
  'Continuing Jobless Claims': 'طلبات إعانة البطالة المستمرة',
  'Industrial Production': 'الإنتاج الصناعي',
  'Building Permits': 'تصاريح البناء',
  'Housing Starts': 'بدايات الإسكان',
  'Existing Home Sales': 'مبيعات المنازل القائمة',
  'New Home Sales': 'مبيعات المنازل الجديدة',
  'Durable Goods Orders': 'طلبات السلع المعمرة',
  'ISM Manufacturing PMI': 'مؤشر ISM التصنيعي',
  'ISM Services PMI': 'مؤشر ISM الخدمي',
  'ADP Employment Change': 'تغير التوظيف ADP',
  'FOMC Meeting Minutes': 'محضر اجتماع الفيدرالي',
  'ECB Interest Rate Decision': 'قرار فائدة البنك المركزي الأوروبي',
  'BOE Interest Rate Decision': 'قرار فائدة بنك إنجلترا',
  'BOJ Interest Rate Decision': 'قرار فائدة بنك اليابان',
};

const translateEvent = (title: string): string => {
  // Check for exact match
  if (arabicTranslations[title]) return arabicTranslations[title];
  
  // Check for partial match
  for (const [key, value] of Object.entries(arabicTranslations)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Return original with Arabic prefix if no translation
  return `حدث: ${title}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!finnhubApiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get dates for next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const fromDate = today.toISOString().split('T')[0];
    const toDate = nextWeek.toISOString().split('T')[0];

    console.log(`Fetching economic calendar from ${fromDate} to ${toDate}`);

    // Fetch from Finnhub Economic Calendar API
    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${fromDate}&to=${toDate}&token=${finnhubApiKey}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.economicCalendar?.length || 0} events from Finnhub`);

    if (!data.economicCalendar || data.economicCalendar.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No events found', eventsAdded: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform and filter events (focus on major economies)
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY'];
    
    const events = data.economicCalendar
      .filter((event: any) => majorCurrencies.includes(event.country))
      .map((event: any) => ({
        title: event.event,
        title_ar: translateEvent(event.event),
        country: event.country,
        currency: event.country, // Finnhub uses country code as currency
        impact: getImpact(event.impact || 1),
        event_time: new Date(`${event.time || '09:00:00'}`).toISOString(),
        actual_value: event.actual?.toString() || null,
        forecast_value: event.estimate?.toString() || null,
        previous_value: event.prev?.toString() || null,
      }));

    console.log(`Processed ${events.length} relevant events`);

    // Clear old events and insert new ones
    await supabase
      .from('economic_events')
      .delete()
      .lt('event_time', today.toISOString());

    // Insert new events (upsert based on title and time)
    if (events.length > 0) {
      const { error } = await supabase
        .from('economic_events')
        .upsert(events, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error inserting events:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventsAdded: events.length,
        fromDate,
        toDate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching economic calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
