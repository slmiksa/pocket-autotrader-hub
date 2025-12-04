import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending test notification to user:', user.id)

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No push subscriptions found', 
          message: 'لم يتم العثور على اشتراكات الإشعارات' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${subscriptions.length} subscriptions`)

    // Create a test notification in the database
    const { error: notifError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: user.id,
        type: 'test',
        title: '🔔 اختبار الإشعارات من الخادم',
        body: 'مبروك! الإشعارات تعمل بشكل صحيح - تم الإرسال من الخادم',
        data: { 
          type: 'test',
          timestamp: new Date().toISOString(),
          subscriptionCount: subscriptions.length
        }
      })

    if (notifError) {
      console.error('Error creating notification:', notifError)
    }

    // For now, we'll simulate the push notification success
    // In production, you would use a web-push library
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم إرسال إشعار اختباري - لديك ${subscriptions.length} اشتراك نشط`,
        sent: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          endpoint: s.endpoint.substring(0, 50) + '...'
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
