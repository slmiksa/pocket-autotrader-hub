import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple Web Push using fetch directly to push services
async function sendWebPushSimple(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    // For FCM and Apple Push, we can use a simpler approach
    // The payload is sent as JSON body
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload
    });
    
    if (response.ok || response.status === 201) {
      console.log(`Push sent to: ${subscription.endpoint.substring(0, 60)}...`);
      return { success: true, statusCode: response.status };
    } else {
      const errorText = await response.text();
      console.warn(`Push response: ${response.status} - ${errorText.substring(0, 100)}`);
      return { success: false, statusCode: response.status, error: errorText };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending push:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("User is not an admin");
    }

    // Get notification details
    const { title, body, targetUserIds } = await req.json();

    if (!title || !body) {
      throw new Error("Title and body are required");
    }

    console.log(`Sending notification: "${title}" to ${targetUserIds?.length > 0 ? targetUserIds.length + ' users' : 'all users'}`);

    // Get subscriptions based on target
    let subscriptionsQuery = supabase.from("push_subscriptions").select("*");
    
    if (targetUserIds && targetUserIds.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in("user_id", targetUserIds);
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} push subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(subscriptions.map(s => s.user_id))];
    
    // Create notifications in database for realtime delivery
    const notifications = uniqueUserIds.map(userId => ({
      user_id: userId,
      title,
      body,
      type: "admin_broadcast",
      data: { 
        sent_at: new Date().toISOString(),
        push_sent: true 
      },
    }));

    const { error: notifError } = await supabase
      .from("user_notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error inserting notifications:", notifError);
    }

    console.log(`Created ${notifications.length} notification records for realtime delivery`);

    // Try to send Web Push notifications
    let pushSuccessCount = 0;
    let pushFailCount = 0;
    
    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: {
        url: '/',
        type: 'admin_broadcast',
        timestamp: Date.now()
      }
    });
    
    // Send push to all subscriptions (try each endpoint)
    for (const sub of subscriptions) {
      const result = await sendWebPushSimple(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
        vapidPublicKey || '',
        vapidPrivateKey || ''
      );
      
      if (result.success) {
        pushSuccessCount++;
      } else {
        pushFailCount++;
        
        // If subscription is expired (410) or invalid (404), remove it
        if (result.statusCode === 410 || result.statusCode === 404) {
          console.log(`Removing expired subscription: ${sub.id}`);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
    
    console.log(`Push results: ${pushSuccessCount} success, ${pushFailCount} failed`);

    // Send email notifications for users who have email notifications enabled
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      // Get profiles with email notifications enabled
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, email_notifications_enabled')
        .in('user_id', uniqueUserIds)
        .eq('email_notifications_enabled', true);

      if (profiles && profiles.length > 0) {
        const emailsToSend = profiles.filter(p => p.email).map(p => p.email);
        
        if (emailsToSend.length > 0) {
          const emailHtml = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ${title}</h1>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <p style="color: #333; font-size: 18px; line-height: 1.8; margin: 0;">${body}</p>
                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://tifue.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    فتح التطبيق
                  </a>
                </div>
              </div>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">© 2024 TIFUE SA. جميع الحقوق محفوظة.</p>
            </div>
          `;

          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: "TIFUE SA <noreply@tifue.com>",
                to: emailsToSend,
                subject: `🔔 ${title}`,
                html: emailHtml,
              }),
            });
            console.log(`Email notifications sent to ${emailsToSend.length} users`);
          } catch (emailError) {
            console.error('Error sending email notifications:', emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: uniqueUserIds.length,
        totalSubscriptions: subscriptions.length,
        uniqueUsers: uniqueUserIds.length,
        pushSuccessCount,
        pushFailCount,
        message: `تم إرسال الإشعار إلى ${uniqueUserIds.length} مستخدم (${pushSuccessCount} اشتراك نجح، ${pushFailCount} فشل)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-admin-push-notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
