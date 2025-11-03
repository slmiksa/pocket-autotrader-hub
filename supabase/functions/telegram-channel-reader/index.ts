import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse signal from message text
function parseSignalFromMessage(text: string): any | null {
  console.log('Parsing message:', text);
  
  // NEW: Parse the actual format from EyadTraderBot2 channel
  // Format example:
  // 🛰 POCKET OPTION [M1]
  // 💷 AUDCHF-OTC
  // 💎 M1
  // ⌚️ 16:15:00
  // 🔼 call (or 🔽 put)
  
  // Extract asset (after 💷)
  const assetMatch = text.match(/💷\s*([A-Z]{3}\/[A-Z]{3}|[A-Z]{6,}-OTC|[A-Z]{6})/i);
  
  // Extract timeframe (after 💎)
  const timeframeMatch = text.match(/💎\s*(M\d+|H\d+)/i);
  
  // Extract entry time (after ⌚️)
  const timeMatch = text.match(/⌚️\s*(\d{2}:\d{2}:\d{2})/);
  
  // Extract direction (after 🔼 or 🔽)
  const callMatch = text.match(/🔼\s*(call|buy)/i);
  const putMatch = text.match(/🔽\s*(put|sell)/i);
  
  if (assetMatch && timeframeMatch && (callMatch || putMatch)) {
    let asset = assetMatch[1];
    
    // Clean asset name: remove -OTC suffix but keep original for display
    const originalAsset = asset;
    asset = asset.replace('-OTC', '');
    
    // Convert AUDCHF to AUD/CHF if needed
    if (asset.length === 6 && !asset.includes('/')) {
      asset = asset.substring(0, 3) + '/' + asset.substring(3);
    }
    
    const timeframe = timeframeMatch[1];
    const direction = callMatch ? 'CALL' : 'PUT';
    const entryTime = timeMatch ? timeMatch[1] : null;
    
    console.log('Signal extracted:', { asset, timeframe, direction, entryTime, originalAsset });
    
    return {
      asset,
      timeframe,
      direction,
      entry_time: entryTime,
      original_asset: originalAsset,
      raw_message: text,
      kind: 'signal'
    };
  }
  
  // Fallback: Try old formats for compatibility
  const patterns = [
    /([A-Z]{3}\/[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    /([A-Z]{3}[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT|BUY|SELL)/i,
    /(GOLD|SILVER|OIL)\s+(M\d+|H\d+)\s+(CALL|PUT|BUY|SELL)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let asset = match[1];
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
        kind: 'signal'
      };
    }
  }
  
  return null;
}

// Parse a result (win/loss) message
function parseResultFromMessage(text: string): { asset?: string; timeframe?: string; result: 'win' | 'win1' | 'win2' | 'loss' } | null {
  // Detect win/loss and optional martingale index (1 or 2)
  const normalized = text.replace(/\s+/g, ' ').trim();
  const hasWin = /(✅|✔️|\bwin\b|\bwon\b|ربح)/i.test(normalized);
  const hasLoss = /(❌|⛔️|\bloss\b|\blose\b|\blost\b|خسارة|خسر)/i.test(normalized);
  if (!hasWin && !hasLoss) return null;

  // Extract optional win level: "win 1", "win1", "WIN ✅ 1", or superscripts ¹ ², or Arabic ١ ٢
  let result: 'win' | 'win1' | 'win2' | 'loss' = hasLoss ? 'loss' : 'win';
  if (hasWin) {
    const levelDigit = /win\s*([12])/i.exec(normalized)?.[1]
      || (/win.*?(¹|²)/i.exec(normalized)?.[1] ? (/win.*?(¹|²)/i.exec(normalized)![1] === '¹' ? '1' : '2') : undefined)
      || (/win.*?(١|٢)/i.exec(normalized)?.[1] ? (/win.*?(١|٢)/i.exec(normalized)![1] === '١' ? '1' : '2') : undefined)
      || (/✅\s*([12])/i.exec(normalized)?.[1]);
    if (levelDigit === '1') result = 'win1';
    if (levelDigit === '2') result = 'win2';
  }

  // Try to extract asset/timeframe when present
  const assetMatch = normalized.match(/💷\s*([A-Z]{3}\/[A-Z]{3}|[A-Z]{6,}-OTC|[A-Z]{6})/i);
  const timeframeMatch = normalized.match(/💎\s*(M\d+|H\d+)/i);

  let asset = assetMatch ? assetMatch[1] : undefined;
  if (asset) {
    asset = asset.replace('-OTC', '');
    if (asset.length === 6 && !asset.includes('/')) {
      asset = asset.substring(0, 3) + '/' + asset.substring(3);
    }
  }

  return { asset, timeframe: timeframeMatch ? timeframeMatch[1] : undefined, result };
}

// Helpers to match result to most likely signal when result message lacks details
function toCondensedAsset(a: string) {
  return a.replace('-OTC', '').replace('/', '').toUpperCase();
}
function minutesSinceEntry(entryTime?: string | null) {
  if (!entryTime) return Number.POSITIVE_INFINITY;
  const parts = entryTime.split(':').map((n) => parseInt(n));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const dt = new Date(now);
  dt.setHours(parts[0], parts[1], parts[2] || 0, 0);
  let diff = (now.getTime() - dt.getTime()) / 60000; // minutes
  // If entry time is in the future (e.g., past midnight edge-case), push into past by 24h for comparison
  if (diff < -1) diff += 24 * 60;
  return diff;
}
async function findBestSignalForResult(supabase: any, parsed: { asset?: string; timeframe?: string }) {
  // Fetch recent signals without result
  const { data: recent } = await supabase
    .from('signals')
    .select('id, asset, timeframe, entry_time, status, received_at, result')
    .is('result', null) // Only signals without results
    .order('received_at', { ascending: false })
    .limit(30);
  if (!recent || recent.length === 0) return null;

  // Filter signals that have passed their entry_time (executing or should be finished)
  let candidates = recent.filter((s: any) => {
    // Must have entry_time
    if (!s.entry_time) return false;
    const mins = minutesSinceEntry(s.entry_time);
    // Accept signals that started executing (0-20 minutes window for results)
    return mins >= 0 && mins <= 20;
  });
  
  if (candidates.length === 0) return null;

  // If asset/timeframe present, filter by them for better accuracy
  if (parsed.asset) {
    const cond = toCondensedAsset(parsed.asset);
    const assetMatches = candidates.filter((s: any) => toCondensedAsset(s.asset || '').includes(cond));
    if (assetMatches.length > 0) candidates = assetMatches;
  }
  if (parsed.timeframe) {
    const tfMatches = candidates.filter((s: any) => (s.timeframe || '').toUpperCase() === parsed.timeframe?.toUpperCase());
    if (tfMatches.length > 0) candidates = tfMatches;
  }

  // Return the most recent candidate
  return candidates[0] || null;
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
      let resultsUpdated = 0;

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

        // First, try to parse a result (win/loss)
        const parsedResult = parseResultFromMessage(messageText);
        if (parsedResult) {
          try {
            const target = await findBestSignalForResult(supabase, parsedResult);
            if (target) {
              // Only update result, keep status as is
              const { error: updateError } = await supabase
                .from('signals')
                .update({ result: parsedResult.result })
                .eq('id', target.id);
              if (!updateError) {
                resultsUpdated += 1;
                console.log('✅ Updated result for signal', target.id, '→', parsedResult.result);
              }
            } else {
              console.log('⚠️ No matching signal found for result:', parsedResult.result);
            }
          } catch (e) {
            console.warn('❌ Error updating result:', e);
          }
          // Continue to next item
          continue;
        }

        const signal = parseSignalFromMessage(messageText);
        
        if (signal) {
          // Check if signal already exists (using pubDate as unique ID)
          const { data: existing } = await supabase
            .from('signals')
            .select('id')
            .eq('telegram_message_id', pubDate.toString())
            .limit(1);

          if (!existing || existing.length === 0) {
            const { data: newSignal, error } = await supabase
              .from('signals')
              .insert({
                asset: signal.original_asset || signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                entry_time: signal.entry_time,
                raw_message: signal.raw_message,
                telegram_message_id: pubDate.toString(),
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
          resultsUpdated,
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
      let resultsUpdated = 0;

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

        // Try to parse result
        const parsedResult = parseResultFromMessage(messageText);
        if (parsedResult) {
          try {
            const target = await findBestSignalForResult(supabase, parsedResult);
            if (target) {
              // Only update result, keep status as is
              const { error: updateError } = await supabase
                .from('signals')
                .update({ result: parsedResult.result })
                .eq('id', target.id);
              if (!updateError) {
                resultsUpdated += 1;
                console.log('✅ Updated result for signal (web)', target.id, '→', parsedResult.result);
              }
            } else {
              console.log('⚠️ No matching signal found for result (web):', parsedResult.result);
            }
          } catch (e) {
            console.warn('❌ Error updating result (web):', e);
          }
          continue;
        }

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
                asset: signal.original_asset || signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                entry_time: signal.entry_time,
                raw_message: signal.raw_message,
                telegram_message_id: messageId,
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
          resultsUpdated,
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
