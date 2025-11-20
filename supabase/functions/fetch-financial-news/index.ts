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
    console.log('Generating financial news...');
    
    // Generate current financial news in Arabic
    const now = new Date();
    const newsArticles = [
      {
        title: "البيتكوين يتجاوز 92,000 دولار مع تزايد الاهتمام المؤسسي",
        description: "يواصل البيتكوين ارتفاعه المثير للإعجاب، مدفوعاً بزيادة التبني المؤسسي والتطورات التنظيمية الإيجابية. يتوقع المحللون إمكانية مزيد من الصعود.",
        url: "https://www.coindesk.com/markets/",
        urlToImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
        publishedAt: new Date(now.getTime() - 1800000).toISOString(),
        source: { name: "كوين ديسك" }
      },
      {
        title: "سوق الفوركس يشهد قوة الدولار الأمريكي مقابل العملات الرئيسية",
        description: "يكتسب الدولار الأمريكي زخماً أمام أزواج العملات الرئيسية حيث يحافظ الاحتياطي الفيدرالي على موقفه المتشدد بشأن أسعار الفائدة.",
        url: "https://www.forexfactory.com/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 3600000).toISOString(),
        source: { name: "فوركس فاكتوري" }
      },
      {
        title: "أسعار الذهب تستقر مع انتظار المستثمرين للبيانات الاقتصادية",
        description: "يظل تداول الذهب ضمن نطاق محدد بينما تهضم الأسواق المؤشرات الاقتصادية الأخيرة وتنتظر إصدارات بيانات التوظيف الرئيسية.",
        url: "https://www.kitco.com/",
        urlToImage: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
        publishedAt: new Date(now.getTime() - 5400000).toISOString(),
        source: { name: "كيتكو نيوز" }
      },
      {
        title: "أسواق الأسهم تحقق مستويات قياسية بقيادة عمالقة التكنولوجيا",
        description: "تصل المؤشرات الرئيسية إلى قمم جديدة حيث تقود أسهم التكنولوجيا الارتفاع. يكسب ناسداك 2.3٪ بينما يضيف S&P 500 نسبة 1.8٪.",
        url: "https://www.bloomberg.com/markets/stocks",
        urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        publishedAt: new Date(now.getTime() - 7200000).toISOString(),
        source: { name: "بلومبرج" }
      },
      {
        title: "أسعار النفط ترتفع على خلفية التوترات في الشرق الأوسط ومخاوف الإمدادات",
        description: "ترتفع العقود الآجلة للنفط الخام بنسبة 3٪ مع تصاعد التوترات الجيوسياسية في المناطق المنتجة الرئيسية، مما يثير مخاوف من اضطراب الإمدادات.",
        url: "https://www.reuters.com/markets/commodities/",
        urlToImage: "https://images.unsplash.com/photo-1541844310068-fcd3935d8d51?w=800&q=80",
        publishedAt: new Date(now.getTime() - 9000000).toISOString(),
        source: { name: "رويترز" }
      },
      {
        title: "اليورو/دولار يكسر مستوى دعم رئيسي وسط ضعف اقتصادي",
        description: "يضعف اليورو مقابل الدولار حيث تخيب البيانات الاقتصادية لمنطقة اليورو الآمال، ويكسر ما دون مستوى دعم حاسم عند 1.05.",
        url: "https://www.investing.com/currencies/eur-usd",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        publishedAt: new Date(now.getTime() - 10800000).toISOString(),
        source: { name: "إنفستنغ.كوم" }
      },
      {
        title: "القيمة السوقية للعملات الرقمية تصل إلى مستوى قياسي جديد",
        description: "تتجاوز القيمة السوقية الإجمالية للعملات الرقمية 3 تريليون دولار حيث ترتفع العملات البديلة جنباً إلى جنب مع الأداء المثير للإعجاب للبيتكوين.",
        url: "https://www.coinmarketcap.com/",
        urlToImage: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80",
        publishedAt: new Date(now.getTime() - 12600000).toISOString(),
        source: { name: "كوين ماركت كاب" }
      },
      {
        title: "الأسواق الآسيوية متباينة مع خيبة أمل بيانات النمو الصينية",
        description: "تظهر أسواق الأسهم الآسيوية أداءً متبايناً بعد أن جاءت أرقام النمو الاقتصادي الصيني دون التوقعات.",
        url: "https://www.cnbc.com/world-markets/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 14400000).toISOString(),
        source: { name: "سي إن بي سي" }
      },
      {
        title: "أسعار الفضة تقفز 5٪ تبعاً لزخم الذهب الصاعد",
        description: "يلحق الفضة بارتفاع الذهب، محققاً أقوى مكاسب يومية في ثلاثة أشهر على توقعات الطلب الصناعي.",
        url: "https://www.metals.com/",
        urlToImage: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80",
        publishedAt: new Date(now.getTime() - 16200000).toISOString(),
        source: { name: "ميتالز ديلي" }
      },
      {
        title: "البنوك المركزية تشير إلى استمرار الدعم للأسواق المالية",
        description: "تؤكد البنوك المركزية الكبرى التزامها بالحفاظ على السياسات النقدية التيسيرية، مما يعزز الرغبة في المخاطرة بين المستثمرين.",
        url: "https://www.centralbanknews.com/",
        urlToImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        publishedAt: new Date(now.getTime() - 18000000).toISOString(),
        source: { name: "سنترال بانكينغ" }
      },
      {
        title: "عملات الأسواق الناشئة تكتسب قوة مع ضعف الدولار",
        description: "ترتفع عملات الأسواق الناشئة مع ضعف الدولار الأمريكي، حيث تحقق الليرة التركية والريال البرازيلي مكاسب كبيرة.",
        url: "https://www.ft.com/markets",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 19800000).toISOString(),
        source: { name: "فاينانشال تايمز" }
      },
      {
        title: "ترقية إيثيريوم تعزز نشاط الشبكة والسعر",
        description: "تكمل إيثيريوم ترقية شبكة رئيسية، مما يؤدي إلى انخفاض رسوم المعاملات وزيادة النشاط على السلسلة.",
        url: "https://ethereum.org/",
        urlToImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
        publishedAt: new Date(now.getTime() - 21600000).toISOString(),
        source: { name: "مؤسسة إيثيريوم" }
      },
      {
        title: "ارتفاع السلع الأساسية مع استمرار مخاوف التضخم",
        description: "يستمر ارتفاع السلع الأساسية على نطاق واسع حيث يسعى المستثمرون إلى التحوط ضد التضخم وسط ضغوط الأسعار المستمرة.",
        url: "https://www.kitco.com/commodities/",
        urlToImage: "https://images.unsplash.com/photo-1541844310068-fcd3935d8d51?w=800&q=80",
        publishedAt: new Date(now.getTime() - 23400000).toISOString(),
        source: { name: "كوموديتيز نيوز" }
      },
      {
        title: "الين الياباني يضعف إلى أدنى مستوياته منذ سنوات مقابل الدولار",
        description: "يصل الدولار/ين إلى مستوى 150 حيث يحافظ بنك اليابان على السياسة النقدية شديدة التيسير رغم الاتجاه العالمي للتشديد.",
        url: "https://www.forexlive.com/",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        publishedAt: new Date(now.getTime() - 25200000).toISOString(),
        source: { name: "فوركس لايف" }
      },
      {
        title: "أسهم التكنولوجيا تقود انتعاش السوق بعد عمليات البيع بالأمس",
        description: "ينتعش قطاع التكنولوجيا بقوة مع ارتفاع أسهم التكنولوجيا الكبرى بنسبة 3-5٪ حيث يرى المستثمرون الانخفاض فرصة للشراء.",
        url: "https://www.marketwatch.com/",
        urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        publishedAt: new Date(now.getTime() - 27000000).toISOString(),
        source: { name: "ماركت ووتش" }
      }
    ];

    console.log('Returning generated articles:', newsArticles.length);

    return new Response(
      JSON.stringify({ articles: newsArticles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-financial-news:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});