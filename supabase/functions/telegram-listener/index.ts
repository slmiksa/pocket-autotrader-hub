import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  message: {
    message_id: number;
    text: string;
    date: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
  };
}

// Parse signal from message text
function parseSignalFromMessage(text: string): any | null {
  console.log('Parsing message:', text);
  
  // Example format: "EUR/USD M5 CALL"
  const patterns = [
    /([A-Z]{3}\/[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    /(GOLD|SILVER|EUR|USD)\s+(M\d+|H\d+)\s+(BUY|SELL|CALL|PUT)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const asset = match[1];
      const timeframe = match[2];
      const direction = match[3].toUpperCase() === 'CALL' || match[3].toUpperCase() === 'BUY' ? 'CALL' : 'PUT';
      
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

    // Helper: read setting by key
    const getSetting = async (key: string) => {
      const { data, error } = await supabase
        .from('settings')
        .select('id, value')
        .eq('key', key)
        .limit(1);
      if (error) {
        console.error('getSetting error', key, error);
        return null;
      }
      return (data && data[0]) || null;
    };

    // Helper: upsert setting by key
    const upsertSetting = async (key: string, value: Record<string, unknown>) => {
      // Try update first
      const existing = await getSetting(key);
      if (existing?.id) {
        const { error } = await supabase
          .from('settings')
          .update({ value })
          .eq('id', existing.id);
        if (error) console.error('update setting error', key, error);
        return;
      }
      const { error } = await supabase
        .from('settings')
        .insert({ key, value });
      if (error) console.error('insert setting error', key, error);
    };

    // Simple DB-based lock to avoid concurrent getUpdates calls (shared key with fast-poller)
    const now = new Date();
    const lockKey = 'tg_updates_lock';
    const lockTTLms = 7000; // 7s

    const lockRow = await getSetting(lockKey);
    const lockedUntil = lockRow?.value?.['until'] ? new Date(lockRow.value['until'] as string) : null;

    if (lockedUntil && lockedUntil > now) {
      console.log('Another instance is running, skipping. Locked until:', lockedUntil.toISOString());
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'locked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Acquire lock
    const newUntil = new Date(now.getTime() + lockTTLms).toISOString();
    await upsertSetting(lockKey, { until: newUntil });

    // Ensure we always release the lock
    const releaseLock = async () => {
      await upsertSetting(lockKey, { until: new Date(0).toISOString() });
    };

    try {
      const apiId = Deno.env.get('TELEGRAM_API_ID');
      const apiHash = Deno.env.get('TELEGRAM_API_HASH');
      const phone = Deno.env.get('TELEGRAM_PHONE');
      const botUsername = Deno.env.get('TELEGRAM_BOT_USERNAME');

      console.log('Telegram credentials configured:', {
        hasApiId: !!apiId,
        hasApiHash: !!apiHash,
        hasPhone: !!phone,
        botUsername
      });

      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (!BOT_TOKEN) {
        await releaseLock();
        return new Response(
          JSON.stringify({
            error: 'TELEGRAM_BOT_TOKEN not configured',
            message: 'Please create a bot via @BotFather and add the token'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // CRITICAL: Delete webhook first to prevent conflicts with polling
      // This is a one-time call to ensure no webhook interferes
      try {
        const deleteWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`;
        const webhookResponse = await fetch(deleteWebhookUrl);
        const webhookData = await webhookResponse.json();
        console.log('Webhook deletion result:', webhookData);
      } catch (webhookError) {
        console.warn('Failed to delete webhook (non-critical):', webhookError);
      }

      // Read last processed update offset
      const offsetKey = 'telegram_update_offset';
      const offsetRow = await getSetting(offsetKey);
      const lastOffset = typeof offsetRow?.value?.['offset'] === 'number' ? (offsetRow.value['offset'] as number) : undefined;

      const params = new URLSearchParams();
      if (typeof lastOffset === 'number') params.set('offset', String(lastOffset));
      params.set('limit', '100');
      params.set('timeout', '0');
      // CRITICAL: Include channel_post to receive messages from channels
      params.set('allowed_updates', JSON.stringify(['message', 'channel_post', 'edited_channel_post']));

      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('Telegram response:', JSON.stringify(data, null, 2));

      if (!data.ok) {
        const description: string = data.description || 'Unknown error';
        // Handle 409 gracefully to avoid client 500s
        if (String(data.error_code) === '409' || description.toLowerCase().includes('conflict')) {
          console.warn('Telegram getUpdates conflict detected, another process may be running.');
          await releaseLock();
          return new Response(
            JSON.stringify({ success: false, conflict: true, reason: description }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error('Failed to fetch Telegram updates: ' + description);
      }

      const updates: any[] = data.result || [];
      const signals: any[] = [];

      let maxUpdateId = typeof lastOffset === 'number' ? lastOffset - 1 : -1;

      for (const update of updates) {
        // Track max update_id for next offset
        if (typeof update.update_id === 'number') {
          maxUpdateId = Math.max(maxUpdateId, update.update_id);
        }

        // Try to get message from different sources
        const msg = update.message || update.channel_post || update.edited_channel_post;
        
        if (msg?.text) {
          // Log channel info for debugging
          if (msg.chat?.type === 'channel') {
            console.log('Channel message received:', {
              chatId: msg.chat.id,
              chatTitle: msg.chat.title,
              messageId: msg.message_id,
              text: msg.text.substring(0, 100)
            });
          }

          const signal = parseSignalFromMessage(msg.text as string);
          if (signal) {
            const messageId = msg.message_id as number;
            
            // Create unique identifier combining chat_id and message_id for channels
            const uniqueId = msg.chat?.id ? `${msg.chat.id}_${messageId}` : String(messageId);
            
            // Check if already exists
            const { data: existing } = await supabase
              .from('signals')
              .select('id')
              .eq('telegram_message_id', messageId)
              .limit(1);

            if (!existing || existing.length === 0) {
              const { data: newSignal, error } = await supabase
                .from('signals')
                .insert({
                  asset: signal.asset,
                  timeframe: signal.timeframe,
                  direction: signal.direction,
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
                console.log('New signal inserted from channel:', newSignal[0]);
              }
            } else {
              console.log('Signal already exists, skipping:', messageId);
            }
          } else {
            console.log('No signal pattern found in message:', msg.text.substring(0, 100));
          }
        }
      }

      // Save next offset if we processed any updates
      if (maxUpdateId >= 0) {
        await upsertSetting(offsetKey, { offset: maxUpdateId + 1 });
      }

      await releaseLock();
      return new Response(
        JSON.stringify({
          success: true,
          messagesChecked: updates.length,
          signalsFound: signals.length,
          signals
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      // Always release the lock on error
      await releaseLock();
      throw err;
    }
  } catch (error) {
    console.error('Error in telegram-listener:', error);
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
