import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse signal from message text
function parseSignalFromMessage(text: string): any | null {
  console.log('Parsing message:', text);
  
  // Example formats:
  // "EUR/USD M5 CALL"
  // "EURUSD M5 BUY"
  // "GOLD M15 PUT"
  const patterns = [
    /([A-Z]{3}\/[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    /([A-Z]{3}[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT|BUY|SELL)/i,
    /(GOLD|SILVER|OIL)\s+(M\d+|H\d+)\s+(CALL|PUT|BUY|SELL)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let asset = match[1];
      // Convert EURUSD to EUR/USD if needed
      if (asset.length === 6 && !asset.includes('/')) {
        asset = asset.substring(0, 3) + '/' + asset.substring(3);
      }
      
      const timeframe = match[2];
      const direction = ['CALL', 'BUY'].includes(match[3].toUpperCase()) ? 'CALL' : 'PUT';
      
      return {
        asset,
        timeframe,
        direction,
        raw_message: text,
      };
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get Telegram credentials
    const apiId = Deno.env.get('TELEGRAM_API_ID');
    const apiHash = Deno.env.get('TELEGRAM_API_HASH');
    const phone = Deno.env.get('TELEGRAM_PHONE');

    if (!apiId || !apiHash || !phone) {
      throw new Error('Telegram credentials not configured');
    }

    // Channel username to read from
    const channelUsername = 'EyadTraderBot2';
    
    console.log('Reading from channel:', channelUsername);

    // Use Telegram RSS bridge as a workaround (public channels only)
    // This is a simple solution that doesn't require MTProto authentication
    const rssUrl = `https://rsshub.app/telegram/channel/${channelUsername}`;
    
    try {
      const rssResponse = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!rssResponse.ok) {
        throw new Error(`RSS fetch failed: ${rssResponse.status}`);
      }

      const rssText = await rssResponse.text();
      
      // Parse RSS XML to extract messages
      const itemMatches = rssText.matchAll(/<item>([\s\S]*?)<\/item>/g);
      const signals = [];
      let messagesChecked = 0;

      for (const itemMatch of itemMatches) {
        messagesChecked++;
        const item = itemMatch[1];
        
        // Extract description (message text)
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
        if (!descMatch) continue;
        
        let messageText = descMatch[1];
        // Remove HTML tags
        messageText = messageText.replace(/<[^>]*>/g, ' ').trim();
        
        // Extract pub date to use as unique identifier
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now();

        console.log('Checking message:', messageText.substring(0, 100));

        const signal = parseSignalFromMessage(messageText);
        
        if (signal) {
          // Check if signal already exists (using pubDate as unique ID)
          const { data: existing } = await supabase
            .from('signals')
            .select('id')
            .eq('telegram_message_id', pubDate)
            .limit(1);

          if (!existing || existing.length === 0) {
            const { data: newSignal, error } = await supabase
              .from('signals')
              .insert({
                asset: signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                raw_message: signal.raw_message,
                telegram_message_id: pubDate,
                status: 'pending'
              })
              .select()
              .limit(1);

            if (error) {
              console.error('Error inserting signal:', error);
            } else if (newSignal && newSignal[0]) {
              signals.push(newSignal[0]);
              console.log('New signal inserted from channel:', newSignal[0]);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          messagesChecked,
          signalsFound: signals.length,
          signals,
          source: 'channel'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (rssError) {
      console.warn('RSS method failed, trying alternative approach:', rssError);
      
      // Alternative: Use web scraping approach
      const webUrl = `https://t.me/s/${channelUsername}`;
      const webResponse = await fetch(webUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!webResponse.ok) {
        throw new Error('Failed to fetch channel messages via web');
      }

      const html = await webResponse.text();
      
      // Extract messages from HTML
      const messageMatches = html.matchAll(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g);
      const signals = [];
      let messagesChecked = 0;

      for (const msgMatch of messageMatches) {
        messagesChecked++;
        let messageText = msgMatch[1];
        
        // Remove HTML tags and decode entities
        messageText = messageText
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

        console.log('Checking message:', messageText.substring(0, 100));

        const signal = parseSignalFromMessage(messageText);
        
        if (signal) {
          // Use hash of message as unique ID
          const messageHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(messageText)
          );
          const messageId = Array.from(new Uint8Array(messageHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 16);

          // Check if signal already exists
          const { data: existing } = await supabase
            .from('signals')
            .select('id')
            .eq('raw_message', signal.raw_message)
            .limit(1);

          if (!existing || existing.length === 0) {
            const { data: newSignal, error } = await supabase
              .from('signals')
              .insert({
                asset: signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                raw_message: signal.raw_message,
                telegram_message_id: parseInt(messageId, 16),
                status: 'pending'
              })
              .select()
              .limit(1);

            if (error) {
              console.error('Error inserting signal:', error);
            } else if (newSignal && newSignal[0]) {
              signals.push(newSignal[0]);
              console.log('New signal inserted:', newSignal[0]);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          messagesChecked,
          signalsFound: signals.length,
          signals,
          source: 'web_scraping'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in telegram-channel-reader:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
