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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // For now, we'll use polling approach with Telegram Bot API
    // User can create a bot and forward messages from the trading bot to it
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    if (!BOT_TOKEN) {
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

    // Get updates from Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1&limit=10`
    );
    
    const data = await response.json();
    console.log('Telegram response:', JSON.stringify(data, null, 2));

    if (!data.ok) {
      throw new Error('Failed to fetch Telegram updates: ' + data.description);
    }

    const messages = data.result || [];
    const signals = [];

    for (const update of messages) {
      if (update.message && update.message.text) {
        const signal = parseSignalFromMessage(update.message.text);
        
        if (signal) {
          // Check if signal already exists
          const { data: existing } = await supabase
            .from('signals')
            .select('id')
            .eq('telegram_message_id', update.message.message_id)
            .single();

          if (!existing) {
            // Insert new signal
            const { data: newSignal, error } = await supabase
              .from('signals')
              .insert({
                asset: signal.asset,
                timeframe: signal.timeframe,
                direction: signal.direction,
                raw_message: signal.raw_message,
                telegram_message_id: update.message.message_id,
                status: 'pending',
              })
              .select()
              .single();

            if (error) {
              console.error('Error inserting signal:', error);
            } else {
              signals.push(newSignal);
              console.log('New signal inserted:', newSignal);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messagesChecked: messages.length,
        signalsFound: signals.length,
        signals 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
