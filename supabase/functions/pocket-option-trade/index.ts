import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeRequest {
  signalId: string;
  asset: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  timeframe: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { signalId, asset, direction, amount, timeframe }: TradeRequest = await req.json();

    console.log('Executing trade:', { signalId, asset, direction, amount, timeframe });

    // Get Pocket Option credentials
    const email = Deno.env.get('POCKET_OPTION_EMAIL');
    const password = Deno.env.get('POCKET_OPTION_PASSWORD');

    if (!email || !password) {
      throw new Error('Pocket Option credentials not configured');
    }

    // Step 1: Login to Pocket Option
    const loginResponse = await fetch('https://api.po.trade/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('Pocket Option login failed:', errorText);
      throw new Error('Failed to login to Pocket Option');
    }

    const loginData = await loginResponse.json();
    const { token, ssid } = loginData;

    console.log('Successfully logged in to Pocket Option');

    // Step 2: Parse timeframe (M5 = 5 minutes, H1 = 60 minutes)
    const timeframeMinutes = timeframe.startsWith('M') 
      ? parseInt(timeframe.substring(1)) 
      : parseInt(timeframe.substring(1)) * 60;

    // Step 3: Execute trade
    const tradePayload = {
      asset: asset.replace('/', ''), // EUR/USD -> EURUSD
      amount: amount,
      action: direction.toLowerCase(), // call or put
      time: timeframeMinutes * 60, // convert to seconds
      isDemo: false // Set to true for demo account
    };

    console.log('Trade payload:', tradePayload);

    const tradeResponse = await fetch('https://api.po.trade/api/v1/trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `ssid=${ssid}`
      },
      body: JSON.stringify(tradePayload)
    });

    if (!tradeResponse.ok) {
      const errorText = await tradeResponse.text();
      console.error('Trade execution failed:', errorText);
      throw new Error('Failed to execute trade on Pocket Option');
    }

    const tradeData = await tradeResponse.json();
    console.log('Trade executed successfully:', tradeData);

    // Step 4: Record trade in database
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        signal_id: signalId,
        asset: asset,
        direction: direction,
        amount: amount,
        pocket_trade_id: tradeData.id || tradeData.tradeId,
        expiry_time: new Date(Date.now() + timeframeMinutes * 60 * 1000).toISOString(),
        execution_method: 'auto',
        result: 'pending'
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error recording trade:', tradeError);
      throw tradeError;
    }

    // Step 5: Update signal status
    await supabase
      .from('signals')
      .update({ status: 'executed' })
      .eq('id', signalId);

    return new Response(
      JSON.stringify({
        success: true,
        trade: trade,
        pocketTradeId: tradeData.id || tradeData.tradeId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pocket-option-trade:', error);
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
