import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Parsers (signals & results) ---
function parseSignalFromMessage(text: string) {
  const patterns = [
    /([A-Z]{3}[A-Z]{3}(?:-OTC)?)\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    /([A-Z]{3}\/[A-Z]{3})\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
    /([A-Z]{6}(?:-OTC)?)\s+(M\d+|H\d+)\s+(CALL|PUT)\s+(\d{2}:\d{2}:\d{2})/i,
    /(GOLD|SILVER|XAU|XAG)(?:-OTC)?\s+(M\d+|H\d+)\s+(CALL|PUT)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      return {
        asset: m[1],
        timeframe: m[2],
        direction: m[3].toUpperCase(),
        entry_time: m[4] || null,
        raw_message: text,
      };
    }
  }
  return null;
}

function parseResultFromMessage(text: string): { asset?: string; timeframe?: string; result: 'win'|'win1'|'win2'|'loss' } | null {
  const t = text.toLowerCase();
  const isWin = t.includes('win') || t.includes('✅') || t.includes('ربح');
  const isLoss = t.includes('loss') || t.includes('❌') || t.includes('خسارة');
  if (!isWin && !isLoss) return null;
  let result: 'win'|'win1'|'win2'|'loss' = isLoss ? 'loss' : 'win';
  if (isWin) {
    if (t.includes('win1') || t.includes('¹')) result = 'win1';
    else if (t.includes('win2') || t.includes('²')) result = 'win2';
  }
  const assetMatch = text.match(/([A-Z]{3}[A-Z]{3}(?:-OTC)?|[A-Z]{3}\/[A-Z]{3}|GOLD|SILVER)/i);
  const timeframeMatch = text.match(/(M\d+|H\d+)/i);
  return { result, asset: assetMatch?.[1], timeframe: timeframeMatch?.[1] };
}

async function findBestSignalForResult(supabase: any, parsed: { asset?: string; timeframe?: string }) {
  const twoHoursAgo = new Date(Date.now() - 2*60*60*1000).toISOString();
  let q = supabase.from('signals').select('*').is('result', null).gte('received_at', twoHoursAgo).order('received_at', { ascending: false });
  if (parsed.asset) q = q.ilike('asset', `%${parsed.asset.replace('-OTC','').replace('/','')}%`);
  const { data } = await q.limit(10);
  return data?.[0] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (req.method === 'GET') {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const update = await req.json();
    const msg = update.message || update.channel_post || update.edited_channel_post;
    if (!msg?.text) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Process
    const text: string = msg.text as string;
    const signal = parseSignalFromMessage(text);
    if (signal) {
      // Prevent duplicates by message_id
      const { data: existing } = await supabase.from('signals').select('id').eq('telegram_message_id', msg.message_id).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from('signals').insert({
          asset: signal.asset,
          timeframe: signal.timeframe,
          direction: signal.direction,
          entry_time: signal.entry_time,
          raw_message: signal.raw_message,
          telegram_message_id: msg.message_id,
          status: 'pending'
        });
      }
      return new Response(JSON.stringify({ ok: true, type: 'signal' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resultData = parseResultFromMessage(text);
    if (resultData) {
      const match = await findBestSignalForResult(supabase, resultData);
      if (match) {
        await supabase.from('signals').update({ result: resultData.result }).eq('id', match.id);
      }
      return new Response(JSON.stringify({ ok: true, type: 'result' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, type: 'ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});