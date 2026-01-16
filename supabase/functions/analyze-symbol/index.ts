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
    const { symbol, timeframe, assetType, analysisType = 'trading' } = await req.json();
    console.log('Analyzing symbol:', symbol, 'timeframe:', timeframe, 'type:', assetType, 'analysisType:', analysisType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get current price data based on asset type
    let priceData = '';
    let currentPrice = '';

    if (assetType === 'crypto') {
      // Map crypto symbols to CoinGecko IDs
      const coinGeckoMap: { [key: string]: string } = {
        'BTCUSD': 'bitcoin',
        'ETHUSD': 'ethereum',
        'BNBUSD': 'binancecoin',
        'XRPUSD': 'ripple',
        'ADAUSD': 'cardano',
        'SOLUSD': 'solana',
        'DOTUSD': 'polkadot',
        'DOGEUSD': 'dogecoin',
        'MATICUSD': 'matic-network',
        'SHIBUSD': 'shiba-inu',
        'AVAXUSD': 'avalanche-2',
        'UNIUSD': 'uniswap',
        'LINKUSD': 'chainlink',
        'LTCUSD': 'litecoin',
        'ATOMUSD': 'cosmos',
        'TRXUSD': 'tron',
        'ETCUSD': 'ethereum-classic',
        'XLMUSD': 'stellar',
        'ALGOUSD': 'algorand',
        'VETUSD': 'vechain',
        'ICPUSD': 'internet-computer',
        'FILUSD': 'filecoin',
        'FTMUSD': 'fantom',
        'APTUSD': 'aptos',
        'ARBUSD': 'arbitrum',
        'OPUSD': 'optimism',
        'NEARUSD': 'near',
        'AAVEUSD': 'aave',
        'GRTUSD': 'the-graph',
        'SANDUSD': 'the-sandbox',
        'MANAUSD': 'decentraland',
        'LDOUSD': 'lido-dao',
        'INJUSD': 'injective-protocol',
        'RNDRUSD': 'render-token',
        'PEPEUSD': 'pepe',
      };
      
      const coinId = coinGeckoMap[symbol] || symbol.toLowerCase().replace('usd', '');
      try {
        // First try Binance for most accurate real-time price
        const binanceSymbol = symbol.replace('USD', 'USDT');
        const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
        if (binanceRes.ok) {
          const binanceData = await binanceRes.json();
          if (binanceData.lastPrice) {
            currentPrice = `$${parseFloat(binanceData.lastPrice).toFixed(2)}`;
            const change24h = parseFloat(binanceData.priceChangePercent).toFixed(2);
            priceData = `العملة: ${symbol}\nالسعر الحالي: ${currentPrice} (Binance LIVE)\nالتغير في 24 ساعة: ${change24h}%\nأعلى سعر 24س: $${parseFloat(binanceData.highPrice).toFixed(2)}\nأقل سعر 24س: $${parseFloat(binanceData.lowPrice).toFixed(2)}`;
            console.log(`✅ Crypto ${symbol} LIVE from Binance: ${currentPrice}`);
          }
        }
        
        // Fallback to CoinGecko if Binance failed
        if (!currentPrice) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
          );
          const data = await response.json();
          if (data[coinId]) {
            currentPrice = `$${data[coinId].usd}`;
            const change24h = data[coinId].usd_24h_change?.toFixed(2) || 'N/A';
            priceData = `العملة: ${symbol}\nالسعر الحالي: ${currentPrice} (CoinGecko LIVE)\nالتغير في 24 ساعة: ${change24h}%`;
            console.log(`✅ Crypto ${symbol} LIVE from CoinGecko: ${currentPrice}`);
          }
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        priceData = `العملة: ${symbol}\nلا يمكن الحصول على بيانات السعر حالياً`;
      }
    } else if (assetType === 'forex') {
      // Special handling for precious metals (XAU, XAG)
      if (symbol === 'XAUUSD' || symbol === 'XAGUSD') {
        try {
          const metalName = symbol === 'XAUUSD' ? 'الذهب (Gold)' : 'الفضة (Silver)';
          console.log(`🔴 Fetching LIVE metal price: ${metalName}`);
          
          // Try Yahoo Finance first for accurate gold futures price
          const yahooSymbol = symbol === 'XAUUSD' ? 'GC=F' : 'SI=F';
          const yahooRes = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          
          if (yahooRes.ok) {
            const yahooData = await yahooRes.json();
            const meta = yahooData.chart?.result?.[0]?.meta;
            if (meta?.regularMarketPrice) {
              currentPrice = meta.regularMarketPrice.toFixed(2);
              const prevClose = meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice;
              const change24h = prevClose ? (((meta.regularMarketPrice - prevClose) / prevClose) * 100).toFixed(2) : 'N/A';
              
              priceData = `المعدن: ${metalName}
الرمز: ${symbol}
السعر الحالي: $${currentPrice} (Yahoo Finance LIVE)
التغير في 24 ساعة: ${change24h}%
الإطار الزمني: ${timeframe}`;
              
              console.log(`✅ Metal ${symbol} LIVE from Yahoo: $${currentPrice}`);
            }
          }
          
          // Fallback to CoinGecko PAXG for gold
          if (!currentPrice && symbol === 'XAUUSD') {
            const response = await fetch(
              'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true'
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data['pax-gold']) {
                currentPrice = data['pax-gold'].usd.toFixed(2);
                const change24h = data['pax-gold'].usd_24h_change?.toFixed(2) || 'N/A';
                
                priceData = `المعدن: ${metalName}
الرمز: ${symbol}
السعر الحالي: $${currentPrice} (CoinGecko PAXG LIVE)
التغير في 24 ساعة: ${change24h}%
الإطار الزمني: ${timeframe}`;
                
                console.log(`✅ Metal ${symbol} LIVE from CoinGecko PAXG: $${currentPrice}`);
              }
            }
          }
          
          if (!currentPrice) {
            throw new Error('No price data available');
          }
        } catch (error) {
          console.error('Error fetching metal data:', error);
          const metalName = symbol === 'XAUUSD' ? 'الذهب (Gold)' : 'الفضة (Silver)';
          priceData = `المعدن: ${metalName}
الرمز: ${symbol}
الإطار الزمني: ${timeframe}
ملاحظة: سيتم تقديم تحليل فني بناءً على الأنماط السعرية الحالية`;
        }
      } else {
        // Fetch forex data from frankfurter.app (reliable free API)
        try {
          // Parse the forex pair (e.g., EURUSD -> EUR and USD)
          const baseCurrency = symbol.slice(0, 3);
          const quoteCurrency = symbol.slice(3, 6);
          
          console.log(`Fetching forex data for ${baseCurrency}/${quoteCurrency}`);
          
          const response = await fetch(
            `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${quoteCurrency}`
          );
          
          if (!response.ok) {
            console.error('Frankfurter API error:', response.status);
            throw new Error('API failed');
          }
          
          const data = await response.json();
          console.log('Forex data received:', data);
          
          if (data && data.rates && data.rates[quoteCurrency]) {
            currentPrice = data.rates[quoteCurrency].toFixed(5);
            priceData = `زوج العملات: ${symbol}
السعر الحالي: ${currentPrice}
تاريخ البيانات: ${data.date}
العملة الأساسية: ${baseCurrency}
العملة المقابلة: ${quoteCurrency}`;
            console.log('Price data prepared:', priceData);
          } else {
            // Provide general info even without live data
            priceData = `زوج العملات: ${symbol}
العملة الأساسية: ${baseCurrency}
العملة المقابلة: ${quoteCurrency}
ملاحظة: سيتم تقديم تحليل فني عام بناءً على الأنماط السعرية المتوقعة`;
            console.log('No price data, using general info');
          }
        } catch (error) {
          console.error('Error fetching forex data:', error);
          // Provide general info for analysis
          const baseCurrency = symbol.slice(0, 3);
          const quoteCurrency = symbol.slice(3, 6);
          priceData = `زوج العملات: ${symbol}
العملة الأساسية: ${baseCurrency}
العملة المقابلة: ${quoteCurrency}
ملاحظة: سيتم تقديم تحليل فني عام بناءً على الأنماط السعرية المتوقعة للإطار الزمني ${timeframe}`;
        }
      }
    } else {
      // For stocks, try to get real-time data from Yahoo Finance API (free)
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
        );
        const data = await response.json();
        
        if (data?.chart?.result?.[0]) {
          const quote = data.chart.result[0];
          const meta = quote.meta;
          currentPrice = `$${meta.regularMarketPrice?.toFixed(2) || 'N/A'}`;
          const change = meta.regularMarketPrice - meta.chartPreviousClose;
          const changePercent = ((change / meta.chartPreviousClose) * 100).toFixed(2);
          priceData = `الرمز: ${symbol}\nالسعر الحالي: ${currentPrice}\nالتغير: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent}%)`;
        } else {
          priceData = `الرمز: ${symbol}\nنوع الأصل: سهم أمريكي`;
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
        priceData = `الرمز: ${symbol}\nنوع الأصل: سهم أمريكي`;
      }
    }

    const timeframeMap: { [key: string]: string } = {
      '1m': '1-2 دقيقة',
      '5m': '5-15 دقيقة',
      '15m': '15-30 دقيقة',
      '30m': '30-60 دقيقة',
      '1h': '1-2 ساعة',
      '3h': '3-6 ساعات',
      '4h': '4-8 ساعات',
      '1d': 'يوم واحد أو أكثر',
      '1w': 'أسبوع أو أكثر',
      '1M': 'شهر أو أكثر'
    };

    let assetName = 'السهم';
    if (assetType === 'crypto') assetName = 'العملة الرقمية';
    if (assetType === 'forex') assetName = 'زوج العملات';
    
    let analysisContext = '';
    if (analysisType === 'investment') {
      analysisContext = `
نوع التحليل: استثمار طويل الأجل
التركيز على:
- التحليل الأساسي والفني معاً
- الأهداف طويلة الأجل (أسابيع إلى أشهر)
- نقاط دخول استراتيجية للمستثمرين
- مستويات وقف خسارة واسعة لتحمل التقلبات
- التوصية بالاحتفاظ أو البيع بناءً على القيمة الاستثمارية
`;
    } else {
      analysisContext = `
نوع التحليل: مضاربة قصيرة الأجل
التركيز على:
- التحليل الفني والأنماط السعرية
- الأهداف قصيرة الأجل (دقائق إلى ساعات)
- نقاط دخول دقيقة للمضاربين
- مستويات وقف خسارة محكمة
- التوصية بالشراء أو البيع للاستفادة من التحركات السريعة
`;
    }
    
    const systemPrompt = `أنت محلل فني خبير متخصص في أسواق ${assetType === 'forex' ? 'الفوركس' : assetType === 'crypto' ? 'العملات الرقمية' : 'الأسهم'}. 
مهمتك تقديم تحليل احترافي وتوصيات تداول واضحة ومحددة لـ ${assetName} ${symbol}.

معلومات السوق:
${priceData}

الإطار الزمني: ${timeframe}
مدة الصفقة المتوقعة: ${timeframeMap[timeframe] || 'متوسط'}

${analysisContext}

**مهم جداً للمعادن الثمينة (XAU/XAG)**: 
- استخدم السعر الحالي المذكور في بيانات السوق كنقطة مرجعية
- احسب نقاط الدخول/الخروج بناءً على مستويات الدعم والمقاومة القريبة من السعر الحالي
- يجب أن تكون جميع الأسعار المقترحة قريبة ومنطقية بالنسبة للسعر الحالي (ضمن نطاق +/- 50 دولار للذهب)

**يجب عليك تقديم توصية تداول كاملة ومحددة**:

1. **الاتجاه المتوقع**: حدد بوضوح (صاعد للشراء/CALL أو هابط للبيع/PUT)
2. **نقطة الدخول**: قدم نطاق سعري مقترح للدخول ضمن النطاق الواقعي (مثال للذهب: 2045.00-2048.00)
3. **وقف الخسارة**: حدد مستوى واضح لوقف الخسارة ضمن النطاق الواقعي (مثال للذهب: 2038.50)
4. **جني الأرباح**: حدد هدف واضح للأرباح ضمن النطاق الواقعي (مثال للذهب: 2065.00)
5. **قوة الإشارة**: حدد (ضعيفة/متوسطة/قوية/قوية جداً)
6. **التحليل التفصيلي**: اشرح الأسباب الفنية للتوصية
7. **نصائح إدارة المخاطر**: قدم نصائح عملية

**قواعد إلزامية**:
- قدم دائماً أرقام وأسعار واقعية ومحددة للدخول والخروج
- استخدم السعر الحالي المذكور في بيانات السوق كنقطة انطلاق
- يجب أن تكون نقاط الدخول/الخروج قريبة من السعر الحالي ومنطقية (ضمن نطاق معقول)
- اعتمد على التحليل الفني والأنماط السعرية المعروفة للإطار الزمني ${timeframe}
- كن واضحاً ومحدداً في كل نقطة

يجب أن يكون الرد بصيغة JSON فقط بالشكل التالي:
{
  "direction": "شراء (CALL) أو بيع (PUT) - واضح ومحدد",
  "entryPoint": "نطاق سعري محدد للدخول",
  "stopLoss": "مستوى محدد لوقف الخسارة",
  "takeProfit": "هدف محدد لجني الأرباح",
  "confidence": "قوية جداً أو قوية أو متوسطة",
  "trend": "وصف الاتجاه الفني المتوقع",
  "analysis": "تحليل فني تفصيلي يشرح الأسباب${analysisType === 'investment' ? ' ويشمل العوامل الأساسية' : ''}",
  "advice": "نصائح عملية لإدارة المخاطر"
}`;

    const userPrompt = `قدم تحليل احترافي وتوصية تداول كاملة ومحددة لـ ${symbol} على إطار ${timeframe}.

يجب أن تتضمن التوصية:
- اتجاه واضح (شراء أو بيع)
- نقطة دخول محددة بالأرقام
- وقف خسارة محدد
- هدف ربح محدد
- تحليل فني مفصل

تذكر: قدم أرقاماً وتوصيات محددة، ولا تقل "لا يمكن التحديد". استخدم خبرتك الفنية.`;

    console.log('Calling Lovable AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let analysisText = aiData.choices[0].message.content;
    console.log('Raw AI response:', analysisText);

    // Extract JSON from markdown code blocks if present
    const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      analysisText = jsonMatch[1];
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Create a fallback structure
      analysis = {
        direction: analysisText.includes('شراء') || analysisText.includes('BUY') ? 'شراء' : 'بيع',
        entryPoint: currentPrice || 'السعر الحالي',
        stopLoss: 'يحدد حسب استراتيجيتك',
        takeProfit: 'يحدد حسب استراتيجيتك',
        confidence: 'متوسطة',
        trend: 'تحليل غير متوفر بصيغة منظمة',
        analysis: analysisText,
        advice: 'التزم بإدارة رأس المال وضع وقف خسارة مناسب'
      };
    }

    // Add current price to the analysis
    if (currentPrice) {
      analysis.currentPrice = currentPrice;
    }

    console.log('Analysis complete:', analysis);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-symbol function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
