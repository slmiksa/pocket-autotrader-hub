import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse signal from message text
function parseSignalFromMessage(text: string): any | null {
  console.log('🔍 Parsing message:', text.substring(0, 100));
  
  // Enhanced patterns for signal detection
  const patterns = [
    // Standard format: GBPUSD-OTC M1 CALL
    /([A-Z]{3}[A-Z]{3}(?:-OTC)?)\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    // Alternative: EUR/USD M5 CALL
    /([A-Z]{3}\/[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    // With entry time: EURUSD M1 CALL 15:30:00
    /([A-Z]{6}(?:-OTC)?)\s+(M\d+|H\d+)\s+(CALL|PUT)\s+(\d{2}:\d{2}:\d{2})/i,
    // Gold/Silver format
    /(GOLD|SILVER|XAU|XAG)(?:-OTC)?\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const asset = match[1];
      const timeframe = match[2];
      const direction = match[3].toUpperCase();
      const entryTime = match[4] || null;
      
      console.log('✅ Signal found:', { asset, timeframe, direction, entryTime });
      
      return {
        asset,
        timeframe,
        direction,
        entry_time: entryTime,
        raw_message: text,
      };
    }
  }
  
  return null;
}

// Parse result from message text
function parseResultFromMessage(text: string): { asset?: string; timeframe?: string; result: 'win' | 'win1' | 'win2' | 'loss' } | null {
  console.log('🔍 Parsing result message:', text.substring(0, 100));
  
  const cleanText = text.toLowerCase();
  
  // Result patterns
  if (cleanText.includes('win') || cleanText.includes('✅') || cleanText.includes('ربح')) {
    let result: 'win' | 'win1' | 'win2' = 'win';
    
    // Check for win levels
    if (cleanText.includes('win1') || cleanText.includes('¹')) {
      result = 'win1';
    } else if (cleanText.includes('win2') || cleanText.includes('²')) {
      result = 'win2';
    }
    
    // Try to extract asset from result message
    const assetMatch = text.match(/([A-Z]{3}[A-Z]{3}(?:-OTC)?|[A-Z]{3}\/[A-Z]{3}|GOLD|SILVER)/i);
    const timeframeMatch = text.match(/(M\d+|H\d+)/i);
    
    console.log('✅ WIN result found:', { result, asset: assetMatch?.[1], timeframe: timeframeMatch?.[1] });
    
    return {
      result,
      asset: assetMatch?.[1],
      timeframe: timeframeMatch?.[1]
    };
  }
  
  if (cleanText.includes('loss') || cleanText.includes('❌') || cleanText.includes('خسارة')) {
    const assetMatch = text.match(/([A-Z]{3}[A-Z]{3}(?:-OTC)?|[A-Z]{3}\/[A-Z]{3}|GOLD|SILVER)/i);
    const timeframeMatch = text.match(/(M\d+|H\d+)/i);
    
    console.log('❌ LOSS result found:', { asset: assetMatch?.[1], timeframe: timeframeMatch?.[1] });
    
    return {
      result: 'loss',
      asset: assetMatch?.[1],
      timeframe: timeframeMatch?.[1]
    };
  }
  
  return null;
}

// Find best matching signal for a result
async function findBestSignalForResult(supabase: any, parsed: { asset?: string; timeframe?: string }) {
  console.log('🔍 Finding signal for result:', parsed);
  
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  
  let query = supabase
    .from('signals')
    .select('*')
    .is('result', null)
    .gte('received_at', twoHoursAgo)
    .order('received_at', { ascending: false });
    
  // If we have asset info, filter by it
  if (parsed.asset) {
    query = query.ilike('asset', `%${parsed.asset.replace('-OTC', '').replace('/', '')}%`);
  }
  
  const { data: signals, error } = await query.limit(10);
  
  if (error) {
    console.error('Error finding signals:', error);
    return null;
  }
  
  if (!signals || signals.length === 0) {
    console.log('No matching signals found');
    return null;
  }
  
  console.log(`Found ${signals.length} potential signals to match`);
  
  // Return the most recent unmatched signal
  const bestMatch = signals[0];
  console.log('✅ Best match:', bestMatch.id, bestMatch.asset, bestMatch.received_at);
  
  return bestMatch;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // CRITICAL: Check lock to prevent concurrent getUpdates calls
    const lockKey = 'tg_updates_lock';
    const now = new Date();
    const lockTTL = 7000; // 7 seconds lock aligned with client polling

    const { data: lockData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', lockKey)
      .limit(1);

    const lockedUntil = lockData?.[0]?.value?.until ? new Date(lockData[0].value.until) : null;

    if (lockedUntil && lockedUntil > now) {
      console.log('⏸️ Another poller is running, skipping. Locked until:', lockedUntil.toISOString());
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'locked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Acquire lock
    const newLockUntil = new Date(now.getTime() + lockTTL).toISOString();
    await supabase
      .from('settings')
      .upsert({ key: lockKey, value: { until: newLockUntil } });

    const releaseLock = async () => {
      await supabase
        .from('settings')
        .upsert({ key: lockKey, value: { until: new Date(0).toISOString() } });
    };

    try {
      console.log('🚀 Fast Telegram poller starting...');

      // Ensure no webhook conflicts with getUpdates
      try {
        const deleteWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`;
        const webhookResponse = await fetch(deleteWebhookUrl);
        const webhookData = await webhookResponse.json();
        console.log('Webhook check:', webhookData);
      } catch (webhookError) {
        console.warn('Webhook check failed (non-critical):', webhookError);
      }

    // Get last processed update offset
    const { data: offsetData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'fast_telegram_offset')
      .limit(1);
    
    const lastOffset = offsetData?.[0]?.value?.offset || 0;

    // Poll for new updates with timeout=0 for immediate response
    const params = new URLSearchParams();
    params.set('offset', String(lastOffset));
    params.set('limit', '100');
    params.set('timeout', '0'); // Immediate response
    params.set('allowed_updates', JSON.stringify(['message', 'channel_post', 'edited_channel_post']));

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (!data.ok) {
      const description: string = data.description || 'Unknown error';
      // Gracefully handle 409 Conflict from other getUpdates requests
      if (description.toLowerCase().includes('conflict')) {
        await releaseLock();
        console.warn('⚠️ Telegram conflict detected, skipping this cycle.');
        return new Response(
          JSON.stringify({ success: false, conflict: true, reason: description }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to fetch Telegram updates: ' + description);
    }

    const updates: any[] = data.result || [];
    const signals: any[] = [];
    let resultsUpdated = 0;

    // Empty-poll recovery counter
    const { data: emptyMeta } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'fast_telegram_empty')
      .limit(1);
    const emptyCount = Number(emptyMeta?.[0]?.value?.count || 0);
    const lastAt = emptyMeta?.[0]?.value?.at ? new Date(emptyMeta[0].value.at) : null;

    if (updates.length === 0) {
      const newCount = emptyCount + 1;
      await supabase.from('settings').upsert({ key: 'fast_telegram_empty', value: { count: newCount, at: new Date().toISOString() } });
      // If 3 consecutive empties within ~1 min, reset offset to resync
      if (newCount >= 3 && (!lastAt || Date.now() - lastAt.getTime() < 60_000)) {
        await supabase.from('settings').upsert({ key: 'fast_telegram_offset', value: { offset: 0 } });
        await supabase.from('settings').upsert({ key: 'fast_telegram_empty', value: { count: 0, at: new Date().toISOString() } });
        console.warn('🔁 No updates 3x, resetting Telegram offset to 0');
      }
    } else {
      // Reset empty counter on activity
      await supabase.from('settings').upsert({ key: 'fast_telegram_empty', value: { count: 0, at: new Date().toISOString() } });
    }

    let maxUpdateId = lastOffset - 1;

    for (const update of updates) {
      if (typeof update.update_id === 'number') {
        maxUpdateId = Math.max(maxUpdateId, update.update_id);
      }

      const msg = update.message || update.channel_post || update.edited_channel_post;
      
      if (msg?.text) {
        console.log('📨 Processing message:', msg.text.substring(0, 100));
        
        // Try to parse as signal first
        const signal = parseSignalFromMessage(msg.text);
        if (signal) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('signals')
            .select('id')
            .eq('telegram_message_id', msg.message_id)
            .limit(1);

          if (!existing || existing.length === 0) {
            const { data: newSignal, error } = await supabase
              .from('signals')
              .insert({
                asset: signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                entry_time: signal.entry_time,
                raw_message: signal.raw_message,
                telegram_message_id: msg.message_id,
                status: 'pending'
              })
              .select()
              .limit(1);

            if (!error && newSignal?.[0]) {
              signals.push(newSignal[0]);
              console.log('✅ NEW SIGNAL INSERTED:', newSignal[0]);
            }
          }
        } else {
          // Try to parse as result
          const resultData = parseResultFromMessage(msg.text);
          if (resultData) {
            const matchingSignal = await findBestSignalForResult(supabase, resultData);
            
            if (matchingSignal) {
              const { error } = await supabase
                .from('signals')
                .update({ result: resultData.result })
                .eq('id', matchingSignal.id);
                
              if (!error) {
                resultsUpdated++;
                console.log('✅ RESULT UPDATED:', matchingSignal.id, resultData.result);
              }
            }
          }
        }
      }
    }

      // Update offset for next poll
      if (maxUpdateId >= lastOffset) {
        await supabase
          .from('settings')
          .upsert({
            key: 'fast_telegram_offset',
            value: { offset: maxUpdateId + 1 }
          });
      }

      await releaseLock();

      console.log(`⚡ Fast poll complete: ${updates.length} messages, ${signals.length} signals, ${resultsUpdated} results`);

      return new Response(
        JSON.stringify({
          success: true,
          messagesChecked: updates.length,
          signalsFound: signals.length,
          resultsUpdated,
          signals
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (innerError) {
      await releaseLock();
      throw innerError;
    }
  } catch (error) {
    console.error('❌ Error in fast telegram poller:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});